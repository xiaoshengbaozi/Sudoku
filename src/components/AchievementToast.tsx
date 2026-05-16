import { useEffect } from "react";
import type { Achievement } from "../storage";

export function AchievementToast({
  achievement,
  onDone,
}: {
  achievement: Achievement;
  onDone: () => void;
}) {
  useEffect(() => {
    const timer = window.setTimeout(onDone, 2800);
    return () => window.clearTimeout(timer);
  }, [onDone]);

  return (
    <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 px-4 w-full max-w-[360px]">
      <div className="achievement-toast flex items-center gap-3 rounded-2xl p-4 shadow-glow animate-victory-pop">
        <span className="text-3xl">{achievement.icon}</span>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold muted-text">成就解锁!</p>
          <p className="text-sm font-black">{achievement.title}</p>
          <p className="text-xs muted-text">{achievement.description}</p>
        </div>
      </div>
    </div>
  );
}
