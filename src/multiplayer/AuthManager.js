import { supabase, isSupabaseConfigured } from './supabaseClient.js';
import EventBus from '../state/EventBus.js';
import GameStateManager from '../state/GameStateManager.js';

export default class AuthManager {
  constructor() {
    this.currentUser = null;
    this.isAuthenticated = false;
    this.playerProfile = null;

    if (isSupabaseConfigured()) {
      this.initialize();
    }
  }

  /**
   * Initialize auth and check for existing session
   */
  async initialize() {
    try {
      // Test database connection
      console.log('Testing database connection...');
      const { data: testData, error: testError } = await supabase
        .from('players')
        .select('count')
        .limit(1);

      if (testError) {
        console.error('Database test failed:', testError);
        console.error('Error code:', testError.code);
        console.error('Error message:', testError.message);
        if (testError.code === '42P01') {
          console.error('❌ Players table does not exist! Run the SQL from SUPABASE_SETUP.md');
        } else if (testError.code === '42501') {
          console.error('❌ Permission denied! Check your Supabase RLS policies');
        }
      } else {
        console.log('✓ Database connection successful');
      }

      // Check for existing session
      const { data: { session } } = await supabase.auth.getSession();

      if (session) {
        this.currentUser = session.user;
        this.isAuthenticated = true;
        await this.loadPlayerProfile(false); // Don't throw if missing
        EventBus.emit('auth:signed-in', this.currentUser);
      }

      // Listen for auth state changes
      supabase.auth.onAuthStateChange(async (event, session) => {
        console.log('Auth state change:', event);
        if (event === 'SIGNED_IN' && session) {
          this.currentUser = session.user;
          this.isAuthenticated = true;

          // Try to load profile, but don't fail if it doesn't exist yet
          // (it might be a new user and the profile is being created)
          await this.loadPlayerProfile(false);

          // Only emit if we're not in the middle of creating a profile
          // The signInAnonymously method will emit after creating the profile
          if (this.playerProfile) {
            EventBus.emit('auth:signed-in', this.currentUser);
          }
        } else if (event === 'SIGNED_OUT') {
          this.currentUser = null;
          this.isAuthenticated = false;
          this.playerProfile = null;
          EventBus.emit('auth:signed-out');
        }
      });
    } catch (error) {
      console.error('Error initializing auth:', error);
    }
  }

  /**
   * Sign in anonymously (for quick matchmaking)
   */
  async signInAnonymously() {
    if (!isSupabaseConfigured()) {
      console.error('Supabase not configured');
      return { error: 'Supabase not configured' };
    }

    try {
      console.log('Attempting anonymous sign in...');
      const { data, error } = await supabase.auth.signInAnonymously();

      if (error) {
        console.error('Supabase auth error:', error);
        console.error('Auth error details:', JSON.stringify(error, null, 2));
        throw error;
      }

      console.log('Anonymous sign in successful!');
      console.log('User ID:', data.user.id);
      console.log('User object:', data.user);

      // Create player profile
      const username = this.generateAnonymousUsername();
      console.log('Creating player profile with username:', username);
      await this.createPlayerProfile(data.user.id, username);

      console.log('Player profile created successfully');

      // Emit the auth signed-in event now that profile is ready
      // (the onAuthStateChange handler won't emit it if profile didn't exist)
      if (this.playerProfile) {
        console.log('Emitting auth:signed-in event');
        EventBus.emit('auth:signed-in', this.currentUser);
      }

      return { data, error: null };
    } catch (error) {
      console.error('Error signing in anonymously:', error);
      console.error('Error type:', typeof error);
      console.error('Error message:', error.message);
      console.error('Error code:', error.code);
      console.error('Error stack:', error.stack);
      return { data: null, error };
    }
  }

  /**
   * Sign in with email and password
   */
  async signInWithEmail(email, password) {
    if (!isSupabaseConfigured()) {
      console.error('Supabase not configured');
      return { error: 'Supabase not configured' };
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      return { data, error: null };
    } catch (error) {
      console.error('Error signing in:', error);
      return { data: null, error };
    }
  }

  /**
   * Sign up with email and password
   */
  async signUpWithEmail(email, password, username) {
    if (!isSupabaseConfigured()) {
      console.error('Supabase not configured');
      return { error: 'Supabase not configured' };
    }

    try {
      // First, sign up the user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (authError) throw authError;

      // Then create player profile
      if (authData.user) {
        await this.createPlayerProfile(authData.user.id, username);
      }

      return { data: authData, error: null };
    } catch (error) {
      console.error('Error signing up:', error);
      return { data: null, error };
    }
  }

  /**
   * Sign out
   */
  async signOut() {
    if (!isSupabaseConfigured()) return;

    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  }

  /**
   * Create player profile in database
   */
  async createPlayerProfile(userId, username) {
    try {
      console.log('Inserting player profile into database...');
      console.log('User ID:', userId);
      console.log('Username:', username);

      const { data, error } = await supabase
        .from('players')
        .insert({
          id: userId,
          username: username,
        })
        .select();

      if (error) {
        // Log complete error details for debugging
        console.error('Full error object:', JSON.stringify(error, null, 2));
        console.error('Error code:', error.code);
        console.error('Error message:', error.message);
        console.error('Error details:', error.details);
        console.error('Error hint:', error.hint);

        if (error.code === '23505') {
          // Duplicate key error - profile already exists, just load it
          console.log('Player profile already exists, loading...');
        } else if (error.code === '42P01') {
          // Table doesn't exist
          console.error('Players table does not exist! Please run the SQL schema from SUPABASE_SETUP.md');
          throw new Error('Database not set up. Please run the SQL schema.');
        } else if (error.code === '42501') {
          // Permission denied
          console.error('Permission denied! Check RLS policies in Supabase.');
          throw new Error('Permission denied. Please check your Supabase RLS policies.');
        } else {
          console.error('Database error:', error);
          throw error;
        }
      } else {
        console.log('Player profile created:', data);
      }

      await this.loadPlayerProfile();
    } catch (error) {
      console.error('Error creating player profile:', error);
      throw error;
    }
  }

  /**
   * Load player profile from database
   * @param {boolean} throwOnMissing - If true, throw error when profile not found. If false, just return null.
   */
  async loadPlayerProfile(throwOnMissing = true) {
    if (!this.currentUser) {
      console.error('Cannot load profile: no current user');
      return;
    }

    try {
      console.log('Loading player profile for user:', this.currentUser.id);
      const { data, error } = await supabase
        .from('players')
        .select('*')
        .eq('id', this.currentUser.id)
        .maybeSingle();

      if (error) {
        console.error('Error querying player profile:', error);
        throw error;
      }

      if (!data) {
        if (throwOnMissing) {
          console.error('Player profile not found in database!');
          throw new Error('Player profile not found. Database may not be set up correctly.');
        } else {
          console.log('Player profile not found (this is normal for new users)');
          return null;
        }
      }

      console.log('Player profile loaded:', data);
      this.playerProfile = data;
      GameStateManager.set('playerProfile', data);
      EventBus.emit('player:profile-loaded', data);
    } catch (error) {
      console.error('Error loading player profile:', error);
      throw error;
    }
  }

  /**
   * Update player stats
   */
  async updatePlayerStats(stats) {
    if (!this.currentUser) return;

    try {
      const { error } = await supabase
        .from('players')
        .update({
          ...stats,
          last_seen: new Date().toISOString(),
        })
        .eq('id', this.currentUser.id);

      if (error) throw error;

      await this.loadPlayerProfile();
    } catch (error) {
      console.error('Error updating player stats:', error);
    }
  }

  /**
   * Generate a random anonymous username
   */
  generateAnonymousUsername() {
    const adjectives = ['Swift', 'Mighty', 'Clever', 'Bold', 'Quick', 'Brave', 'Fierce', 'Wise'];
    const nouns = ['Tiger', 'Eagle', 'Dragon', 'Phoenix', 'Wolf', 'Hawk', 'Lion', 'Bear'];
    const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
    const noun = nouns[Math.floor(Math.random() * nouns.length)];
    const num = Math.floor(Math.random() * 1000);
    return `${adj}${noun}${num}`;
  }

  /**
   * Get current user
   */
  getCurrentUser() {
    return this.currentUser;
  }

  /**
   * Get player profile
   */
  getPlayerProfile() {
    return this.playerProfile;
  }

  /**
   * Check if user is authenticated
   */
  isUserAuthenticated() {
    return this.isAuthenticated;
  }
}

// Create and export singleton instance
const authManager = new AuthManager();
export { authManager };
