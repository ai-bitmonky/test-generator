# Mathematics Questions Replacement Guide

## Overview

This guide explains how to replace the existing 142 mathematics questions with 291 new complete mathematics questions.

---

## ✅ What's Being Replaced

### Old Questions (Current)
- **142 questions** across 3 topics:
  - Derivatives: 20 questions
  - Differential Equations: 19 questions
  - Differentiability: 14 questions

### New Questions (Complete Set)
- **291 questions** across 5 chapters:
  - Algebra: 84 questions
  - Calculus: 93 questions
  - Combinatorics: 23 questions
  - Coordinate Geometry: 52 questions
  - Mathematics (General): 39 questions

### Difficulty Distribution
- Hard: 212 questions
- Medium: 79 questions

---

## 🚀 Step-by-Step Replacement Process

### Step 1: Update Database Schema

**IMPORTANT**: Run this FIRST in Supabase SQL Editor

```sql
-- File: update_schema_for_physics.sql
-- This adds necessary columns for enhanced metadata

ALTER TABLE questions
ADD COLUMN IF NOT EXISTS subject VARCHAR(50) DEFAULT 'Mathematics',
ADD COLUMN IF NOT EXISTS chapter VARCHAR(255),
ADD COLUMN IF NOT EXISTS subtopic VARCHAR(255),
ADD COLUMN IF NOT EXISTS tags JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS question_type VARCHAR(100),
ADD COLUMN IF NOT EXISTS question_html TEXT,
ADD COLUMN IF NOT EXISTS strategy TEXT,
ADD COLUMN IF NOT EXISTS expert_insight TEXT,
ADD COLUMN IF NOT EXISTS key_facts TEXT;

CREATE INDEX IF NOT EXISTS idx_questions_subject ON questions(subject);
CREATE INDEX IF NOT EXISTS idx_questions_chapter ON questions(chapter);
CREATE INDEX IF NOT EXISTS idx_questions_tags ON questions USING GIN(tags);

UPDATE questions SET subject = 'Mathematics' WHERE subject IS NULL;

DROP VIEW IF EXISTS question_stats;
CREATE OR REPLACE VIEW question_stats AS
SELECT
  subject,
  COALESCE(chapter, topic) as chapter_or_topic,
  topic,
  difficulty,
  COUNT(*) as question_count
FROM questions
GROUP BY subject, COALESCE(chapter, topic), topic, difficulty
ORDER BY subject, chapter_or_topic, topic, difficulty;

GRANT SELECT ON question_stats TO authenticated;
```

### Step 2: Backup Current Database (Optional but Recommended)

```bash
node backup_database.js
```

This creates a backup in `./backups/backup_TIMESTAMP/`

### Step 3: Run Replacement Script

```bash
node replace_math_questions.js
```

### What the Script Does:

1. **Counts** existing mathematics questions
2. **Deletes** all existing mathematics questions (subject = 'Mathematics')
3. **Loads** 291 new questions from `complete_math_questions.json`
4. **Inserts** new questions in batches of 50
5. **Reports** statistics and verification

### Expected Output:

```
🔄 Starting Mathematics question replacement...

📊 Checking existing mathematics questions...
Found 142 existing mathematics questions

🗑️  Deleting existing mathematics questions...
✅ Deleted 142 mathematics questions

📚 Loading new mathematics questions...
Found 291 new mathematics questions

📤 Inserting 291 new mathematics questions...

📤 Uploading batch 1/6 (50 questions)...
✅ Successfully uploaded 50 questions
...

======================================================================
📊 Replacement Summary:
======================================================================
🗑️  Deleted: 142 old mathematics questions
✅ Inserted: 291 new mathematics questions

📈 Mathematics Question Statistics:
Chapter/Topic                  Difficulty  Count
----------------------------------------------------------------------
Algebra                        HARD        75
Algebra                        MEDIUM      9
Calculus                       HARD        70
Calculus                       MEDIUM      23
...

📚 Total Questions by Subject:
  • Mathematics: 291 questions
  • Physics: 249 questions (if already migrated)

======================================================================
✅ Mathematics questions replacement complete!
======================================================================
```

---

## 📊 New Questions Structure

### Enhanced Metadata

Each new mathematics question includes:

```json
{
  "id": "Calculus_1",
  "subject": "Mathematics",
  "chapter": "Calculus",
  "topic": "Integration",
  "subtopic": "Definite and Indefinite Integrals",
  "tags": ["INTEGRATION", "IIT_JEE", "JEE_ADVANCED"],
  "type": "Multiple Choice Single Answer",
  "difficulty": "HARD",
  "question": "The line y = x + 1 divided the area...",
  "question_html": "<div>...</div>",
  "options": {
    "a": "2 : 1",
    "b": "1 : 3",
    "c": "2 : 3",
    "d": "1 : 1"
  },
  "correct_answer": "d",
  "solution_html": "<div>...</div>",
  "solution_text": "Solution: Step 1: ..."
}
```

---

## 🔍 Verification

### After Running Replacement

Verify in Supabase SQL Editor:

```sql
-- Check total count
SELECT COUNT(*) FROM questions WHERE subject = 'Mathematics';
-- Should return: 291

-- Check chapter distribution
SELECT chapter, COUNT(*)
FROM questions
WHERE subject = 'Mathematics'
GROUP BY chapter
ORDER BY COUNT(*) DESC;

-- Check difficulty distribution
SELECT difficulty, COUNT(*)
FROM questions
WHERE subject = 'Mathematics'
GROUP BY difficulty;

-- Check if old questions are gone
SELECT external_id FROM questions
WHERE external_id LIKE 'Derivatives_%'
   OR external_id LIKE 'Differential_%'
   OR external_id LIKE '%differentiability%';
-- Should return: 0 rows
```

---

## 📁 Files Involved

1. **extract_complete_math_questions.py**
   - Extracts 291 questions from HTML
   - Creates `complete_math_questions.json`

2. **complete_math_questions.json**
   - 291 mathematics questions
   - ~914 KB file size
   - Complete with metadata and solutions

3. **update_schema_for_physics.sql**
   - Adds necessary database columns
   - Creates indexes
   - Updates views

4. **replace_math_questions.js**
   - Deletes old math questions
   - Inserts new math questions
   - Shows statistics

5. **MATH_REPLACEMENT_GUIDE.md**
   - This guide

---

## ⚠️ Important Notes

### Before Replacement
- ✅ **Backup your database first!** (use `node backup_database.js`)
- ✅ Run `update_schema_for_physics.sql` in Supabase SQL Editor
- ✅ Verify schema update completed successfully

### During Replacement
- Script will delete ALL existing mathematics questions
- No undo option (that's why backup is important)
- Takes 1-2 minutes to complete

### After Replacement
- Old 142 questions will be completely removed
- New 291 questions will be available
- Question IDs will be different (e.g., `Calculus_1` instead of `Derivatives_1`)
- User's question history may reference old IDs (they'll just be ignored)

---

## 🔄 Rollback Plan

If you need to restore old questions:

### Option 1: Restore from Backup

```bash
# Use your most recent backup
node restore_database.js ./backups/backup_YYYY-MM-DDTHH-MM-SS
```

### Option 2: Restore Original Questions

```bash
# Re-run original migration with old JSON file
# Restore mcq_questions_with_solutions.json
node migrate_questions.js
```

---

## 📈 Benefits of New Questions

### Quantity
- **More than doubled**: 142 → 291 questions
- **Better coverage**: 5 chapters vs 3 topics

### Quality
- Complete chapter organization
- Comprehensive topic coverage
- Detailed subtopic classification
- Rich tagging system
- Complete solutions with steps

### Topics Covered

**Algebra (84 questions)**
- Sequences and Series
- Matrices and Determinants
- Complex Numbers
- Quadratic Equations
- And more...

**Calculus (93 questions)**
- Integration (Definite & Indefinite)
- Differentiation
- Applications of Derivatives
- Limits and Continuity
- And more...

**Coordinate Geometry (52 questions)**
- Straight Lines
- Circles
- Conic Sections
- And more...

**Combinatorics (23 questions)**
- Permutations and Combinations
- Probability
- Binomial Theorem

**Mathematics - General (39 questions)**
- Mixed topics
- Advanced problems

---

## 🚨 Troubleshooting

### Error: "column questions.subject does not exist"

**Solution**: You haven't run the schema update yet!
```bash
# In Supabase SQL Editor, run:
update_schema_for_physics.sql
```

### Error: "Failed to delete questions"

**Solution**: Check RLS policies. You may need to temporarily disable RLS:
```sql
ALTER TABLE questions DISABLE ROW LEVEL SECURITY;
-- Run replacement script
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
```

### Error: "Duplicate key violation"

**Solution**: Questions with same external_id already exist. Check if you've already run the script.

---

## 📞 Next Steps After Replacement

1. **Test the Application**
   - Generate a test with Mathematics subject
   - Verify new questions appear
   - Check solution display works

2. **Update Frontend (if needed)**
   - Topic selection may need updating
   - Chapter-based filtering
   - Display new metadata (tags, subtopics)

3. **User Communication**
   - Inform users about new questions
   - Note that question history IDs may not match
   - Highlight increased question bank

4. **Create New Backup**
   ```bash
   node backup_database.js
   ```

---

## 📊 Final Database State

After all migrations (Math + Physics):

**Total Questions: ~540**
- Mathematics: 291 questions
- Physics: 249 questions

**Chapters**:
- Mathematics: Algebra, Calculus, Combinatorics, Coordinate Geometry, Mathematics
- Physics: Electromagnetism, Mechanics, Physics, Thermodynamics, Waves & Oscillations

**Difficulty**:
- Hard: ~424 questions
- Medium: ~116 questions

---

## ✅ Pre-Flight Checklist

Before running replacement:

- [ ] Backup created (`node backup_database.js`)
- [ ] Schema updated (`update_schema_for_physics.sql` run in Supabase)
- [ ] Verified schema has `subject` column
- [ ] Read this guide completely
- [ ] Understand that old questions will be deleted
- [ ] Ready to run `node replace_math_questions.js`

---

**Last Updated**: October 11, 2025
**Total New Math Questions**: 291
**Status**: Ready for Replacement

---

*Always backup before making major changes to your database!*
