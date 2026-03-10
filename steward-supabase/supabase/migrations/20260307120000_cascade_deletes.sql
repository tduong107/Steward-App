-- Add CASCADE DELETE to foreign keys so deleting a watch
-- automatically cleans up check_results, activities, and shared_watches.

-- 1. check_results.watch_id → watches.id
ALTER TABLE check_results
  DROP CONSTRAINT IF EXISTS check_results_watch_id_fkey,
  ADD CONSTRAINT check_results_watch_id_fkey
    FOREIGN KEY (watch_id) REFERENCES watches(id) ON DELETE CASCADE;

-- 2. activities.watch_id → watches.id (nullable FK)
ALTER TABLE activities
  DROP CONSTRAINT IF EXISTS activities_watch_id_fkey,
  ADD CONSTRAINT activities_watch_id_fkey
    FOREIGN KEY (watch_id) REFERENCES watches(id) ON DELETE CASCADE;

-- 3. shared_watches.source_watch_id → watches.id
ALTER TABLE shared_watches
  DROP CONSTRAINT IF EXISTS shared_watches_source_watch_id_fkey,
  ADD CONSTRAINT shared_watches_source_watch_id_fkey
    FOREIGN KEY (source_watch_id) REFERENCES watches(id) ON DELETE CASCADE;

-- Clean up any orphaned records where the parent watch no longer exists
DELETE FROM check_results
  WHERE watch_id NOT IN (SELECT id FROM watches);

DELETE FROM activities
  WHERE watch_id IS NOT NULL
    AND watch_id NOT IN (SELECT id FROM watches);

DELETE FROM shared_watches
  WHERE source_watch_id NOT IN (SELECT id FROM watches);
