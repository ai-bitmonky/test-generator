-- Re-enable RLS on questions table after migration
-- Run this AFTER migration is complete
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;

-- Verify the existing policies are still there
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'questions';
