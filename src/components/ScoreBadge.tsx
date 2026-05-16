export function ScoreBadge({ score, combo }: { score: number; combo: number }) {
  return (
    <div className="score-badge relative flex h-12 min-w-[5.6rem] flex-col items-center justify-center rounded-2xl px-3 text-center">
      <span className="text-[0.65rem] font-semibold leading-none">分数</span>
      <span className="text-base font-black leading-tight">{score}</span>
      {combo > 1 ? <span className="combo-pop absolute -mt-14 rounded-full px-2 py-1 text-xs font-black">COMBO x{combo}</span> : null}
    </div>
  );
}
