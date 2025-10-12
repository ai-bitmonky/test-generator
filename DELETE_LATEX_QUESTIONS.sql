-- ============================================================================
-- Delete LaTeX Questions from Database
-- ============================================================================
-- Purpose: Delete 51 questions (43 Math + 8 Physics) with LaTeX issues
--          so they can be re-inserted with corrected LaTeX from HTML files
-- Date: 2025-10-12
-- ============================================================================

-- Step 1: Delete 43 Mathematics questions with LaTeX issues
-- These will be re-inserted from latex_corrections_mathematics.html
DELETE FROM questions WHERE external_id IN (
  'Mathematics_277',
  'Mathematics_283',
  'Mathematics_279',
  'Mathematics_271',
  'Mathematics_265',
  'Mathematics_266',
  'Mathematics_267',
  'Mathematics_268',
  'Mathematics_269',
  'Mathematics_270',
  'Mathematics_273',
  'Mathematics_274',
  'Mathematics_291',
  'Mathematics_275',
  'Mathematics_276',
  'Mathematics_278',
  'Mathematics_290',
  'Mathematics_288',
  'Mathematics_287',
  'Mathematics_286',
  'Mathematics_285',
  'Mathematics_284',
  'Mathematics_282',
  'Mathematics_272',
  'Mathematics_281',
  'Calculus_125',
  'Calculus_123',
  'Calculus_122',
  'Calculus_121',
  'Calculus_120',
  'Calculus_119',
  'Calculus_118',
  'Calculus_117',
  'Calculus_116',
  'Calculus_115',
  'Calculus_114',
  'Calculus_113',
  'Calculus_112',
  'Calculus_129',
  'Calculus_128',
  'Calculus_127',
  'Calculus_126',
  'Calculus_124'
);

-- Step 2: Delete 8 Physics questions with LaTeX issues
-- These will be re-inserted from latex_corrections_physics.html
DELETE FROM questions WHERE external_id IN (
  'Electromagnetism_172',
  'Physics_1',
  'Electromagnetism_217',
  'Electromagnetism_218',
  'Electromagnetism_219',
  'Electromagnetism_220',
  'Physics_213',
  'Physics_212'
);

-- Step 3: Verify deletion (should return 0)
SELECT COUNT(*) as remaining_latex_questions
FROM questions
WHERE external_id IN (
  -- Mathematics
  'Mathematics_277', 'Mathematics_283', 'Mathematics_279', 'Mathematics_271',
  'Mathematics_265', 'Mathematics_266', 'Mathematics_267', 'Mathematics_268',
  'Mathematics_269', 'Mathematics_270', 'Mathematics_273', 'Mathematics_274',
  'Mathematics_291', 'Mathematics_275', 'Mathematics_276', 'Mathematics_278',
  'Mathematics_290', 'Mathematics_288', 'Mathematics_287', 'Mathematics_286',
  'Mathematics_285', 'Mathematics_284', 'Mathematics_282', 'Mathematics_272',
  'Mathematics_281', 'Calculus_125', 'Calculus_123', 'Calculus_122',
  'Calculus_121', 'Calculus_120', 'Calculus_119', 'Calculus_118',
  'Calculus_117', 'Calculus_116', 'Calculus_115', 'Calculus_114',
  'Calculus_113', 'Calculus_112', 'Calculus_129', 'Calculus_128',
  'Calculus_127', 'Calculus_126', 'Calculus_124',
  -- Physics
  'Electromagnetism_172', 'Physics_1', 'Electromagnetism_217',
  'Electromagnetism_218', 'Electromagnetism_219', 'Electromagnetism_220',
  'Physics_213', 'Physics_212'
);

-- ============================================================================
-- After running this SQL:
-- 1. Run: node insert_from_corrected_html.js latex_corrections_mathematics.html
-- 2. Run: node insert_from_corrected_html.js latex_corrections_physics.html
-- ============================================================================
-- Expected Result: 51 questions deleted and re-inserted with corrected LaTeX
-- ============================================================================
