import Tile from './Tile.js';
import { BOARD_CONFIG } from '../utils/constants.js';
import { randomInt, isValidGridPosition, areAdjacent } from '../utils/helpers.js';
import EventBus from '../state/EventBus.js';

export default class Board {
  constructor(scene) {
    this.scene = scene;
    this.rows = BOARD_CONFIG.ROWS;
    this.cols = BOARD_CONFIG.COLS;
    this.grid = [];
    this.selectedTile = null;
    this.isProcessing = false;

    this.initialize();
  }

  /**
   * Initialize the board with tiles
   */
  initialize() {
    // Create empty grid
    this.grid = Array(this.rows)
      .fill(null)
      .map(() => Array(this.cols).fill(null));

    // Fill with random tiles, ensuring no initial matches
    for (let row = 0; row < this.rows; row++) {
      for (let col = 0; col < this.cols; col++) {
        let type;
        let attempts = 0;
        const maxAttempts = 10;

        do {
          type = randomInt(0, BOARD_CONFIG.TILE_TYPES);
          attempts++;

          // If we can't find a valid type after max attempts, just use it anyway
          if (attempts >= maxAttempts) break;
        } while (this.wouldCreateMatch(row, col, type));

        this.grid[row][col] = new Tile(this.scene, row, col, type);
      }
    }
  }

  /**
   * Check if placing a tile type at position would create a match
   */
  wouldCreateMatch(row, col, type) {
    // Check horizontal
    let horizontalCount = 1;
    // Check left
    for (let c = col - 1; c >= 0 && this.grid[row][c] && this.grid[row][c].type === type; c--) {
      horizontalCount++;
    }
    // Check right
    for (let c = col + 1; c < this.cols && this.grid[row][c] && this.grid[row][c].type === type; c++) {
      horizontalCount++;
    }

    if (horizontalCount >= 3) return true;

    // Check vertical
    let verticalCount = 1;
    // Check up
    for (let r = row - 1; r >= 0 && this.grid[r][col] && this.grid[r][col].type === type; r--) {
      verticalCount++;
    }
    // Check down
    for (let r = row + 1; r < this.rows && this.grid[r][col] && this.grid[r][col].type === type; r++) {
      verticalCount++;
    }

    if (verticalCount >= 3) return true;

    return false;
  }

  /**
   * Get tile at grid position
   */
  getTile(row, col) {
    if (!isValidGridPosition(row, col, this.rows, this.cols)) return null;
    return this.grid[row][col];
  }

  /**
   * Handle tile selection
   */
  selectTile(tile) {
    if (this.isProcessing || !tile) return;

    // If no tile is selected, select this one
    if (!this.selectedTile) {
      this.selectedTile = tile;
      tile.highlight();
      return;
    }

    // If clicking the same tile, deselect
    if (this.selectedTile === tile) {
      this.selectedTile.unhighlight();
      this.selectedTile = null;
      return;
    }

    // If tiles are adjacent, try to swap
    if (areAdjacent(
      { row: this.selectedTile.row, col: this.selectedTile.col },
      { row: tile.row, col: tile.col }
    )) {
      this.selectedTile.unhighlight();
      this.swapTiles(this.selectedTile, tile);
      this.selectedTile = null;
    } else {
      // Select the new tile
      this.selectedTile.unhighlight();
      this.selectedTile = tile;
      tile.highlight();
    }
  }

  /**
   * Swap two tiles
   */
  async swapTiles(tile1, tile2) {
    this.isProcessing = true;

    // Update grid references
    const tempRow = tile1.row;
    const tempCol = tile1.col;
    this.grid[tile1.row][tile1.col] = tile2;
    this.grid[tile2.row][tile2.col] = tile1;

    // Emit swap event
    EventBus.emit('tiles:swapped', tile1, tile2);

    // Animate the swap
    await tile1.swapWith(tile2);

    // Check for matches
    const matches = this.findMatches();

    if (matches.length === 0) {
      // No matches, swap back
      this.grid[tile1.row][tile1.col] = tile2;
      this.grid[tile2.row][tile2.col] = tile1;
      await tile1.swapWith(tile2);
      EventBus.emit('tiles:swap-failed', tile1, tile2);
      this.isProcessing = false;
    } else {
      // Valid move, process matches
      await this.processMatches(matches);
      this.isProcessing = false;
    }
  }

  /**
   * Find all matches on the board
   */
  findMatches() {
    const matches = new Set();

    // Check horizontal matches
    for (let row = 0; row < this.rows; row++) {
      for (let col = 0; col < this.cols - 2; col++) {
        const tile = this.grid[row][col];
        if (!tile) continue;

        let matchLength = 1;
        for (let c = col + 1; c < this.cols; c++) {
          const nextTile = this.grid[row][c];
          if (nextTile && nextTile.type === tile.type) {
            matchLength++;
          } else {
            break;
          }
        }

        if (matchLength >= 3) {
          for (let c = col; c < col + matchLength; c++) {
            matches.add(this.grid[row][c]);
          }
        }
      }
    }

    // Check vertical matches
    for (let col = 0; col < this.cols; col++) {
      for (let row = 0; row < this.rows - 2; row++) {
        const tile = this.grid[row][col];
        if (!tile) continue;

        let matchLength = 1;
        for (let r = row + 1; r < this.rows; r++) {
          const nextTile = this.grid[r][col];
          if (nextTile && nextTile.type === tile.type) {
            matchLength++;
          } else {
            break;
          }
        }

        if (matchLength >= 3) {
          for (let r = row; r < row + matchLength; r++) {
            matches.add(this.grid[r][col]);
          }
        }
      }
    }

    return Array.from(matches);
  }

  /**
   * Process matched tiles and trigger cascades
   */
  async processMatches(matches) {
    if (matches.length === 0) return { matches: [], combos: 0 };

    let totalMatches = [...matches];
    let comboCount = 0;

    do {
      comboCount++;

      // Emit match event for visual effects
      EventBus.emit('tiles:matched', matches, comboCount);

      // Animate matched tiles
      await Promise.all(matches.map((tile) => tile.match()));

      // Remove matched tiles from grid
      matches.forEach((tile) => {
        this.grid[tile.row][tile.col] = null;
        tile.destroy();
      });

      // Apply gravity
      await this.applyGravity();

      // Fill empty spaces
      await this.fillBoard();

      // Check for new matches (cascade)
      matches = this.findMatches();
      if (matches.length > 0) {
        totalMatches = [...totalMatches, ...matches];
      }
    } while (matches.length > 0);

    return {
      matches: totalMatches,
      combos: comboCount,
    };
  }

  /**
   * Apply gravity to make tiles fall
   */
  async applyGravity() {
    const promises = [];

    for (let col = 0; col < this.cols; col++) {
      // Process each column from bottom to top
      let writeRow = this.rows - 1;

      for (let row = this.rows - 1; row >= 0; row--) {
        const tile = this.grid[row][col];
        if (tile && !tile.isMatched) {
          if (row !== writeRow) {
            this.grid[writeRow][col] = tile;
            this.grid[row][col] = null;
            promises.push(tile.moveTo(writeRow, col));
          }
          writeRow--;
        }
      }
    }

    await Promise.all(promises);
  }

  /**
   * Fill empty spaces with new tiles
   */
  async fillBoard() {
    const promises = [];

    for (let col = 0; col < this.cols; col++) {
      let emptyCount = 0;

      // Count empty spaces from top
      for (let row = 0; row < this.rows; row++) {
        if (!this.grid[row][col]) {
          emptyCount++;
        }
      }

      // Create new tiles above the board and animate them falling
      for (let i = 0; i < emptyCount; i++) {
        const row = i;
        const type = randomInt(0, BOARD_CONFIG.TILE_TYPES);
        const tile = new Tile(this.scene, -emptyCount + i, col, type);
        this.grid[row][col] = tile;
        promises.push(tile.moveTo(row, col, 400));
      }
    }

    await Promise.all(promises);
  }

  /**
   * Clean up the board
   */
  destroy() {
    for (let row = 0; row < this.rows; row++) {
      for (let col = 0; col < this.cols; col++) {
        if (this.grid[row][col]) {
          this.grid[row][col].destroy();
        }
      }
    }
    this.grid = [];
  }
}
