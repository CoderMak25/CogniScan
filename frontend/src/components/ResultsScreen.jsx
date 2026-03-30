import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCognitive } from '../context/CognitiveContext.jsx'

export default function ResultsScreen() {
  const { checkInData, saveCheckIn, resetCheckIn } = useCognitive()
  const [isSaving, setIsSaving] = useState(false)
  const navigate = useNavigate()

  const handleFinish = async () => {
    setIsSaving(true)
    try {
      await saveCheckIn()
      resetCheckIn()
      navigate('/dashboard')
    } catch (err) {
      alert('Failed to save session: ' + err.message)
    } finally {
      setIsSaving(false)
    }
  }

  // Calculate final weighted score if not already set
  const total = Math.round(
    checkInData.memoryScore * 0.35 +
    (checkInData.reactionTimes.length ? (100 - (checkInData.reactionTimes.reduce((a,b)=>a+b,0)/checkInData.reactionTimes.length)/10) * 0.35 : 0) +
    checkInData.patternScore * 0.3
  )

  const tasks = [
    { name: 'Memory Recall', score: checkInData.memoryScore, status: checkInData.memoryScore > 70 ? 'Optimal' : 'Flagged', color: 'text-success' },
    { name: 'Motor Reaction', score: Math.round(checkInData.reactionTimes.length ? 100 - (checkInData.reactionTimes.reduce((a,b)=>a+b,0)/checkInData.reactionTimes.length)/10 : 0), status: 'Stable', color: 'text-primary' },
    { name: 'Pattern Logic', score: checkInData.patternScore, status: checkInData.patternScore > 60 ? 'Optimal' : 'Low', color: 'text-success' },
    { name: 'Speech Fluency', score: checkInData.speechScore, status: checkInData.speechScore > 80 ? 'Excellent' : 'Normal', color: 'text-primary' },
  ]

  return (
    <div className="max-w-[800px] mx-auto fade-in">
      <div className="bg-card rounded-[32px] shadow-card p-10 md:p-14 text-center border border-[#F1F3F4]">
        <h2 className="text-4xl font-bold tracking-tight text-textPrimary mb-2">Check-in Complete</h2>
        <p className="text-textSecondary mb-12">Your data has been processed by our cognitive baseline model.</p>

        <div className="relative inline-flex items-center justify-center mb-12">
          <svg className="w-56 h-56 transform -rotate-90">
            <circle cx="112" cy="112" r="100" stroke="#F1F3F4" strokeWidth="16" fill="transparent" />
            <circle
              cx="112" cy="112" r="100"
              stroke={total > 85 ? '#34A853' : total > 70 ? '#1A73E8' : '#EA4335'}
              strokeWidth="16" fill="transparent"
              strokeDasharray={2 * Math.PI * 100}
              strokeDashoffset={2 * Math.PI * 100 * (1 - total / 100)}
              strokeLinecap="round"
              className="transition-all duration-1000 ease-out"
            />
          </svg>
          <div className="absolute flex flex-col items-center">
            <span className="text-6xl font-bold text-textPrimary leading-none">{total}</span>
            <span className="text-xs font-bold text-textSecondary uppercase tracking-widest mt-2">Consistency</span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-12">
          {tasks.map((task) => (
            <div key={task.name} className="flex justify-between items-center p-6 bg-bg rounded-[24px] border border-[#F1F3F4]">
              <div className="text-left">
                <span className="block text-xs font-bold text-textSecondary uppercase mb-1">{task.name}</span>
                <span className={`text-sm font-bold ${task.color}`}>{task.status}</span>
              </div>
              <span className="text-2xl font-bold text-textPrimary">{task.score}</span>
            </div>
          ))}
        </div>

        <button
          onClick={handleFinish}
          disabled={isSaving}
          className="w-full bg-primary text-white py-5 rounded-[24px] font-bold text-lg hover:bg-[#155DB1] transition-all shadow-lg shadow-primary/25 disabled:opacity-50 active:scale-[0.98]"
        >
          {isSaving ? 'Saving to Secure Cloud...' : 'Submit & Update Dashboard'}
        </button>
      </div>
    </div>
  )
}
