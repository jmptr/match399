import Phaser from 'phaser';
import { SCENES, TIMER_CONFIG } from '../utils/constants.js';
import Board from '../game/Board.js';
import ScoreManager from '../game/ScoreManager.js';
import Timer from '../game/Timer.js';
import VisualEffects from '../game/VisualEffects.js';
import SoundManager from '../game/SoundManager.js';
import { authManager } from '../multiplayer/AuthManager.js';
import { networkManager } from '../multiplayer/NetworkManager.js';
import { matchmaking } from '../multiplayer/Matchmaking.js';
import GameStateManager from '../state/GameStateManager.js';
import EventBus from '../state/EventBus.js';

export default class MultiplayerScene extends Phaser.Scene {
  constructor() {
    super({ key: SCENES.MULTIPLAYER });
  }

  init(data) {
    this.roomData = data.room;
    this.playerProfile = authManager.getPlayerProfile();
    this.opponentScore = 0;
    this.opponentMatches = 0;
    this.isGameStarted = false;
    this.isPlayerReady = false;
    this.isOpponentReady = false;
  }

  create() {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    // Initialize game state
    GameStateManager.resetGameState();
    GameStateManager.set('currentScene', SCENES.MULTIPLAYER);
    GameStateManager.set('gameMode', 'multiplayer');

    // Create game systems
    this.board = new Board(this);
    this.scoreManager = new ScoreManager();
    this.timer = new Timer(this, TIMER_CONFIG.MULTIPLAYER_TIME);
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

    // Setup multiplayer networking
    this.setupMultiplayer();

    // Join the game room
    this.joinRoom();

    // Fade in
    this.cameras.main.fadeIn(500);
  }

  setupUI() {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    // Title
    this.add.text(width / 2, 20, 'MULTIPLAYER MATCH', {
      font: 'bold 24px monospace',
      fill: '#ffffff',
    }).setOrigin(0.5);

    // Divider line
    const divider = this.add.graphics();
    divider.lineStyle(2, 0xffffff, 0.3);
    divider.lineBetween(width / 2, 50, width / 2, height - 50);

    // === LEFT SIDE (PLAYER) ===
    this.add.text(120, 50, 'YOUR BOARD', {
      font: 'bold 18px monospace',
      fill: '#4CAF50',
    }).setOrigin(0.5);

    // Player name
    this.playerNameText = this.add.text(20, 80, this.playerProfile.username, {
      font: 'bold 16px monospace',
      fill: '#ffffff',
    });

    // Player score
    this.scoreText = this.add.text(20, 110, 'SCORE: 000000', {
      font: 'bold 18px monospace',
      fill: '#ffffff',
    });

    // Player matches
    this.matchesText = this.add.text(20, 140, 'MATCHES: 0', {
      font: '14px monospace',
      fill: '#cccccc',
    });

    // === RIGHT SIDE (OPPONENT) ===
    this.add.text(680, 50, 'OPPONENT', {
      font: 'bold 18px monospace',
      fill: '#FF5722',
    }).setOrigin(0.5);

    // Opponent name
    this.opponentNameText = this.add.text(520, 80, 'Waiting...', {
      font: 'bold 16px monospace',
      fill: '#ffffff',
    });

    // Opponent score
    this.opponentScoreText = this.add.text(520, 110, 'SCORE: 000000', {
      font: 'bold 18px monospace',
      fill: '#ffffff',
    });

    // Opponent matches
    this.opponentMatchesText = this.add.text(520, 140, 'MATCHES: 0', {
      font: '14px monospace',
      fill: '#cccccc',
    });

    // Opponent status indicator
    this.opponentStatusText = this.add.text(680, 180, '', {
      font: '14px monospace',
      fill: '#ffff00',
    }).setOrigin(0.5);

    // === CENTER (TIMER) ===
    this.timerText = this.add.text(width / 2, height - 100, 'TIME: 03:00', {
      font: 'bold 24px monospace',
      fill: '#ffffff',
    }).setOrigin(0.5);

    // Timer bar
    this.timerBarBg = this.add.rectangle(width / 2, height - 65, 300, 20, 0x333333);
    this.timerBar = this.add.rectangle(width / 2, height - 65, 300, 20, 0x00ff00);

    // Status text
    this.statusText = this.add.text(width / 2, height - 35, 'Waiting for opponent...', {
      font: '16px monospace',
      fill: '#ffff00',
    }).setOrigin(0.5);

    // Ready button
    this.readyButton = this.add.rectangle(width / 2, height - 130, 200, 50, 0x4CAF50);
    this.readyButtonText = this.add.text(width / 2, height - 130, 'READY', {
      font: 'bold 20px monospace',
      fill: '#ffffff',
    }).setOrigin(0.5);

    this.readyButton.setInteractive({ useHandCursor: true });
    this.readyButton.on('pointerdown', () => this.handleReady());

    // Game over overlay (hidden initially)
    this.createGameOverUI();
  }

  createGameOverUI() {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    this.gameOverContainer = this.add.container(0, 0);
    this.gameOverContainer.setVisible(false);

    const overlay = this.add.rectangle(0, 0, width, height, 0x000000, 0.85);
    overlay.setOrigin(0, 0);

    this.gameOverTitle = this.add.text(width / 2, 150, 'VICTORY!', {
      font: 'bold 56px monospace',
      fill: '#00ff00',
    }).setOrigin(0.5);

    this.resultText = this.add.text(width / 2, 230, '', {
      font: '20px monospace',
      fill: '#ffffff',
      align: 'center',
    }).setOrigin(0.5);

    this.finalScoresText = this.add.text(width / 2, 300, '', {
      font: '18px monospace',
      fill: '#cccccc',
      align: 'center',
    }).setOrigin(0.5);

    const menuButton = this.add.rectangle(width / 2, 420, 250, 60, 0x4CAF50);
    const menuText = this.add.text(width / 2, 420, 'BACK TO LOBBY', {
      font: 'bold 20px monospace',
      fill: '#ffffff',
    }).setOrigin(0.5);

    menuButton.setInteractive({ useHandCursor: true });
    menuButton.on('pointerover', () => menuButton.setFillStyle(0x66BB6A));
    menuButton.on('pointerout', () => menuButton.setFillStyle(0x4CAF50));
    menuButton.on('pointerdown', () => {
      this.cleanup();
      this.scene.start(SCENES.MULTIPLAYER_LOBBY);
    });

    this.gameOverContainer.add([
      overlay,
      this.gameOverTitle,
      this.resultText,
      this.finalScoresText,
      menuButton,
      menuText,
    ]);
  }

  setupInput() {
    // Disable input initially until both players are ready
    this.input.enabled = false;

    // Handle pointer down on tiles
    this.input.on('gameobjectdown', (pointer, gameObject) => {
      if (gameObject.tileRef && !this.board.isProcessing && this.isGameStarted) {
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
      this.endGame();
    });
  }

  setupVisualEffects() {
    // Listen for tile match events
    EventBus.on('tiles:matched', (tiles, comboCount) => {
      this.visualEffects.createMatchEffect(tiles);

      if (comboCount > 1) {
        this.soundManager.play('combo');
        this.visualEffects.screenShake(0.003 * comboCount, 150);
        this.visualEffects.createComboText(comboCount);
      } else {
        this.soundManager.play('match');
      }

      // Broadcast match to opponent
      this.broadcastMatchMade(tiles.length, comboCount);
    }, this);

    // Listen for swap events
    EventBus.on('tiles:swapped', (tile1, tile2) => {
      this.soundManager.play('swap');
      // Broadcast swap to opponent
      this.broadcastTileSwap(tile1, tile2);
    }, this);

    // Listen for swap failed events
    EventBus.on('tiles:swap-failed', () => {
      this.visualEffects.screenShake(0.002, 100);
      this.soundManager.play('invalid');
    }, this);
  }

  setupMultiplayer() {
    // Listen for multiplayer events
    EventBus.on('multiplayer:player-ready', this.onOpponentReady, this);
    EventBus.on('multiplayer:game-start', this.onGameStart, this);
    EventBus.on('multiplayer:score-update', this.onOpponentScoreUpdate, this);
    EventBus.on('multiplayer:match-made', this.onOpponentMatch, this);
    EventBus.on('multiplayer:game-over', this.onOpponentGameOver, this);
    EventBus.on('multiplayer:player-left', this.onOpponentLeft, this);
  }

  async joinRoom() {
    // Join the network room
    await networkManager.joinGameRoom(this.roomData.id, this.playerProfile);

    // Update opponent info if they're already in the room
    this.updateOpponentInfo();
  }

  async handleReady() {
    if (this.isPlayerReady) return;

    this.isPlayerReady = true;
    this.readyButton.setFillStyle(0x666666);
    this.readyButton.disableInteractive();
    this.readyButtonText.setText('READY!');
    this.readyButtonText.setColor('#00ff00');

    // Notify opponent
    await networkManager.setReady(true);

    this.statusText.setText('Waiting for opponent to be ready...');

    // If opponent is already ready, start the game
    if (this.isOpponentReady) {
      this.startGame();
    }
  }

  onOpponentReady(data) {
    if (!data.ready) return;

    this.isOpponentReady = true;
    this.opponentStatusText.setText('READY!');
    this.opponentStatusText.setColor('#00ff00');

    // If we're also ready, start the game
    if (this.isPlayerReady) {
      this.startGame();
    }
  }

  async startGame() {
    // Broadcast game start
    await networkManager.sendGameAction('game-start', {
      timestamp: Date.now(),
    });

    this.onGameStart({ timestamp: Date.now() });
  }

  onGameStart(data) {
    if (this.isGameStarted) return;

    this.isGameStarted = true;
    this.input.enabled = true;

    // Hide ready button
    this.readyButton.setVisible(false);
    this.readyButtonText.setVisible(false);

    this.statusText.setText('GAME STARTED!');
    this.statusText.setColor('#00ff00');

    // Start timer
    this.timer.start();

    // Update UI
    this.updateUI();

    // Flash to indicate start
    this.visualEffects.screenFlash(0x00ff00, 0.3, 200);
  }

  updateUI() {
    this.scoreText.setText(`SCORE: ${this.scoreManager.getFormattedScore()}`);
    this.matchesText.setText(`MATCHES: ${this.scoreManager.getTotalMatches()}`);

    this.opponentScoreText.setText(`SCORE: ${this.opponentScore.toString().padStart(6, '0')}`);
    this.opponentMatchesText.setText(`MATCHES: ${this.opponentMatches}`);
  }

  updateTimerDisplay(remainingTime) {
    this.timerText.setText(`TIME: ${this.timer.getFormattedTime()}`);

    // Update timer bar
    const percentage = this.timer.getPercentageRemaining() / 100;
    this.timerBar.scaleX = percentage;

    // Change color based on time remaining
    if (this.timer.isAlmostDone()) {
      this.timerBar.setFillStyle(0xff0000);
    } else if (this.timer.isRunningLow()) {
      this.timerBar.setFillStyle(0xffaa00);
    } else {
      this.timerBar.setFillStyle(0x00ff00);
    }
  }

  updateOpponentInfo() {
    // Get opponent player from presence or room data
    EventBus.on('multiplayer:presence-update', (players) => {
      const opponent = players.find(p => p.player_id !== this.playerProfile.id);
      if (opponent) {
        this.opponentNameText.setText(opponent.username || 'Opponent');
      }
    }, this);
  }

  async broadcastTileSwap(tile1, tile2) {
    await networkManager.sendGameAction('tile-swap', {
      tile1: { row: tile1.row, col: tile1.col },
      tile2: { row: tile2.row, col: tile2.col },
    });
  }

  async broadcastMatchMade(matchCount, comboCount) {
    const newScore = this.scoreManager.getScore();
    const totalMatches = this.scoreManager.getTotalMatches();

    await networkManager.sendGameAction('match-made', {
      matchCount,
      comboCount,
      score: newScore,
      totalMatches,
    });

    // Also update score
    await this.broadcastScoreUpdate();
  }

  async broadcastScoreUpdate() {
    const result = await this.board.processMatches(this.board.findMatches());

    if (result.matches.length > 0) {
      const points = this.scoreManager.addScore(result.matches, result.combos);
      this.updateUI();

      await networkManager.sendGameAction('score-update', {
        score: this.scoreManager.getScore(),
        matches: this.scoreManager.getTotalMatches(),
      });
    }
  }

  onOpponentScoreUpdate(data) {
    this.opponentScore = data.score;
    this.opponentMatches = data.matches;
    this.updateUI();
  }

  onOpponentMatch(data) {
    // Visual feedback that opponent made a match
    const comboText = data.comboCount > 1 ? ` (x${data.comboCount} COMBO!)` : '';

    // Flash opponent's score area
    this.tweens.add({
      targets: this.opponentScoreText,
      scale: { from: 1, to: 1.2 },
      duration: 150,
      yoyo: true,
    });
  }

  onOpponentLeft() {
    this.statusText.setText('Opponent disconnected!');
    this.statusText.setColor('#ff5555');

    // Auto-win if opponent leaves
    this.time.delayedCall(2000, () => {
      this.endGame(true);
    });
  }

  onOpponentGameOver(data) {
    // Opponent finished or left
    console.log('Opponent game over:', data);
  }

  async endGame(opponentDisconnected = false) {
    if (!this.isGameStarted) return;

    GameStateManager.set('isGameOver', true);
    this.timer.stop();
    this.input.enabled = false;

    const playerScore = this.scoreManager.getScore();
    const opponentScore = this.opponentScore;

    // Determine winner
    let isWinner = false;
    let resultMessage = '';

    if (opponentDisconnected) {
      isWinner = true;
      resultMessage = 'Opponent disconnected!\nYou win by default!';
    } else if (playerScore > opponentScore) {
      isWinner = true;
      resultMessage = 'You scored higher!\nVictory is yours!';
    } else if (playerScore < opponentScore) {
      isWinner = false;
      resultMessage = 'Opponent scored higher.\nBetter luck next time!';
    } else {
      resultMessage = 'Scores are tied!\nIt\'s a draw!';
    }

    // Update game result UI
    this.gameOverTitle.setText(isWinner ? 'VICTORY!' : 'DEFEAT');
    this.gameOverTitle.setColor(isWinner ? '#00ff00' : '#ff5555');
    this.resultText.setText(resultMessage);
    this.finalScoresText.setText(
      `Your Score: ${playerScore}\nOpponent Score: ${opponentScore}`
    );

    // Show effects
    if (isWinner) {
      this.visualEffects.createSuccessEffect();
      this.soundManager.play('highScore');
    } else {
      this.soundManager.play('gameOver');
    }

    // Show game over screen
    this.gameOverContainer.setVisible(true);

    // Update stats and submit score
    const winnerId = isWinner ? this.playerProfile.id : null;
    const gameDuration = TIMER_CONFIG.MULTIPLAYER_TIME - this.timer.getRemainingTime();

    await matchmaking.endGame(winnerId, gameDuration);
    await matchmaking.submitScore(playerScore);

    // Broadcast game over to opponent
    await networkManager.sendGameAction('game-over', {
      score: playerScore,
      winner: isWinner,
    });
  }

  cleanup() {
    // Clean up event listeners
    EventBus.off('tiles:matched');
    EventBus.off('tiles:swapped');
    EventBus.off('tiles:swap-failed');
    EventBus.off('multiplayer:player-ready', this.onOpponentReady, this);
    EventBus.off('multiplayer:game-start', this.onGameStart, this);
    EventBus.off('multiplayer:score-update', this.onOpponentScoreUpdate, this);
    EventBus.off('multiplayer:match-made', this.onOpponentMatch, this);
    EventBus.off('multiplayer:game-over', this.onOpponentGameOver, this);
    EventBus.off('multiplayer:player-left', this.onOpponentLeft, this);

    // Leave network room
    networkManager.leaveGameRoom();

    // Destroy game objects
    if (this.timer) this.timer.destroy();
    if (this.board) this.board.destroy();
    if (this.soundManager) this.soundManager.destroy();
  }

  shutdown() {
    this.cleanup();
  }
}
