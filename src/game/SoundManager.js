import GameStateManager from '../state/GameStateManager.js';

export default class SoundManager {
  constructor(scene) {
    this.scene = scene;
    this.sounds = {};
    this.music = null;

    // Create synthesized sound effects using Web Audio API
    this.createSounds();
  }

  /**
   * Create basic synthesized sound effects
   */
  createSounds() {
    // We'll use Phaser's sound system which will be ready for real audio files
    // For now, we'll create placeholder sounds that can be easily replaced

    // Note: In Phase 2, we would load actual audio files here
    // For now, we'll use silent placeholders and log when sounds would play
  }

  /**
   * Play a sound effect
   */
  play(soundName, config = {}) {
    if (!GameStateManager.getSetting('soundEnabled')) return;

    const volume = GameStateManager.getSetting('soundVolume') || 0.7;

    // Use Phaser's built-in sound synthesis for basic effects
    switch (soundName) {
      case 'swap':
        this.playTone(200, 0.1, 'sine', volume * 0.5);
        break;
      case 'match':
        this.playTone(440, 0.15, 'sine', volume * 0.6);
        break;
      case 'combo':
        this.playChord([523, 659, 784], 0.2, volume * 0.7);
        break;
      case 'invalid':
        this.playTone(100, 0.1, 'sawtooth', volume * 0.3);
        break;
      case 'gameOver':
        this.playChord([392, 330, 262], 0.5, volume * 0.8);
        break;
      case 'highScore':
        this.playChord([523, 659, 784, 1047], 0.6, volume * 0.9);
        break;
      case 'warning':
        this.playTone(880, 0.1, 'square', volume * 0.4);
        break;
      case 'select':
        this.playTone(330, 0.05, 'sine', volume * 0.3);
        break;
    }
  }

  /**
   * Play a simple tone using Web Audio API
   */
  playTone(frequency, duration, type = 'sine', volume = 0.5) {
    if (!this.scene.sound.context) return;

    const audioContext = this.scene.sound.context;
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);

    gainNode.gain.setValueAtTime(volume, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + duration);
  }

  /**
   * Play a chord (multiple tones)
   */
  playChord(frequencies, duration, volume = 0.5) {
    frequencies.forEach((freq, index) => {
      setTimeout(() => {
        this.playTone(freq, duration * 0.8, 'sine', volume / frequencies.length);
      }, index * 50);
    });
  }

  /**
   * Play background music
   */
  playMusic(musicName, loop = true) {
    if (!GameStateManager.getSetting('musicEnabled')) return;

    // Placeholder for music playback
    // In a real implementation, this would load and play music files
    console.log(`Playing music: ${musicName}`);
  }

  /**
   * Stop background music
   */
  stopMusic() {
    if (this.music) {
      this.music.stop();
      this.music = null;
    }
  }

  /**
   * Set sound volume
   */
  setSoundVolume(volume) {
    GameStateManager.setSetting('soundVolume', volume);
  }

  /**
   * Set music volume
   */
  setMusicVolume(volume) {
    GameStateManager.setSetting('musicVolume', volume);
    if (this.music) {
      this.music.setVolume(volume);
    }
  }

  /**
   * Toggle sound on/off
   */
  toggleSound() {
    const enabled = !GameStateManager.getSetting('soundEnabled');
    GameStateManager.setSetting('soundEnabled', enabled);
    return enabled;
  }

  /**
   * Toggle music on/off
   */
  toggleMusic() {
    const enabled = !GameStateManager.getSetting('musicEnabled');
    GameStateManager.setSetting('musicEnabled', enabled);

    if (!enabled && this.music) {
      this.music.pause();
    } else if (enabled && this.music) {
      this.music.resume();
    }

    return enabled;
  }

  /**
   * Clean up
   */
  destroy() {
    this.stopMusic();
    this.sounds = {};
  }
}
