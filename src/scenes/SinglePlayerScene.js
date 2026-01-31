import Phaser from 'phaser';
import { SCENES, BOARD_CONFIG, TIMER_CONFIG } from '../utils/constants.js';
import { pixelToGrid, isValidGridPosition } from '../utils/helpers.js';
import Board from '../game/Board.js';
import ScoreManager from '../game/ScoreManager.js';
import Timer from '../game/Timer.js';
import VisualEffects from '../game/VisualEffects.js';
import SoundManager from '../game/SoundManager.js';
import GameStateManager from '../state/GameStateManager.js';
import EventBus from '../state/EventBus.js';

export default class SinglePlayerScene extends Phaser.Scene {
  constructor() {
    super({ key: SCENES.SINGLE_PLAYER });
  }

  create() {
    // Initialize game state
    GameStateManager.resetGameState();
    GameStateManager.set('currentScene', SCENES.SINGLE_PLAYER);
    GameStateManager.set('gameMode', 'singleplayer');

    // Create game systems
    this.board = new Board(this);
    this.scoreManager = new ScoreManager();
    this.timer = new Timer(this, TIMER_CONFIG.GAME_TIME);
    this.visualEffects = new VisualEffects(this);
    this.soundManager = new SoundManager(this);

    // Setup UI
    this.setupUI();

    // Setup input
    this.setupInput();

    // Setup timer callbacks
    this.setupTimer();

    // Setup visual effects
    this.setupVisualEffects();

    // Start the game
    this.startGame();
  }

  setupUI() {
    const width = this.cameras.main.width;

    // Title
    this.add.text(width / 2, 20, 'SINGLE PLAYER', {
      font: 'bold 24px monospace',
      fill: '#ffffff',
    }).setOrigin(0.5);

    // Score display
    this.scoreText = this.add.text(20, 60, 'SCORE: 000000', {
      font: 'bold 20px monospace',
      fill: '#ffffff',
    });

    this.highScoreText = this.add.text(20, 90, `HIGH: ${this.scoreManager.getFormattedScore()}`, {
      font: '16px monospace',
      fill: '#cccccc',
    });

    // Combo display
    this.comboText = this.add.text(20, 120, '', {
      font: 'bold 18px monospace',
      fill: '#ffff00',
    });

    // Timer display
    this.timerText = this.add.text(width - 20, 60, 'TIME: 02:00', {
      font: 'bold 20px monospace',
      fill: '#ffffff',
    }).setOrigin(1, 0);

    // Timer bar
    this.timerBarBg = this.add.rectangle(width - 20, 90, 200, 20, 0x333333).setOrigin(1, 0);
    this.timerBar = this.add.rectangle(width - 20, 90, 200, 20, 0x00ff00).setOrigin(1, 0);

    // Matches display
    this.matchesText = this.add.text(width - 20, 120, 'MATCHES: 0', {
      font: '16px monospace',
      fill: '#cccccc',
    }).setOrigin(1, 0);

    // Back button
    const backButton = this.add.rectangle(width / 2, 570, 150, 40, 0x666666);
    const backText = this.add.text(width / 2, 570, 'BACK TO MENU', {
      font: '16px monospace',
      fill: '#ffffff',
    });
    backText.setOrigin(0.5);

    backButton.setInteractive({ useHandCursor: true });
    backButton.on('pointerover', () => backButton.setFillStyle(0x888888));
    backButton.on('pointerout', () => backButton.setFillStyle(0x666666));
    backButton.on('pointerdown', () => {
      this.endGame();
      this.scene.start(SCENES.MENU);
    });

    // Game over overlay (hidden initially)
    this.gameOverContainer = this.add.container(0, 0);
    this.gameOverContainer.setVisible(false);

    const overlay = this.add.rectangle(0, 0, width, 600, 0x000000, 0.8);
    overlay.setOrigin(0, 0);

    this.gameOverTitle = this.add.text(width / 2, 200, 'TIME\'S UP!', {
      font: 'bold 48px monospace',
      fill: '#ffffff',
    }).setOrigin(0.5);

    this.finalScoreText = this.add.text(width / 2, 280, 'FINAL SCORE: 000000', {
      font: 'bold 24px monospace',
      fill: '#ffffff',
    }).setOrigin(0.5);

    this.newHighScoreText = this.add.text(width / 2, 320, 'NEW HIGH SCORE!', {
      font: 'bold 20px monospace',
      fill: '#ffff00',
    }).setOrigin(0.5);
    this.newHighScoreText.setVisible(false);

    const playAgainButton = this.add.rectangle(width / 2, 380, 200, 50, 0x4CAF50);
    const playAgainText = this.add.text(width / 2, 380, 'PLAY AGAIN', {
      font: 'bold 20px monospace',
      fill: '#ffffff',
    }).setOrigin(0.5);

    playAgainButton.setInteractive({ useHandCursor: true });
    playAgainButton.on('pointerover', () => playAgainButton.setFillStyle(0x66BB6A));
    playAgainButton.on('pointerout', () => playAgainButton.setFillStyle(0x4CAF50));
    playAgainButton.on('pointerdown', () => {
      this.scene.restart();
    });

    const menuButton = this.add.rectangle(width / 2, 450, 200, 50, 0x666666);
    const menuText = this.add.text(width / 2, 450, 'MAIN MENU', {
      font: 'bold 20px monospace',
      fill: '#ffffff',
    }).setOrigin(0.5);

    menuButton.setInteractive({ useHandCursor: true });
    menuButton.on('pointerover', () => menuButton.setFillStyle(0x888888));
    menuButton.on('pointerout', () => menuButton.setFillStyle(0x666666));
    menuButton.on('pointerdown', () => {
      this.endGame();
      this.scene.start(SCENES.MENU);
    });

    this.gameOverContainer.add([
      overlay,
      this.gameOverTitle,
      this.finalScoreText,
      this.newHighScoreText,
      playAgainButton,
      playAgainText,
      menuButton,
      menuText,
    ]);
  }

  setupInput() {
    // Handle pointer down on tiles
    this.input.on('gameobjectdown', (pointer, gameObject) => {
      if (gameObject.tileRef && !this.board.isProcessing && !GameStateManager.get('isGameOver')) {
        this.soundManager.play('select');
        this.board.selectTile(gameObject.tileRef);
      }
    });
  }

  setupTimer() {
    this.timer.onTick((remainingTime) => {
      this.updateTimerDisplay(remainingTime);
      GameStateManager.set('timeRemaining', remainingTime);
    });

    this.timer.onWarning((remainingTime) => {
      // Flash timer when running low
      this.tweens.add({
        targets: this.timerText,
        alpha: 0.3,
        duration: 300,
        yoyo: true,
        repeat: -1,
      });
      this.soundManager.play('warning');
    });

    this.timer.onComplete(() => {
      this.gameOver();
    });
  }

  setupVisualEffects() {
    // Listen for tile match events
    EventBus.on('tiles:matched', (tiles, comboCount) => {
      // Create match visual effects
      this.visualEffects.createMatchEffect(tiles);

      // Play match sound
      if (comboCount > 1) {
        this.soundManager.play('combo');
        this.visualEffects.screenShake(0.003 * comboCount, 150);
        this.visualEffects.createComboText(comboCount);
      } else {
        this.soundManager.play('match');
      }
    }, this);

    // Listen for swap events
    EventBus.on('tiles:swapped', () => {
      this.soundManager.play('swap');
    }, this);

    // Listen for swap failed events
    EventBus.on('tiles:swap-failed', () => {
      this.visualEffects.screenShake(0.002, 100);
      this.soundManager.play('invalid');
    }, this);
  }

  startGame() {
    this.timer.start();
    this.updateUI();
  }

  updateUI() {
    this.scoreText.setText(`SCORE: ${this.scoreManager.getFormattedScore()}`);
    this.highScoreText.setText(`HIGH: ${this.scoreManager.getHighScore().toString().padStart(6, '0')}`);

    const comboText = this.scoreManager.getFormattedCombo();
    this.comboText.setText(comboText ? `COMBO ${comboText}` : '');

    this.matchesText.setText(`MATCHES: ${this.scoreManager.getTotalMatches()}`);

    // Update game state
    GameStateManager.update({
      score: this.scoreManager.getScore(),
      highScore: this.scoreManager.getHighScore(),
      matches: this.scoreManager.getTotalMatches(),
    });
  }

  updateTimerDisplay(remainingTime) {
    this.timerText.setText(`TIME: ${this.timer.getFormattedTime()}`);

    // Update timer bar
    const percentage = this.timer.getPercentageRemaining() / 100;
    this.timerBar.scaleX = percentage;

    // Change color based on time remaining
    if (this.timer.isAlmostDone()) {
      this.timerBar.setFillStyle(0xff0000); // Red
    } else if (this.timer.isRunningLow()) {
      this.timerBar.setFillStyle(0xffaa00); // Orange
    } else {
      this.timerBar.setFillStyle(0x00ff00); // Green
    }
  }

  async processBoardMatches() {
    const result = await this.board.processMatches(this.board.findMatches());

    if (result.matches.length > 0) {
      const points = this.scoreManager.addScore(result.matches, result.combos);
      this.updateUI();

      // Show score popup
      this.showScorePopup(points, result.combos);
    }
  }

  showScorePopup(points, combos) {
    const width = this.cameras.main.width;
    this.visualEffects.createFloatingScore(width / 2, 300, points, combos > 1);
  }

  gameOver() {
    GameStateManager.set('isGameOver', true);
    this.timer.stop();

    // Save high score
    this.scoreManager.saveHighScore();

    // Show game over screen
    this.finalScoreText.setText(`FINAL SCORE: ${this.scoreManager.getFormattedScore()}`);
    this.newHighScoreText.setVisible(this.scoreManager.isNewHighScore());

    // Show success effect and play sound if new high score
    if (this.scoreManager.isNewHighScore()) {
      this.visualEffects.createSuccessEffect();
      this.soundManager.play('highScore');
    } else {
      this.soundManager.play('gameOver');
    }

    this.gameOverContainer.setVisible(true);
  }

  endGame() {
    if (this.timer) {
      this.timer.destroy();
    }
    if (this.board) {
      this.board.destroy();
    }
    if (this.soundManager) {
      this.soundManager.destroy();
    }
  }

  update() {
    // Handle any continuous updates here if needed
  }

  shutdown() {
    this.endGame();
  }
}
