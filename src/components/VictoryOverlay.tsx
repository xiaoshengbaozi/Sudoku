export function VictoryOverlay({
  score,
  errors,
  difficulty,
  onNewGame,
  onDismiss,
}: {
  score: number;
  errors: number;
  difficulty: string;
  onNewGame: () => void;
  onDismiss: () => void;
}) {
  return (
    <div className="victory-overlay fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
      <div className="victory-card w-full max-w-[360px] rounded-[2rem] p-8 text-center shadow-glow animate-victory-pop">
        <div className="mb-4 text-6xl">🎉</div>
        <h2 className="mb-1 text-2xl font-black">恭喜完成!</h2>
        <p className="muted-text mb-6 text-sm font-medium">{difficulty} 难度</p>
        <div className="mb-6 grid grid-cols-2 gap-3">
          <div className="victory-stat rounded-2xl p-3">
            <p className="text-xs font-semibold muted-text">得分</p>
            <p className="text-xl font-black">{score}</p>
          </div>
          <div className="victory-stat rounded-2xl p-3">
            <p className="text-xs font-semibold muted-text">错误</p>
            <p className="text-xl font-black">{errors}</p>
          </div>
        </div>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onDismiss}
            className="flex-1 h-11 rounded-full text-sm font-semibold muted-text transition hover:bg-white/10 active:scale-95"
          >
            继续查看
          </button>
          <button
            type="button"
            onClick={onNewGame}
            className="flex-1 h-11 rounded-full bg-[#ff6b4a] text-white text-sm font-semibold shadow-lg shadow-[#ff6b4a]/30 transition active:scale-95"
          >
            再来一局
          </button>
        </div>
      </div>
    </div>
  );
}
