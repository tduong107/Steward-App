-- Remove duplicate watches: keep the oldest, delete newer dupes
-- Only considers active watches (not deleted ones)
DELETE FROM watches w1
USING watches w2
WHERE w1.user_id = w2.user_id
  AND w1.url = w2.url
  AND w1.status != 'deleted'
  AND w2.status != 'deleted'
  AND w1.id != w2.id
  AND (w1.created_at > w2.created_at OR (w1.created_at = w2.created_at AND w1.id > w2.id));

-- Add partial unique index on (user_id, url) for non-deleted watches
-- This prevents duplicate watches at the database level
CREATE UNIQUE INDEX IF NOT EXISTS idx_watches_user_url_unique
  ON watches (user_id, url)
  WHERE status != 'deleted';
