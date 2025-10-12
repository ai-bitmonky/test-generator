/**
 * Extract questions with LaTeX issues from unrendered HTML files
 * and create corrected versions ready for database insertion
 */

require('dotenv').config({ path: '.env.local' });
const fs = require('fs');
const { JSDOM } = require('jsdom');

function extractQuestionsWithLatexIssues(inputFile, outputFile, subject) {
  console.log(`\n🔍 Extracting ${subject} questions with LaTeX issues from ${inputFile}...`);

  const html = fs.readFileSync(inputFile, 'utf8');
  const dom = new JSDOM(html);
  const document = dom.window.document;

  const questionCards = document.querySelectorAll('.question-card');
  console.log(`   Found ${questionCards.length} question cards`);

  const questions = [];

  questionCards.forEach((card, index) => {
    // Check if this card has LaTeX issues
    const issueTags = card.querySelectorAll('.issue-tag');
    let hasLatexIssue = false;

    issueTags.forEach(tag => {
      if (tag.textContent.trim() === 'LaTeX') {
        hasLatexIssue = true;
      }
    });

    // Skip if no LaTeX issue
    if (!hasLatexIssue) {
      return;
    }

    // Extract metadata
    const metaTags = card.querySelectorAll('.meta-tag');
    let externalId = '';
    let topic = '';
    let chapter = '';

    metaTags.forEach(tag => {
      const text = tag.textContent.trim();
      if (text.startsWith('ID:')) {
        externalId = text.replace('ID:', '').trim();
      } else if (text.startsWith('Topic:')) {
        topic = text.replace('Topic:', '').trim();
      } else if (text.startsWith('Chapter:')) {
        chapter = text.replace('Chapter:', '').trim();
      }
    });

    // Extract question text
    const questionDiv = card.querySelector('.content-box .raw-text');
    const questionText = questionDiv ? questionDiv.textContent.trim() : '';

    // Extract options
    const options = { a: '', b: '', c: '', d: '' };
    const optionElements = card.querySelectorAll('.options-section .option');

    optionElements.forEach(opt => {
      const strong = opt.querySelector('strong');
      const rawText = opt.querySelector('.raw-text');

      if (strong && rawText) {
        const letter = strong.textContent.trim().replace(/[.:]/g, '').toLowerCase();
        const text = rawText.textContent.trim();
        if (['a', 'b', 'c', 'd'].includes(letter)) {
          options[letter] = text;
        }
      }
    });

    // Extract correct answer
    const correctAnswerSpan = card.querySelector('.correct-answer');
    const correctAnswer = correctAnswerSpan ? correctAnswerSpan.textContent.trim().toLowerCase() : '';

    // Extract solution (with HTML entities)
    const solutionDiv = card.querySelector('.content-box .raw-text');
    let solutionHtml = '';
    if (solutionDiv && solutionDiv.textContent.includes('&lt;div')) {
      // Decode HTML entities
      solutionHtml = decodeHTMLEntities(solutionDiv.textContent);
    }

    questions.push({
      external_id: externalId,
      subject: subject,
      topic: topic,
      chapter: chapter === 'Unknown' ? topic : chapter,
      subtopic: '',
      difficulty: 'MEDIUM',
      question_text: questionText,
      question_html: `<p>${questionText}</p>`,
      option_a: options.a,
      option_b: options.b,
      option_c: options.c,
      option_d: options.d,
      correct_answer: correctAnswer,
      solution_text: extractTextFromHTML(solutionHtml),
      solution_html: solutionHtml,
      figure_url: null,
      has_figure: questionText.toLowerCase().includes('figure') || questionText.toLowerCase().includes('diagram'),
      year: null,
      source: 'JEE Advanced - LaTeX Corrections'
    });
  });

  // Write to JSON file
  fs.writeFileSync(outputFile, JSON.stringify(questions, null, 2));
  console.log(`✅ Extracted ${questions.length} ${subject} questions to ${outputFile}`);

  return questions;
}

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

function extractTextFromHTML(html) {
  if (!html) return '';
  const dom = new JSDOM(html);
  return dom.window.document.body.textContent.trim();
}

// Main execution
console.log('🚀 Starting LaTeX issues extraction...\n');

const mathQuestions = extractQuestionsWithLatexIssues(
  'unrendered_mathematics_questions.html',
  'latex_issues_mathematics.json',
  'Mathematics'
);

const physicsQuestions = extractQuestionsWithLatexIssues(
  'unrendered_physics_questions.html',
  'latex_issues_physics.json',
  'Physics'
);

console.log(`\n✨ Extraction complete!`);
console.log(`   Mathematics: ${mathQuestions.length} questions`);
console.log(`   Physics: ${physicsQuestions.length} questions`);
console.log(`   Total: ${mathQuestions.length + physicsQuestions.length} questions\n`);
