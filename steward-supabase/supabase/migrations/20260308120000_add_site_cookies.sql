-- Add cookie storage columns for auth-walled site watching
-- site_cookies: JSON-serialized array of cookies captured from the user's browser session
-- cookie_domain: The domain the cookies belong to (e.g., "resy.com")
-- cookie_status: NULL (no cookies), 'active' (cookies are valid), 'expired' (cookies need refresh)

ALTER TABLE watches ADD COLUMN IF NOT EXISTS site_cookies TEXT;
ALTER TABLE watches ADD COLUMN IF NOT EXISTS cookie_domain TEXT;
ALTER TABLE watches ADD COLUMN IF NOT EXISTS cookie_status TEXT;
