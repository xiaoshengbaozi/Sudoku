import { type ReactNode, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { BarChart3, Check, Crown, Eraser, Moon, Pencil, RotateCcw, Settings2, Sun, Trophy, X } from "lucide-react";
import {
  type Board,
  type Difficulty,
  generateSudokuPuzzle,
  validateMove,
} from "./sudoku";
import {
  type Achievement,
  type AchievementMap,
  type GameStats,
  ACHIEVEMENTS,
  checkAchievements,
  loadAchievements,
  loadStats,
  saveAchievements,
  saveStats,
} from "./storage";

type CellCoord = { row: number; col: number };
type Theme = "dark" | "light";
type CompletedUnitType = "row" | "col" | "box";
type CompletedUnitBurst = {
  id: number;
  type: CompletedUnitType;
  cells: CellCoord[];
};

const ENERGY_MAX = 100;
const ENERGY_GAIN = 10;

const difficulties: Difficulty[] = ["easy", "medium", "hard", "expert", "master"];
const difficultyLabel: Record<Difficulty, string> = {
  easy: "简单",
  medium: "中等",
  hard: "困难",
  expert: "专家",
  master: "大师",
};

function createEmptyNotes(): number[][][] {
  return Array.from({ length: 9 }, () =>
    Array.from({ length: 9 }, () => []),
  );
}

export function App() {
  const lastCorrectAt = useRef(0);
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
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [energy, setEnergy] = useState(0);
  const [energyFlash, setEnergyFlash] = useState(false);
  const [boardShake, setBoardShake] = useState(false);
  const [assistedCells, setAssistedCells] = useState<CellCoord[]>([]);
  const [bursts, setBursts] = useState<CompletedUnitBurst[]>([]);

  // New states: error count, notes mode, candidate notes, victory
  const [errorCount, setErrorCount] = useState(0);
  const [notesMode, setNotesMode] = useState(false);
  const [notes, setNotes] = useState<number[][][]>(createEmptyNotes);
  const [isComplete, setIsComplete] = useState(false);
  const [victoryDismissed, setVictoryDismissed] = useState(false);

  // Stats & achievements
  const [maxCombo, setMaxCombo] = useState(0);
  const [stats, setStats] = useState<GameStats>(loadStats);
  const [achievementMap, setAchievementMap] = useState<AchievementMap>(loadAchievements);
  const [newAchievement, setNewAchievement] = useState<Achievement | null>(null);
  const [showStats, setShowStats] = useState(false);
  const [showAchievements, setShowAchievements] = useState(false);

  useEffect(() => {
    setBoard(puzzle.puzzle);
    setSelected(null);
    setMistake(null);
    setScore(0);
    setCombo(0);
    setEnergy(0);
    setEnergyFlash(false);
    setBoardShake(false);
    setAssistedCells([]);
    lastCorrectAt.current = 0;
    setBursts([]);
    // Reset new states
    setErrorCount(0);
    setMaxCombo(0);
    setNotes(createEmptyNotes());
    setIsComplete(false);
    setVictoryDismissed(false);
    setNewAchievement(null);
  }, [puzzle]);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    window.localStorage.setItem("sudoku-theme", theme);
  }, [theme]);

  const selectedValue = selected ? board[selected.row][selected.col] : 0;
  const focusValue = selectedValue === 5 ? 5 : 0;

  const completedBoxes = useMemo(() => {
    const result: boolean[][] = Array.from({ length: 3 }, () => Array.from({ length: 3 }, () => false));
    for (let br = 0; br < 3; br += 1) {
      for (let bc = 0; bc < 3; bc += 1) {
        let complete = true;
        for (let r = br * 3; r < br * 3 + 3 && complete; r += 1) {
          for (let c = bc * 3; c < bc * 3 + 3; c += 1) {
            if (board[r][c] === 0) { complete = false; break; }
          }
        }
        result[br][bc] = complete;
      }
    }
    return result;
  }, [board]);

  const numberCounts = useMemo(() => {
    const counts = [0, 0, 0, 0, 0, 0, 0, 0, 0];
    for (let r = 0; r < 9; r += 1) {
      for (let c = 0; c < 9; c += 1) {
        const v = board[r][c];
        if (v >= 1 && v <= 9) counts[v - 1] += 1;
      }
    }
    return counts;
  }, [board]);

  function startNewGame(nextDifficulty = difficulty) {
    setDifficulty(nextDifficulty);
    setGameSeed((value) => value + 1);
  }

  function selectCell(row: number, col: number) {
    setSelected({ row, col });
  }

  function eraseCell() {
    if (!selected) return;
    const { row, col } = selected;
    if (puzzle.fixed[row][col]) return;

    if (notesMode) {
      // Erase all notes from the selected cell
      const nextNotes = notes.map((r) => r.map((c) => [...c]));
      nextNotes[row][col] = [];
      setNotes(nextNotes);
    } else {
      // Erase the value if it's a player-filled cell
      if (board[row][col] === 0) return;
      const nextBoard = board.map((r) => [...r]);
      nextBoard[row][col] = 0;
      setBoard(nextBoard);
    }
  }

  function toggleNoteInCell(row: number, col: number, value: number) {
    const nextNotes = notes.map((r) => r.map((c) => [...c]));
    const cellNotes = nextNotes[row][col];
    const idx = cellNotes.indexOf(value);
    if (idx >= 0) {
      cellNotes.splice(idx, 1);
    } else {
      cellNotes.push(value);
      cellNotes.sort((a, b) => a - b);
    }
    setNotes(nextNotes);
  }

  const checkComplete = useCallback((currentBoard: Board) => {
    for (let r = 0; r < 9; r += 1) {
      for (let c = 0; c < 9; c += 1) {
        if (currentBoard[r][c] !== puzzle.solution[r][c]) return false;
      }
    }
    return true;
  }, [puzzle.solution]);

  function playNumber(value: number) {
    if (!selected) return;

    const { row, col } = selected;
    if (puzzle.fixed[row][col]) return;

    // Notes mode: toggle candidate note
    if (notesMode) {
      if (board[row][col] !== 0) return;
      toggleNoteInCell(row, col, value);
      return;
    }

    if (board[row][col] !== 0) return;

    const isRuleValid = validateMove(board, row, col, value);
    const isSolutionValid = puzzle.solution[row][col] === value;

    if (!isRuleValid || !isSolutionValid) {
      setMistake({ row, col });
      setCombo(0);
      setErrorCount((c) => c + 1);
      lastCorrectAt.current = 0;
      playTone("mistake");
      setBoardShake(true);
      triggerMistakeFeedback();
      window.setTimeout(() => setBoardShake(false), 260);
      window.setTimeout(() => setMistake(null), 430);
      return;
    }

    // Clear notes for this cell since it's now filled
    const nextNotes = notes.map((r) => r.map((c) => [...c]));
    nextNotes[row][col] = [];

    const nextBoard = board.map((line) => [...line]);
    nextBoard[row][col] = value;
    const nextEnergy = Math.min(ENERGY_MAX, energy + ENERGY_GAIN);
    const energyReady = nextEnergy >= ENERGY_MAX;
    const nextAssistedCells = energyReady ? findCertainCells(nextBoard).slice(0, 3) : [];

    nextAssistedCells.forEach((cell) => {
      nextBoard[cell.row][cell.col] = puzzle.solution[cell.row][cell.col];
      nextNotes[cell.row][cell.col] = [];
    });

    const completedUnits = findNewlyCompletedUnits(board, nextBoard, row, col);
    const now = performance.now();
    const nextCombo = now - lastCorrectAt.current <= 2500 ? combo + 1 : 1;
    const multiplier = nextCombo <= 1 ? 1 : Math.min(8, 2 ** (nextCombo - 1));

    lastCorrectAt.current = now;
    setCombo(nextCombo);
    if (nextCombo > maxCombo) setMaxCombo(nextCombo);
    if (energyReady && nextAssistedCells.length > 0) {
      setEnergy(ENERGY_MAX);
      window.setTimeout(() => setEnergy(0), 520);
    } else {
      setEnergy(nextEnergy);
    }
    setScore((current) => current + 100 * multiplier + completedUnits.length * 250 + nextAssistedCells.length * 60);
    playTone(
      nextAssistedCells.length > 0 ? "energy" : completedUnits.length > 0 ? "complete" : nextCombo > 1 ? "combo" : "correct",
      nextCombo,
    );

    if (nextAssistedCells.length > 0) {
      setEnergyFlash(true);
      setAssistedCells(nextAssistedCells);
      window.setTimeout(() => setEnergyFlash(false), 760);
      window.setTimeout(() => setAssistedCells([]), 1100);
    }

    if (completedUnits.length > 0) {
      const burstId = Date.now();
      const nextBursts = completedUnits.map((unit, index) => ({ ...unit, id: burstId + index }));
      setBursts((current) => [...current, ...nextBursts]);
      window.setTimeout(() => {
        setBursts((current) => current.filter((burst) => !nextBursts.some((next) => next.id === burst.id)));
      }, 920);
    }

    // Check completion
    if (checkComplete(nextBoard)) {
      setIsComplete(true);
      setVictoryDismissed(false);

      // Save stats and check achievements
      setStats((prev) => {
        const updated: GameStats = {
          ...prev,
          totalGames: prev.totalGames + 1,
          totalWins: prev.totalWins + 1,
          winsByDifficulty: {
            ...prev.winsByDifficulty,
            [difficulty]: prev.winsByDifficulty[difficulty] + 1,
          },
          totalMistakes: prev.totalMistakes + errorCount,
          totalScore: prev.totalScore + score,
          bestScore: Math.max(prev.bestScore, score),
          bestCombo: Math.max(prev.bestCombo, maxCombo),
          perfectGames: prev.perfectGames + (errorCount === 0 ? 1 : 0),
        };
        saveStats(updated);

        setAchievementMap((achMap) => {
          const session = { difficulty, score, errors: errorCount, maxCombo };
          const newlyUnlocked = checkAchievements(achMap, updated, session);
          if (newlyUnlocked.length > 0) {
            saveAchievements(achMap);
            const ach = ACHIEVEMENTS.find((a) => a.id === newlyUnlocked[newlyUnlocked.length - 1]);
            if (ach) setNewAchievement(ach);
          }
          return { ...achMap };
        });

        return updated;
      });
    }

    setNotes(nextNotes);
    setBoard((current) => {
      const next = current.map((line) => [...line]);
      nextBoard.forEach((line, lineIndex) => {
        next[lineIndex] = [...line];
      });
      return next;
    });
  }

  return (
    <main className="safe-shell app-shell flex min-h-screen items-center justify-center px-4">
      <section className="flex w-full max-w-[430px] flex-col gap-5">
        <Header
          theme={theme}
          onThemeChange={setTheme}
          onOpenStats={() => setShowStats(true)}
          onOpenAchievements={() => setShowAchievements(true)}
        />

        <div className={`game-panel rounded-[2rem] p-4 shadow-glow backdrop-blur ${boardShake ? "board-shake" : ""}`}>
          <div className="mb-4 flex items-end justify-between gap-3">
            <div>
              <p className="muted-text text-sm font-medium">每日数独</p>
              <h1 className="text-5xl font-semibold leading-none tracking-normal">数独</h1>
            </div>
            <div className="flex items-center gap-2">
              <ErrorBadge count={errorCount} />
              <ScoreBadge score={score} combo={combo} />
              <button
                type="button"
                onClick={() => startNewGame()}
                aria-label="新游戏"
                className="primary-icon-button grid h-12 w-12 place-items-center rounded-full shadow-lg transition active:scale-95"
              >
                <RotateCcw size={20} strokeWidth={2.5} />
              </button>
            </div>
          </div>

          <div className="difficulty-tabs mb-4 grid grid-cols-5 gap-1.5 rounded-full p-1">
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

          <EnergyBar value={energy} active={energyFlash} />

          <SudokuBoard
            board={board}
            fixed={puzzle.fixed}
            selected={selected}
            selectedValue={selectedValue}
            focusValue={focusValue}
            solution={puzzle.solution}
            mistake={mistake}
            assistedCells={assistedCells}
            bursts={bursts}
            notes={notes}
            notesMode={notesMode}
            completedBoxes={completedBoxes}
            onSelect={selectCell}
          />
        </div>

        <Toolbar
          notesMode={notesMode}
          onToggleNotes={() => setNotesMode((v) => !v)}
          onErase={eraseCell}
        />
        <NumberPad onPress={playNumber} notesMode={notesMode} numberCounts={numberCounts} />

        {isComplete && !victoryDismissed ? (
          <VictoryOverlay
            score={score}
            errors={errorCount}
            difficulty={difficultyLabel[difficulty]}
            onNewGame={() => startNewGame()}
            onDismiss={() => setVictoryDismissed(true)}
          />
        ) : null}

        {showStats ? (
          <StatsModal
            stats={stats}
            onClose={() => setShowStats(false)}
          />
        ) : null}

        {showAchievements ? (
          <AchievementsModal
            achievements={achievementMap}
            onClose={() => setShowAchievements(false)}
          />
        ) : null}

        {newAchievement ? (
          <AchievementToast
            achievement={newAchievement}
            onDone={() => setNewAchievement(null)}
          />
        ) : null}
      </section>
    </main>
  );
}

function findNewlyCompletedUnits(board: Board, nextBoard: Board, row: number, col: number): Omit<CompletedUnitBurst, "id">[] {
  const units: Omit<CompletedUnitBurst, "id">[] = [];
  const boxRow = Math.floor(row / 3) * 3;
  const boxCol = Math.floor(col / 3) * 3;
  const candidates = [
    {
      type: "row" as const,
      cells: Array.from({ length: 9 }, (_, index) => ({ row, col: index })),
    },
    {
      type: "col" as const,
      cells: Array.from({ length: 9 }, (_, index) => ({ row: index, col })),
    },
    {
      type: "box" as const,
      cells: Array.from({ length: 9 }, (_, index) => ({
        row: boxRow + Math.floor(index / 3),
        col: boxCol + (index % 3),
      })),
    },
  ];

  candidates.forEach((unit) => {
    const wasComplete = unit.cells.every((cell) => board[cell.row][cell.col] !== 0);
    const isComplete = unit.cells.every((cell) => nextBoard[cell.row][cell.col] !== 0);
    if (!wasComplete && isComplete) units.push(unit);
  });

  return units;
}

function findCertainCells(board: Board): CellCoord[] {
  const certainCells: CellCoord[] = [];

  board.forEach((row, rowIndex) => {
    row.forEach((value, colIndex) => {
      if (value !== 0) return;

      const candidates = Array.from({ length: 9 }, (_, index) => index + 1).filter((candidate) =>
        validateMove(board, rowIndex, colIndex, candidate),
      );

      if (candidates.length === 1) {
        certainCells.push({ row: rowIndex, col: colIndex });
      }
    });
  });

  return certainCells;
}

function triggerMistakeFeedback() {
  const vibrate = (navigator as Navigator & { vibrate?: (pattern: number | number[]) => boolean }).vibrate;
  vibrate?.call(navigator, 35);
}

let sharedAudioContext: AudioContext | null = null;

function playTone(kind: "correct" | "complete" | "combo" | "energy" | "mistake", combo = 1) {
  const AudioContextClass =
    window.AudioContext ||
    (window as Window & typeof globalThis & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioContextClass) return;

  const context = (sharedAudioContext ??= new AudioContextClass());
  const now = context.currentTime;
  const gain = context.createGain();
  gain.connect(context.destination);
  gain.gain.setValueAtTime(0.0001, now);

  if (context.state === "suspended") {
    context.resume().catch(() => undefined);
  }

  const tone = (frequency: number, start: number, duration: number, volume = 0.08) => {
    const oscillator = context.createOscillator();
    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(frequency, now + start);
    oscillator.connect(gain);
    gain.gain.exponentialRampToValueAtTime(volume, now + start + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + start + duration);
    oscillator.start(now + start);
    oscillator.stop(now + start + duration + 0.02);
  };

  if (kind === "mistake") {
    tone(150, 0, 0.14, 0.06);
    return;
  }

  const comboLift = Math.min(combo, 6) * 42;
  const base = kind === "energy" ? 760 : kind === "complete" ? 620 + comboLift : 440 + comboLift;
  tone(base, 0, 0.11);
  tone(base * 1.25, 0.08, 0.12, kind === "complete" ? 0.1 : 0.07);
  if (kind === "energy") tone(base * 1.62, 0.17, 0.16, 0.1);
  if (kind === "complete" || combo > 2) tone(base * 1.5, 0.18, 0.14, 0.08);
}

function EnergyBar({ value, active }: { value: number; active: boolean }) {
  return (
    <div className={`energy-meter mb-4 rounded-2xl p-2 ${active ? "energy-meter-active" : ""}`}>
      <div className="mb-1 flex items-center justify-between px-1 text-xs font-bold">
        <span>能量</span>
        <span>{value}%</span>
      </div>
      <div className="energy-track h-2 overflow-hidden rounded-full">
        <div className="energy-fill h-full rounded-full" style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

function ErrorBadge({ count }: { count: number }) {
  if (count === 0) return null;
  return (
    <div className="error-badge relative flex h-12 min-w-[3.6rem] flex-col items-center justify-center rounded-2xl px-3 text-center">
      <span className="text-[0.65rem] font-semibold leading-none">错误</span>
      <span className="text-base font-black leading-tight text-red-400">{count}</span>
    </div>
  );
}

function ScoreBadge({ score, combo }: { score: number; combo: number }) {
  return (
    <div className="score-badge relative flex h-12 min-w-[5.6rem] flex-col items-center justify-center rounded-2xl px-3 text-center">
      <span className="text-[0.65rem] font-semibold leading-none">分数</span>
      <span className="text-base font-black leading-tight">{score}</span>
      {combo > 1 ? <span className="combo-pop absolute -mt-14 rounded-full px-2 py-1 text-xs font-black">COMBO x{combo}</span> : null}
    </div>
  );
}

function Header({
  theme,
  onThemeChange,
  onOpenStats,
  onOpenAchievements,
}: {
  theme: Theme;
  onThemeChange: (theme: Theme) => void;
  onOpenStats: () => void;
  onOpenAchievements: () => void;
}) {
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
        <IconButton label="统计" onClick={onOpenStats}>
          <BarChart3 size={20} />
        </IconButton>
        <IconButton label="成就" onClick={onOpenAchievements}>
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
  focusValue,
  solution,
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
  solution: Board;
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
          const isFocusTarget = focusValue !== 0 && value === 0 && solution[rowIndex][colIndex] === focusValue;
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
                isFocusTarget ? "focus-target-cell" : "",
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

function Toolbar({
  notesMode,
  onToggleNotes,
  onErase,
}: {
  notesMode: boolean;
  onToggleNotes: () => void;
  onErase: () => void;
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
    </div>
  );
}

function NumberPad({ onPress, notesMode, numberCounts }: { onPress: (value: number) => void; notesMode: boolean; numberCounts: number[] }) {
  return (
    <div className={`number-pad grid grid-cols-9 gap-2 rounded-[1.7rem] p-2 shadow-glow ${notesMode ? "number-pad-notes" : ""}`}>
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
            className={`number-button aspect-square rounded-2xl text-xl font-black shadow-lg transition active:scale-90 ${
              notesMode ? "number-button-notes" : ""
            } ${isDone ? "number-button-done" : ""}`}
          >
            {isDone ? (
              <Check size={20} strokeWidth={3} />
            ) : (
              <span className="flex flex-col items-center leading-none">
                <span className="number-main">{value}</span>
                <span className="number-remaining">{remaining}</span>
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

function VictoryOverlay({
  score,
  errors,
  difficulty,
  onNewGame,
  onDismiss,
}: {
  score: number;
  errors: number;
  difficulty: string;
  onNewGame: () => void;
  onDismiss: () => void;
}) {
  return (
    <div className="victory-overlay fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
      <div className="victory-card w-full max-w-[360px] rounded-[2rem] p-8 text-center shadow-glow animate-victory-pop">
        <div className="mb-4 text-6xl">🎉</div>
        <h2 className="mb-1 text-2xl font-black">恭喜完成!</h2>
        <p className="muted-text mb-6 text-sm font-medium">{difficulty} 难度</p>
        <div className="mb-6 grid grid-cols-2 gap-3">
          <div className="victory-stat rounded-2xl p-3">
            <p className="text-xs font-semibold muted-text">得分</p>
            <p className="text-xl font-black">{score}</p>
          </div>
          <div className="victory-stat rounded-2xl p-3">
            <p className="text-xs font-semibold muted-text">错误</p>
            <p className="text-xl font-black">{errors}</p>
          </div>
        </div>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onDismiss}
            className="flex-1 h-11 rounded-full text-sm font-semibold muted-text transition hover:bg-white/10 active:scale-95"
          >
            继续查看
          </button>
          <button
            type="button"
            onClick={onNewGame}
            className="flex-1 h-11 rounded-full bg-[#ff6b4a] text-white text-sm font-semibold shadow-lg shadow-[#ff6b4a]/30 transition active:scale-95"
          >
            再来一局
          </button>
        </div>
      </div>
    </div>
  );
}

function StatsModal({ stats, onClose }: { stats: GameStats; onClose: () => void }) {
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
                {({ easy: "简单", medium: "中等", hard: "困难", expert: "专家", master: "大师" } as Record<string, string>)[d]}
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

function AchievementsModal({
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

function AchievementToast({
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
