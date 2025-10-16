/**
 * ═══════════════════════════════════════════════════════════════════════════
 * AUTOMATED OPTION GENERATION FOR QUESTIONS WITH MISSING OPTIONS
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * PURPOSE: Generate missing options (a, b, c, d) using Claude AI
 *
 * USAGE: node generate_missing_options.js <subject>
 *
 * FEATURES:
 * ✅ Detects questions with missing options
 * ✅ Analyzes question and solution using AI
 * ✅ Generates 4 plausible options (including correct answer)
 * ✅ Ensures correct answer matches solution
 * ✅ Creates distractors based on common mistakes
 * ✅ Fully automated - no manual intervention needed
 *
 * ═══════════════════════════════════════════════════════════════════════════
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

// IMPORTANT: Use SERVICE_ROLE_KEY for database updates
if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ ERROR: SUPABASE_SERVICE_ROLE_KEY not found in .env.local');
  process.exit(1);
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const CONFIG = {
  subject: process.argv[2] || 'Mathematics',
  claudeApiKey: process.env.ANTHROPIC_API_KEY,
  claudeModel: 'claude-3-haiku-20240307', // Using Haiku (Sonnet not available yet)
  baseDelay: 8000, // 8 seconds between calls (more complex prompts)
  maxRetries: 3,
};

// ============================================================================
// Claude AI Helper for Option Generation
// ============================================================================

class ClaudeAI {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.baseURL = 'https://api.anthropic.com/v1/messages';
  }

  async call(prompt, maxTokens = 2000, retries = 3) {
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
            console.log(`      ⏳ Rate limited. Waiting ${waitTime/1000}s...`);
            await new Promise(resolve => setTimeout(resolve, waitTime));
            continue;
          }

          throw new Error(`API error: ${response.statusText}`);
        }

        const data = await response.json();
        return data.content[0].text;

      } catch (error) {
        if (attempt === retries) {
          throw error;
        }
        console.log(`      ⚠️  Attempt ${attempt} failed, retrying...`);
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
    }
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
  "option_a": "first option text here",
  "option_b": "second option text here",
  "option_c": "third option text here",
  "option_d": "fourth option text here",
  "reasoning": "Brief explanation of why option ${correctAnswer.toUpperCase()} is correct and what mistakes lead to each distractor"
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

    // Validate all 4 options exist
    if (!options.option_a || !options.option_b || !options.option_c || !options.option_d) {
      throw new Error('Generated options missing one or more fields');
    }

    return options;
  }

  /**
   * Verify that generated options are valid
   */
  async verifyOptions(question, options) {
    const correctAnswer = question.correct_answer?.toLowerCase() || 'a';
    const correctOptionText = options[`option_${correctAnswer}`];

    const prompt = `Verify if this option correctly matches the solution:

QUESTION:
${question.question_html || question.question || ''}

SOLUTION:
${question.solution_html || question.solution || ''}

GENERATED OPTION ${correctAnswer.toUpperCase()}:
${correctOptionText}

Does this option correctly represent the final answer from the solution?

Respond with ONLY:
VALID: YES
or
VALID: NO
REASON: [explanation if NO]`;

    const response = await this.call(prompt, 500);
    const isValid = /VALID:\s*YES/i.test(response);

    return {
      isValid,
      reason: isValid ? null : response.match(/REASON:\s*(.+)/i)?.[1]
    };
  }
}

// ============================================================================
// Main Pipeline
// ============================================================================

async function generateMissingOptions() {
  console.log('🚀 Automated Option Generation Pipeline\n');
  console.log(`📚 Subject: ${CONFIG.subject}`);
  console.log(`⏱️  Delay: ${CONFIG.baseDelay}ms between calls`);
  console.log(`🤖 Using: ${CONFIG.claudeModel}`);
  console.log('\n✨ FEATURES:');
  console.log('   • Detects questions with missing options');
  console.log('   • Generates 4 plausible options using AI');
  console.log('   • Ensures correct answer matches solution');
  console.log('   • Creates realistic distractors');
  console.log('   • Verifies generated options');
  console.log('   • Fully automated - no manual intervention');
  console.log('\n' + '='.repeat(70) + '\n');

  const claudeAI = new ClaudeAI(CONFIG.claudeApiKey);

  // Fetch questions with missing options
  console.log('📥 Fetching questions with missing options...\n');

  const { data: questions, error } = await supabase
    .from('questions')
    .select('*')
    .eq('subject', CONFIG.subject)
    .order('id', { ascending: true });

  if (error) {
    console.error('❌ Error fetching questions:', error);
    return;
  }

  // Filter to those with missing options
  const missingOptions = questions.filter(q => {
    const hasAllOptions = q.option_a && q.option_b && q.option_c && q.option_d;
    return !hasAllOptions;
  });

  console.log(`   Total ${CONFIG.subject} questions: ${questions.length}`);
  console.log(`   Missing options: ${missingOptions.length} (${(missingOptions.length/questions.length*100).toFixed(1)}%)\n`);

  if (missingOptions.length === 0) {
    console.log('✅ All questions have complete options!');
    return;
  }

  const stats = {
    total: missingOptions.length,
    generated: 0,
    verified: 0,
    failed: 0,
    skipped: 0
  };

  // Process each question
  for (let i = 0; i < missingOptions.length; i++) {
    const q = missingOptions[i];
    const progress = i + 1;

    console.log(`\n[${progress}/${missingOptions.length}] Processing question ${q.id.substring(0, 8)}...`);
    console.log(`   Topic: ${q.topic || 'N/A'}`);
    console.log(`   Current correct answer: ${q.correct_answer?.toUpperCase() || 'NOT SET'}`);

    try {
      // Skip if no solution available
      if (!q.solution_html && !q.solution) {
        console.log('   ⏭️  Skipping: No solution available to generate options from');
        stats.skipped++;
        continue;
      }

      // Skip if no correct answer specified
      if (!q.correct_answer || !['a', 'b', 'c', 'd'].includes(q.correct_answer.toLowerCase())) {
        console.log('   ⏭️  Skipping: No valid correct answer specified');
        stats.skipped++;
        continue;
      }

      // Generate options
      console.log('   🎯 Generating 4 options using AI...');
      const options = await claudeAI.generateOptions(q);
      console.log(`      ✅ Generated all 4 options`);
      console.log(`         Option A: ${options.option_a.substring(0, 60)}...`);
      console.log(`         Option B: ${options.option_b.substring(0, 60)}...`);
      console.log(`         Option C: ${options.option_c.substring(0, 60)}...`);
      console.log(`         Option D: ${options.option_d.substring(0, 60)}...`);

      await new Promise(resolve => setTimeout(resolve, CONFIG.baseDelay));

      // Verify the correct option matches the solution
      console.log(`   🔍 Verifying option ${q.correct_answer.toUpperCase()} matches solution...`);
      const verification = await claudeAI.verifyOptions(q, options);

      if (!verification.isValid) {
        console.log(`      ⚠️  Verification failed: ${verification.reason}`);
        console.log(`      ⚠️  Options generated but may need review`);
      } else {
        console.log('      ✅ Verified correct');
        stats.verified++;
      }

      await new Promise(resolve => setTimeout(resolve, CONFIG.baseDelay));

      // Update database
      console.log('   💾 Updating database...');
      const { data: updateData, error: updateError } = await supabase
        .from('questions')
        .update({
          option_a: options.option_a,
          option_b: options.option_b,
          option_c: options.option_c,
          option_d: options.option_d
        })
        .eq('id', q.id)
        .select();

      if (updateError) {
        console.log(`      ❌ Update failed: ${updateError.message}`);
        stats.failed++;
      } else if (!updateData || updateData.length === 0) {
        console.log(`      ❌ Update failed: 0 rows affected`);
        stats.failed++;
      } else {
        console.log('      ✅ Options saved to database');
        stats.generated++;
      }

    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
      stats.failed++;
    }

    // Progress report every 10 questions
    if (progress % 10 === 0) {
      console.log(`\n📊 Progress: ${progress}/${missingOptions.length} (${(progress/missingOptions.length*100).toFixed(1)}%)`);
      console.log(`   Generated: ${stats.generated}, Verified: ${stats.verified}, Failed: ${stats.failed}, Skipped: ${stats.skipped}\n`);
    }
  }

  // Final report
  console.log('\n' + '='.repeat(70));
  console.log('\n✅ Option Generation Complete!\n');
  console.log('📊 Final Statistics:');
  console.log(`   Total processed: ${stats.total}`);
  console.log(`   Successfully generated: ${stats.generated} (${(stats.generated/stats.total*100).toFixed(1)}%)`);
  console.log(`   Verified correct: ${stats.verified} (${(stats.verified/stats.total*100).toFixed(1)}%)`);
  console.log(`   Failed: ${stats.failed} (${(stats.failed/stats.total*100).toFixed(1)}%)`);
  console.log(`   Skipped: ${stats.skipped} (${(stats.skipped/stats.total*100).toFixed(1)}%)`);
  console.log('');

  if (stats.generated > 0) {
    console.log('✨ Next steps:');
    console.log('   1. Review generated options (especially unverified ones)');
    console.log('   2. Run enrichment pipeline: node database_enrichment_pipeline.js ' + CONFIG.subject);
    console.log('   3. Test questions in the application');
  }

  console.log('\n' + '='.repeat(70) + '\n');
}

// Run the pipeline
generateMissingOptions().catch(error => {
  console.error('\n❌ Fatal error:', error);
  process.exit(1);
});
