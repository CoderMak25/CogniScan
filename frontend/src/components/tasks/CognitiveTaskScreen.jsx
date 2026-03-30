import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCognitive } from '../../context/CognitiveContext.jsx'
import TaskWordMemory from './TaskWordMemory.jsx'
import TaskReactionTime from './TaskReactionTime.jsx'
import TaskPatternMemory from './TaskPatternMemory.jsx'
import SpeechAnalyzer from '../SpeechAnalyzer.jsx'

const WORDS = ['APPLE', 'RIVER', 'CLOCK', 'BRIDGE', 'FOREST']

export default function CognitiveTaskScreen() {
  const navigate = useNavigate()
  const { updateCheckIn, unlockedTasks } = useCognitive()
  const [step, setStep] = useState(0) // Start at Selection Hub

  // Task 1: Word Memory State
  const [memoryStarted, setMemoryStarted] = useState(false)
  const [memoryDone, setMemoryDone] = useState(false)
  const [countdown, setCountdown] = useState(5)
  const [answers, setAnswers] = useState(Array(5).fill(''))
  const [memoryScore, setMemoryScore] = useState(null)

  // Task 2: Reaction Time State
  const [t2Round, setT2Round] = useState(0)
  const [t2State, setT2State] = useState('idle')
  const [t2Times, setT2Times] = useState([])
  const [t2ShownText, setT2ShownText] = useState('Click Start')
  const t2StartRef = useRef(0)
  const t2TimeoutRef = useRef(null)

  // Task 3: Pattern Memory State
  const [t3Round, setT3Round] = useState(0)
  const [t3Score, setT3Score] = useState(0)
  const [seq, setSeq] = useState([])
  const [userSeq, setUserSeq] = useState([])
  const [activeTile, setActiveTile] = useState(-1)
  const [playable, setPlayable] = useState(false)
  const [isWrong, setIsWrong] = useState(false)

  useEffect(() => {
    if (!memoryStarted || memoryDone) return
    if (countdown <= 0) {
      setMemoryDone(true)
      return
    }
    const timer = setTimeout(() => setCountdown((v) => v - 1), 1000)
    return () => clearTimeout(timer)
  }, [memoryStarted, memoryDone, countdown])

  useEffect(() => () => t2TimeoutRef.current && clearTimeout(t2TimeoutRef.current), [])

  const avgRt = useMemo(
    () => (t2Times.length ? Math.round(t2Times.reduce((a, b) => a + b, 0) / t2Times.length) : 350),
    [t2Times],
  )

  const checkMemory = () => {
    const score = answers.reduce((acc, value) => 
      (WORDS.includes(value.trim().toUpperCase()) ? acc + 1 : acc), 0)
    setMemoryScore(score)
    updateCheckIn({ memoryScore: score * 20 })
  }

  const runReactionRound = () => {
    if (t2Round >= 5) return
    setT2State('waiting')
    setT2ShownText('Get Ready...')
    const delay = Math.random() * 2500 + 1000
    t2TimeoutRef.current = setTimeout(() => {
      setT2State('ready')
      setT2ShownText('TAP!')
      t2StartRef.current = Date.now()
    }, delay)
  }

  const handleReactionTap = () => {
    if (t2State === 'waiting') {
      clearTimeout(t2TimeoutRef.current)
      setT2ShownText('Too early!')
      setTimeout(runReactionRound, 1200)
      return
    }
    if (t2State !== 'ready') return
    const rt = Date.now() - t2StartRef.current
    const newTimes = [...t2Times, rt]
    setT2Times(newTimes)
    setT2Round((r) => r + 1)
    setT2ShownText(`${rt}ms`)
    
    if (t2Round + 1 < 5) {
      setTimeout(runReactionRound, 1000)
    } else {
      setTimeout(() => {
        setT2State('finished')
        updateCheckIn({ reactionTimes: newTimes })
      }, 1000)
    }
  }

  const startSeqRound = async () => {
    if (t3Round >= 3) return
    const lengths = [4, 5, 6]
    const nextSeq = Array.from({ length: lengths[t3Round] }, () => Math.floor(Math.random() * 4))
    setSeq(nextSeq)
    setUserSeq([])
    setPlayable(false)
    setIsWrong(false)
    await new Promise((r) => setTimeout(r, 600))
    for (const idx of nextSeq) {
      setActiveTile(idx)
      await new Promise((r) => setTimeout(r, 400))
      setActiveTile(-1)
      await new Promise((r) => setTimeout(r, 200))
    }
    setPlayable(true)
  }

  const handleSeqClick = async (idx) => {
    if (!playable || isWrong) return
    const nextUserSeq = [...userSeq, idx]
    setUserSeq(nextUserSeq)
    setActiveTile(idx)
    setTimeout(() => setActiveTile(-1), 200)
    
    const currIndex = nextUserSeq.length - 1
    if (nextUserSeq[currIndex] !== seq[currIndex]) {
      setPlayable(false)
      setIsWrong(true)
      const nextRound = t3Round + 1
      setT3Round(nextRound)
      
      setTimeout(() => {
        if (nextRound < 3) {
          startSeqRound()
        } else {
          updateCheckIn({ patternScore: Math.round((t3Score / 3) * 100) })
        }
      }, 1200)
      return
    }
    
    if (nextUserSeq.length === seq.length) {
      setPlayable(false)
      const newScore = t3Score + 1
      setT3Score(newScore)
      const nextRound = t3Round + 1
      setT3Round(nextRound)
      if (nextRound < 3) {
        setTimeout(startSeqRound, 1500)
      } else {
        updateCheckIn({ patternScore: Math.round((newScore / 3) * 100) })
      }
    }
  }

  return (
    <section className="max-w-[1000px] mx-auto py-8">
      {step === 0 ? (
        <div className="fade-in">
          <div className="text-center mb-16">
            <h1 className="text-4xl font-black text-textPrimary mb-4 uppercase tracking-tighter">Diagnostic Selection</h1>
            <p className="text-textSecondary max-w-[500px] mx-auto">Choose a cognitive assessment category to begin your calibration.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <button 
              onClick={() => setStep(1)}
              className="group bg-card p-10 rounded-[40px] border border-[#F1F3F4] hover:border-primary hover:shadow-2xl transition-all text-left"
            >
              <div className="bg-primary/10 w-16 h-16 rounded-[20px] flex items-center justify-center mb-8 border border-primary/20 group-hover:scale-110 transition-transform">
                <span className="text-3xl">📋</span>
              </div>
              <h2 className="text-2xl font-bold text-textPrimary mb-3 group-hover:text-primary transition-colors">Daily Baseline</h2>
              <p className="text-sm text-textSecondary leading-relaxed mb-8">A comprehensive 4-step assessment of memory, motor speed, pattern recognition, and speech acoustics.</p>
              <div className="flex items-center text-primary font-bold gap-2 text-sm">
                Start Session <span>→</span>
              </div>
            </button>

            <div className="bg-card p-10 rounded-[40px] border border-[#F1F3F4] flex flex-col">
              <div className="bg-[#FBBC05]/10 w-16 h-16 rounded-[20px] flex items-center justify-center mb-8 border border-[#FBBC05]/20">
                <span className="text-3xl">🔬</span>
              </div>
              <h2 className="text-2xl font-bold text-textPrimary mb-3">Diagnostic Suite</h2>
              <p className="text-sm text-textSecondary leading-relaxed mb-10">Targeted clinical tests for specific cognitive domains like Executive Function and Spatial Planning.</p>
              
              <div className="space-y-3 mt-auto">
                <button 
                  onClick={() => navigate('/tasks/stroop')}
                  className="w-full bg-bg py-4 px-6 rounded-[20px] border border-[#F1F3F4] flex items-center justify-between hover:border-primary transition-all group/item"
                >
                  <span className="font-bold text-textPrimary group-hover/item:text-primary transition-colors">Stroop Test</span>
                  <span className="text-[10px] bg-success/10 text-success px-2 py-0.5 rounded-full font-bold uppercase">Ready</span>
                </button>
                
                {unlockedTasks.includes('number-span') ? (
                  <button 
                    onClick={() => navigate('/tasks/number-span')}
                    className="w-full bg-bg py-4 px-6 rounded-[20px] border border-[#F1F3F4] flex items-center justify-between hover:border-primary transition-all group/item fade-in"
                  >
                    <span className="font-bold text-textPrimary group-hover/item:text-primary transition-colors">Number Span</span>
                    <span className="text-[10px] bg-success/10 text-success px-2 py-0.5 rounded-full font-bold uppercase tracking-widest">Unlocked</span>
                  </button>
                ) : (
                  <div className="w-full bg-bg py-4 px-6 rounded-[20px] border border-[#F1F3F4] flex items-center justify-between opacity-40 grayscale-[0.5]">
                    <span className="font-bold text-textPrimary">Number Span</span>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] bg-baseline text-white px-2 py-0.5 rounded-full font-bold uppercase">Locked</span>
                      <span className="text-[9px] font-bold text-textSecondary italic">Complete Stroop</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* Stepper */}
          <div className="flex items-center justify-between mb-12 relative px-10 max-w-[800px] mx-auto">
            <div className="absolute left-20 right-20 top-5 h-[2px] bg-baseline -z-10">
              <div 
                className="h-full bg-primary transition-all duration-500" 
                style={{ width: `${((step - 1) / 3) * 100}%` }}
              />
            </div>
            
            {[
              { id: 1, label: 'Memory' },
              { id: 2, label: 'Motor' },
              { id: 3, label: 'Pattern' },
              { id: 4, label: 'Speech' }
            ].map((s) => (
              <div key={s.id} className="flex flex-col items-center gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300 border-2 ${
                  step >= s.id ? 'bg-primary border-primary text-white shadow-lg shadow-primary/20' : 'bg-white border-baseline text-baseline'
                }`}>
                  {step > s.id ? '✓' : s.id}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      <div className="slide-up">
        {step === 1 && (
          <TaskWordMemory
            words={WORDS}
            started={memoryStarted}
            done={memoryDone}
            countdown={countdown}
            answers={answers}
            setAnswers={setAnswers}
            score={memoryScore}
            onStart={() => setMemoryStarted(true)}
            onCheck={checkMemory}
            onNext={() => setStep(2)}
          />
        )}

        {step === 2 && (
          <TaskReactionTime
            round={t2Round}
            state={t2State}
            shownText={t2ShownText}
            onTap={handleReactionTap}
            onStart={runReactionRound}
            onNext={() => setStep(3)}
            avgRt={avgRt}
          />
        )}

        {step === 3 && (
          <TaskPatternMemory
            round={t3Round}
            active={activeTile}
            wrongMove={isWrong}
            sequenceStarted={seq.length > 0}
            onTileClick={handleSeqClick}
            onStart={startSeqRound}
            onFinish={() => setStep(4)}
            score={t3Score}
          />
        )}

        {step === 4 && (
          <div className="bg-card rounded-[32px] shadow-card p-10 border border-[#F1F3F4]">
            <SpeechAnalyzer />
            <div className="mt-10 flex justify-center border-t border-[#F1F3F4] pt-8">
              <button
                onClick={() => navigate('/results')}
                className="px-10 py-5 bg-primary text-white rounded-[20px] font-bold text-lg hover:bg-[#155DB1] transition-all shadow-lg shadow-primary/25"
              >
                View Final Results
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
