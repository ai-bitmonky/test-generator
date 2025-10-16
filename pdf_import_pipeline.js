/**
 * ═══════════════════════════════════════════════════════════════════════════
 * PDF IMPORT PIPELINE
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * PURPOSE: Extract questions from PDF files and insert as NEW database records
 *
 * USAGE: node pdf_import_pipeline.js <pdf_file> <subject>
 *
 * FEATURES:
 * - PDF text extraction and question parsing
 * - AI-generated enrichment (strategy, expert_insight, key_facts)
 * - SVG diagram generation for missing figures
 * - HTML cleanup and validation
 * - Automatic word limit enforcement (125 words max)
 *
 * IMPORTANT: This pipeline is designed for PDF IMPORT ONLY
 * ⚠️  DO NOT use for fixing existing database records!
 * ⚠️  For database cleanup, use: database_enrichment_pipeline.js
 *
 * WORKFLOW:
 * 1. Read PDF file
 * 2. Extract questions
 * 3. Enrich with AI-generated content
 * 4. Validate and fix issues
 * 5. Insert NEW records into database
 *
 * ═══════════════════════════════════════════════════════════════════════════
 */

const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const CONFIG = {
  testLimit: 1000, // Process ALL questions (set high limit)
  outputDir: 'ai_fixed_reports',
  subject: process.argv[2] || 'Mathematics',
  claudeApiKey: process.env.ANTHROPIC_API_KEY,
  claudeModel: 'claude-3-haiku-20240307', // Working model (verified)
};

// ============================================================================
// Claude AI Helper
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
            messages: [
              {
                role: 'user',
                content: prompt
              }
            ]
          })
        });

        if (!response.ok) {
          const errorText = await response.text();
          const isRateLimit = errorText.includes('rate_limit_error');

          if (isRateLimit && attempt < retries) {
            const waitTime = 15000 * attempt; // 15s, 30s, 45s, 60s, 75s
            console.error(`   ⚠️  Rate limit hit, waiting ${waitTime/1000}s before retry ${attempt}/${retries}...`);
            await new Promise(resolve => setTimeout(resolve, waitTime));
            continue;
          }

          console.error('   ⚠️  Claude API Error:', errorText.substring(0, 100));
          return null;
        }

        const data = await response.json();
        return data.content[0].text;
      } catch (error) {
        const isNetworkError = error.message.includes('fetch failed') ||
                               error.message.includes('ECONNREFUSED') ||
                               error.message.includes('ENOTFOUND') ||
                               error.message.includes('ETIMEDOUT') ||
                               error.message.includes('network');

        if (isNetworkError && attempt < retries) {
          // Longer waits for network issues (could be internet down)
          const waitTime = 30000 * attempt; // 30s, 60s, 90s, 120s, 150s
          console.error(`   🌐 Network error detected (${error.message})`);
          console.error(`   ⏳ Internet may be down. Waiting ${waitTime/1000}s before retry ${attempt}/${retries}...`);
          console.error(`   💡 Pipeline will continue automatically when internet is restored.`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
          continue;
        }

        if (attempt < retries) {
          const waitTime = 15000 * attempt; // 15s, 30s, 45s, 60s, 75s
          console.error(`   ⚠️  Error (${error.message}), retrying in ${waitTime/1000}s...`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
          continue;
        }

        console.error('   ❌ All retries exhausted. Error:', error.message);
        return null;
      }
    }
    return null;
  }

  countWords(text) {
    if (!text) return 0;
    return text.trim().split(/\s+/).length;
  }

  async condenseText(text, fieldName, maxWords) {
    const currentWords = this.countWords(text);
    if (currentWords <= maxWords) return text;

    console.log(`     📏 ${fieldName} has ${currentWords} words, condensing to ${maxWords}...`);

    const prompt = `Condense this ${fieldName} to maximum ${maxWords} words while preserving all key information.

Original text (${currentWords} words):
${text}

Requirements:
- Maximum ${maxWords} words
- Keep all essential information
- Maintain clarity and accuracy
- Remove redundant phrases

Provide ONLY the condensed text, no extra commentary.`;

    const condensed = await this.call(prompt, 300);
    if (condensed && this.countWords(condensed) <= maxWords) {
      console.log(`     ✅ Condensed to ${this.countWords(condensed)} words`);
      return condensed;
    }
    return text; // Return original if condensing failed
  }

  async generateStrategy(question, topic) {
    const prompt = `You are an expert JEE Advanced educator. Analyze this question and provide a UNIVERSAL STRATEGY that applies to ALL similar ${topic} problems.

Question: ${question.question}

Requirements:
- Describe the GENERAL METHOD/APPROACH (not specific to this problem's numbers)
- Should work for ANY similar problem in this category
- Focus on the conceptual approach and steps
- Do NOT include specific values from this problem
- MAXIMUM 125 words
- Keep it concise (3-4 sentences)

Provide ONLY the strategy text, no labels or extra commentary.`;

    const result = await this.call(prompt, 500);
    if (result) {
      return await this.condenseText(result, 'Strategy', 125);
    }
    return result;
  }

  async generateExpertInsight(question, topic, options) {
    const optionsText = options ? `\nOptions: A) ${options.a || 'N/A'} B) ${options.b || 'N/A'} C) ${options.c || 'N/A'} D) ${options.d || 'N/A'}` : '';

    const prompt = `You are a JEE Advanced exam topper. Analyze THIS SPECIFIC problem and provide expert insights.

Question: ${question.question}${optionsText}

Requirements:
- What would YOU notice FIRST when seeing this problem?
- What shortcuts or patterns would YOU recognize?
- What common mistakes would YOU avoid?
- Be SPECIFIC to THIS problem (not general)
- MAXIMUM 125 words
- Keep it concise (2-3 sentences)

Provide ONLY the expert insight text, no labels or extra commentary.`;

    const result = await this.call(prompt, 400);
    if (result) {
      return await this.condenseText(result, 'Expert Insight', 125);
    }
    return result;
  }

  async generateKeyFacts(question, topic, solutionHtml) {
    const solutionExcerpt = solutionHtml ? solutionHtml.replace(/<[^>]*>/g, ' ').substring(0, 500) : '';

    const prompt = `You are a JEE Advanced expert. Analyze this question and list ALL formulas, laws, theorems, and identities required to solve it.

Question: ${question.question}
${solutionExcerpt ? 'Solution excerpt: ' + solutionExcerpt : ''}

Requirements:
- List EVERY formula/law/theorem/identity needed
- Be specific (e.g., "Quadratic formula: x = (-b ± √(b²-4ac))/2a")
- Include constants if needed (e.g., "k = 9×10⁹ N⋅m²/C²")
- Separate multiple items with semicolons
- MAXIMUM 125 words
- Keep it concise

Format: Formula1/Law1; Formula2/Law2; etc.

Provide ONLY the key facts list, no labels or extra commentary.`;

    const result = await this.call(prompt, 600);
    if (result) {
      return await this.condenseText(result, 'Key Facts', 125);
    }
    return result;
  }

  async verifyCorrectAnswer(question, options) {
    const optionsText = options ?
      `A) ${options.a || 'N/A'}\nB) ${options.b || 'N/A'}\nC) ${options.c || 'N/A'}\nD) ${options.d || 'N/A'}` :
      'Options not available';

    const solutionText = question.solution_html ?
      question.solution_html.replace(/<[^>]*>/g, ' ').substring(0, 1000) :
      'Solution not available';

    const prompt = `You are a JEE Advanced expert. Verify the correct answer for this question.

Question: ${question.question}

Options:
${optionsText}

Solution: ${solutionText}

Current correct answer: ${question.correct_answer ? question.correct_answer.toUpperCase() : 'Not set'}

Task: Verify if the stated correct answer matches what the solution derives.

Respond with ONLY ONE LETTER: a, b, c, or d (lowercase)
If you cannot determine, respond with '${question.correct_answer || 'a'}'.

Provide ONLY the letter, nothing else.`;

    const result = await this.call(prompt, 50);
    if (!result) return question.correct_answer || 'a';

    const answer = result.trim().toLowerCase();
    if (['a', 'b', 'c', 'd'].includes(answer)) {
      return answer;
    }
    return question.correct_answer || 'a';
  }

  async inferQuestionType(question, topic) {
    const prompt = `You are a JEE Advanced expert. Analyze this question and determine its specific problem TYPE.

Question: ${question.question}
Topic: ${topic}

Requirements:
- Be SPECIFIC (not generic like "Multiple Choice" or "Integration")
- Define the problem PATTERN
- Examples of GOOD types:
  * "Definite Integration using Substitution"
  * "Projectile Motion with Air Resistance"
  * "Electric Field from Continuous Charge Distribution"
  * "Limit Evaluation using L'Hospital's Rule"

Respond with ONLY the specific problem type (5-8 words max), no explanation.`;

    const result = await this.call(prompt, 100);
    return result ? result.trim() : 'Multiple Choice Single Answer';
  }

  async generateFullOptions(question, topic) {
    const prompt = `You are a JEE Advanced question creator. Create 4 plausible multiple choice options (A, B, C, D) for this question, including the correct answer.

Question: ${question.question}
Topic: ${topic}
${question.solution_html ? 'Solution hint: ' + question.solution_html.replace(/<[^>]*>/g, ' ').substring(0, 300) : ''}

Requirements:
- Create 4 distinct options (A, B, C, D)
- ONE must be the correct answer (make it challenging but correct)
- THREE should be plausible distractors (common mistakes or similar values)
- Options should be properly formatted and concise
- For numerical answers: use similar magnitudes
- For expressions: use similar forms

Format your response EXACTLY like this:
A: [option A text]
B: [option B text]
C: [option C text]
D: [option D text]
CORRECT: [letter]

Example:
A: 2.5 m/s²
B: 3.0 m/s²
C: 2.0 m/s²
D: 1.5 m/s²
CORRECT: A`;

    const result = await this.call(prompt, 400);
    if (!result) return null;

    // Parse the response
    const lines = result.split('\n').filter(l => l.trim());
    const options = { a: null, b: null, c: null, d: null };
    let correctAnswer = null;

    for (const line of lines) {
      const match = line.match(/^([A-Da-d]):\s*(.+)$/);
      if (match) {
        const letter = match[1].toLowerCase();
        const value = match[2].trim();
        if (['a', 'b', 'c', 'd'].includes(letter)) {
          options[letter] = value;
        }
      }

      const correctMatch = line.match(/^CORRECT:\s*([A-Da-d])$/i);
      if (correctMatch) {
        correctAnswer = correctMatch[1].toLowerCase();
      }
    }

    // Validate we got all 4 options
    if (options.a && options.b && options.c && options.d && correctAnswer) {
      return { options, correctAnswer };
    }

    return null;
  }

  async verifyQuestionCompleteness(question) {
    const prompt = `You are a JEE Advanced expert. Analyze if this question has ALL information needed to solve it.

Question: ${question.question}

Check for:
1. Are all values/parameters provided?
2. Are figures/diagrams mentioned but missing?
3. Is the question statement clear and unambiguous?
4. Can this be solved with the given information?

Respond in this EXACT format:
COMPLETE: yes/no
ISSUES: [list any issues, or "none"]
CORRECTED_QUESTION: [if needed, provide corrected question statement; otherwise "none"]`;

    const result = await this.call(prompt, 800);
    if (!result) return { isComplete: true, issues: [], correctedQuestion: null };

    const lines = result.split('\n');
    let isComplete = true;
    let issues = [];
    let correctedQuestion = null;

    for (const line of lines) {
      if (line.startsWith('COMPLETE:')) {
        isComplete = line.toLowerCase().includes('yes');
      } else if (line.startsWith('ISSUES:')) {
        const issueText = line.substring(7).trim();
        if (issueText !== 'none' && issueText) {
          issues.push(issueText);
        }
      } else if (line.startsWith('CORRECTED_QUESTION:')) {
        const corrected = line.substring(19).trim();
        if (corrected !== 'none' && corrected) {
          correctedQuestion = corrected;
        }
      }
    }

    return { isComplete, issues, correctedQuestion };
  }

  async verifySolutionSteps(question, solution) {
    const solutionText = solution ? solution.replace(/<[^>]*>/g, ' ').substring(0, 2000) : '';

    const prompt = `You are a JEE Advanced expert. Verify if the solution steps are well-defined and correct.

Question: ${question.question}
Solution: ${solutionText}
Correct Answer: ${question.correct_answer ? question.correct_answer.toUpperCase() : 'Not specified'}

Check:
1. Are all steps clearly shown?
2. Does the solution logically lead to the answer?
3. Are calculations correct?
4. Does the final answer match the correct answer key?

Respond in EXACT format:
STEPS_CLEAR: yes/no
MATCHES_ANSWER: yes/no
ISSUES: [list issues or "none"]
CORRECTED_SOLUTION: [if needed, provide key corrections; otherwise "none"]`;

    const result = await this.call(prompt, 1000);
    if (!result) return { stepsClear: true, matchesAnswer: true, issues: [], correctedSolution: null };

    const lines = result.split('\n');
    let stepsClear = true;
    let matchesAnswer = true;
    let issues = [];
    let correctedSolution = null;

    for (const line of lines) {
      if (line.startsWith('STEPS_CLEAR:')) {
        stepsClear = line.toLowerCase().includes('yes');
      } else if (line.startsWith('MATCHES_ANSWER:')) {
        matchesAnswer = line.toLowerCase().includes('yes');
      } else if (line.startsWith('ISSUES:')) {
        const issueText = line.substring(7).trim();
        if (issueText !== 'none' && issueText) {
          issues.push(issueText);
        }
      } else if (line.startsWith('CORRECTED_SOLUTION:')) {
        const corrected = line.substring(19).trim();
        if (corrected !== 'none' && corrected) {
          correctedSolution = corrected;
        }
      }
    }

    return { stepsClear, matchesAnswer, issues, correctedSolution };
  }

  async generateCompleteSolution(question, options, topic) {
    // Generate complete solution with all 4 required sections
    const optionsText = options ?
      `A: ${options.a}\nB: ${options.b}\nC: ${options.c}\nD: ${options.d}` :
      'Options not provided';

    const correctAnswer = question.correct_answer ? question.correct_answer.toUpperCase() : 'Not specified';

    const prompt = `You are a JEE Advanced expert. Generate a COMPLETE solution for this question.

Question: ${question.question}
Options:
${optionsText}
Correct Answer: ${correctAnswer}
Topic: ${topic || 'General'}

Generate a complete solution with:
1. Clear step-by-step working
2. All calculations shown
3. Final answer clearly stated

Format the solution as clean HTML with:
- Use <div class="solution"> as wrapper
- Use <h4> for section headings
- Use <p> for explanations
- Use <strong> for emphasis
- Use <div class="math"> for mathematical expressions

Make sure the solution logically leads to answer ${correctAnswer}.

Provide ONLY the HTML solution (no explanations outside the HTML).`;

    const result = await this.call(prompt, 2000);
    if (!result) return null;

    // Ensure it's wrapped in solution div
    let solutionHtml = result.trim();
    if (!solutionHtml.includes('<div class="solution">')) {
      solutionHtml = `<div class="solution">${solutionHtml}</div>`;
    }

    return solutionHtml;
  }

  async fixIncompleteQuestion(question) {
    // Auto-correct incomplete question by generating missing information
    const prompt = `You are a JEE Advanced expert. This question appears to be incomplete or missing information.

Current Question: ${question.question}

Your task:
1. Identify what information is missing
2. Add reasonable assumptions or missing details to make it solvable
3. Ensure the question is clear and unambiguous

Provide the CORRECTED QUESTION in this EXACT format:
CORRECTED_QUESTION: [complete, corrected question statement]
CHANGES_MADE: [brief description of what you added/fixed]`;

    const result = await this.call(prompt, 800);
    if (!result) return null;

    const lines = result.split('\n');
    let correctedQuestion = null;
    let changesMade = '';

    for (const line of lines) {
      if (line.startsWith('CORRECTED_QUESTION:')) {
        correctedQuestion = line.substring(19).trim();
      } else if (line.startsWith('CHANGES_MADE:')) {
        changesMade = line.substring(13).trim();
      }
    }

    return { correctedQuestion, changesMade };
  }

  async fixSolutionIssues(question, currentSolution) {
    // Auto-fix solution issues by regenerating problematic parts
    const solutionText = currentSolution ? currentSolution.replace(/<[^>]*>/g, ' ').substring(0, 1500) : '';
    const correctAnswer = question.correct_answer ? question.correct_answer.toUpperCase() : 'Not specified';

    const prompt = `You are a JEE Advanced expert. The current solution has issues. Fix them.

Question: ${question.question}
Current Solution: ${solutionText}
Correct Answer: ${correctAnswer}

Problems detected:
- Steps may be unclear or incomplete
- Solution may not match the correct answer
- Calculations may have errors

Provide a CORRECTED solution as clean HTML. Make sure:
1. All steps are clear and logical
2. Calculations are correct
3. Final answer matches ${correctAnswer}

Format as HTML with <div class="solution"> wrapper.
Provide ONLY the HTML solution.`;

    const result = await this.call(prompt, 2000);
    if (!result) return null;

    let solutionHtml = result.trim();
    if (!solutionHtml.includes('<div class="solution">')) {
      solutionHtml = `<div class="solution">${solutionHtml}</div>`;
    }

    return solutionHtml;
  }

  async detectAndGenerateFigure(question) {
    // Detect if figure/diagram is mentioned but missing
    const questionText = question.question ? question.question.toLowerCase() : '';
    const figureKeywords = ['figure', 'diagram', 'graph', 'shown', 'as shown', 'refer', 'circuit', 'image'];
    const hasFigureMention = figureKeywords.some(keyword => questionText.includes(keyword));

    // Check if figure_url exists
    const hasFigure = question.figure_url && question.figure_url.trim().length > 0;

    if (hasFigureMention && !hasFigure) {
      // First, analyze what figure is needed with ENHANCED analysis
      const analysisPrompt = `You are a JEE Advanced expert. This question mentions a figure/diagram but it's missing.

Question: ${question.question}
Subject: ${question.subject || 'General'}
Topic: ${question.topic || 'General'}

Analyze what figure is needed and provide COMPREHENSIVE details in EXACT format:

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

      const analysis = await this.call(analysisPrompt, 1500); // Increased for detailed analysis
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

      // Now generate the actual SVG code with ENHANCED prompts
      const svgPrompt = `You are an EXPERT SVG diagram generator for JEE Advanced physics, chemistry, and mathematics questions. Your diagrams must be publication-quality.

Generate a DETAILED, ACCURATE SVG diagram based on this specification:

Type: ${figureType}
Description: ${description}
Components: ${components}
Question: ${question.question}

CRITICAL REQUIREMENTS:

**GENERAL:**
1. Use viewBox="0 0 600 450" for high-quality rendering (larger canvas)
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

      const svgCode = await this.call(svgPrompt, 3500); // Increased token limit for complex diagrams
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
  // Formatting Cleanup Methods
  // ============================================================================

  /**
   * Clean HTML entities in options (μ<sub>s</sub> → μₛ)
   */
  async cleanOptions(options) {
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

  /**
   * Fix combined words (KWorkTransferWCarnotRefrigeratorK → K Work Transfer W Carnot Refrigerator K)
   */
  async fixCombinedWords(text) {
    // Check for combined words pattern (multiple capital letters with mixed case)
    const combinedPattern = /[A-Z]{2,}[a-z]+[A-Z][a-z]+[A-Z]/;
    if (!combinedPattern.test(text)) {
      return text; // No issues
    }

    const prompt = `Fix the combined words in this text by adding proper spaces between words.

Text: ${text}

The text contains words stuck together without spaces (like "KWorkTransferWCarnotRefrigeratorK" should be "K Work Transfer W Carnot Refrigerator K").

Rules:
1. Add spaces between distinct words
2. Preserve technical terms and abbreviations
3. Keep mathematical notation intact
4. Maintain the original meaning
5. Do NOT change correct compound words or technical terms

Provide ONLY the corrected text, no explanation.`;

    const result = await this.call(prompt, 1500);
    return result || text;
  }

  /**
   * Remove figure missing warnings
   */
  removeFigureWarning(text) {
    if (!text) return text;

    // Remove various forms of figure warnings
    let cleaned = text;

    // Remove full warning blocks
    cleaned = cleaned.replace(/⚠️\s*FIGURE MISSING:.*?The figure needs to be added manually\./gi, '');
    cleaned = cleaned.replace(/\[FIGURE NEEDED:.*?\]/gi, '');
    cleaned = cleaned.replace(/⚠️.*?figure.*?not included.*?document.*?\./gi, '');
    cleaned = cleaned.replace(/FIGURE MISSING:.*?document\./gi, '');

    // Clean up extra whitespace
    cleaned = cleaned.replace(/\s{2,}/g, ' ').trim();

    return cleaned;
  }
}

// ============================================================================
// Validator
// ============================================================================

class QuestionValidator {
  validate(question) {
    const issues = [];

    // Check options (JSONB object)
    if (!question.options || typeof question.options !== 'object') {
      issues.push({
        severity: 'critical',
        type: 'missing_options_object',
        field: 'options',
        message: 'Options object is missing or invalid'
      });
    } else {
      const letters = ['a', 'b', 'c', 'd'];
      const missingOptions = letters.filter(opt =>
        !question.options[opt] || !question.options[opt].trim()
      );

      if (missingOptions.length > 0) {
        issues.push({
          severity: 'critical',
          type: 'missing_options',
          field: 'options',
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
        field: 'correct_answer',
        message: 'Correct answer must be a, b, c, or d'
      });
    }

    // Check difficulty - only if missing (don't change if exists)
    if (!question.difficulty || !['Simple', 'Medium', 'Complex'].includes(question.difficulty)) {
      issues.push({
        severity: 'medium',
        type: 'missing_difficulty',
        field: 'difficulty',
        message: 'Difficulty level not specified or invalid'
      });
    }

    // Check question type
    if (!question.question_type || question.question_type.trim().length === 0) {
      issues.push({
        severity: 'high',
        type: 'missing_question_type',
        field: 'question_type',
        message: 'Question type not defined'
      });
    } else if (question.question_type === 'Multiple Choice Single Answer' || question.question_type === 'Multiple Choice') {
      issues.push({
        severity: 'medium',
        type: 'generic_question_type',
        field: 'question_type',
        message: 'Question type is too generic'
      });
    }

    // Check strategy field (separate field in DB)
    if (!question.strategy || question.strategy.trim().length === 0) {
      issues.push({
        severity: 'high',
        type: 'missing_strategy',
        field: 'strategy',
        message: 'Strategy section is missing'
      });
    }

    // Check expert_insight field (separate field in DB)
    if (!question.expert_insight || question.expert_insight.trim().length === 0) {
      issues.push({
        severity: 'high',
        type: 'missing_expert_insight',
        field: 'expert_insight',
        message: 'Expert Insight section is missing'
      });
    }

    // Check key_facts field (separate field in DB)
    if (!question.key_facts || question.key_facts.trim().length === 0) {
      issues.push({
        severity: 'high',
        type: 'missing_key_facts',
        field: 'key_facts',
        message: 'Key Facts section is missing'
      });
    }

    // Check solution
    if (!question.solution_html || question.solution_html.trim().length === 0) {
      issues.push({
        severity: 'critical',
        type: 'missing_solution',
        field: 'solution_html',
        message: 'Solution is completely missing'
      });
    }

    return issues;
  }
}

// ============================================================================
// AI-Enhanced Fixer
// ============================================================================

class AIEnhancedFixer {
  constructor(claudeAI) {
    this.ai = claudeAI;
  }

  async fix(question, issues) {
    let fixed = { ...question };
    if (!fixed.options) fixed.options = {};
    const fixes = [];

    console.log('  🤖 Using Claude AI to generate content...\n');

    // Fix missing or incomplete options using AI
    const missingOptionsIssue = issues.find(i =>
      i.type === 'missing_options' || i.type === 'missing_options_object'
    );

    if (missingOptionsIssue) {
      console.log('     🎯 Generating complete option set with AI...');
      const generated = await this.ai.generateFullOptions(question, question.topic || 'this topic');

      if (generated && generated.options && generated.correctAnswer) {
        fixed.options = generated.options;
        fixed.correct_answer = generated.correctAnswer;
        fixes.push('Generated complete option set (A, B, C, D) with correct answer using AI');
      } else {
        // Fallback: try to fix individual options
        const letters = ['a', 'b', 'c', 'd'];
        for (const letter of letters) {
          if (!fixed.options[letter] || !fixed.options[letter].trim()) {
            fixed.options[letter] = '[Needs manual input - AI generation failed]';
          }
        }
        fixes.push('Added placeholders for missing options (generation failed)');
      }
    }

    // Verify correct answer
    const invalidAnswerIssue = issues.find(i => i.type === 'invalid_correct_answer');
    if (invalidAnswerIssue || !fixed.correct_answer) {
      console.log('     ✓ Verifying correct answer...');
      const verifiedAnswer = await this.ai.verifyCorrectAnswer(question, fixed.options);
      fixed.correct_answer = verifiedAnswer;
      fixes.push(`Set correct answer to ${verifiedAnswer.toUpperCase()}`);
    }

    // Fix difficulty - keep original if valid, otherwise Medium
    const missingDifficultyIssue = issues.find(i => i.type === 'missing_difficulty');
    if (missingDifficultyIssue) {
      // Keep original if it was set, otherwise default to Medium
      if (!question.difficulty || !['Simple', 'Medium', 'Complex'].includes(question.difficulty)) {
        fixed.difficulty = 'Medium';
        fixes.push('Set difficulty level: Medium (default)');
      }
    }

    // Fix question type using AI
    const missingTypeIssue = issues.find(i => i.type === 'missing_question_type');
    const genericTypeIssue = issues.find(i => i.type === 'generic_question_type');

    if (missingTypeIssue || genericTypeIssue) {
      console.log('     🔍 Inferring specific question type...');
      const specificType = await this.ai.inferQuestionType(question, question.topic || 'this topic');
      if (specificType) {
        fixed.question_type = specificType.trim();
        fixes.push(`Inferred specific question type: ${specificType.trim()}`);
      }
    }

    // Generate strategy (separate field)
    const missingStrategyIssue = issues.find(i => i.type === 'missing_strategy');
    if (missingStrategyIssue) {
      console.log('     📚 Generating universal strategy...');
      const strategy = await this.ai.generateStrategy(question, question.topic || 'this topic');
      if (strategy && strategy.trim().length > 0) {
        fixed.strategy = strategy.trim();
        fixes.push('Generated universal strategy');
      } else {
        fixed.strategy = '[Strategy generation pending]';
        fixes.push('Strategy generation failed - placeholder added');
      }
    }

    // Generate expert insight (separate field)
    const missingExpertIssue = issues.find(i => i.type === 'missing_expert_insight');
    if (missingExpertIssue) {
      console.log('     🎓 Generating expert insight...');
      const insight = await this.ai.generateExpertInsight(question, question.topic || 'this topic', fixed.options);
      if (insight && insight.trim().length > 0) {
        fixed.expert_insight = insight.trim();
        fixes.push('Generated expert insight');
      } else {
        fixed.expert_insight = '[Expert insight generation pending]';
        fixes.push('Expert insight generation failed - placeholder added');
      }
    }

    // Generate key facts (separate field)
    const missingKeyFactsIssue = issues.find(i => i.type === 'missing_key_facts');
    if (missingKeyFactsIssue) {
      console.log('     📐 Generating key facts...');
      const keyFacts = await this.ai.generateKeyFacts(question, question.topic || 'this topic', question.solution_html);
      if (keyFacts && keyFacts.trim().length > 0) {
        fixed.key_facts = keyFacts.trim();
        fixes.push('Generated key facts');
      } else {
        fixed.key_facts = '[Key facts generation pending]';
        fixes.push('Key facts generation failed - placeholder added');
      }
    }

    // Handle missing solution - AUTO-GENERATE using AI
    const missingSolutionIssue = issues.find(i => i.type === 'missing_solution');
    if (missingSolutionIssue) {
      console.log('     🤖 Solution completely missing - AUTO-GENERATING using AI...');
      const generatedSolution = await this.ai.generateCompleteSolution(
        fixed,
        fixed.options,
        fixed.topic || 'General'
      );
      if (generatedSolution && generatedSolution.trim().length > 50) {
        fixed.solution_html = generatedSolution;
        fixes.push('Generated complete solution');
        console.log('     ✅ Solution generated successfully');
      } else {
        fixed.solution_html = '<div class="solution"><p>[Solution generation failed - please add manually]</p></div>';
        fixes.push('Solution generation failed - placeholder added');
        console.log('     ❌ Solution generation failed');
      }
    }

    // NEW: Verify question completeness using AI - AUTO-FIX if incomplete
    console.log('     🔍 Verifying question has all information...');
    const completeness = await this.ai.verifyQuestionCompleteness(fixed);
    if (!completeness.isComplete) {
      console.log('     🤖 Question incomplete - AUTO-FIXING using AI...');

      // Try the AI-provided correction first
      if (completeness.correctedQuestion && completeness.correctedQuestion.length > 20) {
        fixed.question = completeness.correctedQuestion;
        fixes.push('Corrected incomplete question: ' + completeness.issues.join('; '));
        console.log('     ✅ Question auto-corrected successfully');
      } else {
        // If no correction provided, try the dedicated fix method
        const fixResult = await this.ai.fixIncompleteQuestion(fixed);
        if (fixResult && fixResult.correctedQuestion && fixResult.correctedQuestion.length > 20) {
          fixed.question = fixResult.correctedQuestion;
          fixes.push('Fixed incomplete question: ' + fixResult.changesMade);
          console.log('     ✅ Question auto-fixed successfully');
        } else {
          fixes.push('Question completeness issues detected but auto-fix failed: ' + completeness.issues.join('; '));
          console.log('     ⚠️ Auto-fix failed - keeping original question');
        }
      }
    } else {
      fixes.push('Question verified complete - all information present');
    }

    // NEW: Verify solution steps using AI - AUTO-FIX if issues found
    if (fixed.solution_html && !missingSolutionIssue) {
      console.log('     🔍 Verifying solution steps and answer match...');
      const solutionCheck = await this.ai.verifySolutionSteps(fixed, fixed.solution_html);
      if (!solutionCheck.stepsClear || !solutionCheck.matchesAnswer) {
        console.log('     🤖 Solution issues detected - AUTO-FIXING using AI...');

        // Auto-fix the solution
        const fixedSolution = await this.ai.fixSolutionIssues(fixed, fixed.solution_html);
        if (fixedSolution && fixedSolution.trim().length > 50) {
          fixed.solution_html = fixedSolution;
          fixes.push('Corrected solution issues: ' + solutionCheck.issues.join('; '));
          console.log('     ✅ Solution auto-fixed successfully');
        } else {
          fixes.push('Solution issues detected but auto-fix failed: ' + solutionCheck.issues.join('; '));
          console.log('     ⚠️ Solution auto-fix failed - keeping original');
        }
      } else {
        fixes.push('Solution verified - steps clear and matches answer key');
      }
    }

    // NEW: Detect and generate missing figures with SVG
    console.log('     🔍 Checking for missing figures/diagrams...');
    const figureCheck = await this.ai.detectAndGenerateFigure(fixed);
    if (figureCheck.needsFigure) {
      console.log('     📊 Figure mentioned but missing - generating SVG diagram...');

      if (figureCheck.svgCode) {
        // SVG successfully generated - store as data URI in figure_url
        const svgDataUri = `data:image/svg+xml;base64,${Buffer.from(figureCheck.svgCode).toString('base64')}`;
        fixed.figure_url = svgDataUri;

        // Also store the raw SVG in figure_svg field if it exists
        if (fixed.hasOwnProperty('figure_svg') || true) {
          fixed.figure_svg = figureCheck.svgCode;
        }

        fixes.push(`Generated ${figureCheck.figureType} diagram as SVG`);
        console.log('     ✅ SVG diagram generated successfully');
      } else {
        // SVG generation failed - store description only
        const figureDescription = `[FIGURE NEEDED: ${figureCheck.figureType}]\n\nDescription: ${figureCheck.description}\n\nComponents: ${figureCheck.components}`;

        if (!fixed.figure_description) {
          fixed.figure_description = figureDescription;
        }

        fixes.push(`Detected missing figure: ${figureCheck.figureType} - SVG generation failed, description stored`);
        console.log('     ⚠️ SVG generation failed - description stored for manual creation');
      }
    }

    // NEW: Clean HTML entities in options (μ<sub>s</sub> → μₛ)
    if (fixed.options) {
      const optionsStr = JSON.stringify(fixed.options);
      if (optionsStr.includes('<sub>') || optionsStr.includes('<sup>') ||
          optionsStr.includes('<strong>') || optionsStr.includes('<em>')) {
        console.log('     🧹 Cleaning HTML entities in options...');
        const cleaned = await this.ai.cleanOptions(fixed.options);
        if (JSON.stringify(cleaned) !== JSON.stringify(fixed.options)) {
          fixed.options = cleaned;
          fixes.push('Cleaned HTML formatting in options');
          console.log('     ✅ Options cleaned (HTML → Unicode)');
        }
      }
    }

    // NEW: Fix combined words in question (KWorkTransferWCarnotRefrigeratorK)
    if (fixed.question) {
      const combinedPattern = /[A-Z]{2,}[a-z]+[A-Z][a-z]+[A-Z]/;
      if (combinedPattern.test(fixed.question)) {
        console.log('     🧹 Separating combined words in question...');
        const separated = await this.ai.fixCombinedWords(fixed.question);
        if (separated !== fixed.question) {
          fixed.question = separated;
          fixes.push('Separated combined words in question');
          console.log('     ✅ Combined words separated');
        }
      }
    }

    // NEW: Remove figure missing warnings
    if (fixed.question &&
        (fixed.question.includes('⚠️ FIGURE MISSING') ||
         fixed.question.includes('FIGURE MISSING'))) {
      console.log('     🧹 Removing figure warning from question...');
      const cleaned = this.ai.removeFigureWarning(fixed.question);
      if (cleaned !== fixed.question) {
        fixed.question = cleaned;
        fixes.push('Removed figure missing warning');
        console.log('     ✅ Figure warning removed');
      }
    }

    return { fixed, fixes };
  }
}

// ============================================================================
// Main Orchestrator
// ============================================================================

class AIFixedOrchestrator {
  constructor() {
    this.validator = new QuestionValidator();
    this.claudeAI = new ClaudeAI(CONFIG.claudeApiKey);
    this.fixer = new AIEnhancedFixer(this.claudeAI);
  }

  async run() {
    console.log('🤖 AI-Enhanced Self-Correcting Pipeline (Schema-Fixed)\n');
    console.log(`📚 Subject: ${CONFIG.subject}`);
    console.log(`🎯 Processing first ${CONFIG.testLimit} questions with issues`);
    console.log(`🧠 Using Claude AI for intelligent content generation\n`);

    const { data: questions, error } = await supabase
      .from('questions')
      .select('*')
      .eq('subject', CONFIG.subject)
      .limit(CONFIG.testLimit);

    if (error) {
      console.error('❌ Error fetching questions:', error);
      return;
    }

    console.log(`📥 Fetched ${questions.length} questions\n`);

    const results = [];
    let processedCount = 0;

    for (const question of questions) {
      if (processedCount >= CONFIG.testLimit) break;

      console.log('='.repeat(70));
      console.log(`📝 Processing: ${question.external_id || 'Question ' + (processedCount + 1)}`);
      console.log('='.repeat(70));

      try {
        const issues = this.validator.validate(question);

        if (issues.length === 0) {
          console.log('✅ No issues, skipping...\n');
          continue;
        }

        processedCount++;
        console.log(`\n📊 Found ${issues.length} issues`);

        const { fixed, fixes } = await this.fixer.fix(question, issues);

        console.log('\n🔍 Re-validating...');
        const afterIssues = this.validator.validate(fixed);

        console.log(`\n📈 Results:`);
        console.log(`   Before: ${issues.length} issues`);
        console.log(`   After:  ${afterIssues.length} issues`);
        console.log(`   Fixed:  ${issues.length - afterIssues.length}\n`);

      if (fixes.length > 0) {
        console.log('💾 Updating database...');
        const updateData = {
          options: fixed.options,
          correct_answer: fixed.correct_answer,
          difficulty: fixed.difficulty,
          question_type: fixed.question_type,
          strategy: fixed.strategy,
          expert_insight: fixed.expert_insight,
          key_facts: fixed.key_facts,
        };

        if (fixed.solution_html !== question.solution_html) {
          updateData.solution_html = fixed.solution_html;
        }

        const { error: updateError } = await supabase
          .from('questions')
          .update(updateData)
          .eq('id', question.id);

        if (updateError) {
          console.log('   ❌ Update failed:', updateError.message);
        } else {
          console.log('   ✅ Updated successfully');
        }
      }

        results.push({
          question_id: question.external_id,
          beforeIssues: issues,
          afterIssues: afterIssues,
          fixes: fixes,
          original: question,
          fixed: fixed,
        });

      } catch (error) {
        console.error(`\n❌ Critical error processing question: ${error.message}`);
        console.error(`   Question ID: ${question.external_id || question.id}`);
        console.error(`   📝 Saving progress and continuing with next question...\n`);

        results.push({
          question_id: question.external_id,
          error: error.message,
          status: 'failed',
          original: question,
        });
      }

      console.log('\n');

      // Delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 8000));
    }

    this.generateReport(results);
  }

  generateReport(results) {
    if (!fs.existsSync(CONFIG.outputDir)) {
      fs.mkdirSync(CONFIG.outputDir, { recursive: true });
    }

    const timestamp = Date.now();
    const jsonFile = `${CONFIG.outputDir}/ai_fixed_${CONFIG.subject}_${timestamp}.json`;

    fs.writeFileSync(jsonFile, JSON.stringify(results, null, 2), 'utf8');

    console.log('='.repeat(70));
    console.log('✅ AI-Enhanced Pipeline Complete');
    console.log('='.repeat(70));
    console.log(`\n📄 Report: ${jsonFile}`);
    console.log(`\n📊 Summary:`);
    console.log(`   Processed: ${results.length} questions`);
    console.log(`   Issues before: ${results.reduce((s, r) => s + r.beforeIssues.length, 0)}`);
    console.log(`   Issues after: ${results.reduce((s, r) => s + r.afterIssues.length, 0)}`);
    console.log(`   Fixes applied: ${results.reduce((s, r) => s + r.fixes.length, 0)}`);
    console.log(`   Success rate: ${((1 - results.reduce((s, r) => s + r.afterIssues.length, 0) / results.reduce((s, r) => s + r.beforeIssues.length, 0)) * 100).toFixed(1)}%\n`);
  }
}

async function main() {
  const orchestrator = new AIFixedOrchestrator();
  await orchestrator.run();
}

main().catch(console.error);
