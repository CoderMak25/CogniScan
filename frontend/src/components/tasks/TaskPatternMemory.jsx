export default function TaskPatternMemory({
  round,
  active,
  wrongMove,
  sequenceStarted,
  onTileClick,
  onStart,
  onFinish,
  score,
}) {
  const tiles = [
    { id: 0, color: 'bg-[#EA4335]', icon: '▲' },
    { id: 1, color: 'bg-[#1A73E8]', icon: '●' },
    { id: 2, color: 'bg-[#34A853]', icon: '■' },
    { id: 3, color: 'bg-[#FBBC04]', icon: '★' },
  ]

  return (
    <div className={`text-center fade-in ${wrongMove ? 'animate-shake' : ''}`}>
      <div className="bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-widest rounded-full px-4 py-1.5 inline-block mb-6">
        Task 3 of 4 · Pattern Memory
      </div>
      <h2 className="text-3xl font-bold tracking-tight text-textPrimary mb-2">Repeat the Sequence</h2>
      <p className="text-textSecondary mb-10 max-w-[400px] mx-auto">Watch the pattern closely, then tap the symbols in the same order.</p>
      
      {round < 3 ? (
        <div className="space-y-8">
          <div className="flex justify-center">
            <div className={`grid grid-cols-2 gap-5 p-4 rounded-[40px] transition-colors duration-300 ${wrongMove ? 'bg-alert/10' : 'bg-transparent'}`}>
              {tiles.map((tile) => (
                <button
                  key={tile.id}
                  onClick={() => onTileClick(tile.id)}
                  disabled={!sequenceStarted || active !== -1 || wrongMove}
                  className={`w-28 h-28 rounded-[28px] transition-all duration-200 shadow-lg flex items-center justify-center text-3xl text-white/90 ${tile.color} ${
                    active === tile.id ? 'scale-110 brightness-150 ring-8 ring-primary/20 z-10' : 'opacity-90'
                  } ${!sequenceStarted ? 'grayscale-[0.5] opacity-50 cursor-not-allowed' : 'hover:scale-105 active:scale-95'}`}
                >
                  {tile.icon}
                </button>
              ))}
            </div>
          </div>
          <div className="text-sm font-bold text-textSecondary uppercase tracking-widest">
            {wrongMove ? <span className="text-alert animate-bounce inline-block">Incorrect!</span> : `Round ${round + 1} / 3`}
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center py-6 fade-in">
          <div className="w-20 h-20 bg-success/10 text-success rounded-full flex items-center justify-center text-3xl mb-6">✓</div>
          <div className="text-2xl font-bold text-textPrimary mb-2">
            {score} / 3 Rounds Correct
          </div>
          <p className="text-textSecondary mb-10">Sequence logic baseline established.</p>
          <button
            onClick={onFinish}
            className="w-full bg-primary text-white py-5 rounded-[20px] font-bold text-lg hover:bg-[#155DB1] transition-all shadow-lg shadow-primary/25 active:scale-[0.98]"
          >
            Continue to Speech Analysis →
          </button>
        </div>
      )}

      {!sequenceStarted && round < 3 && (
        <button
          onClick={onStart}
          className="mt-8 bg-primary text-white rounded-[20px] px-10 py-5 font-bold text-lg hover:bg-[#155DB1] transition-all shadow-lg shadow-primary/25 active:scale-[0.98]"
        >
          Begin Sequence
        </button>
      )}
    </div>
  )
}
