import Phaser from 'phaser';
import { SCENES } from '../utils/constants.js';
import { authManager } from '../multiplayer/AuthManager.js';
import { isSupabaseConfigured } from '../multiplayer/supabaseClient.js';
import EventBus from '../state/EventBus.js';

export default class LoginScene extends Phaser.Scene {
  constructor() {
    super({ key: SCENES.LOGIN });
  }

  create() {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    // Check if Supabase is configured
    if (!isSupabaseConfigured()) {
      this.showSupabaseNotConfigured();
      return;
    }

    // Title
    const title = this.add.text(width / 2, 80, 'MULTIPLAYER LOGIN', {
      font: 'bold 32px monospace',
      fill: '#ffffff',
    });
    title.setOrigin(0.5);

    // Quick Play button (anonymous login)
    const quickPlayBtn = this.createButton(
      width / 2,
      height / 2 - 80,
      300,
      60,
      'Quick Play',
      0x4CAF50,
      () => this.handleQuickPlay()
    );

    const quickPlayDesc = this.add.text(width / 2, height / 2 - 35, 'Join as guest (no account needed)', {
      font: '12px monospace',
      fill: '#cccccc',
    });
    quickPlayDesc.setOrigin(0.5);

    // Divider
    const divider = this.add.text(width / 2, height / 2 + 20, '- OR -', {
      font: 'bold 16px monospace',
      fill: '#666666',
    });
    divider.setOrigin(0.5);

    // Create Account button
    const createAccountBtn = this.createButton(
      width / 2,
      height / 2 + 80,
      300,
      60,
      'Create Account',
      0x2196F3,
      () => this.showSignUpForm()
    );

    // Sign In button
    const signInBtn = this.createButton(
      width / 2,
      height / 2 + 160,
      300,
      60,
      'Sign In',
      0x666666,
      () => this.showSignInForm()
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

    // Listen for successful authentication
    EventBus.on('auth:signed-in', () => {
      console.log('[LoginScene] Received auth:signed-in event, transitioning to lobby...');
      this.scene.start(SCENES.MULTIPLAYER_LOBBY);
    }, this);

    // Fade in
    this.cameras.main.fadeIn(500);
  }

  async handleQuickPlay() {
    console.log('[LoginScene] Quick Play clicked');
    this.showLoadingMessage('Connecting...');

    const { error } = await authManager.signInAnonymously();

    console.log('[LoginScene] signInAnonymously returned, error:', error);

    if (error) {
      console.error('Quick play error:', error);
      console.error('Error message:', error.message);
      console.error('Error code:', error.code);

      let errorMessage = 'Failed to connect. Please try again.';

      if (error.message && error.message.includes('Database not set up')) {
        errorMessage = 'Database not set up.\nRun SQL from SUPABASE_SETUP.md';
      } else if (error.message && error.message.includes('Player profile not found')) {
        errorMessage = 'Tables not created.\nRun SQL from SUPABASE_SETUP.md';
      } else if (error.message && error.message.includes('Anonymous sign-ins are disabled')) {
        errorMessage = 'Anonymous login disabled.\nEnable in Supabase Auth settings.';
      } else if (error.code === '42P01') {
        errorMessage = 'Tables missing.\nRun SQL from SUPABASE_SETUP.md';
      } else if (error.message) {
        // Show the actual error message for debugging
        errorMessage = `Error: ${error.message.substring(0, 100)}`;
      }

      this.showErrorMessage(errorMessage);
    } else {
      console.log('[LoginScene] No error, waiting for auth:signed-in event...');
      // Scene will transition via auth:signed-in event
    }
  }

  showSignUpForm() {
    // For Phase 3, we'll use anonymous login primarily
    // Full email/password signup can be added in Phase 5
    this.showInfoMessage('Email signup coming soon! Use Quick Play for now.');
  }

  showSignInForm() {
    // For Phase 3, we'll use anonymous login primarily
    this.showInfoMessage('Email sign-in coming soon! Use Quick Play for now.');
  }

  showSupabaseNotConfigured() {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    const overlay = this.add.rectangle(0, 0, width, height, 0x000000, 0.9);
    overlay.setOrigin(0, 0);

    const title = this.add.text(width / 2, height / 2 - 100, 'Supabase Not Configured', {
      font: 'bold 24px monospace',
      fill: '#ff5555',
    });
    title.setOrigin(0.5);

    const message = this.add.text(width / 2, height / 2,
      'Multiplayer requires Supabase configuration.\n\n' +
      'Please see SUPABASE_SETUP.md\n' +
      'for setup instructions.', {
      font: '16px monospace',
      fill: '#ffffff',
      align: 'center',
    });
    message.setOrigin(0.5);

    const backBtn = this.createButton(
      width / 2,
      height / 2 + 120,
      200,
      50,
      'Back to Menu',
      0x666666,
      () => this.scene.start(SCENES.MENU)
    );
  }

  showLoadingMessage(text) {
    if (this.messageText) {
      this.messageText.destroy();
    }

    const width = this.cameras.main.width;
    this.messageText = this.add.text(width / 2, 500, text, {
      font: '18px monospace',
      fill: '#ffff00',
    });
    this.messageText.setOrigin(0.5);

    // Pulse animation
    this.tweens.add({
      targets: this.messageText,
      alpha: { from: 1, to: 0.3 },
      duration: 800,
      yoyo: true,
      repeat: -1,
    });
  }

  showErrorMessage(text) {
    if (this.messageText) {
      this.messageText.destroy();
    }

    const width = this.cameras.main.width;
    this.messageText = this.add.text(width / 2, 500, text, {
      font: '18px monospace',
      fill: '#ff5555',
    });
    this.messageText.setOrigin(0.5);

    // Auto-clear after 3 seconds
    this.time.delayedCall(3000, () => {
      if (this.messageText) {
        this.tweens.add({
          targets: this.messageText,
          alpha: 0,
          duration: 500,
          onComplete: () => {
            if (this.messageText) {
              this.messageText.destroy();
              this.messageText = null;
            }
          },
        });
      }
    });
  }

  showInfoMessage(text) {
    if (this.messageText) {
      this.messageText.destroy();
    }

    const width = this.cameras.main.width;
    this.messageText = this.add.text(width / 2, 500, text, {
      font: '16px monospace',
      fill: '#00aaff',
    });
    this.messageText.setOrigin(0.5);

    // Auto-clear after 3 seconds
    this.time.delayedCall(3000, () => {
      if (this.messageText) {
        this.tweens.add({
          targets: this.messageText,
          alpha: 0,
          duration: 500,
          onComplete: () => {
            if (this.messageText) {
              this.messageText.destroy();
              this.messageText = null;
            }
          },
        });
      }
    });
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
    EventBus.off('auth:signed-in');
    if (this.messageText) {
      this.messageText.destroy();
      this.messageText = null;
    }
  }
}
