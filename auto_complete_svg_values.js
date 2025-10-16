const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

/**
 * Automatically finds missing values in SVG diagrams by comparing
 * question text with SVG content
 */

// Extract numerical values with units from text
function extractValues(text) {
  const patterns = [
    // Distance/length patterns
    /([rRdDlLhHxXyYzZ]|radius|height|distance|separation|length|width)\s*(?:=|:)?\s*(\d+\.?\d*)\s*(m|cm|mm|km|μm|nm)/gi,
    // Capacitance
    /(C[₁₂₃₄]?)\s*(?:=|:)?\s*(\d+\.?\d*)\s*(μF|pF|nF|F)/gi,
    // Voltage
    /(V[₁₂₃₄]?)\s*(?:=|:)?\s*(\d+\.?\d*)\s*(V|kV|mV)/gi,
    // Mass
    /(m|M|mass)\s*(?:=|:)?\s*(\d+\.?\d*)\s*(kg|g|mg)/gi,
    // Charge
    /(q[₁₂₃₄]?|Q[₁₂₃₄]?|charge)\s*(?:=|:)?\s*(\d+\.?\d*)\s*(C|μC|nC|pC)/gi,
    // Angle
    /(θ|angle|α|β)\s*(?:=|:)?\s*(\d+\.?\d*)\s*°/gi,
    // Coefficient
    /(μ[ₛₖ]?)\s*(?:=|:)?\s*(\d+\.?\d*)/gi
  ];

  const values = [];
  patterns.forEach(pattern => {
    const matches = [...text.matchAll(pattern)];
    matches.forEach(match => {
      const label = match[1];
      const number = match[2];
      const unit = match[3] || '';
      const fullValue = unit ? `${label} = ${number} ${unit}` : `${label} = ${number}`;
      values.push({
        label: label.trim(),
        number,
        unit,
        fullValue: fullValue.trim()
      });
    });
  });

  return values;
}

// Check if value exists in SVG
function valueExistsInSVG(svgElement, value) {
  const svgText = svgElement.textContent || '';
  const searchPatterns = [
    value.fullValue,
    `${value.label}=${value.number}${value.unit}`,
    `${value.label} = ${value.number}${value.unit}`,
    `${value.number} ${value.unit}`,
    `${value.number}${value.unit}`
  ];

  return searchPatterns.some(pattern =>
    svgText.toLowerCase().includes(pattern.toLowerCase())
  );
}

// Find best position to add label in SVG
function findBestPosition(svgElement) {
  const bbox = svgElement.getAttribute('viewBox');
  if (bbox) {
    const [, , width, height] = bbox.split(' ').map(Number);
    // Return position in bottom-right area
    return { x: width * 0.7, y: height * 0.85 };
  }
  return { x: 500, y: 400 };
}

// Add missing value to SVG
function addValueToSVG(svgElement, doc, value, position) {
  const label = doc.createElementNS('http://www.w3.org/2000/svg', 'text');
  label.setAttribute('x', position.x.toString());
  label.setAttribute('y', position.y.toString());
  label.setAttribute('font-size', '12');
  label.setAttribute('fill', '#2c3e50');
  label.setAttribute('font-weight', 'bold');
  label.textContent = value.fullValue;
  svgElement.appendChild(label);
  return true;
}

function processQuestion(questionElement, doc) {
  // Find the question text
  const questionText = questionElement.textContent || '';

  // Find associated SVG
  let svgElement = null;
  let sibling = questionElement.nextElementSibling;
  let attempts = 0;

  while (sibling && attempts < 15) {
    if (sibling.tagName === 'svg') {
      svgElement = sibling;
      break;
    } else if (sibling.querySelector && sibling.querySelector('svg')) {
      svgElement = sibling.querySelector('svg');
      break;
    }

    // Stop if we hit another question
    if (sibling.textContent && sibling.textContent.match(/Question \d+:/)) {
      break;
    }

    sibling = sibling.nextElementSibling;
    attempts++;
  }

  if (!svgElement) {
    return { found: false, added: 0 };
  }

  // Extract values from question text
  const values = extractValues(questionText);
  const missingValues = values.filter(v => !valueExistsInSVG(svgElement, v));

  if (missingValues.length === 0) {
    return { found: true, added: 0, missing: 0 };
  }

  // Add missing values
  let added = 0;
  const position = findBestPosition(svgElement);

  missingValues.forEach((value, index) => {
    const yOffset = index * 18; // Stack vertically
    addValueToSVG(svgElement, doc, value, {
      x: position.x,
      y: position.y + yOffset
    });
    added++;
  });

  return { found: true, added, missing: missingValues.length, values: missingValues };
}

function processHTMLFile(filePath) {
  console.log(`\n${'='.repeat(70)}`);
  console.log(`Processing: ${path.basename(filePath)}`);
  console.log('='.repeat(70));

  const html = fs.readFileSync(filePath, 'utf8');
  const dom = new JSDOM(html);
  const doc = dom.window.document;

  // Find all question elements
  const allElements = Array.from(doc.querySelectorAll('*'));
  const questionElements = allElements.filter(el => {
    const text = el.textContent || '';
    return text.match(/^Question \d+:/);
  });

  console.log(`Found ${questionElements.length} questions`);

  let totalAdded = 0;
  let questionsWithSVG = 0;
  let questionsFixed = 0;

  questionElements.forEach((qElement, index) => {
    const qMatch = qElement.textContent.match(/Question (\d+):/);
    if (!qMatch) return;

    const qNum = qMatch[1];
    const result = processQuestion(qElement, doc);

    if (result.found) {
      questionsWithSVG++;
      if (result.added > 0) {
        questionsFixed++;
        console.log(`  Q${qNum}: Added ${result.added} missing value(s)`);
        result.values.forEach(v => {
          console.log(`    - ${v.fullValue}`);
        });
        totalAdded += result.added;
      }
    }
  });

  // Save to new file
  const outputPath = filePath.replace('.html', '_corrected.html');
  fs.writeFileSync(outputPath, dom.serialize());
  console.log(`\n✓ Saved to: ${path.basename(outputPath)}`);
  console.log(`  Questions with SVG: ${questionsWithSVG}`);
  console.log(`  Questions fixed: ${questionsFixed}`);
  console.log(`  Total values added: ${totalAdded}`);

  return { total: questionElements.length, fixed: questionsFixed, valuesAdded: totalAdded };
}

function main() {
  const exportDir = '/Users/Pramod/projects/iit-exams/jee-test-nextjs/physics_exports';

  const files = [
    'physics_questions_01_of_05.html',
    'physics_questions_02_of_05.html',
    'physics_questions_03_of_05.html',
    'physics_questions_04_of_05.html',
    'physics_questions_05_of_05.html'
  ];

  console.log('═'.repeat(70));
  console.log('AUTOMATIC SVG VALUE COMPLETER');
  console.log('═'.repeat(70));
  console.log('Scanning all questions and adding missing values to SVG diagrams');
  console.log('═'.repeat(70));

  let totalFixed = 0;
  let totalValuesAdded = 0;

  files.forEach(file => {
    const filePath = path.join(exportDir, file);
    if (fs.existsSync(filePath)) {
      const result = processHTMLFile(filePath);
      totalFixed += result.fixed;
      totalValuesAdded += result.valuesAdded;
    }
  });

  console.log('\n' + '═'.repeat(70));
  console.log('FINAL SUMMARY');
  console.log('═'.repeat(70));
  console.log(`Total questions fixed: ${totalFixed}`);
  console.log(`Total values added: ${totalValuesAdded}`);
  console.log('\n✓ All corrected files saved with "_corrected" suffix');
  console.log('═'.repeat(70));
}

if (require.main === module) {
  main();
}

module.exports = { extractValues, valueExistsInSVG, processQuestion };
