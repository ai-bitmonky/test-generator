-- Enable Realtime for questions table
ALTER PUBLICATION supabase_realtime ADD TABLE questions;

-- Optional: Create a function to broadcast enrichment progress
CREATE OR REPLACE FUNCTION notify_enrichment_progress()
RETURNS TRIGGER AS $$
BEGIN
  -- Only notify if enrichment fields changed
  IF (NEW.strategy IS DISTINCT FROM OLD.strategy) OR
     (NEW.expert_insight IS DISTINCT FROM OLD.expert_insight) OR
     (NEW.key_facts IS DISTINCT FROM OLD.key_facts) OR
     (NEW.figure_svg IS DISTINCT FROM OLD.figure_svg) OR
     (NEW.options IS DISTINCT FROM OLD.options) THEN

    PERFORM pg_notify(
      'enrichment_update',
      json_build_object(
        'id', NEW.id,
        'subject', NEW.subject,
        'topic', NEW.topic,
        'timestamp', NOW()
      )::text
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for enrichment updates
DROP TRIGGER IF EXISTS enrichment_progress_trigger ON questions;
CREATE TRIGGER enrichment_progress_trigger
  AFTER UPDATE ON questions
  FOR EACH ROW
  EXECUTE FUNCTION notify_enrichment_progress();
