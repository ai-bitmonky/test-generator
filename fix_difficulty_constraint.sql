-- Fix difficulty constraint to use standardized levels: EASY, MEDIUM, HARD
-- Drop the old constraint and create a new one

ALTER TABLE questions
DROP CONSTRAINT IF EXISTS questions_difficulty_check;

ALTER TABLE questions
ADD CONSTRAINT questions_difficulty_check
CHECK (difficulty IN ('EASY', 'MEDIUM', 'HARD'));

-- Update any existing ADVANCED to HARD
UPDATE questions SET difficulty = 'HARD' WHERE difficulty = 'ADVANCED';

-- Verify the constraint
SELECT conname, pg_get_constraintdef(oid)
FROM pg_constraint
WHERE conrelid = 'questions'::regclass
AND conname = 'questions_difficulty_check';
