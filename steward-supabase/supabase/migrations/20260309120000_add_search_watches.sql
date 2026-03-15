-- Add multi-source search watch support.
-- watch_mode: "url" (default, current single-URL behavior) or "search" (multi-source Serper Shopping search)
-- search_query: The product search query used for search-mode watches (e.g., "Nike Air Max 95 black size 10")

ALTER TABLE watches ADD COLUMN IF NOT EXISTS watch_mode TEXT NOT NULL DEFAULT 'url';
ALTER TABLE watches ADD COLUMN IF NOT EXISTS search_query TEXT;
