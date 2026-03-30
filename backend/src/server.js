import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import connectDB from './config/db.js'
import scoreRoutes from './routes/scores.js'
import alertRoutes from './routes/alerts.js'

const app = express()
app.use(cors())
app.use(express.json())

app.get('/health', (_req, res) => res.json({ ok: true }))
app.use('/api/scores', scoreRoutes)
app.use('/api/alerts', alertRoutes)

const PORT = process.env.PORT || 5000

connectDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`CogniScan API running on port ${PORT}`)
    })
  })
  .catch((err) => {
    console.error('Mongo connection failed:', err.message)
    process.exit(1)
  })
