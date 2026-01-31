# Match-3 Game - Architecture Document

## Project Overview
A single-player match-3 puzzle game with timed gameplay and combo mechanics.

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
  - Local high score persistence with localStorage

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
- **Time pressure mechanics**: Timed rounds (2 minutes)
- Countdown display
- Game over when time expires
- High score tracking

### Project Structure

```
match399/
├── src/
│   ├── main.js                 # Entry point, Phaser game config
│   ├── scenes/
│   │   ├── BootScene.js        # Asset loading
│   │   ├── MenuScene.js        # Main menu
│   │   └── SinglePlayerScene.js # Main game scene
│   ├── game/
│   │   ├── Board.js            # Board logic and state
│   │   ├── Tile.js             # Individual tile/gem
│   │   ├── MatchDetector.js    # Match-3 algorithm
│   │   ├── ScoreManager.js     # Scoring and combos
│   │   ├── Timer.js            # Timer system
│   │   ├── VisualEffects.js    # Particle effects and animations
│   │   └── SoundManager.js     # Audio system
│   ├── state/
│   │   ├── GameStateManager.js # Custom state manager
│   │   └── EventBus.js         # Event system
│   └── utils/
│       └── constants.js        # Game constants
├── assets/
│   ├── images/                 # Sprites and tiles (none yet)
│   ├── audio/                  # Sound effects (synthesized)
│   └── fonts/                  # Custom fonts (none yet)
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

### Future Enhancements
- [ ] Additional game modes (timed challenges, endless mode)
- [ ] Power-ups and special tiles
- [ ] More visual effects and animations
- [ ] Music tracks
- [ ] Level progression system
- [ ] Achievements
- [ ] Deployment

## Implementation Summary

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
| 2026-01-25 | Pure Phaser (no React) | Simpler stack, all UI in game engine |
| 2026-01-25 | Custom state manager | Lightweight, tailored to game needs |
| 2026-01-25 | Combo multipliers + time pressure | Core mechanics for skill expression |
| 2026-01-25 | Synthesized audio | Quick implementation, easily replaceable with real audio files |
| 2026-01-25 | Event-driven visual effects | Decouples game logic from presentation, easier to extend |
| 2026-01-30 | Single-player focus | Simplified scope, removed multiplayer features |

## Notes
- Game uses localStorage for high score persistence
- All assets (tiles, particles) are procedurally generated at runtime
- No external asset files needed currently
