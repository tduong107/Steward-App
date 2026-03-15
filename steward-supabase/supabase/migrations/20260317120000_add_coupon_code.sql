-- Add coupon_code column for storing detected promo codes on triggered watches
ALTER TABLE watches ADD COLUMN IF NOT EXISTS coupon_code TEXT;
