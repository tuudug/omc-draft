# osu! Mongolia Cup 2025 - Draft System

A real-time map pick and ban draft system for osu! tournaments, inspired by MOBA game draft phases.

## Features

- **Stage Management**: Create tournament stages with custom map pools and beatmap data fetched from osu! API
- **Match Creation**: Generate unique links for team captains and spectators
- **Real-time Draft**: WebSocket-powered live draft with automatic state management
- **Roll System**: Random number roll (1-100) to determine first ban/pick
- **Ban Phase**: Captains ban maps with 60-second timer per ban
- **Pick Phase**: Captains pick maps with auto-random pick on timeout
- **Spectator Mode**: Anyone can watch the draft process live
- **Responsive UI**: Beautiful gradient design with Framer Motion animations

## Tech Stack

- **Next.js 15** - React framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Framer Motion** - Animations
- **Supabase** - Real-time database and WebSocket
- **Lucide React** - Icon library
- **osu! API v2** - Beatmap data

## Setup Instructions

### 1. Clone and Install

```bash
npm install
```

### 2. Set up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to SQL Editor and run the contents of `supabase-schema.sql`
3. Get your project URL and anon key from Settings > API

### 3. Set up osu! API

1. Go to [osu.ppy.sh/home/account/edit](https://osu.ppy.sh/home/account/edit#oauth)
2. Create a new OAuth Application
3. Note your Client ID and Client Secret

### 4. Configure Environment Variables

Copy `.env.local.example` to `.env.local` and fill in your credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
OSU_CLIENT_ID=your_osu_client_id
OSU_CLIENT_SECRET=your_osu_client_secret
ADMIN_PASSWORD=your_secure_password_here
```

**Important**: Set a strong password for `ADMIN_PASSWORD` to protect the admin panel.

### 5. Run Development Server

```bash
npm run dev
```

Visit `http://localhost:3000` to access the application.

## Usage

### Admin Authentication

The admin panel is password-protected. See **ADMIN_AUTH.md** for detailed setup.

1. Set `ADMIN_PASSWORD` in `.env.local`
2. Visit `/admin/login` and enter your password
3. Access admin dashboard to create stages and matches

### Creating a Stage

1. Click "Create Stage" on the home page
2. Fill in stage details:
   - Stage name (e.g., "Group Stage")
   - Best of (odd numbers: 9, 11, 13, etc.)
   - Number of bans
3. Add beatmap IDs for each mod pool (NM, HD, HR, FM, DT, TB)
4. The system will automatically fetch beatmap data from osu! API

### Creating a Match

1. Click "Create Match" on the home page
2. Select a stage
3. Enter team names and captain osu! IDs
4. Generate match links
5. Send captain links to respective captains
6. Share spectator link for viewers

### Draft Process

1. **Roll Phase**: Both captains click "ROLL" to get a random number (1-100)
2. **Winner Determination**: Higher roll wins, winner bans and picks first
3. **Ban Phase**: Teams alternate banning maps based on the configured number of bans
4. **Pick Phase**: Teams alternate picking maps until all picks are made (Best of X - 1)
5. **Completion**: Final map order is displayed for the match

### Timers

- Default timer: 60 seconds per action
- Ban timeout: Ban is skipped (empty ban slot)
- Pick timeout: Random available map is auto-picked

## Project Structure

```
├── app/
│   ├── admin/
│   │   ├── stages/          # Create stages
│   │   └── matches/         # Create matches
│   ├── draft/[id]/          # Draft interface
│   └── api/
│       ├── beatmap/         # Fetch single beatmap
│       ├── stages/          # Stage CRUD
│       ├── matches/         # Match CRUD
│       └── matches/[id]/action/  # Perform draft actions
├── lib/
│   ├── supabase.ts          # Supabase client
│   └── osu-api.ts           # osu! API integration
├── types/
│   ├── database.ts          # Database types
│   └── index.ts             # Shared types
└── supabase-schema.sql      # Database schema
```

## Database Schema

- **stages**: Tournament stages with configuration
- **beatmaps**: Beatmap data with mod pool assignments
- **matches**: Match instances with team information
- **match_actions**: Draft actions (rolls, bans, picks)

## Contributing

This project was created for osu! Mongolia Cup 2025. Feel free to adapt it for your own tournaments!

## License

MIT

## Credits

Created for osu! Mongolia Cup 2025 🇲🇳
