// Utility helper functions

interface Position {
  x: number;
  y: number;
}

interface GridPosition {
  row: number;
  col: number;
}

/**
 * Convert grid coordinates to pixel position
 */
export function gridToPixel(
  row: number,
  col: number,
  tileSize: number,
  offsetX: number,
  offsetY: number
): Position {
  return {
    x: col * tileSize + offsetX + tileSize / 2,
    y: row * tileSize + offsetY + tileSize / 2,
  };
}

/**
 * Convert pixel position to grid coordinates
 */
export function pixelToGrid(
  x: number,
  y: number,
  tileSize: number,
  offsetX: number,
  offsetY: number
): GridPosition {
  return {
    row: Math.floor((y - offsetY) / tileSize),
    col: Math.floor((x - offsetX) / tileSize),
  };
}

/**
 * Check if grid coordinates are valid
 */
export function isValidGridPosition(
  row: number,
  col: number,
  rows: number,
  cols: number
): boolean {
  return row >= 0 && row < rows && col >= 0 && col < cols;
}

/**
 * Check if two positions are adjacent (horizontally or vertically)
 */
export function areAdjacent(pos1: GridPosition, pos2: GridPosition): boolean {
  const rowDiff = Math.abs(pos1.row - pos2.row);
  const colDiff = Math.abs(pos1.col - pos2.col);
  return (rowDiff === 1 && colDiff === 0) || (rowDiff === 0 && colDiff === 1);
}

/**
 * Generate a random integer between min (inclusive) and max (exclusive)
 */
export function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min)) + min;
}

/**
 * Format time in MM:SS format
 */
export function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Shuffle an array in place using Fisher-Yates algorithm
 */
export function shuffleArray<T>(array: T[]): T[] {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

// Export types for use in other modules
export type { Position, GridPosition };
