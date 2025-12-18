-- 1) Add the new column (temporarily nullable)
ALTER TABLE reviews
ADD COLUMN review_at timestamp;

-- 2) Fill all existing reviews with the fixed time
--    18/12/2025 22:30 (adjust timezone if you need)
UPDATE reviews
SET review_at = TIMESTAMP '2025-12-18 22:30:00'
WHERE review_at IS NULL;

-- 3) Make it NOT NULL and give new reviews a default of now()
ALTER TABLE reviews
ALTER COLUMN review_at SET NOT NULL,
ALTER COLUMN review_at SET DEFAULT now();

-- (optional but useful) index for “latest reviews” queries
CREATE INDEX idx_reviews_review_at ON reviews (review_at DESC);