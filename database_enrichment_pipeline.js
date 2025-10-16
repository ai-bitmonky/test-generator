/**
 * ═══════════════════════════════════════════════════════════════════════════
 * DATABASE ENRICHMENT PIPELINE - COMPLETE VERSION
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * PURPOSE: Fix EXISTING questions in database by adding ALL missing enrichment content
 *
 * USAGE: node database_enrichment_pipeline.js <subject>
 *
 * ALL FEATURES INCLUDED:
 * ✅ Question validation (options, answer key, multi-part questions)
 * ✅ Completeness verification (no ambiguity, all data provided)
 * ✅ Solution verification (matches correct answer)
 * ✅ Text enrichment (strategy, expert_insight, key_facts)
 * ✅ SVG generation for questions mentioning figures/diagrams
 * ✅ 100-word limits with auto-condensing
 * ✅ HTML entity cleanup in options
 * ✅ Combined word separation
 * ✅ Figure warning removal
 * ✅ Progress tracking and error handling
 * ✅ Rate limiting (6 seconds between API calls)
 *
 * IMPORTANT: This pipeline is designed for DATABASE CLEANUP ONLY
 * ⚠️  DO NOT use for PDF import!
 * ⚠️  For PDF import, use: pdf_import_pipeline.js
 *
 * WORKFLOW:
 * 1. Fetch existing questions from database
 * 2. Filter questions needing any enrichment
 * 3. Generate missing strategy, expert_insight, key_facts
 * 4. Generate SVG diagrams for questions mentioning figures
 * 5. Clean up HTML entities and text formatting
 * 6. Update database records
 * 7. Report statistics
 *
 * ═══════════════════════════════════════════════════════════════════════════
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

// IMPORTANT: Use SERVICE_ROLE_KEY for database updates
// The ANON_KEY is read-only due to RLS policies
if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ ERROR: SUPABASE_SERVICE_ROLE_KEY not found in .env.local');
  console.error('');
  console.error('💡 To fix this:');
  console.error('   1. Go to your Supabase project dashboard');
  console.error('   2. Navigate to Settings > API');
  console.error('   3. Copy the "service_role" key (NOT the anon key)');
  console.error('   4. Add to .env.local: SUPABASE_SERVICE_ROLE_KEY=your_key_here');
  console.error('');
  console.error('⚠️  WARNING: The service role key bypasses RLS. Keep it secret!');
  process.exit(1);
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const CONFIG = {
  subject: process.argv[2] || 'Mathematics',
  claudeApiKey: process.env.ANTHROPIC_API_KEY,
  claudeModel: 'claude-3-haiku-20240307',
  baseDelay: 6000, // 6 seconds between calls
  batchSize: 50, // Process 50 questions at a time
  maxWords: 100, // Maximum words for each enrichment field
  validationVersion: 1, // Increment to re-validate all questions
};

// ============================================================================
// Claude AI Helper with ALL Features
// ============================================================================

class ClaudeAI {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.baseURL = 'https://api.anthropic.com/v1/messages';
  }

  async call(prompt, maxTokens = 2000, retries = 5) {
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const response = await fetch(this.baseURL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': this.apiKey,
            'anthropic-version': '2023-06-01',
          },
          body: JSON.stringify({
            model: CONFIG.claudeModel,
            max_tokens: maxTokens,
            messages: [{ role: 'user', content: prompt }]
          })
        });

        if (!response.ok) {
          const errorText = await response.text();
          const isRateLimit = errorText.includes('rate_limit_error');

          if (isRateLimit && attempt < retries) {
            const waitTime = 15000 * attempt;
            console.error(`   ⚠️  Rate limit, waiting ${waitTime/1000}s...`);
            await new Promise(resolve => setTimeout(resolve, waitTime));
            continue;
          }
          return null;
        }

        const data = await response.json();
        return data.content[0].text;
      } catch (error) {
        if (attempt < retries) {
          const waitTime = 15000 * attempt;
          console.error(`   ⚠️  Error, retrying in ${waitTime/1000}s...`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
          continue;
        }
        return null;
      }
    }
    return null;
  }

  async condenseText(text, fieldName, maxWords) {
    const words = text.trim().split(/\s+/);
    if (words.length <= maxWords) {
      return text.trim();
    }

    const prompt = `Condense this ${fieldName} to EXACTLY ${maxWords} words or less while preserving ALL key information:

${text}

Requirements:
- Keep the most important information
- Maintain clarity and accuracy
- ${maxWords} words maximum
- No extra commentary

Provide ONLY the condensed text:`;

    const result = await this.call(prompt, 500);
    return result ? result.trim() : text.substring(0, maxWords * 6);
  }

  async generateStrategy(question, topic) {
    const optionsText = question.options ? `\nOptions: A) ${question.options.a || 'N/A'} B) ${question.options.b || 'N/A'} C) ${question.options.c || 'N/A'} D) ${question.options.d || 'N/A'}` : '';

    const prompt = `You are an expert JEE Advanced educator. Analyze this question and provide a UNIVERSAL STRATEGY that applies to ALL similar ${topic} problems.

Question: ${question.question_html || question.question}${optionsText}

Requirements:
- Describe the GENERAL METHOD/APPROACH (not specific to this problem's numbers)
- Should work for ANY similar problem in this category
- Focus on the conceptual approach and steps
- Do NOT include specific values from this problem
- MAXIMUM ${CONFIG.maxWords} words
- Keep it concise (3-4 sentences)

Provide ONLY the strategy text, no labels or extra commentary.`;

    const result = await this.call(prompt, 500);
    if (result) {
      return await this.condenseText(result, 'Strategy', CONFIG.maxWords);
    }
    return null;
  }

  async generateExpertInsight(question, topic) {
    const optionsText = question.options ? `\nOptions: A) ${question.options.a || 'N/A'} B) ${question.options.b || 'N/A'} C) ${question.options.c || 'N/A'} D) ${question.options.d || 'N/A'}` : '';

    const prompt = `You are a JEE Advanced exam topper. Analyze THIS SPECIFIC problem and provide expert insights.

Question: ${question.question_html || question.question}${optionsText}

Requirements:
- What would YOU notice FIRST when seeing this problem?
- What shortcuts or patterns would YOU recognize?
- What common mistakes would YOU avoid?
- Be SPECIFIC to THIS problem (not general)
- MAXIMUM ${CONFIG.maxWords} words
- Keep it concise (2-3 sentences)

Provide ONLY the expert insight text, no labels or extra commentary.`;

    const result = await this.call(prompt, 400);
    if (result) {
      return await this.condenseText(result, 'Expert Insight', CONFIG.maxWords);
    }
    return null;
  }

  async generateKeyFacts(question, topic, solutionHtml) {
    const solutionExcerpt = solutionHtml ? solutionHtml.replace(/<[^>]*>/g, ' ').substring(0, 500) : '';

    const prompt = `You are a JEE Advanced expert. Analyze this question and list ALL formulas, laws, theorems, and identities required to solve it.

Question: ${question.question_html || question.question}
${solutionExcerpt ? 'Solution excerpt: ' + solutionExcerpt : ''}

Requirements:
- List EVERY formula/law/theorem/identity needed
- Be specific (e.g., "Quadratic formula: x = (-b ± √(b²-4ac))/2a")
- Include constants if needed (e.g., "k = 9×10⁹ N⋅m²/C²")
- Separate multiple items with semicolons
- MAXIMUM ${CONFIG.maxWords} words
- Keep it concise

Format: Formula1/Law1; Formula2/Law2; etc.

Provide ONLY the key facts list, no labels or extra commentary.`;

    const result = await this.call(prompt, 600);
    if (result) {
      return await this.condenseText(result, 'Key Facts', CONFIG.maxWords);
    }
    return null;
  }

  // ============================================================================
  // SVG Generation Feature
  // ============================================================================

  async detectAndGenerateFigure(question) {
    // Detect if figure/diagram is mentioned but missing
    const questionText = question.question_html ? question.question_html.toLowerCase() : (question.question || '').toLowerCase();
    const figureKeywords = ['figure', 'diagram', 'graph', 'shown', 'as shown', 'refer', 'circuit', 'image'];
    const hasFigureMention = figureKeywords.some(keyword => questionText.includes(keyword));

    // Check if figure_svg exists
    const hasFigure = question.figure_svg && question.figure_svg.trim().length > 0;

    if (hasFigureMention && !hasFigure) {
      // First, analyze what figure is needed
      const analysisPrompt = `You are a JEE Advanced expert. This question mentions a figure/diagram but it's missing.

Question: ${question.question_html || question.question}
Subject: ${question.subject || 'General'}
Topic: ${question.topic || 'General'}

Analyze what figure is needed and provide details in EXACT format:

FIGURE_TYPE: [Choose: circuit/graph/geometric/coordinate/vector/molecular/3d_diagram/other]

DESCRIPTION: [Provide a DETAILED 2-3 sentence description of exactly what needs to be shown. Include:
- Overall structure and layout
- Key elements and their relationships
- Specific measurements, angles, or values mentioned
- Orientation and perspective]

COMPONENTS: [List EVERY component that must appear in the diagram with:
- Complete labels (e.g., "resistor R₁ = 10Ω at position (100,200)")
- Exact values and units
- Spatial relationships (e.g., "connected in series", "at 45° angle")
- Colors or styling if specified
- Coordinate positions if applicable]

SPECIAL_FEATURES: [Any special requirements like:
- Arrows showing direction (current, force, velocity)
- Angle markings
- Dimension lines
- Grid or axis requirements
- Hidden/dashed lines
- Shading or fill patterns]`;

      const analysis = await this.call(analysisPrompt, 1500);
      if (!analysis) return { needsFigure: false };

      const lines = analysis.split('\n');
      let figureType = '';
      let description = '';
      let components = '';

      for (const line of lines) {
        if (line.startsWith('FIGURE_TYPE:')) {
          figureType = line.substring(12).trim();
        } else if (line.startsWith('DESCRIPTION:')) {
          description = line.substring(12).trim();
        } else if (line.startsWith('COMPONENTS:')) {
          components = line.substring(11).trim();
        }
      }

      if (!description) return { needsFigure: false };

      // Now generate the actual SVG code
      const svgPrompt = `You are an EXPERT SVG diagram generator for JEE Advanced physics, chemistry, and mathematics questions. Your diagrams must be publication-quality.

Generate a DETAILED, ACCURATE SVG diagram based on this specification:

Type: ${figureType}
Description: ${description}
Components: ${components}
Question: ${question.question_html || question.question}

CRITICAL REQUIREMENTS:

**GENERAL:**
1. Use viewBox="0 0 600 450" for high-quality rendering
2. Add xmlns="http://www.w3.org/2000/svg" attribute
3. Use stroke-width: 2-3 for main elements, 1.5 for secondary
4. Font-size: 14-16px for labels, 12px for subscripts
5. Add background: <rect fill="#ffffff" width="600" height="450"/>

**FOR CIRCUITS:**
- Use IEEE standard symbols (resistor: zigzag, capacitor: parallel plates, battery: lines)
- Show current direction with arrows (stroke-width: 2, arrowheads: marker-end)
- Label ALL components with values (e.g., "R₁ = 10Ω", "V = 12V")
- Use different colors: wires (black), positive (red), negative (blue)
- Add junction dots (circle r="4" fill="black") at connection points
- Show voltage polarity with + and - symbols

**FOR GRAPHS/PLOTS:**
- Draw axes with arrows: <line> with marker-end for arrowheads
- Add tick marks every 50-100 units
- Label axes clearly (e.g., "x (meters)", "y (seconds)")
- Show grid lines (stroke="lightgray" stroke-dasharray="5,5")
- Plot curves/lines accurately based on described function
- Add origin label (0,0)
- Use colors: axes (black), grid (lightgray), plots (blue/red)

**FOR GEOMETRIC FIGURES:**
- Use accurate angles and proportions
- Label ALL vertices, sides, angles
- Show right angles with small squares
- Add dimension arrows with measurements
- Use colors to distinguish different elements
- Include construction lines as dashed (stroke-dasharray="5,5")
- Add angle arcs for marked angles

**FOR COORDINATE GEOMETRY:**
- Draw x and y axes with scales
- Mark origin clearly
- Plot points as circles (r="4" fill="red")
- Label points with coordinates
- Draw shapes/curves accurately
- Add grid if helpful

**FOR VECTORS:**
- Draw arrows with proper arrowheads (use <marker> or <polygon>)
- Show magnitude with labeled length
- Indicate direction with angle or components
- Use bold arrows (stroke-width: 3)
- Label vectors (e.g., "F⃗", "v⃗")

**FOR 3D PROJECTIONS:**
- Use isometric or perspective view
- Show hidden lines as dashed
- Add shading with opacity
- Label dimensions clearly
- Use different colors for faces

**STYLING:**
- Professional color scheme: black (#000), blue (#0066cc), red (#cc0000), green (#00aa00)
- All text must be horizontal and readable
- Use <text> with text-anchor="middle" for centered labels
- Add white stroke around text for readability: stroke="#fff" stroke-width="3" opacity="0.8"
- Proper spacing between elements

**MATHEMATICAL SYMBOLS:**
Use Unicode: ∫ (integral), Σ (sum), π (pi), θ (theta), ≤ (less-equal), ≥ (greater-equal), ± (plus-minus), × (times), √ (square root)
Subscripts: use <tspan baseline-shift="sub" font-size="0.8em">

PROVIDE ONLY THE COMPLETE, VALID SVG CODE.
Start with <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 450">
End with </svg>
NO explanations, NO markdown, JUST the SVG code.`;

      const svgCode = await this.call(svgPrompt, 3500);
      if (!svgCode || !svgCode.includes('<svg')) {
        return {
          needsFigure: true,
          figureType,
          description,
          components,
          svgCode: null
        };
      }

      // Clean up SVG code
      let cleanSvg = svgCode.trim();
      // Extract just the SVG part if there's extra text
      const svgMatch = cleanSvg.match(/<svg[\s\S]*<\/svg>/);
      if (svgMatch) {
        cleanSvg = svgMatch[0];
      }

      return {
        needsFigure: true,
        figureType,
        description,
        components,
        svgCode: cleanSvg
      };
    }

    return { needsFigure: false };
  }

  // ============================================================================
  // HTML Entity Cleanup Feature
  // ============================================================================

  async cleanOptions(options) {
    if (!options) return options;

    const optionsStr = JSON.stringify(options);

    // Check if has HTML entities
    if (!optionsStr.includes('<sub>') && !optionsStr.includes('<sup>') &&
        !optionsStr.includes('<strong>') && !optionsStr.includes('<em>') &&
        !optionsStr.includes('<br')) {
      return options; // No issues
    }

    const prompt = `Convert these multiple choice options from HTML to clean plain text with proper Unicode characters.

Options (JSON): ${optionsStr}

Rules:
1. Replace <sub> with Unicode subscripts (₀₁₂₃₄₅₆₇₈₉ ₐ ₑ ᵢ ₒ ᵤ ₓ)
2. Replace <sup> with Unicode superscripts (⁰¹²³⁴⁵⁶⁷⁸⁹)
3. Remove all HTML tags (<strong>, <em>, <br/>, etc.)
4. Keep the JSON structure with keys a, b, c, d
5. Preserve all mathematical notation and units
6. Use proper Unicode for Greek letters (μ, α, β, γ, δ, etc.)

Provide ONLY the cleaned JSON object, no explanation.`;

    const result = await this.call(prompt, 1000);
    if (!result) return options;

    try {
      // Extract JSON from response
      const jsonMatch = result.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const cleaned = JSON.parse(jsonMatch[0]);
        return cleaned;
      }
    } catch (e) {
      console.error('     ⚠️ Failed to parse cleaned options');
    }

    return options;
  }

  // ============================================================================
  // Combined Word Separation Feature
  // ============================================================================

  async fixCombinedWords(text) {
    if (!text) return text;

    // Check for combined words pattern (multiple capital letters with mixed case)
    const combinedPattern = /[A-Z]{2,}[a-z]+[A-Z][a-z]+[A-Z]/;
    if (!combinedPattern.test(text)) {
      return text; // No issues
    }

    const prompt = `Fix this text by adding spaces between combined words. Only fix obvious word boundaries.

Text: ${text}

Rules:
1. Insert spaces between CamelCase words (e.g., "WorkTransfer" → "Work Transfer")
2. Preserve acronyms (e.g., "KW" stays "KW")
3. Don't split mathematical notation
4. Only fix obvious issues

Provide ONLY the corrected text, no explanation.`;

    const result = await this.call(prompt, 500);
    return result ? result.trim() : text;
  }

  // ============================================================================
  // Figure Warning Removal Feature
  // ============================================================================

  removeFigureWarnings(text) {
    if (!text) return text;

    // Remove common figure warning messages
    const warnings = [
      /\[Figure not available in text format\]/gi,
      /\[See figure in question paper\]/gi,
      /\[Refer to the figure\]/gi,
      /\[Figure required\]/gi,
      /\[Diagram needed\]/gi,
    ];

    let cleaned = text;
    for (const warning of warnings) {
      cleaned = cleaned.replace(warning, '');
    }

    return cleaned.trim();
  }

  // ============================================================================
  // VALIDATION FEATURES
  // ============================================================================

  /**
   * Validate that all required question fields are present and correct
   */
  validateQuestionFormat(question) {
    const issues = [];

    // Check if all 4 options exist (CORRECT SCHEMA: options.a, options.b, options.c, options.d)
    if (!question.options || typeof question.options !== 'object') {
      issues.push({
        severity: 'critical',
        type: 'missing_options',
        message: `Missing options: A, B, C, D`,
        details: ['a', 'b', 'c', 'd']
      });
    } else {
      const missingOptions = [];
      if (!question.options.a || !question.options.a.trim()) missingOptions.push('a');
      if (!question.options.b || !question.options.b.trim()) missingOptions.push('b');
      if (!question.options.c || !question.options.c.trim()) missingOptions.push('c');
      if (!question.options.d || !question.options.d.trim()) missingOptions.push('d');

      if (missingOptions.length > 0) {
        issues.push({
          severity: 'critical',
          type: 'missing_options',
          message: `Missing options: ${missingOptions.join(', ').toUpperCase()}`,
          details: missingOptions
        });
      }
    }

    // Check correct answer
    if (!question.correct_answer || !['a', 'b', 'c', 'd'].includes(question.correct_answer.toLowerCase())) {
      issues.push({
        severity: 'critical',
        type: 'invalid_correct_answer',
        message: 'Correct answer must be a, b, c, or d'
      });
    }

    // Check for multi-part questions that aren't properly formatted
    const multiPartPatterns = [
      /\(a\).*\(b\)/i,
      /part\s+\(a\)/i,
      /\(i\).*\(ii\)/i,
    ];

    const questionText = question.question_html || question.question || '';
    const hasMultiPart = multiPartPatterns.some(pattern => pattern.test(questionText));

    if (hasMultiPart && question.options && typeof question.options === 'object') {
      const optionsText = [
        question.options.a || '',
        question.options.b || '',
        question.options.c || '',
        question.options.d || ''
      ].join(' ');

      if (!optionsText.includes('(a)') && !optionsText.includes('part')) {
        issues.push({
          severity: 'high',
          type: 'multipart_not_handled',
          message: 'Multi-part question but options don\'t address all parts'
        });
      }
    }

    return issues;
  }

  /**
   * Verify question completeness and check for ambiguity using AI
   */
  async verifyQuestionCompleteness(question) {
    const questionText = question.question_html || question.question || '';

    if (!questionText.trim()) {
      return {
        isComplete: false,
        issues: ['Question text is empty'],
        needsCorrection: true
      };
    }

    const prompt = `Analyze this JEE Advanced question for completeness and ambiguity:

QUESTION:
${questionText}

OPTIONS:
a) ${question.options?.a || 'MISSING'}
b) ${question.options?.b || 'MISSING'}
c) ${question.options?.c || 'MISSING'}
d) ${question.options?.d || 'MISSING'}

Check for:
1. Are all values/parameters provided to solve the question?
2. Are figures/diagrams mentioned but not available?
3. Is the question statement clear and unambiguous?
4. Can this be solved with the given information?
5. Are there any missing units or unclear notation?

Respond in this format:
COMPLETE: [YES/NO]
ISSUES: [List any issues found, or "None"]
AMBIGUOUS: [YES/NO]`;

    const response = await this.call(prompt, 1000);
    if (!response) {
      return { isComplete: true, issues: [], needsCorrection: false };
    }

    const isComplete = /COMPLETE:\s*YES/i.test(response);
    const isAmbiguous = /AMBIGUOUS:\s*YES/i.test(response);

    const issuesMatch = response.match(/ISSUES:\s*(.+?)(?=\n[A-Z]+:|$)/s);
    const issues = issuesMatch && issuesMatch[1].trim() !== 'None'
      ? [issuesMatch[1].trim()]
      : [];

    return {
      isComplete,
      isAmbiguous,
      issues,
      needsCorrection: !isComplete || isAmbiguous
    };
  }

  /**
   * Verify solution steps match the correct answer using AI
   */
  async verifySolutionMatchesAnswer(question) {
    const solutionText = question.solution_html || question.solution || '';
    const correctAnswer = question.correct_answer?.toLowerCase();

    if (!solutionText.trim()) {
      return {
        matchesAnswer: false,
        issues: ['Solution is missing'],
        needsCorrection: true
      };
    }

    if (!correctAnswer || !['a', 'b', 'c', 'd'].includes(correctAnswer)) {
      return {
        matchesAnswer: false,
        issues: ['Correct answer is invalid or missing'],
        needsCorrection: true
      };
    }

    const prompt = `Verify this JEE Advanced solution:

QUESTION:
${question.question_html || question.question || ''}

SOLUTION:
${solutionText}

CORRECT ANSWER (per answer key): Option ${correctAnswer.toUpperCase()}

OPTIONS:
a) ${question.options?.a || 'MISSING'}
b) ${question.options?.b || 'MISSING'}
c) ${question.options?.c || 'MISSING'}
d) ${question.options?.d || 'MISSING'}

Check:
1. Are all solution steps clearly shown?
2. Does the solution logically lead to option ${correctAnswer.toUpperCase()}?
3. Are calculations mathematically correct?
4. Does the final answer match option ${correctAnswer.toUpperCase()}?

Respond in this format:
MATCHES_ANSWER_KEY: [YES/NO]
STEPS_CLEAR: [YES/NO]
ISSUES: [List any issues, or "None"]`;

    const response = await this.call(prompt, 1500);
    if (!response) {
      return { matchesAnswer: true, stepsClear: true, issues: [], needsCorrection: false };
    }

    const matchesAnswer = /MATCHES_ANSWER_KEY:\s*YES/i.test(response);
    const stepsClear = /STEPS_CLEAR:\s*YES/i.test(response);

    const issuesMatch = response.match(/ISSUES:\s*(.+?)$/s);
    const issues = issuesMatch && issuesMatch[1].trim() !== 'None'
      ? [issuesMatch[1].trim()]
      : [];

    return {
      matchesAnswer,
      stepsClear,
      issues,
      needsCorrection: !matchesAnswer || !stepsClear
    };
  }

  // ============================================================================
  // OPTION GENERATION
  // ============================================================================

  /**
   * Generate detailed solution steps for a question
   */
  async generateSolution(question) {
    const questionText = question.question_html || question.question || '';
    const correctAnswer = question.correct_answer?.toLowerCase();
    const subject = question.subject || 'General';
    const topic = question.topic || 'General';

    if (!correctAnswer || !['a', 'b', 'c', 'd'].includes(correctAnswer)) {
      return null;
    }

    const prompt = `Generate a detailed, step-by-step solution for this JEE Advanced ${subject} question (Topic: ${topic}).

QUESTION:
${questionText}

OPTIONS:
a) ${question.options?.a || 'N/A'}
b) ${question.options?.b || 'N/A'}
c) ${question.options?.c || 'N/A'}
d) ${question.options?.d || 'N/A'}

CORRECT ANSWER: Option ${correctAnswer.toUpperCase()}

Generate a comprehensive solution that:
1. Starts with the key concept/formula needed
2. Shows ALL calculation steps clearly
3. Explains each step briefly
4. Arrives at option ${correctAnswer.toUpperCase()} as the final answer
5. Uses proper mathematical notation (HTML format)
6. Is detailed enough for a JEE Advanced student to understand completely

Format as clean HTML with proper tags (<p>, <strong>, mathematical expressions, etc.).
Do NOT include figure references or mention missing diagrams.

SOLUTION:`;

    const response = await this.call(prompt, 2500);
    if (!response) return null;

    // Clean up the response
    let solution = response.trim();

    // Remove any "SOLUTION:" prefix
    solution = solution.replace(/^SOLUTION:\s*/i, '');

    // Ensure it's wrapped in proper HTML
    if (!solution.startsWith('<')) {
      solution = `<div>${solution}</div>`;
    }

    return solution;
  }

  /**
   * Generate 4 options for a question based on the solution
   */
  async generateOptions(question) {
    const questionText = question.question_html || question.question || '';
    const solutionText = question.solution_html || question.solution || '';
    const correctAnswer = question.correct_answer?.toLowerCase() || 'a';

    const prompt = `You are an expert in creating JEE Advanced multiple choice questions. Generate 4 options for this question.

QUESTION:
${questionText}

SOLUTION:
${solutionText}

CORRECT ANSWER SHOULD BE: Option ${correctAnswer.toUpperCase()}

INSTRUCTIONS:
1. Analyze the solution to determine the EXACT correct answer
2. Generate option ${correctAnswer.toUpperCase()} as the correct answer matching the solution
3. Generate 3 other plausible but INCORRECT distractors
4. Distractors should represent common mistakes students make:
   - Calculation errors (sign errors, arithmetic mistakes)
   - Conceptual misunderstandings
   - Forgetting units or constants
   - Incomplete solutions
5. All options should be in the same format (same units, same precision)
6. Options should be distinct and clearly different
7. For numerical answers, provide exact values (fractions, surds, or decimals as appropriate)
8. For Physics: Include proper units
9. For Chemistry: Include proper molecular formulas
10. For Mathematics: Use proper mathematical notation

RESPOND IN THIS EXACT JSON FORMAT:
{
  "a": "first option text here",
  "b": "second option text here",
  "c": "third option text here",
  "d": "fourth option text here"
}

IMPORTANT:
- Provide ONLY the JSON, no other text
- Ensure option ${correctAnswer.toUpperCase()} is the correct answer
- Make distractors realistic but clearly wrong`;

    const response = await this.call(prompt, 2000);

    if (!response) {
      throw new Error('Empty response from Claude API');
    }

    // Extract JSON from response
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Could not parse JSON from response');
    }

    const options = JSON.parse(jsonMatch[0]);

    // Validate all 4 options exist (CORRECT SCHEMA: a, b, c, d)
    if (!options.a || !options.b || !options.c || !options.d) {
      throw new Error('Generated options missing one or more fields');
    }

    return options;
  }

  /**
   * Fix incomplete question by adding missing parameters/data
   */
  async fixIncompleteQuestion(question) {
    const questionText = question.question_html || question.question || '';
    const subject = question.subject || 'General';
    const topic = question.topic || 'General';

    const prompt = `You are an expert in JEE Advanced ${subject} (Topic: ${topic}). The following question has been identified as INCOMPLETE - it's missing critical data, parameters, or context needed to solve it.

INCOMPLETE QUESTION:
${questionText}

Your task:
1. Identify what information is missing (constants, values, diagrams descriptions, boundary conditions, etc.)
2. Add the missing information based on typical JEE Advanced standards for this topic
3. Ensure the question becomes complete and solvable
4. Maintain the original intent and difficulty level
5. Keep the same format and style

IMPORTANT:
- If a figure is missing, add "[Figure shows: detailed description]"
- Add typical values for missing constants (e.g., "g = 10 m/s²", "T = 300K")
- Add missing boundary conditions or constraints
- DO NOT change the core question or make it easier
- Return the COMPLETE question in HTML format

COMPLETE QUESTION:`;

    const response = await this.call(prompt, 2000);
    if (!response) return null;

    let fixed = response.trim();
    fixed = fixed.replace(/^COMPLETE QUESTION:\s*/i, '');

    if (!fixed.startsWith('<')) {
      fixed = `<div>${fixed}</div>`;
    }

    return fixed;
  }

  /**
   * Fix ambiguous question by rewording for clarity
   */
  async fixAmbiguousQuestion(question) {
    const questionText = question.question_html || question.question || '';
    const subject = question.subject || 'General';
    const topic = question.topic || 'General';

    const prompt = `You are an expert in JEE Advanced ${subject} (Topic: ${topic}). The following question has been identified as AMBIGUOUS - it has unclear wording, vague terms, or confusing structure.

AMBIGUOUS QUESTION:
${questionText}

Your task:
1. Identify what makes this question ambiguous (vague terms, unclear references, confusing structure)
2. Reword the question to be crystal clear and unambiguous
3. Use precise technical language appropriate for JEE Advanced
4. Maintain the original intent, difficulty level, and all technical content
5. Keep the same format and style

IMPORTANT:
- Make wording precise and unambiguous
- Replace vague terms with specific technical terms
- Clarify any confusing references or pronouns
- DO NOT change the physics/chemistry/mathematics content
- DO NOT make the question easier or harder
- Return the CLEAR question in HTML format

CLEAR QUESTION:`;

    const response = await this.call(prompt, 2000);
    if (!response) return null;

    let fixed = response.trim();
    fixed = fixed.replace(/^CLEAR QUESTION:\s*/i, '');

    if (!fixed.startsWith('<')) {
      fixed = `<div>${fixed}</div>`;
    }

    return fixed;
  }

  /**
   * Fix multi-part question by regenerating options that address all parts
   */
  async fixMultiPartOptions(question) {
    const questionText = question.question_html || question.question || '';
    const solutionText = question.solution_html || question.solution || '';
    const subject = question.subject || 'General';
    const topic = question.topic || 'General';
    const correctAnswer = question.correct_answer?.toLowerCase() || 'a';

    const prompt = `You are an expert in JEE Advanced ${subject} (Topic: ${topic}). This question has MULTIPLE PARTS but the current options don't properly address ALL parts of the question.

MULTI-PART QUESTION:
${questionText}

SOLUTION:
${solutionText}

CURRENT CORRECT ANSWER: Option ${correctAnswer.toUpperCase()}

Your task:
1. Identify all parts of the question (could be 2, 3, or more parts)
2. Generate 4 options where EACH option addresses ALL parts of the question
3. Make option ${correctAnswer.toUpperCase()} the correct answer (matching the solution)
4. Format each option to clearly show answers to all parts (e.g., "Part A: ..., Part B: ..., Part C: ...")
5. Create 3 plausible distractors with common mistakes in different parts

IMPORTANT:
- Each option MUST address ALL parts of the question
- Use clear formatting: "Part 1: X, Part 2: Y" or "(i) A, (ii) B" format
- Option ${correctAnswer.toUpperCase()} must match the solution
- Distractors should have mistakes in different combinations of parts
- All options should follow the same format structure

RESPOND IN THIS EXACT JSON FORMAT:
{
  "a": "Part 1: value, Part 2: value, Part 3: value",
  "b": "Part 1: value, Part 2: value, Part 3: value",
  "c": "Part 1: value, Part 2: value, Part 3: value",
  "d": "Part 1: value, Part 2: value, Part 3: value"
}

Provide ONLY the JSON, no other text.`;

    const response = await this.call(prompt, 2500);
    if (!response) return null;

    // Extract JSON from response
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;

    try {
      const options = JSON.parse(jsonMatch[0]);

      // Validate all 4 options exist
      if (!options.a || !options.b || !options.c || !options.d) {
        return null;
      }

      return options;
    } catch (error) {
      return null;
    }
  }
}

// ============================================================================
// Main Enrichment Pipeline
// ============================================================================

async function enrichExistingQuestions() {
  console.log('🚀 Complete Enrichment Pipeline for Existing Questions\n');
  console.log(`📚 Subject: ${CONFIG.subject}`);
  console.log(`⏱️  Delay: ${CONFIG.baseDelay}ms between calls`);
  console.log(`📊 Max words per field: ${CONFIG.maxWords}`);
  console.log('\n✨ ALL FEATURES ACTIVE:');
  console.log('   • Question validation (options, answer key, multi-part questions)');
  console.log('   • Completeness verification (no ambiguity, all data provided)');
  console.log('   • Auto-fixing (incomplete questions, ambiguous wording, multi-part options)');
  console.log('   • Solution verification & generation (matches correct answer)');
  console.log('   • Text enrichment (strategy, expert_insight, key_facts)');
  console.log('   • SVG generation for missing figures');
  console.log('   • 100-word limits with auto-condensing');
  console.log('   • HTML entity cleanup in options');
  console.log('   • Combined word separation');
  console.log('   • Figure warning removal');
  console.log('\n' + '='.repeat(70) + '\n');

  const claudeAI = new ClaudeAI(CONFIG.claudeApiKey);

  // Fetch questions needing validation/enrichment
  console.log('📥 Fetching questions needing validation/enrichment...\n');
  console.log(`   Validation version: ${CONFIG.validationVersion}\n`);

  // Fetch questions that are either:
  // 1. Not yet validated (validated_at IS NULL)
  // 2. Validated with older version (validation_version < current)
  const { data: questions, error } = await supabase
    .from('questions')
    .select('*')
    .eq('subject', CONFIG.subject)
    .or(`validated_at.is.null,validation_version.lt.${CONFIG.validationVersion}`)
    .order('id', { ascending: true });

  if (error) {
    console.error('❌ Error fetching questions:', error);
    return;
  }

  // Check if VALIDATE_ALL mode is enabled (via environment variable)
  const validateAll = process.env.VALIDATE_ALL === 'true';

  // Filter to those needing any enrichment
  let needsEnrichment;

  if (validateAll) {
    // VALIDATE ALL mode - process every question for validation/fixing
    console.log('   🔍 VALIDATE_ALL mode - checking all questions for issues\n');
    needsEnrichment = questions;
  } else {
    // Normal mode - process questions needing enrichment OR validation fixes
    needsEnrichment = questions.filter(q => {
      // Check if text enrichment is needed
      const needsText = !q.strategy || q.strategy.trim() === '' || q.strategy === 'Strategy:' ||
        !q.expert_insight || q.expert_insight.trim() === '' || q.expert_insight === 'Expert Insight:' ||
        !q.key_facts || q.key_facts.trim() === '' || q.key_facts === 'Key Facts Used:';

      // Check if SVG is needed
      const needsSVG = (!q.figure_svg || q.figure_svg.trim() === '') &&
        (q.question_html && ['figure', 'diagram', 'graph', 'shown', 'circuit'].some(kw => q.question_html.toLowerCase().includes(kw)));

      // Check if options are missing
      const needsOptions = !q.options || !q.options.a || !q.options.b || !q.options.c || !q.options.d;

      // Check if solution is missing
      const needsSolution = !q.solution_html || q.solution_html.trim() === '';

      // Check for multi-part questions with improper options
      const multiPartPatterns = [/\(a\).*\(b\)/i, /part\s+\(a\)/i, /\(i\).*\(ii\)/i];
      const questionText = q.question_html || q.question || '';
      const hasMultiPart = multiPartPatterns.some(pattern => pattern.test(questionText));

      let needsMultiPartFix = false;
      if (hasMultiPart && q.options) {
        const optionsText = [q.options.a || '', q.options.b || '', q.options.c || '', q.options.d || ''].join(' ');
        needsMultiPartFix = !optionsText.toLowerCase().includes('part') &&
                           !optionsText.includes('(a)') &&
                           !optionsText.includes('(i)');
      }

      return needsText || needsSVG || needsOptions || needsSolution || needsMultiPartFix;
    });
  }

  console.log(`   Total ${CONFIG.subject} questions: ${questions.length}`);
  console.log(`   Need enrichment: ${needsEnrichment.length} (${(needsEnrichment.length/questions.length*100).toFixed(1)}%)\n`);

  if (needsEnrichment.length === 0) {
    console.log('✅ All questions already enriched!');
    return;
  }

  const stats = {
    total: needsEnrichment.length,
    enriched: 0,
    failed: 0,
    skipped: 0,
    svgGenerated: 0,
    textEnriched: 0
  };

  // Process in batches
  for (let i = 0; i < needsEnrichment.length; i++) {
    const q = needsEnrichment[i];
    const progress = i + 1;

    console.log(`\n[${progress}/${needsEnrichment.length}] Processing question ${q.id.substring(0, 8)}...`);

    try {
      const updates = {};
      let needsUpdate = false;
      const validationIssues = []; // Track all issues found during validation

      // ========================================================================
      // VALIDATION PHASE
      // ========================================================================

      // 1. Validate question format (options, correct answer)
      console.log('   🔍 Validating question format...');
      const formatIssues = claudeAI.validateQuestionFormat(q);
      if (formatIssues.length > 0) {
        validationIssues.push(...formatIssues.map(i => i.type));
      }

      // Check if options are missing
      const missingOptions = formatIssues.find(i => i.type === 'missing_options');

      if (missingOptions && q.solution_html && q.correct_answer) {
        // AUTO-GENERATE MISSING OPTIONS (CORRECT SCHEMA)
        console.log(`      🤖 Generating missing options using AI...`);
        try {
          const generatedOptions = await claudeAI.generateOptions(q);
          console.log(`         ✅ Generated all 4 options`);
          console.log(`            Option A: ${generatedOptions.a.substring(0, 50)}...`);
          console.log(`            Option B: ${generatedOptions.b.substring(0, 50)}...`);
          console.log(`            Option C: ${generatedOptions.c.substring(0, 50)}...`);
          console.log(`            Option D: ${generatedOptions.d.substring(0, 50)}...`);

          // Update the question object and database immediately (CORRECT SCHEMA)
          q.options = generatedOptions;

          const { error: optionUpdateError } = await supabase
            .from('questions')
            .update({
              options: generatedOptions
            })
            .eq('id', q.id);

          if (optionUpdateError) {
            console.log(`         ⚠️  Failed to save options: ${optionUpdateError.message}`);
          } else {
            console.log(`         ✅ Options saved to database`);
          }

          await new Promise(resolve => setTimeout(resolve, CONFIG.baseDelay));
        } catch (error) {
          console.log(`         ❌ Option generation failed: ${error.message}`);
          console.log(`         ⏭️  Skipping enrichment for this question`);
          stats.skipped++;
          continue;
        }
      } else if (formatIssues.length > 0) {
        console.log(`      ⚠️  Found ${formatIssues.length} format issue(s):`);
        formatIssues.forEach(issue => {
          console.log(`         - ${issue.message}`);
        });

        // Check for multi-part issue and auto-fix
        const multiPartIssue = formatIssues.find(i => i.type === 'multipart_not_handled');
        if (multiPartIssue && q.solution_html && q.correct_answer && q.options) {
          console.log(`      🤖 Auto-fixing multi-part options...`);
          try {
            const fixedOptions = await claudeAI.fixMultiPartOptions(q);
            if (fixedOptions) {
              console.log(`         ✅ Fixed multi-part options generated`);
              console.log(`            Option A: ${fixedOptions.a.substring(0, 60)}...`);
              console.log(`            Option B: ${fixedOptions.b.substring(0, 60)}...`);
              console.log(`            Option C: ${fixedOptions.c.substring(0, 60)}...`);
              console.log(`            Option D: ${fixedOptions.d.substring(0, 60)}...`);

              // Update in database immediately
              const { error: multiPartError } = await supabase
                .from('questions')
                .update({ options: fixedOptions })
                .eq('id', q.id);

              if (multiPartError) {
                console.log(`         ⚠️  Failed to save fixed options: ${multiPartError.message}`);
              } else {
                console.log(`         ✅ Fixed options saved to database`);
                q.options = fixedOptions; // Update local copy
                stats.multiPartFixed = (stats.multiPartFixed || 0) + 1;
              }
            } else {
              console.log(`         ⚠️  Auto-fix returned no result, continuing with original`);
            }
            await new Promise(resolve => setTimeout(resolve, CONFIG.baseDelay));
          } catch (error) {
            console.log(`         ❌ Multi-part fix failed: ${error.message}`);
            console.log(`         ⏭️  Continuing with original options`);
          }
        }

        // If critical issues (other than missing options), skip enrichment
        const hasCriticalNonOption = formatIssues.some(i =>
          i.severity === 'critical' && i.type !== 'missing_options'
        );

        if (hasCriticalNonOption) {
          console.log(`      ❌ Critical issues found - skipping enrichment`);
          stats.skipped++;
          continue;
        }
      } else {
        console.log('      ✅ Format valid');
      }

      // 2. Verify question completeness (no ambiguity)
      console.log('   🔍 Checking question completeness...');
      const completeness = await claudeAI.verifyQuestionCompleteness(q);

      let needsQuestionFix = false;
      let fixType = null;

      if (!completeness.isComplete || completeness.isAmbiguous) {
        console.log(`      ⚠️  Question needs attention:`);
        if (!completeness.isComplete) {
          console.log('         - Question incomplete');
          needsQuestionFix = true;
          fixType = 'incomplete';
        }
        if (completeness.isAmbiguous) {
          console.log('         - Question ambiguous');
          if (!needsQuestionFix) {
            needsQuestionFix = true;
            fixType = 'ambiguous';
          }
        }
        completeness.issues.forEach(issue => {
          console.log(`         - ${issue}`);
        });

        // AUTO-FIX incomplete or ambiguous questions
        if (needsQuestionFix) {
          console.log(`      🤖 Attempting auto-fix for ${fixType} question...`);
          try {
            let fixedQuestion = null;

            if (fixType === 'incomplete') {
              fixedQuestion = await claudeAI.fixIncompleteQuestion(q);
            } else if (fixType === 'ambiguous') {
              fixedQuestion = await claudeAI.fixAmbiguousQuestion(q);
            }

            if (fixedQuestion) {
              console.log(`         ✅ Question fixed successfully`);

              // Update in database immediately
              const { error: fixError } = await supabase
                .from('questions')
                .update({ question_html: fixedQuestion })
                .eq('id', q.id);

              if (fixError) {
                console.log(`         ⚠️  Failed to save fixed question: ${fixError.message}`);
              } else {
                console.log(`         ✅ Fixed question saved to database`);
                q.question_html = fixedQuestion; // Update local copy
                stats.questionsFixed = (stats.questionsFixed || 0) + 1;
              }
            } else {
              console.log(`         ⚠️  Auto-fix returned no result, continuing with original`);
            }

            await new Promise(resolve => setTimeout(resolve, CONFIG.baseDelay));
          } catch (error) {
            console.log(`         ❌ Auto-fix failed: ${error.message}`);
            console.log(`         ⏭️  Continuing with original question`);
          }
        }
      } else {
        console.log('      ✅ Question complete');
      }
      await new Promise(resolve => setTimeout(resolve, CONFIG.baseDelay));

      // 3. Check solution - verify if present, generate if missing/incorrect
      let needsSolutionGeneration = false;
      const hasSolution = q.solution_html && q.solution_html.trim() !== '';

      if (hasSolution && q.correct_answer) {
        console.log('   🔍 Verifying solution matches answer key...');
        const solutionCheck = await claudeAI.verifySolutionMatchesAnswer(q);
        if (!solutionCheck.matchesAnswer) {
          console.log(`      ⚠️  Solution doesn't match correct answer - will regenerate`);
          solutionCheck.issues.forEach(issue => {
            console.log(`         - ${issue}`);
          });
          needsSolutionGeneration = true;
        } else {
          console.log('      ✅ Solution matches answer key');
        }
        await new Promise(resolve => setTimeout(resolve, CONFIG.baseDelay));
      } else if (!hasSolution && q.correct_answer) {
        console.log('   📝 Solution missing - will generate');
        needsSolutionGeneration = true;
      }

      // Generate solution if needed
      if (needsSolutionGeneration && q.options && q.correct_answer) {
        console.log('   🔧 Generating detailed solution...');
        try {
          const generatedSolution = await claudeAI.generateSolution(q);
          if (generatedSolution) {
            updates.solution_html = generatedSolution;
            needsUpdate = true;
            stats.solutionsGenerated = (stats.solutionsGenerated || 0) + 1;
            console.log(`      ✅ Solution generated`);

            // Update in database immediately
            const { error: solutionError } = await supabase
              .from('questions')
              .update({ solution_html: generatedSolution })
              .eq('id', q.id);

            if (solutionError) {
              console.log(`         ⚠️  Failed to save solution: ${solutionError.message}`);
            }
          } else {
            console.log('      ⚠️  Solution generation returned no result');
          }
          await new Promise(resolve => setTimeout(resolve, CONFIG.baseDelay));
        } catch (error) {
          console.log(`      ❌ Solution generation failed: ${error.message}`);
        }
      }

      // ========================================================================
      // ENRICHMENT PHASE
      // ========================================================================

      // Generate strategy if missing
      if (!q.strategy || q.strategy.trim() === '' || q.strategy === 'Strategy:') {
        validationIssues.push('missing_strategy');
        console.log('   🎯 Generating strategy...');
        const strategy = await claudeAI.generateStrategy(q, q.topic || 'General');
        if (strategy) {
          updates.strategy = strategy;
          needsUpdate = true;
          stats.textEnriched++;
          console.log(`      ✅ Generated (${strategy.split(/\s+/).length} words)`);
        } else {
          console.log('      ⚠️  Failed');
        }
        await new Promise(resolve => setTimeout(resolve, CONFIG.baseDelay));
      }

      // Generate expert insight if missing
      if (!q.expert_insight || q.expert_insight.trim() === '' || q.expert_insight === 'Expert Insight:') {
        validationIssues.push('missing_expert_insight');
        console.log('   💡 Generating expert insight...');
        const insight = await claudeAI.generateExpertInsight(q, q.topic || 'General');
        if (insight) {
          updates.expert_insight = insight;
          needsUpdate = true;
          stats.textEnriched++;
          console.log(`      ✅ Generated (${insight.split(/\s+/).length} words)`);
        } else {
          console.log('      ⚠️  Failed');
        }
        await new Promise(resolve => setTimeout(resolve, CONFIG.baseDelay));
      }

      // Generate key facts if missing
      if (!q.key_facts || q.key_facts.trim() === '' || q.key_facts === 'Key Facts Used:') {
        validationIssues.push('missing_key_facts');
        console.log('   📚 Generating key facts...');
        const keyFacts = await claudeAI.generateKeyFacts(q, q.topic || 'General', q.solution_html);
        if (keyFacts) {
          updates.key_facts = keyFacts;
          needsUpdate = true;
          stats.textEnriched++;
          console.log(`      ✅ Generated (${keyFacts.split(/\s+/).length} words)`);
        } else {
          console.log('      ⚠️  Failed');
        }
        await new Promise(resolve => setTimeout(resolve, CONFIG.baseDelay));
      }

      // Generate SVG if needed
      if (!q.figure_svg || q.figure_svg.trim() === '') {
        console.log('   🎨 Checking for missing figures...');
        const figureResult = await claudeAI.detectAndGenerateFigure(q);
        if (figureResult.needsFigure && figureResult.svgCode) {
          validationIssues.push('missing_svg');
          updates.figure_svg = figureResult.svgCode;
          needsUpdate = true;
          stats.svgGenerated++;
          console.log(`      ✅ SVG generated (${figureResult.figureType})`);
        } else if (figureResult.needsFigure) {
          validationIssues.push('svg_generation_failed');
          console.log('      ⚠️  SVG generation failed');
        }
        await new Promise(resolve => setTimeout(resolve, CONFIG.baseDelay));
      }

      // Clean options HTML entities if needed (CORRECT SCHEMA: options.a, options.b, options.c, options.d)
      if (q.options && typeof q.options === 'object' && (q.options.a || q.options.b || q.options.c || q.options.d)) {
        const cleanedOptions = await claudeAI.cleanOptions(q.options);
        if (cleanedOptions && JSON.stringify(cleanedOptions) !== JSON.stringify(q.options)) {
          console.log('   🧹 Cleaning HTML entities in options...');
          updates.options = cleanedOptions;
          needsUpdate = true;
          console.log('      ✅ Options cleaned');
        }
        await new Promise(resolve => setTimeout(resolve, CONFIG.baseDelay));
      }

      // Fix combined words in question
      if (q.question_html) {
        const fixedQuestion = await claudeAI.fixCombinedWords(q.question_html);
        if (fixedQuestion !== q.question_html) {
          console.log('   ✂️  Fixing combined words...');
          updates.question_html = fixedQuestion;
          needsUpdate = true;
          console.log('      ✅ Words separated');
        }
      }

      // Remove figure warnings
      if (q.question_html) {
        const cleanedQuestion = claudeAI.removeFigureWarnings(q.question_html);
        if (cleanedQuestion !== q.question_html && !updates.question_html) {
          console.log('   🧹 Removing figure warnings...');
          updates.question_html = cleanedQuestion;
          needsUpdate = true;
          console.log('      ✅ Warnings removed');
        }
      }

      // Update database if we have changes
      if (needsUpdate && Object.keys(updates).length > 0) {
        // Add validation tracking
        updates.validated_at = new Date().toISOString();
        updates.validation_version = CONFIG.validationVersion;
        updates.validation_notes = validationIssues.length > 0
          ? `Fixed: ${validationIssues.join(', ')}`
          : 'All checks passed';

        const { data: updateData, error: updateError } = await supabase
          .from('questions')
          .update(updates)
          .eq('id', q.id)
          .select();

        if (updateError) {
          console.log(`   ❌ Update failed:`, updateError.message);
          stats.failed++;
        } else if (!updateData || updateData.length === 0) {
          console.log(`   ❌ Update failed: 0 rows affected (permission issue?)`);
          console.log(`      Question ID: ${q.id}`);
          stats.failed++;
        } else {
          console.log(`   ✅ Updated with ${Object.keys(updates).length} fields + validation tracking`);
          stats.enriched++;
        }
      } else {
        // No changes, but still mark as validated to skip in future runs
        const { data: validateData, error: validateError } = await supabase
          .from('questions')
          .update({
            validated_at: new Date().toISOString(),
            validation_version: CONFIG.validationVersion,
            validation_notes: validationIssues.length > 0
              ? `Issues found but already resolved: ${validationIssues.join(', ')}`
              : 'No issues found'
          })
          .eq('id', q.id)
          .select();

        if (validateError) {
          console.log(`   ⚠️  Failed to mark as validated:`, validateError.message);
        } else {
          console.log('   ✅ Marked as validated (no changes needed)');
        }
        stats.skipped++;
      }

    } catch (error) {
      console.log(`   ❌ Error:`, error.message);
      stats.failed++;
    }

    // Progress report every 10 questions
    if (progress % 10 === 0) {
      console.log(`\n📊 Progress: ${progress}/${needsEnrichment.length} (${(progress/needsEnrichment.length*100).toFixed(1)}%)`);
      console.log(`   Enriched: ${stats.enriched}, Failed: ${stats.failed}, Skipped: ${stats.skipped}`);
      console.log(`   Text enriched: ${stats.textEnriched}, SVGs generated: ${stats.svgGenerated}, Solutions generated: ${stats.solutionsGenerated || 0}`);
      console.log(`   Auto-fixes: Questions fixed: ${stats.questionsFixed || 0}, Multi-part fixed: ${stats.multiPartFixed || 0}\n`);
    }
  }

  // Final report
  console.log('\n' + '='.repeat(70));
  console.log('\n✅ Enrichment Complete!\n');
  console.log('📊 Final Statistics:');
  console.log(`   Total processed: ${stats.total}`);
  console.log(`   Successfully enriched: ${stats.enriched} (${(stats.enriched/stats.total*100).toFixed(1)}%)`);
  console.log(`   Text enrichments: ${stats.textEnriched}`);
  console.log(`   SVGs generated: ${stats.svgGenerated}`);
  console.log(`   Solutions generated: ${stats.solutionsGenerated || 0}`);
  console.log(`   Questions auto-fixed: ${stats.questionsFixed || 0}`);
  console.log(`   Multi-part options fixed: ${stats.multiPartFixed || 0}`);
  console.log(`   Failed: ${stats.failed} (${(stats.failed/stats.total*100).toFixed(1)}%)`);
  console.log(`   Skipped: ${stats.skipped} (${(stats.skipped/stats.total*100).toFixed(1)}%)`);
}

enrichExistingQuestions().catch(console.error);
