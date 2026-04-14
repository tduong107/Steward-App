-- Add SMS consent audit trail to profiles (TCPA / A2P 10DLC)
--
-- Records when a user affirmatively opted in to receive SMS alerts via the
-- signup-screen consent checkbox. The exact disclosure text the user agreed
-- to is also recorded on the auth.users row via user_metadata.sms_consent_text
-- (set during signUp), and mirrored here by the app after OTP verification.
--
-- This column is nullable: users who signed up before this migration, or who
-- signed up via OAuth (Apple/Google) without providing a phone number, will
-- have NULL here and must not receive SMS alerts.

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS sms_consent_at TIMESTAMPTZ;

COMMENT ON COLUMN profiles.sms_consent_at IS
  'Timestamp of the user''s affirmative SMS opt-in. NULL = no consent on file, do not send alert SMS. Required for TCPA / A2P 10DLC compliance.';
