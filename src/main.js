import Phaser from 'phaser';
import { GAME_CONFIG, SCENES } from './utils/constants.js';
import BootScene from './scenes/BootScene.js';
import MenuScene from './scenes/MenuScene.js';
import SinglePlayerScene from './scenes/SinglePlayerScene.js';
import LoginScene from './scenes/LoginScene.js';
import MultiplayerLobbyScene from './scenes/MultiplayerLobbyScene.js';
import MultiplayerScene from './scenes/MultiplayerScene.js';

const config = {
  type: Phaser.AUTO,
  width: GAME_CONFIG.WIDTH,
  height: GAME_CONFIG.HEIGHT,
  parent: 'game-container',
  backgroundColor: GAME_CONFIG.BACKGROUND_COLOR,
  scene: [BootScene, MenuScene, SinglePlayerScene, LoginScene, MultiplayerLobbyScene, MultiplayerScene],
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
window.game = game;
