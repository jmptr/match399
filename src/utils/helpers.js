// Utility helper functions

/**
 * Convert grid coordinates to pixel position
 */
export function gridToPixel(row, col, tileSize, offsetX, offsetY) {
  return {
    x: col * tileSize + offsetX + tileSize / 2,
    y: row * tileSize + offsetY + tileSize / 2,
  };
}

/**
 * Convert pixel position to grid coordinates
 */
export function pixelToGrid(x, y, tileSize, offsetX, offsetY) {
  return {
    row: Math.floor((y - offsetY) / tileSize),
    col: Math.floor((x - offsetX) / tileSize),
  };
}

/**
 * Check if grid coordinates are valid
 */
export function isValidGridPosition(row, col, rows, cols) {
  return row >= 0 && row < rows && col >= 0 && col < cols;
}

/**
 * Check if two positions are adjacent (horizontally or vertically)
 */
export function areAdjacent(pos1, pos2) {
  const rowDiff = Math.abs(pos1.row - pos2.row);
  const colDiff = Math.abs(pos1.col - pos2.col);
  return (rowDiff === 1 && colDiff === 0) || (rowDiff === 0 && colDiff === 1);
}

/**
 * Generate a random integer between min (inclusive) and max (exclusive)
 */
export function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min)) + min;
}

/**
 * Format time in MM:SS format
 */
export function formatTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Shuffle an array in place using Fisher-Yates algorithm
 */
export function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}
