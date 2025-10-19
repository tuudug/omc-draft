# Mod Pool Reference Guide

## Standard osu! Tournament Mod Pools

### Mod Types

| Mod Code | Full Name   | Description                                       |
| -------- | ----------- | ------------------------------------------------- |
| **NM**   | No Mod      | No modifications, standard play                   |
| **HD**   | Hidden      | Approach circles fade out before hit              |
| **HR**   | Hard Rock   | Increased difficulty (higher AR, smaller CS)      |
| **FM**   | FreeMod     | Players can choose mods freely (usually HD/HR/FL) |
| **DT**   | Double Time | 1.5x speed increase                               |
| **TB**   | Tiebreaker  | Final deciding map if score is tied               |

### Typical Map Pool Sizes

#### Best of 9 (BO9) - First to 5

- **NM**: 5-7 maps
- **HD**: 2-3 maps
- **HR**: 2-3 maps
- **FM**: 2-3 maps
- **DT**: 2-3 maps
- **TB**: 1 map
- **Total**: ~15-20 maps

#### Best of 11 (BO11) - First to 6

- **NM**: 6-8 maps
- **HD**: 3-4 maps
- **HR**: 3-4 maps
- **FM**: 3-4 maps
- **DT**: 3-4 maps
- **TB**: 1 map
- **Total**: ~20-25 maps

#### Best of 13 (BO13) - First to 7

- **NM**: 7-9 maps
- **HD**: 3-4 maps
- **HR**: 3-4 maps
- **FM**: 3-4 maps
- **DT**: 3-4 maps
- **TB**: 1 map
- **Total**: ~25-30 maps

## Map Naming Convention

Maps are labeled by mod and index:

- `NM1`, `NM2`, `NM3`, ... (No Mod pool)
- `HD1`, `HD2`, `HD3`, ... (Hidden pool)
- `HR1`, `HR2`, `HR3`, ... (Hard Rock pool)
- `FM1`, `FM2`, `FM3`, ... (FreeMod pool)
- `DT1`, `DT2`, `DT3`, ... (Double Time pool)
- `TB1` (Tiebreaker - always just one)

## Draft Rules

### Standard Tournament Ban/Pick Format

#### Bans

- Each team typically gets **1-2 bans**
- Roll winner bans first
- Teams alternate bans
- Cannot ban Tiebreaker

#### Picks

- Number of picks = Best of X - 1
  - BO9 = 8 picks
  - BO11 = 10 picks
  - BO13 = 12 picks
- Roll winner picks first
- Teams alternate picks
- Tiebreaker is played last if score is tied

#### Example Ban/Pick Order (BO9, 2 bans each)

1. **Roll**: Red 76, Blue 58 → Red wins
2. **Ban 1**: Red bans HD2
3. **Ban 2**: Blue bans DT1
4. **Ban 3**: Red bans FM3
5. **Ban 4**: Blue bans HR2
6. **Pick 1**: Red picks NM4
7. **Pick 2**: Blue picks HD1
8. **Pick 3**: Red picks DT2
9. **Pick 4**: Blue picks NM2
10. **Pick 5**: Red picks FM1
11. **Pick 6**: Blue picks HR1
12. **Pick 7**: Red picks DT3
13. **Pick 8**: Blue picks NM5
14. **Tiebreaker**: If score is 4-4, play TB1

## Map Selection Strategy

### Banning Phase

- Ban opponent's strong mods
- Ban maps you're weak at
- Consider your team composition
- Save strongest mod pools for picking

### Picking Phase

- Start with comfort picks
- Mix up mod pools
- Force opponent into unfavorable mods
- Save momentum maps for crucial points
- Consider fatigue (harder maps later?)

## Finding Beatmap IDs

### Method 1: osu! Website

1. Go to https://osu.ppy.sh
2. Search for a beatmapset
3. Click on specific difficulty
4. URL will show: `osu.ppy.sh/beatmaps/[BEATMAP_ID]`
5. Use that number

### Method 2: osu! Client

1. Open beatmap in game
2. Press F3 to open chat
3. Type `/np` (now playing)
4. Look at the beatmap link in chat
5. Extract ID from URL

### Method 3: API

Use the osu! API to search:

```
https://osu.ppy.sh/api/v2/beatmaps/[ID]
```

## Common Beatmap ID Examples

Popular tournament maps for reference:

**No Mod**

- 3756088 - RADWIMPS - Sparkle (Sotarks) [Extra] - 5.96★
- 2788470 - Porter Robinson - Flicker (Monstrata) [Brilliance] - 5.78★
- 1854467 - Daft Punk - Harder Better Faster Stronger (val0108) [Extra] - 5.41★

**Hidden**

- 2567561 - The Chainsmokers - Closer (Sonnyc) [Distance] - 5.45★
- 1612827 - DragonForce - Defenders (DeRandom Otaku) [Extra] - 5.61★

**Hard Rock**

- 935090 - REOL - No title (VINXIS) [Extra] - 5.61★
- 774965 - Rise Against - Prayer of the Refugee (pishifat) [Insane] - 4.96★

**Double Time**

- 1789815 - TRUE - Soundscape (Syph) [Melody] - 3.92★ (5.88★ with DT)
- 1669876 - Suzuki Konomi - Utaeba Soko ni Kimi ga Iru kara (Kalibe) [Tomorrow] - 4.13★ (6.20★ with DT)

**Tiebreaker**

- 2923641 - Imperial Circus Dead Decadence - Uta (Kite) [Himei] - 7.98★
- 2190499 - DragonForce - Defenders (Spaghetti) [Legend] - 8.42★

## Tips for Tournament Organizers

### Map Pool Creation

1. **Variety**: Include different styles, artists, patterns
2. **Balanced Difficulty**: Similar star rating within mod pools
3. **No Surprises**: Avoid extremely unconventional maps
4. **Testing**: Have testers play all maps
5. **Metadata**: Keep track of mapper, artist, length

### Map Pool Distribution

- Release 1-2 weeks before stage
- Provide downloadable pack
- Include spreadsheet with details
- Allow practice time

### During Matches

- Have backup maps ready
- Monitor map availability (ranked status)
- Be ready to handle disputes
- Document all picks/bans

## Customization in This System

### Adding New Mod Types

Edit `types/index.ts`:

```typescript
export type ModPool = "NM" | "HD" | "HR" | "FM" | "DT" | "TB" | "YOUR_NEW_MOD";
```

Also update `app/admin/stages/page.tsx`:

```typescript
const MOD_POOLS: ModPool[] = [
  "NM",
  "HD",
  "HR",
  "FM",
  "DT",
  "TB",
  "YOUR_NEW_MOD",
];
```

### Adjusting Pool Sizes

The system allows dynamic pool sizes. You can add as many maps per pool as needed using the "Add Slot" button.

### Custom Ban Counts

When creating a stage, set the "Number of Bans" field to your desired value (0-10 typically).

---

**Remember**: The draft is just the beginning - the real battle happens in-game! Good luck! 🎮
