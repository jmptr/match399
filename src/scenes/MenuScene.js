import Phaser from 'phaser';
import { SCENES, TILE_COLORS } from '../utils/constants.js';
import GameStateManager from '../state/GameStateManager.js';

export default class MenuScene extends Phaser.Scene {
  constructor() {
    super({ key: SCENES.MENU });
  }

  create() {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    // Animated background particles
    this.createBackgroundParticles();

    // Title with glow effect
    const titleShadow = this.add.text(width / 2, 102, 'MATCH-3', {
      font: 'bold 64px monospace',
      fill: '#000000',
    });
    titleShadow.setOrigin(0.5);
    titleShadow.setAlpha(0.5);

    const title = this.add.text(width / 2, 100, 'MATCH-3', {
      font: 'bold 64px monospace',
      fill: '#ffffff',
      stroke: '#4CAF50',
      strokeThickness: 4,
    });
    title.setOrigin(0.5);

    // Pulse animation for title
    this.tweens.add({
      targets: title,
      scale: { from: 1, to: 1.05 },
      duration: 1500,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    // Single Player Button
    const singlePlayerBtn = this.createButton(
      width / 2,
      height / 2 - 50,
      300,
      60,
      'Single Player',
      0x4CAF50,
      () => {
        this.cameras.main.fadeOut(300);
        this.time.delayedCall(300, () => {
          this.scene.start(SCENES.SINGLE_PLAYER);
        });
      }
    );

    // Multiplayer Button
    const multiplayerBtn = this.createButton(
      width / 2,
      height / 2 + 50,
      300,
      60,
      'Multiplayer',
      0xFF9800,
      () => {
        this.cameras.main.fadeOut(300);
        this.time.delayedCall(300, () => {
          this.scene.start(SCENES.LOGIN);
        });
      }
    );

    const multiplayerNote = this.add.text(width / 2, height / 2 + 85, '(Requires Supabase setup)', {
      font: '12px monospace',
      fill: '#999999',
    });
    multiplayerNote.setOrigin(0.5);

    // Settings button
    const settingsBtn = this.createButton(
      width / 2,
      height / 2 + 150,
      300,
      60,
      'Settings',
      0x2196F3,
      () => this.showSettings()
    );

    // High Score display
    const highScore = GameStateManager.get('highScore') || 0;
    const highScoreText = this.add.text(width / 2, height - 80, `HIGH SCORE: ${highScore.toString().padStart(6, '0')}`, {
      font: 'bold 20px monospace',
      fill: '#FFD700',
    });
    highScoreText.setOrigin(0.5);

    // Instructions
    const instructions = this.add.text(width / 2, height - 40, 'Match 3 or more tiles • Build combos • Beat the clock!', {
      font: '14px monospace',
      fill: '#cccccc',
    });
    instructions.setOrigin(0.5);

    // Fade in animation
    this.cameras.main.fadeIn(500);
  }

  createButton(x, y, width, height, text, color, onClick, disabled = false) {
    const button = this.add.rectangle(x, y, width, height, color);
    button.setStrokeStyle(2, 0xffffff, disabled ? 0.3 : 0.6);

    const buttonText = this.add.text(x, y, text, {
      font: `bold ${disabled ? 20 : 24}px monospace`,
      fill: disabled ? '#999999' : '#ffffff',
    });
    buttonText.setOrigin(0.5);

    if (!disabled && onClick) {
      button.setInteractive({ useHandCursor: true });

      button.on('pointerover', () => {
        const lightColor = Phaser.Display.Color.ValueToColor(color);
        lightColor.lighten(20);
        button.setFillStyle(lightColor.color);
        button.setStrokeStyle(3, 0xffffff, 1);
        this.tweens.add({
          targets: button,
          scaleX: 1.05,
          scaleY: 1.05,
          duration: 100,
        });
      });

      button.on('pointerout', () => {
        button.setFillStyle(color);
        button.setStrokeStyle(2, 0xffffff, 0.6);
        this.tweens.add({
          targets: button,
          scaleX: 1,
          scaleY: 1,
          duration: 100,
        });
      });

      button.on('pointerdown', () => {
        this.tweens.add({
          targets: button,
          scaleX: 0.95,
          scaleY: 0.95,
          duration: 50,
          yoyo: true,
          onComplete: onClick,
        });
      });
    }

    return { button, text: buttonText };
  }

  createBackgroundParticles() {
    // Create floating gem particles in background
    for (let i = 0; i < 8; i++) {
      const x = Phaser.Math.Between(50, 750);
      const y = Phaser.Math.Between(50, 550);
      const color = TILE_COLORS[Phaser.Math.Between(0, TILE_COLORS.length - 1)];
      const size = Phaser.Math.Between(10, 20);

      const particle = this.add.circle(x, y, size, color, 0.15);

      this.tweens.add({
        targets: particle,
        y: y + Phaser.Math.Between(-50, 50),
        x: x + Phaser.Math.Between(-30, 30),
        alpha: { from: 0.15, to: 0.3 },
        duration: Phaser.Math.Between(3000, 5000),
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
    }
  }

  showSettings() {
    // Create settings overlay
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    const overlay = this.add.rectangle(0, 0, width, height, 0x000000, 0.8);
    overlay.setOrigin(0, 0);

    const panel = this.add.rectangle(width / 2, height / 2, 500, 400, 0x2d2d2d);
    panel.setStrokeStyle(3, 0xffffff, 0.8);

    const titleText = this.add.text(width / 2, height / 2 - 150, 'SETTINGS', {
      font: 'bold 32px monospace',
      fill: '#ffffff',
    });
    titleText.setOrigin(0.5);

    // Sound toggle
    const soundEnabled = GameStateManager.getSetting('soundEnabled');
    const soundText = this.add.text(width / 2 - 150, height / 2 - 70, `Sound: ${soundEnabled ? 'ON' : 'OFF'}`, {
      font: '20px monospace',
      fill: '#ffffff',
    });

    const soundToggle = this.add.rectangle(width / 2 + 100, height / 2 - 70, 100, 40, soundEnabled ? 0x4CAF50 : 0x666666);
    soundToggle.setInteractive({ useHandCursor: true });
    soundToggle.on('pointerdown', () => {
      const newState = !GameStateManager.getSetting('soundEnabled');
      GameStateManager.setSetting('soundEnabled', newState);
      soundText.setText(`Sound: ${newState ? 'ON' : 'OFF'}`);
      soundToggle.setFillStyle(newState ? 0x4CAF50 : 0x666666);
    });

    // Music toggle
    const musicEnabled = GameStateManager.getSetting('musicEnabled');
    const musicText = this.add.text(width / 2 - 150, height / 2 - 10, `Music: ${musicEnabled ? 'ON' : 'OFF'}`, {
      font: '20px monospace',
      fill: '#ffffff',
    });

    const musicToggle = this.add.rectangle(width / 2 + 100, height / 2 - 10, 100, 40, musicEnabled ? 0x4CAF50 : 0x666666);
    musicToggle.setInteractive({ useHandCursor: true });
    musicToggle.on('pointerdown', () => {
      const newState = !GameStateManager.getSetting('musicEnabled');
      GameStateManager.setSetting('musicEnabled', newState);
      musicText.setText(`Music: ${newState ? 'ON' : 'OFF'}`);
      musicToggle.setFillStyle(newState ? 0x4CAF50 : 0x666666);
    });

    // Close button
    const closeBtn = this.createButton(width / 2, height / 2 + 120, 200, 50, 'Close', 0x666666, () => {
      overlay.destroy();
      panel.destroy();
      titleText.destroy();
      soundText.destroy();
      soundToggle.destroy();
      musicText.destroy();
      musicToggle.destroy();
      closeBtn.button.destroy();
      closeBtn.text.destroy();
    });
  }
}
