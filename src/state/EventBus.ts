/**
 * Simple event bus for game-wide communication
 */

type EventCallback = (...args: any[]) => void;

interface EventSubscription {
  callback: EventCallback;
  context: any;
}

class EventBus {
  private events: Record<string, EventSubscription[]>;

  constructor() {
    this.events = {};
  }

  /**
   * Subscribe to an event
   */
  on(eventName: string, callback: EventCallback, context: any = null): void {
    if (!this.events[eventName]) {
      this.events[eventName] = [];
    }

    this.events[eventName].push({ callback, context });
  }

  /**
   * Unsubscribe from an event
   */
  off(eventName: string, callback: EventCallback): void {
    if (!this.events[eventName]) return;

    this.events[eventName] = this.events[eventName].filter(
      (event) => event.callback !== callback
    );
  }

  /**
   * Emit an event
   */
  emit(eventName: string, ...args: any[]): void {
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
  once(eventName: string, callback: EventCallback, context: any = null): void {
    const onceCallback = (...args: any[]) => {
      callback.apply(context, args);
      this.off(eventName, onceCallback);
    };

    this.on(eventName, onceCallback, context);
  }

  /**
   * Clear all event listeners for an event
   */
  clear(eventName?: string): void {
    if (eventName) {
      delete this.events[eventName];
    } else {
      this.events = {};
    }
  }
}

// Create and export a singleton instance
export default new EventBus();
