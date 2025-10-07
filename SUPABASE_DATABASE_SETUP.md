# Supabase Database Setup Instructions

## Step 1: Run the SQL Schema

1. Go to your Supabase project dashboard: https://supabase.com/dashboard/project/qcbggagdtsmgllddfgax
2. Click on **SQL Editor** in the left sidebar (database icon)
3. Click **New Query**
4. Copy the entire contents of `supabase_schema.sql`
5. Paste it into the SQL editor
6. Click **Run** or press `Ctrl+Enter` (Windows/Linux) or `Cmd+Enter` (Mac)
7. You should see "Success. No rows returned" message

This will create:
- ✅ **questions** table - stores all MCQ questions with solutions
- ✅ **tests** table - stores user test attempts and results
- ✅ Row Level Security policies - ensures data security
- ✅ Indexes for fast queries
- ✅ **question_stats** view - aggregated statistics

## Step 2: Migrate Questions to Database

After the schema is created, run the migration script:

```bash
node migrate_questions.js
```

This will:
- Upload all 89 MCQ questions to the database
- Display progress for each batch
- Show final statistics by topic and difficulty

Expected output:
```
🚀 Starting question migration...

📚 Found 89 questions to migrate

📤 Uploading batch 1/2 (50 questions)...
✅ Successfully uploaded 50 questions
📤 Uploading batch 2/2 (39 questions)...
✅ Successfully uploaded 39 questions

📊 Migration Summary:
✅ Successfully migrated: 89 questions

📈 Question Statistics:
Topic                   Difficulty      Count
────────────────────────────────────────────────────────────
Areas Integration       ADVANCED        7
Areas Integration       MEDIUM          6
Circles                 ADVANCED        12
Circles                 MEDIUM          12
Integration             ADVANCED        9
Integration             MEDIUM          8
Inverse Trig            ADVANCED        13
Inverse Trig            MEDIUM          7
Matrices                ADVANCED        15
```

## Step 3: Verify the Data

In Supabase dashboard:
1. Click **Table Editor** in the left sidebar
2. Select **questions** table
3. You should see all 89 questions
4. Check a few questions to verify data integrity

## Troubleshooting

### If migration fails with "permission denied"
- Make sure you ran the SQL schema first
- Check that Row Level Security policies are created

### If you get "duplicate key" errors
- The questions table already has data
- You can either:
  - Delete existing data: `DELETE FROM questions;`
  - Or skip migration if data is already there

### To reset and start over
Run this SQL in Supabase SQL Editor:
```sql
DROP TABLE IF EXISTS tests CASCADE;
DROP TABLE IF EXISTS questions CASCADE;
DROP VIEW IF EXISTS question_stats;
```
Then repeat Step 1 and Step 2.

## What's Next?

After successful setup:
1. ✅ Database schema is ready
2. ✅ Questions are loaded
3. ⏭️ Next: Update the application to use Supabase (I'll do this automatically)

The application will then use Supabase for:
- User authentication (via Supabase Auth)
- Fetching questions for tests
- Storing test results
- Displaying analytics

---

**Ready to proceed?** Let me know once you've completed Step 1 and Step 2, and I'll update the application code!
