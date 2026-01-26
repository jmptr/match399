import EventBus from './EventBus.js';

/**
 * Centralized game state manager
 */
class GameStateManager {
  constructor() {
    this.state = {
      currentScene: null,
      gameMode: null, // 'singleplayer' or 'multiplayer'
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
  get(key) {
    return this.state[key];
  }

  /**
   * Set a state value and emit change event
   */
  set(key, value) {
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
  update(updates) {
    Object.keys(updates).forEach((key) => {
      this.set(key, updates[key]);
    });
  }

  /**
   * Get entire state (use sparingly)
   */
  getState() {
    return { ...this.state };
  }

  /**
   * Reset game state for new game
   */
  resetGameState() {
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
  loadSettings() {
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
  saveSettings() {
    try {
      localStorage.setItem('match3-settings', JSON.stringify(this.state.settings));
    } catch (e) {
      console.error('Failed to save settings:', e);
    }
  }

  /**
   * Update a setting
   */
  setSetting(key, value) {
    this.state.settings[key] = value;
    this.saveSettings();
    EventBus.emit(`setting:${key}`, value);
  }

  /**
   * Get a setting
   */
  getSetting(key) {
    return this.state.settings[key];
  }
}

// Create and export singleton instance
export default new GameStateManager();
