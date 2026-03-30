import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useCognitive } from '../../context/CognitiveContext.jsx'
import TaskStroop from './TaskStroop.jsx'
import TaskNumberSpan from './TaskNumberSpan.jsx'
import { CheckCircleIcon } from '@heroicons/react/24/outline'

export default function SpecializedTaskScreen() {
  const { taskType } = useParams()
  const { unlockTask } = useCognitive()
  const [complete, setComplete] = useState(false)
  const [lastResult, setLastResult] = useState(null)
  const navigate = useNavigate()

  const handleTaskComplete = (results) => {
    setLastResult(results)
    if (taskType === 'stroop') unlockTask('number-span')
    setComplete(true)
  }

  if (complete) {
    return (
      <div className="max-w-[800px] mx-auto text-center py-20 fade-in">
        <div className="bg-white rounded-[48px] shadow-2xl p-12 lg:p-20 border border-[#F1F3F4] relative overflow-hidden group">
          <div className="absolute -right-20 -top-20 w-60 h-60 bg-success/5 rounded-full blur-3xl group-hover:bg-success/10 transition-all"></div>
          
          <div className="bg-success/10 w-24 h-24 rounded-[32px] flex items-center justify-center mx-auto mb-10 text-success shadow-sm rotate-3 group-hover:rotate-0 transition-transform">
            <CheckCircleIcon className="w-14 h-14" />
          </div>
          
          <h2 className="text-5xl font-black text-textPrimary mb-4 uppercase italic tracking-tighter">Diagnostic Ready</h2>
          <p className="text-textSecondary mb-16 max-w-[500px] mx-auto font-medium">
            Executive Function metrics have been calibrated against your neuro-behavioral profile.
          </p>
          
          <div className="grid grid-cols-2 gap-8 mb-16">
            <div className="p-8 bg-bg rounded-[32px] border border-[#F1F3F4] group-hover:border-success/20 transition-all">
              <span className="block text-[10px] font-black text-textSecondary uppercase mb-2 tracking-widest">Accuracy</span>
              <span className="text-4xl font-black text-textPrimary tracking-tighter">{Math.round(lastResult.accuracy)}%</span>
            </div>
            <div className="p-8 bg-bg rounded-[32px] border border-[#F1F3F4] group-hover:border-success/20 transition-all">
              <span className="block text-[10px] font-black text-textSecondary uppercase mb-2 tracking-widest">Latency</span>
              <span className="text-4xl font-black text-textPrimary tracking-tighter">{Math.round(lastResult.avgMs)}<span className="text-sm opacity-40 ml-1 font-bold">MS</span></span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-6 justify-center">
            <button 
              onClick={() => navigate('/dashboard')}
              className="px-12 py-6 bg-primary text-white rounded-[24px] font-black text-sm uppercase tracking-widest shadow-xl shadow-primary/30 hover:bg-[#155DB1] hover:scale-[1.02] transition-all active:scale-95"
            >
              Analyze Dashboard
            </button>
            <button 
              onClick={() => navigate('/tasks')}
              className="px-12 py-6 bg-white text-textPrimary border border-[#F1F3F4] rounded-[24px] font-black text-sm uppercase tracking-widest hover:border-primary transition-all active:scale-95"
            >
              Exit Portal
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="pt-8 pb-20">
      {taskType === 'stroop' && <TaskStroop onComplete={handleTaskComplete} />}
      {taskType === 'number-span' && <TaskNumberSpan onComplete={handleTaskComplete} />}
    </div>
  )
}
