-- Delete all legacy Mathematics questions with null chapter
-- These are the 142 old questions that should have been replaced during migration

-- First, let's see what we're about to delete
SELECT
  'Before deletion' as status,
  COUNT(*) as count,
  COUNT(*) FILTER (WHERE chapter IS NULL) as null_chapter_count
FROM questions
WHERE subject = 'Mathematics';

-- Delete the legacy questions
DELETE FROM questions
WHERE subject = 'Mathematics'
AND chapter IS NULL;

-- Verify the deletion
SELECT
  'After deletion' as status,
  COUNT(*) as count,
  COUNT(*) FILTER (WHERE chapter IS NULL) as null_chapter_count
FROM questions
WHERE subject = 'Mathematics';

-- Show updated statistics by chapter
SELECT
  subject,
  chapter,
  COUNT(*) as question_count
FROM questions
WHERE subject = 'Mathematics'
GROUP BY subject, chapter
ORDER BY question_count DESC;

-- Show overall statistics
SELECT
  subject,
  COUNT(*) as total_questions
FROM questions
GROUP BY subject
ORDER BY subject;
