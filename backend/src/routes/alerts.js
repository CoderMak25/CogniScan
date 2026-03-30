import express from 'express'
import User from '../models/User.js'

const router = express.Router()

router.post('/', async (req, res) => {
  try {
    const { userId, scoreDrop = 0, zScore = 0, scoreId } = req.body
    const user = await User.findById(userId).lean()
    if (!user) return res.status(404).json({ message: 'User not found' })

    const threshold = user.caregiver?.alertThresholdDrop || 15
    const enabled = user.caregiver?.alertEnabled || false
    const triggered = enabled && (scoreDrop >= threshold || zScore <= -1.5)

    res.json({
      triggered,
      caregiver: user.caregiver || null,
      context: { scoreId, scoreDrop, zScore },
    })
  } catch (error) {
    res.status(500).json({ message: 'Failed to handle alert', error: error.message })
  }
})

export default router
