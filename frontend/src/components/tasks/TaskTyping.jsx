import { useMemo, useState } from 'react'

const PROMPTS = [
  'neuroplasticity improves with consistent training and focused repetition',
  'cognitive stability can be tracked through speed accuracy and rhythm',
  'attention and memory pathways strengthen when distractions are reduced',
  'regular mental exercises support processing speed and executive control'
]

export default function TaskTyping({ onComplete }) {
  const [started, setStarted] = useState(false)
  const [finished, setFinished] = useState(false)
  const [input, setInput] = useState('')
  const [startAt, setStartAt] = useState(0)
  const [result, setResult] = useState(null)

  const prompt = PROMPTS[0]
  const typedWords = useMemo(
    () => (input.trim().length > 0 ? input.trim().split(/\s+/) : []),
    [input],
  )
  const targetWords = useMemo(() => prompt.split(' '), [prompt])

  const accuracy = useMemo(() => {
    if (typedWords.length === 0) return 0
    let correct = 0
    for (let i = 0; i < typedWords.length; i += 1) {
      if (typedWords[i] === targetWords[i]) correct += 1
    }
    return Math.round((correct / typedWords.length) * 100)
  }, [typedWords, targetWords])

  const handleStart = () => {
    setStarted(true)
    setStartAt(Date.now())
  }

  const handleFinish = () => {
    if (!started || finished) return
    const elapsedMs = Math.max(1000, Date.now() - startAt)
    const minutes = elapsedMs / 60000
    const grossWpm = Math.round((input.trim().length / 5) / minutes)
    const netWpm = Math.max(0, Math.round(grossWpm * (accuracy / 100)))
    const score = Math.max(0, Math.min(100, Math.round((netWpm * 1.2) + (accuracy * 0.4))))
    const errors = typedWords.reduce((count, word, idx) => (
      word === targetWords[idx] ? count : count + 1
    ), 0)

    const payload = {
      score,
      accuracy,
      wpm: netWpm,
      avgMs: Math.round(elapsedMs / Math.max(1, typedWords.length)),
      errors,
    }
    setResult(payload)
    setFinished(true)
    onComplete(payload)
  }

  return (
    <div className="max-w-[760px] mx-auto pt-10 fade-in">
      <div className="bg-white rounded-[40px] shadow-card p-10 border border-[#F1F3F4]">
        <div className="mb-8 text-center">
          <h2 className="text-3xl font-black text-textPrimary mb-3">Typing Fluency</h2>
          <p className="text-textSecondary">Monkeytype-style speed and accuracy profiling.</p>
        </div>

        <div className="bg-bg rounded-[24px] p-6 border border-[#F1F3F4] mb-6 leading-8 text-lg text-textPrimary">
          {prompt.split('').map((ch, idx) => {
            const typedChar = input[idx]
            let cls = 'text-[#5F6368]'
            if (typedChar != null) cls = typedChar === ch ? 'text-success' : 'text-alert'
            return <span key={`${ch}-${idx}`} className={cls}>{ch}</span>
          })}
        </div>

        <textarea
          value={input}
          disabled={finished}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type the text above exactly..."
          className="w-full min-h-[140px] p-5 rounded-[20px] bg-bg border border-[#F1F3F4] focus:border-primary outline-none text-textPrimary resize-none"
        />

        <div className="mt-6 grid grid-cols-3 gap-4">
          <div className="bg-bg border border-[#F1F3F4] rounded-[18px] p-4 text-center">
            <p className="text-[10px] uppercase font-black tracking-widest text-textSecondary">Accuracy</p>
            <p className="text-2xl font-black text-textPrimary">{accuracy}%</p>
          </div>
          <div className="bg-bg border border-[#F1F3F4] rounded-[18px] p-4 text-center">
            <p className="text-[10px] uppercase font-black tracking-widest text-textSecondary">Progress</p>
            <p className="text-2xl font-black text-textPrimary">{Math.min(100, Math.round((input.length / prompt.length) * 100))}%</p>
          </div>
          <div className="bg-bg border border-[#F1F3F4] rounded-[18px] p-4 text-center">
            <p className="text-[10px] uppercase font-black tracking-widest text-textSecondary">Words</p>
            <p className="text-2xl font-black text-textPrimary">{typedWords.length}</p>
          </div>
        </div>

        <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
          {!started ? (
            <button
              onClick={handleStart}
              className="px-10 py-4 bg-primary text-white rounded-[16px] font-black uppercase text-sm tracking-widest hover:bg-[#155DB1] transition-all"
            >
              Start Typing
            </button>
          ) : (
            <button
              onClick={handleFinish}
              disabled={finished || input.trim().length === 0}
              className="px-10 py-4 bg-primary text-white rounded-[16px] font-black uppercase text-sm tracking-widest hover:bg-[#155DB1] transition-all disabled:opacity-50"
            >
              Finish Test
            </button>
          )}
        </div>

        {result && (
          <div className="mt-8 p-6 rounded-[20px] bg-success/10 border border-success/20 text-center">
            <p className="text-[10px] uppercase font-black tracking-widest text-success mb-2">Typing Result</p>
            <p className="text-2xl font-black text-textPrimary">{result.wpm} WPM | {result.accuracy}% Accuracy</p>
          </div>
        )}
      </div>
    </div>
  )
}
