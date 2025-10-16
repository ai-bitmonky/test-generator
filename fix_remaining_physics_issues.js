/**
 * TARGETED FIX FOR REMAINING 26 PHYSICS ISSUES
 *
 * Fixes only questions with:
 * - Missing options (10 questions)
 * - Missing solutions (4 questions)
 * - Multi-part questions with improper options (12 questions)
 *
 * Uses optimized approach with prompt caching and Claude Haiku
 */

require('dotenv').config({ path: '.env.local' });
const Anthropic = require('@anthropic-ai/sdk');
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const { execSync } = require('child_process');

// ============================================================================
// Configuration
// ============================================================================

const CONFIG = {
  claudeApiKey: process.env.ANTHROPIC_API_KEY,
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
  supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  subject: 'Physics',
  baseDelay: 6000,
  lockFile: '.pipeline_lock_physics_fixes.json',
};

const anthropic = new Anthropic({ apiKey: CONFIG.claudeApiKey });
const supabase = createClient(CONFIG.supabaseUrl, CONFIG.supabaseKey);

// ============================================================================
// Safety: Kill existing pipelines and acquire lock
// ============================================================================

class PipelineSafety {
  static killExistingPipelines() {
    console.log('🔍 Checking for existing Physics pipelines...\n');

    try {
      const psOutput = execSync(
        `ps aux | grep -E "node.*(database_enrichment_pipeline|validation|optimized_pipeline|fix_remaining).js.*Physics" | grep -v grep`,
        { encoding: 'utf8' }
      ).trim();

      if (psOutput) {
        const lines = psOutput.split('\n');
        const currentPid = process.pid;

        lines.forEach(line => {
          const match = line.match(/\s+(\d+)\s+/);
          if (match) {
            const pid = parseInt(match[1]);
            if (pid !== currentPid) {
              console.log(`   ⚠️  Found existing pipeline (PID ${pid})`);
              try {
                process.kill(pid, 'SIGTERM');
                console.log(`   ✅ Killed PID ${pid}`);
              } catch (err) {
                console.log(`   ⚠️  Could not kill PID ${pid}: ${err.message}`);
              }
            }
          }
        });

        console.log();
      } else {
        console.log('   ✅ No existing pipelines found\n');
      }
    } catch (error) {
      console.log('   ✅ No existing pipelines found\n');
    }
  }

  static acquireLock() {
    if (fs.existsSync(CONFIG.lockFile)) {
      const lock = JSON.parse(fs.readFileSync(CONFIG.lockFile, 'utf8'));
      const lockAge = Date.now() - lock.timestamp;

      if (lockAge > 2 * 60 * 60 * 1000) {
        console.log('   ⚠️  Found stale lock file (>2 hours old), removing...\n');
        fs.unlinkSync(CONFIG.lockFile);
      } else {
        console.error(`❌ ERROR: Pipeline already running`);
        console.error(`   Started: ${new Date(lock.timestamp).toLocaleString()}`);
        console.error(`   PID: ${lock.pid}`);
        process.exit(1);
      }
    }

    const lock = {
      pid: process.pid,
      subject: CONFIG.subject,
      timestamp: Date.now(),
      startTime: new Date().toISOString()
    };

    fs.writeFileSync(CONFIG.lockFile, JSON.stringify(lock, null, 2));
    console.log('🔒 Lock acquired\n');
  }

  static releaseLock() {
    if (fs.existsSync(CONFIG.lockFile)) {
      fs.unlinkSync(CONFIG.lockFile);
    }
  }

  static setupShutdownHandlers() {
    const cleanup = () => {
      console.log('\n\n🛑 Shutting down gracefully...');
      PipelineSafety.releaseLock();
      process.exit(0);
    };

    process.on('SIGINT', cleanup);
    process.on('SIGTERM', cleanup);
    process.on('uncaughtException', (error) => {
      console.error('\n❌ Uncaught exception:', error);
      PipelineSafety.releaseLock();
      process.exit(1);
    });
  }
}

// ============================================================================
// Cached System Prompt
// ============================================================================

const SYSTEM_PROMPT_WITH_CACHE = [
  {
    type: "text",
    text: "You are a JEE Advanced Physics expert. Generate accurate options and solutions for physics problems.",
    cache_control: { type: "ephemeral" }
  }
];

// ============================================================================
// Issue Fixer
// ============================================================================

class IssueFixer {

  /**
   * Identify questions with issues
   */
  async identifyIssues(questions) {
    const issues = [];

    // Multi-part detection patterns
    const multiPartPatterns = [
      /\(a\).*\(b\)/i,
      /part\s+\(a\)/i,
      /\(i\).*\(ii\)/i,
    ];

    for (const q of questions) {
      const questionText = q.question_html || q.question || '';
      const hasMultiPart = multiPartPatterns.some(pattern => pattern.test(questionText));

      const questionIssues = [];

      // Check missing options
      if (!q.options || !q.options.a || !q.options.b || !q.options.c || !q.options.d) {
        questionIssues.push('missing_options');
      }

      // Check missing solution
      if (!q.solution_html || q.solution_html.trim() === '') {
        questionIssues.push('missing_solution');
      }

      // Check multi-part with improper options
      if (hasMultiPart && q.options) {
        const optionsText = [
          q.options.a || '',
          q.options.b || '',
          q.options.c || '',
          q.options.d || ''
        ].join(' ');

        if (!optionsText.toLowerCase().includes('part') &&
            !optionsText.includes('(a)') &&
            !optionsText.includes('(i)')) {
          questionIssues.push('multipart_improper_options');
        }
      }

      if (questionIssues.length > 0) {
        issues.push({
          question: q,
          issues: questionIssues
        });
      }
    }

    return issues;
  }

  /**
   * Generate options for multi-part questions
   */
  async generateMultiPartOptions(question) {
    const questionText = (question.question_html || '').replace(/<[^>]*>/g, '');

    const prompt = `Generate 4 MCQ options for this multi-part JEE Physics question.

Question: ${questionText.substring(0, 800)}

Correct Answer: ${question.correct_answer.toUpperCase()}

IMPORTANT: Since this is a multi-part question with parts (a), (b), etc., each option should contain answers for ALL parts. Format like:
- Option A: (a) ... (b) ...
- Option B: (a) ... (b) ...
etc.

Return JSON only:
{"a": "option text", "b": "option text", "c": "option text", "d": "option text"}`;

    try {
      const response = await anthropic.messages.create({
        model: "claude-3-5-sonnet-20241022",
        max_tokens: 1000,
        system: SYSTEM_PROMPT_WITH_CACHE,
        messages: [{ role: "user", content: prompt }]
      });

      const jsonMatch = response.content[0].text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      return null;
    } catch (error) {
      console.error('      ❌ Error generating options:', error.message);
      return null;
    }
  }

  /**
   * Generate regular options
   */
  async generateOptions(question) {
    const questionText = (question.question_html || '').replace(/<[^>]*>/g, '');
    const solutionText = (question.solution_html || '').replace(/<[^>]*>/g, '');

    const prompt = `Generate 4 MCQ options for JEE Physics question. Correct: ${question.correct_answer.toUpperCase()}

Q: ${questionText.substring(0, 500)}
Solution: ${solutionText.substring(0, 300)}

JSON only:
{"a": "...", "b": "...", "c": "...", "d": "..."}`;

    try {
      const response = await anthropic.messages.create({
        model: "claude-3-5-sonnet-20241022",
        max_tokens: 1000,
        system: SYSTEM_PROMPT_WITH_CACHE,
        messages: [{ role: "user", content: prompt }]
      });

      const jsonMatch = response.content[0].text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      return null;
    } catch (error) {
      console.error('      ❌ Error generating options:', error.message);
      return null;
    }
  }

  /**
   * Generate solution
   */
  async generateSolution(question) {
    const questionText = (question.question_html || '').replace(/<[^>]*>/g, '');

    const prompt = `Write solution for JEE Physics question. Answer: ${question.correct_answer.toUpperCase()}

Question: ${questionText.substring(0, 600)}
Options: ${JSON.stringify(question.options)}

Solution (HTML, concise, step-by-step):`;

    try {
      const response = await anthropic.messages.create({
        model: "claude-3-5-sonnet-20241022",
        max_tokens: 1500,
        system: SYSTEM_PROMPT_WITH_CACHE,
        messages: [{ role: "user", content: prompt }]
      });

      return response.content[0].text.trim();
    } catch (error) {
      console.error('      ❌ Error generating solution:', error.message);
      return null;
    }
  }
}

// ============================================================================
// Main Pipeline
// ============================================================================

async function runTargetedFixes() {
  console.log('🎯 TARGETED FIX FOR REMAINING PHYSICS ISSUES\n');
  console.log('=' .repeat(70) + '\n');

  // Safety checks
  PipelineSafety.killExistingPipelines();
  PipelineSafety.acquireLock();
  PipelineSafety.setupShutdownHandlers();

  const fixer = new IssueFixer();

  // Fetch all Physics questions
  console.log('📥 Fetching Physics questions...\n');
  const { data: questions, error } = await supabase
    .from('questions')
    .select('*')
    .eq('subject', 'Physics')
    .order('id', { ascending: true });

  if (error) {
    console.error('❌ Error:', error);
    PipelineSafety.releaseLock();
    return;
  }

  console.log(`   Total: ${questions.length}\n`);

  // Identify issues
  console.log('🔍 Identifying issues...\n');
  const issuesList = await fixer.identifyIssues(questions);

  console.log(`   Found ${issuesList.length} questions with issues:\n`);

  const stats = {
    missingOptions: issuesList.filter(i => i.issues.includes('missing_options')).length,
    missingSolution: issuesList.filter(i => i.issues.includes('missing_solution')).length,
    multipartImproper: issuesList.filter(i => i.issues.includes('multipart_improper_options')).length,
  };

  console.log(`   - Missing options: ${stats.missingOptions}`);
  console.log(`   - Missing solutions: ${stats.missingSolution}`);
  console.log(`   - Multi-part improper options: ${stats.multipartImproper}\n`);

  console.log('=' .repeat(70) + '\n');

  if (issuesList.length === 0) {
    console.log('✅ No issues found! All questions are complete.\n');
    PipelineSafety.releaseLock();
    return;
  }

  console.log('🔧 Starting fixes...\n');

  const fixStats = {
    optionsFixed: 0,
    solutionsGenerated: 0,
    multipartFixed: 0,
    failed: 0
  };

  for (let i = 0; i < issuesList.length; i++) {
    const { question, issues } = issuesList[i];
    const progress = i + 1;

    console.log(`[${progress}/${issuesList.length}] Question ${question.id.substring(0, 8)}`);
    console.log(`   Issues: ${issues.join(', ')}`);

    const updates = {};
    let needsUpdate = false;

    try {
      // Fix missing options
      if (issues.includes('missing_options')) {
        console.log('   🔧 Generating options...');
        const opts = await fixer.generateOptions(question);
        if (opts) {
          updates.options = opts;
          needsUpdate = true;
          fixStats.optionsFixed++;
          console.log('      ✅ Options generated');
        }
        await new Promise(resolve => setTimeout(resolve, CONFIG.baseDelay));
      }

      // Fix multi-part improper options
      if (issues.includes('multipart_improper_options')) {
        console.log('   🔧 Regenerating multi-part options...');
        const opts = await fixer.generateMultiPartOptions(question);
        if (opts) {
          updates.options = opts;
          needsUpdate = true;
          fixStats.multipartFixed++;
          console.log('      ✅ Multi-part options generated');
        }
        await new Promise(resolve => setTimeout(resolve, CONFIG.baseDelay));
      }

      // Fix missing solution
      if (issues.includes('missing_solution')) {
        console.log('   🔧 Generating solution...');
        // Use updated options if we just generated them
        const questionWithUpdates = { ...question, ...updates };
        const sol = await fixer.generateSolution(questionWithUpdates);
        if (sol) {
          updates.solution_html = sol;
          needsUpdate = true;
          fixStats.solutionsGenerated++;
          console.log('      ✅ Solution generated');
        }
        await new Promise(resolve => setTimeout(resolve, CONFIG.baseDelay));
      }

      // Update database
      if (needsUpdate) {
        const { error: updateError } = await supabase
          .from('questions')
          .update(updates)
          .eq('id', question.id);

        if (updateError) {
          console.log(`      ❌ Update failed: ${updateError.message}`);
          fixStats.failed++;
        } else {
          console.log('      💾 Saved to database');
        }
      }

      console.log();

    } catch (error) {
      console.log(`   ❌ Error: ${error.message}\n`);
      fixStats.failed++;
    }
  }

  // Final report
  console.log('=' .repeat(70));
  console.log('\n✅ Targeted Fixes Complete!\n');
  console.log('📊 Fix Statistics:');
  console.log(`   Options fixed: ${fixStats.optionsFixed}`);
  console.log(`   Multi-part options fixed: ${fixStats.multipartFixed}`);
  console.log(`   Solutions generated: ${fixStats.solutionsGenerated}`);
  console.log(`   Failed: ${fixStats.failed}`);

  console.log('\n💰 API Usage:');
  const estimatedCalls = fixStats.optionsFixed + fixStats.multipartFixed + fixStats.solutionsGenerated;
  const estimatedCost = estimatedCalls * 0.004;
  console.log(`   Estimated API calls: ${estimatedCalls}`);
  console.log(`   Estimated cost: $${estimatedCost.toFixed(2)}`);

  console.log('\n🔓 Releasing lock...');
  PipelineSafety.releaseLock();
  console.log('✅ Done!\n');
}

runTargetedFixes().catch((error) => {
  console.error('\n❌ Fatal error:', error);
  PipelineSafety.releaseLock();
  process.exit(1);
});
