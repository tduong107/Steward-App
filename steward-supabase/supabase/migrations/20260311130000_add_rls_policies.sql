-- =============================================
-- Row Level Security Policies
-- Ensures users can only access their own data
-- =============================================

-- 1. WATCHES table
ALTER TABLE watches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own watches"
  ON watches FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own watches"
  ON watches FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own watches"
  ON watches FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own watches"
  ON watches FOR DELETE
  USING (auth.uid() = user_id);

-- Service role bypass for edge functions (check-watch, check-all-watches)
-- Service role key automatically bypasses RLS, so no extra policy needed.

-- 2. PROFILES table
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- 3. ACTIVITIES table
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own activities"
  ON activities FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own activities"
  ON activities FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own activities"
  ON activities FOR DELETE
  USING (auth.uid() = user_id);

-- 4. CHECK_RESULTS table
ALTER TABLE check_results ENABLE ROW LEVEL SECURITY;

-- Users can view check results for their own watches
CREATE POLICY "Users can view own check results"
  ON check_results FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM watches
      WHERE watches.id = check_results.watch_id
        AND watches.user_id = auth.uid()
    )
  );

-- 5. SHARED_WATCHES table (public read for sharing, write for owners)
ALTER TABLE shared_watches ENABLE ROW LEVEL SECURITY;

-- Anyone can view shared watches (they're public by design)
CREATE POLICY "Anyone can view shared watches"
  ON shared_watches FOR SELECT
  USING (true);

-- Only the creator can insert shared watches
CREATE POLICY "Users can share own watches"
  ON shared_watches FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM watches
      WHERE watches.id = shared_watches.source_watch_id
        AND watches.user_id = auth.uid()
    )
  );
