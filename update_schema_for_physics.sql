-- Update schema to support Physics questions with additional metadata
-- This adds new columns to the questions table

-- Add new columns for Physics-specific metadata
ALTER TABLE questions
ADD COLUMN IF NOT EXISTS subject VARCHAR(50) DEFAULT 'Mathematics',
ADD COLUMN IF NOT EXISTS chapter VARCHAR(255),
ADD COLUMN IF NOT EXISTS subtopic VARCHAR(255),
ADD COLUMN IF NOT EXISTS tags JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS question_type VARCHAR(100),
ADD COLUMN IF NOT EXISTS question_html TEXT,
ADD COLUMN IF NOT EXISTS strategy TEXT,
ADD COLUMN IF NOT EXISTS expert_insight TEXT,
ADD COLUMN IF NOT EXISTS key_facts TEXT;

-- Create indexes for new columns
CREATE INDEX IF NOT EXISTS idx_questions_subject ON questions(subject);
CREATE INDEX IF NOT EXISTS idx_questions_chapter ON questions(chapter);
CREATE INDEX IF NOT EXISTS idx_questions_tags ON questions USING GIN(tags);

-- Update existing questions to have subject = 'Mathematics'
UPDATE questions SET subject = 'Mathematics' WHERE subject IS NULL;

-- Create view for question statistics including subject
DROP VIEW IF EXISTS question_stats;
CREATE OR REPLACE VIEW question_stats AS
SELECT
  subject,
  COALESCE(chapter, topic) as chapter_or_topic,
  topic,
  difficulty,
  COUNT(*) as question_count
FROM questions
GROUP BY subject, COALESCE(chapter, topic), topic, difficulty
ORDER BY subject, chapter_or_topic, topic, difficulty;

-- Grant permissions
GRANT SELECT ON question_stats TO authenticated;

-- Show current schema
\d questions
