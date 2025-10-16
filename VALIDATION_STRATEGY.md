# COMPREHENSIVE SINGLE-PASS VALIDATION STRATEGY

## Goal
**Validate each question ONCE for EVERYTHING, fix all issues, then never validate again.**

## Database Schema Changes

```sql
ALTER TABLE questions
ADD COLUMN validated_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN validation_version INTEGER DEFAULT 1,
ADD COLUMN validation_notes TEXT;
```

## Validation Logic (Version 1)

### Complete Validation Checklist

**For each question, check ALL of the following:**

#### 1. Format Validation (NO AI)
- ✓ All 4 options (a, b, c, d) exist and not empty
- ✓ correct_answer is valid (a/b/c/d)
- ✓ Multi-part questions have proper multi-part options

#### 2. Completeness Validation (AI - Haiku)
- ✓ All values/parameters provided
- ✓ Question is solvable with given information
- ✓ No ambiguity or unclear statements
- ✓ Units and notation are clear

#### 3. Solution Validation (AI - Haiku)
- ✓ Solution exists and not empty
- ✓ Solution steps are clear
- ✓ Solution logically leads to correct answer
- ✓ Calculations are correct

#### 4. Figure Validation (AI - Sonnet if needed)
- ✓ If mentions figure/diagram, SVG must exist
- ✓ Generate missing SVGs

#### 5. Text Enrichment (AI - Haiku)
- ✓ strategy field complete
- ✓ expert_insight field complete
- ✓ key_facts field complete
- ✓ All under 100 words

### Auto-Fix Actions

**If issues found, FIX them:**
1. Missing options → Generate from solution
2. Missing solution → Generate from question+answer
3. Incomplete/ambiguous → Rewrite question
4. Multi-part improper → Regenerate multi-part options
5. Missing SVG → Generate diagram
6. Missing enrichment → Generate text

### Mark as Validated

**ONLY mark validated_at when:**
- ✅ ALL format checks pass
- ✅ ALL AI validations pass
- ✅ ALL missing fields generated
- ✅ ALL fixes applied successfully
- ✅ Database update succeeds

## Pipeline Behavior

```javascript
// Fetch ONLY unvalidated questions
const { data } = await supabase
  .from('questions')
  .select('*')
  .eq('subject', subject)
  .is('validated_at', null)  // ← SKIP ALREADY VALIDATED
  .order('id');

// Process each question
for (const question of data) {
  const issues = [];
  const fixes = {};
  
  // 1. Format check
  const formatIssues = validateFormat(question);
  if (formatIssues.length > 0) {
    issues.push(...formatIssues);
    // Apply fixes...
  }
  
  // 2. Completeness check
  const completeness = await verifyCompleteness(question);
  if (!completeness.isComplete) {
    issues.push('incomplete');
    fixes.question_html = await fixQuestion(question);
  }
  
  // 3. Solution check
  const solutionCheck = await verifySolution(question);
  if (!solutionCheck.matchesAnswer) {
    issues.push('solution_mismatch');
    fixes.solution_html = await generateSolution(question);
  }
  
  // 4. Figure check
  if (mentionsFigure(question) && !question.figure_svg) {
    issues.push('missing_figure');
    fixes.figure_svg = await generateSVG(question);
  }
  
  // 5. Enrichment check
  if (!question.strategy) {
    fixes.strategy = await generateStrategy(question);
  }
  // ... same for expert_insight, key_facts
  
  // Apply all fixes
  await supabase
    .from('questions')
    .update({
      ...fixes,
      validated_at: new Date(),
      validation_version: 1,
      validation_notes: issues.join('; ')
    })
    .eq('id', question.id);
}
```

## When to Re-validate

**Version Bump Strategy:**

When validation logic improves:
1. Increment `validation_version` constant to 2
2. Change query: `.or('validation_version.lt.2,validated_at.is.null')`
3. Re-run pipeline on old-version questions

**Example:**
```javascript
const CURRENT_VALIDATION_VERSION = 2;  // ← Increment when logic improves

// Fetch questions needing validation
const { data } = await supabase
  .from('questions')
  .select('*')
  .eq('subject', subject)
  .or(`validated_at.is.null,validation_version.lt.${CURRENT_VALIDATION_VERSION}`)
  .order('id');
```

## Benefits

1. **No duplicate work** - Each question validated once
2. **Fast queries** - Skip validated questions immediately
3. **Audit trail** - Know when/why each question was validated
4. **Version control** - Can re-validate if logic improves
5. **Progress tracking** - Know exactly what's left to validate

## Cost Estimation

For 249 Physics questions (assume 20 need fixing):
- Initial validation: ~249 AI calls (completeness + solution check)
- Fixes: ~20 AI calls (generate options/solutions)
- **Total: ~270 AI calls ≈ $0.30-0.40**

For already-validated questions: **0 AI calls, 0 cost**

## Usage

```bash
# First run - validates all unvalidated questions
node database_enrichment_pipeline.js Physics

# Second run - skips all validated questions
node database_enrichment_pipeline.js Physics  # Processes 0 questions

# After logic improvement (bump version to 2)
node database_enrichment_pipeline.js Physics  # Re-validates only version 1 questions
```

## Current Status

- Physics: 249 total, ~20 need fixing
- Mathematics: 433 total, ~230 need enrichment  
- Chemistry: 124 total, all enriched

**Next Steps:**
1. Run SQL to add validation columns
2. Update database_enrichment_pipeline.js to use validated_at
3. Run complete validation on all subjects once
4. Never validate again (unless logic improves)

## Additional Validation: SVG Content Check

### 6. SVG Content Validation (AI - Haiku)

**Purpose:** Ensure SVG contains ALL question elements but NO solution/answer information

**Checks:**
- ✓ SVG shows ALL elements/components mentioned in question
- ✓ SVG has all labels, values, measurements from question
- ✓ SVG does NOT contain solution steps
- ✓ SVG does NOT show the final answer
- ✓ SVG does NOT have annotations revealing the solution
- ✗ **Invalid:** SVG missing elements from question
- ✗ **Invalid:** SVG with "Answer: C" text
- ✗ **Invalid:** SVG with solution calculations shown
- ✗ **Invalid:** SVG highlighting the correct path/answer

**AI Prompt:**
```
You are validating an SVG diagram for a JEE question.

QUESTION: {question_html}
CORRECT ANSWER: {correct_answer}

SVG CODE: {figure_svg}

Check BOTH requirements:

REQUIREMENT 1: SVG must include ALL elements from question
- All components mentioned (resistors, masses, points, etc.)
- All labels and values given in question
- All dimensions, angles, measurements stated
- Proper structure matching question description

REQUIREMENT 2: SVG must NOT reveal solution
- No solution steps shown
- No final answer displayed
- No highlighting of correct path/answer
- No annotations giving away solution

Respond:
COMPLETE: [YES/NO] - Has all question elements?
MISSING_ELEMENTS: [List any missing, or "None"]
REVEALS_ANSWER: [YES/NO] - Shows solution/answer?
REVEALS_WHAT: [What it reveals, or "None"]
```

**Auto-Fix:**
If SVG reveals answer/solution:
1. Extract the diagram description
2. Regenerate SVG without solution information
3. Keep only the neutral figure

**Example Issues:**

❌ **Bad SVG:**
```svg
<svg>
  <circle cx="100" cy="100" r="50"/>
  <text>Correct path is from A to B</text>
  <path stroke="red" ... /> <!-- highlighting correct answer -->
  <text>Answer: 15 m/s</text>
</svg>
```

✅ **Good SVG:**
```svg
<svg>
  <circle cx="100" cy="100" r="50"/>
  <text>Point A</text>
  <text>Point B</text>
  <!-- Just shows the setup, no solution -->
</svg>
```
