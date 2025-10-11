#!/usr/bin/env node
/**
 * Parse all Chemistry questions from RC Mukherjee HTML files
 * Recursively process all HTML files in the chemistry folder
 */

const { createClient } = require('@supabase/supabase-js');
const { JSDOM } = require('jsdom');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Path to chemistry HTML files
const CHEMISTRY_FOLDER = '/Users/Pramod/projects/Selenium/input/IIT-exam-inputs/chemistry/mukherjee/HTML-Selected-Problems';

function getAllHtmlFiles(dirPath) {
  const files = [];

  function traverse(currentPath) {
    const items = fs.readdirSync(currentPath);

    for (const item of items) {
      const fullPath = path.join(currentPath, item);
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory()) {
        traverse(fullPath);
      } else if (item.endsWith('.html')) {
        files.push(fullPath);
      }
    }
  }

  traverse(dirPath);
  return files;
}

function parseChemistryHTML(filePath) {
  console.log(`\n📄 Parsing ${path.basename(filePath)}...`);

  const html = fs.readFileSync(filePath, 'utf8');
  const dom = new JSDOM(html);
  const document = dom.window.document;

  const questions = [];
  let globalMetadata = {
    chapter: null,
    topic: null,
    subtopic: null,
    tags: [],
    type: null,
    difficulty: null
  };

  // Extract global metadata from h2 elements at the top
  const h2Elements = document.querySelectorAll('h2');
  h2Elements.forEach(h2 => {
    const text = h2.textContent.trim();
    if (text.startsWith('Chapter:')) {
      globalMetadata.chapter = text.replace('Chapter:', '').trim();
    } else if (text.startsWith('Topic:')) {
      globalMetadata.topic = text.replace('Topic:', '').trim();
    } else if (text.startsWith('Subtopic:')) {
      globalMetadata.subtopic = text.replace('Subtopic:', '').trim();
    } else if (text.startsWith('TAGS:')) {
      const tagsText = text.replace('TAGS:', '').trim();
      globalMetadata.tags = tagsText
        .replace(/[\[\]]/g, '')
        .split(',')
        .map(t => t.trim())
        .filter(t => t);
    } else if (text.startsWith('TYPE:')) {
      globalMetadata.type = text.replace('TYPE:', '').trim();
    } else if (text.startsWith('Difficulty Level:')) {
      globalMetadata.difficulty = text.replace('Difficulty Level:', '').trim().toUpperCase();
    }
  });

  // Find all question blocks (h3 elements mark questions)
  const h3Elements = document.querySelectorAll('h3');

  h3Elements.forEach(h3 => {
    const questionText = h3.textContent.trim();
    if (!questionText.startsWith('Question')) return;

    // Get question number
    const questionMatch = questionText.match(/Question\s+(\d+)/i);
    const questionNumber = questionMatch ? questionMatch[1] : '1';

    try {
      // Find the question div (next element after h3)
      let currentEl = h3.nextElementSibling;
      let questionDiv = null;
      let optionsDiv = null;
      let answerDiv = null;
      let solutionDiv = null;

      // Traverse siblings to find all related divs
      while (currentEl) {
        if (currentEl.tagName === 'H3' || currentEl.tagName === 'HR') {
          // Next question starts
          break;
        }

        if (currentEl.classList && currentEl.classList.contains('question')) {
          questionDiv = currentEl;
        } else if (currentEl.classList && currentEl.classList.contains('options')) {
          optionsDiv = currentEl;
        } else if (currentEl.classList && currentEl.classList.contains('answer')) {
          answerDiv = currentEl;
        } else if (currentEl.classList && currentEl.classList.contains('solution')) {
          solutionDiv = currentEl;
        }

        currentEl = currentEl.nextElementSibling;
      }

      if (!questionDiv) {
        console.log(`  ⏭️  Skipping Question ${questionNumber} - no question div found`);
        return;
      }

      // Extract question text and HTML
      const qText = questionDiv.textContent.trim();
      const qHtml = questionDiv.innerHTML;

      // Extract options
      const options = {};
      if (optionsDiv) {
        const optionsList = optionsDiv.querySelector('ol[type="A"]');
        if (optionsList) {
          const optionItems = optionsList.querySelectorAll('li');
          optionItems.forEach((li, index) => {
            const key = String.fromCharCode(97 + index); // a, b, c, d
            options[key] = li.textContent.trim();
          });
        }
      }

      // Extract correct answer
      let correctAnswer = null;
      if (answerDiv) {
        const answerText = answerDiv.textContent.trim();
        const match = answerText.match(/Correct Answer:\s*([A-D])/i);
        if (match) {
          correctAnswer = match[1].toLowerCase();
        }
      }

      // Extract solution
      let solutionHtml = null;
      let solutionText = null;
      let strategy = null;
      let expertInsight = null;
      let keyFacts = null;

      if (solutionDiv) {
        solutionHtml = solutionDiv.innerHTML;
        solutionText = solutionDiv.textContent.trim();

        // Try to extract strategy, expert insight, and key facts
        const strategyMatch = solutionHtml.match(/<strong>Strategy:<\/strong>\s*([^<]+(?:<[^>]+>[^<]*)*?)(?=<p><strong>|$)/i);
        if (strategyMatch) {
          strategy = strategyMatch[1].replace(/<[^>]+>/g, '').trim();
        }

        const expertMatch = solutionHtml.match(/<strong>Expert Insight:<\/strong>\s*([^<]+(?:<[^>]+>[^<]*)*?)(?=<p><strong>|$)/i);
        if (expertMatch) {
          expertInsight = expertMatch[1].replace(/<[^>]+>/g, '').trim();
        }

        const keyFactsEl = solutionDiv.querySelector('ul');
        if (keyFactsEl) {
          const items = Array.from(keyFactsEl.querySelectorAll('li')).map(li => li.textContent.trim());
          keyFacts = items.join('; ');
        }
      }

      // Create external ID using hash to avoid 100 char limit
      const fileBasename = path.basename(filePath, '.html');
      // Create a short hash from filename (8 chars should be unique enough)
      const hash = crypto.createHash('md5').update(fileBasename).digest('hex').substring(0, 8);
      const externalId = `Chem_${hash}_Q${questionNumber}`;

      // Normalize difficulty level
      let difficulty = globalMetadata.difficulty || 'HARD';
      if (difficulty === 'COMPLEX' || difficulty === 'CHALLENGING') {
        difficulty = 'HARD';
      } else if (!['EASY', 'MEDIUM', 'HARD'].includes(difficulty)) {
        difficulty = 'HARD';
      }

      // Truncate fields to fit database constraints (varchar(100))
      const truncate = (str, maxLen = 100) => {
        if (!str) return null;
        return str.length > maxLen ? str.substring(0, maxLen) : str;
      };

      // Build question object
      const question = {
        external_id: externalId,
        subject: 'Chemistry',
        chapter: truncate(globalMetadata.chapter || 'Chemistry', 100),
        topic: truncate(globalMetadata.topic, 100),
        subtopic: truncate(globalMetadata.subtopic, 100),
        difficulty: difficulty,
        question_type: truncate(globalMetadata.type || 'Multiple Choice Single Answer', 100),
        question: qText,
        question_html: qHtml,
        options: Object.keys(options).length > 0 ? options : null,
        correct_answer: correctAnswer,
        solution_html: solutionHtml,
        solution_text: solutionText,
        strategy: strategy,
        expert_insight: expertInsight,
        key_facts: keyFacts,
        tags: globalMetadata.tags,
        concepts: []
      };

      questions.push(question);

    } catch (error) {
      console.error(`  ⚠️  Error parsing Question ${questionNumber}:`, error.message);
    }
  });

  console.log(`  ✅ Parsed ${questions.length} questions`);
  return questions;
}

async function insertQuestions(questions) {
  console.log(`\n📥 Inserting ${questions.length} questions into database...\n`);

  const results = {
    inserted: 0,
    updated: 0,
    failed: 0,
    missingAnswer: 0,
    missingOptions: 0,
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

    // Check if options are present
    if (!q.options || Object.keys(q.options).length === 0) {
      console.log(`  ⚠️  Missing options - skipping`);
      results.missingOptions++;
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
        console.log(`  ✅ Removed ${deletedCount} old version(s)`);
      }

      // Insert the question
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
          console.log(`  ✅ Updated with new data`);
          results.updated++;
        } else {
          console.log(`  ✅ Inserted successfully`);
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
  console.log('🚀 Starting Chemistry questions insertion from HTML files...\n');
  console.log(`📂 Source folder: ${CHEMISTRY_FOLDER}\n`);

  // Get all HTML files
  const htmlFiles = getAllHtmlFiles(CHEMISTRY_FOLDER);
  console.log(`✅ Found ${htmlFiles.length} HTML files\n`);

  let allQuestions = [];

  // Parse each HTML file
  for (const filePath of htmlFiles) {
    try {
      const questions = parseChemistryHTML(filePath);
      allQuestions = allQuestions.concat(questions);
    } catch (error) {
      console.error(`❌ Error processing ${path.basename(filePath)}:`, error.message);
    }
  }

  console.log('\n' + '='.repeat(70));
  console.log(`📊 TOTAL QUESTIONS PARSED: ${allQuestions.length}`);
  console.log('='.repeat(70));

  // Insert all questions
  const results = await insertQuestions(allQuestions);

  // Print final summary
  console.log('\n\n' + '='.repeat(70));
  console.log('📊 FINAL RESULTS');
  console.log('='.repeat(70));
  console.log(`✅ Inserted: ${results.inserted}`);
  console.log(`🔄 Updated: ${results.updated}`);
  console.log(`⚠️  Missing answer: ${results.missingAnswer}`);
  console.log(`⚠️  Missing options: ${results.missingOptions}`);
  console.log(`❌ Failed: ${results.failed}`);
  console.log('='.repeat(70));

  // Show errors if any
  if (results.errors.length > 0) {
    console.log('\n❌ Errors:');
    results.errors.forEach(err => {
      console.log(`  • ${err.id}: ${err.error}`);
    });
  }

  // Save report
  const reportFile = 'chemistry_insertion_report.json';
  fs.writeFileSync(reportFile, JSON.stringify({
    totalParsed: allQuestions.length,
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
