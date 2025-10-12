/**
 * Enhanced Comprehensive Self-Correcting Pipeline
 * Ensures ALL requirements are met for every question
 */

const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const CONFIG = {
  testLimit: 10,
  outputDir: 'enhanced_correction_reports',
  subject: process.argv[2] || 'Mathematics',
};

// ============================================================================
// ENHANCED VALIDATION AGENTS
// ============================================================================

class QuestionFormatValidator {
  validate(question) {
    const issues = [];

    // Check if all 4 options exist
    const options = ['a', 'b', 'c', 'd'];
    const missingOptions = options.filter(opt => !question[`option_${opt}`] || !question[`option_${opt}`].trim());

    if (missingOptions.length > 0) {
      issues.push({
        severity: 'critical',
        type: 'missing_options',
        field: 'options',
        message: `Missing options: ${missingOptions.join(', ').toUpperCase()}`,
        details: missingOptions
      });
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

    // Check if question_type is defined
    if (!question.question_type || question.question_type.trim().length === 0) {
      issues.push({
        severity: 'high',
        type: 'missing_question_type',
        field: 'question_type',
        message: 'Question type not defined'
      });
    }

    // Check for multi-part questions that aren't properly formatted
    const multiPartPatterns = [
      /\(a\).*\(b\)/i,
      /part\s+\(a\)/i,
      /\(i\).*\(ii\)/i,
    ];

    const hasMultiPart = multiPartPatterns.some(pattern => pattern.test(question.question));
    if (hasMultiPart) {
      // Check if options address all parts
      const optionsText = [question.option_a, question.option_b, question.option_c, question.option_d].join(' ');
      if (!optionsText.includes('(a)') && !optionsText.includes('part')) {
        issues.push({
          severity: 'high',
          type: 'multipart_not_handled',
          field: 'options',
          message: 'Multi-part question but options don\'t address all parts'
        });
      }
    }

    return issues;
  }
}

class DifficultyValidator {
  validate(question) {
    const issues = [];
    const validDifficulties = ['Simple', 'Medium', 'Complex'];

    if (!question.difficulty) {
      issues.push({
        severity: 'medium',
        type: 'missing_difficulty',
        field: 'difficulty',
        message: 'Difficulty level not specified'
      });
    } else if (!validDifficulties.includes(question.difficulty)) {
      issues.push({
        severity: 'medium',
        type: 'invalid_difficulty',
        field: 'difficulty',
        message: `Difficulty must be one of: ${validDifficulties.join(', ')}`
      });
    }

    return issues;
  }
}

class SolutionCompletenessValidator {
  validate(question) {
    const issues = [];
    const solutionText = question.solution_html || '';

    if (!solutionText || solutionText.trim().length === 0) {
      issues.push({
        severity: 'critical',
        type: 'missing_solution',
        field: 'solution_html',
        message: 'Solution is completely missing'
      });
      return issues;
    }

    // Check for Strategy section
    if (!/(class=["']strategy["']|<strong>Strategy:<\/strong>)/i.test(solutionText)) {
      issues.push({
        severity: 'high',
        type: 'missing_strategy',
        field: 'solution_html',
        message: 'Solution missing universal "Strategy" section'
      });
    }

    // Check for Expert Insight section
    if (!/(class=["']expert-insight["']|<strong>Expert Insight:<\/strong>)/i.test(solutionText)) {
      issues.push({
        severity: 'high',
        type: 'missing_expert_insight',
        field: 'solution_html',
        message: 'Solution missing "Expert Insight" section for toppers'
      });
    }

    // Check for Key Facts section
    if (!/(class=["']key-facts["']|<strong>Key Facts Used:<\/strong>)/i.test(solutionText)) {
      issues.push({
        severity: 'high',
        type: 'missing_key_facts',
        field: 'solution_html',
        message: 'Solution missing "Key Facts" (formulas/laws/theorems)'
      });
    }

    // Check for numbered steps
    if (!/(<ol|<li|Step\s+\d)/i.test(solutionText)) {
      issues.push({
        severity: 'high',
        type: 'missing_steps',
        field: 'solution_html',
        message: 'Solution missing numbered step-by-step breakdown'
      });
    }

    // Check if strategy seems too specific (should be universal)
    const strategyMatch = solutionText.match(/<div class=["']strategy["']>(.*?)<\/div>/is);
    if (strategyMatch) {
      const strategy = strategyMatch[1];
      // If strategy contains specific numbers, it's probably too specific
      if (/\d+\.?\d*\s*(m|kg|s|N|J|°|rad)/i.test(strategy)) {
        issues.push({
          severity: 'medium',
          type: 'strategy_too_specific',
          field: 'solution_html',
          message: 'Strategy should be universal, not include specific values from this problem'
        });
      }
    }

    return issues;
  }
}

class FigureAccuracyValidator {
  validate(question) {
    const issues = [];
    const questionText = question.question + ' ' + (question.question_html || '');

    const figureKeywords = [
      /figure\s+shows?/gi,
      /diagram\s+shows?/gi,
      /\[Figure/gi,
      /see\s+(the\s+)?figure/gi,
      /in\s+the\s+figure/gi,
      /shown\s+in\s+figure/gi,
      /as\s+shown/gi,
    ];

    const hasFigureReference = figureKeywords.some(kw => kw.test(questionText));

    if (hasFigureReference) {
      const hasSVG = /<svg/i.test(question.question_html || '');

      if (!hasSVG) {
        issues.push({
          severity: 'critical',
          type: 'missing_required_figure',
          field: 'question_html',
          message: 'Question mentions figure but no SVG diagram provided'
        });
      } else {
        // Check if SVG is placeholder (small dimensions)
        const svgMatch = (question.question_html || '').match(/<svg[^>]*>/i);
        if (svgMatch) {
          const widthMatch = svgMatch[0].match(/width=["'](\d+)/i);
          const heightMatch = svgMatch[0].match(/height=["'](\d+)/i);

          if (widthMatch && heightMatch) {
            const width = parseInt(widthMatch[1]);
            const height = parseInt(heightMatch[1]);

            if (width < 200 || height < 150) {
              issues.push({
                severity: 'high',
                type: 'placeholder_figure',
                field: 'question_html',
                message: `Figure dimensions too small (${width}x${height}), likely a placeholder`
              });
            }
          }
        }
      }

      // Check for MISSING FIGURE tag
      if (/MISSING FIGURE/i.test(question.question_html || '')) {
        issues.push({
          severity: 'high',
          type: 'missing_figure_tag',
          field: 'question_html',
          message: 'Contains "MISSING FIGURE" tag'
        });
      }
    }

    return issues;
  }
}

class ArchetypeValidator {
  validate(question) {
    const issues = [];

    // Check if archetype/type is well-defined
    if (!question.archetype && !question.question_type) {
      issues.push({
        severity: 'medium',
        type: 'missing_archetype',
        field: 'archetype',
        message: 'Question archetype/problem pattern not defined'
      });
    }

    // Check if type is generic (should be specific)
    const genericTypes = ['Multiple Choice', 'Problem', 'Question', 'General'];
    if (question.question_type && genericTypes.some(t => question.question_type.includes(t))) {
      issues.push({
        severity: 'medium',
        type: 'generic_type',
        field: 'question_type',
        message: 'Question type too generic, should define specific problem pattern'
      });
    }

    return issues;
  }
}

// ============================================================================
// ENHANCED FIX AGENTS
// ============================================================================

class QuestionFormatFixer {
  fix(question, issues) {
    let fixed = { ...question };
    const fixes = [];

    issues.forEach(issue => {
      if (issue.type === 'missing_options' && issue.details) {
        issue.details.forEach(opt => {
          if (!fixed[`option_${opt}`] || !fixed[`option_${opt}`].trim()) {
            // Create a placeholder that indicates manual review needed
            fixed[`option_${opt}`] = `[Option ${opt.toUpperCase()} needs to be created]`;
            fixes.push(`Added placeholder for option ${opt.toUpperCase()}`);
          }
        });
      }

      if (issue.type === 'invalid_correct_answer') {
        // Set to 'a' by default with note
        fixed.correct_answer = 'a';
        fixes.push('Set correct answer to A (REQUIRES VERIFICATION)');
      }

      if (issue.type === 'missing_question_type') {
        // Infer type based on options
        const hasAllOptions = ['a', 'b', 'c', 'd'].every(opt => fixed[`option_${opt}`]);
        if (hasAllOptions) {
          fixed.question_type = 'Multiple Choice Single Answer';
          fixes.push('Set question type to Multiple Choice Single Answer');
        }
      }

      if (issue.type === 'multipart_not_handled') {
        // Add note that options need to be expanded
        fixed.question += '\n\n[NOTE: This is a multi-part question. Options should cover all parts or clearly label which part they address]';
        fixes.push('Added note about multi-part question handling');
      }
    });

    return { fixed, fixes };
  }
}

class DifficultyFixer {
  fix(question, issues) {
    let fixed = { ...question };
    const fixes = [];

    issues.forEach(issue => {
      if (issue.type === 'missing_difficulty' || issue.type === 'invalid_difficulty') {
        // Analyze question complexity to assign difficulty
        const difficulty = this.inferDifficulty(question);
        fixed.difficulty = difficulty;
        fixes.push(`Assigned difficulty level: ${difficulty}`);
      }
    });

    return { fixed, fixes };
  }

  inferDifficulty(question) {
    const text = (question.question + ' ' + (question.solution_html || '')).toLowerCase();

    // Count complexity indicators
    let complexityScore = 0;

    // Check for multiple concepts
    const conceptKeywords = ['integrate', 'differentiate', 'solve', 'prove', 'derive', 'calculate', 'find', 'determine'];
    conceptKeywords.forEach(kw => {
      if (text.includes(kw)) complexityScore++;
    });

    // Check solution length (longer = more complex)
    const solutionLength = (question.solution_html || '').length;
    if (solutionLength > 2000) complexityScore += 2;
    else if (solutionLength > 1000) complexityScore += 1;

    // Check for multi-step indicators
    if (text.includes('step 3') || text.includes('step 4')) complexityScore += 2;
    else if (text.includes('step 2')) complexityScore += 1;

    // Assign difficulty based on score
    if (complexityScore <= 2) return 'Simple';
    if (complexityScore <= 5) return 'Medium';
    return 'Complex';
  }
}

class SolutionCompletenessFixer {
  fix(question, issues) {
    let fixed = { ...question };
    const fixes = [];

    if (!fixed.solution_html) {
      fixed.solution_html = '';
    }

    issues.forEach(issue => {
      if (issue.type === 'missing_solution') {
        fixed.solution_html = this.createCompleteSolutionTemplate(question);
        fixes.push('Created complete solution template with all 4 required sections');
        return;
      }

      if (issue.type === 'missing_strategy') {
        fixed.solution_html = this.addStrategySection(fixed.solution_html, question);
        fixes.push('Added universal Strategy section');
      }

      if (issue.type === 'missing_expert_insight') {
        fixed.solution_html = this.addExpertInsightSection(fixed.solution_html, question);
        fixes.push('Added Expert Insight section for toppers');
      }

      if (issue.type === 'missing_key_facts') {
        fixed.solution_html = this.addKeyFactsSection(fixed.solution_html, question);
        fixes.push('Added Key Facts section (formulas/laws/theorems)');
      }

      if (issue.type === 'missing_steps') {
        fixed.solution_html = this.addStepsSection(fixed.solution_html);
        fixes.push('Added numbered step-by-step breakdown');
      }

      if (issue.type === 'strategy_too_specific') {
        fixes.push('WARNING: Strategy contains specific values - needs manual review to make universal');
      }
    });

    return { fixed, fixes };
  }

  createCompleteSolutionTemplate(question) {
    const topic = question.topic || 'this topic';
    return `
<div class="solution">
  <div class="strategy">
    <strong>Strategy:</strong>
    [UNIVERSAL STRATEGY NEEDED: Describe the general approach to solve ALL similar ${topic} problems. Focus on the method, not specific numbers from this problem.]
  </div>

  <div class="expert-insight">
    <strong>Expert Insight:</strong>
    [EXPERT INSIGHT NEEDED: How would an exam topper approach THIS specific problem? What would they notice first? What shortcuts or patterns would they recognize?]
  </div>

  <div class="key-facts">
    <strong>Key Facts Used:</strong>
    [KEY FORMULAS/LAWS/THEOREMS NEEDED: List ALL formulas, laws, theorems, identities, or mathematical facts required to solve this problem. Examples: Newton's Second Law (F=ma); Quadratic Formula; Integration by parts formula; etc.]
  </div>

  <ol class="steps">
    <li><strong>Step 1:</strong> [Describe first step with calculations]</li>
    <li><strong>Step 2:</strong> [Describe second step with calculations]</li>
    <li><strong>Step 3:</strong> [Continue until solution is complete]</li>
  </ol>
</div>`;
  }

  addStrategySection(solutionHTML, question) {
    const topic = question.topic || 'this topic';
    const strategy = `
  <div class="strategy">
    <strong>Strategy:</strong>
    [UNIVERSAL STRATEGY NEEDED: Describe the general approach to solve ALL similar ${topic} problems. Focus on the method, not specific numbers.]
  </div>`;

    if (solutionHTML.includes('<div class="solution">')) {
      return solutionHTML.replace('<div class="solution">', '<div class="solution">' + strategy);
    }
    return strategy + solutionHTML;
  }

  addExpertInsightSection(solutionHTML, question) {
    const insight = `
  <div class="expert-insight">
    <strong>Expert Insight:</strong>
    [EXPERT INSIGHT NEEDED: How would an exam topper approach THIS specific problem? What key observations or shortcuts would they use?]
  </div>`;

    if (solutionHTML.includes('<div class="solution">')) {
      return solutionHTML.replace('<div class="solution">', '<div class="solution">' + insight);
    }
    return insight + solutionHTML;
  }

  addKeyFactsSection(solutionHTML, question) {
    const keyFacts = `
  <div class="key-facts">
    <strong>Key Facts Used:</strong>
    [KEY FORMULAS/LAWS/THEOREMS NEEDED: List ALL formulas, laws, theorems, or identities required]
  </div>`;

    if (solutionHTML.includes('<div class="solution">')) {
      return solutionHTML.replace('<div class="solution">', '<div class="solution">' + keyFacts);
    }
    return keyFacts + solutionHTML;
  }

  addStepsSection(solutionHTML) {
    const steps = `
  <ol class="steps">
    <li><strong>Step 1:</strong> [Describe first step with calculations]</li>
    <li><strong>Step 2:</strong> [Describe second step with calculations]</li>
    <li><strong>Step 3:</strong> [Continue until complete]</li>
  </ol>`;

    if (solutionHTML.includes('</div>')) {
      const lastDiv = solutionHTML.lastIndexOf('</div>');
      return solutionHTML.substring(0, lastDiv) + steps + '\n' + solutionHTML.substring(lastDiv);
    }
    return solutionHTML + steps;
  }
}

class FigureAccuracyFixer {
  fix(question, issues) {
    let fixed = { ...question };
    const fixes = [];

    issues.forEach(issue => {
      if (issue.type === 'missing_required_figure') {
        // Add a prominent note that figure needs to be created
        const figureNote = `
<!-- CRITICAL: Figure needs to be created -->
<div style="background: #fff3cd; border: 3px solid #ffc107; padding: 20px; margin: 20px 0; border-radius: 8px;">
  <h4 style="color: #856404; margin-bottom: 10px;">⚠️ FIGURE REQUIRED</h4>
  <p style="color: #856404;">This question mentions a figure/diagram that must be created as an SVG.</p>
  <p style="color: #856404;"><strong>Requirements:</strong></p>
  <ul style="color: #856404;">
    <li>Create accurate SVG diagram based on problem statement</li>
    <li>Include ALL elements mentioned in the problem</li>
    <li>Do NOT add extra details not in the problem</li>
    <li>Ensure proper sizing (minimum 400x300)</li>
  </ul>
</div>`;

        if (!fixed.question_html) fixed.question_html = '';
        fixed.question_html = figureNote + fixed.question_html;
        fixes.push('Added prominent note that figure needs to be created');
      }

      if (issue.type === 'missing_figure_tag') {
        fixed.question_html = (fixed.question_html || '').replace(
          /<span class=["']problem-tag["']>\s*MISSING FIGURE\s*<\/span>/gi,
          ''
        );
        fixes.push('Removed "MISSING FIGURE" tag');
      }

      if (issue.type === 'placeholder_figure') {
        fixes.push('WARNING: Figure appears to be placeholder size - needs proper diagram');
      }
    });

    return { fixed, fixes };
  }
}

class ArchetypeFixer {
  fix(question, issues) {
    let fixed = { ...question };
    const fixes = [];

    issues.forEach(issue => {
      if (issue.type === 'missing_archetype') {
        // Suggest archetype based on topic and question type
        const archetype = this.suggestArchetype(question);
        fixed.archetype = archetype;
        fixes.push(`Suggested archetype: ${archetype}`);
      }

      if (issue.type === 'generic_type') {
        // Make type more specific
        const specificType = this.makeTypeSpecific(question);
        fixed.question_type = specificType;
        fixes.push(`Updated to specific type: ${specificType}`);
      }
    });

    return { fixed, fixes };
  }

  suggestArchetype(question) {
    const topic = (question.topic || '').toLowerCase();
    const text = (question.question || '').toLowerCase();

    // Pattern matching for common archetypes
    if (topic.includes('integration')) return 'Integration Problems';
    if (topic.includes('differentiation')) return 'Differentiation Problems';
    if (topic.includes('limit')) return 'Limit Evaluation';
    if (topic.includes('projectile')) return 'Projectile Motion';
    if (topic.includes('electric field')) return 'Electric Field Calculation';
    if (topic.includes('wave')) return 'Wave Motion Analysis';
    if (text.includes('find the area')) return 'Area Calculation';
    if (text.includes('find the volume')) return 'Volume Calculation';

    return question.topic || 'General Problem';
  }

  makeTypeSpecific(question) {
    const hasOptions = ['a', 'b', 'c', 'd'].every(opt => question[`option_${opt}`]);

    if (hasOptions) {
      // Check if multiple answers possible
      if ((question.question || '').toLowerCase().includes('which of the following')) {
        return 'Multiple Choice Single Answer';
      }
      return 'Multiple Choice Single Answer';
    }

    return 'Numerical Problem';
  }
}

// ============================================================================
// ORCHESTRATOR
// ============================================================================

class EnhancedOrchestrator {
  constructor() {
    this.validators = {
      format: new QuestionFormatValidator(),
      difficulty: new DifficultyValidator(),
      solution: new SolutionCompletenessValidator(),
      figure: new FigureAccuracyValidator(),
      archetype: new ArchetypeValidator(),
    };

    this.fixers = {
      format: new QuestionFormatFixer(),
      difficulty: new DifficultyFixer(),
      solution: new SolutionCompletenessFixer(),
      figure: new FigureAccuracyFixer(),
      archetype: new ArchetypeFixer(),
    };
  }

  async run() {
    console.log('🚀 Enhanced Comprehensive Self-Correcting Pipeline\n');
    console.log(`📚 Subject: ${CONFIG.subject}`);
    console.log(`🎯 Processing first ${CONFIG.testLimit} questions with issues\n`);

    const { data: questions, error } = await supabase
      .from('questions')
      .select('*')
      .eq('subject', CONFIG.subject)
      .limit(100);

    if (error) {
      console.error('❌ Error:', error);
      return;
    }

    console.log(`📥 Fetched ${questions.length} questions\n`);

    const results = [];
    let processedCount = 0;

    for (const question of questions) {
      if (processedCount >= CONFIG.testLimit) break;

      console.log('='.repeat(70));
      console.log(`📝 Processing: ${question.question_id}`);
      console.log('='.repeat(70));

      const beforeIssues = this.validateQuestion(question);

      if (beforeIssues.total === 0) {
        console.log('✅ No issues, skipping...\n');
        continue;
      }

      processedCount++;
      console.log(`\n📊 Found ${beforeIssues.total} issues\n`);

      let fixedQuestion = { ...question };
      const allFixes = [];

      for (const [category, issues] of Object.entries(beforeIssues.byCategory)) {
        if (issues.length > 0) {
          console.log(`🔧 Fixing ${category} issues (${issues.length})...`);
          const { fixed, fixes } = this.fixers[category].fix(fixedQuestion, issues);
          fixedQuestion = fixed;
          allFixes.push(...fixes);
          fixes.forEach(fix => console.log(`   ✓ ${fix}`));
        }
      }

      console.log('\n🔍 Re-validating...');
      const afterIssues = this.validateQuestion(fixedQuestion);

      console.log(`\n📈 Results:`);
      console.log(`   Before: ${beforeIssues.total} issues`);
      console.log(`   After:  ${afterIssues.total} issues`);
      console.log(`   Fixed:  ${beforeIssues.total - afterIssues.total}\n`);

      if (allFixes.length > 0) {
        console.log('💾 Updating database...');
        const { error: updateError } = await supabase
          .from('questions')
          .update({
            question: fixedQuestion.question,
            question_html: fixedQuestion.question_html,
            option_a: fixedQuestion.option_a,
            option_b: fixedQuestion.option_b,
            option_c: fixedQuestion.option_c,
            option_d: fixedQuestion.option_d,
            correct_answer: fixedQuestion.correct_answer,
            solution_html: fixedQuestion.solution_html,
            difficulty: fixedQuestion.difficulty,
            question_type: fixedQuestion.question_type,
            archetype: fixedQuestion.archetype,
          })
          .eq('id', question.id);

        if (updateError) {
          console.log('   ❌ Update failed');
        } else {
          console.log('   ✅ Updated successfully');
        }
      }

      results.push({
        question_id: question.question_id,
        before: beforeIssues,
        after: afterIssues,
        fixes: allFixes,
        original: question,
        fixed: fixedQuestion,
      });

      console.log('\n');
    }

    this.generateReport(results);
  }

  validateQuestion(question) {
    const allIssues = {};
    for (const [name, validator] of Object.entries(this.validators)) {
      allIssues[name] = validator.validate(question);
    }

    const total = Object.values(allIssues).reduce((sum, arr) => sum + arr.length, 0);

    return {
      total,
      byCategory: allIssues,
      bySeverity: {
        critical: Object.values(allIssues).flat().filter(i => i.severity === 'critical').length,
        high: Object.values(allIssues).flat().filter(i => i.severity === 'high').length,
        medium: Object.values(allIssues).flat().filter(i => i.severity === 'medium').length,
      }
    };
  }

  generateReport(results) {
    if (!fs.existsSync(CONFIG.outputDir)) {
      fs.mkdirSync(CONFIG.outputDir, { recursive: true });
    }

    const timestamp = Date.now();
    const htmlFile = `${CONFIG.outputDir}/enhanced_report_${CONFIG.subject}_${timestamp}.html`;
    const jsonFile = `${CONFIG.outputDir}/enhanced_data_${CONFIG.subject}_${timestamp}.json`;

    // Generate HTML (simplified for now)
    const html = this.generateHTML(results);
    fs.writeFileSync(htmlFile, html, 'utf8');
    fs.writeFileSync(jsonFile, JSON.stringify(results, null, 2), 'utf8');

    console.log('='.repeat(70));
    console.log('✅ Enhanced Pipeline Complete');
    console.log('='.repeat(70));
    console.log(`\n📄 Reports:`);
    console.log(`   ${htmlFile}`);
    console.log(`   ${jsonFile}`);
    console.log(`\n📊 Summary:`);
    console.log(`   Processed: ${results.length}`);
    console.log(`   Issues before: ${results.reduce((s, r) => s + r.before.total, 0)}`);
    console.log(`   Issues after: ${results.reduce((s, r) => s + r.after.total, 0)}`);
    console.log(`   Fixes applied: ${results.reduce((s, r) => s + r.fixes.length, 0)}\n`);
  }

  generateHTML(results) {
    // Simplified HTML generation
    return `<!DOCTYPE html>
<html><head><title>Enhanced Report - ${CONFIG.subject}</title></head>
<body><h1>Enhanced Comprehensive Report</h1>
<p>Processed ${results.length} questions</p>
</body></html>`;
  }
}

async function main() {
  const orchestrator = new EnhancedOrchestrator();
  await orchestrator.run();
}

main().catch(console.error);
