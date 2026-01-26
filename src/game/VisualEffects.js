import Phaser from 'phaser';
import { TILE_COLORS } from '../utils/constants.js';

export default class VisualEffects {
  constructor(scene) {
    this.scene = scene;
  }

  /**
   * Create particle explosion effect at position
   */
  createExplosion(x, y, color, count = 10) {
    const particles = [];

    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count;
      const speed = Phaser.Math.Between(100, 200);
      const particle = this.scene.add.circle(x, y, 4, color);

      const velocityX = Math.cos(angle) * speed;
      const velocityY = Math.sin(angle) * speed;

      this.scene.tweens.add({
        targets: particle,
        x: x + velocityX,
        y: y + velocityY,
        alpha: 0,
        scale: 0.5,
        duration: 500,
        ease: 'Power2',
        onComplete: () => {
          particle.destroy();
        },
      });

      particles.push(particle);
    }

    return particles;
  }

  /**
   * Create match effect with particles
   */
  createMatchEffect(tiles) {
    tiles.forEach((tile) => {
      const x = tile.container.x;
      const y = tile.container.y;
      const color = TILE_COLORS[tile.type];

      // Explosion particles
      this.createExplosion(x, y, color, 12);

      // Flash effect
      const flash = this.scene.add.circle(x, y, 40, 0xffffff, 0.8);
      this.scene.tweens.add({
        targets: flash,
        alpha: 0,
        scale: 1.5,
        duration: 300,
        ease: 'Power2',
        onComplete: () => {
          flash.destroy();
        },
      });
    });
  }

  /**
   * Create combo text effect
   */
  createComboText(comboCount) {
    const width = this.scene.cameras.main.width;
    const height = this.scene.cameras.main.height;

    const text = this.scene.add.text(width / 2, height / 2, `COMBO x${comboCount}!`, {
      font: 'bold 48px monospace',
      fill: '#ffff00',
      stroke: '#000000',
      strokeThickness: 6,
    });
    text.setOrigin(0.5);
    text.setAlpha(0);
    text.setScale(0.5);

    this.scene.tweens.add({
      targets: text,
      alpha: 1,
      scale: 1.2,
      duration: 200,
      ease: 'Back.out',
      onComplete: () => {
        this.scene.tweens.add({
          targets: text,
          alpha: 0,
          scale: 0.8,
          y: height / 2 - 50,
          duration: 500,
          delay: 500,
          ease: 'Power2',
          onComplete: () => {
            text.destroy();
          },
        });
      },
    });
  }

  /**
   * Screen shake effect
   */
  screenShake(intensity = 0.005, duration = 100) {
    this.scene.cameras.main.shake(duration, intensity);
  }

  /**
   * Flash the screen
   */
  screenFlash(color = 0xffffff, alpha = 0.3, duration = 100) {
    this.scene.cameras.main.flash(duration, color >> 16, (color >> 8) & 0xff, color & 0xff, false, alpha);
  }

  /**
   * Create glow effect on tile
   */
  createGlow(sprite, color, intensity = 2) {
    const glow = this.scene.add.circle(sprite.x, sprite.y, sprite.radius * 1.5, color, 0.3);
    glow.setDepth(sprite.depth - 1);

    this.scene.tweens.add({
      targets: glow,
      scale: { from: 1, to: 1.3 },
      alpha: { from: 0.3, to: 0 },
      duration: 800,
      repeat: -1,
      yoyo: true,
    });

    return glow;
  }

  /**
   * Create floating score text
   */
  createFloatingScore(x, y, points, isCombo = false) {
    const text = this.scene.add.text(x, y, `+${points}`, {
      font: `bold ${isCombo ? 36 : 28}px monospace`,
      fill: isCombo ? '#ffff00' : '#ffffff',
      stroke: '#000000',
      strokeThickness: 4,
    });
    text.setOrigin(0.5);

    this.scene.tweens.add({
      targets: text,
      y: y - 80,
      alpha: 0,
      duration: 1000,
      ease: 'Power2',
      onComplete: () => {
        text.destroy();
      },
    });
  }

  /**
   * Create trail effect
   */
  createTrail(fromX, fromY, toX, toY, color) {
    const trail = this.scene.add.graphics();
    trail.lineStyle(4, color, 0.6);
    trail.lineBetween(fromX, fromY, toX, toY);

    this.scene.tweens.add({
      targets: trail,
      alpha: 0,
      duration: 300,
      onComplete: () => {
        trail.destroy();
      },
    });
  }

  /**
   * Create ripple effect
   */
  createRipple(x, y, color) {
    const ripple = this.scene.add.circle(x, y, 10, color, 0.5);

    this.scene.tweens.add({
      targets: ripple,
      radius: 80,
      alpha: 0,
      duration: 600,
      ease: 'Power2',
      onComplete: () => {
        ripple.destroy();
      },
    });
  }

  /**
   * Create success effect (for level complete, etc.)
   */
  createSuccessEffect() {
    const width = this.scene.cameras.main.width;
    const height = this.scene.cameras.main.height;

    // Create multiple bursts
    const colors = TILE_COLORS;
    for (let i = 0; i < 5; i++) {
      const x = Phaser.Math.Between(width * 0.2, width * 0.8);
      const y = Phaser.Math.Between(height * 0.2, height * 0.8);
      const color = colors[Phaser.Math.Between(0, colors.length - 1)];

      this.scene.time.delayedCall(i * 100, () => {
        this.createExplosion(x, y, color, 20);
      });
    }

    this.screenFlash(0xffffff, 0.5, 200);
  }

  /**
   * Create time warning pulse effect
   */
  createTimeWarningPulse(target) {
    return this.scene.tweens.add({
      targets: target,
      scale: { from: 1, to: 1.1 },
      duration: 300,
      yoyo: true,
      repeat: -1,
    });
  }

  /**
   * Destroy all active effects
   */
  destroy() {
    // Effects are automatically cleaned up by their tweens
  }
}
