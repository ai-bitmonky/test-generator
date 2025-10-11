-- JEE Test Generator Database Schema

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Questions table
CREATE TABLE IF NOT EXISTS questions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  external_id VARCHAR(255) UNIQUE NOT NULL, -- e.g., "Circles_1"
  topic VARCHAR(255) NOT NULL,
  difficulty VARCHAR(50) NOT NULL CHECK (difficulty IN ('EASY', 'MEDIUM', 'ADVANCED')),
  concepts JSONB DEFAULT '[]'::jsonb, -- Array of concept tags
  question TEXT NOT NULL,
  options JSONB NOT NULL, -- JSON object with keys: a, b, c, d
  correct_answer VARCHAR(1) NOT NULL CHECK (correct_answer IN ('a', 'b', 'c', 'd')),
  solution_html TEXT,
  solution_text TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_questions_topic ON questions(topic);
CREATE INDEX IF NOT EXISTS idx_questions_difficulty ON questions(difficulty);
CREATE INDEX IF NOT EXISTS idx_questions_external_id ON questions(external_id);

-- Tests table
CREATE TABLE IF NOT EXISTS tests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  total_questions INTEGER NOT NULL,
  answered_questions INTEGER NOT NULL,
  correct_count INTEGER NOT NULL,
  incorrect_count INTEGER NOT NULL,
  skipped_count INTEGER NOT NULL,
  total_time INTEGER NOT NULL, -- in seconds
  question_timings JSONB NOT NULL, -- Array of {questionId, timeTaken}
  answers JSONB NOT NULL, -- Object mapping question index to answer
  questions JSONB NOT NULL, -- Array of {id, topic, difficulty}
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_tests_user_id ON tests(user_id);
CREATE INDEX IF NOT EXISTS idx_tests_created_at ON tests(created_at DESC);

-- Enable Row Level Security
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE tests ENABLE ROW LEVEL SECURITY;

-- Questions policies (read-only for authenticated users)
CREATE POLICY "Questions are viewable by authenticated users"
  ON questions FOR SELECT
  TO authenticated
  USING (true);

-- Tests policies (users can only see their own tests)
CREATE POLICY "Users can view their own tests"
  ON tests FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own tests"
  ON tests FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger for questions table
CREATE TRIGGER update_questions_updated_at BEFORE UPDATE ON questions
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create a view for question statistics
CREATE OR REPLACE VIEW question_stats AS
SELECT
  topic,
  difficulty,
  COUNT(*) as question_count
FROM questions
GROUP BY topic, difficulty
ORDER BY topic, difficulty;

-- Grant permissions
GRANT SELECT ON question_stats TO authenticated;
