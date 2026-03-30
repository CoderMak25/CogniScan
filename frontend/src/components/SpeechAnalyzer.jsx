import { useEffect, useRef, useState, useMemo } from 'react'
import { useCognitive } from '../context/CognitiveContext.jsx'

const PASSAGES = [
  "The quick brown fox jumps over the lazy dog. Rainy days are perfect for reading a good book by the fireplace.",
  "Technological advancement continues to reshape our daily lives, from how we communicate to how we solve complex problems.",
  "A quiet walk in the forest can significantly reduce stress and improve mental clarity after a long week of work.",
  "Exploring the depths of the ocean reveals a world of mysterious creatures and unexplored landscapes hidden from view.",
  "Innovative solutions are required to address the environmental challenges facing our planet in the coming decades."
]

export default function SpeechAnalyzer() {
  const { updateCheckIn } = useCognitive()
  const [recording, setRecording] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [done, setDone] = useState(false)
  const [seconds, setSeconds] = useState(0)
  const [transcript, setTranscript] = useState('')
  const [passage, setPassage] = useState(PASSAGES[0])
  const [readIndices, setReadIndices] = useState(new Set())
  
  // Real-time Metrics
  const [metrics, setMetrics] = useState({
    wpm: 0,
    pauses: 0,
    accuracy: 100,
    avgWordDuration: 0,
    pauseFrequency: 0,
    mistakes: []
  })

  const streamRef = useRef(null)
  const ctxRef = useRef(null)
  const analyserRef = useRef(null)
  const rafRef = useRef(null)
  const canvasRef = useRef(null)
  const recognitionRef = useRef(null)
  
  const speechEvents = useRef([])
  const lastSpeechTime = useRef(null)

  useEffect(() => {
    setPassage(PASSAGES[Math.floor(Math.random() * PASSAGES.length)])
  }, [])

  useEffect(() => {
    if (!recording) return
    const timer = setInterval(() => setSeconds((s) => s + 1), 1000)
    return () => clearInterval(timer)
  }, [recording])

  // Persistent word detection logic
  useEffect(() => {
    if (!recording) return
    const tWords = transcript.toLowerCase().replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, "").split(/\s+/).filter(w => w.length > 0)
    const tWordCounts = tWords.reduce((acc, w) => {
      acc[w] = (acc[w] || 0) + 1
      return acc
    }, {})

    const newIndices = new Set(readIndices)
    let changed = false
    
    passage.split(/\s+/).forEach((word, i) => {
      const cleanWord = word.toLowerCase().replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, "")
      // Consume words already in readIndices first
      if (newIndices.has(i)) {
        if (tWordCounts[cleanWord] > 0) tWordCounts[cleanWord]--
        return
      }
      // Then check for new matches
      if (tWordCounts[cleanWord] > 0) {
        newIndices.add(i)
        tWordCounts[cleanWord]--
        changed = true
      }
    })

    if (changed) setReadIndices(newIndices)
  }, [transcript, passage, recording])

  const analyzedPassage = useMemo(() => {
    return passage.split(/\s+/).map((word, i) => ({
      word,
      isRead: readIndices.has(i)
    }))
  }, [passage, readIndices])

  const draw = () => {
    const canvas = canvasRef.current
    const analyser = analyserRef.current
    if (!canvas || !analyser) return
    const ctx = canvas.getContext('2d')
    const w = canvas.width
    const h = canvas.height
    const data = new Uint8Array(analyser.frequencyBinCount)
    analyser.getByteFrequencyData(data)
    ctx.clearRect(0, 0, w, h)
    const bars = 60
    const barWidth = (w / bars) - 2
    ctx.fillStyle = '#1A73E8'
    for (let i = 0; i < bars; i++) {
      const value = data[i * 2] / 255
      const barHeight = Math.max(4, value * h * 0.8)
      ctx.fillRect(i * (barWidth + 2), (h - barHeight) / 2, barWidth, barHeight)
    }
    rafRef.current = requestAnimationFrame(draw)
  }

  const start = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)()
      ctxRef.current = audioCtx
      const source = audioCtx.createMediaStreamSource(stream)
      const analyser = audioCtx.createAnalyser()
      analyser.fftSize = 256
      analyserRef.current = analyser
      source.connect(analyser)
      speechEvents.current = []
      lastSpeechTime.current = Date.now()
      
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition()
        recognition.continuous = true
        recognition.interimResults = true
        recognition.lang = 'en-US'
        recognition.onresult = (event) => {
          const now = Date.now()
          let currentTranscript = ''
          for (let i = 0; i < event.results.length; i++) {
            currentTranscript += event.results[i][0].transcript
          }
          setTranscript(currentTranscript)
          if (lastSpeechTime.current && now - lastSpeechTime.current > 1200) {
            speechEvents.current.push({ type: 'pause', duration: now - lastSpeechTime.current })
          }
          lastSpeechTime.current = now
        }
        recognition.start()
        recognitionRef.current = recognition
      }
      setSeconds(0)
      setTranscript('')
      setReadIndices(new Set())
      setRecording(true)
      setDone(false)
      draw()
    } catch (err) {
      alert('Microphone access is required.')
    }
  }

  const calculateMetrics = () => {
    const totalWords = transcript.split(/\s+/).filter(w => w.length > 0).length
    const durationMin = seconds / 60
    const wpm = durationMin > 0 ? Math.round(totalWords / durationMin) : 0
    const pauses = speechEvents.current.filter(e => e.type === 'pause').length
    const pauseDurationTotal = speechEvents.current.reduce((acc, e) => acc + (e.duration || 0), 0) / 1000
    
    const speakingSeconds = Math.max(1, seconds - pauseDurationTotal)
    const avgWordDuration = totalWords > 0 ? (speakingSeconds / totalWords).toFixed(2) : 0
    const pauseFrequency = seconds > 0 ? (pauses / (seconds / 60)).toFixed(1) : 0
    
    const accuracy = Math.round((readIndices.size / passage.split(/\s+/).length) * 100)
    const mistakes = passage.split(/\s+/).filter((_, i) => !readIndices.has(i))

    setMetrics({ wpm, pauses, accuracy, mistakes, avgWordDuration, pauseFrequency })
    return { wpm, pauses, accuracy, mistakes, avgWordDuration, pauseFrequency }
  }

  const stop = async () => {
    setRecording(false)
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
    if (recognitionRef.current) recognitionRef.current.stop()
    if (streamRef.current) streamRef.current.getTracks().forEach((t) => t.stop())
    if (ctxRef.current && ctxRef.current.state !== 'closed') await ctxRef.current.close()

    setProcessing(true)
    const final = calculateMetrics()
    setTimeout(() => {
      setProcessing(false)
      setDone(true)
      updateCheckIn({ 
        speechScore: Math.round(final.accuracy * 0.6 + Math.max(0, 100 - (final.pauseFrequency * 5)) * 0.4),
        wpm: final.wpm,
        pauses: final.pauses,
        avgWordDuration: final.avgWordDuration,
        pauseFrequency: final.pauseFrequency,
        speechCompleted: true 
      })
    }, 1500)
  }

  return (
    <section className="max-w-[850px] mx-auto mt-4 pb-12 fade-in px-4">
      <div className="text-center mb-10">
        <h1 className="text-4xl font-bold tracking-tight text-textPrimary">Acoustic Biomarker Analysis</h1>
        <p className="text-textSecondary mt-2">Speak clearly. We analyze verbal fluency and cognitive load.</p>
      </div>

      <div className="bg-card rounded-[32px] shadow-card overflow-hidden border border-[#F1F3F4] mb-8">
        <div className="p-10 md:p-14 bg-white">
          <div className="flex flex-wrap justify-center gap-x-2 gap-y-3 leading-relaxed text-xl md:text-2xl text-center">
            {analyzedPassage.map((item, i) => (
              <span 
                key={i} 
                className={`transition-colors duration-300 ${
                  item.isRead ? 'text-primary font-medium' : 'text-baseline/40'
                }`}
              >
                {item.word}
              </span>
            ))}
          </div>
        </div>
        
        <div className="bg-bg/50 border-t border-[#F1F3F4] p-10">
          <div className="flex flex-col items-center gap-8">
            <div className="flex items-center gap-12">
              <div className="text-center">
                <p className="text-[10px] font-bold text-textSecondary uppercase tracking-widest mb-1">Accuracy</p>
                <p className="text-2xl font-bold text-primary">{recording ? Math.round((analyzedPassage.filter(w=>w.isRead).length / analyzedPassage.length)*100) : '--'}%</p>
              </div>
              <button
                onClick={() => (recording ? stop() : start())}
                disabled={processing}
                className={`w-24 h-24 rounded-full flex items-center justify-center transition-all shadow-xl active:scale-95 ${
                  recording ? 'bg-alert shadow-alert/30' : 'bg-primary shadow-primary/30'
                } ${processing ? 'opacity-50' : ''}`}
              >
                {recording ? <div className="w-8 h-8 bg-white rounded-lg" /> : <div className="w-8 h-8 bg-white rounded-full translate-x-0.5" />}
              </button>
              <div className="text-center">
                <p className="text-[10px] font-bold text-textSecondary uppercase tracking-widest mb-1">Seconds</p>
                <p className="text-2xl font-bold text-textPrimary">{seconds}s</p>
              </div>
            </div>

            <canvas ref={canvasRef} width={600} height={60} className={`w-full h-16 bg-white rounded-2xl border border-[#F1F3F4] transition-all ${recording ? 'opacity-100 scale-100' : 'opacity-20 scale-95'}`} />
          </div>
        </div>
      </div>

      {done && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 slide-up">
          <div className="bg-card p-6 rounded-[24px] shadow-card border-t-4 border-primary">
            <h4 className="text-xs font-bold text-textSecondary uppercase mb-2">Fluency (WPM)</h4>
            <div className="text-4xl font-bold text-textPrimary">{metrics.wpm}</div>
            <p className="text-xs text-textSecondary mt-2">Optimal range: 130-160</p>
          </div>
          <div className="bg-card p-6 rounded-[24px] shadow-card border-t-4 border-success">
            <h4 className="text-xs font-bold text-textSecondary uppercase mb-2">Avg Word Duration</h4>
            <div className="text-4xl font-bold text-textPrimary">{metrics.avgWordDuration}s</div>
            <p className="text-xs text-success mt-2">Articulation speed</p>
          </div>
          <div className="bg-card p-6 rounded-[24px] shadow-card border-t-4 border-warning">
            <h4 className="text-xs font-bold text-textSecondary uppercase mb-2">Pause Frequency</h4>
            <div className="text-4xl font-bold text-textPrimary">{metrics.pauseFrequency}</div>
            <p className="text-xs text-textSecondary mt-2">Pauses per minute</p>
          </div>
          <div className="bg-card p-6 rounded-[24px] shadow-card border-t-4 border-alert">
            <h4 className="text-xs font-bold text-textSecondary uppercase mb-2">Accuracy</h4>
            <div className="text-4xl font-bold text-textPrimary">{metrics.accuracy}%</div>
            <p className="text-xs text-textSecondary mt-2 truncate">Speech mapping score</p>
          </div>
        </div>
      )}
    </section>
  )
}
