#!/usr/bin/env node
/**
 * Parse and insert problematic Mathematics questions from corrected HTML file
 * Deletes existing questions and inserts corrected versions
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

function parseHTMLFile(filename) {
  console.log(`\n📄 Parsing ${filename}...`);

  const html = fs.readFileSync(filename, 'utf8');
  const dom = new JSDOM(html);
  const document = dom.window.document;

  const questions = [];

  // Find all question cards
  const questionCards = document.querySelectorAll('.question-card');

  questionCards.forEach((card, index) => {
    try {
      // Extract external ID from meta tags
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
          const diffText = text.replace('Difficulty:', '').trim().toUpperCase();
          if (['EASY', 'MEDIUM', 'HARD'].includes(diffText)) {
            difficulty = diffText;
          }
        }
      });

      if (!externalId) {
        console.log(`  ⏭️  Skipping question ${index + 1} - no external ID found`);
        return;
      }

      // Extract question text
      const questionTextDiv = card.querySelector('.question-text');
      if (!questionTextDiv) {
        console.log(`  ⏭️  Skipping ${externalId} - no question text found`);
        return;
      }

      const questionText = questionTextDiv.textContent
        .replace(/^Question \d+:\s*/, '')
        .trim();
      const questionHtml = questionTextDiv.innerHTML
        .replace(/<h4>Question \d+:<\/h4>\s*/, '')
        .trim();

      // Extract options (look for option divs, list items, or options-section p tags)
      const options = {};
      let optionElements = card.querySelectorAll('.option, .options li');

      // If no options found, try looking in options-section
      if (optionElements.length === 0) {
        const optionsSection = card.querySelector('.options-section');
        if (optionsSection) {
          optionElements = optionsSection.querySelectorAll('p');
        }
      }

      if (optionElements.length > 0) {
        optionElements.forEach((opt, idx) => {
          const text = opt.textContent.trim();

          // Skip if it's the "Options:" header
          if (text === 'Options:') return;

          // Try to match pattern like "(A) text" or "A. text" or "A) text"
          const match = text.match(/^\(?([A-D])\)?[\.\)]\s*(.+)$/i);
          if (match) {
            const key = match[1].toLowerCase();
            const value = match[2].trim();
            options[key] = value;
          } else if (idx < 4 && text.length > 0) {
            // Fallback: assign to a, b, c, d in order
            const key = String.fromCharCode(97 + idx);
            options[key] = text;
          }
        });
      }

      // Extract correct answer
      let correctAnswer = null;
      const correctAnswerSpan = card.querySelector('.correct-answer');
      if (correctAnswerSpan) {
        const answerText = correctAnswerSpan.textContent.trim();
        const match = answerText.match(/^([A-D])$/i);
        if (match) {
          correctAnswer = match[1].toLowerCase();
        }
      }

      // Skip if no correct answer
      if (!correctAnswer) {
        console.log(`  ⏭️  Skipping ${externalId} - no correct answer found`);
        return;
      }

      // Skip if no options
      if (Object.keys(options).length === 0) {
        console.log(`  ⏭️  Skipping ${externalId} - no options found`);
        return;
      }

      // Extract solution if available
      const solutionDiv = card.querySelector('.solution');
      const solutionHtml = solutionDiv ? solutionDiv.innerHTML : null;
      const solutionText = solutionDiv ? solutionDiv.textContent.trim() : null;

      // Build question object
      const question = {
        external_id: externalId,
        subject: 'Mathematics',
        chapter: chapter || 'Mathematics',
        topic: topic || null,
        subtopic: null,
        difficulty: difficulty,
        question_type: 'Multiple Choice Single Answer',
        question: questionText,
        question_html: questionHtml,
        options: options,
        correct_answer: correctAnswer,
        solution_html: solutionHtml,
        solution_text: solutionText,
        tags: [],
        concepts: []
      };

      questions.push(question);

    } catch (error) {
      console.error(`  ⚠️  Error parsing question ${index + 1}:`, error.message);
    }
  });

  console.log(`  ✅ Parsed ${questions.length} valid questions`);
  return questions;
}

async function insertQuestions(questions) {
  console.log(`\n📥 Processing ${questions.length} questions (delete & insert)...\n`);

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
    const num = i + 1;

    console.log(`[${num}/${questions.length}] ${q.external_id}`);
    console.log(`  ℹ️  Answer: ${q.correct_answer.toUpperCase()}`);

    try {
      // First, delete ALL existing questions with this external_id
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
  console.log('🚀 Starting insertion from problematic Mathematics HTML file...\n');

  const filename = 'problematic_mathematics_questions.html';

  if (!fs.existsSync(filename)) {
    console.error(`❌ File not found: ${filename}`);
    process.exit(1);
  }

  // Parse HTML file
  const questions = parseHTMLFile(filename);

  if (questions.length === 0) {
    console.log('\n⚠️  No valid questions found to insert.');
    process.exit(0);
  }

  // Insert questions
  const results = await insertQuestions(questions);

  // Print final summary
  console.log('\n\n' + '='.repeat(70));
  console.log('📊 FINAL RESULTS');
  console.log('='.repeat(70));
  console.log(`  ➕ New insertions: ${results.inserted}`);
  console.log(`  🔄 Updated: ${results.updated}`);
  console.log(`  🗑️  Deleted old versions: ${results.deleted}`);
  console.log(`  ⏭️  Skipped: ${results.skipped}`);
  console.log(`  ❌ Failed: ${results.failed}`);
  console.log('='.repeat(70));

  // Show errors if any
  if (results.errors.length > 0) {
    console.log(`\n❌ Errors (${results.errors.length}):`);
    results.errors.forEach(err => {
      console.log(`  • ${err.id}: ${err.error}`);
    });
  }

  // Save report
  const reportFile = 'problematic_math_insertion_report.json';
  fs.writeFileSync(reportFile, JSON.stringify({
    totalParsed: questions.length,
    results: results
  }, null, 2));
  console.log(`\n💾 Detailed report saved to: ${reportFile}`);

  return results.failed === 0 ? 0 : 1;
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
