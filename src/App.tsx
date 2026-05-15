import { type ReactNode, useEffect, useMemo, useState } from "react";
import { BarChart3, Check, Crown, Moon, RotateCcw, Settings2, Sun, Trophy } from "lucide-react";
import {
  type Board,
  type Difficulty,
  generateSudokuPuzzle,
  validateMove,
} from "./sudoku";

type CellCoord = { row: number; col: number };
type Theme = "dark" | "light";

const difficulties: Difficulty[] = ["easy", "medium", "hard"];
const difficultyLabel: Record<Difficulty, string> = {
  easy: "简单",
  medium: "中等",
  hard: "困难",
};

export function App() {
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window === "undefined") return "dark";
    return window.localStorage.getItem("sudoku-theme") === "light" ? "light" : "dark";
  });
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

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    window.localStorage.setItem("sudoku-theme", theme);
  }, [theme]);

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
    <main className="safe-shell app-shell flex min-h-screen items-center justify-center px-4">
      <section className="flex w-full max-w-[430px] flex-col gap-5">
        <Header theme={theme} onThemeChange={setTheme} />

        <div className="game-panel rounded-[2rem] p-4 shadow-glow backdrop-blur">
          <div className="mb-4 flex items-end justify-between gap-3">
            <div>
              <p className="muted-text text-sm font-medium">每日数独</p>
              <h1 className="text-5xl font-semibold leading-none tracking-normal">数独</h1>
            </div>
            <button
              type="button"
              onClick={() => startNewGame()}
              aria-label="新游戏"
              className="primary-icon-button grid h-12 w-12 place-items-center rounded-full shadow-lg transition active:scale-95"
            >
              <RotateCcw size={20} strokeWidth={2.5} />
            </button>
          </div>

          <div className="difficulty-tabs mb-4 grid grid-cols-3 gap-2 rounded-full p-1">
            {difficulties.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => startNewGame(item)}
                className={`h-10 rounded-full text-sm font-semibold transition ${
                  item === difficulty ? "active-difficulty" : "inactive-difficulty"
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

function Header({ theme, onThemeChange }: { theme: Theme; onThemeChange: (theme: Theme) => void }) {
  const [settingsOpen, setSettingsOpen] = useState(false);

  return (
    <div className="relative flex items-center justify-between px-1">
      <div className="flex items-center gap-3">
        <div className="grid h-12 w-12 place-items-center rounded-full bg-[#ff6b4a] text-white shadow-lg shadow-[#ff6b4a]/30">
          <Crown size={22} fill="currentColor" />
        </div>
        <div className="leading-tight">
          <p className="text-lg font-bold">准备开始</p>
          <p className="subtle-text text-xs font-medium">移动端应用</p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <IconButton label="统计">
          <BarChart3 size={20} />
        </IconButton>
        <IconButton label="成就">
          <Trophy size={20} />
        </IconButton>
        <IconButton
          label={settingsOpen ? "关闭设置" : "打开设置"}
          onClick={() => setSettingsOpen((value) => !value)}
          pressed={settingsOpen}
        >
          <Settings2 size={20} />
        </IconButton>
      </div>

      {settingsOpen ? (
        <div className="settings-menu absolute right-1 top-14 z-20 w-44 rounded-2xl p-2 shadow-glow">
          <p className="muted-text px-3 pb-2 pt-1 text-xs font-semibold">显示模式</p>
          <ThemeOption
            active={theme === "dark"}
            icon={<Moon size={17} />}
            label="深色模式"
            onClick={() => {
              onThemeChange("dark");
              setSettingsOpen(false);
            }}
          />
          <ThemeOption
            active={theme === "light"}
            icon={<Sun size={17} />}
            label="亮色模式"
            onClick={() => {
              onThemeChange("light");
              setSettingsOpen(false);
            }}
          />
        </div>
      ) : null}
    </div>
  );
}

function IconButton({
  label,
  children,
  onClick,
  pressed,
}: {
  label: string;
  children: ReactNode;
  onClick?: () => void;
  pressed?: boolean;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={pressed}
      title={label}
      onClick={onClick}
      className="toolbar-button grid h-11 w-11 place-items-center rounded-full transition active:scale-95"
    >
      {children}
    </button>
  );
}

function ThemeOption({
  active,
  icon,
  label,
  onClick,
}: {
  active: boolean;
  icon: ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`theme-option flex h-10 w-full items-center justify-between rounded-xl px-3 text-sm font-semibold transition ${
        active ? "theme-option-active" : ""
      }`}
    >
      <span className="flex items-center gap-2">
        {icon}
        {label}
      </span>
      {active ? <Check size={16} strokeWidth={2.5} /> : null}
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
                isSelected ? "selected-cell z-10 shadow-danger" : "",
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
    <div className="number-pad grid grid-cols-9 gap-2 rounded-[1.7rem] p-2 shadow-glow">
      {Array.from({ length: 9 }, (_, index) => index + 1).map((value) => (
        <button
          key={value}
          type="button"
          onClick={() => onPress(value)}
          className="number-button aspect-square rounded-2xl text-xl font-black shadow-lg transition active:scale-90"
        >
          {value}
        </button>
      ))}
    </div>
  );
}
