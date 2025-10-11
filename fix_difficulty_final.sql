-- Final fix for difficulty constraint
-- This handles all cases: EASY, MEDIUM, HARD, ADVANCED

-- Step 1: First, drop the constraint entirely
ALTER TABLE questions
DROP CONSTRAINT IF EXISTS questions_difficulty_check;

-- Step 2: Now update any ADVANCED to HARD (no constraint blocking)
UPDATE questions
SET difficulty = 'HARD'
WHERE difficulty = 'ADVANCED';

-- Step 3: Check what we have now
SELECT difficulty, COUNT(*) as count
FROM questions
GROUP BY difficulty
ORDER BY difficulty;

-- Step 4: Add the new constraint that allows EASY, MEDIUM, HARD
ALTER TABLE questions
ADD CONSTRAINT questions_difficulty_check
CHECK (difficulty IN ('EASY', 'MEDIUM', 'HARD'));

-- Step 5: Verify everything worked
SELECT
    conname as constraint_name,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint
WHERE conrelid = 'questions'::regclass
AND conname = 'questions_difficulty_check';

-- Step 6: Final check - show all difficulty values
SELECT difficulty, COUNT(*) as count
FROM questions
GROUP BY difficulty
ORDER BY
    CASE difficulty
        WHEN 'EASY' THEN 1
        WHEN 'MEDIUM' THEN 2
        WHEN 'HARD' THEN 3
        ELSE 4
    END;
