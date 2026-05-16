import { Check } from "lucide-react";

export function NumberPad({
  onPress,
  notesMode,
  numberCounts,
}: {
  onPress: (value: number) => void;
  notesMode: boolean;
  numberCounts: number[];
}) {
  return (
    <div className={`number-pad grid grid-cols-9 gap-1.5 rounded-[1.8rem] p-3 shadow-glow ${notesMode ? "number-pad-notes" : ""}`}>
      {Array.from({ length: 9 }, (_, index) => index + 1).map((value) => {
        const count = numberCounts[value - 1];
        const isDone = count >= 9;
        const remaining = 9 - count;

        return (
          <button
            key={value}
            type="button"
            onClick={() => onPress(value)}
            disabled={isDone}
            className={`number-button aspect-square rounded-full text-xl font-black shadow-md transition active:scale-90 ${
              notesMode ? "number-button-notes" : ""
            } ${isDone ? "number-button-done" : ""}`}
          >
            {isDone ? (
              <Check size={22} strokeWidth={3} />
            ) : (
              <span className="flex flex-col items-center leading-none">
                <span className="number-main">{value}</span>
                {remaining > 0 ? (
                  <span className="number-remaining">{remaining}</span>
                ) : null}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
