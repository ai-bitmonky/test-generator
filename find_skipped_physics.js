const { JSDOM } = require('jsdom');
const fs = require('fs');

const html = fs.readFileSync('problematic_physics_questions.html', 'utf8');
const dom = new JSDOM(html);
const document = dom.window.document;

const questionCards = document.querySelectorAll('.question-card');
console.log('Total cards found:', questionCards.length);

let parsed = 0;
let skipped = [];

questionCards.forEach((card, index) => {
  const metaTags = card.querySelectorAll('.meta-tag');
  let externalId = '';

  metaTags.forEach(tag => {
    const text = tag.textContent.trim();
    if (text.includes('ID:')) {
      externalId = text.replace('ID:', '').trim();
    }
  });

  // Check for options
  const options = {};
  let optionElements = card.querySelectorAll('.option, .options li');

  if (optionElements.length === 0) {
    const optionsSection = card.querySelector('.options-section');
    if (optionsSection) {
      optionElements = optionsSection.querySelectorAll('p');
    }
  }

  if (optionElements.length > 0) {
    optionElements.forEach((opt, idx) => {
      const text = opt.textContent.trim();
      if (text === 'Options:') return;
      const match = text.match(/^\(?([A-D])\)?[\.\)]\s*(.+)$/i);
      if (match) {
        const key = match[1].toLowerCase();
        const value = match[2].trim();
        options[key] = value;
      }
    });
  }

  // Check for correct answer
  let correctAnswer = null;
  const correctAnswerSpan = card.querySelector('.correct-answer');
  if (correctAnswerSpan) {
    const answerText = correctAnswerSpan.textContent.trim();
    const match = answerText.match(/^([A-D])$/i);
    if (match) {
      correctAnswer = match[1].toLowerCase();
    }
  }

  const hasOptions = Object.keys(options).length > 0;

  if (!correctAnswer || !hasOptions) {
    // Get question text
    const questionTextDiv = card.querySelector('.question-text');
    const questionText = questionTextDiv ? questionTextDiv.textContent.replace(/Question \d+:\s*/, '').trim() : '';

    skipped.push({
      id: externalId,
      questionText: questionText.substring(0, 100) + '...',
      hasOptions: hasOptions,
      hasAnswer: !!correctAnswer,
      optionCount: Object.keys(options).length
    });
  } else {
    parsed++;
  }
});

console.log('\nParsed:', parsed);
console.log('Skipped:', skipped.length);
console.log('\nSkipped questions:');
skipped.forEach((q, i) => {
  console.log(`\n${i + 1}. ${q.id}`);
  console.log(`   Question: ${q.questionText}`);
  console.log(`   Options: ${q.hasOptions ? 'YES' : 'NO'} (${q.optionCount} found)`);
  console.log(`   Answer: ${q.hasAnswer ? 'YES' : 'NO'}`);
});
