#!/usr/bin/env node
/**
 * Parse corrected HTML files and insert questions into database
 * Reads from excluded_mathematics_questions.html and excluded_physics_questions.html
 */

const { createClient } = require('@supabase/supabase-js');
const { JSDOM } = require('jsdom');
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

function parseHTMLFile(filename, subject) {
  console.log(`\n📄 Parsing ${filename}...`);

  const html = fs.readFileSync(filename, 'utf8');
  const dom = new JSDOM(html);
  const document = dom.window.document;

  const questions = [];

  // Find all question cards
  const questionCards = document.querySelectorAll('.question-card');

  questionCards.forEach((card, index) => {
    try {
      // Extract external ID
      const questionIdEl = card.querySelector('.question-id');
      const externalId = questionIdEl ? questionIdEl.textContent.replace('ID:', '').trim() : '';

      // Extract difficulty from badge
      let difficulty = 'MEDIUM';
      const badges = card.querySelectorAll('.badge');
      badges.forEach(badge => {
        const text = badge.textContent.trim().toUpperCase();
        if (text === 'HARD' || text === 'MEDIUM' || text === 'EASY') {
          difficulty = text;
        }
      });

      // Extract metadata from metadata-item divs
      let topic = '', chapter = '', subtopic = '', questionType = '';
      const metadataItems = card.querySelectorAll('.metadata-item');

      metadataItems.forEach(item => {
        const text = item.textContent.trim();
        if (text.includes('Chapter:')) {
          chapter = text.replace(/.*Chapter:\s*/, '').trim();
        } else if (text.includes('Topic:')) {
          topic = text.replace(/.*Topic:\s*/, '').trim();
        } else if (text.includes('Subtopic:')) {
          subtopic = text.replace(/.*Subtopic:\s*/, '').trim();
        } else if (text.includes('Type:')) {
          questionType = text.replace(/.*Type:\s*/, '').trim();
        }
      });

      // Extract tags
      const tags = [];
      const tagElements = card.querySelectorAll('.tag');
      tagElements.forEach(tag => {
        tags.push(tag.textContent.trim());
      });

      // Extract question text
      const questionDiv = card.querySelector('.question-text');
      const questionText = questionDiv ? questionDiv.textContent.trim() : '';
      const questionHtml = questionDiv ? questionDiv.innerHTML : '';

      // Extract options
      const options = {};
      const optionElements = card.querySelectorAll('.option');
      optionElements.forEach(opt => {
        const text = opt.textContent.trim();
        const match = text.match(/^([A-D])[.:]\s*(.+)$/i);
        if (match) {
          const key = match[1].toLowerCase();
          const value = match[2].trim();
          options[key] = value;
        }
      });

      // Extract correct answer
      // Look for "✅ Correct Answer: (a)" pattern in strong tags
      let correctAnswer = null;
      const strongEls = card.querySelectorAll('strong');
      for (const strong of strongEls) {
        const text = strong.textContent.trim();
        if (text.includes('Correct Answer')) {
          const answerMatch = text.match(/\(([A-D])\)/i);
          if (answerMatch) {
            correctAnswer = answerMatch[1].toLowerCase();
            break;
          }
        }
      }

      // Extract solution
      const solutionDiv = card.querySelector('.solution');
      const solutionHtml = solutionDiv ? solutionDiv.innerHTML : null;
      const solutionText = solutionDiv ? solutionDiv.textContent.trim() : '';

      // Build question object
      const question = {
        external_id: externalId,
        subject: subject,
        chapter: chapter !== 'Unknown' && chapter !== '' ? chapter : null,
        topic: topic !== 'Unknown' && topic !== '' ? topic : null,
        subtopic: subtopic !== 'Unknown' && subtopic !== '' ? subtopic : null,
        difficulty: difficulty || 'MEDIUM',
        question_type: questionType !== '' ? questionType : null,
        question: questionText,
        question_html: questionHtml,
        options: options,
        correct_answer: correctAnswer,
        solution_html: solutionHtml,
        solution_text: solutionText,
        tags: tags,
        concepts: []
      };

      questions.push(question);

    } catch (error) {
      console.error(`  ⚠️  Error parsing question ${index + 1}:`, error.message);
    }
  });

  console.log(`  ✅ Parsed ${questions.length} questions`);
  return questions;
}

async function insertQuestions(questions, subject) {
  console.log(`\n📥 Processing ${subject} questions (insert/update)...\n`);

  const results = {
    inserted: 0,
    updated: 0,
    deleted: 0,
    failed: 0,
    missingAnswer: 0,
    errors: []
  };

  for (let i = 0; i < questions.length; i++) {
    const q = questions[i];
    const num = i + 1;

    console.log(`[${num}/${questions.length}] ${q.external_id}`);

    // Check if correct answer is present
    if (!q.correct_answer) {
      console.log(`  ⚠️  Missing correct answer - skipping`);
      results.missingAnswer++;
      continue;
    }

    console.log(`  ℹ️  Answer: ${q.correct_answer.toUpperCase()}`);

    try {
      // First, delete ALL existing questions with this external_id (handles duplicates)
      console.log(`  🔄 Removing old versions...`);
      const { data: deletedRecords, error: deleteError } = await supabase
        .from('questions')
        .delete()
        .eq('external_id', q.external_id)
        .select();

      if (deleteError && !deleteError.message.includes('No rows found')) {
        console.log(`  ❌ Delete error: ${deleteError.message}`);
        results.failed++;
        results.errors.push({
          id: q.external_id,
          error: `Delete failed: ${deleteError.message}`
        });
        continue;
      }

      const deletedCount = deletedRecords ? deletedRecords.length : 0;
      if (deletedCount > 0) {
        results.deleted += deletedCount;
        console.log(`  ✅ Removed ${deletedCount} old version(s)`);
      }

      // Insert the new/updated question
      const { data, error } = await supabase
        .from('questions')
        .insert([q])
        .select();

      if (error) {
        console.log(`  ❌ Insert error: ${error.message}`);
        results.failed++;
        results.errors.push({
          id: q.external_id,
          error: error.message
        });
      } else {
        if (deletedCount > 0) {
          console.log(`  ✅ Updated with corrected data`);
          results.updated++;
        } else {
          console.log(`  ✅ Inserted new question`);
          results.inserted++;
        }
      }

      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));

    } catch (error) {
      console.log(`  ❌ Exception: ${error.message}`);
      results.failed++;
      results.errors.push({
        id: q.external_id,
        error: error.message
      });
    }
  }

  return results;
}

async function main() {
  console.log('🚀 Starting insertion from corrected HTML files...\n');

  const allResults = {
    Mathematics: null,
    Physics: null
  };

  // Parse and insert Mathematics questions
  try {
    const mathQuestions = parseHTMLFile('excluded_mathematics_questions.html', 'Mathematics');
    allResults.Mathematics = await insertQuestions(mathQuestions, 'Mathematics');
  } catch (error) {
    console.error('❌ Error processing Mathematics:', error.message);
  }

  // Parse and insert Physics questions
  try {
    const physicsQuestions = parseHTMLFile('excluded_physics_questions.html', 'Physics');
    allResults.Physics = await insertQuestions(physicsQuestions, 'Physics');
  } catch (error) {
    console.error('❌ Error processing Physics:', error.message);
  }

  // Print final summary
  console.log('\n\n' + '='.repeat(70));
  console.log('📊 FINAL RESULTS');
  console.log('='.repeat(70));

  let totalInserted = 0;
  let totalUpdated = 0;
  let totalDeleted = 0;
  let totalFailed = 0;
  let totalMissingAnswer = 0;

  for (const [subject, results] of Object.entries(allResults)) {
    if (results) {
      console.log(`\n${subject}:`);
      console.log(`  ➕ New insertions: ${results.inserted}`);
      console.log(`  🔄 Updated: ${results.updated}`);
      console.log(`  🗑️  Deleted old versions: ${results.deleted}`);
      console.log(`  ⚠️  Missing answer: ${results.missingAnswer}`);
      console.log(`  ❌ Failed: ${results.failed}`);

      totalInserted += results.inserted;
      totalUpdated += results.updated;
      totalDeleted += results.deleted;
      totalFailed += results.failed;
      totalMissingAnswer += results.missingAnswer;
    }
  }

  console.log('\n' + '-'.repeat(70));
  console.log('TOTALS:');
  console.log(`  ➕ New insertions: ${totalInserted}`);
  console.log(`  🔄 Updated: ${totalUpdated}`);
  console.log(`  🗑️  Deleted: ${totalDeleted}`);
  console.log(`  ⚠️  Missing answer: ${totalMissingAnswer}`);
  console.log(`  ❌ Failed: ${totalFailed}`);
  console.log('='.repeat(70));

  // Show errors if any
  for (const [subject, results] of Object.entries(allResults)) {
    if (results && results.errors.length > 0) {
      console.log(`\n❌ ${subject} Errors:`);
      results.errors.forEach(err => {
        console.log(`  • ${err.id}: ${err.error}`);
      });
    }
  }

  // Save report
  const reportFile = 'html_insertion_report.json';
  fs.writeFileSync(reportFile, JSON.stringify(allResults, null, 2));
  console.log(`\n💾 Detailed report saved to: ${reportFile}`);

  return totalFailed === 0 ? 0 : 1;
}

// Execute
main()
  .then(exitCode => {
    console.log('\n✨ Insertion complete!');
    process.exit(exitCode);
  })
  .catch(error => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  });
