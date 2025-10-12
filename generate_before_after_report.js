const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function generateReport() {
  // Fetch first 10 Mathematics questions
  const { data: questions, error } = await supabase
    .from('questions')
    .select('*')
    .eq('subject', 'Mathematics')
    .limit(10);

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log(`\n📊 Fetched ${questions.length} questions\n`);

  // Generate HTML report
  let html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>AI Pipeline - Before/After Report</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }
    .header { background: #2c3e50; color: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
    .question-card { background: white; margin: 20px 0; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
    .question-id { font-size: 20px; font-weight: bold; color: #2c3e50; margin-bottom: 15px; }
    .section { margin: 15px 0; padding: 15px; border-left: 4px solid #3498db; background: #ecf0f1; }
    .section-title { font-weight: bold; color: #2980b9; margin-bottom: 8px; }
    .options { margin: 10px 0; }
    .option { padding: 8px; margin: 5px 0; background: #fff; border-radius: 4px; }
    .correct { background: #d5f4e6; border-left: 3px solid #27ae60; }
    .metadata { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin: 15px 0; }
    .meta-item { background: #34495e; color: white; padding: 10px; border-radius: 4px; text-align: center; }
    .meta-label { font-size: 12px; opacity: 0.8; }
    .meta-value { font-size: 16px; font-weight: bold; margin-top: 5px; }
    .ai-content { background: #e8f5e9; border-left: 4px solid #4caf50; padding: 15px; margin: 10px 0; border-radius: 4px; }
    .missing { background: #ffebee; border-left: 4px solid #f44336; }
    .content-preview { white-space: pre-wrap; margin-top: 8px; font-size: 14px; line-height: 1.6; }
    .status-badge { display: inline-block; padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: bold; }
    .badge-success { background: #4caf50; color: white; }
    .badge-error { background: #f44336; color: white; }
  </style>
</head>
<body>
  <div class="header">
    <h1>🤖 AI-Enhanced Pipeline Report</h1>
    <p>Subject: Mathematics | Questions Processed: ${questions.length}</p>
    <p>Generated: ${new Date().toLocaleString()}</p>
  </div>
`;

  questions.forEach((q, index) => {
    const hasStrategy = q.strategy && q.strategy !== '[Not Set]';
    const hasInsight = q.expert_insight && q.expert_insight !== '[Not Set]';
    const hasFacts = q.key_facts && q.key_facts !== '[Not Set]';

    html += `
  <div class="question-card">
    <div class="question-id">📝 Question ${index + 1}: ${q.id}</div>

    <div class="section">
      <div class="section-title">Question Text</div>
      <div>${q.question ? q.question.substring(0, 300) : '[Missing]'}${q.question && q.question.length > 300 ? '...' : ''}</div>
    </div>

    <div class="metadata">
      <div class="meta-item">
        <div class="meta-label">Difficulty</div>
        <div class="meta-value">${q.difficulty || '[Not Set]'}</div>
      </div>
      <div class="meta-item">
        <div class="meta-label">Question Type</div>
        <div class="meta-value">${q.question_type || '[Not Set]'}</div>
      </div>
      <div class="meta-item">
        <div class="meta-label">Correct Answer</div>
        <div class="meta-value">${q.correct_answer ? q.correct_answer.toUpperCase() : '[Not Set]'}</div>
      </div>
    </div>

    <div class="section">
      <div class="section-title">Options</div>
      <div class="options">
`;

    if (q.options && typeof q.options === 'object') {
      ['a', 'b', 'c', 'd'].forEach(letter => {
        const isCorrect = q.correct_answer === letter;
        html += `        <div class="option ${isCorrect ? 'correct' : ''}">
          <strong>${letter.toUpperCase()}:</strong> ${q.options[letter] || '[Missing]'}
        </div>\n`;
      });
    } else {
      html += `        <div style="color: red;">❌ No options object found</div>\n`;
    }

    html += `
      </div>
    </div>

    <div class="ai-content ${hasStrategy ? '' : 'missing'}">
      <div class="section-title">
        📚 Strategy (Universal Approach)
        <span class="status-badge ${hasStrategy ? 'badge-success' : 'badge-error'}">
          ${hasStrategy ? 'AI Generated' : 'Not Generated'}
        </span>
      </div>
      ${hasStrategy ? `<div class="content-preview">${q.strategy}</div>` : '<div style="color: #d32f2f;">⚠️ Missing - AI generation failed or not run</div>'}
    </div>

    <div class="ai-content ${hasInsight ? '' : 'missing'}">
      <div class="section-title">
        💡 Expert Insight (Topper's Approach)
        <span class="status-badge ${hasInsight ? 'badge-success' : 'badge-error'}">
          ${hasInsight ? 'AI Generated' : 'Not Generated'}
        </span>
      </div>
      ${hasInsight ? `<div class="content-preview">${q.expert_insight}</div>` : '<div style="color: #d32f2f;">⚠️ Missing - AI generation failed or not run</div>'}
    </div>

    <div class="ai-content ${hasFacts ? '' : 'missing'}">
      <div class="section-title">
        📐 Key Facts (Formulas/Laws/Theorems)
        <span class="status-badge ${hasFacts ? 'badge-success' : 'badge-error'}">
          ${hasFacts ? 'AI Generated' : 'Not Generated'}
        </span>
      </div>
      ${hasFacts ? `<div class="content-preview">${q.key_facts}</div>` : '<div style="color: #d32f2f;">⚠️ Missing - AI generation failed or not run</div>'}
    </div>

  </div>
`;
  });

  html += `
</body>
</html>
`;

  const filename = `AI_PIPELINE_REPORT_${Date.now()}.html`;
  fs.writeFileSync(filename, html);
  console.log(`\n✅ Report generated: ${filename}\n`);
  console.log(`📊 Summary:`);

  let withStrategy = 0, withInsight = 0, withFacts = 0;
  questions.forEach(q => {
    if (q.strategy && q.strategy !== '[Not Set]') withStrategy++;
    if (q.expert_insight && q.expert_insight !== '[Not Set]') withInsight++;
    if (q.key_facts && q.key_facts !== '[Not Set]') withFacts++;
  });

  console.log(`   Strategy Generated: ${withStrategy}/${questions.length}`);
  console.log(`   Expert Insight Generated: ${withInsight}/${questions.length}`);
  console.log(`   Key Facts Generated: ${withFacts}/${questions.length}`);
  console.log();
}

generateReport();
