# Supabase Setup Guide

This guide will help you set up Supabase for the multiplayer functionality.

## Step 1: Create a Supabase Project

1. Go to [https://supabase.com](https://supabase.com)
2. Sign up or log in
3. Click "New Project"
4. Fill in:
   - Project name: `match399` (or your choice)
   - Database password: (create a strong password)
   - Region: Choose closest to you
5. Wait for the project to be created (~2 minutes)

## Step 2: Get Your API Credentials

1. In your Supabase project dashboard, go to **Settings** > **API**
2. Copy the following values:
   - **Project URL** (e.g., `https://xxxxx.supabase.co`)
   - **anon public** key (under "Project API keys")

## Step 3: Configure Environment Variables

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Open `.env` and paste your credentials:
   ```
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key-here
   ```

## Step 3.5: Enable Anonymous Authentication

**IMPORTANT:** This step is required for Quick Play to work!

1. In your Supabase dashboard, go to **Authentication** > **Providers**
2. Scroll down to **Anonymous Sign-ins**
3. Toggle it **ON** (enable it)
4. Click **Save**

Without this, the "Quick Play" feature won't work and you'll get connection errors.

## Step 4: Create Database Tables

In your Supabase project dashboard, go to **SQL Editor** and run the following SQL:

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Players table
CREATE TABLE players (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  username TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  total_wins INTEGER DEFAULT 0,
  total_losses INTEGER DEFAULT 0,
  total_games INTEGER DEFAULT 0,
  highest_score INTEGER DEFAULT 0
);

-- Game rooms table
CREATE TABLE game_rooms (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status TEXT NOT NULL DEFAULT 'waiting', -- waiting, in_progress, finished
  player1_id UUID REFERENCES players(id),
  player2_id UUID REFERENCES players(id),
  winner_id UUID REFERENCES players(id),
  game_duration INTEGER, -- in seconds
  started_at TIMESTAMP WITH TIME ZONE,
  finished_at TIMESTAMP WITH TIME ZONE
);

-- Match state table (for real-time game state sync)
CREATE TABLE match_state (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  room_id UUID REFERENCES game_rooms(id) ON DELETE CASCADE,
  player_id UUID REFERENCES players(id),
  action_type TEXT NOT NULL, -- swap, match, score_update, game_over
  action_data JSONB NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Leaderboard table
CREATE TABLE leaderboard (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  player_id UUID REFERENCES players(id) ON DELETE CASCADE,
  score INTEGER NOT NULL,
  game_mode TEXT NOT NULL DEFAULT 'multiplayer',
  achieved_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(player_id, score, game_mode)
);

-- Create indexes for better performance
CREATE INDEX idx_game_rooms_status ON game_rooms(status);
CREATE INDEX idx_match_state_room_id ON match_state(room_id);
CREATE INDEX idx_match_state_timestamp ON match_state(timestamp);
CREATE INDEX idx_leaderboard_score ON leaderboard(score DESC);
CREATE INDEX idx_leaderboard_player_id ON leaderboard(player_id);

-- Enable Row Level Security (RLS)
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE match_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE leaderboard ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Players: Anyone can read, only the user can update their own data
CREATE POLICY "Public players are viewable by everyone"
  ON players FOR SELECT
  USING (true);

CREATE POLICY "Users can update their own player data"
  ON players FOR UPDATE
  USING (auth.uid()::text = id::text);

CREATE POLICY "Users can insert their own player data"
  ON players FOR INSERT
  WITH CHECK (auth.uid()::text = id::text);

-- Game rooms: Anyone can read, players in the room can update
CREATE POLICY "Game rooms are viewable by everyone"
  ON game_rooms FOR SELECT
  USING (true);

CREATE POLICY "Players can create game rooms"
  ON game_rooms FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Players in the room can update it"
  ON game_rooms FOR UPDATE
  USING (
    auth.uid()::text = player1_id::text OR
    auth.uid()::text = player2_id::text
  );

-- Match state: Players in the room can read and insert
CREATE POLICY "Players can view match state for their rooms"
  ON match_state FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM game_rooms
      WHERE game_rooms.id = match_state.room_id
      AND (
        game_rooms.player1_id::text = auth.uid()::text OR
        game_rooms.player2_id::text = auth.uid()::text
      )
    )
  );

CREATE POLICY "Players can insert match state"
  ON match_state FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM game_rooms
      WHERE game_rooms.id = match_state.room_id
      AND (
        game_rooms.player1_id::text = auth.uid()::text OR
        game_rooms.player2_id::text = auth.uid()::text
      )
    )
  );

-- Leaderboard: Everyone can read, players can insert their own scores
CREATE POLICY "Leaderboard is viewable by everyone"
  ON leaderboard FOR SELECT
  USING (true);

CREATE POLICY "Players can insert their own scores"
  ON leaderboard FOR INSERT
  WITH CHECK (auth.uid()::text = player_id::text);
```

## Step 5: Enable Realtime

In the current Supabase UI, Realtime is enabled differently:

**Option 1 - Using SQL Editor (Recommended):**
Run this SQL in your SQL Editor:
```sql
-- Enable realtime for game_rooms
ALTER PUBLICATION supabase_realtime ADD TABLE game_rooms;

-- Enable realtime for match_state
ALTER PUBLICATION supabase_realtime ADD TABLE match_state;
```

**Option 2 - Using Table Editor:**
1. Go to **Database** > **Tables**
2. Click on the `game_rooms` table
3. Look for a toggle or button to enable Realtime (location varies by Supabase version)
4. Repeat for `match_state` table

**Option 3 - Check if already enabled:**
Realtime might already be enabled by default in newer Supabase projects. To verify, run:
```sql
SELECT schemaname, tablename
FROM pg_publication_tables
WHERE pubname = 'supabase_realtime';
```
If you see `game_rooms` and `match_state` in the results, Realtime is already enabled!

## Step 6: Test the Connection

Restart your development server:
```bash
npm run dev
```

The game should now connect to Supabase. Check the browser console for any connection errors.

## Troubleshooting

### "Failed to connect. Please try again."
**This is the most common error.** Check these in order:

1. **Is anonymous authentication enabled?**
   - Go to **Authentication** > **Providers**
   - Make sure **Anonymous Sign-ins** is toggled ON
   - This is the #1 cause of connection errors

2. **Have you created the database tables?**
   - Run the SQL from Step 4 in the SQL Editor
   - Verify tables exist: Go to **Database** > **Tables**
   - You should see: `players`, `game_rooms`, `match_state`, `leaderboard`

3. **Check the browser console (F12)**
   - Look for detailed error messages
   - If you see "table does not exist" → run the SQL schema
   - If you see "Anonymous sign-ins are disabled" → enable it in Auth settings

4. **Restart the dev server**
   - Stop the server (Ctrl+C)
   - Run `npm run dev` again
   - The `.env` file is only loaded on startup

### "Supabase environment variables are not set"
- Make sure `.env` file exists in the project root
- Verify the environment variables start with `VITE_`
- Restart the Vite dev server after creating/modifying `.env`

### "Invalid API key"
- Double-check you copied the **anon public** key, not the service role key
- Make sure there are no extra spaces in the `.env` file

### Database errors
- Verify all SQL commands ran successfully in the SQL Editor
- Check the Supabase logs for any error messages
- Make sure RLS policies are created (they're in the SQL schema)

## Next Steps

Once Supabase is configured, the multiplayer features will be enabled automatically. You can:
- Create a player profile
- Join matchmaking queue
- Play real-time head-to-head matches
- View the leaderboard
