-- مواد واجب الحصة + فيديو شرح يظهر بعد تسليم الطالب
ALTER TABLE "Lesson" ADD COLUMN IF NOT EXISTS homework_materials TEXT;
ALTER TABLE "Lesson" ADD COLUMN IF NOT EXISTS homework_explanation_video_url TEXT;
