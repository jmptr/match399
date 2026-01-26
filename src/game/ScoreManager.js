import { SCORE_CONFIG } from '../utils/constants.js';

export default class ScoreManager {
  constructor() {
    this.score = 0;
    this.comboMultiplier = 1.0;
    this.totalMatches = 0;
    this.highScore = this.loadHighScore();
  }

  /**
   * Calculate and add points for matched tiles
   */
  addScore(matchedTiles, comboCount = 1) {
    if (!matchedTiles || matchedTiles.length === 0) return 0;

    // Base score depends on number of tiles matched
    let baseScore = 0;
    const matchSize = matchedTiles.length;

    if (matchSize === 3) {
      baseScore = SCORE_CONFIG.BASE_MATCH_3;
    } else if (matchSize === 4) {
      baseScore = SCORE_CONFIG.BASE_MATCH_4;
    } else if (matchSize >= 5) {
      baseScore = SCORE_CONFIG.BASE_MATCH_5;
      // Bonus for each additional tile beyond 5
      baseScore += (matchSize - 5) * 100;
    }

    // Apply combo multiplier
    this.comboMultiplier = Math.min(
      1.0 + (comboCount - 1) * SCORE_CONFIG.COMBO_MULTIPLIER,
      SCORE_CONFIG.MAX_COMBO_MULTIPLIER
    );

    const earnedPoints = Math.floor(baseScore * this.comboMultiplier);
    this.score += earnedPoints;
    this.totalMatches++;

    return earnedPoints;
  }

  /**
   * Reset combo multiplier (called when no matches found)
   */
  resetCombo() {
    this.comboMultiplier = 1.0;
  }

  /**
   * Get current score
   */
  getScore() {
    return this.score;
  }

  /**
   * Get current combo multiplier
   */
  getComboMultiplier() {
    return this.comboMultiplier;
  }

  /**
   * Get total matches made
   */
  getTotalMatches() {
    return this.totalMatches;
  }

  /**
   * Get high score from local storage
   */
  loadHighScore() {
    try {
      const saved = localStorage.getItem('match3-highscore');
      return saved ? parseInt(saved, 10) : 0;
    } catch (e) {
      return 0;
    }
  }

  /**
   * Save high score to local storage
   */
  saveHighScore() {
    if (this.score > this.highScore) {
      this.highScore = this.score;
      try {
        localStorage.setItem('match3-highscore', this.highScore.toString());
      } catch (e) {
        console.error('Failed to save high score:', e);
      }
    }
  }

  /**
   * Get high score
   */
  getHighScore() {
    return this.highScore;
  }

  /**
   * Check if current score is a new high score
   */
  isNewHighScore() {
    return this.score > this.highScore;
  }

  /**
   * Reset the score for a new game
   */
  reset() {
    this.score = 0;
    this.comboMultiplier = 1.0;
    this.totalMatches = 0;
  }

  /**
   * Get formatted score display
   */
  getFormattedScore() {
    return this.score.toString().padStart(6, '0');
  }

  /**
   * Get formatted combo display
   */
  getFormattedCombo() {
    if (this.comboMultiplier <= 1.0) return '';
    return `x${this.comboMultiplier.toFixed(1)}`;
  }
}
