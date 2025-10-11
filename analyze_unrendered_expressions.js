#!/usr/bin/env node
/**
 * Identify questions with unrendered LaTeX/HTML expressions
 * Patterns to detect:
 * 1. LaTeX expressions: $...$ or $$...$$
 * 2. LaTeX commands: \frac, \int, \sum, etc.
 * 3. HTML entities: &lt;, &gt;, &amp;, etc.
 * 4. Raw HTML tags in plain text
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

// Helper function to check for unrendered LaTeX
function hasUnrenderedLatex(text) {
  if (!text) return false;

  const patterns = [
    /\$[^$]+\$/g,           // Inline LaTeX: $...$
    /\$\$[^$]+\$\$/g,       // Display LaTeX: $$...$$
    /\\frac\{/g,            // Fraction command
    /\\int[_^]?/g,          // Integral
    /\\sum[_^]?/g,          // Summation
    /\\prod[_^]?/g,         // Product
    /\\lim[_^]?/g,          // Limit
    /\\sqrt\{/g,            // Square root
    /\\alpha|\\beta|\\gamma|\\delta|\\theta|\\pi|\\sigma/g, // Greek letters
    /\\log|\\ln|\\sin|\\cos|\\tan/g,  // Functions
    /\\to|\\rightarrow|\\leftarrow/g, // Arrows
    /\\geq|\\leq|\\neq|\\approx/g,    // Relations
    /\\cdot|\\times|\\div/g,           // Operators
    /\^{[^}]+}|_{[^}]+}/g,             // Superscript/subscript with braces
  ];

  return patterns.some(pattern => pattern.test(text));
}

// Helper function to check for HTML entities
function hasHtmlEntities(text) {
  if (!text) return false;

  const patterns = [
    /&lt;/g,
    /&gt;/g,
    /&amp;/g,
    /&quot;/g,
    /&apos;/g,
    /&#\d+;/g,
    /&[a-z]+;/g,
  ];

  return patterns.some(pattern => pattern.test(text));
}

// Helper function to check for raw HTML tags in plain text
function hasRawHtmlTags(text) {
  if (!text) return false;

  // Check if text has HTML tags that might not be rendered
  const htmlTagPattern = /<[^>]+>/g;
  const tags = text.match(htmlTagPattern) || [];

  // Filter out common rendered tags (these are OK)
  const renderedTags = ['<br>', '<br/>', '<br />', '<div', '<span', '<p', '<img'];
  const unrenderedTags = tags.filter(tag => {
    const lowerTag = tag.toLowerCase();
    return !renderedTags.some(rt => lowerTag.startsWith(rt));
  });

  return unrenderedTags.length > 0;
}

// Get all text content from a question
function getAllTextContent(question) {
  const fields = [
    question.question,
    question.question_text,
    question.question_html,
    question.solution,
    question.solution_text,
    question.solution_html,
  ];

  // Also check options
  if (question.options && typeof question.options === 'object') {
    fields.push(...Object.values(question.options));
  }

  return fields.filter(f => f).join(' ');
}

async function analyzeQuestions() {
  console.log('🔍 Analyzing database for unrendered expressions...\n');

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

  const unrenderedQuestions = {
    Mathematics: [],
    Physics: []
  };

  // Analyze each question
  for (const q of allQuestions) {
    const subject = q.subject || 'Unknown';

    // Skip if not Math or Physics
    if (subject !== 'Mathematics' && subject !== 'Physics') continue;

    const allText = getAllTextContent(q);

    const hasLatex = hasUnrenderedLatex(allText);
    const hasEntities = hasHtmlEntities(allText);
    const hasRawTags = hasRawHtmlTags(allText);

    if (hasLatex || hasEntities || hasRawTags) {
      unrenderedQuestions[subject].push({
        question: q,
        issues: {
          latex: hasLatex,
          htmlEntities: hasEntities,
          rawTags: hasRawTags
        }
      });
    }
  }

  // Print summary
  console.log('📊 ANALYSIS SUMMARY\n');
  console.log('='.repeat(70));

  for (const subject of ['Mathematics', 'Physics']) {
    const questions = unrenderedQuestions[subject];
    const latexCount = questions.filter(q => q.issues.latex).length;
    const entitiesCount = questions.filter(q => q.issues.htmlEntities).length;
    const tagsCount = questions.filter(q => q.issues.rawTags).length;

    console.log(`\n${subject}:`);
    console.log(`  • With unrendered LaTeX: ${latexCount}`);
    console.log(`  • With HTML entities: ${entitiesCount}`);
    console.log(`  • With raw HTML tags: ${tagsCount}`);
    console.log(`  Total with issues: ${questions.length}`);
  }
  console.log('\n' + '='.repeat(70));

  // Save to JSON
  const outputFile = 'unrendered_expressions_analysis.json';
  fs.writeFileSync(outputFile, JSON.stringify(unrenderedQuestions, null, 2));
  console.log(`\n💾 Saved analysis to: ${outputFile}`);

  return unrenderedQuestions;
}

async function generateHTMLReports(unrenderedQuestions) {
  console.log('\n📄 Generating HTML reports...\n');

  for (const subject of ['Mathematics', 'Physics']) {
    const questions = unrenderedQuestions[subject];

    const latexQuestions = questions.filter(q => q.issues.latex);
    const entitiesQuestions = questions.filter(q => q.issues.htmlEntities);
    const tagsQuestions = questions.filter(q => q.issues.rawTags);

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Unrendered Expressions - ${subject}</title>
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
      max-width: 1400px;
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

    .issue-tag {
      background: #fff3cd;
      color: #856404;
      padding: 5px 12px;
      border-radius: 15px;
      font-size: 0.85em;
      font-weight: 600;
    }

    .content-box {
      background: #f8f9fa;
      padding: 20px;
      border-radius: 8px;
      margin: 15px 0;
      border-left: 4px solid #667eea;
      position: relative;
    }

    .content-box h4 {
      color: #333;
      margin-bottom: 10px;
    }

    .raw-text {
      background: white;
      padding: 15px;
      border-radius: 5px;
      border: 1px solid #e0e0e0;
      font-family: 'Courier New', monospace;
      font-size: 0.9em;
      white-space: pre-wrap;
      word-break: break-word;
      max-height: 300px;
      overflow-y: auto;
    }

    .highlight-latex {
      background: #fff3cd;
      padding: 2px 4px;
      border-radius: 3px;
      font-weight: bold;
      color: #856404;
    }

    .highlight-entity {
      background: #f8d7da;
      padding: 2px 4px;
      border-radius: 3px;
      font-weight: bold;
      color: #721c24;
    }

    .options-section {
      margin: 15px 0;
    }

    .option {
      background: #f0f7ff;
      padding: 10px 15px;
      margin: 8px 0;
      border-radius: 5px;
      border-left: 3px solid #667eea;
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

    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 2px solid #e0e0e0;
      text-align: center;
      color: #666;
      font-size: 0.9em;
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
  <script>
    function highlightExpressions(text) {
      if (!text) return '';

      // Highlight LaTeX expressions
      text = text.replace(/\\\$([^$]+)\\\$/g, '<span class="highlight-latex">$$1$</span>');
      text = text.replace(/\\\$\\\$([^$]+)\\\$\\\$/g, '<span class="highlight-latex">\\$\\$$1\\$\\$</span>');
      text = text.replace(/(\\\\frac|\\\\int|\\\\sum|\\\\prod|\\\\lim|\\\\sqrt|\\\\alpha|\\\\beta|\\\\gamma|\\\\delta|\\\\theta|\\\\pi|\\\\sigma)/g,
                         '<span class="highlight-latex">$1</span>');

      // Highlight HTML entities
      text = text.replace(/(&lt;|&gt;|&amp;|&quot;|&apos;|&#\\d+;)/g, '<span class="highlight-entity">$1</span>');

      return text;
    }
  </script>
</head>
<body>
  <div class="container">
    <h1>🔍 Unrendered Expressions - ${subject}</h1>
    <div class="subtitle">Questions with LaTeX, HTML Entities, or Raw HTML</div>

    <div class="summary">
      <h2>📊 Summary Statistics</h2>
      <div class="stat-grid">
        <div class="stat-card">
          <div class="stat-number">${questions.length}</div>
          <div class="stat-label">Total Questions</div>
        </div>
        <div class="stat-card">
          <div class="stat-number">${latexQuestions.length}</div>
          <div class="stat-label">With LaTeX</div>
        </div>
        <div class="stat-card">
          <div class="stat-number">${entitiesQuestions.length}</div>
          <div class="stat-label">With HTML Entities</div>
        </div>
        <div class="stat-card">
          <div class="stat-number">${tagsQuestions.length}</div>
          <div class="stat-label">With Raw Tags</div>
        </div>
      </div>
    </div>

    <!-- ALL QUESTIONS -->
    ${questions.length > 0 ? `
    <div class="section">
      <div class="section-header">
        <span class="section-title">📝 All Questions with Unrendered Content</span>
        <span class="count-badge">${questions.length} questions</span>
      </div>
      ${questions.map((item, idx) => {
        const q = item.question;
        const issues = item.issues;

        return `
        <div class="question-card">
          <div class="question-meta">
            <span class="meta-tag">ID: ${q.external_id || q.id}</span>
            <span class="meta-tag">Topic: ${q.topic || 'Unknown'}</span>
            <span class="meta-tag">Chapter: ${q.chapter || 'Unknown'}</span>
            ${issues.latex ? '<span class="issue-tag">LaTeX</span>' : ''}
            ${issues.htmlEntities ? '<span class="issue-tag">HTML Entities</span>' : ''}
            ${issues.rawTags ? '<span class="issue-tag">Raw HTML</span>' : ''}
          </div>

          <div class="content-box">
            <h4>Question ${idx + 1}:</h4>
            <div class="raw-text">${(q.question || q.question_text || 'No question text')
              .replace(/</g, '&lt;')
              .replace(/>/g, '&gt;')
              .replace(/\$/g, '\\$')}</div>
          </div>

          ${q.options && typeof q.options === 'object' && Object.keys(q.options).length > 0 ? `
          <div class="options-section">
            <h4>Options:</h4>
            ${Object.entries(q.options).map(([key, value]) => `
              <div class="option">
                <strong>${key.toUpperCase()}.</strong>
                <div class="raw-text" style="margin-top: 5px;">${String(value)
                  .replace(/</g, '&lt;')
                  .replace(/>/g, '&gt;')
                  .replace(/\$/g, '\\$')}</div>
              </div>
            `).join('')}
          </div>
          ` : ''}

          ${q.correct_answer ? `
          <div style="margin: 15px 0;">
            <strong>Correct Answer:</strong> <span class="correct-answer">${q.correct_answer.toUpperCase()}</span>
          </div>
          ` : ''}

          ${q.solution_html || q.solution_text || q.solution ? `
          <div class="content-box">
            <h4>💡 Solution (with unrendered expressions):</h4>
            <div class="raw-text">${(q.solution_html || q.solution_text || q.solution)
              .replace(/</g, '&lt;')
              .replace(/>/g, '&gt;')
              .replace(/\$/g, '\\$')}</div>
          </div>
          ` : ''}
        </div>
      `}).join('')}
    </div>
    ` : `
    <div class="section">
      <div style="background: #d4edda; border: 2px solid #28a745; color: #155724; padding: 20px; border-radius: 8px; text-align: center;">
        <h2>✅ No Unrendered Expressions Found!</h2>
        <p>All ${subject} questions are properly rendered.</p>
      </div>
    </div>
    `}

    <div class="footer">
      <p><strong>Generated:</strong> ${new Date().toLocaleString()}</p>
      <p><strong>Subject:</strong> ${subject} | <strong>Total Questions:</strong> ${questions.length}</p>
    </div>
  </div>
</body>
</html>`;

    const filename = `unrendered_${subject.toLowerCase()}_questions.html`;
    fs.writeFileSync(filename, html);
    console.log(`✅ Generated: ${filename}`);
  }
}

// Main execution
analyzeQuestions()
  .then(unrenderedQuestions => generateHTMLReports(unrenderedQuestions))
  .then(() => {
    console.log('\n✨ Analysis complete!');
    console.log('\n📂 Generated Files:');
    console.log('  • unrendered_expressions_analysis.json');
    console.log('  • unrendered_mathematics_questions.html');
    console.log('  • unrendered_physics_questions.html');
  })
  .catch(error => {
    console.error('❌ Error:', error);
    process.exit(1);
  });
