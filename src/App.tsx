import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { RotateCcw } from "lucide-react";
import type { Board, Difficulty } from "./sudoku";
import { generateSudokuPuzzle, validateMove } from "./sudoku";
import type { Achievement, AchievementMap, GameStats } from "./storage";
import { ACHIEVEMENTS, checkAchievements, loadAchievements, loadStats, saveAchievements, saveStats } from "./storage";
import type { CellCoord, Theme, CompletedUnitBurst } from "./types";
import { ENERGY_MAX, ENERGY_GAIN, difficulties, difficultyLabel } from "./constants";
import { playTone, triggerMistakeFeedback } from "./audio";
import { createEmptyNotes, findCertainCells, findNewlyCompletedUnits } from "./utils";

import { Header } from "./components/Header";
import { EnergyBar } from "./components/EnergyBar";
import { ErrorBadge } from "./components/ErrorBadge";
import { ScoreBadge } from "./components/ScoreBadge";
import { SudokuBoard } from "./components/SudokuBoard";
import { Toolbar } from "./components/Toolbar";
import { NumberPad } from "./components/NumberPad";
import { VictoryOverlay } from "./components/VictoryOverlay";
import { StatsModal } from "./components/StatsModal";
import { AchievementsModal } from "./components/AchievementsModal";
import { AchievementToast } from "./components/AchievementToast";

export function App() {
  const lastCorrectAt = useRef(0);
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window === "undefined") return "light";
    return window.localStorage.getItem("sudoku-theme") === "dark" ? "dark" : "light";
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

  const [errorCount, setErrorCount] = useState(0);
  const [notesMode, setNotesMode] = useState(false);
  const [notes, setNotes] = useState<number[][][]>(createEmptyNotes);
  const [isComplete, setIsComplete] = useState(false);
  const [victoryDismissed, setVictoryDismissed] = useState(false);

  const [maxCombo, setMaxCombo] = useState(0);
  const [stats, setStats] = useState<GameStats>(loadStats);
  const [achievementMap, setAchievementMap] = useState<AchievementMap>(loadAchievements);
  const [newAchievement, setNewAchievement] = useState<Achievement | null>(null);
  const [hintsRemaining, setHintsRemaining] = useState(3);
  const [showStats, setShowStats] = useState(false);
  const [showAchievements, setShowAchievements] = useState(false);

  const [soundEnabled, setSoundEnabled] = useState(() => {
    if (typeof window === "undefined") return true;
    return window.localStorage.getItem("sudoku-sound") !== "false";
  });
  const [vibrationEnabled, setVibrationEnabled] = useState(() => {
    if (typeof window === "undefined") return true;
    return window.localStorage.getItem("sudoku-vibration") !== "false";
  });

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
    setErrorCount(0);
    setMaxCombo(0);
    setNotes(createEmptyNotes());
    setIsComplete(false);
    setVictoryDismissed(false);
    setNewAchievement(null);
    setHintsRemaining(3);
  }, [puzzle]);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    window.localStorage.setItem("sudoku-theme", theme);
  }, [theme]);

  useEffect(() => {
    window.localStorage.setItem("sudoku-sound", String(soundEnabled));
  }, [soundEnabled]);

  useEffect(() => {
    window.localStorage.setItem("sudoku-vibration", String(vibrationEnabled));
  }, [vibrationEnabled]);

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

  const checkComplete = useCallback((currentBoard: Board) => {
    for (let r = 0; r < 9; r += 1) {
      for (let c = 0; c < 9; c += 1) {
        if (currentBoard[r][c] !== puzzle.solution[r][c]) return false;
      }
    }
    return true;
  }, [puzzle.solution]);

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
      const nextNotes = notes.map((r) => r.map((c) => [...c]));
      nextNotes[row][col] = [];
      setNotes(nextNotes);
    } else {
      if (board[row][col] === 0) return;
      const nextBoard = board.map((r) => [...r]);
      nextBoard[row][col] = 0;
      setBoard(nextBoard);
    }
  }

  function useHint() {
    if (hintsRemaining <= 0) return;

    let target: CellCoord | null = null;
    if (selected && board[selected.row][selected.col] === 0 && !puzzle.fixed[selected.row][selected.col]) {
      target = selected;
    } else {
      for (let r = 0; r < 9 && !target; r += 1) {
        for (let c = 0; c < 9 && !target; c += 1) {
          if (board[r][c] === 0 && !puzzle.fixed[r][c]) {
            target = { row: r, col: c };
          }
        }
      }
    }
    if (!target) return;

    setHintsRemaining((h) => h - 1);

    const nextNotes = notes.map((r) => r.map((c) => [...c]));
    nextNotes[target.row][target.col] = [];

    const nextBoard = board.map((r) => [...r]);
    nextBoard[target.row][target.col] = puzzle.solution[target.row][target.col];

    setNotes(nextNotes);
    setBoard(nextBoard);
    setSelected(target);

    if (checkComplete(nextBoard)) {
      setIsComplete(true);
      setVictoryDismissed(false);
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

  function playNumber(value: number) {
    if (!selected) return;

    const { row, col } = selected;
    if (puzzle.fixed[row][col]) return;

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
      if (soundEnabled) playTone("mistake");
      setBoardShake(true);
      if (vibrationEnabled) triggerMistakeFeedback();
      window.setTimeout(() => setBoardShake(false), 260);
      window.setTimeout(() => setMistake(null), 430);
      return;
    }

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
    if (soundEnabled) {
      playTone(
        nextAssistedCells.length > 0 ? "energy" : completedUnits.length > 0 ? "complete" : nextCombo > 1 ? "combo" : "correct",
        nextCombo,
      );
    }

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

    if (checkComplete(nextBoard)) {
      setIsComplete(true);
      setVictoryDismissed(false);

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
          soundEnabled={soundEnabled}
          vibrationEnabled={vibrationEnabled}
          onToggleSound={() => setSoundEnabled((v) => !v)}
          onToggleVibration={() => setVibrationEnabled((v) => !v)}
          onOpenStats={() => setShowStats(true)}
          onOpenAchievements={() => setShowAchievements(true)}
        />

        <div className={`game-panel rounded-[2rem] p-4 shadow-glow backdrop-blur ${boardShake ? "board-shake" : ""}`}>
          <div className="mb-4 flex items-end justify-between gap-3">
            <div>
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
          hintsRemaining={hintsRemaining}
          onToggleNotes={() => setNotesMode((v) => !v)}
          onErase={eraseCell}
          onHint={useHint}
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
