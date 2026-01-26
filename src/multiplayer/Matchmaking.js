import { supabase, isSupabaseConfigured, TABLES, CHANNELS } from './supabaseClient.js';
import { authManager } from './AuthManager.js';
import { networkManager } from './NetworkManager.js';
import EventBus from '../state/EventBus.js';

export default class Matchmaking {
  constructor() {
    this.isSearching = false;
    this.searchChannel = null;
    this.searchStartTime = null;
    this.currentRoomId = null;
  }

  /**
   * Start searching for a match
   */
  async startMatchmaking() {
    if (!isSupabaseConfigured()) {
      console.error('Supabase not configured');
      return { error: 'Supabase not configured' };
    }

    if (!authManager.isUserAuthenticated()) {
      console.error('User not authenticated');
      return { error: 'Not authenticated' };
    }

    this.isSearching = true;
    this.searchStartTime = Date.now();

    try {
      console.log('Starting matchmaking search...');

      // First, try to find an available room
      // Use maybeSingle() instead of single() to handle zero results gracefully
      const { data: availableRoom, error: findError } = await supabase
        .from(TABLES.GAME_ROOMS)
        .select('*')
        .eq('status', 'waiting')
        .is('player2_id', null)
        .limit(1)
        .maybeSingle();

      if (findError) {
        console.error('Error searching for rooms:', findError);
        throw findError;
      }

      if (availableRoom) {
        console.log('Found available room:', availableRoom.id);
        // Join existing room
        return await this.joinRoom(availableRoom.id);
      }

      // No available room, create a new one
      console.log('No available rooms, creating new room...');
      return await this.createRoom();
    } catch (error) {
      console.error('Error in matchmaking:', error);
      console.error('Error details:', error.message, error.code);
      this.isSearching = false;
      return { error };
    }
  }

  /**
   * Create a new game room
   */
  async createRoom() {
    try {
      const player = authManager.getPlayerProfile();

      if (!player || !player.id) {
        console.error('Player profile not loaded!');
        throw new Error('Player profile not loaded. Please try signing in again.');
      }

      console.log('Creating room for player:', player.id, player.username);

      const { data: room, error } = await supabase
        .from(TABLES.GAME_ROOMS)
        .insert({
          player1_id: player.id,
          status: 'waiting',
        })
        .select()
        .maybeSingle();

      if (error) {
        console.error('Error creating room:', error);
        console.error('Error code:', error.code);
        console.error('Error message:', error.message);

        if (error.code === '42P01') {
          throw new Error('Database tables not created. Please run the SQL schema from SUPABASE_SETUP.md');
        }

        throw error;
      }

      if (!room) {
        throw new Error('Failed to create room - no data returned');
      }

      console.log('Room created successfully:', room.id);

      this.currentRoomId = room.id;

      // Wait for opponent
      await this.waitForOpponent(room.id);

      return { data: room, error: null };
    } catch (error) {
      console.error('Error creating room:', error);
      this.isSearching = false;
      return { data: null, error };
    }
  }

  /**
   * Join an existing room
   */
  async joinRoom(roomId) {
    try {
      const player = authManager.getPlayerProfile();

      console.log('[Matchmaking] Attempting to join room:', roomId);
      console.log('[Matchmaking] Player ID:', player.id);
      console.log('[Matchmaking] Player username:', player.username);

      const { data: room, error } = await supabase
        .from(TABLES.GAME_ROOMS)
        .update({
          player2_id: player.id,
          status: 'in_progress',
          started_at: new Date().toISOString(),
        })
        .eq('id', roomId)
        .select()
        .maybeSingle();

      console.log('[Matchmaking] Update result - room:', room, 'error:', error);

      if (error) {
        console.error('[Matchmaking] Error updating room:', error);
        console.error('[Matchmaking] Error code:', error.code);
        console.error('[Matchmaking] Error message:', error.message);
        throw error;
      }

      if (!room) {
        // Room was already taken or deleted
        console.log('[Matchmaking] Room no longer available, creating new room instead...');
        return await this.createRoom();
      }

      console.log('[Matchmaking] Successfully joined room:', room);
      console.log('[Matchmaking] Room status:', room.status);
      console.log('[Matchmaking] Room player1_id:', room.player1_id);
      console.log('[Matchmaking] Room player2_id:', room.player2_id);

      this.currentRoomId = roomId;
      this.isSearching = false;

      // Emit match found event
      console.log('[Matchmaking] Emitting match-found event for joining player');
      EventBus.emit('matchmaking:match-found', room);

      return { data: room, error: null };
    } catch (error) {
      console.error('Error joining room:', error);
      this.isSearching = false;
      return { data: null, error };
    }
  }

  /**
   * Wait for an opponent to join the room
   */
  async waitForOpponent(roomId) {
    console.log('[Matchmaking] Waiting for opponent in room:', roomId);

    // Subscribe to room updates
    const subscription = supabase
      .channel(`room:${roomId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: TABLES.GAME_ROOMS,
          filter: `id=eq.${roomId}`,
        },
        (payload) => {
          console.log('[Matchmaking] Room update received:', payload);
          const updatedRoom = payload.new;

          console.log('[Matchmaking] Updated room data:', updatedRoom);
          console.log('[Matchmaking] player2_id:', updatedRoom.player2_id);
          console.log('[Matchmaking] status:', updatedRoom.status);

          if (updatedRoom.player2_id && updatedRoom.status === 'in_progress') {
            // Opponent joined!
            console.log('[Matchmaking] Opponent joined! Emitting match-found event');
            this.isSearching = false;
            EventBus.emit('matchmaking:match-found', updatedRoom);

            // Unsubscribe
            supabase.removeChannel(subscription);
          }
        }
      )
      .subscribe((status) => {
        console.log('[Matchmaking] Subscription status:', status);
      });

    // Emit searching event
    console.log('[Matchmaking] Emitting searching event');
    EventBus.emit('matchmaking:searching');
  }

  /**
   * Cancel matchmaking search
   */
  async cancelMatchmaking() {
    this.isSearching = false;

    if (this.currentRoomId) {
      // If we created a room but no one joined, delete it
      const { data: room } = await supabase
        .from(TABLES.GAME_ROOMS)
        .select('*')
        .eq('id', this.currentRoomId)
        .maybeSingle();

      if (room && room.status === 'waiting' && !room.player2_id) {
        await supabase
          .from(TABLES.GAME_ROOMS)
          .delete()
          .eq('id', this.currentRoomId);
      }

      this.currentRoomId = null;
    }

    EventBus.emit('matchmaking:cancelled');
  }

  /**
   * Get current room information
   */
  async getCurrentRoom() {
    if (!this.currentRoomId) return null;

    const { data: room, error } = await supabase
      .from(TABLES.GAME_ROOMS)
      .select('*')
      .eq('id', this.currentRoomId)
      .maybeSingle();

    if (error) {
      console.error('Error fetching room:', error);
      return null;
    }

    return room;
  }

  /**
   * Update room status
   */
  async updateRoomStatus(status, additionalData = {}) {
    if (!this.currentRoomId) return;

    const updateData = {
      status,
      ...additionalData,
    };

    await supabase
      .from(TABLES.GAME_ROOMS)
      .update(updateData)
      .eq('id', this.currentRoomId);
  }

  /**
   * End the current game
   */
  async endGame(winnerId, gameDuration) {
    if (!this.currentRoomId) return;

    await this.updateRoomStatus('finished', {
      winner_id: winnerId,
      game_duration: gameDuration,
      finished_at: new Date().toISOString(),
    });

    // Update player stats
    const room = await this.getCurrentRoom();
    if (room) {
      await this.updatePlayerStats(room);
    }

    this.currentRoomId = null;
  }

  /**
   * Update player statistics after a game
   */
  async updatePlayerStats(room) {
    const player = authManager.getPlayerProfile();

    const isWinner = room.winner_id === player.id;
    const isPlayer1 = room.player1_id === player.id;

    const stats = {
      total_games: player.total_games + 1,
      total_wins: isWinner ? player.total_wins + 1 : player.total_wins,
      total_losses: !isWinner ? player.total_losses + 1 : player.total_losses,
    };

    await authManager.updatePlayerStats(stats);
  }

  /**
   * Submit score to leaderboard
   */
  async submitScore(score) {
    if (!authManager.isUserAuthenticated()) return;

    const player = authManager.getPlayerProfile();

    try {
      await supabase.from(TABLES.LEADERBOARD).insert({
        player_id: player.id,
        score: score,
        game_mode: 'multiplayer',
      });
    } catch (error) {
      console.error('Error submitting score:', error);
    }
  }

  /**
   * Get leaderboard
   */
  async getLeaderboard(limit = 10) {
    const { data, error } = await supabase
      .from(TABLES.LEADERBOARD)
      .select(`
        *,
        players (username)
      `)
      .eq('game_mode', 'multiplayer')
      .order('score', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching leaderboard:', error);
      return [];
    }

    return data;
  }

  /**
   * Check if currently searching
   */
  isCurrentlySearching() {
    return this.isSearching;
  }

  /**
   * Get search duration
   */
  getSearchDuration() {
    if (!this.searchStartTime) return 0;
    return Date.now() - this.searchStartTime;
  }
}

// Create and export singleton instance
const matchmaking = new Matchmaking();
export { matchmaking };
