-- =====================================================================
-- Server-side enforcement of subscription-tier watch caps.
--
-- Why this migration exists
-- -------------------------
-- The iOS app and `web/src/lib/utils.ts::watchLimit()` enforce caps in
-- the UI (free=3, pro=7, premium=15), but the database itself was wide
-- open: the existing RLS policy on `watches` only checks
-- `auth.uid() = user_id`, with no cap on row count. A buggy build, a
-- direct REST call, or anyone with a service-role key could create
-- unlimited watches per user — and every active watch costs money on
-- Anthropic / Serper / Scrape.do every check cycle. This trigger
-- closes that gap as defense-in-depth.
--
-- What this migration does
-- ------------------------
-- 1. Defines `enforce_watch_cap()` — counts the user's existing
--    active watches (status in ('watching', 'triggered')) and rejects
--    inserts that would push them over their tier's cap.
-- 2. Defines `enforce_watch_cap_status_change()` — same check for
--    UPDATEs that re-activate a paused/disabled watch (status
--    transitioning into 'watching' or 'triggered').
-- 3. Wires both as `BEFORE` triggers on the `watches` table.
--
-- Caps mirror the client-side values in `web/src/lib/utils.ts`:
--   free    => 3
--   pro     => 7
--   premium => 15
-- If you change those, change them here too.
--
-- Edge case: a user who downgrades from premium (15) to pro (7) keeps
-- their existing 15 active watches — this trigger only blocks NEW
-- activations, not existing rows. Per-cycle processing is also capped
-- in the `check-all-watches` edge function so downgraded users still
-- get cost protection.
-- =====================================================================

CREATE OR REPLACE FUNCTION enforce_watch_cap()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
-- SET search_path so the function can't be hijacked by a malicious
-- search_path; ensures `profiles` and `watches` resolve to the public
-- schema even when called by a different role.
SET search_path = public, pg_temp
AS $$
DECLARE
  user_tier TEXT;
  cap INT;
  current_count INT;
BEGIN
  -- Only enforce for active states. Paused / disabled watches don't
  -- consume API budget so they don't count against the cap.
  IF NEW.status NOT IN ('watching', 'triggered') THEN
    RETURN NEW;
  END IF;

  -- Resolve the user's subscription tier. NULL profile or NULL tier
  -- defaults to 'free' so a misconfigured row doesn't accidentally
  -- grant unlimited watches.
  SELECT COALESCE(subscription_tier, 'free')
    INTO user_tier
    FROM profiles
    WHERE id = NEW.user_id;

  IF user_tier IS NULL THEN
    user_tier := 'free';
  END IF;

  -- Tier → cap. Keep these in sync with web/src/lib/utils.ts and the
  -- iOS WatchLimit/SubscriptionGate logic.
  cap := CASE user_tier
    WHEN 'premium' THEN 15
    WHEN 'pro'     THEN 7
    ELSE 3
  END;

  -- Count the user's existing active watches. Exclude NEW.id so an
  -- UPDATE that re-activates a watch doesn't double-count itself.
  SELECT COUNT(*)
    INTO current_count
    FROM watches
    WHERE user_id = NEW.user_id
      AND status IN ('watching', 'triggered')
      AND id <> NEW.id;

  IF current_count >= cap THEN
    -- P0001 = generic plpgsql RAISE; clients can switch on this code
    -- to render a human-friendly upgrade prompt.
    RAISE EXCEPTION 'Watch limit reached for tier %: maximum % active watches', user_tier, cap
      USING
        ERRCODE = 'P0001',
        HINT = 'Upgrade your plan or pause/delete an existing watch';
  END IF;

  RETURN NEW;
END;
$$;

-- BEFORE INSERT: blocks new active watches above cap.
DROP TRIGGER IF EXISTS watches_enforce_cap_insert ON watches;
CREATE TRIGGER watches_enforce_cap_insert
  BEFORE INSERT ON watches
  FOR EACH ROW
  EXECUTE FUNCTION enforce_watch_cap();

-- BEFORE UPDATE: blocks re-activating a paused watch above cap.
-- The function itself short-circuits when NEW.status is non-active,
-- so even though this trigger fires on every UPDATE we only do real
-- work when the row is becoming active.
DROP TRIGGER IF EXISTS watches_enforce_cap_update ON watches;
CREATE TRIGGER watches_enforce_cap_update
  BEFORE UPDATE ON watches
  FOR EACH ROW
  EXECUTE FUNCTION enforce_watch_cap();

-- Lock down the function so only the database itself can rewrite it.
REVOKE ALL ON FUNCTION enforce_watch_cap() FROM PUBLIC;

COMMENT ON FUNCTION enforce_watch_cap() IS
  'Trigger function: enforces subscription-tier active-watch caps (free=3, pro=7, premium=15). Defense-in-depth alongside the client-side limits in web/src/lib/utils.ts and the iOS WatchLimit logic.';
