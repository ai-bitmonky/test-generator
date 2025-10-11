# Delete Legacy Questions Guide

## Issue

Currently there are 142 legacy Mathematics questions in the database with `NULL` chapter values. These are old questions that should have been replaced during the migration but weren't properly deleted.

## Current State

- **Total Mathematics questions**: 395
- **With NULL chapter (legacy)**: 142
- **With proper chapters (new)**: 253

## Solution

Use the SQL Editor in Supabase to delete the legacy questions directly.

## Steps to Delete Legacy Questions

### Option 1: Using Supabase SQL Editor (RECOMMENDED)

1. **Open Supabase Dashboard**
   - Go to https://supabase.com/dashboard
   - Select your project: `qcbggagdtsmgllddfgax`

2. **Open SQL Editor**
   - Click on "SQL Editor" in the left sidebar
   - Click "New query"

3. **Run the Deletion SQL**
   - Copy the contents of `delete_legacy_questions.sql`
   - Paste into the SQL editor
   - Click "Run" or press Ctrl+Enter

4. **Verify Results**
   - The query will show before/after counts
   - Check that NULL chapter count is now 0
   - Total Mathematics questions should be 253

### Option 2: Using psql (if you have database connection)

```bash
psql your_database_connection_string -f delete_legacy_questions.sql
```

## Expected Results

### Before Deletion:
```
Subject: Mathematics
Total: 395 questions
  - NULL chapter: 142 questions (legacy)
  - Proper chapters: 253 questions (new)
```

### After Deletion:
```
Subject: Mathematics
Total: 253 questions
  - Algebra: 76 questions
  - Calculus: 71 questions
  - Coordinate Geometry: 46 questions
  - Mathematics: 37 questions
  - Combinatorics: 23 questions
```

## Why JavaScript Scripts Failed

The Node.js scripts appeared to delete questions but they weren't actually being removed. This could be due to:

1. **Transaction handling**: The deletions might not have been committed
2. **RLS policies**: Row Level Security might be interfering
3. **Client library issues**: The Supabase JS client might have caching issues
4. **Async timing**: Race conditions in the async operations

Running the SQL directly bypasses all these issues.

## Verification After Deletion

Run this query in SQL Editor to verify:

```sql
-- Should return 0
SELECT COUNT(*)
FROM questions
WHERE subject = 'Mathematics'
AND chapter IS NULL;

-- Should return 253
SELECT COUNT(*)
FROM questions
WHERE subject = 'Mathematics';

-- Should show proper chapters
SELECT chapter, COUNT(*) as count
FROM questions
WHERE subject = 'Mathematics'
GROUP BY chapter
ORDER BY count DESC;
```

## Frontend Impact

After deletion, the frontend will no longer show the "Unknown" chapter for Mathematics questions. All 253 questions will be properly categorized by chapter:

- Algebra
- Calculus
- Coordinate Geometry
- Combinatorics
- Mathematics (General)

## Rollback (if needed)

If you need to restore the deleted questions, there's a backup at:
```
./backups/legacy_questions_backup_2025-10-11.json
```

However, these are old questions that should NOT be restored as they've been replaced with better versions.

## Final Database State

After cleanup:
- **Total Questions**: 490 (253 Math + 237 Physics)
- **Mathematics**: 253 questions (all with proper chapters)
- **Physics**: 237 questions
- **Chemistry**: 0 questions (coming soon)

---

**Last Updated**: October 11, 2025
