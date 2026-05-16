export type CellCoord = { row: number; col: number };
export type Theme = "dark" | "light";

export type CompletedUnitType = "row" | "col" | "box";

export type CompletedUnitBurst = {
  id: number;
  type: CompletedUnitType;
  cells: CellCoord[];
};
