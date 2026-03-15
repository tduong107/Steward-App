-- Track consecutive check failures and surface broken watches to users
ALTER TABLE watches ADD COLUMN IF NOT EXISTS consecutive_failures INTEGER NOT NULL DEFAULT 0;
ALTER TABLE watches ADD COLUMN IF NOT EXISTS last_error TEXT;
ALTER TABLE watches ADD COLUMN IF NOT EXISTS needs_attention BOOLEAN NOT NULL DEFAULT false;
