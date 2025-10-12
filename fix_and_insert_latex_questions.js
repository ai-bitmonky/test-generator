/**
 * Fix LaTeX issues in extracted questions and insert them into the database
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
 * Converts \$...\$ to $...$ and handles \(...\) format
 */
function fixLatexDelimiters(text) {
  if (!text) return text;

  // Convert \$...\$ to $...$
  text = text.replace(/\\\$/g, '$');

  // Convert \( and \) to $ delimiters if they exist
  text = text.replace(/\\\(/g, '$');
  text = text.replace(/\\\)/g, '$');

  return text;
}

/**
 * Process a single question to fix LaTeX issues
 */
function fixQuestionLatex(question) {
  const fixed = { ...question };

  // Fix question text and HTML
  fixed.question_text = fixLatexDelimiters(question.question_text);
  fixed.question_html = fixLatexDelimiters(question.question_html);

  // Fix options
  fixed.option_a = fixLatexDelimiters(question.option_a);
  fixed.option_b = fixLatexDelimiters(question.option_b);
  fixed.option_c = fixLatexDelimiters(question.option_c);
  fixed.option_d = fixLatexDelimiters(question.option_d);

  // Fix solution
  fixed.solution_text = fixLatexDelimiters(question.solution_text);
  fixed.solution_html = fixLatexDelimiters(question.solution_html);

  // Ensure fields are within database limits
  fixed.external_id = truncate(fixed.external_id, 100);
  fixed.topic = truncate(fixed.topic, 100);
  fixed.chapter = truncate(fixed.chapter, 100);
  fixed.subtopic = truncate(fixed.subtopic, 100);

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
 * Insert questions into database with delete-then-insert pattern
 */
async function insertQuestions(questions, subject) {
  console.log(`\n📥 Inserting ${questions.length} ${subject} questions...`);

  const results = {
    inserted: 0,
    updated: 0,
    deleted: 0,
    failed: 0,
    skipped: 0,
    errors: []
  };

  for (let i = 0; i < questions.length; i++) {
    const q = questions[i];
    console.log(`\n[${i + 1}/${questions.length}] ${q.external_id}`);

    // Skip questions with empty options (need manual correction)
    if (!q.option_a && !q.option_b && !q.option_c && !q.option_d) {
      console.log(`  ⏭️  Skipped: No options available`);
      results.skipped++;
      continue;
    }

    try {
      // Step 1: Try to delete existing version
      console.log(`  🔄 Removing old versions...`);
      const { data: deletedRecords, error: deleteError } = await supabase
        .from('questions')
        .delete()
        .eq('external_id', q.external_id)
        .select();

      if (deletedRecords && deletedRecords.length > 0) {
        console.log(`  🗑️  Deleted ${deletedRecords.length} old version(s)`);
        results.deleted += deletedRecords.length;
      }

      // Step 2: Insert new version
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
        console.log(`  ✅ Inserted new question`);
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
  console.log('🚀 Starting LaTeX correction and insertion...\n');

  // Load extracted questions
  const mathQuestions = JSON.parse(fs.readFileSync('latex_issues_mathematics.json', 'utf8'));
  const physicsQuestions = JSON.parse(fs.readFileSync('latex_issues_physics.json', 'utf8'));

  console.log(`📚 Loaded questions:`);
  console.log(`   Mathematics: ${mathQuestions.length} questions`);
  console.log(`   Physics: ${physicsQuestions.length} questions`);

  // Fix LaTeX issues
  console.log(`\n🔧 Fixing LaTeX delimiters...`);
  const fixedMathQuestions = mathQuestions.map(fixQuestionLatex);
  const fixedPhysicsQuestions = physicsQuestions.map(fixQuestionLatex);

  // Save fixed questions for review
  fs.writeFileSync('fixed_latex_mathematics.json', JSON.stringify(fixedMathQuestions, null, 2));
  fs.writeFileSync('fixed_latex_physics.json', JSON.stringify(fixedPhysicsQuestions, null, 2));
  console.log(`   ✅ Saved fixed questions to review files`);

  // Insert Mathematics questions
  const mathResults = await insertQuestions(fixedMathQuestions, 'Mathematics');

  // Insert Physics questions
  const physicsResults = await insertQuestions(fixedPhysicsQuestions, 'Physics');

  // Final report
  console.log(`\n\n======================================================================`);
  console.log(`📊 FINAL RESULTS`);
  console.log(`======================================================================`);
  console.log(`\n📘 MATHEMATICS (${mathQuestions.length} total):`);
  console.log(`  ➕ Inserted: ${mathResults.inserted}`);
  console.log(`  🗑️  Deleted old versions: ${mathResults.deleted}`);
  console.log(`  ⏭️  Skipped (no options): ${mathResults.skipped}`);
  console.log(`  ❌ Failed: ${mathResults.failed}`);

  console.log(`\n📗 PHYSICS (${physicsQuestions.length} total):`);
  console.log(`  ➕ Inserted: ${physicsResults.inserted}`);
  console.log(`  🗑️  Deleted old versions: ${physicsResults.deleted}`);
  console.log(`  ⏭️  Skipped (no options): ${physicsResults.skipped}`);
  console.log(`  ❌ Failed: ${physicsResults.failed}`);

  console.log(`\n📈 COMBINED TOTALS:`);
  console.log(`  ➕ Total inserted: ${mathResults.inserted + physicsResults.inserted}`);
  console.log(`  🗑️  Total deleted: ${mathResults.deleted + physicsResults.deleted}`);
  console.log(`  ⏭️  Total skipped: ${mathResults.skipped + physicsResults.skipped}`);
  console.log(`  ❌ Total failed: ${mathResults.failed + physicsResults.failed}`);
  console.log(`======================================================================\n`);

  // Save detailed report
  const report = {
    mathematics: {
      total: mathQuestions.length,
      results: mathResults
    },
    physics: {
      total: physicsQuestions.length,
      results: physicsResults
    }
  };

  fs.writeFileSync('latex_correction_report.json', JSON.stringify(report, null, 2));
  console.log(`💾 Detailed report saved to: latex_correction_report.json\n`);

  console.log(`✨ LaTeX correction and insertion complete!\n`);
}

main().catch(console.error);
