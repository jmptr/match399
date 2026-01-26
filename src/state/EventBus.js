/**
 * Simple event bus for game-wide communication
 */
class EventBus {
  constructor() {
    this.events = {};
  }

  /**
   * Subscribe to an event
   */
  on(eventName, callback, context = null) {
    if (!this.events[eventName]) {
      this.events[eventName] = [];
    }

    this.events[eventName].push({ callback, context });
  }

  /**
   * Unsubscribe from an event
   */
  off(eventName, callback) {
    if (!this.events[eventName]) return;

    this.events[eventName] = this.events[eventName].filter(
      (event) => event.callback !== callback
    );
  }

  /**
   * Emit an event
   */
  emit(eventName, ...args) {
    if (!this.events[eventName]) return;

    this.events[eventName].forEach((event) => {
      if (event.context) {
        event.callback.apply(event.context, args);
      } else {
        event.callback(...args);
      }
    });
  }

  /**
   * Subscribe to an event once
   */
  once(eventName, callback, context = null) {
    const onceCallback = (...args) => {
      callback.apply(context, args);
      this.off(eventName, onceCallback);
    };

    this.on(eventName, onceCallback, context);
  }

  /**
   * Clear all event listeners for an event
   */
  clear(eventName) {
    if (eventName) {
      delete this.events[eventName];
    } else {
      this.events = {};
    }
  }
}

// Create and export a singleton instance
export default new EventBus();
