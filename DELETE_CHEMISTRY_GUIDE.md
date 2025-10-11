# Delete Duplicate Chemistry Questions Guide

## Issue

There are 156 Chemistry questions in the database:
- **124 questions** with new format: `Chem_<hash>_Q<num>` (correct format with MD5 hash)
- **32 questions** with old format: `Chemistry_<long_filename>_Q<num>` (duplicates with excessively long IDs)

The old format questions are duplicates from the first insertion attempt before the MD5 hash fix. They need to be removed.

## Solution

Use Supabase SQL Editor to delete only the old format Chemistry questions:

## Step 1: Delete Old Format Chemistry Questions

Go to Supabase SQL Editor and run:

```sql
-- Delete Chemistry questions with old long format (32 questions)
DELETE FROM questions
WHERE subject = 'Chemistry'
  AND external_id LIKE 'Chemistry_%';

-- Verify deletion
SELECT COUNT(*) as remaining_count
FROM questions
WHERE subject = 'Chemistry';
-- Should return 124 (all with Chem_ prefix)

-- Verify no old format remains
SELECT COUNT(*) as old_format_count
FROM questions
WHERE subject = 'Chemistry'
  AND external_id LIKE 'Chemistry_%';
-- Should return 0
```

## Expected Results After Deletion

- **124 Chemistry questions** remain (all with proper Chem_ format)
- **32 duplicate questions** removed (old Chemistry_ format)
- **Total remaining**: 124 questions (83 unique + 41 from duplicated files during testing)
- **2 questions** still missing answers:
  - Chem_d764dfd7_Q3
  - Chem_d764dfd7_Q4

## No Re-insertion Needed

The correct format questions (Chem_ prefix) are already in the database with:
- MD5 hash-based external IDs (8 chars)
- Normalized difficulty levels (Complex/Challenging → HARD)
- Truncated field values to fit varchar(100) constraints

Simply delete the old format duplicates and you're done.

## File Sources

All questions parsed from:
`/Users/Pramod/projects/Selenium/input/IIT-exam-inputs/chemistry/mukherjee/HTML-Selected-Problems`

12 HTML files processed:
- IIT_JEE_Advanced_Ionic_Equilibrium_Challenging_Problems.html (7 questions)
- JEE_Advanced_Chemical_Calculations_Challenging_Problems.html (6 questions)
- JEE_Advanced_Ionic_Equilibrium_Problems.html (8 questions)
- JEE_Advanced_Most_Challenging_Problems_RC_Mukherjee.html (12 questions)
- electrochemistry_advanced_problems.html (5 questions)
- jee_advanced_challenging_problems (1).html (5 questions)
- jee_advanced_challenging_problems.html (9 questions)
- jee_advanced_electrochemistry_problems.html (7 questions)
- jee_advanced_problems (10).html (5 questions)
- jee_advanced_problems (8).html (8 questions)
- jee_advanced_problems (9).html (8 questions)
- rc_mukherjee_electrochemistry_jee_advanced.html (5 questions)

---

**Created**: 2025-01-XX
