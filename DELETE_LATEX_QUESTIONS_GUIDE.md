# Delete LaTeX Questions Before Re-insertion

## Purpose
Delete 33 questions with LaTeX issues so they can be re-inserted with corrected LaTeX delimiters.

## Step 1: Delete via Supabase SQL Editor

Go to Supabase SQL Editor and run:

```sql
-- Delete 25 Mathematics questions with LaTeX issues
DELETE FROM questions WHERE external_id IN (
  'Mathematics_277', 'Mathematics_283', 'Mathematics_279', 'Mathematics_271',
  'Mathematics_265', 'Mathematics_266', 'Mathematics_267', 'Mathematics_268',
  'Mathematics_269', 'Mathematics_270', 'Mathematics_273', 'Mathematics_274',
  'Mathematics_291', 'Mathematics_275', 'Mathematics_276', 'Mathematics_278',
  'Mathematics_290', 'Mathematics_288', 'Mathematics_287', 'Mathematics_286',
  'Mathematics_285', 'Mathematics_284', 'Mathematics_282', 'Mathematics_272',
  'Mathematics_281'
);

-- Delete 8 Physics questions with LaTeX issues
DELETE FROM questions WHERE external_id IN (
  'Electromagnetism_172', 'Physics_1', 'Electromagnetism_217', 'Electromagnetism_218',
  'Electromagnetism_219', 'Electromagnetism_220', 'Physics_213', 'Physics_212'
);

-- Verify deletion (should return 0)
SELECT COUNT(*) as remaining_count FROM questions WHERE external_id IN (
  'Mathematics_277', 'Mathematics_283', 'Mathematics_279', 'Mathematics_271',
  'Mathematics_265', 'Mathematics_266', 'Mathematics_267', 'Mathematics_268',
  'Mathematics_269', 'Mathematics_270', 'Mathematics_273', 'Mathematics_274',
  'Mathematics_291', 'Mathematics_275', 'Mathematics_276', 'Mathematics_278',
  'Mathematics_290', 'Mathematics_288', 'Mathematics_287', 'Mathematics_286',
  'Mathematics_285', 'Mathematics_284', 'Mathematics_282', 'Mathematics_272',
  'Mathematics_281', 'Electromagnetism_172', 'Physics_1', 'Electromagnetism_217',
  'Electromagnetism_218', 'Electromagnetism_219', 'Electromagnetism_220',
  'Physics_213', 'Physics_212'
);
```

## Step 2: Re-insert with Corrected LaTeX

After SQL deletion completes, run:

```bash
node update_latex_correct_format.js
```

## Expected Results

- **33 questions** deleted (25 Math + 8 Physics)
- **33 questions** re-inserted with corrected LaTeX delimiters
- **18 Math questions** skipped (no options - need manual correction)
- **0 failures**

All questions will have LaTeX properly formatted (`\$` → `$`, `\(` → `$`)

---

**Note**: The 18 skipped Mathematics questions (Calculus_125 through Calculus_124) have empty options in the HTML file and need to be corrected manually before insertion.

**Created:** 2025-10-12
