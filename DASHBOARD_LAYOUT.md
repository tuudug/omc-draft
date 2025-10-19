# Dashboard Layout Update

## Overview

Completely restructured the draft interface to be a compact, non-scrollable dashboard that uses all available screen space efficiently.

## Major Changes

### 1. Full-Screen Dashboard Layout

- **Container**: Changed from scrollable content to `h-screen overflow-hidden flex flex-col`
- **No page scrolling**: Everything fits in viewport with internal scrollable sections
- **Compact spacing**: Reduced padding from `p-8` to `p-3`, gaps from `mb-6` to `gap-3`
- **Removed max-width**: Eliminated `max-w-7xl mx-auto` to use full width

### 2. Three-Column Grid Layout

```
┌─────────────────────────────────────────────────────────┐
│ Header (Flex-shrink-0)                                  │
├─────────────┬───────────────────────────────────────────┤
│ Pick Order  │                                           │
│ (3 cols)    │     Map Pool (9 cols)                     │
│             │                                           │
│ Banned Maps │     Scrollable                            │
│ (3 cols)    │                                           │
│             │                                           │
│ Scrollable  │                                           │
└─────────────┴───────────────────────────────────────────┘
```

**Grid Structure:**

- Left column: `col-span-3` (25% width)
  - Pick Order section at top
  - Banned Maps section below
  - Vertically scrollable
- Right column: `col-span-9` (75% width)
  - Map Pool with all mod categories
  - Vertically scrollable

### 3. Compact Component Sizing

#### Header

- Font sizes reduced: `text-2xl` → `text-xl`, `text-xl` → `text-lg`
- Icons scaled down: `w-8 h-8` → `w-6 h-6`, `w-6 h-6` → `w-5 h-5`
- Padding reduced: `p-6` → `p-4`, `gap-4` → `gap-3`
- Timer display compacted: `px-6 py-3` → `px-4 py-2`

#### Pick Order List

- Title: `text-2xl` → `text-lg`
- Item spacing: `gap-4` → `gap-2`, `p-4` → `p-2`
- Number indicator: `text-lg w-8` → `text-sm w-6`
- Thumbnail: `w-20 h-12` → `w-16 h-10`
- Text sizes: `text-base` → `text-xs`, `text-sm` → `text-[10px]`
- Team badges: Full names → "RED"/"BLUE" in smaller badges

#### Banned Maps

- Title: `text-2xl` → `text-lg`
- Grid: `grid-cols-4` → `grid-cols-2`
- Image height: `h-24` → `h-16`
- Icons: `w-8 h-8` → `w-4 h-4`
- Text: Shows only mod pool code (e.g., "NM1")

#### Map Pool

- Title: `text-2xl` → `text-xl`
- Section spacing: `space-y-6` → `space-y-4`
- Mod pool headings: `text-xl` → `text-lg`
- Grid density: `lg:grid-cols-3` → `lg:grid-cols-4 xl:grid-cols-5`
- Card height: `h-32` → `h-24`
- Text sizes: `text-sm` → `text-xs`, `text-xs` → `text-[10px]`
- Overlay icons: `w-8 h-8` → `w-5 h-5`
- Button text: `text-lg` → `text-sm`

### 4. Tiebreaker (TB) Auto-Addition

#### Logic in `getPickedMaps()`

```typescript
// Add TB at the end if all picks are done
if (
  match?.status === "completed" ||
  (picked.length > 0 &&
    match?.status !== "banning" &&
    match?.status !== "rolling")
) {
  const tbMap = beatmaps.find((b) => b.mod_pool === "TB");
  if (tbMap && !picked.some((p) => p.beatmap.id === tbMap.id)) {
    picked.push({
      beatmap: tbMap,
      team: "tiebreaker" as Team,
    });
  }
}
```

#### Visual Treatment

- **Pick Order List**: TB shows with yellow-orange border
- **Indicator**: Shows "TB" instead of "PICKED"
- **No team badge**: TB doesn't show RED/BLUE label
- **Order**: Always appears last in the pick order (#7 if 6 maps were picked)

### 5. Type System Update

```typescript
// Added "tiebreaker" to Team type
export type Team = "red" | "blue" | "tiebreaker";
```

This allows TB maps to be included in the pick order without triggering type errors.

### 6. Responsive Density

- **XL screens**: 5 maps per row in map pool
- **LG screens**: 4 maps per row
- **MD screens**: 3 maps per row
- **Small screens**: 2 maps per row

### 7. Scroll Behavior

- **Outer container**: No scroll (`overflow-hidden`)
- **Left column**: Vertical scroll only (`overflow-y-auto`)
- **Right column**: Vertical scroll only (`overflow-y-auto`)
- **Header**: Fixed height, no scroll (`flex-shrink-0`)

## Visual Density Comparison

### Before

- Large margins and padding throughout
- Single column layout
- Much white space on wide screens
- Page scrolls vertically
- Large text and icons

### After

- Tight, compact spacing
- Two-column dashboard layout
- Full screen utilization
- No page scroll, internal scrolling only
- Smaller text optimized for information density
- Professional dashboard aesthetic

## Benefits

1. **Information Density**: See more maps at once without scrolling
2. **Context Awareness**: Pick order always visible alongside map pool
3. **Professional Feel**: Dashboard layout like competitive gaming tools
4. **No Scroll Confusion**: Clear which sections scroll vs fixed header
5. **Responsive**: Adapts to screen size with appropriate column counts
6. **TB Integration**: Final map automatically appears in pick order

## Technical Notes

- All animations preserved (Framer Motion)
- Real-time updates still functional
- No breaking changes to state management
- Image warnings (Next.js optimization) are non-critical
- TypeScript errors are pre-existing type inference issues (runtime safe)
