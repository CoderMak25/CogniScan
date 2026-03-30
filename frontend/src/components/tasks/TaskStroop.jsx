import { useState, useEffect } from 'react'

const COLORS = ['Red', 'Blue', 'Green', 'Yellow', 'Purple', 'Orange']
const COLOR_VALUES = {
  Red: '#EA4335',
  Blue: '#1A73E8',
  Green: '#34A853',
  Yellow: '#FBBC05',
  Purple: '#A142F4',
  Orange: '#F97316'
}

export default function TaskStroop({ onComplete }) {
  const [currentTask, setCurrentTask] = useState(null)
  const [trials, setTrials] = useState([])
  const [count, setCount] = useState(0)
  const [startTime, setStartTime] = useState(0)
  const [gameOver, setGameOver] = useState(false)

  const generateTrial = () => {
    const text = COLORS[Math.floor(Math.random() * COLORS.length)]
    const color = COLORS[Math.floor(Math.random() * COLORS.length)]
    return { text, color }
  }

  useEffect(() => {
    setCurrentTask(generateTrial())
    setStartTime(Date.now())
  }, [])

  const handleAnswer = (answer) => {
    const duration = Date.now() - startTime
    const isCorrect = answer === currentTask.color
    
    const newTrials = [...trials, { isCorrect, duration }]
    setTrials(newTrials)
    
    if (count + 1 >= 15) {
      setGameOver(true)
      const correctCount = newTrials.filter(t => t.isCorrect).length
      const accuracy = (correctCount / newTrials.length) * 100
      const avgMs = newTrials.reduce((a,b)=>a+b.duration, 0) / newTrials.length
      
      onComplete({
        score: Math.round(accuracy * (Math.max(0, 2000 - avgMs) / 2000)),
        accuracy,
        avgMs
      })
    } else {
      setCount(count + 1)
      setCurrentTask(generateTrial())
      setStartTime(Date.now())
    }
  }

  if (gameOver) return <div className="text-center p-12"><h3 className="text-2xl font-bold">Diagnostic Complete</h3></div>

  return (
    <div className="max-w-[600px] mx-auto text-center fade-in">
      <div className="mb-12">
        <h2 className="text-3xl font-bold text-textPrimary mb-4">Stroop Inference Test</h2>
        <p className="text-textSecondary">Tap the <span className="font-bold">COLOR</span> of the word, ignore the text.</p>
        <div className="mt-4 bg-[#F1F3F4] rounded-full h-2 w-48 mx-auto">
          <div 
            className="bg-primary h-full rounded-full transition-all duration-300" 
            style={{ width: `${(count / 15) * 100}%` }}
          />
        </div>
      </div>

      <div className="bg-white rounded-[32px] p-16 shadow-card border border-[#F1F3F4] mb-12 flex items-center justify-center min-h-[250px]">
        {currentTask && (
          <span 
            className="text-7xl font-black transition-all"
            style={{ color: COLOR_VALUES[currentTask.color] }}
          >
            {currentTask.text}
          </span>
        )}
      </div>

      <div className="grid grid-cols-3 gap-4">
        {COLORS.map(c => (
          <button
            key={c}
            onClick={() => handleAnswer(c)}
            className="bg-white border border-[#F1F3F4] py-6 rounded-[20px] font-bold text-textPrimary hover:border-primary hover:text-primary btn-hover shadow-sm"
          >
            {c}
          </button>
        ))}
      </div>
    </div>
  )
}
