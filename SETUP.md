# Quick Setup Guide

## Prerequisites

- Node.js 20.5 or higher
- A Supabase account
- osu! API credentials

## Step-by-Step Setup

### 1. Supabase Setup

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Wait for the project to finish setting up
3. Go to **SQL Editor** in the left sidebar
4. Click **New query**
5. Copy the entire contents of `supabase-schema.sql` from this project
6. Paste it into the SQL editor and click **Run**
7. Go to **Settings** > **API** to get your credentials:
   - Project URL (looks like: `https://xxxxx.supabase.co`)
   - Anon/Public key (starts with `eyJ...`)

### 2. osu! API Setup

1. Log into your osu! account
2. Go to [Account Settings](https://osu.ppy.sh/home/account/edit#oauth)
3. Scroll to **OAuth** section
4. Click **New OAuth Application**
5. Fill in:
   - **Application Name**: osu! Mongolia Cup Draft System
   - **Application Callback URLs**: `http://localhost:3000` (not actually used but required)
6. Click **Register Application**
7. Note down your **Client ID** and **Client Secret**

### 3. Environment Variables

1. In the project folder, copy `.env.local.example` to `.env.local`:

   ```bash
   copy .env.local.example .env.local
   ```

2. Open `.env.local` and fill in your credentials:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   OSU_CLIENT_ID=12345
   OSU_CLIENT_SECRET=abcdef123456...
   ```

### 4. Install and Run

1. Install dependencies:

   ```bash
   npm install
   ```

2. Start the development server:

   ```bash
   npm run dev
   ```

3. Open your browser to [http://localhost:3000](http://localhost:3000)

## Testing the System

### Create a Test Stage

1. Click **Create Stage**
2. Enter:
   - Stage Name: `Test Stage`
   - Best of: `9`
   - Number of Bans: `2`
3. Add some beatmap IDs (any osu! standard beatmap IDs, for example):
   - NM1: `3756088` (RADWIMPS - Sparkle)
   - NM2: `2788470` (Porter Robinson - Flicker)
   - HD1: `2567561` (The Chainsmokers - Closer)
   - DT1: `1854467` (Daft Punk - Harder Better Faster Stronger)
   - TB1: `2923641` (Imperial Circus Dead Decadence - Uta)
4. Click **Create Stage** and wait for beatmaps to load

### Create a Test Match

1. Click **Create Match**
2. Select your test stage
3. Enter:
   - Team Red Name: `Team Alpha`
   - Team Blue Name: `Team Beta`
   - Captain IDs: Any valid osu! user IDs (or just use random numbers for testing)
4. Click **Create Match**
5. You'll get 3 URLs - open them in different browser windows/tabs to test the real-time functionality

### Test the Draft

1. Open Team Red URL in one browser window
2. Open Team Blue URL in another browser window
3. Open Spectator URL in a third window (optional)
4. Both captains click **ROLL**
5. Watch the draft proceed with bans and picks!

## Troubleshooting

### "Failed to fetch beatmap data"

- Check that your osu! API credentials are correct
- Make sure the beatmap IDs you entered are valid
- Check the browser console for detailed error messages

### "Match not found" or database errors

- Verify your Supabase URL and key are correct
- Make sure you ran the entire SQL schema file
- Check the Supabase dashboard for any error logs

### Real-time updates not working

- Make sure you have a stable internet connection
- Check if Supabase Realtime is enabled for your project
- Verify the match and match_actions tables are added to the realtime publication

### Timer not working

- The timer is client-side, ensure JavaScript is enabled
- Check browser console for any errors
- Refresh the page if the timer appears stuck

## Next Steps

Once everything is working:

1. Deploy to Vercel or your preferred hosting platform
2. Update the OAuth callback URLs in osu! settings
3. Update environment variables in your production environment
4. Share the admin URLs only with tournament organizers
5. Send captain URLs directly to team captains before matches

## Need Help?

- Check the main README.md for more detailed documentation
- Review the database schema in `supabase-schema.sql`
- Inspect the browser console for error messages
- Check Supabase logs in the dashboard

Good luck with osu! Mongolia Cup 2025! 🇲🇳
