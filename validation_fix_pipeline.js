/**
 * VALIDATION & FIX PIPELINE
 *
 * Scans ALL questions for validation issues and auto-fixes them:
 * - Missing or incomplete options
 * - Incomplete questions (missing data/figures)
 * - Ambiguous wording
 * - Multi-part questions with improper options
 * - Missing or incorrect solutions
 *
 * This runs on ALL questions, not just those needing enrichment.
 */

require('dotenv').config({ path: '.env.local' });
const Anthropic = require('@anthropic-ai/sdk');
const { createClient } = require('@supabase/supabase-js');

// ============================================================================
// Configuration
// ============================================================================

const CONFIG = {
  claudeApiKey: process.env.ANTHROPIC_API_KEY,
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
  supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  subject: process.argv[2] || 'Physics',
  baseDelay: 6000, // 6 seconds between calls
};

const supabase = createClient(CONFIG.supabaseUrl, CONFIG.supabaseKey);

// Import the ClaudeAI class from database_enrichment_pipeline.js
const ClaudeAI = require('./database_enrichment_pipeline_class.js');

// ============================================================================
// Main Validation & Fix Pipeline
// ============================================================================

async function validateAndFixAll() {
  console.log('🔍 VALIDATION & FIX PIPELINE\n');
  console.log(`📚 Subject: ${CONFIG.subject}`);
  console.log(`⏱️  Delay: ${CONFIG.baseDelay}ms between calls\n`);
  console.log('✨ CHECKING FOR:');
  console.log('   • Missing or incomplete options');
  console.log('   • Incomplete questions (missing data/parameters)');
  console.log('   • Ambiguous wording');
  console.log('   • Multi-part questions with improper options');
  console.log('   • Missing or incorrect solutions');
  console.log('\n' + '='.repeat(70) + '\n');

  const claudeAI = new ClaudeAI(CONFIG.claudeApiKey);

  // Fetch ALL questions for the subject
  console.log('📥 Fetching all questions...\n');

  const { data: questions, error } = await supabase
    .from('questions')
    .select('*')
    .eq('subject', CONFIG.subject)
    .order('id', { ascending: true });

  if (error) {
    console.error('❌ Error fetching questions:', error);
    return;
  }

  console.log(`   Total ${CONFIG.subject} questions: ${questions.length}\n`);

  const stats = {
    total: questions.length,
    optionsFixed: 0,
    questionsFixed: 0,
    multiPartFixed: 0,
    solutionsGenerated: 0,
    noIssues: 0,
    failed: 0,
  };

  // Process all questions
  for (let i = 0; i < questions.length; i++) {
    const q = questions[i];
    const progress = i + 1;

    console.log(`\n[${progress}/${questions.length}] Checking question ${q.id.substring(0, 8)}...`);

    try {
      let needsUpdate = false;
      const updates = {};

      // 1. Check for missing options
      const formatIssues = claudeAI.validateQuestionFormat(q);
      const missingOptions = formatIssues.find(i => i.type === 'missing_options');

      if (missingOptions && q.solution_html && q.correct_answer) {
        console.log('   ⚠️  Missing options - generating...');
        try {
          const generatedOptions = await claudeAI.generateOptions(q);
          updates.options = generatedOptions;
          needsUpdate = true;
          stats.optionsFixed++;
          console.log('      ✅ Options generated and will be saved');
          await new Promise(resolve => setTimeout(resolve, CONFIG.baseDelay));
        } catch (error) {
          console.log(`      ❌ Failed: ${error.message}`);
        }
      }

      // 2. Check for multi-part issues
      const multiPartIssue = formatIssues.find(i => i.type === 'multipart_not_handled');
      if (multiPartIssue && q.solution_html && q.correct_answer && q.options) {
        console.log('   ⚠️  Multi-part options issue - fixing...');
        try {
          const fixedOptions = await claudeAI.fixMultiPartOptions(q);
          if (fixedOptions) {
            updates.options = fixedOptions;
            needsUpdate = true;
            stats.multiPartFixed++;
            console.log('      ✅ Multi-part options fixed');
          }
          await new Promise(resolve => setTimeout(resolve, CONFIG.baseDelay));
        } catch (error) {
          console.log(`      ❌ Failed: ${error.message}`);
        }
      }

      // 3. Check completeness
      const completeness = await claudeAI.verifyQuestionCompleteness(q);
      if (!completeness.isComplete || completeness.isAmbiguous) {
        console.log('   ⚠️  Question has issues:');
        if (!completeness.isComplete) console.log('      - Incomplete');
        if (completeness.isAmbiguous) console.log('      - Ambiguous');

        // Auto-fix
        try {
          let fixedQuestion = null;
          if (!completeness.isComplete) {
            console.log('      🔧 Fixing incomplete question...');
            fixedQuestion = await claudeAI.fixIncompleteQuestion(q);
          } else if (completeness.isAmbiguous) {
            console.log('      🔧 Fixing ambiguous question...');
            fixedQuestion = await claudeAI.fixAmbiguousQuestion(q);
          }

          if (fixedQuestion) {
            updates.question_html = fixedQuestion;
            needsUpdate = true;
            stats.questionsFixed++;
            console.log('      ✅ Question fixed');
          }
          await new Promise(resolve => setTimeout(resolve, CONFIG.baseDelay));
        } catch (error) {
          console.log(`      ❌ Failed: ${error.message}`);
        }
      }

      // 4. Check solution
      const hasSolution = q.solution_html && q.solution_html.trim() !== '';
      let needsSolution = false;

      if (hasSolution && q.correct_answer) {
        const solutionCheck = await claudeAI.verifySolutionMatchesAnswer(q);
        if (!solutionCheck.matchesAnswer) {
          console.log('   ⚠️  Solution doesn\'t match answer - regenerating...');
          needsSolution = true;
        }
        await new Promise(resolve => setTimeout(resolve, CONFIG.baseDelay));
      } else if (!hasSolution && q.correct_answer && q.options) {
        console.log('   ⚠️  Solution missing - generating...');
        needsSolution = true;
      }

      if (needsSolution) {
        try {
          const generatedSolution = await claudeAI.generateSolution(q);
          if (generatedSolution) {
            updates.solution_html = generatedSolution;
            needsUpdate = true;
            stats.solutionsGenerated++;
            console.log('      ✅ Solution generated');
          }
          await new Promise(resolve => setTimeout(resolve, CONFIG.baseDelay));
        } catch (error) {
          console.log(`      ❌ Failed: ${error.message}`);
        }
      }

      // Save updates if any
      if (needsUpdate) {
        const { error: updateError } = await supabase
          .from('questions')
          .update(updates)
          .eq('id', q.id);

        if (updateError) {
          console.log(`   ❌ Update failed: ${updateError.message}`);
          stats.failed++;
        } else {
          console.log(`   ✅ Updated with ${Object.keys(updates).length} field(s)`);
        }
      } else {
        console.log('   ✅ No issues found');
        stats.noIssues++;
      }

    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
      stats.failed++;
    }

    // Progress report every 20 questions
    if (progress % 20 === 0) {
      console.log(`\n📊 Progress: ${progress}/${questions.length} (${(progress/questions.length*100).toFixed(1)}%)`);
      console.log(`   Options fixed: ${stats.optionsFixed}, Questions fixed: ${stats.questionsFixed}`);
      console.log(`   Multi-part fixed: ${stats.multiPartFixed}, Solutions: ${stats.solutionsGenerated}`);
      console.log(`   No issues: ${stats.noIssues}, Failed: ${stats.failed}\n`);
    }
  }

  // Final report
  console.log('\n' + '='.repeat(70));
  console.log('\n✅ Validation & Fix Complete!\n');
  console.log('📊 Final Statistics:');
  console.log(`   Total checked: ${stats.total}`);
  console.log(`   Options fixed: ${stats.optionsFixed}`);
  console.log(`   Questions fixed (incomplete/ambiguous): ${stats.questionsFixed}`);
  console.log(`   Multi-part options fixed: ${stats.multiPartFixed}`);
  console.log(`   Solutions generated: ${stats.solutionsGenerated}`);
  console.log(`   No issues found: ${stats.noIssues}`);
  console.log(`   Failed: ${stats.failed}`);
}

validateAndFixAll().catch(console.error);
