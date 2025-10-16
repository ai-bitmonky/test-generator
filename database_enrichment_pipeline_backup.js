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
  console.log('   • Text enrichment (strategy, expert_insight, key_facts)');
  console.log('   • SVG generation for missing figures');
  console.log('   • 100-word limits with auto-condensing');
  console.log('   • HTML entity cleanup in options');
  console.log('   • Combined word separation');
  console.log('   • Figure warning removal');
  console.log('\n' + '='.repeat(70) + '\n');

  const claudeAI = new ClaudeAI(CONFIG.claudeApiKey);

  // Fetch questions needing enrichment
  console.log('📥 Fetching questions needing enrichment...\n');

  const { data: questions, error } = await supabase
    .from('questions')
    .select('*')
    .eq('subject', CONFIG.subject)
    .order('id', { ascending: true });

  if (error) {
    console.error('❌ Error fetching questions:', error);
    return;
  }

  // Filter to those needing any enrichment
  const needsEnrichment = questions.filter(q => {
    const needsText = !q.strategy || q.strategy.trim() === '' || q.strategy === 'Strategy:' ||
      !q.expert_insight || q.expert_insight.trim() === '' || q.expert_insight === 'Expert Insight:' ||
      !q.key_facts || q.key_facts.trim() === '' || q.key_facts === 'Key Facts Used:';

    const needsSVG = (!q.figure_svg || q.figure_svg.trim() === '') &&
      (q.question_html && ['figure', 'diagram', 'graph', 'shown', 'circuit'].some(kw => q.question_html.toLowerCase().includes(kw)));

    return needsText || needsSVG;
  });

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

      // Generate strategy if missing
      if (!q.strategy || q.strategy.trim() === '' || q.strategy === 'Strategy:') {
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
          updates.figure_svg = figureResult.svgCode;
          needsUpdate = true;
          stats.svgGenerated++;
          console.log(`      ✅ SVG generated (${figureResult.figureType})`);
        } else if (figureResult.needsFigure) {
          console.log('      ⚠️  SVG generation failed');
        }
        await new Promise(resolve => setTimeout(resolve, CONFIG.baseDelay));
      }

      // Clean options HTML entities if needed
      if (q.option_a || q.option_b || q.option_c || q.option_d) {
        const options = {
          a: q.option_a,
          b: q.option_b,
          c: q.option_c,
          d: q.option_d
        };
        const cleanedOptions = await claudeAI.cleanOptions(options);
        if (cleanedOptions && JSON.stringify(cleanedOptions) !== JSON.stringify(options)) {
          console.log('   🧹 Cleaning HTML entities in options...');
          if (cleanedOptions.a) updates.option_a = cleanedOptions.a;
          if (cleanedOptions.b) updates.option_b = cleanedOptions.b;
          if (cleanedOptions.c) updates.option_c = cleanedOptions.c;
          if (cleanedOptions.d) updates.option_d = cleanedOptions.d;
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
          console.log(`   ✅ Updated with ${Object.keys(updates).length} fields`);
          stats.enriched++;
        }
      } else {
        console.log('   ⏭️  Skipped (no changes)');
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
      console.log(`   Text enriched: ${stats.textEnriched}, SVGs generated: ${stats.svgGenerated}\n`);
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
  console.log(`   Failed: ${stats.failed} (${(stats.failed/stats.total*100).toFixed(1)}%)`);
  console.log(`   Skipped: ${stats.skipped} (${(stats.skipped/stats.total*100).toFixed(1)}%)`);
}

enrichExistingQuestions().catch(console.error);
