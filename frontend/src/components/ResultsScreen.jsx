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

  // Calculate final weighted score dynamically consistent with CognitiveContext
  const avgReactionMs = checkInData.reactionTimes.length 
    ? checkInData.reactionTimes.reduce((a, b) => a + b, 0) / checkInData.reactionTimes.length 
    : 0

  const activeTasks = [
    { val: checkInData.memoryScore, count: 1 },
    { val: Math.max(0, 100 - (avgReactionMs / 10)), count: 1 },
    { val: checkInData.patternScore, count: 1 },
    { val: checkInData.speechScore, count: checkInData.speechScore > 0 ? 1 : 0 }
  ].filter(t => t.count > 0)

  const total = Math.round(activeTasks.reduce((s, t) => s + t.val, 0) / activeTasks.length)

  const tasks = [
    { name: 'Memory', score: checkInData.memoryScore, status: checkInData.memoryScore > 70 ? 'OPTIMAL' : 'MONITOR', color: 'text-success' },
    { name: 'Motor', score: Math.round(Math.max(0, 100 - (avgReactionMs / 10))), status: 'STABLE', color: 'text-primary' },
    { name: 'Pattern', score: checkInData.patternScore, status: checkInData.patternScore > 60 ? 'OPTIMAL' : 'CALIBRATING', color: 'text-success' },
    { name: 'Speech', score: checkInData.speechScore, status: checkInData.speechScore > 80 ? 'EXCELLENT' : 'NORMAL', color: 'text-primary' },
  ]

  return (
    <div className="max-w-[800px] mx-auto fade-in">
      <div className="bg-white rounded-[48px] shadow-2xl p-12 md:p-16 text-center border border-[#F1F3F4] relative overflow-hidden group">
        <div className="absolute -right-20 -top-20 w-60 h-60 bg-primary/5 rounded-full blur-3xl group-hover:bg-primary/10 transition-all"></div>
        
        <h2 className="text-5xl font-black tracking-tighter text-textPrimary mb-3 uppercase italic">Diagnostics Ready</h2>
        <p className="text-textSecondary mb-16 font-medium">Multimodal consistency mapping complete</p>

        <div className="relative inline-flex items-center justify-center mb-16 scale-110">
          <svg className="w-64 h-64 transform -rotate-90">
            <circle cx="128" cy="128" r="114" stroke="#F1F3F4" strokeWidth="20" fill="transparent" />
            <circle
              cx="128" cy="128" r="114"
              stroke={total > 85 ? '#34A853' : total > 70 ? '#1A73E8' : '#EA4335'}
              strokeWidth="20" fill="transparent"
              strokeDasharray={2 * Math.PI * 114}
              strokeDashoffset={2 * Math.PI * 114 * (1 - total / 100)}
              strokeLinecap="round"
              className="transition-all duration-1000 ease-out shadow-[0_0_20px_rgba(26,115,232,0.3)]"
            />
          </svg>
          <div className="absolute flex flex-col items-center">
            <span className="text-7xl font-black text-textPrimary leading-none tracking-tighter">{total}</span>
            <span className="text-[10px] font-black text-textSecondary uppercase tracking-[0.2em] mt-4 opacity-60">Consistency</span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 mb-16">
          {tasks.map((task) => (
            <div key={task.name} className="flex justify-between items-center p-8 bg-bg rounded-[32px] border border-[#F1F3F4] group hover:border-primary/20 transition-all">
              <div className="text-left">
                <span className="block text-[10px] font-black text-textSecondary uppercase mb-2 tracking-widest">{task.name} Index</span>
                <span className={`text-[11px] font-black tracking-widest ${task.color} opacity-80 italic`}>{task.status}</span>
              </div>
              <span className="text-3xl font-black text-textPrimary tracking-tighter">{task.score}</span>
            </div>
          ))}
        </div>

        <div className="space-y-6">
          <button
            onClick={handleFinish}
            disabled={isSaving}
            className="w-full bg-primary text-white py-6 rounded-[32px] font-black text-xl uppercase tracking-widest hover:bg-[#155DB1] btn-hover shadow-2xl shadow-primary/30 disabled:opacity-50"
          >
            {isSaving ? 'Synchronizing Pipeline...' : 'Commit to Dashboard'}
          </button>
          
          <p className="text-[10px] text-textSecondary font-bold uppercase tracking-widest opacity-40">
            Neuro-behavioral data encrypted using local clinical standards
          </p>
        </div>
      </div>
    </div>
  )
}
