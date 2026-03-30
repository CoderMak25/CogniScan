import { createContext, useCallback, useContext, useMemo, useState } from 'react'

const CognitiveContext = createContext(null)
const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000'
const MOCK_USER_ID = '000000000000000000000001'

export function CognitiveProvider({ children }) {
  const [latestScore, setLatestScore] = useState(null)
  const [history, setHistory] = useState([])
  const [alertEnabled, setAlertEnabled] = useState(false)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)

  const [checkInData, setCheckInData] = useState({
    memoryScore: 0,
    reactionTimes: [],
    patternScore: 0,
    speechScore: 0,
    stroopScore: 0,
    typingScore: 0,
    wpm: 0,
    pauses: 0,
    avgWordDuration: 0,
    pauseFrequency: 0,
    stroopAccuracy: 0,
    stroopAvgMs: 0,
    speechCompleted: false,
    totalScore: 0,
  })

  const updateCheckIn = useCallback((updates) => {
    setCheckInData((prev) => ({ ...prev, ...updates }))
  }, [])

  const resetCheckIn = useCallback(() => {
    setCheckInData({
      memoryScore: 0,
      reactionTimes: [],
      patternScore: 0,
      speechScore: 0,
      stroopScore: 0,
      typingScore: 0,
      wpm: 0,
      pauses: 0,
      avgWordDuration: 0,
      pauseFrequency: 0,
      stroopAccuracy: 0,
      stroopAvgMs: 0,
      speechCompleted: false,
      totalScore: 0,
    })
  }, [])

  const fetchHistory = useCallback(async (uid = MOCK_USER_ID) => {
    try {
      const res = await fetch(`${API_BASE}/api/scores/${uid}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || 'Failed to fetch history')
      const sorted = (data.history || []).sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
      setHistory(sorted)
      if (sorted.length > 0) setLatestScore(sorted[sorted.length - 1])
      return sorted
    } catch (err) {
      console.error('History fetch error:', err)
      return []
    }
  }, [])

  const saveCheckIn = useCallback(async () => {
    const avgReactionMs = checkInData.reactionTimes.length 
      ? checkInData.reactionTimes.reduce((a, b) => a + b, 0) / checkInData.reactionTimes.length 
      : 0

    const tasks = [
      { val: checkInData.memoryScore, count: 1 },
      { val: Math.max(0, 100 - (avgReactionMs / 10)), count: 1 },
      { val: checkInData.patternScore, count: 1 },
      { val: checkInData.speechScore, count: checkInData.speechScore > 0 ? 1 : 0 },
      { val: checkInData.stroopScore, count: checkInData.stroopScore > 0 ? 1 : 0 },
      { val: checkInData.typingScore, count: checkInData.typingScore > 0 ? 1 : 0 }
    ]
    const active = tasks.filter(t => t.count > 0)
    const totalScore = Math.round(active.reduce((s, t) => s + t.val, 0) / active.length)

    const payload = {
      userId: MOCK_USER_ID,
      taskScores: {
        memory: checkInData.memoryScore,
        reaction: Math.round(Math.max(0, 100 - (avgReactionMs / 10))),
        sequence: checkInData.patternScore,
        speech: checkInData.speechScore,
        stroop: checkInData.stroopScore,
        typing: checkInData.typingScore
      },
      rawMetrics: {
        memoryRecallCount: Math.round(checkInData.memoryScore / 20),
        reactionAvgMs: Math.round(avgReactionMs),
        sequenceRoundsCorrect: Math.round(checkInData.patternScore / 33),
        speechFluencyScore: checkInData.speechScore,
        avgWordDuration: checkInData.avgWordDuration,
        pauseFrequency: checkInData.pauseFrequency,
        stroopAccuracy: checkInData.stroopAccuracy,
        stroopAvgMs: checkInData.stroopAvgMs,
        typingWpm: checkInData.typingWpm || 0,
        typingAccuracy: checkInData.typingAccuracy || 0,
        typingErrors: checkInData.typingErrors || 0
      },
      totalScore
    }

    try {
      const res = await fetch(`${API_BASE}/api/scores`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || 'Failed to save score')
      setLatestScore(data.score)
      await fetchHistory(MOCK_USER_ID)
      return data.score
    } catch (err) {
      console.error('Save error:', err)
      throw err
    }
  }, [checkInData, fetchHistory])

  const saveSpecializedCheckIn = useCallback(async (taskType, score, metrics) => {
    const taskTypeMap = {
      stroop: 'stroop',
      'number-span': 'numberSpan',
      typing: 'typing',
    }
    const domain = taskTypeMap[taskType] || taskType
    const updates = {
      [`${domain}Score`]: score,
      typingWpm: metrics?.wpm || checkInData.typingWpm || 0,
      typingAccuracy: metrics?.accuracy || checkInData.typingAccuracy || 0,
      typingErrors: metrics?.errors || checkInData.typingErrors || 0,
      ...metrics,
    }
    updateCheckIn(updates)

    const currentTaskScores = Object.keys(checkInData)
      .filter(k => k.endsWith('Score'))
      .reduce((obj, key) => {
        const domain = key.replace('Score', '')
        obj[domain] = checkInData[key]
        return obj
      }, {})

    const payload = {
      userId: MOCK_USER_ID,
      taskScores: { ...currentTaskScores, [domain]: score },
      rawMetrics: { ...checkInData, ...metrics },
      timestamp: new Date()
    }

    try {
      const res = await fetch(`${API_BASE}/api/scores`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || 'Failed to save diagnostic')
      setLatestScore(data.score)
      await fetchHistory(MOCK_USER_ID)
      return data.score
    } catch (err) {
      console.error('Diagnostic save error:', err)
      const errorMsg = err.message || 'Unknown save error'
      throw new Error(`Failed to save assessment: ${errorMsg}`)
    }
  }, [checkInData, fetchHistory, updateCheckIn])

  const triggerAlert = useCallback(async (payload) => {
    const res = await fetch(`${API_BASE}/api/alerts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.message || 'Failed to trigger alert')
    return data
  }, [])

  const [unlockedTasks, setUnlockedTasks] = useState(['stroop']) // Stroop is always unlocked

  const unlockTask = useCallback((taskId) => {
    setUnlockedTasks((prev) => prev.includes(taskId) ? prev : [...prev, taskId])
  }, [])

  // High-fidelity Mock Data for Diagnostics (when real data is skipped)
  const mockDiagnosticData = useMemo(() => ({
    stroop: { score: 88, accuracy: 94, avgMs: 412 },
    numberSpan: { score: 72, accuracy: 80, avgMs: 1240 },
    pathNav: { score: 65, accuracy: 70, avgMs: 5100 }
  }), [])

  const value = useMemo(() => ({
    latestScore, history, alertEnabled, setAlertEnabled,
    isDrawerOpen, setIsDrawerOpen, checkInData, updateCheckIn,
    resetCheckIn, saveCheckIn, saveSpecializedCheckIn, fetchHistory, triggerAlert,
    unlockedTasks, unlockTask, mockDiagnosticData
  }), [
    latestScore, history, alertEnabled, isDrawerOpen, checkInData,
    updateCheckIn, resetCheckIn, saveCheckIn, saveSpecializedCheckIn, fetchHistory, triggerAlert,
    unlockedTasks, unlockTask, mockDiagnosticData
  ])

  return <CognitiveContext.Provider value={value}>{children}</CognitiveContext.Provider>
}

export function useCognitive() {
  const context = useContext(CognitiveContext)
  if (!context) throw new Error('useCognitive must be used inside CognitiveProvider')
  return context
}
