-- Fix Row Level Security for tests table

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own tests" ON tests;
DROP POLICY IF EXISTS "Users can insert their own tests" ON tests;

-- Recreate policies with correct logic
CREATE POLICY "Users can view their own tests"
  ON tests FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own tests"
  ON tests FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Verify policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd
FROM pg_policies
WHERE tablename = 'tests';
