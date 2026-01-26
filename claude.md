# Match-3 Game - Architecture Document

## Project Overview
A match-3 puzzle game with two modes:
- **Single Player**: Solo gameplay with objectives/levels
- **Competitive Multiplayer**: Real-time head-to-head matches

## Technology Stack

### Platform
- **Target**: Web (browser-based)
- **Rationale**: Easy distribution, cross-platform compatibility, no installation required

### Game Framework
- **Framework**: Phaser 3
- **Version**: Latest stable (3.x)
- **Rationale**: Excellent 2D game support, mature match-3 capabilities, large community

### Frontend Architecture
- **UI Approach**: Pure Phaser (no React)
- **Rendering**: Phaser WebGL/Canvas renderer
- **State Management**: Custom event-driven state manager
  - Lightweight design tailored for game needs
  - Event-based communication between game systems
  - Centralized state for multiplayer synchronization

### Backend & Services
- **Platform**: Firebase or Supabase (BaaS)
- **Features Needed**:
  - Real-time database for game state synchronization
  - WebSocket/real-time subscriptions for multiplayer
  - Authentication system
  - Matchmaking service
  - Leaderboard storage

## Game Architecture

### Core Systems

#### 1. Game Board System
- Grid-based board (standard: 8x8)
- Tile/gem management
- Match detection algorithm
- Gravity and tile falling physics
- Board state serialization for multiplayer sync

#### 2. Input System
- Mouse/touch input handling
- Tile selection and swapping
- Input validation (legal moves only)

#### 3. Match Detection System
- Horizontal and vertical match-3+ detection
- Special pattern detection (L-shapes, T-shapes, etc.)
- Cascade/chain reaction handling

#### 4. Scoring System
- Base points for matches
- **Combo multipliers**: Chain reactions increase multiplier
- Special tile bonuses
- Score calculation and display

#### 5. Timer System
- **Time pressure mechanics**: Timed rounds
- Countdown display
- Time-based scoring bonuses
- Match duration tracking

### Multiplayer Architecture

#### Real-time Head-to-Head Mode
- **Connection**: WebSocket via Firebase/Supabase real-time
- **Game Flow**:
  1. Matchmaking queue
  2. Player pairing
  3. Synchronized game start
  4. Real-time state updates
  5. Win condition detection
  6. Results and stats

#### State Synchronization
- Each player has independent board
- Actions broadcast to opponent
- Score updates in real-time
- Timer synchronization
- Game events (combos, special moves) visible to opponent

#### Competitive Mechanics
- **Combo Multipliers**: Consecutive matches increase score multiplier
- **Time Pressure**:
  - Timed rounds (e.g., 2-3 minutes)
  - Fastest to reach score target
  - Or highest score when time expires

### Project Structure

```
match399/
├── src/
│   ├── main.js                 # Entry point, Phaser game config
│   ├── scenes/
│   │   ├── BootScene.js        # Asset loading
│   │   ├── MenuScene.js        # Main menu
│   │   ├── SinglePlayerScene.js
│   │   └── MultiplayerScene.js
│   ├── game/
│   │   ├── Board.js            # Board logic and state
│   │   ├── Tile.js             # Individual tile/gem
│   │   ├── MatchDetector.js    # Match-3 algorithm
│   │   ├── ScoreManager.js     # Scoring and combos
│   │   └── Timer.js            # Timer system
│   ├── state/
│   │   ├── GameStateManager.js # Custom state manager
│   │   └── EventBus.js         # Event system
│   ├── multiplayer/
│   │   ├── NetworkManager.js   # Firebase/Supabase connection
│   │   ├── Matchmaking.js      # Player matching
│   │   └── StateSync.js        # State synchronization
│   └── utils/
│       ├── constants.js        # Game constants
│       └── helpers.js          # Utility functions
├── assets/
│   ├── images/                 # Sprites and tiles
│   ├── audio/                  # Sound effects and music
│   └── fonts/                  # Custom fonts
├── public/
│   └── index.html
└── package.json
```

## Development Phases

### Phase 1: Core Single Player ✅ COMPLETE
- [x] Setup Phaser 3 project
- [x] Implement Board and Tile classes
- [x] Match-3 detection algorithm
- [x] Basic swap and gravity physics
- [x] Scoring system with combo multipliers
- [x] Timer system
- [x] Single player game loop

### Phase 2: Polish Single Player ✅ COMPLETE
- [x] Visual effects and animations (particle explosions, screen shake, combo text, glow effects)
- [x] Sound effects (synthesized audio for match, combo, swap, game over)
- [x] UI/menus in Phaser (enhanced menu with animations, settings panel)
- [x] Enhanced tile graphics (gradient gems with shine effects)
- [x] Local high scores (localStorage persistence)

### Phase 3: Multiplayer Foundation ✅ COMPLETE
- [x] Setup Supabase (PostgreSQL database with real-time subscriptions)
- [x] Database schema (game_rooms, players, match_state, leaderboard tables with RLS)
- [x] Authentication system (anonymous login with AuthManager)
- [x] Network manager implementation (real-time channels via Supabase)
- [x] State synchronization protocol (broadcast events for game actions)
- [x] Matchmaking system (room creation, joining, player pairing)
- [x] Login UI scene (quick play and account options)

### Phase 4: Multiplayer Gameplay ✅ COMPLETE
- [x] Multiplayer scene implementation (dual view with player and opponent info)
- [x] Real-time state sync (tile swaps, matches, scores via NetworkManager)
- [x] Opponent board visualization (score, matches, status displayed)
- [x] Competitive mechanics integration (timer, combo multipliers, scoring)
- [x] Win/lose conditions (timer expiration, score comparison, disconnect handling)

### Phase 5: Polish & Launch
- [ ] Balance tweaking
- [ ] Bug fixes and optimization
- [ ] Leaderboards
- [ ] Spectator mode (optional)
- [ ] Deployment

## Phase 4 Completion Summary

**Multiplayer Game Scene:**
- Full-featured MultiplayerScene with split-screen layout
- Player's game board on the left side with full interaction
- Opponent's information panel on the right (score, matches, status)
- Synchronized timer displayed prominently in the center
- Ready system - both players must click "Ready" before game starts
- Real-time game state with 3-minute timer

**Real-Time Synchronization:**
- Tile swap broadcasting to opponent via NetworkManager
- Match notifications sent when tiles are matched
- Score updates synchronized in real-time
- Combo tracking visible to both players
- Player presence tracking (online/offline status)
- Graceful handling of disconnections

**Competitive Features:**
- Head-to-head scoring with live opponent score display
- Visual feedback when opponent makes matches (score pulse)
- Combo multiplier system (same as single player)
- Time pressure with countdown timer
- Winner determined by highest score when time expires
- Tie handling for equal scores

**Win/Lose System:**
- Automatic win if opponent disconnects
- Victory/defeat screen with final scores
- Player statistics updated (wins, losses, total games)
- Leaderboard score submission
- Game room cleanup after match ends
- Return to lobby after game completion

**Network Integration:**
- Full integration with Supabase real-time channels
- Presence tracking for opponent status
- Broadcast events for all game actions
- Event-driven architecture for network messages
- Room management via Matchmaking system
- Proper cleanup on scene exit

## Phase 3 Completion Summary

**Supabase Integration:**
- Installed @supabase/supabase-js client library
- Created supabaseClient.js with environment variable configuration
- Set up comprehensive database schema with 4 tables:
  - `players`: User profiles with stats (wins, losses, high scores)
  - `game_rooms`: Match rooms with player assignments and status
  - `match_state`: Real-time game action log for synchronization
  - `leaderboard`: Score tracking for competitive rankings
- Implemented Row Level Security (RLS) policies for data access control
- Created SUPABASE_SETUP.md guide with complete setup instructions

**Authentication System:**
- AuthManager class for user authentication and session management
- Anonymous login for quick play (auto-generated usernames)
- Player profile creation and management
- Session persistence with auto-refresh tokens
- Event-driven auth state changes (sign-in, sign-out)
- Player statistics tracking and updates

**Network Infrastructure:**
- NetworkManager class for real-time communication
- Supabase real-time channels for game rooms
- Presence tracking for player status
- Broadcast messaging for game actions
- Event-based message handling system
- Connection status monitoring

**Matchmaking System:**
- Automatic player pairing algorithm
- Room creation and joining logic
- Waiting room with opponent detection
- Game room status management (waiting, in_progress, finished)
- Win/loss tracking and player stats updates
- Leaderboard submission system

**User Interface:**
- LoginScene for multiplayer access
- Quick play button for anonymous users
- Placeholder for email authentication (Phase 5)
- Supabase configuration check and error handling
- Loading states and user feedback messages

**State Synchronization Protocol:**
- Defined game action message format:
  - tile-swap: Notify opponents of tile movements
  - match-made: Broadcast when matches are made
  - score-update: Real-time score synchronization
  - player-ready: Ready state for game start
  - game-start: Synchronized game initialization
  - game-over: Match completion and results

## Phase 2 Completion Summary

**Visual Enhancements:**
- Particle explosion effects on matches with color-coded particles
- Screen shake effects for combos and failed swaps (intensity scales with combo count)
- Combo text popups with animations
- Floating score text for match points
- Entrance animations for tiles (bounce and scale effects)
- Pulse animations for selected tiles with glow effects
- Tile graphics upgraded from plain circles to gradient gems with highlights

**Audio System:**
- Sound manager with Web Audio API synthesized sounds
- Sound effects: tile select, swap, match, combo, invalid move, warning, game over, high score
- Settings for enabling/disabling sound and music
- Volume control support (ready for future music tracks)

**UI Improvements:**
- Enhanced main menu with animated title, background particles
- Button hover effects with scale and color changes
- Fade transitions between scenes
- Settings panel with sound/music toggles
- High score display on main menu
- Visual polish with shadows, borders, and better typography

**Game Feel:**
- Smooth animations with easing functions (Bounce, Back, Power2)
- Visual feedback for all player actions
- Enhanced tile destruction with rotation and scale effects
- Success celebration effects for new high scores

## Key Decisions Log

| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-01-25 | Web platform with Phaser 3 | Cross-platform reach, mature framework |
| 2026-01-25 | Firebase/Supabase for backend | Quick setup, built-in real-time and auth |
| 2026-01-25 | Real-time head-to-head multiplayer | More engaging competitive experience |
| 2026-01-25 | Pure Phaser (no React) | Simpler stack, all UI in game engine |
| 2026-01-25 | Custom state manager | Lightweight, tailored to game needs |
| 2026-01-25 | Combo multipliers + time pressure | Core competitive mechanics for skill expression |
| 2026-01-25 | Synthesized audio for Phase 2 | Quick implementation, easily replaceable with real audio files |
| 2026-01-25 | Event-driven visual effects | Decouples game logic from presentation, easier to extend |

## Open Questions
- Specific Firebase vs Supabase choice (need to evaluate pricing/features)
- Tile art style (pixel art, flat design, realistic?)
- Audio requirements (royalty-free or custom?)
- Monetization strategy (if any)
