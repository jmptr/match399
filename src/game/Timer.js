import { formatTime } from '../utils/helpers.js';

export default class Timer {
  constructor(scene, duration) {
    this.scene = scene;
    this.duration = duration; // in seconds
    this.remainingTime = duration;
    this.isRunning = false;
    this.isPaused = false;
    this.timerEvent = null;
    this.callbacks = {
      onTick: null,
      onComplete: null,
      onWarning: null, // Called when time is running low
    };
  }

  /**
   * Start the timer
   */
  start() {
    if (this.isRunning) return;

    this.isRunning = true;
    this.isPaused = false;

    this.timerEvent = this.scene.time.addEvent({
      delay: 1000, // 1 second
      callback: this.tick,
      callbackScope: this,
      loop: true,
    });
  }

  /**
   * Pause the timer
   */
  pause() {
    if (!this.isRunning || this.isPaused) return;
    this.isPaused = true;
    if (this.timerEvent) {
      this.timerEvent.paused = true;
    }
  }

  /**
   * Resume the timer
   */
  resume() {
    if (!this.isRunning || !this.isPaused) return;
    this.isPaused = false;
    if (this.timerEvent) {
      this.timerEvent.paused = false;
    }
  }

  /**
   * Stop the timer
   */
  stop() {
    this.isRunning = false;
    this.isPaused = false;
    if (this.timerEvent) {
      this.timerEvent.remove();
      this.timerEvent = null;
    }
  }

  /**
   * Reset the timer
   */
  reset(newDuration = null) {
    this.stop();
    if (newDuration !== null) {
      this.duration = newDuration;
    }
    this.remainingTime = this.duration;
  }

  /**
   * Timer tick callback
   */
  tick() {
    if (this.isPaused) return;

    this.remainingTime--;

    // Call tick callback
    if (this.callbacks.onTick) {
      this.callbacks.onTick(this.remainingTime);
    }

    // Warning when time is low (30 seconds or less)
    if (this.remainingTime === 30 && this.callbacks.onWarning) {
      this.callbacks.onWarning(this.remainingTime);
    }

    // Check if time is up
    if (this.remainingTime <= 0) {
      this.stop();
      if (this.callbacks.onComplete) {
        this.callbacks.onComplete();
      }
    }
  }

  /**
   * Add time to the timer
   */
  addTime(seconds) {
    this.remainingTime += seconds;
    if (this.remainingTime > this.duration) {
      this.remainingTime = this.duration;
    }
  }

  /**
   * Subtract time from the timer
   */
  subtractTime(seconds) {
    this.remainingTime -= seconds;
    if (this.remainingTime < 0) {
      this.remainingTime = 0;
      this.stop();
      if (this.callbacks.onComplete) {
        this.callbacks.onComplete();
      }
    }
  }

  /**
   * Get remaining time in seconds
   */
  getRemainingTime() {
    return this.remainingTime;
  }

  /**
   * Get formatted time string (MM:SS)
   */
  getFormattedTime() {
    return formatTime(this.remainingTime);
  }

  /**
   * Get percentage of time remaining
   */
  getPercentageRemaining() {
    return (this.remainingTime / this.duration) * 100;
  }

  /**
   * Check if timer is running low (less than 30 seconds)
   */
  isRunningLow() {
    return this.remainingTime <= 30;
  }

  /**
   * Check if timer is almost done (less than 10 seconds)
   */
  isAlmostDone() {
    return this.remainingTime <= 10;
  }

  /**
   * Set callback for timer tick
   */
  onTick(callback) {
    this.callbacks.onTick = callback;
  }

  /**
   * Set callback for timer completion
   */
  onComplete(callback) {
    this.callbacks.onComplete = callback;
  }

  /**
   * Set callback for timer warning
   */
  onWarning(callback) {
    this.callbacks.onWarning = callback;
  }

  /**
   * Clean up
   */
  destroy() {
    this.stop();
    this.callbacks = {};
  }
}
