import express from 'express'
import mongoose from 'mongoose'
import CognitiveScore from '../models/CognitiveScore.js'
import User from '../models/User.js'

const router = express.Router()
const clamp = (v, min, max) => Math.max(min, Math.min(max, v))

function mean(arr) {
  return arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0
}

function std(arr) {
  if (arr.length < 2) return 8
  const m = mean(arr)
  return Math.sqrt(mean(arr.map((x) => (x - m) ** 2)))
}

router.post('/', async (req, res) => {
  try {
    const { userId, taskScores, rawMetrics = {}, timestamp } = req.body
    if (!mongoose.Types.ObjectId.isValid(userId)) return res.status(400).json({ message: 'Invalid userId' })

    const MOCK_USER_ID = '000000000000000000000001'
    let user = await User.findById(userId).lean()
    
    // For prototype/demo, allow the mock user even if not in DB
    if (!user && userId === MOCK_USER_ID) {
      user = { _id: userId, baseline: { overall: 80 } }
    }
    
    if (!user) return res.status(404).json({ message: 'User not found' })

    const memory = clamp(Number(taskScores.memory), 0, 100)
    const reaction = clamp(Number(taskScores.reaction), 0, 100)
    const sequence = clamp(Number(taskScores.sequence), 0, 100)
    const speech = taskScores.speech == null ? null : clamp(Number(taskScores.speech), 0, 100)
    
    // Synchronized with frontend weightings (25% each)
    const totalScore = speech == null
      ? Math.round(memory * 0.35 + reaction * 0.35 + sequence * 0.3)
      : Math.round(memory * 0.25 + reaction * 0.25 + sequence * 0.25 + speech * 0.25)

    const history = await CognitiveScore.find({ userId }).sort({ timestamp: -1 }).limit(30).select('totalScore').lean()
    const arr = history.map((h) => h.totalScore)
    const mu = arr.length ? mean(arr) : (user.baseline?.overall || 80)
    const sigma = std(arr)
    const zScore = Number(((totalScore - mu) / sigma).toFixed(2))
    const isAnomaly = zScore <= -1.5

    const score = await CognitiveScore.create({
      userId,
      timestamp: timestamp ? new Date(timestamp) : new Date(),
      taskScores: { memory, reaction, sequence, speech },
      rawMetrics,
      totalScore,
      anomaly: { zScore, isAnomaly, threshold: -1.5 },
    })
    
    // Only update if actual user exists
    if (await User.findById(userId)) {
      await User.findByIdAndUpdate(userId, { lastCheckInAt: score.timestamp })
    }

    res.status(201).json({ message: 'Score saved', score })
  } catch (error) {
    res.status(500).json({ message: 'Failed to save score', error: error.message })
  }
})

router.get('/:userId', async (req, res) => {
  try {
    const { userId } = req.params
    if (!mongoose.Types.ObjectId.isValid(userId)) return res.status(400).json({ message: 'Invalid userId' })

    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const history = await CognitiveScore.find({ userId, timestamp: { $gte: thirtyDaysAgo } }).sort({ timestamp: 1 }).lean()
    res.json({ count: history.length, history })
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch scores', error: error.message })
  }
})

export default router
