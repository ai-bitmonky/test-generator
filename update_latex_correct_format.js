/**
 * Update LaTeX questions in database with correct schema format
 */

require('dotenv').config({ path: '.env.local' });
const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

/**
 * Fix LaTeX delimiters
 */
function fixLatex(text) {
  if (!text) return text;
  return text.replace(/\\\$/g, '$').replace(/\\\(/g, '$').replace(/\\\)/g, '$');
}

/**
 * Convert extracted question to database format
 */
function convertToDBFormat(q) {
  return {
    external_id: q.external_id,
    subject: q.subject,
    chapter: q.chapter,
    topic: q.topic,
    subtopic: '',
    difficulty: q.difficulty,
    question_type: 'Multiple Choice Single Answer',
    question: fixLatex(q.question_text),
    question_html: fixLatex(q.question_html),
    options: {
      a: fixLatex(q.option_a),
      b: fixLatex(q.option_b),
      c: fixLatex(q.option_c),
      d: fixLatex(q.option_d)
    },
    correct_answer: q.correct_answer,
    solution_html: fixLatex(q.solution_html),
    solution_text: fixLatex(q.solution_text),
    tags: [],
    concepts: []
  };
}

/**
 * Update questions in database
 */
async function updateQuestions(questions, subject) {
  console.log(`\n${'='.repeat(70)}`);
  console.log(`📘 PROCESSING ${subject.toUpperCase()}`);
  console.log('='.repeat(70));

  const results = { inserted: 0, deleted: 0, failed: 0, skipped: 0, errors: [] };

  for (let i = 0; i < questions.length; i++) {
    const q = questions[i];
    console.log(`\n[${i + 1}/${questions.length}] ${q.external_id}`);

    // Skip if no options
    if (!q.option_a && !q.option_b && !q.option_c && !q.option_d) {
      console.log(`  ⏭️  Skipped: No options`);
      results.skipped++;
      continue;
    }

    try {
      // Convert to DB format
      const dbQuestion = convertToDBFormat(q);

      // Delete existing
      console.log(`  🔄 Removing old version...`);
      const { data: deleted } = await supabase
        .from('questions')
        .delete()
        .eq('external_id', q.external_id)
        .select();

      if (deleted && deleted.length > 0) {
        console.log(`  🗑️  Deleted ${deleted.length} old version(s)`);
        results.deleted += deleted.length;
      }

      // Insert corrected
      console.log(`  ➕ Inserting with corrected LaTeX...`);
      const { error } = await supabase
        .from('questions')
        .insert([dbQuestion]);

      if (error) {
        console.log(`  ❌ Error: ${error.message}`);
        results.failed++;
        results.errors.push({ id: q.external_id, error: error.message });
      } else {
        console.log(`  ✅ Inserted successfully`);
        results.inserted++;
      }

    } catch (err) {
      console.log(`  ❌ Exception: ${err.message}`);
      results.failed++;
      results.errors.push({ id: q.external_id, error: err.message });
    }
  }

  return results;
}

/**
 * Main
 */
async function main() {
  console.log('🚀 Updating LaTeX questions in database...\n');

  const mathQuestions = JSON.parse(fs.readFileSync('latex_issues_mathematics_with_solutions.json', 'utf8'));
  const physicsQuestions = JSON.parse(fs.readFileSync('latex_issues_physics_with_solutions.json', 'utf8'));

  console.log(`📚 Loaded:`);
  console.log(`   Mathematics: ${mathQuestions.length}`);
  console.log(`   Physics: ${physicsQuestions.length}`);

  const mathResults = await updateQuestions(mathQuestions, 'Mathematics');
  const physicsResults = await updateQuestions(physicsQuestions, 'Physics');

  console.log(`\n\n${'='.repeat(70)}`);
  console.log('📊 FINAL RESULTS');
  console.log('='.repeat(70));
  console.log(`\n📘 MATHEMATICS:`);
  console.log(`   ✅ Inserted: ${mathResults.inserted}`);
  console.log(`   🗑️  Deleted: ${mathResults.deleted}`);
  console.log(`   ⏭️  Skipped: ${mathResults.skipped}`);
  console.log(`   ❌ Failed: ${mathResults.failed}`);
  console.log(`\n📗 PHYSICS:`);
  console.log(`   ✅ Inserted: ${physicsResults.inserted}`);
  console.log(`   🗑️  Deleted: ${physicsResults.deleted}`);
  console.log(`   ⏭️  Skipped: ${physicsResults.skipped}`);
  console.log(`   ❌ Failed: ${physicsResults.failed}`);
  console.log(`\n📈 TOTALS:`);
  console.log(`   ✅ Inserted: ${mathResults.inserted + physicsResults.inserted}`);
  console.log(`   🗑️  Deleted: ${mathResults.deleted + physicsResults.deleted}`);
  console.log('='.repeat(70) + '\n');

  fs.writeFileSync('latex_update_final_report.json', JSON.stringify({ mathResults, physicsResults }, null, 2));
  console.log('✨ Complete! Report saved to latex_update_final_report.json\n');
}

main().catch(console.error);
