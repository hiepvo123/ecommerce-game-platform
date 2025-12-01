-- Migration: Add Full-Text Search Indexes for Games
-- Purpose: Improve search performance using PostgreSQL GIN indexes
-- Run this migration to optimize game search queries

-- Create GIN index on games.name for full-text search
-- This index will speed up searches on game names
CREATE INDEX IF NOT EXISTS idx_games_name_fts 
ON games USING GIN (to_tsvector('english', name));

-- Create GIN index on game_descriptions.detailed_description for full-text search
-- This index will speed up searches in game descriptions
CREATE INDEX IF NOT EXISTS idx_game_descriptions_description_fts 
ON game_descriptions USING GIN (to_tsvector('english', COALESCE(detailed_description, '')));

-- Note: The query uses a JOIN with game_descriptions, so PostgreSQL
-- will automatically use both indexes (idx_games_name_fts and 
-- idx_game_descriptions_description_fts) when executing the search query.
-- No composite index needed - the query optimizer handles this efficiently.

-- Verify indexes were created
-- SELECT indexname, indexdef 
-- FROM pg_indexes 
-- WHERE tablename IN ('games', 'game_descriptions') 
-- AND indexname LIKE '%fts%';

