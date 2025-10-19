# Pre-Allocated Slots & No Ban Feature

## Overview

Updated the draft interface to show all pick and ban slots upfront, filling them in as the draft progresses. Also added the ability for teams to skip bans.

## Changes

### 1. Pick Order - Always Visible Slots

**Location:** Left panel, top section

**Before:**

- Only showed picked maps
- Empty when no picks made yet
- Section hidden until first pick

**After:**

- Always shows all slots (based on `best_of` from stage)
- Pre-allocated boxes for each pick position
- Empty slots show placeholder with "Waiting..." text
- Last slot always labeled "Tiebreaker"
- Slots fill in as teams make picks

**Visual Design:**

```
Empty Slot:
- Dashed gray border
- Gray background
- "?" icon in image area
- "Waiting..." or "Tiebreaker" text

Filled Slot:
- Solid colored border (red/blue/yellow)
- Map thumbnail with overlay
- Team badge (RED/BLUE or TB)
- Map details (title, mod, stars)
```

**Implementation:**

```typescript
// Fetch stage configuration
const { data: stageData } = await supabase
  .from("stages")
  .select("best_of, num_bans")
  .eq("id", matchData.stage_id)
  .single();

setNumBans((stageData as any).num_bans);
setNumPicks((stageData as any).best_of - 1); // Exclude TB

// Render slots
Array.from({ length: numPicks + 1 }).map((_, index) => {
  const pick = getPickedMaps()[index];
  const isTB = index === numPicks;
  // ... render filled or empty slot
});
```

### 2. Banned Maps - Always Visible Slots

**Location:** Left panel, bottom section

**Before:**

- Only showed banned maps
- Empty when no bans made yet
- Section hidden until first ban

**After:**

- Always shows all slots (based on `num_bans * 2` from stage)
- Pre-allocated boxes for each ban position
- Empty slots show Shield icon placeholder
- Title shows progress: "Bans (2/6)"
- Slots fill in as teams ban maps

**Visual Design:**

```
Empty Slot:
- Dashed gray border
- Dark gray background
- Gray Shield icon centered

Filled Slot:
- Red gradient overlay
- Grayscale map thumbnail
- White Shield icon
- Mod pool label (e.g., "NM1")
```

**Implementation:**

```typescript
// Render ban slots
<h2>Bans ({getBannedMaps().length}/{numBans * 2})</h2>
<div className="grid grid-cols-2 gap-2">
  {Array.from({ length: numBans * 2 }).map((_, index) => {
    const bannedMap = getBannedMaps()[index];
    return bannedMap ? /* filled slot */ : /* empty slot */;
  })}
</div>
```

### 3. "No Ban" / Skip Ban Feature

**Location:** Header section, below ROLL button

**When Visible:**

- Match status is "banning"
- User is captain
- It's their team's turn

**Button Design:**

- Gray gradient background (different from action buttons)
- Border for distinction
- Text: "Skip Ban (No Ban)"
- Smaller size than ROLL button

**Functionality:**

```typescript
const handleBan = async (beatmapId: string | null) => {
  if (!isCaptain || !myTeam || match?.current_team !== myTeam) return;

  if (beatmapId === null) {
    console.log(`⏭️ ${myTeam} team skipped their ban`);
  }

  await performAction("ban", beatmapId);
};

// Button
<button
  onClick={() => handleBan(null)}
  className="mt-3 w-full py-2 bg-gradient-to-r from-gray-600 to-gray-700..."
>
  Skip Ban (No Ban)
</button>;
```

**Backend Handling:**

- `beatmap_id` is set to `null` in match_action
- `processMatchAction()` still advances the turn
- Ban slot remains empty (no map banned)
- Progress counter doesn't increase filled bans

### 4. Stage Data Integration

**New State Variables:**

```typescript
const [numBans, setNumBans] = useState(0);
const [numPicks, setNumPicks] = useState(0);
```

**Data Flow:**

1. Fetch match data
2. Get `stage_id` from match
3. Query `stages` table for `best_of` and `num_bans`
4. Calculate:
   - `numPicks = best_of - 1` (exclude TB)
   - `numBans = num_bans` (per team)
5. Render `numPicks + 1` pick slots (+ TB slot)
6. Render `numBans * 2` ban slots (both teams)

## User Experience Benefits

### 1. Visual Clarity

- Users immediately see how many picks/bans will happen
- No surprises about draft length
- Progress is always visible

### 2. Draft Flow Understanding

- Empty slots create anticipation
- Clear indication of what's left to do
- Tiebreaker slot reminds users it's auto-filled

### 3. Strategic Option

- Teams can choose not to ban
- Useful when:
  - Confident in all maps
  - Want to save time
  - Strategic decision to keep options open

### 4. Professional Appearance

- Matches esports draft tools
- Clean, organized layout
- No sudden UI changes during draft

## Example Scenarios

### Best of 7, 3 Bans

- **Pick slots:** 7 (6 regular + TB)
- **Ban slots:** 6 (3 per team)
- **Total draft actions:** 12 bans + 6 picks = 18 actions

### Best of 5, 2 Bans

- **Pick slots:** 5 (4 regular + TB)
- **Ban slots:** 4 (2 per team)
- **Total draft actions:** 8 bans + 4 picks = 12 actions

### Best of 3, 1 Ban

- **Pick slots:** 3 (2 regular + TB)
- **Ban slots:** 2 (1 per team)
- **Total draft actions:** 4 bans + 2 picks = 6 actions

## Technical Notes

- Empty slots use `Array.from()` to generate placeholders
- `index` is used as key for empty slots (unique per render)
- Filled slots use `beatmap.id` as key
- Stage data fetched once on component mount
- No performance impact (small number of slots)
- Responsive grid layout maintained

## Related Files

- `app/draft/[id]/page.tsx` - Main draft component with slots
- `lib/match-logic.ts` - Handles null beatmap_id for skipped bans
- Database schema - `beatmap_id` already nullable in `match_actions`
