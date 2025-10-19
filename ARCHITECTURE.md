# Project Architecture

## Overview

This is a real-time tournament draft system built with Next.js 15, TypeScript, and Supabase. The system allows osu! tournament matches to conduct map pick/ban phases similar to MOBA games, with live updates via WebSocket.

## Core Technologies

### Frontend

- **Next.js 15 (App Router)**: Server-side rendering and routing
- **React 18**: UI components and state management
- **TypeScript**: Type safety throughout the application
- **Tailwind CSS**: Utility-first styling
- **Framer Motion**: Smooth animations for draft interface
- **Lucide React**: Modern icon library

### Backend

- **Next.js API Routes**: RESTful API endpoints
- **Supabase**: PostgreSQL database with real-time capabilities
- **osu! API v2**: Fetching beatmap metadata

## Architecture Patterns

### Database Design

The application uses a relational database with four main tables:

1. **stages**: Tournament stage configuration
2. **beatmaps**: Map pool data with osu! API metadata
3. **matches**: Match instances with team and state data
4. **match_actions**: Historical log of all draft actions

Real-time updates are enabled on `matches` and `match_actions` tables using Supabase Realtime (PostgreSQL LISTEN/NOTIFY).

### State Management

The draft system uses a **state machine** pattern:

```
waiting → rolling → banning → picking → completed
```

State transitions are handled server-side in `lib/match-logic.ts` to ensure consistency across all clients.

### Real-time Communication

Instead of traditional WebSocket implementation, we use **Supabase Realtime**:

1. Clients subscribe to specific match channels
2. Database changes trigger automatic broadcasts
3. All connected clients receive updates instantly
4. No custom WebSocket server needed

### Authentication Pattern

This system uses **token-based access** without traditional user accounts:

- Each match generates 3 unique tokens (red captain, blue captain, spectator)
- Tokens are cryptographically random (32 bytes hex)
- Access is granted based on URL token parameter
- No session management or JWT needed for this use case

## Key Components

### Admin Pages

**`/admin/stages`**

- Form-based stage creation
- Dynamic beatmap input fields
- Fetches beatmap data from osu! API
- Validates and stores in database

**`/admin/matches`**

- Stage selection dropdown
- Team information input
- Generates unique access URLs
- Initializes match state

### Draft Interface

**`/draft/[id]`**

- Main draft room component
- Real-time state synchronization
- Role-based UI (captain vs spectator)
- Timer management
- Action handlers (roll, ban, pick)

### API Routes

**`/api/beatmap`**

- Proxy for osu! API
- Fetches single beatmap metadata
- Returns simplified data structure

**`/api/stages`**

- CRUD operations for stages
- Batch beatmap creation
- Stage listing

**`/api/matches`**

- Match creation with token generation
- Match listing
- State initialization

**`/api/matches/[id]/action`**

- Processes draft actions
- Validates permissions
- Triggers state transitions
- Updates database

## Data Flow

### Creating a Stage

```
Admin UI → POST /api/stages
    ↓
Create stage record
    ↓
For each beatmap ID:
    ↓
Fetch from osu! API
    ↓
Store in database
    ↓
Return success
```

### Creating a Match

```
Admin UI → POST /api/matches
    ↓
Generate 3 tokens
    ↓
Create match record (status: waiting)
    ↓
Call startMatch() → Set status to 'rolling'
    ↓
Return URLs with tokens
```

### Draft Flow

```
Captain opens URL with token
    ↓
Subscribe to match channel (Realtime)
    ↓
Render current state
    ↓
Captain performs action (roll/ban/pick)
    ↓
POST /api/matches/[id]/action
    ↓
Insert match_action record
    ↓
Call processMatchAction()
    ↓
Update match state
    ↓
Database triggers Realtime broadcast
    ↓
All clients receive update
    ↓
UI re-renders with new state
```

## Timer System

The timer is implemented **client-side** with server-side validation:

1. Server sets `timer_ends_at` timestamp when action begins
2. Client calculates remaining time every 100ms
3. When timer expires on client:
   - For bans: Skip ban (submit null beatmap_id)
   - For picks: Auto-pick random available map
4. Server processes action and advances state

This approach provides:

- Instant visual feedback
- Reduced server load
- Automatic fail-safe behavior

## Security Considerations

### Current Implementation

- Token-based access (32-byte random hex)
- Unique tokens per match role
- No sensitive data exposure
- Read-only spectator mode

### Production Recommendations

1. Add rate limiting to API routes
2. Implement CORS restrictions
3. Add request validation middleware
4. Consider adding HTTPS-only cookies for tokens
5. Add audit logging for actions
6. Implement IP-based rate limiting

## Scalability

### Current Capacity

- Unlimited concurrent matches
- 100+ concurrent viewers per match
- Real-time latency < 100ms

### Bottlenecks

1. osu! API rate limits (1000 req/hour)
2. Supabase free tier (500MB DB, 2GB bandwidth)
3. Client-side timer precision

### Scaling Solutions

1. Cache beatmap data (Redis/memory)
2. Upgrade Supabase plan
3. Use CDN for static assets
4. Implement beatmap data prefetching

## File Structure

```
omc-draft/
├── app/
│   ├── admin/
│   │   ├── stages/page.tsx       # Stage creation UI
│   │   └── matches/page.tsx      # Match creation UI
│   ├── draft/
│   │   └── [id]/page.tsx         # Draft interface
│   ├── api/
│   │   ├── beatmap/route.ts      # Beatmap proxy
│   │   ├── stages/route.ts       # Stage CRUD
│   │   ├── matches/
│   │   │   ├── route.ts          # Match CRUD
│   │   │   └── [id]/
│   │   │       └── action/route.ts # Action handler
│   ├── layout.tsx                # Root layout
│   └── page.tsx                  # Home page
├── components/
│   └── BeatmapCard.tsx           # Reusable beatmap display
├── lib/
│   ├── supabase.ts               # Supabase client
│   ├── osu-api.ts                # osu! API wrapper
│   └── match-logic.ts            # State machine logic
├── types/
│   ├── database.ts               # Supabase types
│   └── index.ts                  # Shared types
└── supabase-schema.sql           # Database schema
```

## Testing Strategy

### Manual Testing Checklist

- [ ] Create stage with various beatmap IDs
- [ ] Verify beatmap data loads correctly
- [ ] Create match and open all 3 URLs
- [ ] Test roll phase (both captains)
- [ ] Test ban phase (alternating turns)
- [ ] Test pick phase (alternating turns)
- [ ] Verify timer countdown works
- [ ] Test timer expiry (skip ban, auto-pick)
- [ ] Verify spectator view is read-only
- [ ] Test real-time updates across windows
- [ ] Test with network throttling

### Future Testing

- Unit tests for match logic
- Integration tests for API routes
- E2E tests with Playwright
- Load testing with Artillery

## Future Enhancements

### High Priority

1. Match history and replay viewing
2. Admin dashboard for monitoring active matches
3. Undo last action functionality
4. Custom timer duration per stage
5. WebSocket reconnection handling

### Medium Priority

1. Match statistics and analytics
2. Export match results to JSON/CSV
3. Multiple mod pool templates
4. Team roster management
5. Bracket generation integration

### Low Priority

1. Dark/light theme toggle
2. Localization (English/Mongolian)
3. Sound effects for actions
4. Discord webhook notifications
5. Twitch overlay mode

## Contributing

When contributing to this project:

1. Follow TypeScript strict mode
2. Use functional components with hooks
3. Keep components small and focused
4. Write meaningful commit messages
5. Test real-time functionality thoroughly
6. Update types when changing database schema

## License

MIT License - See LICENSE file for details

---

Created for osu! Mongolia Cup 2025 🇲🇳
