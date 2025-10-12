# Delete All 64 Problematic Mathematics Questions Guide

## Summary

The script can now parse **ALL 64 problematic Mathematics questions** from the HTML file with corrected options and answers. All questions need to be deleted first due to RLS policies, then re-inserted with corrected data.

## Step 1: Delete All 64 Questions

Go to Supabase SQL Editor and run:

```sql
-- Delete all 64 problematic Mathematics questions
DELETE FROM questions WHERE external_id IN (
  'Calculus_295', 'Algebra_220', 'Algebra_246', 'Algebra_245', 'Algebra_244',
  'Algebra_243', 'Algebra_242', 'Algebra_241', 'Algebra_240', 'Algebra_239',
  'Algebra_238', 'Algebra_237', 'Algebra_236', 'Algebra_231', 'Algebra_228',
  'Algebra_225', 'Algebra_224', 'Algebra_223', 'Algebra_222', 'Algebra_221',
  'Algebra_219', 'Algebra_235', 'Algebra_233', 'Algebra_234', 'Algebra_232',
  'Calculus_125', 'Calculus_123', 'Calculus_122', 'Calculus_121', 'Calculus_120',
  'Calculus_119', 'Calculus_118', 'Calculus_117', 'Calculus_116', 'Calculus_115',
  'Calculus_114', 'Calculus_113', 'Calculus_112', 'Calculus_129', 'Calculus_128',
  'Calculus_127', 'Calculus_126', 'Calculus_124', 'Derivatives_1', 'Calculus_55',
  'Mathematics_274', 'Coordinate_Geometry_45', 'Coordinate_Geometry_52', 'Coordinate_Geometry_53', 'Circles_23',
  'Circles_22', 'Circles_15', 'Calculus_307', 'Mathematics_277', 'Mathematics_268',
  'Mathematics_273', 'Integration_3', 'Calculus_77', 'jee_advanced_differentiability_solutions_6', 'Algebra_140',
  'Algebra_142', 'Algebra_143', 'Matrices_14', 'Matrices_11'
);

-- Verify deletion (should return 0)
SELECT COUNT(*) as remaining FROM questions WHERE external_id IN (
  'Calculus_295', 'Algebra_220', 'Algebra_246', 'Algebra_245', 'Algebra_244',
  'Algebra_243', 'Algebra_242', 'Algebra_241', 'Algebra_240', 'Algebra_239',
  'Algebra_238', 'Algebra_237', 'Algebra_236', 'Algebra_231', 'Algebra_228',
  'Algebra_225', 'Algebra_224', 'Algebra_223', 'Algebra_222', 'Algebra_221',
  'Algebra_219', 'Algebra_235', 'Algebra_233', 'Algebra_234', 'Algebra_232',
  'Calculus_125', 'Calculus_123', 'Calculus_122', 'Calculus_121', 'Calculus_120',
  'Calculus_119', 'Calculus_118', 'Calculus_117', 'Calculus_116', 'Calculus_115',
  'Calculus_114', 'Calculus_113', 'Calculus_112', 'Calculus_129', 'Calculus_128',
  'Calculus_127', 'Calculus_126', 'Calculus_124', 'Derivatives_1', 'Calculus_55',
  'Mathematics_274', 'Coordinate_Geometry_45', 'Coordinate_Geometry_52', 'Coordinate_Geometry_53', 'Circles_23',
  'Circles_22', 'Circles_15', 'Calculus_307', 'Mathematics_277', 'Mathematics_268',
  'Mathematics_273', 'Integration_3', 'Calculus_77', 'jee_advanced_differentiability_solutions_6', 'Algebra_140',
  'Algebra_142', 'Algebra_143', 'Matrices_14', 'Matrices_11'
);
```

## Step 2: Insert All 64 Corrected Questions

After deletion, run:

```bash
node insert_problematic_math.js
```

This will insert all 64 corrected Mathematics questions from `problematic_mathematics_questions.html`.

## Expected Results

- **64 Mathematics questions** updated with corrected options and answers
- **0 questions** skipped (all have valid options and correct answers now)
- **0 failures** (after SQL deletion)

## What Changed

The script was updated to parse options from `.options-section` with `<p>` tags, which is the format used for these problematic questions. Previously it only looked for `.option` divs or list items.

---

**Created**: 2025-01-11
**Total Questions**: 64 (all problematic Math questions from the HTML file)
