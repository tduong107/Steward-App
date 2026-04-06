-- Add response_mode column to watches table
-- Values: 'notify' (default), 'quickLink', 'stewardActs'
ALTER TABLE watches
    ADD COLUMN IF NOT EXISTS response_mode TEXT NOT NULL DEFAULT 'notify';

-- Backfill: watches with auto_act enabled should be 'stewardActs'
UPDATE watches SET response_mode = 'stewardActs' WHERE auto_act = true;

-- Backfill: actionable watches without auto_act should be 'quickLink'
UPDATE watches SET response_mode = 'quickLink'
    WHERE auto_act = false
    AND action_type IN ('cart', 'form', 'book', 'price');
