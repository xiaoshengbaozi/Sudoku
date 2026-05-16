import type { Board } from "./sudoku";
import type { CellCoord, CompletedUnitBurst } from "./types";
import { validateMove } from "./sudoku";

export function createEmptyNotes(): number[][][] {
  return Array.from({ length: 9 }, () =>
    Array.from({ length: 9 }, () => []),
  );
}

export function findNewlyCompletedUnits(
  board: Board,
  nextBoard: Board,
  row: number,
  col: number,
): Omit<CompletedUnitBurst, "id">[] {
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

export function findCertainCells(board: Board): CellCoord[] {
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
