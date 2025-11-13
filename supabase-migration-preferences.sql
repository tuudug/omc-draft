-- Migration: Add preference system and team customization
-- Run this in your Supabase SQL Editor

-- First, drop the existing status check constraint
ALTER TABLE matches DROP CONSTRAINT IF EXISTS matches_status_check;

-- Add new status constraint including preference_selection
ALTER TABLE matches
ADD CONSTRAINT matches_status_check
CHECK (status IN ('waiting', 'rolling', 'preference_selection', 'banning', 'picking', 'completed'));

-- Drop existing action_type constraint
ALTER TABLE match_actions DROP CONSTRAINT IF EXISTS match_actions_action_type_check;

-- Add new action_type constraint including preference
ALTER TABLE match_actions
ADD CONSTRAINT match_actions_action_type_check
CHECK (action_type IN ('ban', 'pick', 'roll', 'preference'));

-- Add preference and team customization columns to matches table
ALTER TABLE matches
ADD COLUMN IF NOT EXISTS team_red_color TEXT DEFAULT '#EF4444',
ADD COLUMN IF NOT EXISTS team_blue_color TEXT DEFAULT '#3B82F6',
ADD COLUMN IF NOT EXISTS team_red_logo_url TEXT,
ADD COLUMN IF NOT EXISTS team_blue_logo_url TEXT,
ADD COLUMN IF NOT EXISTS roll_winner_preference TEXT CHECK (roll_winner_preference IN ('first_pick', 'second_pick', 'first_ban', 'second_ban')),
ADD COLUMN IF NOT EXISTS tournament_name TEXT DEFAULT 'osu! Mongolia Cup 2025',
ADD COLUMN IF NOT EXISTS tournament_logo_url TEXT;

-- Add metadata to match_actions for better history tracking
ALTER TABLE match_actions
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';

-- Create a view for draft summary/export
CREATE OR REPLACE VIEW draft_summary AS
SELECT
    m.id as match_id,
    m.team_red_name,
    m.team_blue_name,
    m.team_red_color,
    m.team_blue_color,
    m.team_red_roll,
    m.team_blue_roll,
    m.roll_winner,
    m.roll_winner_preference,
    m.status,
    s.name as stage_name,
    s.best_of,
    s.num_bans,
    COUNT(DISTINCT CASE WHEN ma.action_type = 'ban' THEN ma.id END) as total_bans,
    COUNT(DISTINCT CASE WHEN ma.action_type = 'pick' THEN ma.id END) as total_picks,
    json_agg(
        json_build_object(
            'order', ma.order_index,
            'team', ma.team,
            'action', ma.action_type,
            'beatmap_id', ma.beatmap_id,
            'timestamp', ma.created_at
        ) ORDER BY ma.order_index
    ) FILTER (WHERE ma.id IS NOT NULL) as actions
FROM matches m
JOIN stages s ON m.stage_id = s.id
LEFT JOIN match_actions ma ON m.id = ma.match_id
GROUP BY m.id, s.name, s.best_of, s.num_bans;

-- Add comment for documentation
COMMENT ON COLUMN matches.roll_winner_preference IS 'Winner''s choice: first_pick, second_pick, first_ban, or second_ban';
COMMENT ON COLUMN matches.team_red_color IS 'Hex color code for red team (default #EF4444)';
COMMENT ON COLUMN matches.team_blue_color IS 'Hex color code for blue team (default #3B82F6)';
COMMENT ON VIEW draft_summary IS 'Complete draft summary for export and replay functionality';
