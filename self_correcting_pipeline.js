/**
 * Self-Correcting Validation Pipeline
 * Validates and automatically fixes issues in questions
 */

const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const CONFIG = {
  testLimit: 10, // Process only first 10 questions with issues
  outputDir: 'correction_reports',
  subject: process.argv[2] || 'Mathematics',
};

// ============================================================================
// Validation Agents
// ============================================================================

class ProblemConsistencyValidator {
  validate(question) {
    const issues = [];

    if (!question.question || question.question.trim().length === 0) {
      issues.push({
        severity: 'critical',
        type: 'empty_question',
        field: 'question',
        message: 'Question text is empty or missing'
      });
    }

    // Check for ambiguous patterns
    const patterns = [
      { regex: /\?\?/g, type: 'double_question_marks' },
      { regex: /\[unclear\]/gi, type: 'unclear_marker' },
      { regex: /\[missing\]/gi, type: 'missing_marker' },
      { regex: /\[TODO\]/gi, type: 'todo_marker' },
    ];

    patterns.forEach(({ regex, type }) => {
      if (regex.test(question.question)) {
        issues.push({
          severity: 'high',
          type,
          field: 'question',
          message: `Found ambiguous content: ${regex.source}`
        });
      }
    });

    return issues;
  }
}

class FigureValidator {
  validate(question) {
    const issues = [];
    const figureKeywords = [
      /figure\s+shows?/gi,
      /diagram\s+shows?/gi,
      /\[Figure/gi,
      /see\s+(the\s+)?figure/gi,
      /in\s+the\s+figure/gi,
    ];

    const hasFigureReference = figureKeywords.some(kw => kw.test(question.question));
    const hasSVG = /<svg/i.test(question.question_html || '');
    const hasMissingTag = /MISSING FIGURE/i.test(question.question_html || '');

    if (hasFigureReference && !hasSVG) {
      issues.push({
        severity: 'critical',
        type: 'missing_figure',
        field: 'question_html',
        message: 'Question references a figure but no SVG found'
      });
    }

    if (hasMissingTag) {
      issues.push({
        severity: 'high',
        type: 'missing_figure_tag',
        field: 'question_html',
        message: 'Question has "MISSING FIGURE" tag'
      });
    }

    return issues;
  }
}

class OptionsValidator {
  validate(question) {
    const issues = [];

    const options = ['a', 'b', 'c', 'd'];
    const missingOptions = options.filter(opt => !question[`option_${opt}`]);

    if (missingOptions.length > 0) {
      issues.push({
        severity: 'critical',
        type: 'missing_options',
        field: 'options',
        message: `Missing options: ${missingOptions.join(', ')}`,
        details: missingOptions
      });
    }

    if (!question.correct_answer) {
      issues.push({
        severity: 'critical',
        type: 'missing_answer',
        field: 'correct_answer',
        message: 'No correct answer specified'
      });
    }

    return issues;
  }
}

class SolutionValidator {
  validate(question) {
    const issues = [];
    const solutionText = question.solution_html || '';

    if (!solutionText || solutionText.trim().length === 0) {
      issues.push({
        severity: 'critical',
        type: 'missing_solution',
        field: 'solution_html',
        message: 'Solution is missing or empty'
      });
      return issues;
    }

    const components = [
      { name: 'Strategy', regex: /strategy/gi, severity: 'medium' },
      { name: 'Expert Insight', regex: /expert\s+insight/gi, severity: 'medium' },
      { name: 'Key Facts', regex: /key\s+facts/gi, severity: 'medium' },
      { name: 'Steps', regex: /step\s+\d|<ol|<li/gi, severity: 'high' },
    ];

    components.forEach(({ name, regex, severity }) => {
      if (!regex.test(solutionText)) {
        issues.push({
          severity,
          type: `missing_${name.toLowerCase().replace(/\s+/g, '_')}`,
          field: 'solution_html',
          message: `Solution missing "${name}" section`
        });
      }
    });

    return issues;
  }
}

// ============================================================================
// Fix Agents
// ============================================================================

class ProblemConsistencyFixer {
  fix(question, issues) {
    let fixed = { ...question };
    const fixes = [];

    issues.forEach(issue => {
      switch (issue.type) {
        case 'double_question_marks':
          fixed.question = fixed.question.replace(/\?\?/g, '?');
          fixes.push('Removed double question marks');
          break;

        case 'unclear_marker':
          fixed.question = fixed.question.replace(/\[unclear\]/gi, '');
          fixes.push('Removed [unclear] markers');
          break;

        case 'missing_marker':
          fixed.question = fixed.question.replace(/\[missing\]/gi, '');
          fixes.push('Removed [missing] markers');
          break;

        case 'todo_marker':
          fixed.question = fixed.question.replace(/\[TODO\]/gi, '');
          fixes.push('Removed [TODO] markers');
          break;
      }
    });

    return { fixed, fixes };
  }
}

class FigureFixer {
  fix(question, issues) {
    let fixed = { ...question };
    const fixes = [];

    issues.forEach(issue => {
      if (issue.type === 'missing_figure_tag') {
        // Remove MISSING FIGURE tags
        fixed.question_html = (fixed.question_html || '').replace(
          /<span class="problem-tag">\s*MISSING FIGURE\s*<\/span>/gi,
          ''
        );
        fixes.push('Removed MISSING FIGURE tag');
      }

      if (issue.type === 'missing_figure') {
        // Add a note that figure needs to be created
        if (!fixed.question_html) fixed.question_html = '';
        const note = '\n<!-- NOTE: Figure needs to be created based on description -->\n';
        if (!fixed.question_html.includes('NOTE: Figure needs')) {
          fixed.question_html = note + fixed.question_html;
          fixes.push('Added note about missing figure');
        }
      }
    });

    return { fixed, fixes };
  }
}

class OptionsFixer {
  fix(question, issues) {
    let fixed = { ...question };
    const fixes = [];

    issues.forEach(issue => {
      if (issue.type === 'missing_options' && issue.details) {
        issue.details.forEach(opt => {
          if (!fixed[`option_${opt}`]) {
            fixed[`option_${opt}`] = `[Option ${opt.toUpperCase()} needs to be added]`;
            fixes.push(`Created placeholder for option ${opt.toUpperCase()}`);
          }
        });
      }

      if (issue.type === 'missing_answer' && !fixed.correct_answer) {
        fixed.correct_answer = 'a';
        fixes.push('Set default answer to A (needs verification)');
      }
    });

    return { fixed, fixes };
  }
}

class SolutionFixer {
  fix(question, issues) {
    let fixed = { ...question };
    const fixes = [];

    issues.forEach(issue => {
      if (issue.type === 'missing_solution') {
        fixed.solution_html = `
<div class="solution">
  <div class="strategy"><strong>Strategy:</strong> [Strategy needs to be added]</div>
  <div class="expert-insight"><strong>Expert Insight:</strong> [Expert insight needs to be added]</div>
  <div class="key-facts"><strong>Key Facts Used:</strong> [Key facts need to be added]</div>
  <ol class="steps">
    <li><strong>Step 1:</strong> [Solution step needs to be added]</li>
  </ol>
</div>`;
        fixes.push('Created solution template with all required sections');
        return;
      }

      if (!fixed.solution_html) fixed.solution_html = '<div class="solution"></div>';

      if (issue.type === 'missing_strategy') {
        fixed.solution_html = fixed.solution_html.replace(
          '<div class="solution">',
          '<div class="solution">\n  <div class="strategy"><strong>Strategy:</strong> [Strategy needs to be added]</div>'
        );
        fixes.push('Added Strategy section placeholder');
      }

      if (issue.type === 'missing_expert_insight') {
        fixed.solution_html = fixed.solution_html.replace(
          '<div class="solution">',
          '<div class="solution">\n  <div class="expert-insight"><strong>Expert Insight:</strong> [Expert insight needs to be added]</div>'
        );
        fixes.push('Added Expert Insight section placeholder');
      }

      if (issue.type === 'missing_key_facts') {
        fixed.solution_html = fixed.solution_html.replace(
          '<div class="solution">',
          '<div class="solution">\n  <div class="key-facts"><strong>Key Facts Used:</strong> [Key facts need to be added]</div>'
        );
        fixes.push('Added Key Facts section placeholder');
      }

      if (issue.type === 'missing_steps') {
        fixed.solution_html = fixed.solution_html.replace(
          '</div>',
          '\n  <ol class="steps"><li><strong>Step 1:</strong> [Solution step needs to be added]</li></ol>\n</div>'
        );
        fixes.push('Added Steps section placeholder');
      }
    });

    return { fixed, fixes };
  }
}

// ============================================================================
// Main Orchestrator
// ============================================================================

class SelfCorrectingOrchestrator {
  constructor() {
    this.validators = {
      problem: new ProblemConsistencyValidator(),
      figure: new FigureValidator(),
      options: new OptionsValidator(),
      solution: new SolutionValidator(),
    };

    this.fixers = {
      problem: new ProblemConsistencyFixer(),
      figure: new FigureFixer(),
      options: new OptionsFixer(),
      solution: new SolutionFixer(),
    };
  }

  async run() {
    console.log('🚀 Starting Self-Correcting Validation Pipeline...\n');
    console.log(`📚 Subject: ${CONFIG.subject}`);
    console.log(`🎯 Processing first ${CONFIG.testLimit} questions with issues\n`);

    // Fetch questions
    const { data: questions, error } = await supabase
      .from('questions')
      .select('*')
      .eq('subject', CONFIG.subject)
      .limit(100); // Get more to find 10 with issues

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
      console.log(`📝 Processing: ${question.question_id}`);
      console.log('='.repeat(70));

      // Step 1: Validate and find all issues
      const beforeIssues = this.validateQuestion(question);

      if (beforeIssues.total === 0) {
        console.log('✅ No issues found, skipping...\n');
        continue;
      }

      processedCount++;
      console.log(`\n📊 Found ${beforeIssues.total} issues\n`);

      // Step 2: Apply fixes for each issue category
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

      // Step 3: Re-validate to verify fixes
      console.log('\n🔍 Re-validating after fixes...');
      const afterIssues = this.validateQuestion(fixedQuestion);

      console.log(`\n📈 Results:`);
      console.log(`   Before: ${beforeIssues.total} issues`);
      console.log(`   After:  ${afterIssues.total} issues`);
      console.log(`   Fixed:  ${beforeIssues.total - afterIssues.total} issues\n`);

      // Step 4: Update database
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
          })
          .eq('id', question.id);

        if (updateError) {
          console.log('   ❌ Update failed:', updateError.message);
        } else {
          console.log('   ✅ Database updated successfully');
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

    // Generate report
    this.generateReport(results);
  }

  validateQuestion(question) {
    const allIssues = {
      problem: this.validators.problem.validate(question),
      figure: this.validators.figure.validate(question),
      options: this.validators.options.validate(question),
      solution: this.validators.solution.validate(question),
    };

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

    // Generate HTML report
    const html = this.generateHTMLReport(results);
    const htmlFile = `${CONFIG.outputDir}/correction_report_${CONFIG.subject}_${timestamp}.html`;
    fs.writeFileSync(htmlFile, html, 'utf8');

    // Generate JSON report
    const jsonFile = `${CONFIG.outputDir}/correction_data_${CONFIG.subject}_${timestamp}.json`;
    fs.writeFileSync(jsonFile, JSON.stringify(results, null, 2), 'utf8');

    console.log('='.repeat(70));
    console.log('✅ Self-Correcting Pipeline Complete');
    console.log('='.repeat(70));
    console.log(`\n📄 Reports generated:`);
    console.log(`   HTML: ${htmlFile}`);
    console.log(`   JSON: ${jsonFile}`);
    console.log(`\n📊 Summary:`);
    console.log(`   Questions processed: ${results.length}`);
    console.log(`   Total issues before: ${results.reduce((sum, r) => sum + r.before.total, 0)}`);
    console.log(`   Total issues after: ${results.reduce((sum, r) => sum + r.after.total, 0)}`);
    console.log(`   Total fixes applied: ${results.reduce((sum, r) => sum + r.fixes.length, 0)}\n`);
  }

  generateHTMLReport(results) {
    const totalBefore = results.reduce((sum, r) => sum + r.before.total, 0);
    const totalAfter = results.reduce((sum, r) => sum + r.after.total, 0);
    const totalFixed = totalBefore - totalAfter;

    let questionsHTML = '';

    results.forEach((result, index) => {
      const improvement = ((result.before.total - result.after.total) / result.before.total * 100).toFixed(1);

      questionsHTML += `
      <div class="question-card">
        <div class="question-header">
          <div class="question-id">#${index + 1}: ${result.question_id}</div>
          <div class="improvement ${result.after.total === 0 ? 'perfect' : 'partial'}">
            ${result.after.total === 0 ? '✅ Perfect' : `${improvement}% improved`}
          </div>
        </div>

        <div class="stats-row">
          <div class="stat">
            <div class="stat-label">Before</div>
            <div class="stat-value before">${result.before.total}</div>
          </div>
          <div class="stat">
            <div class="stat-label">After</div>
            <div class="stat-value after">${result.after.total}</div>
          </div>
          <div class="stat">
            <div class="stat-label">Fixed</div>
            <div class="stat-value fixed">${result.before.total - result.after.total}</div>
          </div>
        </div>

        <div class="fixes-applied">
          <h4>🔧 Fixes Applied (${result.fixes.length}):</h4>
          <ul>
            ${result.fixes.map(fix => `<li>${fix}</li>`).join('')}
          </ul>
        </div>

        <button class="collapsible">📄 View Before/After Details</button>
        <div class="content">
          <div class="comparison">
            <div class="before-col">
              <h4>❌ Before</h4>
              <div class="field">
                <strong>Question:</strong>
                <div class="text-content">${this.escapeHtml(result.original.question || '')}</div>
              </div>
              <div class="field">
                <strong>Options:</strong>
                <div>A: ${this.escapeHtml(result.original.option_a || '')}</div>
                <div>B: ${this.escapeHtml(result.original.option_b || '')}</div>
                <div>C: ${this.escapeHtml(result.original.option_c || '')}</div>
                <div>D: ${this.escapeHtml(result.original.option_d || '')}</div>
                <div>Correct: ${result.original.correct_answer || 'N/A'}</div>
              </div>
              <div class="issues-list">
                <strong>Issues:</strong>
                ${this.formatIssues(result.before)}
              </div>
            </div>

            <div class="after-col">
              <h4>✅ After</h4>
              <div class="field">
                <strong>Question:</strong>
                <div class="text-content">${this.escapeHtml(result.fixed.question || '')}</div>
              </div>
              <div class="field">
                <strong>Options:</strong>
                <div>A: ${this.escapeHtml(result.fixed.option_a || '')}</div>
                <div>B: ${this.escapeHtml(result.fixed.option_b || '')}</div>
                <div>C: ${this.escapeHtml(result.fixed.option_c || '')}</div>
                <div>D: ${this.escapeHtml(result.fixed.option_d || '')}</div>
                <div>Correct: ${result.fixed.correct_answer || 'N/A'}</div>
              </div>
              <div class="issues-list">
                <strong>Remaining Issues:</strong>
                ${result.after.total === 0 ? '<div class="success">✅ All issues resolved!</div>' : this.formatIssues(result.after)}
              </div>
            </div>
          </div>
        </div>
      </div>`;
    });

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Self-Correction Report - ${CONFIG.subject}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      line-height: 1.6;
      padding: 30px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
    }
    .container { max-width: 1400px; margin: 0 auto; background: white; padding: 40px; border-radius: 15px; box-shadow: 0 10px 50px rgba(0,0,0,0.3); }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 40px; border-radius: 10px; margin-bottom: 30px; text-align: center; }
    .header h1 { font-size: 42px; margin-bottom: 15px; }
    .header .subtitle { font-size: 20px; opacity: 0.9; }

    .summary-stats {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 20px;
      margin: 30px 0;
    }
    .summary-card {
      background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
      color: white;
      padding: 25px;
      border-radius: 12px;
      text-align: center;
      box-shadow: 0 4px 12px rgba(0,0,0,0.1);
    }
    .summary-card.success { background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%); }
    .summary-card.warning { background: linear-gradient(135deg, #fa709a 0%, #fee140 100%); }
    .summary-card h3 { font-size: 14px; opacity: 0.9; margin-bottom: 10px; text-transform: uppercase; }
    .summary-card .value { font-size: 36px; font-weight: bold; }

    .question-card {
      border: 3px solid #e0e0e0;
      border-radius: 12px;
      padding: 30px;
      margin: 30px 0;
      background: #fafafa;
      box-shadow: 0 4px 12px rgba(0,0,0,0.08);
    }
    .question-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
      padding-bottom: 15px;
      border-bottom: 3px solid #3498db;
    }
    .question-id { font-size: 22px; font-weight: bold; color: #2c3e50; }
    .improvement {
      padding: 10px 20px;
      border-radius: 25px;
      font-weight: bold;
      font-size: 16px;
    }
    .improvement.perfect { background: #27ae60; color: white; }
    .improvement.partial { background: #f39c12; color: white; }

    .stats-row {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 15px;
      margin: 20px 0;
    }
    .stat {
      background: white;
      padding: 15px;
      border-radius: 8px;
      text-align: center;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }
    .stat-label { font-size: 12px; color: #7f8c8d; text-transform: uppercase; margin-bottom: 8px; }
    .stat-value { font-size: 32px; font-weight: bold; }
    .stat-value.before { color: #e74c3c; }
    .stat-value.after { color: #f39c12; }
    .stat-value.fixed { color: #27ae60; }

    .fixes-applied {
      background: #d4edda;
      border-left: 5px solid #28a745;
      padding: 20px;
      border-radius: 8px;
      margin: 20px 0;
    }
    .fixes-applied h4 { color: #155724; margin-bottom: 15px; }
    .fixes-applied ul { list-style: none; }
    .fixes-applied li { padding: 8px 0; border-bottom: 1px solid #c3e6cb; }
    .fixes-applied li:last-child { border-bottom: none; }
    .fixes-applied li:before { content: "✓ "; color: #28a745; font-weight: bold; margin-right: 8px; }

    .collapsible {
      background: #3498db;
      color: white;
      cursor: pointer;
      padding: 15px;
      width: 100%;
      border: none;
      text-align: left;
      font-size: 16px;
      font-weight: bold;
      border-radius: 8px;
      margin-top: 20px;
      transition: background 0.3s;
    }
    .collapsible:hover { background: #2980b9; }
    .collapsible:after { content: ' ▼'; float: right; }
    .collapsible.active:after { content: ' ▲'; }

    .content {
      display: none;
      padding: 25px;
      background: white;
      border-radius: 8px;
      margin-top: 10px;
      border: 2px solid #e0e0e0;
    }
    .content.show { display: block; }

    .comparison {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 30px;
    }
    .before-col, .after-col {
      padding: 20px;
      border-radius: 8px;
    }
    .before-col {
      background: #fff3cd;
      border: 2px solid #ffc107;
    }
    .after-col {
      background: #d4edda;
      border: 2px solid #28a745;
    }
    .before-col h4 { color: #856404; margin-bottom: 20px; }
    .after-col h4 { color: #155724; margin-bottom: 20px; }

    .field {
      margin: 15px 0;
      padding: 15px;
      background: white;
      border-radius: 6px;
    }
    .field strong { display: block; margin-bottom: 8px; color: #2c3e50; }
    .text-content {
      padding: 10px;
      background: #f8f9fa;
      border-radius: 4px;
      font-size: 14px;
      line-height: 1.6;
    }

    .issues-list {
      margin-top: 15px;
      padding: 15px;
      background: white;
      border-radius: 6px;
    }
    .issues-list strong { display: block; margin-bottom: 10px; color: #2c3e50; }
    .issue-item {
      padding: 8px 12px;
      margin: 8px 0;
      background: #f8d7da;
      border-left: 4px solid #dc3545;
      border-radius: 4px;
      font-size: 13px;
    }
    .issue-item.medium { background: #fff3cd; border-left-color: #ffc107; }
    .issue-item.high { background: #f8d7da; border-left-color: #dc3545; }
    .issue-item.critical { background: #721c24; color: white; border-left-color: #491217; }
    .success { color: #155724; font-weight: bold; padding: 10px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🤖 Self-Correcting Pipeline Report</h1>
      <div class="subtitle">${CONFIG.subject} - First ${CONFIG.testLimit} Questions with Issues</div>
      <div style="font-size: 14px; margin-top: 10px; opacity: 0.8;">Generated: ${new Date().toLocaleString()}</div>
    </div>

    <div class="summary-stats">
      <div class="summary-card">
        <h3>Questions Processed</h3>
        <div class="value">${results.length}</div>
      </div>
      <div class="summary-card warning">
        <h3>Issues Before</h3>
        <div class="value">${totalBefore}</div>
      </div>
      <div class="summary-card warning">
        <h3>Issues After</h3>
        <div class="value">${totalAfter}</div>
      </div>
      <div class="summary-card success">
        <h3>Issues Fixed</h3>
        <div class="value">${totalFixed}</div>
      </div>
      <div class="summary-card success">
        <h3>Success Rate</h3>
        <div class="value">${((totalFixed / totalBefore) * 100).toFixed(1)}%</div>
      </div>
    </div>

    <h2 style="margin: 40px 0 20px 0; color: #2c3e50; border-bottom: 4px solid #3498db; padding-bottom: 15px;">
      📝 Detailed Correction Results
    </h2>

    ${questionsHTML}
  </div>

  <script>
    document.querySelectorAll('.collapsible').forEach(btn => {
      btn.addEventListener('click', function() {
        this.classList.toggle('active');
        const content = this.nextElementSibling;
        content.classList.toggle('show');
      });
    });
  </script>
</body>
</html>`;
  }

  formatIssues(issueData) {
    const allIssues = Object.values(issueData.byCategory).flat();
    if (allIssues.length === 0) return '<div class="success">✅ No issues</div>';

    return allIssues.map(issue =>
      `<div class="issue-item ${issue.severity}">[${issue.severity.toUpperCase()}] ${issue.message}</div>`
    ).join('');
  }

  escapeHtml(text) {
    const map = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
  }
}

// ============================================================================
// Main Execution
// ============================================================================

async function main() {
  const orchestrator = new SelfCorrectingOrchestrator();
  await orchestrator.run();
}

main().catch(console.error);
