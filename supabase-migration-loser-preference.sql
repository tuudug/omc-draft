-- Add roll loser preference column to matches table
ALTER TABLE matches
ADD COLUMN IF NOT EXISTS roll_loser_preference TEXT;

-- Add check constraint for valid preference values
ALTER TABLE matches
ADD CONSTRAINT matches_roll_loser_preference_check
CHECK (roll_loser_preference IS NULL OR roll_loser_preference IN ('first_pick', 'second_pick', 'first_ban', 'second_ban'));
