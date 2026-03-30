export default function TaskWordMemory({
  words,
  started,
  done,
  countdown,
  answers,
  setAnswers,
  score,
  onStart,
  onCheck,
  onNext,
}) {
  return (
    <div className="fade-in">
      <div className="bg-[#E8F0FD] text-primary text-xs font-medium rounded-full px-3 py-1 inline-block mb-4">
        Task 1 of 3 · Memory Recall
      </div>
      <h2 className="text-2xl font-semibold tracking-tight text-textPrimary">Memorize These Words</h2>
      <p className="text-sm text-textSecondary mt-1 mb-8">You have 5 seconds. They will disappear.</p>

      {!started && (
        <button
          onClick={onStart}
          className="bg-primary text-white rounded-[12px] w-full py-3.5 font-medium hover:bg-[#155DB1] transition-colors"
        >
          Start Memory Task
        </button>
      )}

      {started && !done && (
        <div className="flex flex-col items-center">
          <div className="flex flex-wrap justify-center gap-3 mb-8 min-h-[50px]">
            {words.map((w) => (
              <div
                key={w}
                className="bg-white border-[1.5px] border-[#E8F0FD] rounded-[8px] font-semibold text-textPrimary px-5 py-2.5 shadow-sm"
              >
                {w}
              </div>
            ))}
          </div>

          <div className="relative w-24 h-24 mb-8">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="45" fill="none" stroke="#F8F9FA" stroke-width="6"></circle>
              <circle
                cx="50"
                cy="50"
                r="45"
                fill="none"
                stroke="#1A73E8"
                stroke-width="6"
                stroke-dasharray="283"
                stroke-dashoffset={283 - (283 * countdown) / 5}
                className="transition-all duration-1000 ease-linear"
              ></circle>
            </svg>
            <div className="absolute inset-0 flex items-center justify-center text-3xl font-medium font-mono text-textPrimary">
              {countdown}
            </div>
          </div>
        </div>
      )}

      {done && (
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-4 mb-2">
            {answers.map((a, i) => (
              <div key={i} className="flex items-center relative">
                <input
                  type="text"
                  value={a}
                  onChange={(e) => {
                    const next = [...answers]
                    next[i] = e.target.value
                    setAnswers(next)
                  }}
                  disabled={score !== null}
                  placeholder={`Word ${i + 1}`}
                  className="w-full border-b-2 border-baseline bg-transparent outline-none focus:border-primary py-2 text-base transition-colors pr-8"
                />
                {score !== null && (
                  <span className="absolute right-0 text-xl">
                    {words.includes(a.trim().toUpperCase()) ? '✅' : '❌'}
                  </span>
                )}
              </div>
            ))}
          </div>

          {score === null ? (
            <button
              onClick={onCheck}
              className="bg-primary text-white rounded-[12px] w-full py-3.5 font-medium hover:bg-[#155DB1] transition-colors mt-4"
            >
              Check My Answers
            </button>
          ) : (
            <div className="flex flex-col items-center gap-4 mt-4">
              <div
                className={`text-sm font-medium rounded-full px-4 py-1.5 ${
                  score >= 4 ? 'bg-[#E6F4EA] text-success' : score === 3 ? 'bg-[#FEF7E0] text-warning' : 'bg-[#FCE8E6] text-alert'
                }`}
              >
                Recall Score: {score}/5
              </div>
              <button
                onClick={onNext}
                className="bg-primary text-white rounded-[12px] w-full py-3.5 font-medium hover:bg-[#155DB1] transition-colors"
              >
                Next Task →
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
