import type { Difficulty } from "../sudoku";
import type { GameStats } from "../storage";
import { X } from "lucide-react";
import { difficultyLabel } from "../constants";

export function StatsModal({ stats, onClose }: { stats: GameStats; onClose: () => void }) {
  const winRate = stats.totalGames > 0
    ? Math.round((stats.totalWins / stats.totalGames) * 100)
    : 0;

  return (
    <div className="modal-overlay fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
      <div className="modal-card w-full max-w-[360px] rounded-[2rem] p-6 shadow-glow animate-victory-pop">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xl font-black">📊 游戏统计</h2>
          <button
            type="button"
            onClick={onClose}
            className="grid h-9 w-9 place-items-center rounded-full hover:bg-white/10 transition"
            aria-label="关闭"
          >
            <X size={20} />
          </button>
        </div>

        <div className="grid grid-cols-3 gap-3 mb-4">
          <StatItem label="总局数" value={stats.totalGames} />
          <StatItem label="胜场" value={stats.totalWins} />
          <StatItem label="胜率" value={`${winRate}%`} />
          <StatItem label="最佳分数" value={stats.bestScore} />
          <StatItem label="最高连击" value={`x${stats.bestCombo}`} />
          <StatItem label="完美局" value={stats.perfectGames} />
        </div>

        <p className="text-xs font-semibold muted-text mb-3">各难度通关</p>
        <div className="grid grid-cols-5 gap-2">
          {(["easy", "medium", "hard", "expert", "master"] as Difficulty[]).map((d) => (
            <div key={d} className="modal-stat-chip rounded-xl p-2 text-center">
              <p className="text-[0.6rem] font-semibold muted-text leading-tight">
                {difficultyLabel[d]}
              </p>
              <p className="text-sm font-black">{stats.winsByDifficulty[d]}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function StatItem({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="modal-stat-chip rounded-2xl p-3 text-center">
      <p className="text-[0.6rem] font-semibold muted-text leading-tight">{label}</p>
      <p className="text-base font-black">{value}</p>
    </div>
  );
}
