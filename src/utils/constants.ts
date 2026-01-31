// Game configuration constants

export const GAME_CONFIG = {
  WIDTH: 800,
  HEIGHT: 600,
  BACKGROUND_COLOR: '#2d2d2d',
} as const;

export const BOARD_CONFIG = {
  ROWS: 8,
  COLS: 8,
  TILE_SIZE: 64,
  OFFSET_X: 160, // Center the board
  OFFSET_Y: 50,
  TILE_TYPES: 6, // Number of different tile colors/types
} as const;

export const TILE_COLORS = [
  0xff0000, // Red
  0x00ff00, // Green
  0x0000ff, // Blue
  0xffff00, // Yellow
  0xff00ff, // Magenta
  0x00ffff, // Cyan
] as const;

export const ANIMATION_CONFIG = {
  SWAP_DURATION: 200,
  FALL_DURATION: 300,
  MATCH_DURATION: 200,
  FALL_SPEED: 500, // pixels per second
} as const;

export const SCORE_CONFIG = {
  BASE_MATCH_3: 100,
  BASE_MATCH_4: 200,
  BASE_MATCH_5: 300,
  COMBO_MULTIPLIER: 0.5, // Each combo adds 50% more
  MAX_COMBO_MULTIPLIER: 4.0,
} as const;

export const TIMER_CONFIG = {
  GAME_TIME: 120, // 2 minutes in seconds
} as const;

export const SCENES = {
  BOOT: 'BootScene',
  MENU: 'MenuScene',
  SINGLE_PLAYER: 'SinglePlayerScene',
} as const;

// Type exports for better TypeScript support
export type SceneKey = typeof SCENES[keyof typeof SCENES];
export type TileColor = typeof TILE_COLORS[number];
