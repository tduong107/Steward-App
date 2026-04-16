-- ============================================================
-- Comprehensive security + performance hardening
-- Fixes ALL warnings from both Security and Performance advisors
-- ============================================================

-- ─── SECURITY FIX 1: Function search_path ────────────────────
ALTER FUNCTION public.normalize_subscription_tier SET search_path = public;

-- ─── SECURITY FIX 2: Scope service-role policies correctly ───

DROP POLICY IF EXISTS "Service role can manage affiliate clicks" ON public.affiliate_clicks;
CREATE POLICY "Service role can manage affiliate clicks"
  ON public.affiliate_clicks FOR ALL
  TO service_role
  USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Service role can manage affiliate config" ON public.affiliate_config;
CREATE POLICY "Service role can manage affiliate config"
  ON public.affiliate_config FOR ALL
  TO service_role
  USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Service role can manage engagement notifications" ON public.engagement_notifications_sent;
CREATE POLICY "Service role can manage engagement notifications"
  ON public.engagement_notifications_sent FOR ALL
  TO service_role
  USING (true) WITH CHECK (true);

-- ─── SECURITY FIX 3: Scope shared_watches INSERT ─────────────
DROP POLICY IF EXISTS "Authenticated users can create shares" ON public.shared_watches;
CREATE POLICY "Authenticated users can create shares"
  ON public.shared_watches FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = shared_by_user_id);

-- ─── PERFORMANCE FIX 1: Wrap auth.uid() in (select ...) ─────

DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING ((select auth.uid()) = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING ((select auth.uid()) = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK ((select auth.uid()) = id);

DROP POLICY IF EXISTS "Users can CRUD own watches" ON public.watches;
CREATE POLICY "Users can CRUD own watches"
  ON public.watches FOR ALL
  USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can CRUD own activities" ON public.activities;
CREATE POLICY "Users can CRUD own activities"
  ON public.activities FOR ALL
  USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can view own check results" ON public.check_results;
CREATE POLICY "Users can view own check results"
  ON public.check_results FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM watches
      WHERE watches.id = check_results.watch_id
        AND watches.user_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Users can view their own engagement notifications" ON public.engagement_notifications_sent;
CREATE POLICY "Users can view their own engagement notifications"
  ON public.engagement_notifications_sent FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can view their own affiliate clicks" ON public.affiliate_clicks;
CREATE POLICY "Users can view their own affiliate clicks"
  ON public.affiliate_clicks FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = user_id);

-- ─── PERFORMANCE FIX 2: Add missing foreign key indexes ──────

CREATE INDEX IF NOT EXISTS idx_activities_user_id
  ON public.activities (user_id);

CREATE INDEX IF NOT EXISTS idx_activities_watch_id
  ON public.activities (watch_id);

CREATE INDEX IF NOT EXISTS idx_check_results_watch_id
  ON public.check_results (watch_id);

CREATE INDEX IF NOT EXISTS idx_shared_watches_source_watch_id
  ON public.shared_watches (source_watch_id);

CREATE INDEX IF NOT EXISTS idx_watch_failures_watch_id
  ON public.watch_failures (watch_id);

CREATE INDEX IF NOT EXISTS idx_watches_user_id
  ON public.watches (user_id);
