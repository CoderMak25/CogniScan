import { createContext, useCallback, useContext, useMemo, useState } from 'react'

const CognitiveContext = createContext(null)
const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000'
// Mock User ID for demo/dev
const MOCK_USER_ID = '000000000000000000000001'

export function CognitiveProvider({ children }) {
  const [latestScore, setLatestScore] = useState(null)
  const [history, setHistory] = useState([])
  const [alertEnabled, setAlertEnabled] = useState(false)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)

  // Current Check-in State
  const [checkInData, setCheckInData] = useState({
    memoryScore: 0,
    reactionTimes: [],
    patternScore: 0,
    speechScore: 0,
    wpm: 0,
    pauses: 0,
    avgWordDuration: 0,
    pauseFrequency: 0,
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
      wpm: 0,
      pauses: 0,
      avgWordDuration: 0,
      pauseFrequency: 0,
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
      if (sorted.length > 0) {
        setLatestScore(sorted[sorted.length - 1])
      }
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

    const totalScore = Math.round(
      checkInData.memoryScore * 0.25 +
      (Math.max(0, 100 - (avgReactionMs / 10))) * 0.25 +
      checkInData.patternScore * 0.25 +
      checkInData.speechScore * 0.25
    )

    const payload = {
      userId: MOCK_USER_ID,
      taskScores: {
        memory: checkInData.memoryScore,
        reaction: Math.round(Math.max(0, 100 - (avgReactionMs / 10))),
        sequence: checkInData.patternScore,
        speech: checkInData.speechScore
      },
      rawMetrics: {
        memoryRecallCount: Math.round(checkInData.memoryScore / 20),
        reactionAvgMs: Math.round(avgReactionMs),
        sequenceRoundsCorrect: Math.round(checkInData.patternScore / 33),
        speechFluencyScore: checkInData.speechScore,
        avgWordDuration: checkInData.avgWordDuration,
        pauseFrequency: checkInData.pauseFrequency
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
      await fetchHistory(MOCK_USER_ID) // Refresh history
      return data.score
    } catch (err) {
      console.error('Save error:', err)
      throw err
    }
  }, [checkInData, fetchHistory])

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

  const value = useMemo(
    () => ({
      latestScore,
      history,
      alertEnabled,
      setAlertEnabled,
      isDrawerOpen,
      setIsDrawerOpen,
      checkInData,
      updateCheckIn,
      resetCheckIn,
      saveCheckIn,
      fetchHistory,
      triggerAlert,
    }),
    [
      latestScore,
      history,
      alertEnabled,
      isDrawerOpen,
      checkInData,
      updateCheckIn,
      resetCheckIn,
      saveCheckIn,
      fetchHistory,
      triggerAlert,
    ],
  )

  return <CognitiveContext.Provider value={value}>{children}</CognitiveContext.Provider>
}

export function useCognitive() {
  const ctx = useContext(CognitiveContext)
  if (!ctx) throw new Error('useCognitive must be used inside CognitiveProvider')
  return ctx
}
