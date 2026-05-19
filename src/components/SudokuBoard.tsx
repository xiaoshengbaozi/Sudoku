import type { Board } from "../sudoku";
import type { CellCoord, CompletedUnitBurst } from "../types";

export function SudokuBoard({
  board,
  fixed,
  selected,
  selectedValue,
  focusValue,
  mistake,
  assistedCells,
  bursts,
  notes,
  notesMode,
  completedBoxes,
  onSelect,
}: {
  board: Board;
  fixed: boolean[][];
  selected: CellCoord | null;
  selectedValue: number;
  focusValue: number;
  mistake: CellCoord | null;
  assistedCells: CellCoord[];
  bursts: CompletedUnitBurst[];
  notes: number[][][];
  notesMode: boolean;
  completedBoxes: boolean[][];
  onSelect: (row: number, col: number) => void;
}) {
  return (
    <div className="sudoku-board grid aspect-square overflow-hidden rounded-2xl border-2">
      {board.map((row, rowIndex) =>
        row.map((value, colIndex) => {
          const isSelected = selected?.row === rowIndex && selected?.col === colIndex;
          const isPeer =
            selected &&
            (selected.row === rowIndex ||
              selected.col === colIndex ||
              (Math.floor(selected.row / 3) === Math.floor(rowIndex / 3) &&
                Math.floor(selected.col / 3) === Math.floor(colIndex / 3)));
          const isSameValue = value !== 0 && value === selectedValue;
          const isMistake = mistake?.row === rowIndex && mistake?.col === colIndex;
          const isFocusedValue = focusValue !== 0 && value === focusValue;
          const isAssisted = assistedCells.some((cell) => cell.row === rowIndex && cell.col === colIndex);
          const isBurstCell = bursts.some((burst) =>
            burst.cells.some((cell) => cell.row === rowIndex && cell.col === colIndex),
          );
          const cellNotes = notes[rowIndex][colIndex];
          const showNotes = value === 0 && cellNotes.length > 0;
          const isNotesModeHighlight = notesMode && isSelected;
          const isInCompletedBox = completedBoxes[Math.floor(rowIndex / 3)][Math.floor(colIndex / 3)];

          return (
            <button
              key={`${rowIndex}-${colIndex}`}
              type="button"
              onClick={() => onSelect(rowIndex, colIndex)}
              className={[
                "sudoku-cell relative grid min-h-0 min-w-0 place-items-center text-[clamp(1.05rem,7vw,1.7rem)] font-semibold transition",
                colIndex === 2 || colIndex === 5 ? "border-r-2" : "border-r",
                rowIndex === 2 || rowIndex === 5 ? "border-b-2" : "border-b",
                fixed[rowIndex][colIndex] ? "fixed-cell" : "player-cell",
                isPeer ? "peer-cell" : "",
                isSameValue ? "same-value-cell" : "",
                isFocusedValue ? "focused-value-cell" : "",
                isAssisted ? "assisted-cell" : "",
                isBurstCell ? "unit-burst-cell" : "",
                isSelected && !isNotesModeHighlight ? "selected-cell" : "",
                isNotesModeHighlight ? "notes-mode-cell" : "",
                isMistake ? "cell-flash" : "",
                isInCompletedBox && !isSelected ? "completed-box-cell" : "",
              ].join(" ")}
            >
              {showNotes ? (
                <div className="notes-grid absolute inset-0 grid grid-cols-3 grid-rows-3 p-[2px]">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
                    <span
                      key={n}
                      className={`flex items-center justify-center text-[clamp(0.45rem,3vw,0.65rem)] font-medium leading-none ${
                        cellNotes.includes(n) ? "note-visible" : "note-hidden"
                      }`}
                    >
                      {n}
                    </span>
                  ))}
                </div>
              ) : (
                value || ""
              )}
            </button>
          );
        }),
      )}
    </div>
  );
}
