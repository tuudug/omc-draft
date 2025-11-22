-- Migration: Refactor for osu! Mongolia Cup 2025 MOBA Draft
-- Run this in your Supabase SQL Editor

-- 1. Update stages table
ALTER TABLE stages
ADD COLUMN IF NOT EXISTS timer_duration INTEGER DEFAULT 120, -- Seconds
ADD COLUMN IF NOT EXISTS draft_pattern JSONB DEFAULT '[{"action": "ban", "team": 1}, {"action": "ban", "team": 2}, {"action": "pick", "team": 1}, {"action": "pick", "team": 2}]'; -- Array of action objects

-- 2. Update matches table
ALTER TABLE matches
ADD COLUMN IF NOT EXISTS admin_token TEXT UNIQUE;

-- 3. Ensure all necessary columns exist (from previous migrations just in case)
ALTER TABLE matches
ADD COLUMN IF NOT EXISTS team_red_color TEXT DEFAULT '#EF4444',
ADD COLUMN IF NOT EXISTS team_blue_color TEXT DEFAULT '#3B82F6',
ADD COLUMN IF NOT EXISTS team_red_logo_url TEXT,
ADD COLUMN IF NOT EXISTS team_blue_logo_url TEXT,
ADD COLUMN IF NOT EXISTS roll_winner_preference TEXT CHECK (roll_winner_preference IN ('first_pick', 'second_pick', 'first_ban', 'second_ban')),
ADD COLUMN IF NOT EXISTS roll_loser_preference TEXT CHECK (roll_loser_preference IN ('first_pick', 'second_pick', 'first_ban', 'second_ban')),
ADD COLUMN IF NOT EXISTS tournament_name TEXT DEFAULT 'osu! Mongolia Cup 2025',
ADD COLUMN IF NOT EXISTS tournament_logo_url TEXT;

-- 4. Update status check constraint if needed (dropping and re-adding is safest)
ALTER TABLE matches DROP CONSTRAINT IF EXISTS matches_status_check;
ALTER TABLE matches
ADD CONSTRAINT matches_status_check
CHECK (status IN ('waiting', 'rolling', 'preference_selection', 'banning', 'picking', 'completed', 'paused')); -- Added 'paused'

-- 5. Update match_actions action_type check
ALTER TABLE match_actions DROP CONSTRAINT IF EXISTS match_actions_action_type_check;
ALTER TABLE match_actions
ADD CONSTRAINT match_actions_action_type_check
CHECK (action_type IN ('ban', 'pick', 'roll', 'preference'));

-- 6. Add paused_at and paused_by fields for match pausing functionality
ALTER TABLE matches
ADD COLUMN IF NOT EXISTS paused_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS paused_remaining_seconds INTEGER;

-- 7. Add draft_state to matches to store current progression explicitly if needed (redundant with match_actions but faster)
ALTER TABLE matches
ADD COLUMN IF NOT EXISTS current_pick_number INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS current_ban_number INTEGER DEFAULT 0;

