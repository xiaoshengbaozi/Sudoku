import { Zap } from "lucide-react";

const MAX = 100;
const SEGMENTS = 10;

export function EnergyBar({ value, active }: { value: number; active: boolean }) {
  const filledSegments = Math.min(SEGMENTS, Math.floor(value / (MAX / SEGMENTS)));
  const partialFill = (value % (MAX / SEGMENTS)) / (MAX / SEGMENTS);
  const isFull = filledSegments >= SEGMENTS;

  return (
    <div className={`energy-bar-wrapper mb-4 ${active ? "energy-bar-active" : ""}`}>
      <div className="energy-bar-header">
        <div className="energy-bar-label">
          <Zap size={14} className="energy-bar-icon" fill="currentColor" />
          <span className="energy-bar-title">能量</span>
        </div>
        <span className={`energy-bar-count ${isFull ? "energy-bar-full" : ""}`}>
          {filledSegments}/{SEGMENTS}
        </span>
      </div>
      <div className="energy-bar-track">
        {Array.from({ length: SEGMENTS }, (_, i) => {
          let segmentState = "energy-segment-empty";
          if (i < filledSegments) {
            segmentState = isFull && active ? "energy-segment-burst" : "energy-segment-filled";
          } else if (i === filledSegments && partialFill > 0) {
            segmentState = "energy-segment-partial";
          }

          return (
            <div key={i} className={`energy-segment ${segmentState}`}>
              {i === filledSegments && partialFill > 0 ? (
                <div
                  className="energy-segment-fill-inner"
                  style={{ width: `${partialFill * 100}%` }}
                />
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}
