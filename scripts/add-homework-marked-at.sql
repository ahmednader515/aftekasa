-- Mark homework submissions as reviewed by teacher/staff
ALTER TABLE "HomeworkSubmission" ADD COLUMN IF NOT EXISTS marked_at TIMESTAMPTZ;
