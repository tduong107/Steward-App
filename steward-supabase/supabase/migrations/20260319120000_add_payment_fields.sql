-- User profile spending preferences (for future auto-purchase feature)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS spending_limit NUMERIC;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS auto_act_default BOOLEAN DEFAULT false;
