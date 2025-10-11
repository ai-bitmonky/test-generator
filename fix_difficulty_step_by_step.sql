-- Fix difficulty constraint - Step by Step
-- First update existing data, then change constraint

-- Step 1: Check what difficulty values currently exist
SELECT DISTINCT difficulty, COUNT(*)
FROM questions
GROUP BY difficulty;

-- Step 2: Update any ADVANCED to HARD first (before changing constraint)
UPDATE questions
SET difficulty = 'HARD'
WHERE difficulty = 'ADVANCED';

-- Step 3: Verify the update worked
SELECT DISTINCT difficulty, COUNT(*)
FROM questions
GROUP BY difficulty;

-- Step 4: Now drop the old constraint
ALTER TABLE questions
DROP CONSTRAINT IF EXISTS questions_difficulty_check;

-- Step 5: Add new constraint with EASY, MEDIUM, HARD
ALTER TABLE questions
ADD CONSTRAINT questions_difficulty_check
CHECK (difficulty IN ('EASY', 'MEDIUM', 'HARD'));

-- Step 6: Verify the constraint was created
SELECT conname, pg_get_constraintdef(oid)
FROM pg_constraint
WHERE conrelid = 'questions'::regclass
AND conname = 'questions_difficulty_check';

-- Step 7: Final check - all difficulty values should be valid
SELECT difficulty, COUNT(*)
FROM questions
GROUP BY difficulty
ORDER BY difficulty;
