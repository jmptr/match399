import EventBus from './EventBus.js';

/**
 * Game settings interface
 */
interface GameSettings {
  soundEnabled: boolean;
  musicEnabled: boolean;
  soundVolume: number;
  musicVolume: number;
}

/**
 * Game state interface
 */
interface GameState {
  currentScene: string | null;
  gameMode: 'singleplayer';
  score: number;
  highScore: number;
  timeRemaining: number;
  isPaused: boolean;
  isGameOver: boolean;
  moves: number;
  matches: number;
  combos: number;
  settings: GameSettings;
}

/**
 * Centralized game state manager
 */
class GameStateManager {
  private state: GameState;

  constructor() {
    this.state = {
      currentScene: null,
      gameMode: 'singleplayer',
      score: 0,
      highScore: 0,
      timeRemaining: 0,
      isPaused: false,
      isGameOver: false,
      moves: 0,
      matches: 0,
      combos: 0,
      settings: {
        soundEnabled: true,
        musicEnabled: true,
        soundVolume: 0.7,
        musicVolume: 0.5,
      },
    };

    this.loadSettings();
  }

  /**
   * Get a state value
   */
  get<K extends keyof GameState>(key: K): GameState[K] {
    return this.state[key];
  }

  /**
   * Set a state value and emit change event
   */
  set<K extends keyof GameState>(key: K, value: GameState[K]): void {
    const oldValue = this.state[key];
    this.state[key] = value;

    // Emit specific change event
    EventBus.emit(`state:${key}`, value, oldValue);

    // Emit general change event
    EventBus.emit('state:change', { key, value, oldValue });
  }

  /**
   * Update multiple state values at once
   */
  update(updates: Partial<GameState>): void {
    (Object.keys(updates) as Array<keyof GameState>).forEach((key) => {
      if (updates[key] !== undefined) {
        this.set(key, updates[key] as GameState[typeof key]);
      }
    });
  }

  /**
   * Get entire state (use sparingly)
   */
  getState(): GameState {
    return { ...this.state };
  }

  /**
   * Reset game state for new game
   */
  resetGameState(): void {
    this.update({
      score: 0,
      timeRemaining: 0,
      isPaused: false,
      isGameOver: false,
      moves: 0,
      matches: 0,
      combos: 0,
    });
  }

  /**
   * Load settings from local storage
   */
  loadSettings(): void {
    try {
      const saved = localStorage.getItem('match3-settings');
      if (saved) {
        this.state.settings = { ...this.state.settings, ...JSON.parse(saved) };
      }
    } catch (e) {
      console.error('Failed to load settings:', e);
    }
  }

  /**
   * Save settings to local storage
   */
  saveSettings(): void {
    try {
      localStorage.setItem('match3-settings', JSON.stringify(this.state.settings));
    } catch (e) {
      console.error('Failed to save settings:', e);
    }
  }

  /**
   * Update a setting
   */
  setSetting<K extends keyof GameSettings>(key: K, value: GameSettings[K]): void {
    this.state.settings[key] = value;
    this.saveSettings();
    EventBus.emit(`setting:${key}`, value);
  }

  /**
   * Get a setting
   */
  getSetting<K extends keyof GameSettings>(key: K): GameSettings[K] {
    return this.state.settings[key];
  }
}

// Create and export singleton instance
export default new GameStateManager();
