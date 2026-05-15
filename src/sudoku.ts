export type Difficulty = "easy" | "medium" | "hard" | "expert" | "master";
export type Board = number[][];

const SIZE = 9;
const BOX = 3;
const EMPTY = 0;

const holesByDifficulty: Record<Difficulty, number> = {
  easy: 36,
  medium: 46,
  hard: 54,
  expert: 59,
  master: 63,
};

export interface SudokuPuzzle {
  puzzle: Board;
  solution: Board;
  fixed: boolean[][];
  difficulty: Difficulty;
}

export function createEmptyBoard(): Board {
  return Array.from({ length: SIZE }, () => Array.from({ length: SIZE }, () => EMPTY));
}

export function cloneBoard(board: Board): Board {
  return board.map((row) => [...row]);
}

export function isValidPlacement(board: Board, row: number, col: number, value: number): boolean {
  if (!Number.isInteger(value) || value < 1 || value > 9) return false;

  for (let i = 0; i < SIZE; i += 1) {
    if (i !== col && board[row][i] === value) return false;
    if (i !== row && board[i][col] === value) return false;
  }

  const boxRow = Math.floor(row / BOX) * BOX;
  const boxCol = Math.floor(col / BOX) * BOX;

  for (let r = boxRow; r < boxRow + BOX; r += 1) {
    for (let c = boxCol; c < boxCol + BOX; c += 1) {
      if ((r !== row || c !== col) && board[r][c] === value) return false;
    }
  }

  return true;
}

export function validateMove(board: Board, row: number, col: number, value: number): boolean {
  const next = cloneBoard(board);
  next[row][col] = EMPTY;
  return isValidPlacement(next, row, col, value);
}

export function generateSudokuPuzzle(difficulty: Difficulty = "medium"): SudokuPuzzle {
  const solution = createSolvedBoard();
  const puzzle = cloneBoard(solution);
  const holes = holesByDifficulty[difficulty];
  const positions = shuffle(Array.from({ length: SIZE * SIZE }, (_, index) => index));

  for (let i = 0; i < holes; i += 1) {
    const position = positions[i];
    puzzle[Math.floor(position / SIZE)][position % SIZE] = EMPTY;
  }

  return {
    puzzle,
    solution,
    fixed: puzzle.map((row) => row.map((value) => value !== EMPTY)),
    difficulty,
  };
}

function createSolvedBoard(): Board {
  const board = createEmptyBoard();
  fillBoard(board);
  return board;
}

function fillBoard(board: Board): boolean {
  const empty = findEmptyCell(board);
  if (!empty) return true;

  const [row, col] = empty;
  for (const value of shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9])) {
    if (isValidPlacement(board, row, col, value)) {
      board[row][col] = value;
      if (fillBoard(board)) return true;
      board[row][col] = EMPTY;
    }
  }

  return false;
}

function findEmptyCell(board: Board): [number, number] | null {
  for (let row = 0; row < SIZE; row += 1) {
    for (let col = 0; col < SIZE; col += 1) {
      if (board[row][col] === EMPTY) return [row, col];
    }
  }

  return null;
}

function shuffle<T>(items: T[]): T[] {
  const result = [...items];

  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }

  return result;
}
