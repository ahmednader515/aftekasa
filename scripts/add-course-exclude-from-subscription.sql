-- Courses that should never be covered by platform subscriptions (must be purchased individually)
ALTER TABLE "Course" ADD COLUMN IF NOT EXISTS exclude_from_subscription BOOLEAN NOT NULL DEFAULT false;
