# Delete and Re-Insert Problematic Mathematics Questions Guide

## Issue

21 problematic Mathematics questions need to be updated with corrected data from the HTML file. The JavaScript client cannot delete existing records due to Row Level Security (RLS) policies.

## Solution

Use Supabase SQL Editor to delete the existing 21 questions, then run the Node.js script to insert corrected versions.

## Step 1: Delete Existing Problematic Questions

Go to Supabase SQL Editor and run:

```sql
-- Delete the 36 problematic Mathematics questions
DELETE FROM questions WHERE external_id IN (
  'Calculus_295', 'Algebra_220', 'Algebra_246', 'Algebra_245', 'Algebra_244',
  'Algebra_243', 'Algebra_242', 'Algebra_241', 'Algebra_240', 'Algebra_239',
  'Algebra_238', 'Algebra_237', 'Algebra_236', 'Algebra_231', 'Algebra_228',
  'Derivatives_1', 'Calculus_55', 'Mathematics_274',
  'Coordinate_Geometry_45', 'Coordinate_Geometry_52', 'Coordinate_Geometry_53',
  'Circles_23', 'Circles_22', 'Circles_15',
  'Calculus_307', 'Mathematics_277', 'Mathematics_268', 'Mathematics_273',
  'Integration_3', 'Calculus_77', 'jee_advanced_differentiability_solutions_6',
  'Algebra_140', 'Algebra_142', 'Algebra_143',
  'Matrices_14', 'Matrices_11'
);

-- Verify deletion
SELECT COUNT(*) as deleted_count FROM questions WHERE external_id IN (
  'Calculus_295', 'Algebra_220', 'Algebra_246', 'Algebra_245', 'Algebra_244',
  'Algebra_243', 'Algebra_242', 'Algebra_241', 'Algebra_240', 'Algebra_239',
  'Algebra_238', 'Algebra_237', 'Algebra_236', 'Algebra_231', 'Algebra_228',
  'Derivatives_1', 'Calculus_55', 'Mathematics_274',
  'Coordinate_Geometry_45', 'Coordinate_Geometry_52', 'Coordinate_Geometry_53',
  'Circles_23', 'Circles_22', 'Circles_15',
  'Calculus_307', 'Mathematics_277', 'Mathematics_268', 'Mathematics_273',
  'Integration_3', 'Calculus_77', 'jee_advanced_differentiability_solutions_6',
  'Algebra_140', 'Algebra_142', 'Algebra_143',
  'Matrices_14', 'Matrices_11'
);
-- Should return 0
```

## Step 2: Insert Corrected Questions

After deletion, run:

```bash
node insert_problematic_math.js
```

This will insert the 21 corrected Mathematics questions from `problematic_mathematics_questions.html`.

## Expected Results

- **36 Mathematics questions** updated with corrected data (15 new + 21 previous)
- **28 questions** still skipped (no options or missing correct answers)

## Questions Still Skipped (28 total)

The following 28 questions from the problematic file could not be inserted because they lack options:

### Missing Options (28 questions):
- Algebra_225, Algebra_224, Algebra_223, Algebra_222, Algebra_221
- Algebra_219, Algebra_235, Algebra_233, Algebra_234, Algebra_232
- Calculus_125, Calculus_123, Calculus_122, Calculus_121, Calculus_120
- Calculus_119, Calculus_118, Calculus_117, Calculus_116, Calculus_115
- Calculus_114, Calculus_113, Calculus_112, Calculus_129, Calculus_128
- Calculus_127, Calculus_126, Calculus_124

These 28 questions truly have no options in the HTML file and need to be manually corrected with proper options before they can be inserted.

---

**Created**: 2025-01-11
