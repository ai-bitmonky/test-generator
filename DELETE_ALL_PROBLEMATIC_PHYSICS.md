# Delete All 60 Problematic Physics Questions Guide

## Summary

The script can now parse **60 out of 63 problematic Physics questions** from the HTML file with corrected options and answers. 3 questions were skipped (missing correct answers or options). All 60 questions need to be deleted first due to RLS policies, then re-inserted with corrected data.

## Step 1: Delete All 60 Questions

Go to Supabase SQL Editor and run:

```sql
-- Delete all 60 problematic Physics questions
DELETE FROM questions WHERE external_id IN (
  'Electromagnetism_121', 'Electromagnetism_119', 'Electromagnetism_138', 'Electromagnetism_128', 'Electromagnetism_124',
  'Electromagnetism_123', 'Electromagnetism_108', 'Electromagnetism_107', 'Physics_1', 'Electromagnetism_139',
  'Electromagnetism_132', 'Electromagnetism_131', 'Physics_3', 'Physics_4', 'Electromagnetism_130',
  'Electromagnetism_129', 'Electromagnetism_112', 'Electromagnetism_160', 'Electromagnetism_185', 'Thermodynamics_41',
  'Mechanics_178', 'Mechanics_176', 'Mechanics_175', 'Mechanics_182', 'Mechanics_174',
  'Mechanics_181', 'Mechanics_180', 'Mechanics_183', 'Mechanics_179', 'Mechanics_44',
  'Physics_216', 'Physics_133', 'Physics_214', 'Physics_213', 'Physics_212',
  'Physics_211', 'Physics_149', 'Physics_207', 'Physics_206', 'Physics_210',
  'Physics_205', 'Physics_203', 'Physics_198', 'Physics_208', 'Mechanics_190',
  'Mechanics_187', 'Mechanics_186', 'Mechanics_22', 'Mechanics_21', 'Mechanics_84',
  'Mechanics_87', 'Mechanics_96', 'Mechanics_102', 'Mechanics_144', 'Waves__Oscillations_240',
  'Waves__Oscillations_251', 'Waves__Oscillations_247', 'Waves__Oscillations_36', 'Electromagnetism_167', 'Mechanics_83'
);

-- Verify deletion (should return 0)
SELECT COUNT(*) as remaining FROM questions WHERE external_id IN (
  'Electromagnetism_121', 'Electromagnetism_119', 'Electromagnetism_138', 'Electromagnetism_128', 'Electromagnetism_124',
  'Electromagnetism_123', 'Electromagnetism_108', 'Electromagnetism_107', 'Physics_1', 'Electromagnetism_139',
  'Electromagnetism_132', 'Electromagnetism_131', 'Physics_3', 'Physics_4', 'Electromagnetism_130',
  'Electromagnetism_129', 'Electromagnetism_112', 'Electromagnetism_160', 'Electromagnetism_185', 'Thermodynamics_41',
  'Mechanics_178', 'Mechanics_176', 'Mechanics_175', 'Mechanics_182', 'Mechanics_174',
  'Mechanics_181', 'Mechanics_180', 'Mechanics_183', 'Mechanics_179', 'Mechanics_44',
  'Physics_216', 'Physics_133', 'Physics_214', 'Physics_213', 'Physics_212',
  'Physics_211', 'Physics_149', 'Physics_207', 'Physics_206', 'Physics_210',
  'Physics_205', 'Physics_203', 'Physics_198', 'Physics_208', 'Mechanics_190',
  'Mechanics_187', 'Mechanics_186', 'Mechanics_22', 'Mechanics_21', 'Mechanics_84',
  'Mechanics_87', 'Mechanics_96', 'Mechanics_102', 'Mechanics_144', 'Waves__Oscillations_240',
  'Waves__Oscillations_251', 'Waves__Oscillations_247', 'Waves__Oscillations_36', 'Electromagnetism_167', 'Mechanics_83'
);
```

## Step 2: Insert All 60 Corrected Questions

After deletion, run:

```bash
node insert_problematic_physics.js
```

This will insert all 60 corrected Physics questions from `problematic_physics_questions.html`.

## Expected Results

- **60 Physics questions** updated with corrected options and answers
- **3 questions** skipped (missing correct answers or options in HTML - need manual correction)
- **0 failures** (after SQL deletion)

## Questions Skipped (3 total)

The following 3 questions from the problematic file could not be inserted:
- These questions are missing correct answers or have no valid options in the HTML file
- They need manual correction before insertion

## What This Does

The script parses options from both:
- Standard `.option` divs or list items
- `.options-section` with `<p>` tags (same format as Math questions)

This ensures all question formats are properly parsed.

---

**Created**: 2025-01-11
**Total Questions**: 60 out of 63 (95% coverage)
