export default function TaskPatternMemory({
  round,
  active,
  sequenceStarted,
  onTileClick,
  onStart,
  onFinish,
  score,
}) {
  return (
    <div className="text-center fade-in">
      <div className="bg-[#E8F0FD] text-primary text-xs font-medium rounded-full px-3 py-1 inline-block mb-4">
        Task 3 of 3 · Pattern Memory
      </div>
      <h2 className="text-2xl font-semibold tracking-tight text-textPrimary">Repeat the Sequence</h2>
      <p className="text-sm text-textSecondary mt-1 mb-2">Watch the pattern, then tap the same order.</p>
      
      {round < 3 && (
        <>
          <p className="text-sm font-medium text-textSecondary mb-8">Round {round + 1} of 3</p>
          <div className="flex justify-center mb-8">
            <div className="grid grid-cols-2 gap-4">
              {[
                { id: 0, color: 'bg-alert' },
                { id: 1, color: 'bg-primary' },
                { id: 2, color: 'bg-success' },
                { id: 3, color: 'bg-warning' },
              ].map((tile) => (
                <button
                  key={tile.id}
                  onClick={() => onTileClick(tile.id)}
                  className={`w-[100px] h-[100px] rounded-[16px] transition-all duration-150 outline-none ${tile.color} ${
                    active === tile.id ? 'scale-[1.08] brightness-125' : ''
                  } ${!sequenceStarted ? 'pointer-events-none' : ''}`}
                />
              ))}
            </div>
          </div>
        </>
      )}

      {!sequenceStarted && round < 3 && (
        <button
          onClick={onStart}
          className="bg-primary text-white rounded-[12px] px-8 py-3.5 font-medium hover:bg-[#155DB1] transition-colors mt-2"
        >
          Start Sequence
        </button>
      )}

      {round >= 3 && (
        <div className="flex flex-col items-center fade-in">
          <div className="text-2xl font-semibold text-textPrimary mb-6">
            {score} / 3 rounds correct
          </div>
          <button
            onClick={onFinish}
            className="bg-primary text-white rounded-[12px] w-full py-3.5 font-medium hover:bg-[#155DB1] transition-colors"
          >
            See My Results →
          </button>
        </div>
      )}
    </div>
  )
}
