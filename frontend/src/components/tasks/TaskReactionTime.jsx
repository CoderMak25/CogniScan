export default function TaskReactionTime({
  round,
  state,
  shownText,
  onTap,
  onStart,
  onNext,
  avgRt,
}) {
  return (
    <div className="text-center fade-in">
      <div className="bg-[#E8F0FD] text-primary text-xs font-medium rounded-full px-3 py-1 inline-block mb-4">
        Task 2 of 5 · Reaction Time
      </div>
      <h2 className="text-2xl font-semibold tracking-tight text-textPrimary">Tap When It Turns Blue</h2>
      <p className="text-sm text-textSecondary mt-1 mb-2">
        A circle will appear. Tap it as fast as you can. 5 rounds.
      </p>
      
      {state !== 'finished' && (
        <>
          <p className="text-sm font-medium text-textSecondary mb-8">Round {Math.min(round + 1, 5)} of 5</p>
          <div className="flex justify-center mb-8">
            <div
              onMouseDown={onTap}
              onTouchStart={onTap}
              className={`w-[160px] h-[160px] rounded-full flex items-center justify-center cursor-pointer transition-colors duration-100 select-none ${
                state === 'ready'
                  ? 'bg-primary'
                  : state === 'waiting' && shownText === 'Too early!'
                  ? 'bg-alert'
                  : 'bg-[#F8F9FA] border-2 border-baseline'
              }`}
            >
              <span
                className={`font-medium ${
                  state === 'ready' || (state === 'waiting' && shownText === 'Too early!')
                    ? 'text-white'
                    : 'text-textSecondary'
                } ${state === 'ready' ? 'font-bold text-xl' : ''}`}
              >
                {shownText}
              </span>
            </div>
          </div>
        </>
      )}

      {state === 'idle' && (
        <button
          onClick={onStart}
          className="bg-primary text-white rounded-[12px] px-8 py-3.5 font-medium hover:bg-[#155DB1] transition-colors mt-2"
        >
          Start Task
        </button>
      )}

      {state === 'finished' && (
        <div className="flex flex-col items-center w-full fade-in">
          <div className="text-3xl font-semibold text-textPrimary mb-6">Average: {avgRt}ms</div>
          
          <div className="w-full max-w-[400px] flex flex-col gap-3 mb-8 text-sm font-medium">
            <div className="flex items-center gap-3">
              <span className="w-24 text-right text-textSecondary">Your Avg</span>
              <div className="flex-1 bg-bg h-4 rounded-full relative overflow-hidden">
                <div 
                  className={`absolute top-0 left-0 h-full rounded-full transition-all duration-1000 ${
                    avgRt < 300 ? 'bg-success' : avgRt <= 450 ? 'bg-warning' : 'bg-alert'
                  }`}
                  style={{ width: `${Math.min(100, (280 / avgRt) * 60)}%` }}
                ></div>
              </div>
            </div>
            <div className="flex items-center gap-3 relative">
              <span className="w-24 text-right text-textSecondary">Baseline</span>
              <div className="flex-1 bg-bg h-4 rounded-full relative overflow-hidden">
                <div className="absolute top-0 left-0 h-full bg-baseline rounded-full w-[60%]"></div>
              </div>
              <span className="absolute -bottom-5 right-0 text-[10px] text-textSecondary">(280ms)</span>
            </div>
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
  )
}
