# Troubleshooting Guide

## Common Issues and Solutions

### Installation Issues

#### `npm install` fails with EBADENGINE warnings

**Symptom:**

```
npm WARN EBADENGINE Unsupported engine
```

**Solution:**
These are just warnings, not errors. The project will still work. To eliminate warnings, update Node.js to version 21.1.0 or higher. The current version (20.5.0) is still functional.

#### Module not found errors after installation

**Solution:**

```bash
rm -rf node_modules package-lock.json
npm install
```

### Database Issues

#### "Failed to create stage" or "Failed to create match"

**Check:**

1. Verify `.env.local` has correct Supabase credentials
2. Confirm you ran the entire `supabase-schema.sql` file
3. Check Supabase logs in the dashboard:
   - Go to your project → Logs → Postgres Logs
   - Look for any error messages

**Common causes:**

- Incorrect `NEXT_PUBLIC_SUPABASE_URL` format (should include `https://`)
- Wrong API key (make sure you're using the `anon/public` key, not the `service_role` key)
- SQL schema not fully executed

#### Tables not found

**Solution:**

1. Go to Supabase dashboard → SQL Editor
2. Run this to check if tables exist:

```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public';
```

3. If tables are missing, re-run `supabase-schema.sql`

#### Real-time updates not working

**Check:**

1. Verify Realtime is enabled for your project
2. Confirm tables are added to replication:

```sql
-- Run this in SQL Editor
SELECT * FROM pg_publication_tables WHERE pubname = 'supabase_realtime';
```

3. Should show `matches` and `match_actions`

**Fix:**
If tables are missing from publication:

```sql
ALTER PUBLICATION supabase_realtime ADD TABLE matches;
ALTER PUBLICATION supabase_realtime ADD TABLE match_actions;
```

### osu! API Issues

#### "Failed to fetch beatmap data"

**Check:**

1. Verify `OSU_CLIENT_ID` and `OSU_CLIENT_SECRET` in `.env.local`
2. Ensure beatmap IDs are valid (must be standard mode beatmaps)
3. Check if you hit the rate limit (1000 requests/hour)

**Test your credentials:**

```bash
# In PowerShell
$body = @{
    client_id = "YOUR_CLIENT_ID"
    client_secret = "YOUR_CLIENT_SECRET"
    grant_type = "client_credentials"
    scope = "public"
} | ConvertTo-Json

Invoke-RestMethod -Uri "https://osu.ppy.sh/oauth/token" -Method POST -Body $body -ContentType "application/json"
```

If this returns an error, your credentials are incorrect.

#### Invalid beatmap IDs

**Symptom:**
Some beatmaps don't load, others do

**Solution:**

- Make sure you're using **beatmap IDs**, not beatmapset IDs
- Beatmap IDs are specific to a difficulty
- Example: `3756088` is a beatmap ID, `1619504` is a beatmapset ID
- You can find beatmap IDs in the URL when viewing a specific difficulty on osu.ppy.sh

### Draft Interface Issues

#### "Match not found" error

**Causes:**

1. Invalid match ID in URL
2. Match was deleted from database
3. Token doesn't match any token in database

**Check:**

```sql
-- Run in Supabase SQL Editor
SELECT id, team_red_name, team_blue_name, status
FROM matches
WHERE id = 'YOUR_MATCH_ID';
```

#### Timer not counting down

**Check:**

1. Open browser DevTools (F12) → Console
2. Look for JavaScript errors
3. Verify `timer_ends_at` is set in database

**Debug:**

```sql
SELECT id, status, current_team, timer_ends_at
FROM matches
WHERE id = 'YOUR_MATCH_ID';
```

If `timer_ends_at` is null but status is 'banning' or 'picking', there's a state issue.

#### Captains can't perform actions

**Check:**

1. Verify the captain is using the correct URL with their token
2. Ensure it's their turn (`current_team` matches their team)
3. Check match status is appropriate for the action

**Debug in console:**

```javascript
// In browser console on draft page
console.log("My team:", myTeam);
console.log("Current team:", match.current_team);
console.log("Is captain:", isCaptain);
console.log("Status:", match.status);
```

#### Actions not appearing for other users

**Check:**

1. Verify all users are on the same match ID
2. Check browser console for WebSocket errors
3. Test internet connection stability

**Force refresh:**
Hard reload the page (Ctrl+Shift+R / Cmd+Shift+R)

### Visual/UI Issues

#### Images not loading (beatmap covers)

**Cause:**
osu! CDN or network issues

**Solution:**

1. Check if you can access images directly: `https://assets.ppy.sh/beatmaps/...`
2. Try a different network
3. Check browser console for CORS errors

#### Animations stuttering

**Solution:**

1. Close other browser tabs
2. Disable browser extensions
3. Check if hardware acceleration is enabled in browser settings

#### Layout broken on mobile

**Note:**
The current design is optimized for desktop/tablet. Mobile support can be improved by:

1. Adjusting grid columns in Tailwind classes
2. Making text sizes responsive
3. Collapsing sidebars

### Development Issues

#### Hot reload not working

**Solution:**

```bash
# Stop dev server (Ctrl+C)
# Delete .next folder
rm -rf .next
# Restart
npm run dev
```

#### TypeScript errors about Supabase types

**Note:**
Many TypeScript errors related to Supabase are due to generic type inference. These are false positives and won't affect runtime. The code uses `as` assertions and `as any` in strategic places.

**To suppress:**
Add `// @ts-ignore` above the line if needed for development

#### Port 3000 already in use

**Solution:**

```bash
# Kill process on port 3000 (PowerShell)
Get-Process -Id (Get-NetTCPConnection -LocalPort 3000).OwningProcess | Stop-Process
```

Or use a different port:

```bash
npm run dev -- -p 3001
```

### Production/Deployment Issues

#### Environment variables not working on Vercel

**Check:**

1. Go to Vercel project settings → Environment Variables
2. Add all variables from `.env.local`
3. Make sure `NEXT_PUBLIC_` prefix is used for client-side vars
4. Redeploy after adding variables

#### Supabase connection fails in production

**Check:**

1. Verify environment variables are set correctly
2. Check Supabase project isn't paused (free tier)
3. Verify API keys haven't expired
4. Check Supabase status page

#### "Failed to fetch" errors in production

**Solution:**
Add your deployment domain to Supabase allowed origins:

1. Supabase dashboard → Settings → API
2. Add your domain to "Site URL" and "Redirect URLs"

## Performance Issues

### Slow beatmap loading during stage creation

**Cause:**
Sequential API calls to osu!

**Solution:**
This is expected. The system fetches each beatmap one by one. For 20+ beatmaps, expect 10-30 seconds.

**Future improvement:**
Implement parallel fetching with Promise.all()

### Draft interface laggy with many beatmaps

**Solution:**

1. Use React DevTools Profiler to identify bottlenecks
2. Consider virtualizing beatmap grid for 50+ maps
3. Reduce animation complexity on lower-end devices

### Database query slow

**Check:**
Run EXPLAIN ANALYZE in Supabase:

```sql
EXPLAIN ANALYZE
SELECT * FROM beatmaps WHERE stage_id = 'YOUR_STAGE_ID';
```

Indexes are already created, but verify:

```sql
SELECT * FROM pg_indexes WHERE tablename IN ('beatmaps', 'matches', 'match_actions');
```

## Getting Help

### Check these first:

1. Browser console (F12 → Console)
2. Supabase logs (Dashboard → Logs)
3. Network tab (F12 → Network)
4. This troubleshooting guide

### Still stuck?

Create a detailed issue report with:

- What you were trying to do
- What happened instead
- Error messages (screenshots)
- Browser and OS version
- Steps to reproduce
- Relevant logs from Supabase

### Useful debugging commands:

```sql
-- Check all matches
SELECT id, team_red_name, team_blue_name, status, current_team
FROM matches
ORDER BY created_at DESC;

-- Check match actions
SELECT ma.*, m.team_red_name, m.team_blue_name
FROM match_actions ma
JOIN matches m ON ma.match_id = m.id
ORDER BY ma.created_at DESC
LIMIT 20;

-- Check beatmap count per stage
SELECT s.name, COUNT(b.id) as beatmap_count
FROM stages s
LEFT JOIN beatmaps b ON s.id = b.stage_id
GROUP BY s.id, s.name;
```

## Emergency Reset

If everything is broken and you want to start fresh:

```sql
-- WARNING: This deletes ALL data
TRUNCATE TABLE match_actions CASCADE;
TRUNCATE TABLE matches CASCADE;
TRUNCATE TABLE beatmaps CASCADE;
TRUNCATE TABLE stages CASCADE;
```

Then recreate test data using the admin interface.

---

**Remember:** Most issues are configuration-related. Double-check your `.env.local` file first!
