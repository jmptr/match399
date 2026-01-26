import { supabase, isSupabaseConfigured, CHANNELS } from './supabaseClient.js';
import EventBus from '../state/EventBus.js';

export default class NetworkManager {
  constructor() {
    this.channels = new Map();
    this.currentRoomId = null;
    this.isConnected = false;
  }

  /**
   * Subscribe to a real-time channel
   */
  subscribeToChannel(channelName, callbacks = {}) {
    if (!isSupabaseConfigured()) {
      console.error('Supabase not configured');
      return null;
    }

    // Remove existing channel if any
    this.unsubscribeFromChannel(channelName);

    const channel = supabase.channel(channelName);

    // Set up event handlers
    if (callbacks.onBroadcast) {
      channel.on('broadcast', { event: '*' }, (payload) => {
        callbacks.onBroadcast(payload);
      });
    }

    if (callbacks.onPresence) {
      channel.on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        callbacks.onPresence(state);
      });

      channel.on('presence', { event: 'join' }, ({ key, newPresences }) => {
        if (callbacks.onPlayerJoin) {
          callbacks.onPlayerJoin(newPresences);
        }
      });

      channel.on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        if (callbacks.onPlayerLeave) {
          callbacks.onPlayerLeave(leftPresences);
        }
      });
    }

    // Subscribe to the channel
    channel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        this.isConnected = true;
        console.log(`Subscribed to channel: ${channelName}`);

        if (callbacks.onSubscribed) {
          callbacks.onSubscribed();
        }

        // Track presence if callback is provided
        if (callbacks.onPresence && callbacks.presenceData) {
          await channel.track(callbacks.presenceData);
        }
      } else if (status === 'CHANNEL_ERROR') {
        console.error(`Error subscribing to channel: ${channelName}`);
        this.isConnected = false;
      } else if (status === 'TIMED_OUT') {
        console.error(`Timed out subscribing to channel: ${channelName}`);
        this.isConnected = false;
      }
    });

    this.channels.set(channelName, channel);
    return channel;
  }

  /**
   * Unsubscribe from a channel
   */
  async unsubscribeFromChannel(channelName) {
    const channel = this.channels.get(channelName);
    if (channel) {
      await supabase.removeChannel(channel);
      this.channels.delete(channelName);
      console.log(`Unsubscribed from channel: ${channelName}`);
    }
  }

  /**
   * Send a broadcast message to a channel
   */
  async sendBroadcast(channelName, event, payload) {
    const channel = this.channels.get(channelName);
    if (!channel) {
      console.error(`Channel not found: ${channelName}`);
      return;
    }

    await channel.send({
      type: 'broadcast',
      event: event,
      payload: payload,
    });
  }

  /**
   * Update presence state
   */
  async updatePresence(channelName, state) {
    const channel = this.channels.get(channelName);
    if (!channel) {
      console.error(`Channel not found: ${channelName}`);
      return;
    }

    await channel.track(state);
  }

  /**
   * Join a game room
   */
  async joinGameRoom(roomId, playerData) {
    this.currentRoomId = roomId;
    const channelName = CHANNELS.GAME_ROOM(roomId);

    this.subscribeToChannel(channelName, {
      onBroadcast: (payload) => {
        this.handleGameMessage(payload);
      },
      onPresence: (state) => {
        this.handlePresenceUpdate(state);
      },
      onPlayerJoin: (players) => {
        EventBus.emit('multiplayer:player-joined', players);
      },
      onPlayerLeave: (players) => {
        EventBus.emit('multiplayer:player-left', players);
      },
      presenceData: {
        player_id: playerData.id,
        username: playerData.username,
        ready: false,
      },
    });
  }

  /**
   * Leave current game room
   */
  async leaveGameRoom() {
    if (this.currentRoomId) {
      const channelName = CHANNELS.GAME_ROOM(this.currentRoomId);
      await this.unsubscribeFromChannel(channelName);
      this.currentRoomId = null;
    }
  }

  /**
   * Send game action to opponents
   */
  async sendGameAction(action, data) {
    if (!this.currentRoomId) {
      console.error('Not in a game room');
      return;
    }

    const channelName = CHANNELS.GAME_ROOM(this.currentRoomId);
    await this.sendBroadcast(channelName, action, data);
  }

  /**
   * Handle incoming game messages
   */
  handleGameMessage(payload) {
    const { event, payload: data } = payload;

    switch (event) {
      case 'tile-swap':
        EventBus.emit('multiplayer:tile-swap', data);
        break;
      case 'match-made':
        EventBus.emit('multiplayer:match-made', data);
        break;
      case 'score-update':
        EventBus.emit('multiplayer:score-update', data);
        break;
      case 'player-ready':
        EventBus.emit('multiplayer:player-ready', data);
        break;
      case 'game-start':
        EventBus.emit('multiplayer:game-start', data);
        break;
      case 'game-over':
        EventBus.emit('multiplayer:game-over', data);
        break;
      default:
        console.log('Unknown game message:', event, data);
    }
  }

  /**
   * Handle presence updates
   */
  handlePresenceUpdate(state) {
    const players = Object.values(state).flat();
    EventBus.emit('multiplayer:presence-update', players);
  }

  /**
   * Mark player as ready
   */
  async setReady(ready = true) {
    if (!this.currentRoomId) return;

    const channelName = CHANNELS.GAME_ROOM(this.currentRoomId);
    await this.updatePresence(channelName, { ready });
    await this.sendGameAction('player-ready', { ready });
  }

  /**
   * Get current connection status
   */
  getConnectionStatus() {
    return this.isConnected;
  }

  /**
   * Clean up all channels
   */
  async cleanup() {
    for (const [channelName, channel] of this.channels) {
      await supabase.removeChannel(channel);
    }
    this.channels.clear();
    this.currentRoomId = null;
    this.isConnected = false;
  }
}

// Create and export singleton instance
const networkManager = new NetworkManager();
export { networkManager };
