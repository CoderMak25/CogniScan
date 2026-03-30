import mongoose from 'mongoose'

const scoreSchema = new mongoose.Schema({
  memory: { type: Number, min: 0, max: 100, default: null },
  reaction: { type: Number, min: 0, max: 100, default: null },
  sequence: { type: Number, min: 0, max: 100, default: null },
  speech: { type: Number, min: 0, max: 100, default: null },
  stroop: { type: Number, min: 0, max: 100, default: null },
  typing: { type: Number, min: 0, max: 100, default: null },
  facial: { type: Number, min: 0, max: 100, default: null },
}, { _id: false })

const rawSchema = new mongoose.Schema({
  memoryRecallCount: { type: Number, min: 0, max: 5 },
  reactionAvgMs: { type: Number, min: 0 },
  sequenceRoundsCorrect: { type: Number, min: 0, max: 3 },
  speechFluencyScore: { type: Number, min: 0, max: 100 },
  avgWordDuration: { type: Number, default: 0 },
  pauseFrequency: { type: Number, default: 0 },
  stroopAccuracy: { type: Number, default: 0 },
  stroopAvgMs: { type: Number, default: 0 },
  typingWpm: { type: Number, default: 0 },
  typingAccuracy: { type: Number, default: 0 },
  typingErrors: { type: Number, default: 0 },
  facialBlinkRate: { type: Number, default: 0 },
  facialStabilityScore: { type: Number, default: 0 },
  facialEyeClosureTime: { type: Number, default: 0 },
}, { _id: false, strict: false })

const anomalySchema = new mongoose.Schema({
  zScore: { type: Number, default: 0 },
  isAnomaly: { type: Boolean, default: false },
  threshold: { type: Number, default: -1.5 },
}, { _id: false })

const cognitiveScoreSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  timestamp: { type: Date, default: Date.now, index: true },
  taskScores: { type: scoreSchema, required: true },
  rawMetrics: { type: rawSchema, default: () => ({}) },
  totalScore: { type: Number, required: true, min: 0, max: 100 },
  anomaly: { type: anomalySchema, default: () => ({}) },
}, { timestamps: true })

export default mongoose.model('CognitiveScore', cognitiveScoreSchema)
