import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// HTML template for each batch
function generateHTML(questions, batchNumber, totalQuestions) {
  const startNum = (batchNumber - 1) * 50 + 1;
  const endNum = Math.min(batchNumber * 50, totalQuestions);

  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>JEE Advanced Physics Questions (${startNum}-${endNum})</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #2c3e50;
            background: #f5f7fa;
            padding: 20px;
        }

        .container {
            max-width: 1200px;
            margin: 0 auto;
            background: white;
            padding: 40px;
            border-radius: 12px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }

        .header {
            text-align: center;
            margin-bottom: 40px;
            padding-bottom: 20px;
            border-bottom: 3px solid #3498db;
        }

        .header h1 {
            color: #2c3e50;
            font-size: 2.5em;
            margin-bottom: 10px;
        }

        .header .subtitle {
            color: #7f8c8d;
            font-size: 1.2em;
        }

        .question-container {
            margin-bottom: 60px;
            padding: 30px;
            background: #ffffff;
            border-radius: 8px;
            border-left: 5px solid #3498db;
            box-shadow: 0 2px 5px rgba(0,0,0,0.05);
            page-break-inside: avoid;
        }

        .question-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 20px;
            padding-bottom: 15px;
            border-bottom: 2px solid #ecf0f1;
        }

        .question-number {
            font-size: 1.8em;
            font-weight: bold;
            color: #3498db;
        }

        .question-meta {
            display: flex;
            gap: 15px;
            flex-wrap: wrap;
        }

        .meta-badge {
            padding: 6px 12px;
            border-radius: 20px;
            font-size: 0.85em;
            font-weight: 600;
            background: #ecf0f1;
            color: #34495e;
        }

        .meta-badge.topic {
            background: #e8f4fd;
            color: #2980b9;
        }

        .meta-badge.difficulty {
            background: #fef5e7;
            color: #d68910;
        }

        .meta-badge.difficulty.easy {
            background: #d5f4e6;
            color: #27ae60;
        }

        .meta-badge.difficulty.hard {
            background: #fadbd8;
            color: #c0392b;
        }

        .question-text {
            font-size: 1.1em;
            line-height: 1.8;
            margin: 25px 0;
            color: #2c3e50;
        }

        .question-figure {
            margin: 20px 0;
            text-align: center;
        }

        .question-figure svg {
            max-width: 100%;
            height: auto;
        }

        .options-container {
            margin: 25px 0;
        }

        .option {
            padding: 15px 20px;
            margin: 12px 0;
            background: #f8f9fa;
            border: 2px solid #e9ecef;
            border-radius: 8px;
            transition: all 0.3s ease;
            display: flex;
            align-items: start;
        }

        .option-label {
            font-weight: bold;
            color: #3498db;
            margin-right: 12px;
            min-width: 30px;
        }

        .option.correct {
            background: #d5f4e6;
            border-color: #27ae60;
            font-weight: 600;
        }

        .option.correct::before {
            content: '✓ ';
            color: #27ae60;
            font-weight: bold;
            margin-right: 8px;
        }

        .correct-answer-box {
            margin: 25px 0;
            padding: 20px;
            background: #d5f4e6;
            border-left: 5px solid #27ae60;
            border-radius: 6px;
        }

        .correct-answer-box h3 {
            color: #27ae60;
            margin-bottom: 10px;
            font-size: 1.2em;
        }

        .solution-section {
            margin-top: 30px;
            padding: 25px;
            background: #fff9e6;
            border-left: 5px solid #ffc107;
            border-radius: 6px;
        }

        .solution-section h3 {
            color: #f39c12;
            margin-bottom: 15px;
            font-size: 1.3em;
            display: flex;
            align-items: center;
        }

        .solution-section h3::before {
            content: '💡';
            margin-right: 10px;
        }

        .solution-content {
            line-height: 1.8;
            color: #2c3e50;
        }

        .strategy-section {
            margin-top: 25px;
            padding: 20px;
            background: #e8f4fd;
            border-left: 5px solid #3498db;
            border-radius: 6px;
        }

        .strategy-section h3 {
            color: #2980b9;
            margin-bottom: 12px;
            font-size: 1.2em;
            display: flex;
            align-items: center;
        }

        .strategy-section h3::before {
            content: '🎯';
            margin-right: 10px;
        }

        .expert-insight-section {
            margin-top: 25px;
            padding: 20px;
            background: #f4e8fd;
            border-left: 5px solid #9b59b6;
            border-radius: 6px;
        }

        .expert-insight-section h3 {
            color: #8e44ad;
            margin-bottom: 12px;
            font-size: 1.2em;
            display: flex;
            align-items: center;
        }

        .expert-insight-section h3::before {
            content: '🎓';
            margin-right: 10px;
        }

        .key-facts-section {
            margin-top: 25px;
            padding: 20px;
            background: #fef5e7;
            border-left: 5px solid #e67e22;
            border-radius: 6px;
        }

        .key-facts-section h3 {
            color: #d68910;
            margin-bottom: 12px;
            font-size: 1.2em;
            display: flex;
            align-items: center;
        }

        .key-facts-section h3::before {
            content: '📌';
            margin-right: 10px;
        }

        .footer {
            margin-top: 60px;
            padding-top: 20px;
            border-top: 2px solid #ecf0f1;
            text-align: center;
            color: #7f8c8d;
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

            .question-container {
                page-break-inside: avoid;
                margin-bottom: 40px;
            }
        }

        /* Math rendering support */
        .math-inline {
            display: inline-block;
            margin: 0 2px;
        }

        .math-block {
            display: block;
            margin: 15px 0;
            text-align: center;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>JEE Advanced Physics Questions</h1>
            <div class="subtitle">Questions ${startNum} - ${endNum} of ${totalQuestions}</div>
            <div class="subtitle" style="margin-top: 10px; font-size: 0.9em;">Complete Solutions & Expert Insights</div>
        </div>

        ${questions.map((q, idx) => generateQuestionHTML(q, startNum + idx)).join('\n')}

        <div class="footer">
            <p>Generated: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
            <p style="margin-top: 10px;">JEE Advanced Physics Question Bank</p>
        </div>
    </div>
</body>
</html>`;
}

function generateQuestionHTML(question, questionNumber) {
  const difficultyClass = question.difficulty ? question.difficulty.toLowerCase() : 'medium';

  // Parse options
  let optionsHTML = '';
  if (question.options) {
    try {
      const options = typeof question.options === 'string' ? JSON.parse(question.options) : question.options;

      // Handle both array format and object format {a, b, c, d}
      if (Array.isArray(options)) {
        optionsHTML = options.map((opt, idx) => {
          const optionLabel = String.fromCharCode(65 + idx); // A, B, C, D
          const isCorrect = question.correct_answer &&
            (question.correct_answer === optionLabel ||
             question.correct_answer === opt ||
             (Array.isArray(question.correct_answer) && question.correct_answer.includes(optionLabel)));

          return `
            <div class="option ${isCorrect ? 'correct' : ''}">
              <span class="option-label">${optionLabel}.</span>
              <div>${opt}</div>
            </div>
          `;
        }).join('');
      } else if (typeof options === 'object') {
        // Handle object format like {a: "...", b: "...", c: "...", d: "..."}
        const optionKeys = ['a', 'b', 'c', 'd'];
        optionsHTML = optionKeys
          .filter(key => options[key])
          .map((key) => {
            const optionLabel = key.toUpperCase();
            const optionText = options[key];
            const isCorrect = question.correct_answer &&
              (question.correct_answer.toLowerCase() === key ||
               question.correct_answer.toUpperCase() === optionLabel ||
               question.correct_answer === optionText ||
               (Array.isArray(question.correct_answer) &&
                (question.correct_answer.includes(optionLabel) || question.correct_answer.includes(key))));

            return `
            <div class="option ${isCorrect ? 'correct' : ''}">
              <span class="option-label">${optionLabel}.</span>
              <div>${optionText}</div>
            </div>
          `;
          }).join('');
      }
    } catch (e) {
      console.error(`Error parsing options for question ${question.id}:`, e);
    }
  }

  // Correct answer display
  let correctAnswerHTML = '';
  if (question.correct_answer) {
    const answer = Array.isArray(question.correct_answer)
      ? question.correct_answer.join(', ')
      : question.correct_answer;
    correctAnswerHTML = `
      <div class="correct-answer-box">
        <h3>Correct Answer</h3>
        <div style="font-size: 1.2em; font-weight: bold;">${answer}</div>
      </div>
    `;
  }

  return `
    <div class="question-container">
      <div class="question-header">
        <div class="question-number">Question ${questionNumber}</div>
        <div class="question-meta">
          ${question.topic ? `<span class="meta-badge topic">${question.topic}</span>` : ''}
          ${question.sub_topic ? `<span class="meta-badge">${question.sub_topic}</span>` : ''}
          ${question.difficulty ? `<span class="meta-badge difficulty ${difficultyClass}">${question.difficulty}</span>` : ''}
          ${question.question_type ? `<span class="meta-badge">${question.question_type}</span>` : ''}
        </div>
      </div>

      <div class="question-text">
        ${question.question_html || 'Question text not available'}
      </div>

      ${question.figure_svg ? `
        <div class="question-figure">
          ${question.figure_svg}
        </div>
      ` : ''}

      ${optionsHTML ? `
        <div class="options-container">
          ${optionsHTML}
        </div>
      ` : ''}

      ${correctAnswerHTML}

      ${question.solution_html ? `
        <div class="solution-section">
          <h3>Solution</h3>
          <div class="solution-content">
            ${question.solution_html}
          </div>
        </div>
      ` : ''}

      ${question.strategy ? `
        <div class="strategy-section">
          <h3>Strategy</h3>
          <div>${question.strategy}</div>
        </div>
      ` : ''}

      ${question.expert_insight ? `
        <div class="expert-insight-section">
          <h3>Expert Insight</h3>
          <div>${question.expert_insight}</div>
        </div>
      ` : ''}

      ${question.key_facts ? `
        <div class="key-facts-section">
          <h3>Key Facts</h3>
          <div>${question.key_facts}</div>
        </div>
      ` : ''}
    </div>
  `;
}

async function exportPhysicsQuestions() {
  try {
    console.log('🚀 Starting Physics questions export...\n');

    // Fetch all Physics questions
    const { data: questions, error } = await supabase
      .from('questions')
      .select('*')
      .eq('subject', 'Physics')
      .order('topic', { ascending: true })
      .order('id', { ascending: true });

    if (error) {
      console.error('❌ Error fetching questions:', error);
      process.exit(1);
    }

    if (!questions || questions.length === 0) {
      console.log('⚠️  No Physics questions found');
      process.exit(0);
    }

    console.log(`📊 Found ${questions.length} Physics questions\n`);

    // Create output directory
    const outputDir = path.join(process.cwd(), 'physics_exports');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Split into batches of 50
    const batchSize = 50;
    const totalBatches = Math.ceil(questions.length / batchSize);

    console.log(`📦 Creating ${totalBatches} HTML files (${batchSize} questions each)...\n`);

    for (let i = 0; i < totalBatches; i++) {
      const start = i * batchSize;
      const end = Math.min(start + batchSize, questions.length);
      const batch = questions.slice(start, end);
      const batchNumber = i + 1;

      const html = generateHTML(batch, batchNumber, questions.length);
      const filename = `physics_questions_${String(batchNumber).padStart(2, '0')}_of_${String(totalBatches).padStart(2, '0')}.html`;
      const filepath = path.join(outputDir, filename);

      fs.writeFileSync(filepath, html, 'utf-8');

      console.log(`✅ Batch ${batchNumber}/${totalBatches}: ${filename}`);
      console.log(`   Questions ${start + 1}-${end}`);
      console.log(`   Topics: ${[...new Set(batch.map(q => q.topic))].join(', ')}`);
      console.log('');
    }

    console.log('\n✨ Export complete!');
    console.log(`📁 Files saved to: ${outputDir}`);
    console.log(`📊 Total: ${questions.length} questions in ${totalBatches} files`);

    // Generate summary
    const summary = {
      total_questions: questions.length,
      total_files: totalBatches,
      questions_per_file: batchSize,
      topics: [...new Set(questions.map(q => q.topic))].filter(Boolean),
      difficulties: questions.reduce((acc, q) => {
        acc[q.difficulty || 'Unknown'] = (acc[q.difficulty || 'Unknown'] || 0) + 1;
        return acc;
      }, {}),
      export_date: new Date().toISOString(),
    };

    fs.writeFileSync(
      path.join(outputDir, 'export_summary.json'),
      JSON.stringify(summary, null, 2)
    );

    console.log('\n📋 Summary:');
    console.log(`   Topics covered: ${summary.topics.join(', ')}`);
    console.log(`   Difficulty distribution:`);
    Object.entries(summary.difficulties).forEach(([diff, count]) => {
      console.log(`      ${diff}: ${count} questions`);
    });

  } catch (error) {
    console.error('❌ Export failed:', error);
    process.exit(1);
  }
}

// Run export
exportPhysicsQuestions();
