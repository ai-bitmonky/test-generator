#!/usr/bin/env node
/**
 * Insert excluded questions from JSON file into database
 * These questions were excluded because they had no correct_answer field
 * We'll attempt to infer correct answers from solutions or mark them for manual review
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

// Helper function to try to infer correct answer from solution text
function inferCorrectAnswer(solutionText, options) {
  if (!solutionText || !options) return null;

  const solution = solutionText.toLowerCase();

  // Look for explicit answer mentions
  const patterns = [
    /final answer[:\s]+option\s*\(?([abcd])\)?/i,
    /correct answer[:\s]+option\s*\(?([abcd])\)?/i,
    /answer[:\s]+option\s*\(?([abcd])\)?/i,
    /option\s*\(?([abcd])\)?\s+is\s+correct/i,
    /\(?([abcd])\)?\s+is\s+the\s+correct/i,
  ];

  for (const pattern of patterns) {
    const match = solution.match(pattern);
    if (match) {
      return match[1].toLowerCase();
    }
  }

  // Check if solution text matches any option text
  for (const [key, value] of Object.entries(options)) {
    if (solution.includes(value.toLowerCase())) {
      return key.toLowerCase();
    }
  }

  return null;
}

async function insertExcludedQuestions() {
  console.log('📥 Inserting excluded questions into database...\n');

  // Read the JSON file
  const jsonData = JSON.parse(
    fs.readFileSync('excluded_questions_detailed.json', 'utf8')
  );

  console.log('📊 Summary:');
  console.log(`  • Total questions: ${jsonData.summary.total}`);
  console.log(`  • Mathematics: ${jsonData.summary.mathematics}`);
  console.log(`  • Physics: ${jsonData.summary.physics}\n`);

  const results = {
    inserted: 0,
    failed: 0,
    needsManualReview: 0,
    errors: []
  };

  // Process both subjects
  for (const subject of ['mathematics', 'physics']) {
    const questions = jsonData[subject] || [];
    console.log(`\n${'='.repeat(70)}`);
    console.log(`Processing ${subject.toUpperCase()} (${questions.length} questions)`);
    console.log('='.repeat(70));

    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      const num = i + 1;

      console.log(`\n[${num}/${questions.length}] ${q.id}`);

      // Try to infer correct answer
      let correctAnswer = q.correct_answer;

      if (!correctAnswer) {
        const inferred = inferCorrectAnswer(
          q.solution_text || q.solution_html,
          q.options
        );

        if (inferred) {
          correctAnswer = inferred;
          console.log(`  ℹ️  Inferred answer: ${inferred.toUpperCase()}`);
        } else {
          // Default to 'a' but mark for manual review
          correctAnswer = 'a';
          results.needsManualReview++;
          console.log(`  ⚠️  Could not infer answer, defaulting to 'A' - NEEDS MANUAL REVIEW`);
        }
      }

      // Prepare question data for insertion
      const questionData = {
        external_id: q.id,
        subject: q.subject,
        chapter: q.chapter || null,
        topic: q.topic || null,
        subtopic: q.subtopic || null,
        difficulty: q.difficulty || 'MEDIUM',
        question_type: q.type || null,
        question: q.question || null,
        question_html: q.question_html || null,
        options: q.options || {},
        correct_answer: correctAnswer,
        solution_html: q.solution_html || null,
        solution_text: q.solution_text || null,
        tags: q.tags || [],
        concepts: q.concepts || []
      };

      try {
        // Check if question already exists
        const { data: existing, error: checkError } = await supabase
          .from('questions')
          .select('id')
          .eq('external_id', q.id)
          .single();

        if (existing) {
          console.log(`  ⏭️  Already exists, skipping`);
          continue;
        }

        // Insert the question
        const { data, error } = await supabase
          .from('questions')
          .insert([questionData])
          .select();

        if (error) {
          console.log(`  ❌ Error: ${error.message}`);
          results.failed++;
          results.errors.push({
            id: q.id,
            error: error.message
          });
        } else {
          console.log(`  ✅ Inserted successfully`);
          results.inserted++;
        }

        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));

      } catch (error) {
        console.log(`  ❌ Exception: ${error.message}`);
        results.failed++;
        results.errors.push({
          id: q.id,
          error: error.message
        });
      }
    }
  }

  // Print final summary
  console.log('\n\n' + '='.repeat(70));
  console.log('📊 FINAL RESULTS');
  console.log('='.repeat(70));
  console.log(`✅ Successfully inserted: ${results.inserted}`);
  console.log(`❌ Failed: ${results.failed}`);
  console.log(`⚠️  Need manual review (answer defaulted): ${results.needsManualReview}`);
  console.log('='.repeat(70));

  if (results.errors.length > 0) {
    console.log('\n❌ Errors:');
    results.errors.forEach(err => {
      console.log(`  • ${err.id}: ${err.error}`);
    });
  }

  if (results.needsManualReview > 0) {
    console.log('\n⚠️  WARNING: Some questions need manual review!');
    console.log(`   ${results.needsManualReview} questions had their correct answer defaulted to 'A'`);
    console.log('   Please review and update these questions manually.');
  }

  // Save results to file
  const reportFile = 'insertion_report.json';
  fs.writeFileSync(reportFile, JSON.stringify(results, null, 2));
  console.log(`\n💾 Detailed report saved to: ${reportFile}`);

  return results;
}

// Main execution
insertExcludedQuestions()
  .then(results => {
    console.log('\n✨ Insertion complete!');
    process.exit(results.failed > 0 ? 1 : 0);
  })
  .catch(error => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  });
