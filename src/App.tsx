import { type ReactNode, useEffect, useMemo, useState } from "react";
import { BarChart3, Crown, RotateCcw, Settings2, Trophy } from "lucide-react";
import {
  type Board,
  type Difficulty,
  generateSudokuPuzzle,
  validateMove,
} from "./sudoku";

type CellCoord = { row: number; col: number };

const difficulties: Difficulty[] = ["easy", "medium", "hard"];
const difficultyLabel: Record<Difficulty, string> = {
  easy: "Easy",
  medium: "Medium",
  hard: "Hard",
};

export function App() {
  const [difficulty, setDifficulty] = useState<Difficulty>("medium");
  const [gameSeed, setGameSeed] = useState(0);
  const puzzle = useMemo(() => generateSudokuPuzzle(difficulty), [difficulty, gameSeed]);
  const [board, setBoard] = useState<Board>(puzzle.puzzle);
  const [selected, setSelected] = useState<CellCoord | null>(null);
  const [mistake, setMistake] = useState<CellCoord | null>(null);

  useEffect(() => {
    setBoard(puzzle.puzzle);
    setSelected(null);
    setMistake(null);
  }, [puzzle]);

  const selectedValue = selected ? board[selected.row][selected.col] : 0;

  function startNewGame(nextDifficulty = difficulty) {
    setDifficulty(nextDifficulty);
    setGameSeed((value) => value + 1);
  }

  function selectCell(row: number, col: number) {
    if (puzzle.fixed[row][col]) return;
    setSelected({ row, col });
  }

  function playNumber(value: number) {
    if (!selected) return;

    const { row, col } = selected;
    if (puzzle.fixed[row][col]) return;

    const isRuleValid = validateMove(board, row, col, value);
    const isSolutionValid = puzzle.solution[row][col] === value;

    if (!isRuleValid || !isSolutionValid) {
      setMistake({ row, col });
      window.setTimeout(() => setMistake(null), 430);
      return;
    }

    setBoard((current) => {
      const next = current.map((line) => [...line]);
      next[row][col] = value;
      return next;
    });
  }

  return (
    <main className="safe-shell flex min-h-screen items-center justify-center px-4 text-zinc-50">
      <section className="flex w-full max-w-[430px] flex-col gap-5">
        <Header />

        <div className="rounded-[2rem] bg-white/[0.06] p-4 shadow-glow ring-1 ring-white/[0.08] backdrop-blur">
          <div className="mb-4 flex items-end justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-zinc-400">Daily puzzle</p>
              <h1 className="text-5xl font-semibold leading-none tracking-normal">Sudoku</h1>
            </div>
            <button
              type="button"
              onClick={() => startNewGame()}
              aria-label="New game"
              className="grid h-12 w-12 place-items-center rounded-full bg-zinc-50 text-zinc-950 shadow-lg shadow-black/25 transition active:scale-95"
            >
              <RotateCcw size={20} strokeWidth={2.5} />
            </button>
          </div>

          <div className="mb-4 grid grid-cols-3 gap-2 rounded-full bg-black/30 p-1">
            {difficulties.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => startNewGame(item)}
                className={`h-10 rounded-full text-sm font-semibold transition ${
                  item === difficulty
                    ? "bg-[#ff6b4a] text-white shadow-lg shadow-[#ff6b4a]/25"
                    : "text-zinc-400 active:bg-white/10"
                }`}
              >
                {difficultyLabel[item]}
              </button>
            ))}
          </div>

          <SudokuBoard
            board={board}
            fixed={puzzle.fixed}
            selected={selected}
            selectedValue={selectedValue}
            mistake={mistake}
            onSelect={selectCell}
          />
        </div>

        <NumberPad onPress={playNumber} />
      </section>
    </main>
  );
}

function Header() {
  return (
    <div className="flex items-center justify-between px-1">
      <div className="flex items-center gap-3">
        <div className="grid h-12 w-12 place-items-center rounded-full bg-[#ff6b4a] text-white shadow-lg shadow-[#ff6b4a]/30">
          <Crown size={22} fill="currentColor" />
        </div>
        <div className="leading-tight">
          <p className="text-lg font-bold">Ready</p>
          <p className="text-xs font-medium text-zinc-500">Mobile PWA</p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <IconButton label="Stats">
          <BarChart3 size={20} />
        </IconButton>
        <IconButton label="Achievements">
          <Trophy size={20} />
        </IconButton>
        <IconButton label="Settings">
          <Settings2 size={20} />
        </IconButton>
      </div>
    </div>
  );
}

function IconButton({ label, children }: { label: string; children: ReactNode }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className="grid h-11 w-11 place-items-center rounded-full bg-white/[0.08] text-zinc-200 ring-1 ring-white/[0.07] transition active:scale-95 active:bg-white/[0.14]"
    >
      {children}
    </button>
  );
}

function SudokuBoard({
  board,
  fixed,
  selected,
  selectedValue,
  mistake,
  onSelect,
}: {
  board: Board;
  fixed: boolean[][];
  selected: CellCoord | null;
  selectedValue: number;
  mistake: CellCoord | null;
  onSelect: (row: number, col: number) => void;
}) {
  return (
    <div className="sudoku-board grid aspect-square overflow-hidden rounded-2xl border-2 border-zinc-100/90 bg-zinc-950">
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

          return (
            <button
              key={`${rowIndex}-${colIndex}`}
              type="button"
              onClick={() => onSelect(rowIndex, colIndex)}
              className={[
                "relative grid min-h-0 min-w-0 place-items-center border-white/[0.08] text-[clamp(1.05rem,7vw,1.7rem)] font-semibold transition",
                colIndex === 2 || colIndex === 5 ? "border-r-2 border-r-zinc-100/90" : "border-r",
                rowIndex === 2 || rowIndex === 5 ? "border-b-2 border-b-zinc-100/90" : "border-b",
                fixed[rowIndex][colIndex] ? "text-zinc-50" : "text-[#ffb199]",
                isPeer ? "bg-white/[0.055]" : "bg-white/[0.025]",
                isSameValue ? "bg-[#ff6b4a]/20" : "",
                isSelected ? "z-10 bg-[#ff6b4a]/95 text-white shadow-danger" : "",
                isMistake ? "cell-flash" : "",
              ].join(" ")}
            >
              {value || ""}
            </button>
          );
        }),
      )}
    </div>
  );
}

function NumberPad({ onPress }: { onPress: (value: number) => void }) {
  return (
    <div className="grid grid-cols-9 gap-2 rounded-[1.7rem] bg-white/[0.07] p-2 shadow-glow ring-1 ring-white/[0.08]">
      {Array.from({ length: 9 }, (_, index) => index + 1).map((value) => (
        <button
          key={value}
          type="button"
          onClick={() => onPress(value)}
          className="aspect-square rounded-2xl bg-zinc-50 text-xl font-black text-zinc-950 shadow-lg shadow-black/25 transition active:scale-90 active:bg-[#ff6b4a] active:text-white"
        >
          {value}
        </button>
      ))}
    </div>
  );
}
