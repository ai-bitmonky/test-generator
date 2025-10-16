-- Create audit/changelog table for tracking all changes to questions
-- This table stores a complete history of every change made to each question

CREATE TABLE IF NOT EXISTS question_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  changed_by TEXT DEFAULT 'system',
  change_type TEXT NOT NULL, -- 'create', 'update', 'delete', 'validate', 'enrich'
  field_changed TEXT, -- Which field was modified (e.g., 'question_html', 'options', 'solution_html')
  old_value JSONB, -- Previous value (stored as JSON for flexibility)
  new_value JSONB, -- New value (stored as JSON for flexibility)
  change_notes TEXT, -- Human-readable description of the change
  version_number INTEGER NOT NULL DEFAULT 1, -- Incremental version number for this question
  metadata JSONB -- Additional metadata (IP, user agent, validation results, etc.)
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_audit_question_id ON question_audit(question_id);
CREATE INDEX IF NOT EXISTS idx_audit_changed_at ON question_audit(changed_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_change_type ON question_audit(change_type);
CREATE INDEX IF NOT EXISTS idx_audit_question_date ON question_audit(question_id, changed_at DESC);

-- Add comments
COMMENT ON TABLE question_audit IS 'Complete audit trail of all changes made to questions';
COMMENT ON COLUMN question_audit.question_id IS 'Reference to the question that was modified';
COMMENT ON COLUMN question_audit.changed_at IS 'Timestamp when the change occurred';
COMMENT ON COLUMN question_audit.changed_by IS 'User/system that made the change';
COMMENT ON COLUMN question_audit.change_type IS 'Type of change: create, update, delete, validate, enrich';
COMMENT ON COLUMN question_audit.field_changed IS 'Specific field that was modified';
COMMENT ON COLUMN question_audit.old_value IS 'Previous value before change (JSON)';
COMMENT ON COLUMN question_audit.new_value IS 'New value after change (JSON)';
COMMENT ON COLUMN question_audit.version_number IS 'Incremental version number for this question';

-- Create function to automatically log changes
CREATE OR REPLACE FUNCTION log_question_change()
RETURNS TRIGGER AS $$
DECLARE
  next_version INTEGER;
BEGIN
  -- Get next version number for this question
  SELECT COALESCE(MAX(version_number), 0) + 1
  INTO next_version
  FROM question_audit
  WHERE question_id = NEW.id;

  -- Log the change for INSERT
  IF (TG_OP = 'INSERT') THEN
    INSERT INTO question_audit (
      question_id,
      change_type,
      field_changed,
      new_value,
      version_number,
      change_notes
    ) VALUES (
      NEW.id,
      'create',
      'all_fields',
      to_jsonb(NEW),
      next_version,
      'Question created'
    );
    RETURN NEW;
  END IF;

  -- Log the change for UPDATE
  IF (TG_OP = 'UPDATE') THEN
    -- Log changes for each modified field
    IF OLD.question_html IS DISTINCT FROM NEW.question_html THEN
      INSERT INTO question_audit (
        question_id, change_type, field_changed, old_value, new_value,
        version_number, change_notes
      ) VALUES (
        NEW.id, 'update', 'question_html',
        to_jsonb(OLD.question_html), to_jsonb(NEW.question_html),
        next_version, 'Question text updated'
      );
    END IF;

    IF OLD.options IS DISTINCT FROM NEW.options THEN
      INSERT INTO question_audit (
        question_id, change_type, field_changed, old_value, new_value,
        version_number, change_notes
      ) VALUES (
        NEW.id, 'update', 'options',
        to_jsonb(OLD.options), to_jsonb(NEW.options),
        next_version, 'Options updated'
      );
    END IF;

    IF OLD.correct_answer IS DISTINCT FROM NEW.correct_answer THEN
      INSERT INTO question_audit (
        question_id, change_type, field_changed, old_value, new_value,
        version_number, change_notes
      ) VALUES (
        NEW.id, 'update', 'correct_answer',
        to_jsonb(OLD.correct_answer), to_jsonb(NEW.correct_answer),
        next_version, 'Correct answer updated'
      );
    END IF;

    IF OLD.solution_html IS DISTINCT FROM NEW.solution_html THEN
      INSERT INTO question_audit (
        question_id, change_type, field_changed, old_value, new_value,
        version_number, change_notes
      ) VALUES (
        NEW.id, 'update', 'solution_html',
        to_jsonb(OLD.solution_html), to_jsonb(NEW.solution_html),
        next_version, 'Solution updated'
      );
    END IF;

    IF OLD.figure_svg IS DISTINCT FROM NEW.figure_svg THEN
      INSERT INTO question_audit (
        question_id, change_type, field_changed, old_value, new_value,
        version_number, change_notes
      ) VALUES (
        NEW.id, 'update', 'figure_svg',
        to_jsonb(OLD.figure_svg IS NOT NULL), to_jsonb(NEW.figure_svg IS NOT NULL),
        next_version, 'Figure/SVG updated'
      );
    END IF;

    IF OLD.strategy IS DISTINCT FROM NEW.strategy THEN
      INSERT INTO question_audit (
        question_id, change_type, field_changed, old_value, new_value,
        version_number, change_notes
      ) VALUES (
        NEW.id, 'update', 'strategy',
        to_jsonb(OLD.strategy), to_jsonb(NEW.strategy),
        next_version, 'Strategy updated'
      );
    END IF;

    IF OLD.expert_insight IS DISTINCT FROM NEW.expert_insight THEN
      INSERT INTO question_audit (
        question_id, change_type, field_changed, old_value, new_value,
        version_number, change_notes
      ) VALUES (
        NEW.id, 'update', 'expert_insight',
        to_jsonb(OLD.expert_insight), to_jsonb(NEW.expert_insight),
        next_version, 'Expert insight updated'
      );
    END IF;

    IF OLD.key_facts IS DISTINCT FROM NEW.key_facts THEN
      INSERT INTO question_audit (
        question_id, change_type, field_changed, old_value, new_value,
        version_number, change_notes
      ) VALUES (
        NEW.id, 'update', 'key_facts',
        to_jsonb(OLD.key_facts), to_jsonb(NEW.key_facts),
        next_version, 'Key facts updated'
      );
    END IF;

    IF OLD.validated_at IS DISTINCT FROM NEW.validated_at AND NEW.validated_at IS NOT NULL THEN
      INSERT INTO question_audit (
        question_id, change_type, field_changed, old_value, new_value,
        version_number, change_notes, metadata
      ) VALUES (
        NEW.id, 'validate', 'validated_at',
        to_jsonb(OLD.validated_at), to_jsonb(NEW.validated_at),
        next_version, 'Question validated',
        jsonb_build_object(
          'validation_version', NEW.validation_version,
          'validation_notes', NEW.validation_notes
        )
      );
    END IF;

    RETURN NEW;
  END IF;

  -- Log the change for DELETE
  IF (TG_OP = 'DELETE') THEN
    INSERT INTO question_audit (
      question_id,
      change_type,
      field_changed,
      old_value,
      version_number,
      change_notes
    ) VALUES (
      OLD.id,
      'delete',
      'all_fields',
      to_jsonb(OLD),
      next_version,
      'Question deleted'
    );
    RETURN OLD;
  END IF;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically log all changes
DROP TRIGGER IF EXISTS questions_audit_trigger ON questions;
CREATE TRIGGER questions_audit_trigger
  AFTER INSERT OR UPDATE OR DELETE ON questions
  FOR EACH ROW
  EXECUTE FUNCTION log_question_change();

-- Create view for easy access to question history
CREATE OR REPLACE VIEW question_history AS
SELECT
  qa.id AS audit_id,
  qa.question_id,
  q.subject,
  q.topic,
  qa.changed_at,
  qa.changed_by,
  qa.change_type,
  qa.field_changed,
  qa.old_value,
  qa.new_value,
  qa.change_notes,
  qa.version_number,
  qa.metadata
FROM question_audit qa
LEFT JOIN questions q ON qa.question_id = q.id
ORDER BY qa.changed_at DESC;

COMMENT ON VIEW question_history IS 'Easy-to-query view of question audit history with subject/topic info';
