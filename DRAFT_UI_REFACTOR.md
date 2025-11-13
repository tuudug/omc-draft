# Draft UI Refactor - MOBA-Style Tournament Draft System

## Overview

This document describes the comprehensive refactoring of the osu! tournament draft system into a highly polished, MOBA-style (League of Legends, Dota 2) draft interface.

## New Features

### 1. Roll Phase Enhancement

**Animated Dice Roll:**
- 3D-style animated dice showing random numbers while rolling
- Smooth 2-second rolling animation with rotation effects
- Pulsing glow effects in team colors
- Clear visual indication of roll results

**Component:** `components/draft/DiceRoll.tsx`

### 2. Preference Selection System

After the roll phase, the winner now selects from 4 strategic options:

- **First Pick** - Pick the first map
- **Second Pick** - Pick after opponent's first pick
- **First Ban** - Ban the first map
- **Second Ban** - Ban after opponent's first ban

**Features:**
- Beautiful card-based UI with hover effects
- Color-coded cards with gradients
- Clear visual summary showing what each team gets
- Automatic calculation of remaining preferences for loser

**Component:** `components/draft/PreferenceSelector.tsx`

**Database Changes:**
- Added `preference_selection` status to match states
- Added `roll_winner_preference` column to matches table
- Updated match logic to handle preference-based pick/ban order

### 3. Enhanced Map Cards

**Full Metadata Display:**
- Star rating with star icon
- Length (MM:SS format) with clock icon
- BPM with music note icon
- CS and AR stats
- Map title, artist, and difficulty name
- Mod pool badge (NM, HD, HR, DT, FM, TB)

**Visual States:**
- **Available** - Bright, interactive, hover effects
- **Banned** - Red overlay with "BANNED" stamp, grayscale
- **Picked** - Team-colored overlay with "PICKED" stamp
- **Locked** - Yellow border for tiebreaker

**Interactions:**
- Smooth hover scale effect
- Interactive ban/pick buttons on hover
- Glow effects in action color (red for ban, green for pick)

**Component:** `components/draft/EnhancedMapCard.tsx`

### 4. Phase Indicator

**Clear Visual Communication:**
- Large, prominent phase display
- Icon for each phase (Dice, Shield, Trophy, etc.)
- Gradient backgrounds matching phase type
- Current team name and color
- Action counter (e.g., "Ban 2 of 4", "Pick 5 of 12")
- Timer display with progress bar
- Urgent state when < 10 seconds (red pulsing)

**Component:** `components/draft/PhaseIndicator.tsx`

### 5. Audio System

**Sound Effects for All Actions:**
- Phase change sounds (rising chord)
- Ban action (deep, ominous tone)
- Pick action (bright, positive tone)
- Roll action (ascending notes)
- Timer warnings (beep at 10 seconds)
- Countdown beeps (last 3 seconds)

**Implementation:**
- Web Audio API for tone generation
- No external audio files required
- Toggleable via admin controls
- Non-intrusive, pleasant sounds

**Component:** `components/draft/AudioManager.tsx`

### 6. Admin Controls

**Floating Action Button:**
- Settings gear icon
- Expandable menu
- Smooth animations

**Features:**
- **Audio Toggle** - Mute/unmute sound effects
- **Export Draft** - Generate text/JSON summaries
- **Undo** - Reverse last action (future)
- **Reset** - Restart draft (future)

**Component:** `components/draft/AdminControls.tsx`

### 7. Export Functionality

**Export Formats:**

1. **Text Format:**
   - Human-readable summary
   - Match information
   - Roll results
   - Chronological ban/pick list
   - Copy to clipboard or download

2. **JSON Format:**
   - Structured data
   - Full match details
   - Action history with timestamps
   - Beatmap metadata
   - API-friendly format

**Component:** `components/draft/ExportModal.tsx`

### 8. Team Customization

**Database Support:**
- `team_red_color` - Hex color code (default: #EF4444)
- `team_blue_color` - Hex color code (default: #3B82F6)
- `team_red_logo_url` - Team logo image URL
- `team_blue_logo_url` - Team logo image URL
- `tournament_name` - Tournament name (default: "osu! Mongolia Cup 2025")
- `tournament_logo_url` - Tournament logo URL

**UI Integration:**
- All team-related colors dynamically use database values
- Pick timeline uses team colors
- Team sections use team colors
- Phase indicators use current team color

## Technical Architecture

### New Components Structure

```
components/draft/
├── DiceRoll.tsx              # Animated dice roll component
├── PreferenceSelector.tsx    # 4-card preference selection
├── EnhancedMapCard.tsx       # Full metadata map card
├── PhaseIndicator.tsx        # Large phase display
├── AudioManager.tsx          # Sound effect system
├── AdminControls.tsx         # Admin floating menu
└── ExportModal.tsx          # Export functionality modal
```

### Updated Files

1. **types/index.ts**
   - Added `preference_selection` to MatchStatus
   - Added `preference` to ActionType
   - Added `RollPreference` type
   - Extended Match interface with customization fields

2. **lib/match-logic.ts**
   - Added preference selection phase handling
   - Updated roll phase to transition to preference selection
   - Implemented pick/ban order calculation based on preference
   - Added preference parameter to processMatchAction

3. **app/api/matches/[id]/action/route.ts**
   - Added preference parameter handling
   - Pass preference to match logic processor

4. **app/draft/[id]/page.tsx**
   - Complete refactor using new components
   - Added audio state management
   - Added export modal state
   - Integrated all new UI components
   - Enhanced layout with better grid system

### Database Migration

**File:** `supabase-migration-preferences.sql`

**Changes:**
1. Update status enum to include `preference_selection`
2. Update action_type enum to include `preference`
3. Add team color columns
4. Add team logo URL columns
5. Add preference column
6. Add tournament name/logo columns
7. Add metadata JSONB column to match_actions
8. Create draft_summary view for exports

**To Apply:**
Run the entire migration file in Supabase SQL Editor.

## UI/UX Improvements

### Visual Design

1. **Dark Theme:**
   - Gradient backgrounds (gray-900 → purple-900)
   - Semi-transparent cards with backdrop blur
   - Vibrant accent colors for teams

2. **Animations:**
   - Framer Motion for all transitions
   - 60fps smooth animations
   - Stagger delays for list items
   - Scale, fade, and slide effects

3. **Responsive Layout:**
   - 12-column grid for draft phase
   - 2 columns for team sections
   - 8 columns for map pool
   - Overflow scroll for long content

### Accessibility

1. **Clear Visual Hierarchy:**
   - Large phase indicators
   - Color-coded team sections
   - High contrast text

2. **Interactive Feedback:**
   - Hover effects on all buttons
   - Active state animations
   - Disabled states for unavailable actions

3. **Audio Cues:**
   - Optional sound effects
   - Non-intrusive tones
   - Clear action feedback

## Spectator-Friendly Features

### Stream Compatibility

1. **Large, Readable Text:**
   - 2xl-5xl font sizes for important info
   - Clear typography hierarchy

2. **Color Coding:**
   - Consistent team colors throughout
   - Clear pick/ban distinction
   - Phase-based color themes

3. **Timeline Display:**
   - Horizontal pick order visualization
   - Shows all upcoming picks
   - Color-coded by team
   - Tiebreaker highlighted

4. **Export for Production:**
   - Text summaries for overlays
   - JSON data for automated graphics
   - Copy-to-clipboard for quick sharing

## Future Enhancements (Not Implemented)

### Planned Features

1. **Undo/Redo System:**
   - Admin can reverse actions
   - History tracking
   - Confirmation dialogs

2. **Discord Webhooks:**
   - Post draft updates to Discord
   - Configurable webhook URL
   - Rich embeds with draft info

3. **Draft Replay:**
   - View completed drafts
   - Step-through action history
   - Export as video/GIF

4. **Stats Overlay:**
   - Map pick rates
   - Ban rates
   - Historical data

5. **Coach Mode:**
   - Separate view for coaches
   - Note-taking interface
   - Timer display

6. **Team Logos:**
   - Upload and display team logos
   - Show in team headers
   - Use in export graphics

## Testing Checklist

- [x] TypeScript compilation
- [ ] Roll phase dice animation
- [ ] Preference selection UI
- [ ] Ban phase with enhanced cards
- [ ] Pick phase with enhanced cards
- [ ] Phase transitions
- [ ] Audio system (all sounds)
- [ ] Export functionality (text & JSON)
- [ ] Admin controls menu
- [ ] Timer countdown and urgency
- [ ] Pick timeline display
- [ ] Team color customization
- [ ] Responsive layout
- [ ] Real-time synchronization
- [ ] Error handling

## Performance Considerations

1. **Optimized Rendering:**
   - Framer Motion layout animations
   - AnimatePresence for mount/unmount
   - Conditional rendering of phases

2. **Network Efficiency:**
   - Supabase Realtime for live updates
   - Minimal API calls
   - Optimistic UI updates

3. **Asset Loading:**
   - Lazy load beatmap images
   - Optimize image sizes
   - Cache beatmap data

## Breaking Changes

### For Existing Matches

⚠️ **Important:** Existing matches created before this update will not have:
- Team colors (will use defaults)
- Tournament name (will use default)
- Preference selection phase (will skip directly to ban phase)

**Migration Path:**
- Existing matches will continue to work
- Roll phase transitions directly to ban phase (legacy behavior)
- New matches will use full preference system

### Database Schema

Must run migration SQL before using new features:
```bash
# Run in Supabase SQL Editor
supabase-migration-preferences.sql
```

## Credits

**Inspired by:**
- League of Legends Champion Select
- Dota 2 Hero Draft
- CS:GO Map Veto Systems

**Built with:**
- Next.js 15.5.6
- React 19.1.0
- TypeScript 5.9.3
- Framer Motion 12.23.24
- Tailwind CSS 4
- Supabase (PostgreSQL + Realtime)

## License

This project is part of the osu! Mongolia Cup 2025 tournament system.
