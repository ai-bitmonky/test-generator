-- Create table to track user's question history
CREATE TABLE IF NOT EXISTS question_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  question_id VARCHAR(255) NOT NULL,
  status VARCHAR(50) NOT NULL, -- 'solved', 'incorrect', 'skipped', 'flagged', 'replaced'
  test_id UUID REFERENCES tests(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX idx_question_history_user_question ON question_history(user_id, question_id);
CREATE INDEX idx_question_history_user_status ON question_history(user_id, status);
CREATE INDEX idx_question_history_test ON question_history(test_id);

-- Row Level Security
ALTER TABLE question_history ENABLE ROW LEVEL SECURITY;

-- Users can only view their own history
CREATE POLICY "Users can view their own question history"
  ON question_history FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Users can only insert their own history
CREATE POLICY "Users can insert their own question history"
  ON question_history FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own history
CREATE POLICY "Users can update their own question history"
  ON question_history FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);
