/**
 * Create HTML files for LaTeX correction
 * Generates clean HTML files with all questions, options, and solutions
 */

const fs = require('fs');

/**
 * Fix LaTeX delimiters
 */
function fixLatex(text) {
  if (!text) return text;
  return text.replace(/\\\$/g, '$').replace(/\\\(/g, '$').replace(/\\\)/g, '$');
}

/**
 * Generate HTML for a single question
 */
function generateQuestionHTML(question, index) {
  const hasOptions = question.option_a || question.option_b || question.option_c || question.option_d;
  const correctAnswerFull = question.correct_answer ? question.correct_answer.toUpperCase() : '';

  return `
    <div class="question-card">
      <div class="question-header">
        <span class="question-number">Question ${index + 1}</span>
        <div class="meta-tags">
          <span class="meta-tag">ID: ${question.external_id}</span>
          <span class="meta-tag">Topic: ${question.topic}</span>
          <span class="meta-tag">Chapter: ${question.chapter}</span>
          <span class="meta-tag">Difficulty: ${question.difficulty}</span>
        </div>
      </div>

      <div class="question-text">
        <strong>Question:</strong>
        <p>${fixLatex(question.question_text)}</p>
      </div>

      ${hasOptions ? `
      <div class="options-section">
        <strong>Options:</strong>
        <div class="options-grid">
          ${question.option_a ? `<div class="option ${correctAnswerFull === 'A' ? 'correct' : ''}">
            <span class="option-label">A.</span>
            <span class="option-text">${fixLatex(question.option_a)}</span>
          </div>` : ''}

          ${question.option_b ? `<div class="option ${correctAnswerFull === 'B' ? 'correct' : ''}">
            <span class="option-label">B.</span>
            <span class="option-text">${fixLatex(question.option_b)}</span>
          </div>` : ''}

          ${question.option_c ? `<div class="option ${correctAnswerFull === 'C' ? 'correct' : ''}">
            <span class="option-label">C.</span>
            <span class="option-text">${fixLatex(question.option_c)}</span>
          </div>` : ''}

          ${question.option_d ? `<div class="option ${correctAnswerFull === 'D' ? 'correct' : ''}">
            <span class="option-label">D.</span>
            <span class="option-text">${fixLatex(question.option_d)}</span>
          </div>` : ''}
        </div>
      </div>
      ` : '<div class="warning">⚠️ No options available - needs manual correction</div>'}

      <div class="correct-answer">
        <strong>Correct Answer:</strong> <span class="answer-highlight">${correctAnswerFull}</span>
      </div>

      ${question.solution_html || question.solution_text ? `
      <div class="solution-section">
        <strong>💡 Solution:</strong>
        <div class="solution-content">
          ${question.solution_html ? fixLatex(question.solution_html) : fixLatex(question.solution_text)}
        </div>
      </div>
      ` : '<div class="info">ℹ️ Solution not available</div>'}
    </div>
  `;
}

/**
 * Generate complete HTML file
 */
function generateHTML(questions, subject) {
  const questionsWithOptions = questions.filter(q => q.option_a || q.option_b || q.option_c || q.option_d).length;
  const questionsWithoutOptions = questions.length - questionsWithOptions;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject} Questions - LaTeX Corrections</title>
  <script src="https://polyfill.io/v3/polyfill.min.js?features=es6"></script>
  <script id="MathJax-script" async src="https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js"></script>
  <script>
    window.MathJax = {
      tex: {
        inlineMath: [['$', '$'], ['\\\\(', '\\\\)']],
        displayMath: [['$$', '$$'], ['\\\\[', '\\\\]']]
      }
    };
  </script>
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

    .question-card {
      background: #fff;
      border: 2px solid #e0e0e0;
      border-radius: 10px;
      padding: 25px;
      margin-bottom: 30px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }

    .question-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
      flex-wrap: wrap;
      gap: 10px;
    }

    .question-number {
      font-size: 1.3em;
      font-weight: bold;
      color: #667eea;
    }

    .meta-tags {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }

    .meta-tag {
      background: #667eea;
      color: white;
      padding: 5px 12px;
      border-radius: 15px;
      font-size: 0.85em;
    }

    .question-text {
      background: #f8f9fa;
      padding: 20px;
      border-radius: 8px;
      margin-bottom: 20px;
      border-left: 4px solid #667eea;
    }

    .question-text strong {
      display: block;
      margin-bottom: 10px;
      color: #333;
    }

    .question-text p {
      color: #555;
      font-size: 1.05em;
    }

    .options-section {
      margin-bottom: 20px;
    }

    .options-section > strong {
      display: block;
      margin-bottom: 15px;
      color: #333;
    }

    .options-grid {
      display: grid;
      gap: 12px;
    }

    .option {
      display: flex;
      gap: 12px;
      padding: 15px;
      background: #f8f9fa;
      border: 2px solid #e0e0e0;
      border-radius: 8px;
      transition: all 0.2s;
    }

    .option:hover {
      border-color: #667eea;
      background: #f0f4ff;
    }

    .option.correct {
      background: #d4edda;
      border-color: #28a745;
    }

    .option-label {
      font-weight: bold;
      color: #667eea;
      min-width: 25px;
    }

    .option.correct .option-label {
      color: #28a745;
    }

    .option-text {
      flex: 1;
      color: #555;
    }

    .correct-answer {
      background: #d4edda;
      padding: 15px;
      border-radius: 8px;
      margin-bottom: 20px;
      border-left: 4px solid #28a745;
    }

    .correct-answer strong {
      color: #155724;
    }

    .answer-highlight {
      font-size: 1.2em;
      font-weight: bold;
      color: #28a745;
      margin-left: 10px;
    }

    .solution-section {
      background: #fff3cd;
      padding: 20px;
      border-radius: 8px;
      border-left: 4px solid #ffc107;
    }

    .solution-section > strong {
      display: block;
      margin-bottom: 15px;
      color: #856404;
    }

    .solution-content {
      color: #555;
    }

    .warning {
      background: #f8d7da;
      color: #721c24;
      padding: 15px;
      border-radius: 8px;
      border-left: 4px solid #dc3545;
      margin-bottom: 20px;
    }

    .info {
      background: #d1ecf1;
      color: #0c5460;
      padding: 15px;
      border-radius: 8px;
      border-left: 4px solid #17a2b8;
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
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>${subject} Questions - LaTeX Corrections</h1>
    <div class="subtitle">Questions extracted for LaTeX issue correction</div>

    <div class="summary">
      <h2>📊 Summary</h2>
      <div class="stat-grid">
        <div class="stat-card">
          <div class="stat-number">${questions.length}</div>
          <div class="stat-label">Total Questions</div>
        </div>
        <div class="stat-card">
          <div class="stat-number">${questionsWithOptions}</div>
          <div class="stat-label">With Options</div>
        </div>
        <div class="stat-card">
          <div class="stat-number">${questionsWithoutOptions}</div>
          <div class="stat-label">Need Manual Fix</div>
        </div>
      </div>
    </div>

    <div class="questions-container">
      ${questions.map((q, i) => generateQuestionHTML(q, i)).join('\n')}
    </div>
  </div>
</body>
</html>`;
}

/**
 * Main execution
 */
function main() {
  console.log('🚀 Creating HTML files for LaTeX corrections...\n');

  // Load questions with solutions
  const mathQuestions = JSON.parse(fs.readFileSync('latex_issues_mathematics_with_solutions.json', 'utf8'));
  const physicsQuestions = JSON.parse(fs.readFileSync('latex_issues_physics_with_solutions.json', 'utf8'));

  console.log(`📚 Loaded questions:`);
  console.log(`   Mathematics: ${mathQuestions.length} questions`);
  console.log(`   Physics: ${physicsQuestions.length} questions\n`);

  // Generate HTML files
  console.log('📝 Generating HTML files...');

  const mathHTML = generateHTML(mathQuestions, 'Mathematics');
  fs.writeFileSync('latex_corrections_mathematics.html', mathHTML);
  console.log('   ✅ Created: latex_corrections_mathematics.html');

  const physicsHTML = generateHTML(physicsQuestions, 'Physics');
  fs.writeFileSync('latex_corrections_physics.html', physicsHTML);
  console.log('   ✅ Created: latex_corrections_physics.html');

  console.log('\n✨ HTML files created successfully!');
  console.log('\n📂 Files created:');
  console.log('   - latex_corrections_mathematics.html (43 questions)');
  console.log('   - latex_corrections_physics.html (8 questions)');
  console.log('\n💡 These files include:');
  console.log('   - LaTeX rendering via MathJax');
  console.log('   - All questions with corrected LaTeX delimiters');
  console.log('   - Answer choices clearly marked');
  console.log('   - Correct answers highlighted in green');
  console.log('   - Solutions (where available)');
  console.log('   - Print-friendly styling\n');
}

main();
