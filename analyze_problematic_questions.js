#!/usr/bin/env node
/**
 * Analyze database for problematic questions:
 * 1. No options (empty or null options array)
 * 2. Incomplete questions (very short question text)
 * 3. Missing figures (mentions "figure" but no image)
 * 4. Solution/answer mismatch (solution doesn't match correct answer)
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Helper function to check if question mentions figure
function mentionsFigure(text, htmlText) {
  const checkText = text || htmlText || '';
  if (!checkText) return false;
  const lowerText = checkText.toLowerCase();
  const figurePatterns = [
    'figure', 'diagram', 'graph', 'image', 'shown below',
    'shown above', 'illustration', 'picture', 'fig.',
    'see the', 'as shown', 'given below', 'given above'
  ];
  return figurePatterns.some(pattern => lowerText.includes(pattern));
}

// Helper function to check if question has image
function hasImage(text, htmlText) {
  const checkText = text || htmlText || '';
  if (!checkText) return false;
  return checkText.includes('<img') || checkText.includes('data:image');
}

// Helper function to check solution/answer mismatch
function hasSolutionAnswerMismatch(question) {
  const solutionText = question.solution_text || question.solution || '';
  const correctAnswer = question.correct_answer || '';

  if (!solutionText || !correctAnswer) return false;

  const solution = solutionText.toLowerCase();
  const answer = correctAnswer.toLowerCase().trim();

  // Check if solution explicitly mentions a different option than correct answer
  const optionPatterns = [
    /option\s*\(([abcd])\)/gi,
    /answer\s*is\s*\(([abcd])\)/gi,
    /correct\s*answer\s*is\s*\(([abcd])\)/gi,
    /answer:\s*\(([abcd])\)/gi,
    /option\s*([abcd])\s*is\s*correct/gi
  ];

  for (const pattern of optionPatterns) {
    const matches = [...solution.matchAll(pattern)];
    for (const match of matches) {
      const mentionedOption = match[1].toLowerCase();
      if (mentionedOption !== answer) {
        return true;
      }
    }
  }

  return false;
}

async function analyzeQuestions() {
  console.log('🔍 Analyzing database for problematic questions...\n');

  // Fetch all questions
  const { data: allQuestions, error } = await supabase
    .from('questions')
    .select('*')
    .order('subject', { ascending: true })
    .order('topic', { ascending: true });

  if (error) {
    console.error('❌ Error fetching questions:', error.message);
    process.exit(1);
  }

  console.log(`✅ Fetched ${allQuestions.length} questions\n`);

  const problematicQuestions = {
    Mathematics: {
      noOptions: [],
      incomplete: [],
      missingFigure: [],
      solutionMismatch: []
    },
    Physics: {
      noOptions: [],
      incomplete: [],
      missingFigure: [],
      solutionMismatch: []
    }
  };

  // Analyze each question
  for (const q of allQuestions) {
    const subject = q.subject || 'Unknown';

    // Skip if not Math or Physics
    if (subject !== 'Mathematics' && subject !== 'Physics') continue;

    // Get question text from either field
    const questionText = q.question || q.question_text || '';
    const questionHtml = q.question_html || '';

    // Check 1: No options or empty options
    const hasValidOptions = q.options &&
                           typeof q.options === 'object' &&
                           Object.keys(q.options).length > 0;

    if (!hasValidOptions) {
      problematicQuestions[subject].noOptions.push(q);
    }

    // Check 2: Incomplete question (very short text, less than 10 chars)
    if (!questionText || questionText.trim().length < 10) {
      problematicQuestions[subject].incomplete.push(q);
    }

    // Check 3: Mentions figure but no image
    if (mentionsFigure(questionText, questionHtml) && !hasImage(questionText, questionHtml)) {
      problematicQuestions[subject].missingFigure.push(q);
    }

    // Check 4: Solution/answer mismatch
    if (hasSolutionAnswerMismatch(q)) {
      problematicQuestions[subject].solutionMismatch.push(q);
    }
  }

  // Print summary
  console.log('📊 ANALYSIS SUMMARY\n');
  console.log('='.repeat(70));

  for (const subject of ['Mathematics', 'Physics']) {
    const stats = problematicQuestions[subject];
    console.log(`\n${subject}:`);
    console.log(`  • No options: ${stats.noOptions.length}`);
    console.log(`  • Incomplete: ${stats.incomplete.length}`);
    console.log(`  • Missing figure: ${stats.missingFigure.length}`);
    console.log(`  • Solution/answer mismatch: ${stats.solutionMismatch.length}`);
    console.log(`  Total problematic: ${stats.noOptions.length + stats.incomplete.length + stats.missingFigure.length + stats.solutionMismatch.length}`);
  }
  console.log('\n' + '='.repeat(70));

  // Save to JSON
  const outputFile = 'problematic_questions_analysis.json';
  fs.writeFileSync(outputFile, JSON.stringify(problematicQuestions, null, 2));
  console.log(`\n💾 Saved analysis to: ${outputFile}`);

  return problematicQuestions;
}

async function generateHTMLReports(problematicQuestions) {
  console.log('\n📄 Generating HTML reports...\n');

  for (const subject of ['Mathematics', 'Physics']) {
    const stats = problematicQuestions[subject];
    const totalProblematic = stats.noOptions.length + stats.incomplete.length +
                            stats.missingFigure.length + stats.solutionMismatch.length;

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Problematic ${subject} Questions - Analysis Report</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      line-height: 1.6;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 20px;
      min-height: 100vh;
    }

    .container {
      max-width: 1200px;
      margin: 0 auto;
      background: white;
      padding: 40px;
      border-radius: 15px;
      box-shadow: 0 10px 40px rgba(0,0,0,0.2);
    }

    h1 {
      color: #667eea;
      margin-bottom: 10px;
      font-size: 2.5em;
      border-bottom: 4px solid #667eea;
      padding-bottom: 15px;
    }

    .subtitle {
      color: #666;
      font-size: 1.1em;
      margin-bottom: 30px;
    }

    .summary {
      background: #f8f9fa;
      padding: 25px;
      border-radius: 10px;
      margin-bottom: 30px;
      border-left: 5px solid #667eea;
    }

    .summary h2 {
      color: #333;
      margin-bottom: 15px;
      font-size: 1.5em;
    }

    .stat-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 15px;
      margin-top: 15px;
    }

    .stat-card {
      background: white;
      padding: 15px;
      border-radius: 8px;
      border: 2px solid #e0e0e0;
      text-align: center;
    }

    .stat-number {
      font-size: 2em;
      font-weight: bold;
      color: #667eea;
    }

    .stat-label {
      color: #666;
      font-size: 0.9em;
      margin-top: 5px;
    }

    .section {
      margin: 40px 0;
    }

    .section-header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 15px 20px;
      border-radius: 8px;
      margin-bottom: 20px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .section-title {
      font-size: 1.4em;
      font-weight: bold;
    }

    .count-badge {
      background: white;
      color: #667eea;
      padding: 5px 15px;
      border-radius: 20px;
      font-weight: bold;
    }

    .question-card {
      background: #fff;
      border: 2px solid #e0e0e0;
      border-radius: 10px;
      padding: 25px;
      margin-bottom: 20px;
      transition: all 0.3s ease;
    }

    .question-card:hover {
      box-shadow: 0 5px 20px rgba(0,0,0,0.1);
      transform: translateY(-2px);
    }

    .question-meta {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
      margin-bottom: 15px;
      padding-bottom: 15px;
      border-bottom: 2px solid #f0f0f0;
    }

    .meta-tag {
      background: #e7e9fc;
      color: #667eea;
      padding: 5px 12px;
      border-radius: 15px;
      font-size: 0.85em;
      font-weight: 600;
    }

    .problem-tag {
      background: #ffe0e0;
      color: #d32f2f;
      padding: 5px 12px;
      border-radius: 15px;
      font-size: 0.85em;
      font-weight: 600;
    }

    .question-text {
      background: #f8f9fa;
      padding: 20px;
      border-radius: 8px;
      margin: 15px 0;
      border-left: 4px solid #667eea;
    }

    .question-text h4 {
      color: #333;
      margin-bottom: 10px;
    }

    .options-section {
      margin: 15px 0;
    }

    .options-section h4 {
      color: #333;
      margin-bottom: 10px;
    }

    .option {
      background: #f0f7ff;
      padding: 10px 15px;
      margin: 8px 0;
      border-radius: 5px;
      border-left: 3px solid #667eea;
    }

    .solution-section {
      margin: 15px 0;
      background: #f0fff4;
      padding: 20px;
      border-radius: 8px;
      border-left: 4px solid #48bb78;
    }

    .solution-section h4 {
      color: #2d3748;
      margin-bottom: 15px;
      font-size: 1.1em;
    }

    .solution-section .solution,
    .solution-section .step {
      margin: 10px 0;
      line-height: 1.8;
    }

    .solution-section .step-number {
      font-weight: bold;
      color: #667eea;
    }

    .solution-section .formula {
      background: white;
      padding: 15px;
      margin: 10px 0;
      border-radius: 5px;
      border: 1px solid #e0e0e0;
      font-family: 'Courier New', monospace;
      white-space: pre-wrap;
    }

    .correct-answer {
      background: #c6f6d5;
      color: #22543d;
      padding: 8px 15px;
      border-radius: 5px;
      display: inline-block;
      font-weight: bold;
      margin: 10px 0;
    }

    .warning {
      background: #fff3cd;
      border: 2px solid #ffc107;
      color: #856404;
      padding: 15px;
      border-radius: 8px;
      margin: 15px 0;
    }

    .error {
      background: #f8d7da;
      border: 2px solid #dc3545;
      color: #721c24;
      padding: 15px;
      border-radius: 8px;
      margin: 15px 0;
    }

    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 2px solid #e0e0e0;
      text-align: center;
      color: #666;
      font-size: 0.9em;
    }

    img {
      max-width: 100%;
      height: auto;
      border-radius: 8px;
      margin: 10px 0;
    }

    @media print {
      body {
        background: white;
        padding: 0;
      }
      .container {
        box-shadow: none;
        padding: 20px;
      }
      .question-card {
        page-break-inside: avoid;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>🔍 Problematic ${subject} Questions</h1>
    <div class="subtitle">Analysis Report - Database Quality Check</div>

    <div class="summary">
      <h2>📊 Summary Statistics</h2>
      <div class="stat-grid">
        <div class="stat-card">
          <div class="stat-number">${totalProblematic}</div>
          <div class="stat-label">Total Problematic</div>
        </div>
        <div class="stat-card">
          <div class="stat-number">${stats.noOptions.length}</div>
          <div class="stat-label">No Options</div>
        </div>
        <div class="stat-card">
          <div class="stat-number">${stats.incomplete.length}</div>
          <div class="stat-label">Incomplete</div>
        </div>
        <div class="stat-card">
          <div class="stat-number">${stats.missingFigure.length}</div>
          <div class="stat-label">Missing Figure</div>
        </div>
        <div class="stat-card">
          <div class="stat-number">${stats.solutionMismatch.length}</div>
          <div class="stat-label">Solution Mismatch</div>
        </div>
      </div>
    </div>

    <!-- NO OPTIONS SECTION -->
    ${stats.noOptions.length > 0 ? `
    <div class="section">
      <div class="section-header">
        <span class="section-title">❌ No Options</span>
        <span class="count-badge">${stats.noOptions.length} questions</span>
      </div>
      ${stats.noOptions.map((q, idx) => `
        <div class="question-card">
          <div class="question-meta">
            <span class="meta-tag">ID: ${q.external_id || q.id}</span>
            <span class="meta-tag">Topic: ${q.topic || 'Unknown'}</span>
            <span class="meta-tag">Chapter: ${q.chapter || 'Unknown'}</span>
            <span class="meta-tag">Difficulty: ${q.difficulty_level || 'Unknown'}</span>
            <span class="problem-tag">NO OPTIONS</span>
          </div>

          <div class="question-text">
            <h4>Question ${idx + 1}:</h4>
            ${q.question || q.question_text || q.question_html || '<em>No question text</em>'}
          </div>

          <div class="error">
            <strong>⚠️ Issue:</strong> This question has no options array or empty options.
          </div>

          ${q.correct_answer ? `
          <div style="margin: 15px 0;">
            <strong>Correct Answer:</strong> <span class="correct-answer">${q.correct_answer.toUpperCase()}</span>
          </div>
          ` : '<div class="warning">⚠️ No correct answer specified</div>'}

          ${q.solution_html || q.solution_text || q.solution ? `
          <div class="solution-section">
            <h4>💡 Complete Solution:</h4>
            <div style="max-height: none; overflow: visible;">
              ${q.solution_html || q.solution_text || q.solution}
            </div>
          </div>
          ` : '<div class="error">❌ No solution provided</div>'}
        </div>
      `).join('')}
    </div>
    ` : ''}

    <!-- INCOMPLETE SECTION -->
    ${stats.incomplete.length > 0 ? `
    <div class="section">
      <div class="section-header">
        <span class="section-title">📝 Incomplete Questions</span>
        <span class="count-badge">${stats.incomplete.length} questions</span>
      </div>
      ${stats.incomplete.map((q, idx) => `
        <div class="question-card">
          <div class="question-meta">
            <span class="meta-tag">ID: ${q.external_id || q.id}</span>
            <span class="meta-tag">Topic: ${q.topic || 'Unknown'}</span>
            <span class="meta-tag">Chapter: ${q.chapter || 'Unknown'}</span>
            <span class="meta-tag">Difficulty: ${q.difficulty_level || 'Unknown'}</span>
            <span class="problem-tag">INCOMPLETE</span>
          </div>

          <div class="question-text">
            <h4>Question ${idx + 1}:</h4>
            ${q.question || q.question_text || q.question_html || '<em>No question text</em>'}
          </div>

          <div class="error">
            <strong>⚠️ Issue:</strong> Question text is too short (${(q.question || q.question_text || '').length} characters). Likely incomplete or corrupted.
          </div>

          ${q.options && typeof q.options === 'object' && Object.keys(q.options).length > 0 ? `
          <div class="options-section">
            <h4>Options:</h4>
            ${Object.entries(q.options).map(([key, value]) => `
              <div class="option">${key.toUpperCase()}. ${value}</div>
            `).join('')}
          </div>
          ` : '<div class="error">❌ No options provided</div>'}

          ${q.correct_answer ? `
          <div style="margin: 15px 0;">
            <strong>Correct Answer:</strong> <span class="correct-answer">${q.correct_answer.toUpperCase()}</span>
          </div>
          ` : '<div class="warning">⚠️ No correct answer specified</div>'}

          ${q.solution_html || q.solution_text || q.solution ? `
          <div class="solution-section">
            <h4>💡 Complete Solution:</h4>
            <div style="max-height: none; overflow: visible;">
              ${q.solution_html || q.solution_text || q.solution}
            </div>
          </div>
          ` : '<div class="error">❌ No solution provided</div>'}
        </div>
      `).join('')}
    </div>
    ` : ''}

    <!-- MISSING FIGURE SECTION -->
    ${stats.missingFigure.length > 0 ? `
    <div class="section">
      <div class="section-header">
        <span class="section-title">🖼️ Missing Figure</span>
        <span class="count-badge">${stats.missingFigure.length} questions</span>
      </div>
      ${stats.missingFigure.map((q, idx) => `
        <div class="question-card">
          <div class="question-meta">
            <span class="meta-tag">ID: ${q.external_id || q.id}</span>
            <span class="meta-tag">Topic: ${q.topic || 'Unknown'}</span>
            <span class="meta-tag">Chapter: ${q.chapter || 'Unknown'}</span>
            <span class="meta-tag">Difficulty: ${q.difficulty_level || 'Unknown'}</span>
            <span class="problem-tag">MISSING FIGURE</span>
          </div>

          <div class="question-text">
            <h4>Question ${idx + 1}:</h4>
            ${q.question || q.question_text || q.question_html || '<em>No question text</em>'}
          </div>

          <div class="warning">
            <strong>⚠️ Issue:</strong> Question text mentions a figure/diagram/graph but no image is embedded.
          </div>

          ${q.options && typeof q.options === 'object' && Object.keys(q.options).length > 0 ? `
          <div class="options-section">
            <h4>Options:</h4>
            ${Object.entries(q.options).map(([key, value]) => `
              <div class="option">${key.toUpperCase()}. ${value}</div>
            `).join('')}
          </div>
          ` : '<div class="error">❌ No options provided</div>'}

          ${q.correct_answer ? `
          <div style="margin: 15px 0;">
            <strong>Correct Answer:</strong> <span class="correct-answer">${q.correct_answer.toUpperCase()}</span>
          </div>
          ` : '<div class="warning">⚠️ No correct answer specified</div>'}

          ${q.solution_html || q.solution_text || q.solution ? `
          <div class="solution-section">
            <h4>💡 Complete Solution:</h4>
            <div style="max-height: none; overflow: visible;">
              ${q.solution_html || q.solution_text || q.solution}
            </div>
          </div>
          ` : '<div class="error">❌ No solution provided</div>'}
        </div>
      `).join('')}
    </div>
    ` : ''}

    <!-- SOLUTION MISMATCH SECTION -->
    ${stats.solutionMismatch.length > 0 ? `
    <div class="section">
      <div class="section-header">
        <span class="section-title">⚠️ Solution/Answer Mismatch</span>
        <span class="count-badge">${stats.solutionMismatch.length} questions</span>
      </div>
      ${stats.solutionMismatch.map((q, idx) => `
        <div class="question-card">
          <div class="question-meta">
            <span class="meta-tag">ID: ${q.external_id || q.id}</span>
            <span class="meta-tag">Topic: ${q.topic || 'Unknown'}</span>
            <span class="meta-tag">Chapter: ${q.chapter || 'Unknown'}</span>
            <span class="meta-tag">Difficulty: ${q.difficulty_level || 'Unknown'}</span>
            <span class="problem-tag">MISMATCH</span>
          </div>

          <div class="question-text">
            <h4>Question ${idx + 1}:</h4>
            ${q.question || q.question_text || q.question_html || '<em>No question text</em>'}
          </div>

          ${q.options && typeof q.options === 'object' && Object.keys(q.options).length > 0 ? `
          <div class="options-section">
            <h4>Options:</h4>
            ${Object.entries(q.options).map(([key, value]) => `
              <div class="option">${key.toUpperCase()}. ${value}</div>
            `).join('')}
          </div>
          ` : ''}

          <div class="error">
            <strong>⚠️ Issue:</strong> Solution mentions a different option than the correct answer field.
          </div>

          <div style="margin: 15px 0;">
            <strong>Correct Answer (Database):</strong> <span class="correct-answer">${q.correct_answer.toUpperCase()}</span>
          </div>

          ${q.solution_html || q.solution_text || q.solution ? `
          <div class="solution-section">
            <h4>💡 Complete Solution (Check for mentioned option):</h4>
            <div style="max-height: none; overflow: visible;">
              ${q.solution_html || q.solution_text || q.solution}
            </div>
          </div>
          ` : '<div class="error">❌ No solution provided</div>'}
        </div>
      `).join('')}
    </div>
    ` : ''}

    ${totalProblematic === 0 ? `
    <div class="section">
      <div class="success" style="background: #d4edda; border: 2px solid #28a745; color: #155724; padding: 20px; border-radius: 8px; text-align: center;">
        <h2>✅ No Problematic Questions Found!</h2>
        <p>All ${subject} questions appear to be properly formatted.</p>
      </div>
    </div>
    ` : ''}

    <div class="footer">
      <p><strong>Generated:</strong> ${new Date().toLocaleString()}</p>
      <p><strong>Subject:</strong> ${subject} | <strong>Total Problematic Questions:</strong> ${totalProblematic}</p>
    </div>
  </div>
</body>
</html>`;

    const filename = `problematic_${subject.toLowerCase()}_questions.html`;
    fs.writeFileSync(filename, html);
    console.log(`✅ Generated: ${filename}`);
  }
}

// Main execution
analyzeQuestions()
  .then(problematicQuestions => generateHTMLReports(problematicQuestions))
  .then(() => {
    console.log('\n✨ Analysis complete!');
    console.log('\n📂 Generated Files:');
    console.log('  • problematic_questions_analysis.json');
    console.log('  • problematic_mathematics_questions.html');
    console.log('  • problematic_physics_questions.html');
  })
  .catch(error => {
    console.error('❌ Error:', error);
    process.exit(1);
  });
