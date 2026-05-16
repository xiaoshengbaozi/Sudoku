import { Check, X } from "lucide-react";
import type { AchievementMap } from "../storage";
import { ACHIEVEMENTS } from "../storage";

export function AchievementsModal({
  achievements,
  onClose,
}: {
  achievements: AchievementMap;
  onClose: () => void;
}) {
  const unlockedCount = ACHIEVEMENTS.filter((a) => achievements[a.id]?.unlocked).length;

  return (
    <div className="modal-overlay fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
      <div className="modal-card w-full max-w-[360px] rounded-[2rem] p-6 shadow-glow animate-victory-pop max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between mb-3 shrink-0">
          <div>
            <h2 className="text-xl font-black">🏆 成就</h2>
            <p className="text-xs muted-text font-medium">{unlockedCount}/{ACHIEVEMENTS.length} 已解锁</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid h-9 w-9 place-items-center rounded-full hover:bg-white/10 transition"
            aria-label="关闭"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex flex-col gap-2 overflow-y-auto">
          {ACHIEVEMENTS.map((ach) => {
            const state = achievements[ach.id];
            const isUnlocked = state?.unlocked ?? false;
            return (
              <div
                key={ach.id}
                className={`achievement-item flex items-center gap-3 rounded-2xl p-3 transition ${
                  isUnlocked ? "" : "achievement-locked"
                }`}
              >
                <span className={`text-2xl shrink-0 ${isUnlocked ? "" : "grayscale opacity-30"}`}>
                  {ach.icon}
                </span>
                <div className="min-w-0 flex-1">
                  <p className={`text-sm font-bold ${isUnlocked ? "" : "muted-text"}`}>{ach.title}</p>
                  <p className="text-xs muted-text truncate">{ach.description}</p>
                </div>
                {isUnlocked ? (
                  <Check size={18} className="text-green-400 shrink-0" strokeWidth={3} />
                ) : (
                  <span className="text-xs muted-text shrink-0">🔒</span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
