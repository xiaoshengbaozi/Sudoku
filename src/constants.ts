import type { Difficulty } from "./sudoku";

export const ENERGY_MAX = 100;
export const ENERGY_GAIN = 10;

export const difficulties: Difficulty[] = ["easy", "medium", "hard", "expert", "master"];

export const difficultyLabel: Record<Difficulty, string> = {
  easy: "简单",
  medium: "中等",
  hard: "困难",
  expert: "专家",
  master: "大师",
};
