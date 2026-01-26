import Phaser from 'phaser';
import { SCENES } from '../utils/constants.js';
import { authManager } from '../multiplayer/AuthManager.js';
import { matchmaking } from '../multiplayer/Matchmaking.js';
import EventBus from '../state/EventBus.js';

export default class MultiplayerLobbyScene extends Phaser.Scene {
  constructor() {
    super({ key: SCENES.MULTIPLAYER_LOBBY });
  }

  create() {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    // Get player profile
    const player = authManager.getPlayerProfile();

    // Title
    const title = this.add.text(width / 2, 60, 'MULTIPLAYER LOBBY', {
      font: 'bold 32px monospace',
      fill: '#ffffff',
    });
    title.setOrigin(0.5);

    // Welcome message
    if (player) {
      const welcome = this.add.text(width / 2, 110, `Welcome, ${player.username}!`, {
        font: '18px monospace',
        fill: '#00ff00',
      });
      welcome.setOrigin(0.5);

      // Player stats
      const stats = this.add.text(width / 2, 145,
        `Wins: ${player.total_wins || 0} | Losses: ${player.total_losses || 0} | Games: ${player.total_games || 0}`, {
        font: '14px monospace',
        fill: '#cccccc',
      });
      stats.setOrigin(0.5);
    }

    // Find Match button
    this.findMatchBtn = this.createButton(
      width / 2,
      height / 2 - 40,
      300,
      70,
      'Find Match',
      0x4CAF50,
      () => this.startMatchmaking()
    );

    const findMatchDesc = this.add.text(width / 2, height / 2 + 50, 'Search for an opponent', {
      font: '14px monospace',
      fill: '#cccccc',
    });
    findMatchDesc.setOrigin(0.5);

    // Leaderboard button
    const leaderboardBtn = this.createButton(
      width / 2,
      height / 2 + 100,
      300,
      60,
      'Leaderboard',
      0x2196F3,
      () => this.showLeaderboard()
    );

    // Sign Out button
    const signOutBtn = this.createButton(
      width / 2,
      height / 2 + 180,
      300,
      60,
      'Sign Out',
      0x666666,
      () => this.handleSignOut()
    );

    // Back button
    const backBtn = this.createButton(
      width / 2,
      height - 60,
      200,
      40,
      'Back to Menu',
      0x444444,
      () => this.scene.start(SCENES.MENU)
    );

    // Status text (for matchmaking feedback)
    this.statusText = this.add.text(width / 2, height - 120, '', {
      font: '16px monospace',
      fill: '#ffff00',
    });
    this.statusText.setOrigin(0.5);

    // Listen for matchmaking events
    EventBus.on('matchmaking:searching', this.onSearching, this);
    EventBus.on('matchmaking:match-found', this.onMatchFound, this);
    EventBus.on('matchmaking:cancelled', this.onCancelled, this);

    // Fade in
    this.cameras.main.fadeIn(500);
  }

  async startMatchmaking() {
    this.statusText.setText('Searching for opponent...');

    // Disable find match button
    this.findMatchBtn.button.setFillStyle(0x666666);
    this.findMatchBtn.button.disableInteractive();
    this.findMatchBtn.text.setText('Searching...');

    // Add pulse animation to status text
    this.tweens.add({
      targets: this.statusText,
      alpha: { from: 1, to: 0.3 },
      duration: 800,
      yoyo: true,
      repeat: -1,
    });

    // Start matchmaking
    const { error } = await matchmaking.startMatchmaking();

    if (error) {
      console.error('Matchmaking error:', error);

      let errorMessage = 'Error finding match. Please try again.';

      if (error.message && error.message.includes('Database tables not created')) {
        errorMessage = 'Database not set up.\nPlease run SQL from SUPABASE_SETUP.md';
      } else if (error.code === '42P01') {
        errorMessage = 'Tables not found.\nCheck SUPABASE_SETUP.md';
      } else if (error.message) {
        errorMessage = `Error: ${error.message}`;
      }

      this.statusText.setText(errorMessage);
      this.statusText.setColor('#ff5555');
      this.tweens.killTweensOf(this.statusText);
      this.statusText.setAlpha(1);

      // Re-enable button
      this.findMatchBtn.button.setFillStyle(0x4CAF50);
      this.findMatchBtn.button.setInteractive({ useHandCursor: true });
      this.findMatchBtn.text.setText('Find Match');
    }
  }

  onSearching() {
    // Update status based on search duration
    this.searchTimer = this.time.addEvent({
      delay: 1000,
      callback: () => {
        const duration = Math.floor(matchmaking.getSearchDuration() / 1000);
        this.statusText.setText(`Searching for opponent... ${duration}s`);
      },
      loop: true,
    });
  }

  onMatchFound(room) {
    console.log('[MultiplayerLobby] Match found!', room);
    console.log('[MultiplayerLobby] Room ID:', room.id);
    console.log('[MultiplayerLobby] Room status:', room.status);
    console.log('[MultiplayerLobby] Player 1:', room.player1_id);
    console.log('[MultiplayerLobby] Player 2:', room.player2_id);

    // Stop search timer
    if (this.searchTimer) {
      this.searchTimer.remove();
    }

    this.tweens.killTweensOf(this.statusText);
    this.statusText.setAlpha(1);
    this.statusText.setText('Match found! Starting game...');
    this.statusText.setColor('#00ff00');

    // Transition to multiplayer game scene
    console.log('[MultiplayerLobby] Starting transition to game in 1.5s...');
    this.time.delayedCall(1500, () => {
      console.log('[MultiplayerLobby] Fading out camera...');
      this.cameras.main.fadeOut(500);
      this.time.delayedCall(500, () => {
        console.log('[MultiplayerLobby] Starting MULTIPLAYER scene with room:', room);
        this.scene.start(SCENES.MULTIPLAYER, { room });
      });
    });
  }

  onCancelled() {
    if (this.searchTimer) {
      this.searchTimer.remove();
    }

    this.tweens.killTweensOf(this.statusText);
    this.statusText.setAlpha(1);
    this.statusText.setText('Search cancelled.');
    this.statusText.setColor('#cccccc');

    // Re-enable button
    this.findMatchBtn.button.setFillStyle(0x4CAF50);
    this.findMatchBtn.button.setInteractive({ useHandCursor: true });
    this.findMatchBtn.text.setText('Find Match');
  }

  async showLeaderboard() {
    this.statusText.setText('Loading leaderboard...');

    const leaderboard = await matchmaking.getLeaderboard(10);

    if (leaderboard.length === 0) {
      this.statusText.setText('No scores yet. Be the first!');
      this.statusText.setColor('#ffff00');
      return;
    }

    // Create leaderboard overlay
    const overlay = this.add.rectangle(0, 0, 800, 600, 0x000000, 0.9);
    overlay.setOrigin(0, 0);
    overlay.setInteractive();

    const panel = this.add.rectangle(400, 300, 600, 500, 0x2d2d2d);
    panel.setStrokeStyle(3, 0xffffff, 0.8);

    const titleText = this.add.text(400, 80, 'LEADERBOARD', {
      font: 'bold 28px monospace',
      fill: '#ffffff',
    });
    titleText.setOrigin(0.5);

    // Display leaderboard entries and track them
    const entryTexts = [];
    leaderboard.forEach((entry, index) => {
      const rank = index + 1;
      const medal = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `${rank}.`;
      const username = entry.players?.username || 'Unknown';
      const score = entry.score;

      const entryText = this.add.text(150, 140 + index * 35, `${medal} ${username}: ${score}`, {
        font: '18px monospace',
        fill: rank <= 3 ? '#FFD700' : '#ffffff',
      });
      entryTexts.push(entryText);
    });

    // Close button
    const closeBtn = this.createButton(
      400,
      520,
      200,
      50,
      'Close',
      0x666666,
      () => {
        overlay.destroy();
        panel.destroy();
        titleText.destroy();
        entryTexts.forEach(text => text.destroy());
        closeBtn.button.destroy();
        closeBtn.text.destroy();
        this.statusText.setText('');
      }
    );

    this.statusText.setText('');
  }

  async handleSignOut() {
    await authManager.signOut();
    this.scene.start(SCENES.MENU);
  }

  createButton(x, y, width, height, text, color, onClick) {
    const button = this.add.rectangle(x, y, width, height, color);
    button.setStrokeStyle(2, 0xffffff, 0.6);

    const buttonText = this.add.text(x, y, text, {
      font: 'bold 20px monospace',
      fill: '#ffffff',
    });
    buttonText.setOrigin(0.5);

    button.setInteractive({ useHandCursor: true });

    button.on('pointerover', () => {
      const lightColor = Phaser.Display.Color.ValueToColor(color);
      lightColor.lighten(20);
      button.setFillStyle(lightColor.color);
      button.setStrokeStyle(3, 0xffffff, 1);
      this.tweens.add({
        targets: [button, buttonText],
        scaleX: 1.05,
        scaleY: 1.05,
        duration: 100,
      });
    });

    button.on('pointerout', () => {
      button.setFillStyle(color);
      button.setStrokeStyle(2, 0xffffff, 0.6);
      this.tweens.add({
        targets: [button, buttonText],
        scaleX: 1,
        scaleY: 1,
        duration: 100,
      });
    });

    button.on('pointerdown', () => {
      this.tweens.add({
        targets: [button, buttonText],
        scaleX: 0.95,
        scaleY: 0.95,
        duration: 50,
        yoyo: true,
        onComplete: onClick,
      });
    });

    return { button, text: buttonText };
  }

  shutdown() {
    EventBus.off('matchmaking:searching', this.onSearching, this);
    EventBus.off('matchmaking:match-found', this.onMatchFound, this);
    EventBus.off('matchmaking:cancelled', this.onCancelled, this);

    if (this.searchTimer) {
      this.searchTimer.remove();
    }
  }
}
