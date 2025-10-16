-- Add validation tracking columns to questions table
-- This ensures each question is validated only once

ALTER TABLE questions
ADD COLUMN IF NOT EXISTS validated_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS validation_version INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS validation_notes TEXT;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_questions_validated
ON questions(subject, validated_at)
WHERE validated_at IS NULL;

-- Add comment
COMMENT ON COLUMN questions.validated_at IS 'Timestamp when question was fully validated and corrected';
COMMENT ON COLUMN questions.validation_version IS 'Version of validation logic used (increment when logic changes)';
COMMENT ON COLUMN questions.validation_notes IS 'Notes about validation issues found and fixed';
