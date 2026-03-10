-- Add phone_number to profiles for SMS notifications
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS phone_number TEXT;

-- Add index for phone number lookups
CREATE INDEX IF NOT EXISTS idx_profiles_phone ON profiles (phone_number) WHERE phone_number IS NOT NULL;
