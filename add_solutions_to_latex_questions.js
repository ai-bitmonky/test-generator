/**
 * Extract solutions from original HTML files and add to LaTeX correction files
 * Processes in batches to handle large files
 */

const fs = require('fs');
const { JSDOM } = require('jsdom');

const BATCH_SIZE = 10; // Process 10 questions at a time

/**
 * Extract solution for a specific question from HTML file
 */
function extractSolutionFromHTML(htmlFile, externalId) {
  console.log(`  🔍 Searching for ${externalId} in ${htmlFile}...`);

  const html = fs.readFileSync(htmlFile, 'utf8');
  const dom = new JSDOM(html);
  const document = dom.window.document;

  const questionCards = document.querySelectorAll('.question-card');

  for (let card of questionCards) {
    // Find the ID
    const metaTags = card.querySelectorAll('.meta-tag');
    let cardId = '';

    for (let tag of metaTags) {
      const text = tag.textContent.trim();
      if (text.startsWith('ID:')) {
        cardId = text.replace('ID:', '').trim();
        break;
      }
    }

    if (cardId === externalId) {
      console.log(`  ✅ Found ${externalId}`);

      // Extract solution
      const solutionDivs = card.querySelectorAll('.content-box');
      for (let div of solutionDivs) {
        const h4 = div.querySelector('h4');
        if (h4 && h4.textContent.includes('Solution')) {
          const rawText = div.querySelector('.raw-text');
          if (rawText) {
            const solutionHTML = decodeHTMLEntities(rawText.textContent);
            return solutionHTML;
          }
        }
      }

      console.log(`  ⚠️  No solution found for ${externalId}`);
      return null;
    }
  }

  console.log(`  ❌ Question ${externalId} not found in HTML`);
  return null;
}

/**
 * Decode HTML entities
 */
function decodeHTMLEntities(text) {
  const entities = {
    '&lt;': '<',
    '&gt;': '>',
    '&amp;': '&',
    '&quot;': '"',
    '&#39;': "'",
    '&apos;': "'"
  };

  return text.replace(/&[#\w]+;/g, match => entities[match] || match);
}

/**
 * Process questions in batches
 */
async function processBatch(questions, startIdx, batchSize, htmlFile, subject) {
  const endIdx = Math.min(startIdx + batchSize, questions.length);
  console.log(`\n📦 Processing batch ${Math.floor(startIdx / batchSize) + 1} (questions ${startIdx + 1}-${endIdx})...`);

  let updated = 0;
  let notFound = 0;

  for (let i = startIdx; i < endIdx; i++) {
    const question = questions[i];
    console.log(`\n[${i + 1}/${questions.length}] ${question.external_id}`);

    // Skip if already has solution
    if (question.solution_html && question.solution_html.length > 50) {
      console.log(`  ⏭️  Already has solution, skipping`);
      continue;
    }

    // Extract solution from original HTML
    const solutionHTML = extractSolutionFromHTML(htmlFile, question.external_id);

    if (solutionHTML) {
      question.solution_html = solutionHTML;
      question.solution_text = extractTextFromHTML(solutionHTML);
      updated++;
      console.log(`  ✅ Solution added`);
    } else {
      notFound++;
      console.log(`  ⚠️  Solution not found`);
    }
  }

  return { updated, notFound };
}

/**
 * Extract text from HTML
 */
function extractTextFromHTML(html) {
  if (!html) return '';
  try {
    const dom = new JSDOM(html);
    return dom.window.document.body.textContent.trim();
  } catch (err) {
    return '';
  }
}

/**
 * Main execution
 */
async function main() {
  console.log('🚀 Adding solutions to LaTeX correction questions...\n');

  // Load questions
  const mathQuestions = JSON.parse(fs.readFileSync('latex_issues_mathematics.json', 'utf8'));
  const physicsQuestions = JSON.parse(fs.readFileSync('latex_issues_physics.json', 'utf8'));

  console.log(`📚 Loaded questions:`);
  console.log(`   Mathematics: ${mathQuestions.length} questions`);
  console.log(`   Physics: ${physicsQuestions.length} questions`);

  // Process Mathematics questions in batches
  console.log('\n\n' + '='.repeat(70));
  console.log('📘 PROCESSING MATHEMATICS QUESTIONS');
  console.log('='.repeat(70));

  let mathStats = { updated: 0, notFound: 0 };

  for (let i = 0; i < mathQuestions.length; i += BATCH_SIZE) {
    const result = await processBatch(
      mathQuestions,
      i,
      BATCH_SIZE,
      'unrendered_mathematics_questions.html',
      'Mathematics'
    );
    mathStats.updated += result.updated;
    mathStats.notFound += result.notFound;

    // Save progress after each batch
    fs.writeFileSync(
      'latex_issues_mathematics_with_solutions.json',
      JSON.stringify(mathQuestions, null, 2)
    );
    console.log(`\n  💾 Progress saved to latex_issues_mathematics_with_solutions.json`);
  }

  // Process Physics questions in batches
  console.log('\n\n' + '='.repeat(70));
  console.log('📗 PROCESSING PHYSICS QUESTIONS');
  console.log('='.repeat(70));

  let physicsStats = { updated: 0, notFound: 0 };

  for (let i = 0; i < physicsQuestions.length; i += BATCH_SIZE) {
    const result = await processBatch(
      physicsQuestions,
      i,
      BATCH_SIZE,
      'unrendered_physics_questions.html',
      'Physics'
    );
    physicsStats.updated += result.updated;
    physicsStats.notFound += result.notFound;

    // Save progress after each batch
    fs.writeFileSync(
      'latex_issues_physics_with_solutions.json',
      JSON.stringify(physicsQuestions, null, 2)
    );
    console.log(`\n  💾 Progress saved to latex_issues_physics_with_solutions.json`);
  }

  // Final report
  console.log('\n\n' + '='.repeat(70));
  console.log('📊 FINAL RESULTS');
  console.log('='.repeat(70));
  console.log(`\n📘 MATHEMATICS:`);
  console.log(`   ✅ Solutions added: ${mathStats.updated}`);
  console.log(`   ⚠️  Solutions not found: ${mathStats.notFound}`);
  console.log(`   📝 Total questions: ${mathQuestions.length}`);

  console.log(`\n📗 PHYSICS:`);
  console.log(`   ✅ Solutions added: ${physicsStats.updated}`);
  console.log(`   ⚠️  Solutions not found: ${physicsStats.notFound}`);
  console.log(`   📝 Total questions: ${physicsQuestions.length}`);

  console.log(`\n📈 TOTALS:`);
  console.log(`   ✅ Total solutions added: ${mathStats.updated + physicsStats.updated}`);
  console.log(`   ⚠️  Total not found: ${mathStats.notFound + physicsStats.notFound}`);
  console.log('='.repeat(70) + '\n');

  console.log(`✨ Solution extraction complete!`);
  console.log(`\n📂 Files created:`);
  console.log(`   - latex_issues_mathematics_with_solutions.json`);
  console.log(`   - latex_issues_physics_with_solutions.json`);
  console.log(`\n💡 Next step: Run create_latex_correction_html.js to regenerate HTML files with solutions\n`);
}

main().catch(console.error);
