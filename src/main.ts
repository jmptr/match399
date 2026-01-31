import Phaser from 'phaser';
import { GAME_CONFIG } from './utils/constants.js';
import BootScene from './scenes/BootScene.js';
import MenuScene from './scenes/MenuScene.js';
import SinglePlayerScene from './scenes/SinglePlayerScene.js';

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: GAME_CONFIG.WIDTH,
  height: GAME_CONFIG.HEIGHT,
  parent: 'game-container',
  backgroundColor: GAME_CONFIG.BACKGROUND_COLOR,
  scene: [BootScene, MenuScene, SinglePlayerScene],
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 0 },
      debug: false,
    },
  },
};

const game = new Phaser.Game(config);

// Make game instance available globally for debugging
declare global {
  interface Window {
    game: Phaser.Game;
  }
}

window.game = game;
