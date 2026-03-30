import { useEffect, useRef, useState, useCallback } from 'react'
import { useCognitive } from '../context/CognitiveContext.jsx'

const clamp = (v, min, max) => Math.max(min, Math.min(max, v))

// CDN-based loader for MediaPipe (avoids CJS/ESM interop issues with Vite)
function loadScript(src) {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) {
      resolve()
      return
    }
    const script = document.createElement('script')
    script.src = src
    script.crossOrigin = 'anonymous'
    script.onload = resolve
    script.onerror = reject
    document.head.appendChild(script)
  })
}

function waitForGlobal(name, timeoutMs = 10000) {
  return new Promise((resolve, reject) => {
    if (typeof window[name] === 'function') {
      resolve(window[name])
      return
    }
    const start = Date.now()
    const check = setInterval(() => {
      if (typeof window[name] === 'function') {
        clearInterval(check)
        resolve(window[name])
      } else if (Date.now() - start > timeoutMs) {
        clearInterval(check)
        reject(new Error(`Timeout waiting for ${name} to load`))
      }
    }, 100)
  })
}

async function loadMediaPipe() {
  await loadScript('https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js')
  await loadScript('https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/face_mesh.js')
  const [FaceMesh, Camera] = await Promise.all([
    waitForGlobal('FaceMesh'),
    waitForGlobal('Camera'),
  ])
  return { FaceMesh, Camera }
}

export default function FacialAnalyzer() {
  const { updateCheckIn } = useCognitive()
  const [recording, setRecording] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [done, setDone] = useState(false)
  const [seconds, setSeconds] = useState(0)
  const [cameraReady, setCameraReady] = useState(false)
  const [cameraError, setCameraError] = useState(null)

  // Real-time display metrics
  const [liveMetrics, setLiveMetrics] = useState({
    blinks: 0,
    eyeOpenness: 100,
    stability: 0,
  })

  // Final computed metrics
  const [metrics, setMetrics] = useState({
    blinkCount: 0,
    blinkRate: 0,
    eyeClosureTime: 0,
    stabilityScore: 0,
    facialScore: 0,
  })

  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const cameraRef = useRef(null)
  const faceMeshRef = useRef(null)
  const timerRef = useRef(null)

  // Tracking refs (same logic as facial_analyzer.py)
  const blinkCountRef = useRef(0)
  const prevEyeDistRef = useRef(null)
  const eyeClosedFramesRef = useRef(0)
  const facePositionsRef = useRef([])
  const startTimeRef = useRef(null)
  const totalFramesRef = useRef(0)
  const recordingRef = useRef(false)

  // Keep recordingRef in sync
  useEffect(() => {
    recordingRef.current = recording
  }, [recording])

  // Timer
  useEffect(() => {
    if (!recording) return
    timerRef.current = setInterval(() => setSeconds((s) => s + 1), 1000)
    return () => clearInterval(timerRef.current)
  }, [recording])

  const computeCurrentStability = () => {
    const positions = facePositionsRef.current
    if (positions.length < 2) return 0
    const movements = []
    const recent = positions.slice(-60)
    for (let i = 1; i < recent.length; i++) {
      const dx = recent[i].x - recent[i - 1].x
      const dy = recent[i].y - recent[i - 1].y
      movements.push(Math.sqrt(dx * dx + dy * dy))
    }
    const mean = movements.reduce((a, b) => a + b, 0) / movements.length
    const variance = movements.reduce((a, b) => a + (b - mean) ** 2, 0) / movements.length
    return Math.round(Math.sqrt(variance) * 100) / 100
  }

  const onResults = useCallback((results) => {
    const canvas = canvasRef.current
    const video = videoRef.current
    if (!canvas || !video) return

    const ctx = canvas.getContext('2d')
    canvas.width = video.videoWidth || 640
    canvas.height = video.videoHeight || 480
    const w = canvas.width
    const h = canvas.height

    // Draw video frame
    ctx.save()
    ctx.drawImage(results.image, 0, 0, w, h)

    if (results.multiFaceLandmarks && results.multiFaceLandmarks.length > 0) {
      const landmarks = results.multiFaceLandmarks[0]

      // Draw subtle landmark dots on face outline
      const faceOvalIndices = [10, 338, 297, 332, 284, 251, 389, 356, 454, 323, 361, 288, 397, 365, 379, 378, 400, 377, 152, 148, 176, 149, 150, 136, 172, 58, 132, 93, 234, 127, 162, 21, 54, 103, 67, 109]
      ctx.fillStyle = 'rgba(26, 115, 232, 0.4)'
      faceOvalIndices.forEach((i) => {
        if (landmarks[i]) {
          ctx.beginPath()
          ctx.arc(landmarks[i].x * w, landmarks[i].y * h, 1.5, 0, 2 * Math.PI)
          ctx.fill()
        }
      })

      // Draw eye landmarks
      const eyeIndices = [159, 145, 386, 374, 33, 133, 362, 263]
      ctx.fillStyle = 'rgba(52, 168, 83, 0.6)'
      eyeIndices.forEach((i) => {
        if (landmarks[i]) {
          ctx.beginPath()
          ctx.arc(landmarks[i].x * w, landmarks[i].y * h, 2.5, 0, 2 * Math.PI)
          ctx.fill()
        }
      })

      if (recordingRef.current) {
        totalFramesRef.current++

        // LEFT EYE (same landmarks as facial_analyzer.py)
        const leftEyeTop = landmarks[159]
        const leftEyeBottom = landmarks[145]
        const rightEyeTop = landmarks[386]
        const rightEyeBottom = landmarks[374]

        const leftEyeDist = Math.abs(leftEyeTop.y - leftEyeBottom.y)
        const rightEyeDist = Math.abs(rightEyeTop.y - rightEyeBottom.y)
        const eyeDist = (leftEyeDist + rightEyeDist) / 2

        // Blink detection (same threshold as Python: 0.01)
        if (prevEyeDistRef.current !== null) {
          if (eyeDist < 0.01 && prevEyeDistRef.current >= 0.01) {
            blinkCountRef.current++
          }
        }
        prevEyeDistRef.current = eyeDist

        // Eye closure detection
        if (eyeDist < 0.01) {
          eyeClosedFramesRef.current++
        }

        // Face center for stability (nose = landmark 1)
        const nose = landmarks[1]
        const cx = nose.x * w
        const cy = nose.y * h
        facePositionsRef.current.push({ x: cx, y: cy })

        // Draw nose tracking dot
        ctx.fillStyle = 'rgba(26, 115, 232, 0.8)'
        ctx.beginPath()
        ctx.arc(cx, cy, 4, 0, 2 * Math.PI)
        ctx.fill()

        // Update live metrics
        const opennessPercent = clamp(Math.round((eyeDist / 0.03) * 100), 0, 100)
        setLiveMetrics({
          blinks: blinkCountRef.current,
          eyeOpenness: opennessPercent,
          stability: facePositionsRef.current.length > 1 ? computeCurrentStability() : 0,
        })
      }
    } else if (recordingRef.current) {
      // No face detected overlay
      ctx.fillStyle = 'rgba(234, 67, 53, 0.15)'
      ctx.fillRect(0, 0, w, h)
      ctx.fillStyle = '#EA4335'
      ctx.font = 'bold 16px Inter, sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText('No face detected — please look at the camera', w / 2, h / 2)
    }

    ctx.restore()
  }, [])

  const initFaceMesh = useCallback(async () => {
    try {
      const { FaceMesh, Camera } = await loadMediaPipe()

      const faceMesh = new FaceMesh({
        locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`,
      })

      faceMesh.setOptions({
        maxNumFaces: 1,
        refineLandmarks: true,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5,
      })

      faceMesh.onResults(onResults)
      faceMeshRef.current = faceMesh

      const video = videoRef.current
      if (!video) return

      const camera = new Camera(video, {
        onFrame: async () => {
          if (faceMeshRef.current) {
            await faceMeshRef.current.send({ image: video })
          }
        },
        width: 640,
        height: 480,
      })

      cameraRef.current = camera
      await camera.start()
      setCameraReady(true)
    } catch (err) {
      console.error('Camera/FaceMesh init error:', err)
      setCameraError('Camera access is required for facial analysis. Please allow camera permissions.')
    }
  }, [onResults])

  useEffect(() => {
    initFaceMesh()
    return () => {
      if (cameraRef.current) cameraRef.current.stop()
      if (faceMeshRef.current) faceMeshRef.current.close()
    }
  }, [initFaceMesh])

  const start = () => {
    // Reset all tracking
    blinkCountRef.current = 0
    prevEyeDistRef.current = null
    eyeClosedFramesRef.current = 0
    facePositionsRef.current = []
    totalFramesRef.current = 0
    startTimeRef.current = Date.now()

    setSeconds(0)
    setDone(false)
    setLiveMetrics({ blinks: 0, eyeOpenness: 100, stability: 0 })
    setRecording(true)
  }

  const stop = () => {
    setRecording(false)
    setProcessing(true)

    // Calculate final metrics (same as facial_analyzer.py)
    const duration = (Date.now() - startTimeRef.current) / 1000
    const blinkCount = blinkCountRef.current
    const blinkRate = duration > 0 ? blinkCount / duration : 0

    // Stability calculation (same as Python: std of movements)
    const positions = facePositionsRef.current
    let stability = 0
    if (positions.length > 1) {
      const movements = []
      for (let i = 1; i < positions.length; i++) {
        const dx = positions[i].x - positions[i - 1].x
        const dy = positions[i].y - positions[i - 1].y
        movements.push(Math.sqrt(dx * dx + dy * dy))
      }
      const mean = movements.reduce((a, b) => a + b, 0) / movements.length
      const variance = movements.reduce((a, b) => a + (b - mean) ** 2, 0) / movements.length
      stability = Math.round(Math.sqrt(variance) * 100) / 100
    }

    // Eye closure time (approx 30 fps like Python)
    const eyeClosureTime = Math.round((eyeClosedFramesRef.current / 30) * 100) / 100

    // Compute facial score
    // Penalties based on the Python thresholds
    const blinkPenalty = blinkRate > 0.5 ? Math.min(30, (blinkRate - 0.5) * 40) : 0
    const stabilityPenalty = stability > 5 ? Math.min(30, (stability - 5) * 3) : 0
    const closurePenalty = eyeClosureTime > 2 ? Math.min(20, (eyeClosureTime - 2) * 5) : 0
    const facialScore = clamp(Math.round(100 - blinkPenalty - stabilityPenalty - closurePenalty), 0, 100)

    const finalMetrics = {
      blinkCount,
      blinkRate: Math.round(blinkRate * 100) / 100,
      eyeClosureTime,
      stabilityScore: stability,
      facialScore,
    }

    setTimeout(() => {
      setMetrics(finalMetrics)
      setProcessing(false)
      setDone(true)
      updateCheckIn({
        facialScore,
        facialBlinkRate: finalMetrics.blinkRate,
        facialStabilityScore: stability,
        facialEyeClosureTime: eyeClosureTime,
        facialCompleted: true,
      })
    }, 1500)
  }

  // Interpretation (same logic as Python)
  const getInterpretation = () => {
    if (metrics.blinkRate > 0.5 || metrics.stabilityScore > 5) {
      return { label: 'Possible fatigue / instability detected', color: 'text-warning', icon: '⚠️' }
    }
    return { label: 'Normal facial behavior', color: 'text-success', icon: '✅' }
  }

  if (cameraError) {
    return (
      <section className="max-w-[850px] mx-auto mt-4 pb-12 fade-in px-4">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold tracking-tight text-textPrimary">Facial Expression Analysis</h1>
          <p className="text-textSecondary mt-2">Analyzing blink patterns, eye behavior, and facial stability.</p>
        </div>
        <div className="bg-card rounded-[32px] shadow-card overflow-hidden border border-[#F1F3F4] p-14 text-center">
          <div className="text-5xl mb-6">📷</div>
          <p className="text-alert font-bold text-lg mb-2">Camera Access Required</p>
          <p className="text-textSecondary">{cameraError}</p>
        </div>
      </section>
    )
  }

  return (
    <section className="max-w-[850px] mx-auto mt-4 pb-12 fade-in px-4">
      <div className="text-center mb-10">
        <h1 className="text-4xl font-bold tracking-tight text-textPrimary">Facial Expression Analysis</h1>
        <p className="text-textSecondary mt-2">We analyze blink patterns, eye behavior, and facial stability for neuro-behavioral signals.</p>
      </div>

      {/* Main Video Card */}
      <div className="bg-card rounded-[32px] shadow-card overflow-hidden border border-[#F1F3F4] mb-8">
        <div className="relative bg-[#1a1a2e]">
          {/* Hidden video element for MediaPipe */}
          <video ref={videoRef} className="hidden" playsInline />

          {/* Processed canvas with landmarks */}
          <canvas
            ref={canvasRef}
            className={`w-full aspect-[4/3] object-cover transition-opacity duration-500 ${cameraReady ? 'opacity-100' : 'opacity-0'}`}
          />

          {/* Loading overlay */}
          {!cameraReady && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                <p className="text-white/70 text-sm font-medium">Initializing camera & face mesh...</p>
              </div>
            </div>
          )}

          {/* Recording indicator */}
          {recording && (
            <div className="absolute top-4 left-4 flex items-center gap-2 bg-alert/90 backdrop-blur-sm text-white px-4 py-2 rounded-full">
              <span className="w-2.5 h-2.5 bg-white rounded-full animate-pulse" />
              <span className="text-xs font-bold uppercase tracking-wider">Recording</span>
            </div>
          )}

          {/* Processing overlay */}
          {processing && (
            <div className="absolute inset-0 bg-[#1a1a2e]/80 backdrop-blur-sm flex items-center justify-center">
              <div className="text-center">
                <div className="w-14 h-14 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                <p className="text-white font-bold text-lg">Analyzing facial metrics...</p>
                <p className="text-white/50 text-sm mt-1">Computing blink rate & stability</p>
              </div>
            </div>
          )}

          {/* Live metrics overlays */}
          {recording && (
            <div className="absolute bottom-4 left-4 right-4 flex justify-between">
              <div className="bg-black/50 backdrop-blur-sm rounded-2xl px-4 py-2 text-white">
                <span className="text-[10px] font-bold uppercase tracking-widest text-white/60 block">Blinks</span>
                <span className="text-2xl font-bold">{liveMetrics.blinks}</span>
              </div>
              <div className="bg-black/50 backdrop-blur-sm rounded-2xl px-4 py-2 text-white">
                <span className="text-[10px] font-bold uppercase tracking-widest text-white/60 block">Eye Open</span>
                <span className="text-2xl font-bold">{liveMetrics.eyeOpenness}%</span>
              </div>
              <div className="bg-black/50 backdrop-blur-sm rounded-2xl px-4 py-2 text-white">
                <span className="text-[10px] font-bold uppercase tracking-widest text-white/60 block">Stability</span>
                <span className="text-2xl font-bold">{liveMetrics.stability}</span>
              </div>
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="bg-bg/50 border-t border-[#F1F3F4] p-10">
          <div className="flex flex-col items-center gap-8">
            <div className="flex items-center gap-12">
              <div className="text-center">
                <p className="text-[10px] font-bold text-textSecondary uppercase tracking-widest mb-1">Status</p>
                <p className="text-2xl font-bold text-primary">
                  {recording ? 'Active' : done ? 'Done' : 'Ready'}
                </p>
              </div>
              <button
                onClick={() => (recording ? stop() : start())}
                disabled={processing || !cameraReady}
                className={`w-24 h-24 rounded-full flex items-center justify-center transition-all shadow-xl active:scale-95 ${
                  recording ? 'bg-alert shadow-alert/30' : 'bg-primary shadow-primary/30'
                } ${processing || !cameraReady ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {recording ? (
                  <div className="w-8 h-8 bg-white rounded-lg" />
                ) : (
                  <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M15 12c0 1.654-1.346 3-3 3s-3-1.346-3-3 1.346-3 3-3 3 1.346 3 3zm9-.449s-4.252 8.449-11.985 8.449c-7.18 0-12.015-8.449-12.015-8.449s4.446-7.551 12.015-7.551c7.694 0 11.985 7.551 11.985 7.551zm-7 .449c0-2.757-2.243-5-5-5s-5 2.243-5 5 2.243 5 5 5 5-2.243 5-5z" />
                  </svg>
                )}
              </button>
              <div className="text-center">
                <p className="text-[10px] font-bold text-textSecondary uppercase tracking-widest mb-1">Duration</p>
                <p className="text-2xl font-bold text-textPrimary">{seconds}s</p>
              </div>
            </div>

            <p className="text-xs text-textSecondary text-center max-w-md">
              {!recording && !done
                ? 'Position your face clearly in the camera. Press the button to start recording.'
                : recording
                  ? 'Look at the camera steadily. We\'re tracking blink patterns and facial stability.'
                  : ''}
            </p>
          </div>
        </div>
      </div>

      {/* Results Cards */}
      {done && (
        <>
          {/* Interpretation Banner */}
          <div className={`mb-8 p-6 rounded-[24px] border ${
            getInterpretation().color === 'text-success'
              ? 'bg-success/5 border-success/20'
              : 'bg-warning/5 border-warning/20'
          } flex items-center gap-4 slide-up`}>
            <span className="text-3xl">{getInterpretation().icon}</span>
            <div>
              <p className={`font-bold text-lg ${getInterpretation().color}`}>{getInterpretation().label}</p>
              <p className="text-textSecondary text-sm">
                Based on {seconds}s of facial monitoring · {totalFramesRef.current} frames analyzed
              </p>
            </div>
          </div>

          {/* Metric Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 slide-up">
            <div className="bg-card p-6 rounded-[24px] shadow-card border-t-4 border-primary">
              <h4 className="text-xs font-bold text-textSecondary uppercase mb-2">Blink Count</h4>
              <div className="text-4xl font-bold text-textPrimary">{metrics.blinkCount}</div>
              <p className="text-xs text-textSecondary mt-2">Rate: {metrics.blinkRate}/sec</p>
            </div>
            <div className="bg-card p-6 rounded-[24px] shadow-card border-t-4 border-success">
              <h4 className="text-xs font-bold text-textSecondary uppercase mb-2">Eye Closure</h4>
              <div className="text-4xl font-bold text-textPrimary">{metrics.eyeClosureTime}s</div>
              <p className="text-xs text-success mt-2">Total closed duration</p>
            </div>
            <div className="bg-card p-6 rounded-[24px] shadow-card border-t-4 border-warning">
              <h4 className="text-xs font-bold text-textSecondary uppercase mb-2">Face Stability</h4>
              <div className="text-4xl font-bold text-textPrimary">{metrics.stabilityScore}</div>
              <p className="text-xs text-textSecondary mt-2">Movement variance score</p>
            </div>
            <div className="bg-card p-6 rounded-[24px] shadow-card border-t-4 border-[#8B5CF6]">
              <h4 className="text-xs font-bold text-textSecondary uppercase mb-2">Facial Score</h4>
              <div className="text-4xl font-bold text-[#8B5CF6]">{metrics.facialScore}</div>
              <p className="text-xs text-textSecondary mt-2">Composite assessment</p>
            </div>
          </div>
        </>
      )}
    </section>
  )
}
