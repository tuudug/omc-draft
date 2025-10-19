# Draft UI Improvements

## Overview

Enhanced visual feedback and user experience for the draft interface with three major improvements:

## 1. Prominent "YOUR TURN" Indicator

**Location:** Status section in draft interface

**Features:**

- Large animated banner that pulses continuously
- Bright yellow-to-orange gradient background
- Only shows for the active captain during their turn
- Displays action type (BAN or PICK)
- 🎯 Emojis on both sides for extra visibility

**Code:**

```tsx
{
  isCaptain &&
    match.current_team === myTeam &&
    (match.status === "banning" || match.status === "picking") && (
      <motion.div
        className="mt-4 px-8 py-4 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-xl shadow-2xl"
        animate={{ scale: [1, 1.05, 1] }}
        transition={{ duration: 1, repeat: Infinity }}
      >
        <div className="text-white font-bold text-2xl uppercase tracking-wide">
          🎯 YOUR TURN - {match.status === "banning" ? "BAN" : "PICK"} A MAP! 🎯
        </div>
      </motion.div>
    );
}
```

## 2. Enhanced Banned Maps Display

**Location:** Banned Maps section

**Improvements:**

- Darker grayscale filter (brightness-50)
- Gradient overlay from red to dark gray
- Shield icon above "BANNED" text
- Red border accent
- Shows mod pool indicator (e.g., "NM1")
- Animated entrance with Framer Motion

**Visual Treatment:**

- `grayscale brightness-50` filter on image
- `bg-gradient-to-br from-red-600/80 to-gray-900/80` overlay
- `border-2 border-red-500` for emphasis

## 3. Enhanced Picked Maps Display

### In Pick Order List

**Features:**

- Team-colored overlay on thumbnail (red/blue)
- "PICKED" text on image
- Animated entrance with staggered delay
- Team color borders and backgrounds

### In Map Pool Grid

**Features:**

- Trophy icon above "PICKED" text
- Team-colored gradient overlay (red or blue)
- Shows which team picked the map
- Brightness reduced to 75%
- Team-colored border (red-400 or blue-400)

**Code Example:**

```tsx
{
  isPicked && (
    <div
      className={`absolute inset-0 ${
        pickedByTeam === "red"
          ? "bg-gradient-to-br from-red-500/70 to-red-900/70 border-red-400"
          : "bg-gradient-to-br from-blue-500/70 to-blue-900/70 border-blue-400"
      } flex flex-col items-center justify-center border-2`}
    >
      <Trophy className="w-8 h-8 text-white mb-1" />
      <span className="text-white font-bold text-lg">PICKED</span>
      <span className="text-white/90 text-xs mt-1">
        {pickedByTeam === "red" ? match.team_red_name : match.team_blue_name}
      </span>
    </div>
  );
}
```

## 4. Tiebreaker (TB) Protection

**Location:** Map Pool section

**Business Rule:** TB maps are automatically the final map and cannot be banned or picked during the draft.

**Implementation:**

- TB mod pool marked with "AUTO FINAL MAP" badge
- Yellow lock overlay on TB maps: "🔒 FINAL MAP 🔒"
- `canInteract` check includes `!isTiebreaker` condition
- TB maps are not clickable during ban/pick phases

**Visual Indicators:**

- Yellow/orange badge next to "TB" heading
- Subtle yellow-orange gradient overlay on TB maps
- Yellow border accent
- `pointer-events-none` to prevent interaction

**Code Logic:**

```tsx
const isTiebreaker = modPool === "TB";

// In mod pool heading
{
  isTiebreaker && (
    <span className="px-3 py-1 bg-yellow-500/20 border border-yellow-500 rounded-full text-yellow-400 text-xs font-bold">
      AUTO FINAL MAP
    </span>
  );
}

// In canInteract check
const canInteract =
  !isTiebreaker &&
  isCaptain &&
  match.current_team === myTeam &&
  !isBanned &&
  !isPicked;
```

## Visual Hierarchy Summary

**Map States (from most to least prominent):**

1. **Your Turn to Act** - Pulsing yellow/orange banner (impossible to miss)
2. **Banned Maps** - Red overlay with shield icon
3. **Picked Maps** - Team-colored overlay with trophy icon
4. **TB Maps** - Yellow lock overlay (protected)
5. **Available Maps** - Normal appearance with hover effects

**Color Coding:**

- 🔴 Red = Banned / Team Red
- 🔵 Blue = Team Blue
- 🟡 Yellow/Orange = Your Turn / Tiebreaker
- 🟢 Green = Pick action hover

## User Experience Benefits

1. **Clarity:** Captains instantly know when it's their turn
2. **Feedback:** Clear visual distinction between all map states
3. **Prevention:** TB protection prevents rule violations
4. **Accessibility:** Multiple visual cues (color, icons, text, animations)
5. **Polish:** Smooth Framer Motion animations throughout

## Technical Notes

- Uses Framer Motion for all animations
- Lucide React icons: Shield (banned), Trophy (picked)
- Tailwind CSS for styling with gradient overlays
- Real-time updates via Supabase channels
- No breaking changes to existing functionality
