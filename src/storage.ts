import type { Difficulty } from "./sudoku";

// ---- Types ----

export interface GameStats {
  totalGames: number;
  totalWins: number;
  winsByDifficulty: Record<Difficulty, number>;
  totalMistakes: number;
  totalScore: number;
  bestScore: number;
  bestCombo: number;
  perfectGames: number;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
}

export interface AchievementState {
  unlocked: boolean;
  unlockedAt: string | null; // ISO date
}

export type AchievementMap = Record<string, AchievementState>;

// ---- Defaults ----

function defaultStats(): GameStats {
  return {
    totalGames: 0,
    totalWins: 0,
    winsByDifficulty: { easy: 0, medium: 0, hard: 0, expert: 0, master: 0 },
    totalMistakes: 0,
    totalScore: 0,
    bestScore: 0,
    bestCombo: 0,
    perfectGames: 0,
  };
}

// ---- Achievement Definitions ----

export const ACHIEVEMENTS: Achievement[] = [
  { id: "first_game", title: "初次尝试", description: "完成第 1 局游戏", icon: "🎮" },
  { id: "five_games", title: "数独新手", description: "累计完成 5 局游戏", icon: "🌟" },
  { id: "twenty_games", title: "数独达人", description: "累计完成 20 局游戏", icon: "🏆" },
  { id: "perfect", title: "完美主义", description: "一局游戏零失误通关", icon: "💎" },
  { id: "combo_master", title: "连击大师", description: "达成 COMBO x8", icon: "🔥" },
  { id: "win_easy", title: "热身完毕", description: "通关简单难度", icon: "✅" },
  { id: "win_medium", title: "渐入佳境", description: "通关中等难度", icon: "📈" },
  { id: "win_hard", title: "迎难而上", description: "通关困难难度", icon: "💪" },
  { id: "win_expert", title: "数独专家", description: "通关专家难度", icon: "🧠" },
  { id: "win_master", title: "大师风范", description: "通关大师难度", icon: "👑" },
  { id: "high_score", title: "高分玩家", description: "单局得分超过 5000", icon: "💰" },
  { id: "perfect_hard", title: "零失误挑战", description: "困难及以上难度零失误通关", icon: "🎯" },
];

// ---- Persistence ----

const STATS_KEY = "sudoku-stats";
const ACHIEVEMENTS_KEY = "sudoku-achievements";

export function loadStats(): GameStats {
  try {
    const raw = window.localStorage.getItem(STATS_KEY);
    if (!raw) return defaultStats();
    return { ...defaultStats(), ...JSON.parse(raw) };
  } catch {
    return defaultStats();
  }
}

export function saveStats(stats: GameStats): void {
  try {
    window.localStorage.setItem(STATS_KEY, JSON.stringify(stats));
  } catch { /* storage full — silently ignore */ }
}

export function loadAchievements(): AchievementMap {
  try {
    const raw = window.localStorage.getItem(ACHIEVEMENTS_KEY);
    const map: AchievementMap = {};
    ACHIEVEMENTS.forEach((a) => {
      map[a.id] = { unlocked: false, unlockedAt: null };
    });
    if (!raw) return map;
    const saved = JSON.parse(raw) as Record<string, AchievementState>;
    Object.keys(saved).forEach((id) => {
      if (map[id]) map[id] = saved[id];
    });
    return map;
  } catch {
    const map: AchievementMap = {};
    ACHIEVEMENTS.forEach((a) => {
      map[a.id] = { unlocked: false, unlockedAt: null };
    });
    return map;
  }
}

export function saveAchievements(map: AchievementMap): void {
  try {
    window.localStorage.setItem(ACHIEVEMENTS_KEY, JSON.stringify(map));
  } catch { /* storage full */ }
}

// ---- Achievement Checking ----

export function checkAchievements(
  achievements: AchievementMap,
  stats: GameStats,
  session: {
    difficulty: Difficulty;
    score: number;
    errors: number;
    maxCombo: number;
  },
): string[] {
  const newlyUnlocked: string[] = [];

  function unlock(id: string): boolean {
    if (achievements[id]?.unlocked) return false;
    achievements[id] = { unlocked: true, unlockedAt: new Date().toISOString() };
    newlyUnlocked.push(id);
    return true;
  }

  if (stats.totalWins >= 1) unlock("first_game");
  if (stats.totalWins >= 5) unlock("five_games");
  if (stats.totalWins >= 20) unlock("twenty_games");
  if (stats.perfectGames >= 1) unlock("perfect");
  if (stats.bestCombo >= 8) unlock("combo_master");
  if (stats.winsByDifficulty.easy > 0) unlock("win_easy");
  if (stats.winsByDifficulty.medium > 0) unlock("win_medium");
  if (stats.winsByDifficulty.hard > 0) unlock("win_hard");
  if (stats.winsByDifficulty.expert > 0) unlock("win_expert");
  if (stats.winsByDifficulty.master > 0) unlock("win_master");
  if (stats.bestScore >= 5000) unlock("high_score");
  if (session.errors === 0 && (session.difficulty === "hard" || session.difficulty === "expert" || session.difficulty === "master")) {
    unlock("perfect_hard");
  }

  return newlyUnlocked;
}
