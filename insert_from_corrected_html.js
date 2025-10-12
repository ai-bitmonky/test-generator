/**
 * Extract questions from corrected HTML files and insert into database
 */

require('dotenv').config({ path: '.env.local' });
const fs = require('fs');
const { JSDOM } = require('jsdom');
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

/**
 * Extract questions from corrected HTML file
 */
function extractQuestionsFromHTML(htmlFile) {
  console.log(`\n📄 Reading ${htmlFile}...`);

  const html = fs.readFileSync(htmlFile, 'utf8');
  const dom = new JSDOM(html);
  const document = dom.window.document;

  const questionCards = document.querySelectorAll('.question-card');
  console.log(`   Found ${questionCards.length} question cards`);

  const questions = [];

  questionCards.forEach((card, index) => {
    try {
      // Extract metadata
      const metaTags = card.querySelectorAll('.meta-tag');
      let externalId = '';
      let topic = '';
      let chapter = '';
      let difficulty = 'MEDIUM';

      metaTags.forEach(tag => {
        const text = tag.textContent.trim();
        if (text.startsWith('ID:')) {
          externalId = text.replace('ID:', '').trim();
        } else if (text.startsWith('Topic:')) {
          topic = text.replace('Topic:', '').trim();
        } else if (text.startsWith('Chapter:')) {
          chapter = text.replace('Chapter:', '').trim();
        } else if (text.startsWith('Difficulty:')) {
          difficulty = text.replace('Difficulty:', '').trim().toUpperCase();
        }
      });

      if (!externalId) {
        console.log(`  ⚠️  Skipping question ${index + 1}: No external ID`);
        return;
      }

      // Extract question text
      const questionTextDiv = card.querySelector('.question-text p');
      const questionText = questionTextDiv ? questionTextDiv.textContent.trim() : '';

      // Extract options
      const options = { a: '', b: '', c: '', d: '' };
      const optionElements = card.querySelectorAll('.option');

      optionElements.forEach(opt => {
        const label = opt.querySelector('.option-label');
        const text = opt.querySelector('.option-text');

        if (label && text) {
          const letter = label.textContent.trim().replace(/[.:]/g, '').toLowerCase();
          if (['a', 'b', 'c', 'd'].includes(letter)) {
            options[letter] = text.textContent.trim();
          }
        }
      });

      // Extract correct answer
      const answerSpan = card.querySelector('.answer-highlight');
      const correctAnswer = answerSpan ? answerSpan.textContent.trim().toLowerCase() : null;

      // Extract solution
      const solutionDiv = card.querySelector('.solution-content');
      const solutionHtml = solutionDiv ? solutionDiv.innerHTML.trim() : '';
      const solutionText = solutionDiv ? solutionDiv.textContent.trim() : '';

      // Determine subject from chapter
      let subject = 'Physics';
      if (chapter.includes('Mathematics') || chapter.includes('Calculus') || chapter.includes('Algebra')) {
        subject = 'Mathematics';
      }

      // Skip if no options
      if (!options.a && !options.b && !options.c && !options.d) {
        console.log(`  ⏭️  Skipping ${externalId}: No options`);
        return;
      }

      // Skip if no correct answer
      if (!correctAnswer) {
        console.log(`  ⏭️  Skipping ${externalId}: No correct answer`);
        return;
      }

      const question = {
        external_id: externalId,
        subject: subject,
        chapter: chapter,
        topic: topic,
        subtopic: '',
        difficulty: difficulty,
        question_type: 'Multiple Choice Single Answer',
        question: questionText,
        question_html: `<p>${questionText}</p>`,
        options: options,
        correct_answer: correctAnswer,
        solution_html: solutionHtml,
        solution_text: solutionText,
        tags: [],
        concepts: []
      };

      questions.push(question);

    } catch (error) {
      console.error(`  ❌ Error parsing question ${index + 1}:`, error.message);
    }
  });

  console.log(`   ✅ Extracted ${questions.length} valid questions\n`);
  return questions;
}

/**
 * Delete and insert questions
 */
async function updateQuestionsInDB(questions, subject) {
  console.log(`\n${'='.repeat(70)}`);
  console.log(`📘 UPDATING ${subject.toUpperCase()} QUESTIONS IN DATABASE`);
  console.log('='.repeat(70));

  const results = {
    inserted: 0,
    deleted: 0,
    failed: 0,
    errors: []
  };

  for (let i = 0; i < questions.length; i++) {
    const q = questions[i];
    console.log(`\n[${i + 1}/${questions.length}] ${q.external_id}`);

    try {
      // Delete existing
      console.log(`  🔄 Removing old version...`);
      const { data: deleted, error: deleteError } = await supabase
        .from('questions')
        .delete()
        .eq('external_id', q.external_id)
        .select();

      if (deleteError) {
        console.log(`  ⚠️  Delete warning: ${deleteError.message}`);
      } else if (deleted && deleted.length > 0) {
        console.log(`  🗑️  Deleted ${deleted.length} old version(s)`);
        results.deleted += deleted.length;
      } else {
        console.log(`  ℹ️  No existing version found (new question)`);
      }

      // Insert corrected version
      console.log(`  ➕ Inserting corrected version...`);
      const { error: insertError } = await supabase
        .from('questions')
        .insert([q]);

      if (insertError) {
        console.log(`  ❌ Error: ${insertError.message}`);
        results.failed++;
        results.errors.push({
          id: q.external_id,
          error: insertError.message
        });
      } else {
        console.log(`  ✅ Inserted successfully`);
        results.inserted++;
      }

    } catch (err) {
      console.log(`  ❌ Exception: ${err.message}`);
      results.failed++;
      results.errors.push({
        id: q.external_id,
        error: err.message
      });
    }
  }

  return results;
}

/**
 * Main execution
 */
async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log('Usage: node insert_from_corrected_html.js <html-file-path>');
    console.log('Example: node insert_from_corrected_html.js latex_corrections_physics.html');
    process.exit(1);
  }

  const htmlFile = args[0];

  if (!fs.existsSync(htmlFile)) {
    console.log(`❌ Error: File not found: ${htmlFile}`);
    process.exit(1);
  }

  console.log('🚀 Starting insertion from corrected HTML file...\n');

  // Extract questions
  const questions = extractQuestionsFromHTML(htmlFile);

  if (questions.length === 0) {
    console.log('❌ No valid questions found in HTML file');
    process.exit(1);
  }

  // Determine subject from first question
  const subject = questions[0].subject;

  // Update database
  const results = await updateQuestionsInDB(questions, subject);

  // Final report
  console.log(`\n\n${'='.repeat(70)}`);
  console.log('📊 FINAL RESULTS');
  console.log('='.repeat(70));
  console.log(`\n📘 ${subject.toUpperCase()}:`);
  console.log(`   ✅ Inserted: ${results.inserted}`);
  console.log(`   🗑️  Deleted: ${results.deleted}`);
  console.log(`   ❌ Failed: ${results.failed}`);
  console.log('='.repeat(70) + '\n');

  // Save report
  const reportFile = `insertion_report_${subject.toLowerCase()}_${Date.now()}.json`;
  fs.writeFileSync(reportFile, JSON.stringify(results, null, 2));
  console.log(`💾 Detailed report saved to: ${reportFile}\n`);

  if (results.failed > 0) {
    console.log('⚠️  Some questions failed. Check the report for details.\n');
  } else {
    console.log('✨ All questions inserted successfully!\n');
  }
}

main().catch(console.error);
