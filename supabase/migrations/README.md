# Database Migrations

This directory contains SQL migrations for the JEE Test application database.

## Available Migrations

### 20251013000000_create_questions_audit.sql

**Purpose**: Creates comprehensive audit/version tracking system for questions table

**Features**:
- `questions_audit` table to store all historical versions
- Automatic trigger to log INSERT/UPDATE/DELETE operations
- Tracks changed fields for each update
- Stores complete row snapshots as JSONB
- Includes helpful views and functions for querying audit data

**Components Created**:

1. **Table**: `questions_audit`
   - Stores complete history of all question changes
   - Indexed for efficient querying by question_id, date, user, subject, topic

2. **Trigger**: `questions_audit_trigger`
   - Automatically logs all changes to questions table
   - Captures operation type (INSERT/UPDATE/DELETE)
   - Identifies which specific fields changed
   - Stores complete before/after snapshots

3. **Views**:
   - `questions_latest_audit`: Latest version of each question
   - `questions_modified_today`: Questions modified today with stats

4. **Functions**:
   - `get_question_versions(question_id)`: Returns all versions of a question
   - `compare_question_versions(audit_id_1, audit_id_2)`: Field-by-field comparison
   - `get_question_change_stats(start_date, end_date)`: Change statistics by subject

## Applying Migrations

### Method 1: Supabase CLI (Recommended for Production)

```bash
# Install Supabase CLI
npm install -g supabase

# Link to your project
supabase link --project-ref YOUR_PROJECT_REF

# Apply all pending migrations
supabase db push
```

### Method 2: Supabase Dashboard

1. Go to Supabase Dashboard
2. Navigate to SQL Editor
3. Copy the contents of the migration file
4. Paste and execute

### Method 3: Using the apply-migration Script

```bash
# Apply specific migration
node scripts/apply-migration.js 20251013000000_create_questions_audit.sql

# Note: This method has limitations and is mainly for development
# For production, use Supabase CLI
```

## Testing the Audit System

After applying the migration, test it:

```sql
-- 1. Check that the table exists
SELECT * FROM questions_audit LIMIT 1;

-- 2. Update a question to trigger audit
UPDATE questions
SET difficulty = 'Hard'
WHERE id = (SELECT id FROM questions LIMIT 1);

-- 3. Check audit record was created
SELECT * FROM questions_audit
ORDER BY changed_at DESC
LIMIT 5;

-- 4. Get all versions of a question
SELECT * FROM get_question_versions(
  (SELECT id FROM questions LIMIT 1)
);

-- 5. Compare two versions
SELECT * FROM compare_question_versions(
  (SELECT audit_id FROM questions_audit ORDER BY changed_at DESC LIMIT 1),
  (SELECT audit_id FROM questions_audit ORDER BY changed_at DESC LIMIT 1 OFFSET 1)
);
```

## Rollback

To rollback this migration, execute:

```sql
-- Drop trigger
DROP TRIGGER IF EXISTS questions_audit_trigger ON questions;

-- Drop functions
DROP FUNCTION IF EXISTS log_question_changes();
DROP FUNCTION IF EXISTS get_question_versions(BIGINT);
DROP FUNCTION IF EXISTS compare_question_versions(BIGINT, BIGINT);
DROP FUNCTION IF EXISTS get_question_change_stats(TIMESTAMP WITH TIME ZONE, TIMESTAMP WITH TIME ZONE);

-- Drop views
DROP VIEW IF EXISTS questions_latest_audit;
DROP VIEW IF EXISTS questions_modified_today;

-- Drop table
DROP TABLE IF EXISTS questions_audit;
```

## Notes

- The audit system automatically tracks all changes without requiring application code changes
- Audit records are never automatically deleted - implement a retention policy if needed
- The `changed_by` field requires setting `app.current_user_id` in application code
- Consider adding Row Level Security (RLS) policies based on your security requirements
- The complete row snapshot in `row_data` allows full version reconstruction

## Future Enhancements

Potential additions:
- Retention policies for old audit records
- Automated alerts for suspicious changes
- Integration with application-level user tracking
- Dashboard for visualizing change patterns
- Export functionality for compliance reporting
