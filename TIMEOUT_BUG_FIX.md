# Timeout Bug Fix

## Problem

When the timer ran out during the picking phase, the system was auto-picking **ALL remaining maps** including the **Tiebreaker (TB)**, causing the draft to immediately end.

**Expected behavior:**

- Pick ONE random map (excluding TB)
- Pass turn to the other team
- Continue draft normally

## Root Causes

### 1. TB Not Excluded from Available Maps

**File:** `app/draft/[id]/page.tsx`

**Issue:** `getAvailableMaps()` was returning all non-banned, non-picked maps including TB.

**Fix:**

```typescript
// BEFORE
return beatmaps.filter(
  (b) => !bannedIds.includes(b.id) && !pickedIds.includes(b.id)
);

// AFTER
return beatmaps.filter(
  (b) =>
    b.mod_pool !== "TB" &&
    !bannedIds.includes(b.id) &&
    !pickedIds.includes(b.id)
);
```

Now TB maps are completely excluded from the available pool for banning and picking.

### 2. Multiple Timer Triggers

**File:** `app/draft/[id]/page.tsx`

**Issue:** Timer interval runs every 100ms. When timer expires, `handleTimerExpired()` could be called multiple times before state updates propagate, causing multiple random picks in quick succession.

**Fix:** Added `isHandlingTimeout` state flag to prevent concurrent executions:

```typescript
// Added state
const [isHandlingTimeout, setIsHandlingTimeout] = useState(false);

// Updated timer effect
useEffect(() => {
  if (!match?.timer_ends_at) {
    setTimeRemaining(0);
    setIsHandlingTimeout(false); // Reset flag when timer cleared
    return;
  }

  const interval = setInterval(() => {
    const remaining = Math.max(
      0,
      new Date(match.timer_ends_at!).getTime() - Date.now()
    );
    setTimeRemaining(Math.ceil(remaining / 1000));

    // Only trigger if not already handling
    if (remaining <= 0 && !isHandlingTimeout) {
      setIsHandlingTimeout(true);
      handleTimerExpired();
    }
  }, 100);

  return () => clearInterval(interval);
}, [match?.timer_ends_at, isHandlingTimeout]);

// Updated handler with try-finally
const handleTimerExpired = async () => {
  if (!match || !isCaptain || match.current_team !== myTeam) {
    setIsHandlingTimeout(false);
    return;
  }

  try {
    if (match.status === "picking") {
      const availableMaps = getAvailableMaps();
      if (availableMaps.length > 0) {
        const randomMap =
          availableMaps[Math.floor(Math.random() * availableMaps.length)];
        console.log(`⏰ TIMEOUT: Auto-picking random map for ${myTeam} team`);
        await handlePick(randomMap.id, true);
      } else {
        console.log("⚠️ TIMEOUT: No available maps to pick!");
      }
    } else if (match.status === "banning") {
      await performAction("ban", null);
    }
  } finally {
    setIsHandlingTimeout(false); // Always reset flag
  }
};
```

### 3. Visual Feedback for Timeout Picks

**File:** `app/draft/[id]/page.tsx`

**Enhancement:** Added `isTimeout` parameter to `handlePick()` to log when a pick was due to timeout:

```typescript
const handlePick = async (beatmapId: string, isTimeout: boolean = false) => {
  if (!isCaptain || !myTeam || match?.current_team !== myTeam) return;

  // Show console notification for timeout picks
  if (isTimeout) {
    const map = beatmaps.find((b) => b.id === beatmapId);
    if (map) {
      console.log(
        `⏰ Time expired! Random pick: ${map.mod_pool}${map.mod_index} - ${map.title}`
      );
    }
  }

  await performAction("pick", beatmapId);
};
```

## How It Works Now

### Timeout Flow

1. **Timer expires** (remaining time ≤ 0)
2. **Guard check:** `isHandlingTimeout` flag prevents duplicate calls
3. **Validate:** Check if user is captain and it's their turn
4. **Get available maps:** Filter out TB, banned, and picked maps
5. **Pick one random map:** Select randomly from available pool
6. **Log action:** Console shows which map was auto-picked
7. **Process action:** Send to API, which updates match state
8. **State transition:** Turn passes to other team via `processMatchAction()`
9. **Reset flag:** `isHandlingTimeout` set to false
10. **Continue draft:** Next team's turn begins with new 60s timer

### Example Console Output

```
⏰ TIMEOUT: Auto-picking random map for red team
⏰ Time expired! Random pick: HD2 - Some Artist - Some Song [Hard]
```

## Testing Checklist

- [x] TB is excluded from `getAvailableMaps()`
- [x] Only ONE map is auto-picked on timeout
- [x] Turn correctly passes to other team after timeout pick
- [x] No duplicate timeout triggers
- [x] Draft continues normally after timeout
- [x] TB still appears in Pick Order after all picks complete
- [x] Console logs show timeout picks for debugging

## Side Effects

- **None**: All existing functionality preserved
- **Improved**: TB protection now consistent (can't be picked manually OR by timeout)
- **Better UX**: Clear console logging for debugging timeout situations

## Related Files

- `app/draft/[id]/page.tsx` - Main draft component with timeout logic
- `lib/match-logic.ts` - Server-side state machine (unchanged, working correctly)
- `app/api/matches/[id]/action/route.ts` - Action endpoint (unchanged, working correctly)
