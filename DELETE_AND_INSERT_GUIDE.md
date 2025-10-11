# Delete and Insert Excluded Questions Guide

## Issue

The 42 excluded questions with corrected answers cannot be inserted via the Supabase JavaScript client due to:
1. Duplicate key constraint violations
2. Row Level Security (RLS) policies preventing bulk deletes
3. Potential transaction/caching issues

## Solution

Use Supabase SQL Editor to:
1. Delete the 42 existing questions by `external_id`
2. Then run the Node.js script to insert the corrected versions

## Step 1: Delete Existing Questions

Go to Supabase SQL Editor and run:

```sql
-- Delete the 42 excluded questions that need to be re-inserted with corrected data

-- Mathematics (32 questions)
DELETE FROM questions WHERE external_id IN (
  'Algebra_130', 'Algebra_131', 'Algebra_133', 'Algebra_141',
  'Coordinate_Geometry_192', 'Coordinate_Geometry_193', 'Coordinate_Geometry_195',
  'Coordinate_Geometry_196', 'Coordinate_Geometry_197', 'Coordinate_Geometry_198',
  'Calculus_200', 'Calculus_201', 'Calculus_203', 'Calculus_204',
  'Calculus_206', 'Calculus_208', 'Calculus_211', 'Calculus_213',
  'Mathematics_280', 'Mathematics_289',
  'Calculus_292', 'Calculus_293', 'Calculus_296', 'Calculus_298',
  'Calculus_300', 'Calculus_301', 'Calculus_302', 'Calculus_303',
  'Calculus_305', 'Calculus_306', 'Calculus_308', 'Calculus_309'
);

-- Physics (10 questions)
DELETE FROM questions WHERE external_id IN (
  'Mechanics_42', 'Mechanics_43', 'Mechanics_47', 'Mechanics_58',
  'Mechanics_93', 'Physics_150', 'Physics_151',
  'Mechanics_173', 'Mechanics_177', 'Physics_204'
);

-- Verify deletion
SELECT COUNT(*) as deleted_count FROM questions WHERE external_id IN (
  'Algebra_130', 'Algebra_131', 'Algebra_133', 'Algebra_141',
  'Coordinate_Geometry_192', 'Coordinate_Geometry_193', 'Coordinate_Geometry_195',
  'Coordinate_Geometry_196', 'Coordinate_Geometry_197', 'Coordinate_Geometry_198',
  'Calculus_200', 'Calculus_201', 'Calculus_203', 'Calculus_204',
  'Calculus_206', 'Calculus_208', 'Calculus_211', 'Calculus_213',
  'Mathematics_280', 'Mathematics_289',
  'Calculus_292', 'Calculus_293', 'Calculus_296', 'Calculus_298',
  'Calculus_300', 'Calculus_301', 'Calculus_302', 'Calculus_303',
  'Calculus_305', 'Calculus_306', 'Calculus_308', 'Calculus_309',
  'Mechanics_42', 'Mechanics_43', 'Mechanics_47', 'Mechanics_58',
  'Mechanics_93', 'Physics_150', 'Physics_151',
  'Mechanics_173', 'Mechanics_177', 'Physics_204'
);
-- Should return 0
```

## Step 2: Insert Corrected Questions

After deletion, run:

```bash
node insert_from_corrected_html.js
```

This will insert the 42 questions with corrected answers from the HTML files.

## Expected Results

- **32 Mathematics questions** updated with correct answers
- **10 Physics questions** updated with correct answers
- **8 questions** still missing answers (need manual review in HTML files):
  - Mathematics: Calculus_199, Algebra_226, Algebra_227, Algebra_229, Algebra_230, Calculus_297
  - Physics: Physics_2, Physics_5

## Notes

- The corrected answers are parsed from the HTML files where they appear as "✅ Correct Answer: (a)"
- Questions without correct answers in HTML are skipped
- All metadata (topic, chapter, difficulty, tags) is extracted from the HTML structure

---

**Last Updated**: {{DATE}}
