-- Auto-act fields: allow watches to automatically execute actions when triggered
ALTER TABLE watches ADD COLUMN IF NOT EXISTS auto_act BOOLEAN DEFAULT false;
ALTER TABLE watches ADD COLUMN IF NOT EXISTS spending_limit NUMERIC;

-- Track server-side action execution
ALTER TABLE watches ADD COLUMN IF NOT EXISTS action_executed BOOLEAN DEFAULT false;
ALTER TABLE watches ADD COLUMN IF NOT EXISTS action_executed_at TIMESTAMPTZ;
