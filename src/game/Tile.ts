import Phaser from 'phaser';
import { BOARD_CONFIG, TILE_COLORS } from '../utils/constants.js';
import { gridToPixel } from '../utils/helpers.js';

export default class Tile {
  scene: Phaser.Scene;
  row: number;
  col: number;
  type: number;
  isMatched: boolean;
  isMoving: boolean;
  container: Phaser.GameObjects.Container;
  sprite: Phaser.GameObjects.Image;
  private glowCircle: Phaser.GameObjects.Arc | null;
  private highlightTween: Phaser.Tweens.Tween | null;

  constructor(scene: Phaser.Scene, row: number, col: number, type: number) {
    this.scene = scene;
    this.row = row;
    this.col = col;
    this.type = type;
    this.isMatched = false;
    this.isMoving = false;
    this.glowCircle = null;
    this.highlightTween = null;

    // Create the visual representation
    const pos = gridToPixel(row, col, BOARD_CONFIG.TILE_SIZE, BOARD_CONFIG.OFFSET_X, BOARD_CONFIG.OFFSET_Y);

    // Create a container for the tile
    this.container = scene.add.container(pos.x, pos.y);

    // Create the main tile shape (hexagon-like gem)
    const size = BOARD_CONFIG.TILE_SIZE * 0.38;
    const textureSize = size * 2 + 10;
    const center = textureSize / 2;
    const graphics = scene.add.graphics();

    // Draw gem shape (centered in texture)
    graphics.fillStyle(TILE_COLORS[type], 1);
    graphics.fillCircle(center, center, size);

    // Add gradient effect with lighter center
    const lightColor = Phaser.Display.Color.ValueToColor(TILE_COLORS[type]);
    lightColor.lighten(30);
    graphics.fillStyle(lightColor.color, 0.6);
    graphics.fillCircle(center - size * 0.3, center - size * 0.3, size * 0.5);

    // Add shine effect
    graphics.fillStyle(0xffffff, 0.4);
    graphics.fillCircle(center - size * 0.4, center - size * 0.4, size * 0.25);

    // Add border
    graphics.lineStyle(3, 0xffffff, 0.8);
    graphics.strokeCircle(center, center, size);

    // Generate texture from graphics
    graphics.generateTexture(`tile-${type}`, textureSize, textureSize);
    graphics.destroy();

    // Create sprite from generated texture
    this.sprite = scene.add.image(0, 0, `tile-${type}`);
    this.sprite.setInteractive({ useHandCursor: true });

    this.container.add(this.sprite);

    // Store reference to this tile in the sprite for easy access
    (this.sprite as any).tileRef = this;
    (this.container as any).tileRef = this;

    // Add entrance animation
    this.container.setScale(0);
    scene.tweens.add({
      targets: this.container,
      scale: 1,
      duration: 200,
      ease: 'Back.out',
    });
  }

  /**
   * Update the tile's position on the board
   */
  setPosition(row: number, col: number): void {
    this.row = row;
    this.col = col;
  }

  /**
   * Animate tile movement to a new grid position
   */
  moveTo(row: number, col: number, duration: number = 300): Promise<void> {
    return new Promise((resolve) => {
      this.isMoving = true;
      this.setPosition(row, col);

      const pos = gridToPixel(row, col, BOARD_CONFIG.TILE_SIZE, BOARD_CONFIG.OFFSET_X, BOARD_CONFIG.OFFSET_Y);

      this.scene.tweens.add({
        targets: this.container,
        x: pos.x,
        y: pos.y,
        duration: duration,
        ease: 'Bounce.out',
        onComplete: () => {
          this.isMoving = false;
          resolve();
        },
      });
    });
  }

  /**
   * Animate tile swap with another tile
   */
  swapWith(otherTile: Tile, duration: number = 200): Promise<void> {
    return new Promise((resolve) => {
      this.isMoving = true;
      otherTile.isMoving = true;

      const thisPos = gridToPixel(otherTile.row, otherTile.col, BOARD_CONFIG.TILE_SIZE, BOARD_CONFIG.OFFSET_X, BOARD_CONFIG.OFFSET_Y);
      const otherPos = gridToPixel(this.row, this.col, BOARD_CONFIG.TILE_SIZE, BOARD_CONFIG.OFFSET_X, BOARD_CONFIG.OFFSET_Y);

      // Swap grid positions
      const tempRow = this.row;
      const tempCol = this.col;
      this.setPosition(otherTile.row, otherTile.col);
      otherTile.setPosition(tempRow, tempCol);

      // Animate both containers
      const tween1 = this.scene.tweens.add({
        targets: this.container,
        x: thisPos.x,
        y: thisPos.y,
        duration: duration,
        ease: 'Power2',
      });

      const tween2 = this.scene.tweens.add({
        targets: otherTile.container,
        x: otherPos.x,
        y: otherPos.y,
        duration: duration,
        ease: 'Power2',
        onComplete: () => {
          this.isMoving = false;
          otherTile.isMoving = false;
          resolve();
        },
      });
    });
  }

  /**
   * Mark the tile as matched and play removal animation
   */
  match(): Promise<void> {
    return new Promise((resolve) => {
      this.isMatched = true;

      // Scale up then down for pop effect
      this.scene.tweens.add({
        targets: this.container,
        scale: 1.3,
        duration: 100,
        ease: 'Back.out',
        onComplete: () => {
          this.scene.tweens.add({
            targets: this.container,
            alpha: 0,
            scale: 0,
            angle: 180,
            duration: 200,
            ease: 'Power2',
            onComplete: () => {
              resolve();
            },
          });
        },
      });
    });
  }

  /**
   * Highlight the tile (selected state)
   */
  highlight(): void {
    // Add glow effect
    if (!this.glowCircle) {
      this.glowCircle = this.scene.add.circle(0, 0, BOARD_CONFIG.TILE_SIZE * 0.5, 0xffff00, 0.5);
      this.container.addAt(this.glowCircle, 0);
    }

    // Add pulse animation
    this.highlightTween = this.scene.tweens.add({
      targets: this.container,
      scale: { from: 1, to: 1.15 },
      duration: 300,
      yoyo: true,
      repeat: -1,
    });
  }

  /**
   * Remove highlight
   */
  unhighlight(): void {
    // Remove glow effect
    if (this.glowCircle) {
      this.glowCircle.destroy();
      this.glowCircle = null;
    }

    // Stop pulse animation
    if (this.highlightTween) {
      this.highlightTween.stop();
      this.highlightTween = null;

      // Reset scale
      this.scene.tweens.add({
        targets: this.container,
        scale: 1,
        duration: 100,
      });
    }
  }

  /**
   * Destroy the tile and clean up
   */
  destroy(): void {
    if (this.container) {
      this.container.destroy();
    }
  }
}
