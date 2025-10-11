# Complete Database Migration Guide

## 🎯 Overview

This guide will walk you through completely migrating your question database to include:
- **291 Mathematics questions** (replacing 142 old questions)
- **249 Physics questions** (new)
- **Total: 540 questions** with enhanced metadata

---

## 📊 What You'll Get

### Before Migration
- **142 Mathematics questions** (3 topics: Derivatives, Differential Equations, Differentiability)
- **0 Physics questions**
- Limited metadata

### After Migration
- **291 Mathematics questions** (5 chapters: Algebra, Calculus, Combinatorics, Coordinate Geometry, Mathematics)
- **249 Physics questions** (5 chapters: Electromagnetism, Mechanics, Physics, Thermodynamics, Waves & Oscillations)
- **540 total questions**
- Rich metadata: Chapter, Topic, Subtopic, Tags, Strategy (Physics only), Expert Insights (Physics only), Key Facts (Physics only)

---

## 🚀 Step-by-Step Migration

### Step 1: Backup Current Database ⚠️

**IMPORTANT: Always backup before major changes!**

```bash
node backup_database.js
```

This creates a timestamped backup in `./backups/backup_YYYY-MM-DDTHH-MM-SS/`

---

### Step 2: Update Database Schema

Run these SQL scripts **in order** in Supabase SQL Editor:

#### 2.1: Add New Columns for Enhanced Metadata

```sql
-- File: update_schema_for_physics.sql

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

-- Create indexes for new columns
CREATE INDEX IF NOT EXISTS idx_questions_subject ON questions(subject);
CREATE INDEX IF NOT EXISTS idx_questions_chapter ON questions(chapter);
CREATE INDEX IF NOT EXISTS idx_questions_tags ON questions USING GIN(tags);

-- Update existing questions to have subject = 'Mathematics'
UPDATE questions SET subject = 'Mathematics' WHERE subject IS NULL;
```

#### 2.2: Update Question Statistics View

```sql
-- Update view to include subject and chapter
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

#### 2.3: Fix Difficulty Constraint

```sql
-- File: fix_difficulty_constraint.sql
-- Standardize to EASY, MEDIUM, HARD

ALTER TABLE questions
DROP CONSTRAINT IF EXISTS questions_difficulty_check;

ALTER TABLE questions
ADD CONSTRAINT questions_difficulty_check
CHECK (difficulty IN ('EASY', 'MEDIUM', 'HARD'));

-- Update any existing ADVANCED to HARD
UPDATE questions SET difficulty = 'HARD' WHERE difficulty = 'ADVANCED';
```

---

### Step 3: Replace Mathematics Questions

```bash
node replace_math_questions.js
```

**What this does:**
1. Deletes all 142 existing mathematics questions
2. Inserts 291 new mathematics questions
3. Shows statistics and verification

**Expected Output:**
```
🔄 Starting Mathematics question replacement...
Found 142 existing mathematics questions
🗑️  Deleting existing mathematics questions...
✅ Deleted 142 mathematics questions

📚 Loading new mathematics questions...
Found 291 new mathematics questions

📤 Inserting 291 new mathematics questions...
✅ Successfully uploaded 50 questions
...

======================================================================
📊 Replacement Summary:
======================================================================
🗑️  Deleted: 142 old mathematics questions
✅ Inserted: 291 new mathematics questions
======================================================================
```

---

### Step 4: Add Physics Questions

```bash
node migrate_physics_questions.js
```

**What this does:**
1. Checks for existing physics questions (should be 0)
2. Inserts 249 new physics questions
3. Shows statistics and verification

**Expected Output:**
```
🔬 Starting Physics question migration...
📚 Found 249 physics questions in file

🔍 Checking for existing questions...
📊 Found 291 existing questions in database (Mathematics)

📝 249 new questions to insert

📤 Uploading batch 1/5 (50 questions)...
✅ Successfully uploaded 50 questions
...

📊 Migration Summary:
✅ Successfully migrated: 249 questions

📚 Questions by Subject:
  • Mathematics: 291 questions
  • Physics: 249 questions
```

---

### Step 5: Verification

Run these SQL queries in Supabase to verify:

```sql
-- Total question count
SELECT COUNT(*) FROM questions;
-- Should return: 540

-- Count by subject
SELECT subject, COUNT(*)
FROM questions
GROUP BY subject
ORDER BY subject;
-- Should show:
-- Mathematics: 291
-- Physics: 249

-- Count by difficulty
SELECT difficulty, COUNT(*)
FROM questions
GROUP BY difficulty
ORDER BY difficulty;
-- Should show:
-- EASY: (some)
-- MEDIUM: (some)
-- HARD: (most)

-- Mathematics chapters
SELECT chapter, COUNT(*)
FROM questions
WHERE subject = 'Mathematics'
GROUP BY chapter
ORDER BY COUNT(*) DESC;
-- Should show: Algebra, Calculus, Combinatorics, Coordinate Geometry, Mathematics

-- Physics chapters
SELECT chapter, COUNT(*)
FROM questions
WHERE subject = 'Physics'
GROUP BY chapter
ORDER BY COUNT(*) DESC;
-- Should show: Mechanics, Physics, Electromagnetism, Waves and Oscillations, Thermodynamics
```

---

## 📋 Files Involved

### Extraction Scripts
1. **extract_complete_math_questions.py** - Extracts 291 math questions
2. **extract_physics_questions.py** - Extracts 249 physics questions

### Data Files
1. **complete_math_questions.json** - 291 math questions (~914 KB)
2. **physics_questions_with_solutions.json** - 249 physics questions (~1.74 MB)

### Migration Scripts
1. **replace_math_questions.js** - Replaces math questions
2. **migrate_physics_questions.js** - Adds physics questions

### Schema Updates
1. **update_schema_for_physics.sql** - Adds new columns
2. **fix_difficulty_constraint.sql** - Fixes difficulty levels

### Documentation
1. **COMPLETE_MIGRATION_GUIDE.md** - This guide
2. **MATH_REPLACEMENT_GUIDE.md** - Math-specific guide
3. **PHYSICS_MIGRATION_GUIDE.md** - Physics-specific guide

---

## 🗂️ Question Structure

### Mathematics Question Example

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
  "options": {"a": "...", "b": "...", "c": "...", "d": "..."},
  "correct_answer": "d",
  "solution_html": "<div>...</div>",
  "solution_text": "Solution: Step 1: ..."
}
```

### Physics Question Example

```json
{
  "id": "Electromagnetism_1",
  "subject": "Physics",
  "chapter": "Electromagnetism",
  "topic": "Electric Fields",
  "subtopic": "Electric Field and Potential",
  "tags": ["ELECTRIC_FIELDS", "JEE_ADVANCED", "NUMERICAL"],
  "type": "Multiple Choice Single Answer",
  "difficulty": "HARD",
  "question": "A semi-infinite rod lies along...",
  "question_html": "<div>...</div>",
  "options": {"a": "...", "b": "...", "c": "...", "d": "..."},
  "correct_answer": "a",
  "strategy": "Use integration to find the electric field components...",
  "expert_insight": "Expert students recognize this as a classic problem...",
  "key_facts": "dE = k(λdx)/r² for field from element dx...",
  "solution_html": "<div>...</div>",
  "solution_text": "Solution: Strategy: ..."
}
```

---

## 📊 Final Database Statistics

### Total Questions: 540

**Mathematics (291 questions)**
- Algebra: 84
- Calculus: 93
- Combinatorics: 23
- Coordinate Geometry: 52
- Mathematics: 39

**Physics (249 questions)**
- Mechanics: 89
- Physics (General): 69
- Electromagnetism: 55
- Waves and Oscillations: 32
- Thermodynamics: 4

**Difficulty Distribution**
- Hard: ~424 questions
- Medium: ~116 questions
- Easy: ~0 questions

---

## 🔄 Rollback Instructions

If something goes wrong, you can restore from backup:

### Option 1: Restore from Most Recent Backup

```bash
# List backups
ls -lt backups/

# Restore from specific backup
node restore_database.js ./backups/backup_YYYY-MM-DDTHH-MM-SS
```

### Option 2: Manual Restore

1. Go to Supabase Dashboard
2. Navigate to Table Editor → questions
3. Delete all rows
4. Import from backup JSON files

---

## ✅ Post-Migration Checklist

After successful migration:

- [ ] Verify total question count (540)
- [ ] Verify subject distribution (Math: 291, Physics: 249)
- [ ] Test question fetching in application
- [ ] Verify solutions display correctly
- [ ] Test question history tracking still works
- [ ] Create new backup of migrated database
- [ ] Update frontend if needed (subject selection)
- [ ] Update documentation with new question counts

---

## 🚨 Troubleshooting

### Error: "column questions.subject does not exist"
**Solution**: Run `update_schema_for_physics.sql` first

### Error: "violates check constraint questions_difficulty_check"
**Solution**: Run `fix_difficulty_constraint.sql` to update constraint

### Error: "duplicate key violation"
**Solution**: Questions already exist. Check if migration already ran.

### Error: "Failed to delete questions"
**Solution**: Check RLS policies. May need to temporarily disable RLS:
```sql
ALTER TABLE questions DISABLE ROW LEVEL SECURITY;
-- Run migration
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
```

---

## 📞 Support

If you encounter issues:
1. Check the specific guide (MATH_REPLACEMENT_GUIDE.md or PHYSICS_MIGRATION_GUIDE.md)
2. Verify all schema updates were run
3. Check Supabase logs for detailed error messages
4. Ensure backup was created before starting

---

## 🎉 Success!

After completing all steps, you'll have:
- ✅ 540 total questions (almost 4x increase!)
- ✅ Both Mathematics and Physics
- ✅ Rich metadata for better filtering
- ✅ Complete solutions with step-by-step explanations
- ✅ Physics questions with Strategy, Expert Insights, and Key Facts
- ✅ Organized by chapters and topics
- ✅ Comprehensive tag system

---

**Last Updated**: October 11, 2025
**Migration Version**: 1.0
**Status**: Ready for Deployment

---

*Remember to always backup before making database changes!*
