-- Add policy to allow inserting questions (for migration)
-- This allows the anon key to insert questions during migration

CREATE POLICY "Allow anon to insert questions"
  ON questions FOR INSERT
  TO anon
  WITH CHECK (true);

-- Alternative: If you want to allow authenticated users to insert
-- CREATE POLICY "Allow service role to insert questions"
--   ON questions FOR INSERT
--   TO service_role
--   WITH CHECK (true);
