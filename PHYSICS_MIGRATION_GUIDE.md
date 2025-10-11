# Physics Questions Migration Guide

## Overview

This guide explains how to add the 249 IIT JEE Physics questions with complete metadata to your database.

---

## ✅ What Was Extracted

### Question Count
- **249 Physics Questions** successfully extracted
- Original HTML file had 264 questions, 249 were successfully parsed

### Chapters Distribution
- **Electromagnetism**: 55 questions
- **Mechanics**: 89 questions
- **Physics** (General): 69 questions
- **Thermodynamics**: 4 questions
- **Waves and Oscillations**: 32 questions

### Difficulty Distribution
- **Hard**: 212 questions
- **Medium**: 37 questions

---

## 📊 Enhanced Metadata

Each physics question includes comprehensive metadata not present in maths questions:

### Core Question Data
- `id` - Unique identifier (e.g., "Electromagnetism_1")
- `subject` - "Physics"
- `chapter` - Main chapter (e.g., "Electromagnetism", "Mechanics")
- `topic` - Specific topic (e.g., "Electric Fields")
- `subtopic` - Detailed subtopic (e.g., "Electric Field and Potential")
- `difficulty` - EASY / MEDIUM / HARD
- `type` - Question type (e.g., "Multiple Choice Single Answer")

### Question Content
- `question` - Plain text question
- `question_html` - HTML formatted question with figures/SVGs
- `options` - Object with keys a, b, c, d
- `correct_answer` - Correct option (a/b/c/d)

### Enhanced Solution Metadata
- `strategy` - Problem-solving approach and methodology
- `expert_insight` - Expert tips and insights for solving
- `key_facts` - Key formulas, laws, theorems, and equations used
- `solution_html` - Complete step-by-step solution with HTML formatting
- `solution_text` - Plain text version of solution

### Additional Metadata
- `tags` - Array of tags (e.g., ["ELECTRIC_FIELDS", "JEE_ADVANCED", "NUMERICAL"])

---

## 🗄️ Database Schema Updates

### Step 1: Update Schema

You need to run the schema update to add new columns for physics metadata:

```bash
# In Supabase SQL Editor, run:
update_schema_for_physics.sql
```

This adds the following columns to the `questions` table:
- `subject` VARCHAR(50) - "Mathematics" or "Physics"
- `chapter` VARCHAR(255) - Chapter name
- `subtopic` VARCHAR(255) - Subtopic details
- `tags` JSONB - Array of tags
- `question_type` VARCHAR(100) - Type of question
- `question_html` TEXT - HTML version of question
- `strategy` TEXT - Problem-solving strategy
- `expert_insight` TEXT - Expert insights
- `key_facts` TEXT - Key formulas/laws/theorems

### Indexes Created
- `idx_questions_subject` - On subject column
- `idx_questions_chapter` - On chapter column
- `idx_questions_tags` - GIN index on tags JSONB

### View Updated
- `question_stats` view now includes subject and chapter

---

## 🚀 Migration Process

### Prerequisites
1. ✅ Schema updated in Supabase (run `update_schema_for_physics.sql`)
2. ✅ Questions extracted (done - `physics_questions_with_solutions.json`)
3. ✅ Environment variables configured in `.env.local`

### Run Migration

```bash
node migrate_physics_questions.js
```

### What the Migration Does

1. **Reads** `physics_questions_with_solutions.json`
2. **Checks** for existing questions (no duplicates)
3. **Transforms** data to match database schema
4. **Inserts** in batches of 50 questions
5. **Reports** success/failure statistics
6. **Displays** updated question statistics

### Expected Output

```
🔬 Starting Physics question migration...

📚 Found 249 physics questions in file

🔍 Checking for existing questions...
📊 Found 142 existing questions in database

📝 249 new questions to insert

📤 Uploading batch 1/5 (50 questions)...
✅ Successfully uploaded 50 questions
...

📊 Migration Summary:
✅ Successfully migrated: 249 questions

📈 Question Statistics:
Subject      Chapter/Topic           Difficulty  Count
────────────────────────────────────────────────────────
Mathematics  Derivatives             MEDIUM      20
Mathematics  Differential Equations  MEDIUM      19
...
Physics      Electromagnetism        HARD        55
Physics      Mechanics               HARD        89
...

📚 Questions by Subject:
  • Mathematics: 142 questions
  • Physics: 249 questions
```

---

## 📝 Data Structure Example

### Sample Physics Question

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
  "question": "A semi-infinite rod lies along positive x-axis...",
  "question_html": "<div>...</div>",
  "options": {
    "a": "Angle = 45° with rod, independent of R",
    "b": "Angle = 60° with rod, depends on R",
    "c": "Angle = 45° with rod, depends on R",
    "d": "Angle = 30° with rod, independent of R"
  },
  "correct_answer": "a",
  "strategy": "Use integration to find the electric field components...",
  "expert_insight": "Expert students recognize this as a classic electrostatics problem...",
  "key_facts": "dE = k(λdx)/r² for field from element dx; Geometric relations: r² = x² + R²...",
  "solution_html": "<div class='solution'>...</div>",
  "solution_text": "Solution:\nStrategy: ...\nExpert Insight: ...\nKey Facts Used: ..."
}
```

---

## 🎯 Using Physics Questions in the App

### Frontend Updates Needed

To fully utilize physics questions, you'll need to update the frontend:

#### 1. Subject Selection

Add subject selection step before exam selection:

```javascript
// After user selects IIT-JEE Advance
const [selectedSubject, setSelectedSubject] = useState(null)

// Add subject selection screen
{!selectedSubject && (
  <div>
    <button onClick={() => setSelectedSubject('Mathematics')}>
      Mathematics
    </button>
    <button onClick={() => setSelectedSubject('Physics')}>
      Physics
    </button>
  </div>
)}
```

#### 2. Question Fetching

Update API call to include subject filter:

```javascript
const response = await fetch(`/api/questions?` + new URLSearchParams({
  subject: selectedSubject,  // 'Mathematics' or 'Physics'
  topics: selectedTopics.join(','),
  difficulty: selectedDifficulties.join(','),
  count: numQuestions.toString(),
  strategy: strategy
}), {
  headers: {
    'Authorization': `Bearer ${session.access_token}`
  }
});
```

#### 3. Display Enhanced Metadata

Show additional physics metadata in question display:

```javascript
{question.strategy && (
  <div className="strategy">
    <strong>Strategy:</strong> {question.strategy}
  </div>
)}

{question.expert_insight && (
  <div className="expert-insight">
    <strong>Expert Insight:</strong> {question.expert_insight}
  </div>
)}

{question.key_facts && (
  <div className="key-facts">
    <strong>Key Facts:</strong> {question.key_facts}
  </div>
)}
```

#### 4. Update API Routes

Modify `/api/questions/route.js` to filter by subject:

```javascript
let query = supabase
  .from('questions')
  .select('*');

// Add subject filter
if (subject) {
  query = query.eq('subject', subject);
}

// Rest of filtering...
```

---

## 🔍 Verification

### Check Migration Success

After migration, verify in Supabase:

```sql
-- Count total questions
SELECT COUNT(*) FROM questions;
-- Should be 391 (142 math + 249 physics)

-- Count by subject
SELECT subject, COUNT(*)
FROM questions
GROUP BY subject;

-- Count physics by chapter
SELECT chapter, COUNT(*)
FROM questions
WHERE subject = 'Physics'
GROUP BY chapter
ORDER BY COUNT(*) DESC;

-- Check metadata completeness
SELECT
  COUNT(*) FILTER (WHERE strategy != '') as with_strategy,
  COUNT(*) FILTER (WHERE expert_insight != '') as with_insight,
  COUNT(*) FILTER (WHERE key_facts != '') as with_key_facts
FROM questions
WHERE subject = 'Physics';
```

---

## 📦 Files Created

1. **extract_physics_questions.py** - Extraction script
   - Parses HTML file
   - Extracts all metadata
   - Creates JSON file

2. **physics_questions_with_solutions.json** - Extracted data
   - 249 questions
   - ~1.74 MB file size
   - Complete with all metadata

3. **update_schema_for_physics.sql** - Schema updates
   - Adds new columns
   - Creates indexes
   - Updates views

4. **migrate_physics_questions.js** - Migration script
   - Uploads to Supabase
   - Batch processing
   - Duplicate prevention
   - Statistics reporting

5. **PHYSICS_MIGRATION_GUIDE.md** - This guide

---

## 🎓 Benefits of Enhanced Metadata

### For Students
- **Strategy** - Understand the approach to solve problems
- **Expert Insight** - Learn from expert problem-solving techniques
- **Key Facts** - Quick reference to formulas and laws needed
- **Tags** - Filter questions by concepts

### For Teachers
- Create targeted practice sets using tags
- Focus on specific problem-solving strategies
- Track which formulas/concepts students struggle with

### For the Application
- Better question filtering and search
- More personalized question recommendations
- Enhanced analytics on student performance by concept

---

## 🚨 Important Notes

### Before Migration
- ✅ Backup your existing database first!
- ✅ Run `update_schema_for_physics.sql` in Supabase
- ✅ Test with a few questions first if concerned

### After Migration
- ✅ Verify question count (should be 391 total)
- ✅ Check subject distribution
- ✅ Test fetching questions by subject
- ✅ Update frontend to use new subject filter

### Known Issues
- Some questions may have empty strategy/insight/key_facts (this is OK)
- Difficulty is mostly "HARD" for physics questions (from original data)
- Question HTML may contain SVG diagrams (preserved in question_html field)

---

## 📊 Statistics

### Current Database State (After Migration)

**Total Questions**: 391
- Mathematics: 142 questions
- Physics: 249 questions

**Physics Chapters**:
- Mechanics: 89 questions (largest)
- Physics (General): 69 questions
- Electromagnetism: 55 questions
- Waves and Oscillations: 32 questions
- Thermodynamics: 4 questions

**Difficulty Levels**:
- Hard: ~250 questions
- Medium: ~140 questions

---

## 🔄 Rollback Plan

If you need to remove physics questions:

```sql
-- Remove all physics questions
DELETE FROM questions WHERE subject = 'Physics';

-- Verify
SELECT COUNT(*) FROM questions;
-- Should be back to 142 (math questions only)
```

---

## 📞 Next Steps

1. **Run Schema Update**
   ```bash
   # In Supabase SQL Editor
   Run: update_schema_for_physics.sql
   ```

2. **Run Migration**
   ```bash
   node migrate_physics_questions.js
   ```

3. **Update Frontend**
   - Add subject selection
   - Update API calls
   - Display enhanced metadata

4. **Test Thoroughly**
   - Generate physics tests
   - Verify all metadata displays correctly
   - Check question history tracking works

5. **Update Documentation**
   - Update PROJECT_REQUIREMENTS.md
   - Document physics question features
   - Update API documentation

---

**Last Updated**: October 11, 2025
**Total Questions**: 249 Physics Questions
**Status**: Ready for Migration

---

*Remember to backup your database before running the migration!*
