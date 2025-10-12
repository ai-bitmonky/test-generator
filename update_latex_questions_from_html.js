/**
 * Remove LaTeX questions from database and reinsert with corrected data from HTML files
 */

require('dotenv').config({ path: '.env.local' });
const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

/**
 * Fix LaTeX delimiters in text
 */
function fixLatexDelimiters(text) {
  if (!text) return text;
  // Convert \$ to $ and \( \) to $ $
  return text.replace(/\\\$/g, '$').replace(/\\\(/g, '$').replace(/\\\)/g, '$');
}

/**
 * Process a single question - fix LaTeX and prepare for insertion
 */
function prepareQuestion(question) {
  const fixed = { ...question };

  // Fix LaTeX in all text fields
  fixed.question_text = fixLatexDelimiters(question.question_text);
  fixed.question_html = fixLatexDelimiters(question.question_html);
  fixed.option_a = fixLatexDelimiters(question.option_a);
  fixed.option_b = fixLatexDelimiters(question.option_b);
  fixed.option_c = fixLatexDelimiters(question.option_c);
  fixed.option_d = fixLatexDelimiters(question.option_d);
  fixed.solution_text = fixLatexDelimiters(question.solution_text);
  fixed.solution_html = fixLatexDelimiters(question.solution_html);

  // Ensure fields are within database limits
  fixed.external_id = truncate(fixed.external_id, 100);
  fixed.topic = truncate(fixed.topic, 100);
  fixed.chapter = truncate(fixed.chapter, 100);
  fixed.subtopic = truncate(fixed.subtopic, 100);

  // Remove fields not in database schema
  delete fixed.figure_url;
  delete fixed.has_figure;
  delete fixed.year;
  delete fixed.source;

  return fixed;
}

/**
 * Truncate string to specified length
 */
function truncate(str, maxLength) {
  if (!str) return str;
  if (str.length <= maxLength) return str;
  return str.substring(0, maxLength);
}

/**
 * Delete and insert questions in batches
 */
async function updateQuestions(questions, subject) {
  console.log(`\n\n${'='.repeat(70)}`);
  console.log(`📘 PROCESSING ${subject.toUpperCase()} QUESTIONS`);
  console.log('='.repeat(70));

  const results = {
    inserted: 0,
    deleted: 0,
    failed: 0,
    skipped: 0,
    errors: []
  };

  for (let i = 0; i < questions.length; i++) {
    const q = questions[i];
    console.log(`\n[${i + 1}/${questions.length}] ${q.external_id}`);

    // Skip questions with empty options
    if (!q.option_a && !q.option_b && !q.option_c && !q.option_d) {
      console.log(`  ⏭️  Skipped: No options available`);
      results.skipped++;
      continue;
    }

    try {
      // Step 1: Delete existing version
      console.log(`  🔄 Removing old version from database...`);
      const { data: deletedRecords, error: deleteError } = await supabase
        .from('questions')
        .delete()
        .eq('external_id', q.external_id)
        .select();

      if (deleteError) {
        console.log(`  ⚠️  Delete warning: ${deleteError.message}`);
      } else if (deletedRecords && deletedRecords.length > 0) {
        console.log(`  🗑️  Deleted ${deletedRecords.length} old version(s)`);
        results.deleted += deletedRecords.length;
      } else {
        console.log(`  ℹ️  No existing version found (new question)`);
      }

      // Step 2: Insert corrected version
      console.log(`  ➕ Inserting corrected version...`);
      const { data, error } = await supabase
        .from('questions')
        .insert([q])
        .select();

      if (error) {
        console.log(`  ❌ Error: ${error.message}`);
        results.failed++;
        results.errors.push({
          id: q.external_id,
          error: error.message
        });
      } else {
        console.log(`  ✅ Inserted successfully with corrected LaTeX`);
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
  console.log('🚀 Starting LaTeX correction update from HTML files...\n');

  // Load questions with solutions
  console.log('📂 Loading questions from JSON files...');
  const mathQuestions = JSON.parse(
    fs.readFileSync('latex_issues_mathematics_with_solutions.json', 'utf8')
  );
  const physicsQuestions = JSON.parse(
    fs.readFileSync('latex_issues_physics_with_solutions.json', 'utf8')
  );

  console.log(`\n📚 Loaded questions:`);
  console.log(`   Mathematics: ${mathQuestions.length} questions`);
  console.log(`   Physics: ${physicsQuestions.length} questions`);

  // Prepare questions (fix LaTeX)
  console.log(`\n🔧 Preparing questions (fixing LaTeX delimiters)...`);
  const preparedMath = mathQuestions.map(prepareQuestion);
  const preparedPhysics = physicsQuestions.map(prepareQuestion);
  console.log(`   ✅ All questions prepared`);

  // Update Mathematics questions
  const mathResults = await updateQuestions(preparedMath, 'Mathematics');

  // Update Physics questions
  const physicsResults = await updateQuestions(preparedPhysics, 'Physics');

  // Final report
  console.log(`\n\n${'='.repeat(70)}`);
  console.log('📊 FINAL RESULTS');
  console.log('='.repeat(70));

  console.log(`\n📘 MATHEMATICS (${mathQuestions.length} total):`);
  console.log(`   ➕ Inserted: ${mathResults.inserted}`);
  console.log(`   🗑️  Deleted old versions: ${mathResults.deleted}`);
  console.log(`   ⏭️  Skipped (no options): ${mathResults.skipped}`);
  console.log(`   ❌ Failed: ${mathResults.failed}`);

  console.log(`\n📗 PHYSICS (${physicsQuestions.length} total):`);
  console.log(`   ➕ Inserted: ${physicsResults.inserted}`);
  console.log(`   🗑️  Deleted old versions: ${physicsResults.deleted}`);
  console.log(`   ⏭️  Skipped (no options): ${physicsResults.skipped}`);
  console.log(`   ❌ Failed: ${physicsResults.failed}`);

  console.log(`\n📈 COMBINED TOTALS:`);
  console.log(`   ➕ Total inserted: ${mathResults.inserted + physicsResults.inserted}`);
  console.log(`   🗑️  Total deleted: ${mathResults.deleted + physicsResults.deleted}`);
  console.log(`   ⏭️  Total skipped: ${mathResults.skipped + physicsResults.skipped}`);
  console.log(`   ❌ Total failed: ${mathResults.failed + physicsResults.failed}`);
  console.log('='.repeat(70) + '\n');

  // Save detailed report
  const report = {
    timestamp: new Date().toISOString(),
    mathematics: {
      total: mathQuestions.length,
      results: mathResults
    },
    physics: {
      total: physicsQuestions.length,
      results: physicsResults
    }
  };

  fs.writeFileSync('latex_update_report.json', JSON.stringify(report, null, 2));
  console.log('💾 Detailed report saved to: latex_update_report.json\n');

  console.log('✨ LaTeX correction update complete!\n');

  if (mathResults.failed > 0 || physicsResults.failed > 0) {
    console.log('⚠️  Some questions failed to insert. Check latex_update_report.json for details.\n');
  }
}

main().catch(console.error);
