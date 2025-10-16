-- Add exam_level column to questions table
-- This column stores whether the question is for JEE Mains or JEE Advanced

ALTER TABLE questions
ADD COLUMN IF NOT EXISTS exam_level TEXT
CHECK (exam_level IN ('JEE Mains', 'JEE Advanced', NULL));

-- Add comment to document the column
COMMENT ON COLUMN questions.exam_level IS 'Exam level classification: JEE Mains or JEE Advanced';

-- Create index for faster filtering
CREATE INDEX IF NOT EXISTS idx_questions_exam_level ON questions(exam_level);

-- Update the questions_audit trigger to track this new field
-- The trigger already captures all columns via to_jsonb(), so no changes needed
