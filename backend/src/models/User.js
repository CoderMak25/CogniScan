import mongoose from 'mongoose'

const baselineSchema = new mongoose.Schema({
  memory: { type: Number, default: 80, min: 0, max: 100 },
  reaction: { type: Number, default: 80, min: 0, max: 100 },
  sequence: { type: Number, default: 80, min: 0, max: 100 },
  speech: { type: Number, default: 80, min: 0, max: 100 },
  facial: { type: Number, default: 80, min: 0, max: 100 },
  overall: { type: Number, default: 80, min: 0, max: 100 },
}, { _id: false })

const caregiverSchema = new mongoose.Schema({
  name: { type: String, trim: true },
  relation: { type: String, trim: true },
  email: { type: String, trim: true, lowercase: true },
  phone: { type: String, trim: true },
  alertEnabled: { type: Boolean, default: false },
  alertThresholdDrop: { type: Number, default: 15, min: 1, max: 50 },
}, { _id: false })

const userSchema = new mongoose.Schema({
  fullName: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, trim: true, lowercase: true },
  age: { type: Number, min: 18, max: 120 },
  baseline: { type: baselineSchema, default: () => ({}) },
  caregiver: { type: caregiverSchema, default: () => ({}) },
  authProvider: { type: String, enum: ['mock', 'google', 'email'], default: 'mock' },
  lastCheckInAt: { type: Date },
}, { timestamps: true })

export default mongoose.model('User', userSchema)
