# Comprehensive Question Requirements Checklist

## Core Requirements

### 1. Question Format Requirements ✅

#### Must Have:
- [ ] Complete question statement with clear problem
- [ ] Exactly 4 multiple choice options (A, B, C, D)
- [ ] One correct answer clearly marked
- [ ] Complete solution provided

#### Question Type Validation:
- If question is NOT multiple choice → Convert to multiple choice with 4 options
- For multi-part questions → Expand answer choices to cover all parts OR clearly label which part choices refer to
- Question type must be defined: `Multiple Choice Single Answer`, `Numerical`, `True/False`, etc.

### 2. Solution Requirements ✅

Every solution MUST contain:

#### a) Strategy Section
- **Purpose**: Universal approach to solve ALL similar questions
- **Content**: Concise, step-by-step methodology
- **Format**:
  ```html
  <div class="strategy">
    <strong>Strategy:</strong>
    Brief explanation of the universal approach...
  </div>
  ```

#### b) Expert Insight Section
- **Purpose**: How an exam topper would approach THIS specific problem
- **Content**: Very concise expert tips and shortcuts
- **Format**:
  ```html
  <div class="expert-insight">
    <strong>Expert Insight:</strong>
    What a topper notices first, fastest method, key shortcuts...
  </div>
  ```

#### c) Key Facts Section
- **Purpose**: List ALL formulas/laws/theorems/identities needed
- **Content**: Concise list of mathematical/scientific facts
- **Format**:
  ```html
  <div class="key-facts">
    <strong>Key Facts Used:</strong>
    Formula 1; Law/Theorem 2; Identity 3; etc.
  </div>
  ```

#### d) Step-by-Step Solution
- **Purpose**: Complete detailed solution
- **Content**: Numbered steps with calculations
- **Format**:
  ```html
  <ol class="steps">
    <li><strong>Step 1:</strong> Description and calculation</li>
    <li><strong>Step 2:</strong> Next step...</li>
  </ol>
  ```

### 3. Difficulty Level ✅

Every question MUST be categorized:
- **Simple**: Basic application of concepts
- **Medium**: Requires multiple concepts or moderate complexity
- **Complex**: Multi-step, requires deep understanding, advanced problem-solving

Field: `difficulty` (must be one of: Simple, Medium, Complex)

### 4. Figure/Diagram Requirements ✅

When figure is mentioned in problem statement:

#### Must Provide:
- Accurate SVG diagram embedded in `question_html`
- Figure must contain EXACTLY what's in problem statement (no extra, no less)
- All labels, measurements, and details from problem MUST appear in figure
- Figure should be clear and properly sized

#### Validation Checks:
- [ ] If problem mentions "figure shows", "diagram", "see figure" → SVG must exist
- [ ] SVG must not have "MISSING FIGURE" tag
- [ ] SVG dimensions should be reasonable (not placeholder 100x100)
- [ ] All elements mentioned in problem must appear in figure

### 5. Question Type Definition ✅

#### Type Classification System:

**Goal**: Define stable "archetypes" - well-defined problem types for broad coverage without repetition

**Question Type Must Include**:
1. **Primary Category**:
   - Multiple Choice Single Answer
   - Multiple Choice Multiple Answers
   - Numerical (Integer Type)
   - True/False
   - Match the Following
   - Assertion-Reason

2. **Topic/Archetype**: Specific problem pattern
   - Examples: "Projectile Motion", "Electric Field from Charge Distribution", "Integration by Substitution"

3. **Difficulty**: Simple/Medium/Complex

**Archetype Definition**: Each type has:
- **Stable pattern**: Recognizable problem structure
- **Core concept**: Main concept being tested
- **Solution approach**: General strategy
- **Common variations**: How problem can be modified
- **Key prerequisites**: What student must know

### 6. Multi-Part Question Handling ✅

For questions with multiple parts (a, b, c, etc.):

#### Option A: Expand Choices
```
Question: Find (a) velocity and (b) acceleration

Options:
A. v = 10 m/s, a = 2 m/s²
B. v = 15 m/s, a = 3 m/s²
C. v = 10 m/s, a = 3 m/s²
D. v = 15 m/s, a = 2 m/s²
```

#### Option B: Label Parts
```
Question:
Part (a): Find velocity
Part (b): Find acceleration

Options for Part (a):
A. 10 m/s  B. 15 m/s  C. 20 m/s  D. 25 m/s
[Correct answer for (a): A]

Options for Part (b):
A. 2 m/s²  B. 3 m/s²  C. 4 m/s²  D. 5 m/s²
[Correct answer for (b): A]
```

### 7. Completeness Checks ✅

Every question must pass:

- [ ] Has complete question text
- [ ] Has exactly 4 options (A, B, C, D)
- [ ] Has correct_answer field (a, b, c, or d)
- [ ] Has difficulty level (Simple, Medium, Complex)
- [ ] Has question type defined
- [ ] Has solution with all 4 required sections
- [ ] If figure mentioned → has proper SVG
- [ ] Solution Strategy is universal (applies to similar questions)
- [ ] Expert Insight is specific to THIS problem
- [ ] Key Facts lists ALL formulas/laws/theorems needed
- [ ] Steps are numbered and complete

## Validation Pipeline Enhancement

### New Validation Agents Needed:

1. **QuestionFormatValidator**
   - Checks if question is multiple choice
   - Validates exactly 4 options exist
   - Checks multi-part handling

2. **DifficultyValidator**
   - Validates difficulty field exists
   - Must be: Simple, Medium, or Complex

3. **SolutionCompletenessValidator**
   - Validates all 4 sections exist
   - Checks Strategy is universal
   - Checks Expert Insight is specific
   - Checks Key Facts lists formulas/laws/theorems
   - Validates numbered steps

4. **FigureAccuracyValidator**
   - When figure mentioned → validates SVG exists
   - Checks SVG is not placeholder
   - Validates all problem elements appear in figure

5. **ArchetypeValidator**
   - Validates question has well-defined type
   - Checks type is stable and recognizable
   - Ensures no duplicate archetypes

### New Fix Agents Needed:

1. **QuestionFormatFixer**
   - Converts non-MCQ to multiple choice
   - Creates 4 plausible options
   - Handles multi-part questions

2. **DifficultyFixer**
   - Analyzes question complexity
   - Assigns appropriate difficulty level

3. **SolutionCompletenessFixer**
   - Adds missing Strategy (universal)
   - Adds missing Expert Insight (specific)
   - Adds missing Key Facts
   - Structures solution with numbered steps

4. **FigureFixer**
   - Creates placeholder note for missing figures
   - Validates figure completeness

5. **ArchetypeFixer**
   - Suggests appropriate question type/archetype
   - Adds classification metadata

## Database Schema Requirements

Ensure these fields exist:

```sql
questions table:
- question (TEXT) -- Question statement
- question_html (TEXT) -- Question with HTML/SVG
- option_a (TEXT)
- option_b (TEXT)
- option_c (TEXT)
- option_d (TEXT)
- correct_answer (TEXT) -- 'a', 'b', 'c', or 'd'
- solution_html (TEXT) -- Complete solution
- difficulty (TEXT) -- 'Simple', 'Medium', 'Complex'
- question_type (TEXT) -- Type definition
- archetype (TEXT) -- Problem pattern/archetype
- topic (TEXT) -- Subject topic
- subject (TEXT) -- Math/Physics/Chemistry
```

## Quality Standards

### Minimum Acceptable Quality:

1. **Question**: Clear, unambiguous, grammatically correct
2. **Options**: All plausible, properly formatted, no obvious giveaways
3. **Solution**:
   - Strategy applies to similar questions
   - Expert Insight specific to this problem
   - Key Facts complete and accurate
   - Steps clear and complete
4. **Figure**: Accurate representation matching problem statement
5. **Difficulty**: Appropriate classification
6. **Type**: Well-defined archetype

### Red Flags (Must Fix):

- ❌ Non-MCQ format
- ❌ Less than 4 options
- ❌ No difficulty level
- ❌ Missing any solution section
- ❌ Figure mentioned but missing
- ❌ No question type defined
- ❌ Ambiguous or unclear text
- ❌ Multi-part without proper handling
- ❌ Strategy too specific (not universal)
- ❌ Expert Insight too generic
- ❌ Key Facts incomplete

## Implementation Priority

### Phase 1: Critical Requirements (Immediate)
1. ✅ Ensure all questions are multiple choice with 4 options
2. ✅ Add difficulty level to all questions
3. ✅ Ensure all 4 solution sections exist
4. ✅ Fix multi-part question formatting

### Phase 2: Quality Enhancement
1. Improve strategy sections (make universal)
2. Enhance expert insights (make specific)
3. Complete key facts (ensure all formulas listed)
4. Add/fix figures where needed

### Phase 3: Classification
1. Define archetypes for each subject
2. Classify all questions by archetype
3. Ensure no duplicate archetypes
4. Add archetype metadata

## Success Metrics

Pipeline should achieve:
- ✅ 100% questions have 4 options
- ✅ 100% questions have correct_answer
- ✅ 100% questions have difficulty level
- ✅ 100% questions have complete solution (all 4 sections)
- ✅ 100% questions with figure reference have SVG
- ✅ 100% questions have defined type/archetype
- ✅ 0% ambiguous or incomplete questions
- ✅ 0% missing required fields
