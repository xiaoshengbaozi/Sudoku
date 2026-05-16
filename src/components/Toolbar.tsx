import { Eraser, Lightbulb, Pencil } from "lucide-react";

export function Toolbar({
  notesMode,
  hintsRemaining,
  onToggleNotes,
  onErase,
  onHint,
}: {
  notesMode: boolean;
  hintsRemaining: number;
  onToggleNotes: () => void;
  onErase: () => void;
  onHint: () => void;
}) {
  return (
    <div className="toolbar-row flex items-center justify-center gap-3">
      <button
        type="button"
        onClick={onErase}
        aria-label="橡皮擦"
        className={`toolbar-action flex h-11 items-center gap-2 rounded-full px-5 shadow-lg transition active:scale-95 ${
          notesMode ? "toolbar-action-ghost" : "primary-icon-button"
        }`}
      >
        <Eraser size={18} strokeWidth={2.5} />
        <span className="text-sm font-semibold">橡皮擦</span>
      </button>
      <button
        type="button"
        onClick={onToggleNotes}
        aria-label={notesMode ? "关闭笔记模式" : "打开笔记模式"}
        aria-pressed={notesMode}
        className={`toolbar-action flex h-11 items-center gap-2 rounded-full px-5 shadow-lg transition active:scale-95 ${
          notesMode ? "notes-mode-active" : "primary-icon-button"
        }`}
      >
        <Pencil size={18} strokeWidth={2.5} />
        <span className="text-sm font-semibold">笔记</span>
      </button>
      <button
        type="button"
        onClick={onHint}
        disabled={hintsRemaining <= 0}
        aria-label="提示"
        className={`toolbar-action flex h-11 items-center gap-2 rounded-full px-5 shadow-lg transition active:scale-95 ${
          hintsRemaining <= 0 ? "hint-button-empty" : "primary-icon-button"
        }`}
      >
        <Lightbulb size={18} strokeWidth={2.5} />
        <span className="text-sm font-semibold">提示</span>
        <span className={`hint-count ${hintsRemaining <= 0 ? "hint-count-zero" : ""}`}>
          {hintsRemaining}
        </span>
      </button>
    </div>
  );
}
