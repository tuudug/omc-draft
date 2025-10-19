-- osu! Mongolia Cup 2025 - Database Schema
-- Run this entire file in your Supabase SQL Editor

-- Create stages table
-- Stores tournament stages (e.g., Group Stage, Semifinals)
CREATE TABLE stages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,                    -- Stage name (e.g., "Group Stage")
    best_of INTEGER NOT NULL,              -- Best of X (odd numbers: 9, 11, 13)
    num_bans INTEGER NOT NULL,             -- Number of bans per team
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create beatmaps table
-- Stores beatmap data fetched from osu! API
CREATE TABLE beatmaps (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    beatmap_id BIGINT NOT NULL,            -- osu! beatmap ID
    stage_id UUID NOT NULL REFERENCES stages(id) ON DELETE CASCADE,
    mod_pool TEXT NOT NULL CHECK (mod_pool IN ('NM', 'HD', 'HR', 'FM', 'DT', 'TB')),
    mod_index INTEGER NOT NULL,            -- Position in mod pool (NM1, NM2, etc.)
    title TEXT NOT NULL,
    artist TEXT NOT NULL,
    difficulty_name TEXT NOT NULL,
    star_rating DECIMAL NOT NULL,
    bpm DECIMAL NOT NULL,
    length INTEGER NOT NULL,               -- Duration in seconds
    cs DECIMAL NOT NULL,                   -- Circle Size
    ar DECIMAL NOT NULL,                   -- Approach Rate
    od DECIMAL NOT NULL,                   -- Overall Difficulty
    hp DECIMAL NOT NULL,                   -- HP Drain
    cover_url TEXT NOT NULL,               -- Beatmap cover image URL
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(stage_id, mod_pool, mod_index) -- Each position in a stage is unique
);

-- Create matches table
-- Stores match instances with team information and draft state
CREATE TABLE matches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    stage_id UUID NOT NULL REFERENCES stages(id) ON DELETE CASCADE,
    team_red_name TEXT NOT NULL,
    team_blue_name TEXT NOT NULL,
    team_red_captain_id BIGINT NOT NULL,   -- osu! user ID
    team_blue_captain_id BIGINT NOT NULL,  -- osu! user ID
    team_red_captain_token TEXT NOT NULL UNIQUE,  -- Secret URL token for red captain
    team_blue_captain_token TEXT NOT NULL UNIQUE, -- Secret URL token for blue captain
    spectator_token TEXT NOT NULL UNIQUE,         -- Secret URL token for spectators
    roll_winner TEXT CHECK (roll_winner IN ('red', 'blue')),
    team_red_roll INTEGER,                 -- Roll result (1-100)
    team_blue_roll INTEGER,                -- Roll result (1-100)
    status TEXT NOT NULL DEFAULT 'waiting' CHECK (status IN ('waiting', 'rolling', 'banning', 'picking', 'completed')),
    current_action TEXT,                   -- Description of current action
    current_team TEXT CHECK (current_team IN ('red', 'blue')), -- Whose turn it is
    timer_ends_at TIMESTAMP WITH TIME ZONE, -- When current action timer expires
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create match_actions table
-- Records all draft actions (rolls, bans, picks) in order
CREATE TABLE match_actions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    match_id UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
    team TEXT NOT NULL CHECK (team IN ('red', 'blue')),
    action_type TEXT NOT NULL CHECK (action_type IN ('ban', 'pick', 'roll')),
    beatmap_id UUID REFERENCES beatmaps(id), -- NULL for rolls
    order_index INTEGER NOT NULL,          -- Sequence order of actions
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_beatmaps_stage_id ON beatmaps(stage_id);
CREATE INDEX idx_matches_stage_id ON matches(stage_id);
CREATE INDEX idx_match_actions_match_id ON match_actions(match_id);

-- Enable Row Level Security
ALTER TABLE stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE beatmaps ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE match_actions ENABLE ROW LEVEL SECURITY;

-- Create policies (allow all for now since we're not using auth)
CREATE POLICY "Allow all access to stages" ON stages FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to beatmaps" ON beatmaps FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to matches" ON matches FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to match_actions" ON match_actions FOR ALL USING (true) WITH CHECK (true);

-- Enable realtime for matches and match_actions
ALTER PUBLICATION supabase_realtime ADD TABLE matches;
ALTER PUBLICATION supabase_realtime ADD TABLE match_actions;
