-- Migration: Create Questions Audit System
-- Description: Tracks all changes to questions table for version history and auditing
-- Created: 2025-10-13

-- ============================================================================
-- Create questions_audit table to store historical versions
-- ============================================================================

CREATE TABLE IF NOT EXISTS questions_audit (
  -- Primary audit tracking fields
  audit_id BIGSERIAL PRIMARY KEY,
  question_id BIGINT NOT NULL, -- References questions(id)
  operation_type VARCHAR(10) NOT NULL CHECK (operation_type IN ('INSERT', 'UPDATE', 'DELETE')),
  changed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  changed_by UUID, -- User who made the change (if available from auth context)

  -- Snapshot of question data at time of change
  external_id VARCHAR(50),
  subject VARCHAR(50),
  topic VARCHAR(100),
  sub_topic VARCHAR(100),
  difficulty VARCHAR(20),
  question_type VARCHAR(50),

  -- Question content
  question_html TEXT,
  options JSONB,
  correct_answer TEXT,

  -- Solution and explanations
  solution_html TEXT,
  strategy TEXT,
  expert_insight TEXT,
  key_facts TEXT[],

  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE,

  -- Changed fields tracking (JSONB for flexibility)
  changed_fields JSONB, -- Stores array of field names that were modified

  -- Full row snapshot (for complete version reconstruction)
  row_data JSONB NOT NULL -- Complete snapshot of the row
);

-- ============================================================================
-- Create indexes for efficient querying
-- ============================================================================

-- Index for finding all versions of a specific question
CREATE INDEX IF NOT EXISTS idx_questions_audit_question_id
  ON questions_audit(question_id);

-- Index for finding changes by date (most recent first)
CREATE INDEX IF NOT EXISTS idx_questions_audit_changed_at
  ON questions_audit(changed_at DESC);

-- Index for finding changes by user
CREATE INDEX IF NOT EXISTS idx_questions_audit_changed_by
  ON questions_audit(changed_by)
  WHERE changed_by IS NOT NULL;

-- Index for filtering by subject
CREATE INDEX IF NOT EXISTS idx_questions_audit_subject
  ON questions_audit(subject);

-- Index for filtering by topic
CREATE INDEX IF NOT EXISTS idx_questions_audit_topic
  ON questions_audit(topic);

-- Composite index for question history queries (question + date)
CREATE INDEX IF NOT EXISTS idx_questions_audit_question_date
  ON questions_audit(question_id, changed_at DESC);

-- ============================================================================
-- Create trigger function to automatically log changes
-- ============================================================================

CREATE OR REPLACE FUNCTION log_question_changes()
RETURNS TRIGGER AS $$
DECLARE
  changed_fields_array TEXT[] := '{}';
  field_name TEXT;
BEGIN
  -- For UPDATE operations, identify which fields changed
  IF TG_OP = 'UPDATE' THEN
    -- Check each field and add to changed_fields if different
    IF OLD.external_id IS DISTINCT FROM NEW.external_id THEN
      changed_fields_array := array_append(changed_fields_array, 'external_id');
    END IF;
    IF OLD.subject IS DISTINCT FROM NEW.subject THEN
      changed_fields_array := array_append(changed_fields_array, 'subject');
    END IF;
    IF OLD.topic IS DISTINCT FROM NEW.topic THEN
      changed_fields_array := array_append(changed_fields_array, 'topic');
    END IF;
    IF OLD.sub_topic IS DISTINCT FROM NEW.sub_topic THEN
      changed_fields_array := array_append(changed_fields_array, 'sub_topic');
    END IF;
    IF OLD.difficulty IS DISTINCT FROM NEW.difficulty THEN
      changed_fields_array := array_append(changed_fields_array, 'difficulty');
    END IF;
    IF OLD.question_type IS DISTINCT FROM NEW.question_type THEN
      changed_fields_array := array_append(changed_fields_array, 'question_type');
    END IF;
    IF OLD.question_html IS DISTINCT FROM NEW.question_html THEN
      changed_fields_array := array_append(changed_fields_array, 'question_html');
    END IF;
    IF OLD.options::text IS DISTINCT FROM NEW.options::text THEN
      changed_fields_array := array_append(changed_fields_array, 'options');
    END IF;
    IF OLD.correct_answer IS DISTINCT FROM NEW.correct_answer THEN
      changed_fields_array := array_append(changed_fields_array, 'correct_answer');
    END IF;
    IF OLD.solution_html IS DISTINCT FROM NEW.solution_html THEN
      changed_fields_array := array_append(changed_fields_array, 'solution_html');
    END IF;
    IF OLD.strategy IS DISTINCT FROM NEW.strategy THEN
      changed_fields_array := array_append(changed_fields_array, 'strategy');
    END IF;
    IF OLD.expert_insight IS DISTINCT FROM NEW.expert_insight THEN
      changed_fields_array := array_append(changed_fields_array, 'expert_insight');
    END IF;
    IF OLD.key_facts::text IS DISTINCT FROM NEW.key_facts::text THEN
      changed_fields_array := array_append(changed_fields_array, 'key_facts');
    END IF;
  END IF;

  -- Insert audit record
  INSERT INTO questions_audit (
    question_id,
    operation_type,
    changed_at,
    changed_by,
    external_id,
    subject,
    topic,
    sub_topic,
    difficulty,
    question_type,
    question_html,
    options,
    correct_answer,
    solution_html,
    strategy,
    expert_insight,
    key_facts,
    created_at,
    updated_at,
    changed_fields,
    row_data
  ) VALUES (
    COALESCE(NEW.id, OLD.id),
    TG_OP,
    NOW(),
    -- Try to get user from auth context, null if not available
    NULLIF(current_setting('app.current_user_id', TRUE), '')::UUID,
    COALESCE(NEW.external_id, OLD.external_id),
    COALESCE(NEW.subject, OLD.subject),
    COALESCE(NEW.topic, OLD.topic),
    COALESCE(NEW.sub_topic, OLD.sub_topic),
    COALESCE(NEW.difficulty, OLD.difficulty),
    COALESCE(NEW.question_type, OLD.question_type),
    COALESCE(NEW.question_html, OLD.question_html),
    COALESCE(NEW.options, OLD.options),
    COALESCE(NEW.correct_answer, OLD.correct_answer),
    COALESCE(NEW.solution_html, OLD.solution_html),
    COALESCE(NEW.strategy, OLD.strategy),
    COALESCE(NEW.expert_insight, OLD.expert_insight),
    COALESCE(NEW.key_facts, OLD.key_facts),
    COALESCE(NEW.created_at, OLD.created_at),
    COALESCE(NEW.updated_at, OLD.updated_at),
    CASE
      WHEN TG_OP = 'UPDATE' THEN to_jsonb(changed_fields_array)
      ELSE NULL
    END,
    CASE
      WHEN TG_OP = 'DELETE' THEN to_jsonb(OLD)
      ELSE to_jsonb(NEW)
    END
  );

  -- Return appropriate row
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- Create trigger on questions table
-- ============================================================================

DROP TRIGGER IF EXISTS questions_audit_trigger ON questions;

CREATE TRIGGER questions_audit_trigger
  AFTER INSERT OR UPDATE OR DELETE ON questions
  FOR EACH ROW
  EXECUTE FUNCTION log_question_changes();

-- ============================================================================
-- Create helper views for common queries
-- ============================================================================

-- View: Latest version of each question
CREATE OR REPLACE VIEW questions_latest_audit AS
SELECT DISTINCT ON (question_id)
  audit_id,
  question_id,
  operation_type,
  changed_at,
  changed_by,
  external_id,
  subject,
  topic,
  sub_topic,
  difficulty,
  question_type,
  changed_fields
FROM questions_audit
ORDER BY question_id, changed_at DESC;

-- View: Questions modified today
CREATE OR REPLACE VIEW questions_modified_today AS
SELECT
  question_id,
  external_id,
  subject,
  topic,
  COUNT(*) as modification_count,
  MAX(changed_at) as last_modified,
  array_agg(DISTINCT operation_type ORDER BY operation_type) as operations
FROM questions_audit
WHERE changed_at >= CURRENT_DATE
GROUP BY question_id, external_id, subject, topic
ORDER BY last_modified DESC;

-- ============================================================================
-- Create helper functions for version comparison
-- ============================================================================

-- Function: Get all versions of a question
CREATE OR REPLACE FUNCTION get_question_versions(p_question_id BIGINT)
RETURNS TABLE (
  audit_id BIGINT,
  operation_type VARCHAR,
  changed_at TIMESTAMP WITH TIME ZONE,
  changed_fields JSONB,
  version_number BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    qa.audit_id,
    qa.operation_type,
    qa.changed_at,
    qa.changed_fields,
    ROW_NUMBER() OVER (ORDER BY qa.changed_at DESC) as version_number
  FROM questions_audit qa
  WHERE qa.question_id = p_question_id
  ORDER BY qa.changed_at DESC;
END;
$$ LANGUAGE plpgsql;

-- Function: Compare two versions of a question
CREATE OR REPLACE FUNCTION compare_question_versions(
  p_audit_id_1 BIGINT,
  p_audit_id_2 BIGINT
)
RETURNS TABLE (
  field_name TEXT,
  version_1_value TEXT,
  version_2_value TEXT,
  is_different BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  WITH v1 AS (
    SELECT row_data FROM questions_audit WHERE audit_id = p_audit_id_1
  ),
  v2 AS (
    SELECT row_data FROM questions_audit WHERE audit_id = p_audit_id_2
  )
  SELECT
    key as field_name,
    (SELECT row_data->>key FROM v1) as version_1_value,
    (SELECT row_data->>key FROM v2) as version_2_value,
    (SELECT row_data->>key FROM v1) IS DISTINCT FROM (SELECT row_data->>key FROM v2) as is_different
  FROM (
    SELECT DISTINCT key
    FROM v1, jsonb_object_keys(v1.row_data) key
    UNION
    SELECT DISTINCT key
    FROM v2, jsonb_object_keys(v2.row_data) key
  ) all_keys
  ORDER BY field_name;
END;
$$ LANGUAGE plpgsql;

-- Function: Get change statistics
CREATE OR REPLACE FUNCTION get_question_change_stats(
  p_start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW() - INTERVAL '30 days',
  p_end_date TIMESTAMP WITH TIME ZONE DEFAULT NOW()
)
RETURNS TABLE (
  subject VARCHAR,
  total_changes BIGINT,
  questions_affected BIGINT,
  avg_changes_per_question NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    qa.subject,
    COUNT(*) as total_changes,
    COUNT(DISTINCT qa.question_id) as questions_affected,
    ROUND(COUNT(*)::NUMERIC / NULLIF(COUNT(DISTINCT qa.question_id), 0), 2) as avg_changes_per_question
  FROM questions_audit qa
  WHERE qa.changed_at BETWEEN p_start_date AND p_end_date
  GROUP BY qa.subject
  ORDER BY total_changes DESC;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- Add comments for documentation
-- ============================================================================

COMMENT ON TABLE questions_audit IS 'Audit trail for all changes to questions table. Automatically populated by trigger.';
COMMENT ON COLUMN questions_audit.audit_id IS 'Unique identifier for each audit record';
COMMENT ON COLUMN questions_audit.question_id IS 'References the question in questions table';
COMMENT ON COLUMN questions_audit.operation_type IS 'Type of operation: INSERT, UPDATE, or DELETE';
COMMENT ON COLUMN questions_audit.changed_at IS 'Timestamp when the change occurred';
COMMENT ON COLUMN questions_audit.changed_by IS 'User ID who made the change (from auth context)';
COMMENT ON COLUMN questions_audit.changed_fields IS 'JSONB array of field names that were modified (UPDATE only)';
COMMENT ON COLUMN questions_audit.row_data IS 'Complete snapshot of the row as JSONB for version reconstruction';

COMMENT ON FUNCTION log_question_changes() IS 'Trigger function that automatically logs changes to questions table';
COMMENT ON FUNCTION get_question_versions(BIGINT) IS 'Returns all versions of a question ordered by most recent first';
COMMENT ON FUNCTION compare_question_versions(BIGINT, BIGINT) IS 'Compares two versions and shows field-by-field differences';
COMMENT ON FUNCTION get_question_change_stats(TIMESTAMP WITH TIME ZONE, TIMESTAMP WITH TIME ZONE) IS 'Returns statistics about question changes in a date range';

-- ============================================================================
-- Grant permissions (adjust based on your RLS policies)
-- ============================================================================

-- Grant SELECT on audit table to authenticated users (adjust as needed)
-- ALTER TABLE questions_audit ENABLE ROW LEVEL SECURITY;

-- Example RLS policy (uncomment and adjust as needed):
-- CREATE POLICY "Allow authenticated users to read audit records"
--   ON questions_audit FOR SELECT
--   TO authenticated
--   USING (true);

-- ============================================================================
-- Migration complete
-- ============================================================================

-- Verify installation
DO $$
BEGIN
  RAISE NOTICE '✅ Questions audit system created successfully';
  RAISE NOTICE '📋 Table: questions_audit';
  RAISE NOTICE '🔧 Trigger: questions_audit_trigger';
  RAISE NOTICE '👁️  Views: questions_latest_audit, questions_modified_today';
  RAISE NOTICE '⚡ Functions: get_question_versions(), compare_question_versions(), get_question_change_stats()';
END $$;
