const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

/**
 * Fixes for specific questions identified in the review
 */
const fixes = {
  // Question 10: Add radius and height labels to cylindrical container
  question_10: (svgElement, doc) => {
    console.log('  Fixing Question 10: Adding r = 0.20 m and h = 10 cm labels');

    // Find text elements to add the missing labels near
    const texts = svgElement.querySelectorAll('text');

    // Add radius label
    const radiusLabel = doc.createElementNS('http://www.w3.org/2000/svg', 'text');
    radiusLabel.setAttribute('x', '450');
    radiusLabel.setAttribute('y', '360');
    radiusLabel.setAttribute('text-anchor', 'middle');
    radiusLabel.setAttribute('font-size', '14');
    radiusLabel.setAttribute('fill', '#2c3e50');
    radiusLabel.setAttribute('font-weight', 'bold');
    radiusLabel.textContent = 'r = 0.20 m';
    svgElement.appendChild(radiusLabel);

    // Add height label
    const heightLabel = doc.createElementNS('http://www.w3.org/2000/svg', 'text');
    heightLabel.setAttribute('x', '220');
    heightLabel.setAttribute('y', '250');
    heightLabel.setAttribute('text-anchor', 'middle');
    heightLabel.setAttribute('font-size', '14');
    heightLabel.setAttribute('fill', '#e74c3c');
    heightLabel.setAttribute('font-weight', 'bold');
    heightLabel.textContent = 'h = 10 cm';
    svgElement.appendChild(heightLabel);

    return true;
  },

  // Question 14: Add capacitance values to all four capacitors
  question_14: (svgElement, doc) => {
    console.log('  Fixing Question 14: Adding C₁, C₂, C₃, C₄ values');

    // The capacitors are arranged in the circuit - we need to find their positions
    // and add labels below each one
    const capacitanceValues = [
      { label: 'C₁ = 1.00 μF', x: 200, y: 180, color: '#3498db' },
      { label: 'C₂ = 2.00 μF', x: 400, y: 180, color: '#27ae60' },
      { label: 'C₃ = 3.00 μF', x: 200, y: 320, color: '#9b59b6' },
      { label: 'C₄ = 4.00 μF', x: 400, y: 320, color: '#e67e22' }
    ];

    capacitanceValues.forEach(cap => {
      const label = doc.createElementNS('http://www.w3.org/2000/svg', 'text');
      label.setAttribute('x', cap.x.toString());
      label.setAttribute('y', cap.y.toString());
      label.setAttribute('text-anchor', 'middle');
      label.setAttribute('font-size', '13');
      label.setAttribute('fill', cap.color);
      label.setAttribute('font-weight', 'bold');
      label.textContent = cap.label;
      svgElement.appendChild(label);
    });

    return true;
  },

  // Question 7: Add radius labels to both spheres
  question_7: (svgElement, doc) => {
    console.log('  Fixing Question 7: Adding R₁ = 0.500 m and R₂ = 1.00 m labels');

    // Add R₁ label for first sphere
    const r1Label = doc.createElementNS('http://www.w3.org/2000/svg', 'text');
    r1Label.setAttribute('x', '225');
    r1Label.setAttribute('y', '320');
    r1Label.setAttribute('text-anchor', 'middle');
    r1Label.setAttribute('font-size', '13');
    r1Label.setAttribute('fill', '#2c3e50');
    r1Label.setAttribute('font-weight', 'bold');
    r1Label.textContent = 'R₁ = 0.500 m';
    svgElement.appendChild(r1Label);

    // Add R₂ label for second sphere
    const r2Label = doc.createElementNS('http://www.w3.org/2000/svg', 'text');
    r2Label.setAttribute('x', '575');
    r2Label.setAttribute('y', '320');
    r2Label.setAttribute('text-anchor', 'middle');
    r2Label.setAttribute('font-size', '13');
    r2Label.setAttribute('fill', '#2c3e50');
    r2Label.setAttribute('font-weight', 'bold');
    r2Label.textContent = 'R₂ = 1.00 m';
    svgElement.appendChild(r2Label);

    return true;
  },

  // Question 29: Add 0.30 m dimension between geometric center and COM
  question_29: (svgElement, doc) => {
    console.log('  Fixing Question 29: Adding 0.30 m dimension label');

    // Add dimension line showing 0.30 m from geometric center to COM
    const dimLine = doc.createElementNS('http://www.w3.org/2000/svg', 'line');
    dimLine.setAttribute('x1', '450');
    dimLine.setAttribute('y1', '180');
    dimLine.setAttribute('x2', '450');
    dimLine.setAttribute('y2', '120');
    dimLine.setAttribute('stroke', '#9b59b6');
    dimLine.setAttribute('stroke-width', '2');
    dimLine.setAttribute('stroke-dasharray', '5,5');
    svgElement.appendChild(dimLine);

    // Add label
    const label = doc.createElementNS('http://www.w3.org/2000/svg', 'text');
    label.setAttribute('x', '470');
    label.setAttribute('y', '150');
    label.setAttribute('font-size', '12');
    label.setAttribute('fill', '#9b59b6');
    label.setAttribute('font-weight', 'bold');
    label.textContent = '0.30 m';
    svgElement.appendChild(label);

    return true;
  }
};

function findQuestionNumber(element) {
  // Search upward in DOM to find question number
  let current = element;
  while (current) {
    const text = current.textContent || '';
    const match = text.match(/Question (\d+):/);
    if (match) {
      return parseInt(match[1]);
    }
    current = current.parentElement;
  }
  return null;
}

function findSVGForQuestion(doc, questionNumber) {
  // Find all h3 or h2 tags with question numbers
  const headings = doc.querySelectorAll('h2, h3, h4, div');

  for (let heading of headings) {
    const text = heading.textContent;
    if (text.includes(`Question ${questionNumber}:`)) {
      // Found the question, now look for SVG after this element
      let sibling = heading.nextElementSibling;
      while (sibling) {
        if (sibling.tagName === 'svg' || sibling.querySelector('svg')) {
          const svg = sibling.tagName === 'svg' ? sibling : sibling.querySelector('svg');
          return svg;
        }
        // Don't go too far - stop if we hit another question
        if (sibling.textContent.includes('Question ')) {
          break;
        }
        sibling = sibling.nextElementSibling;
      }
    }
  }
  return null;
}

function processHTMLFile(filePath, questionFixes) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`Processing: ${path.basename(filePath)}`);
  console.log('='.repeat(60));

  const html = fs.readFileSync(filePath, 'utf8');
  const dom = new JSDOM(html);
  const doc = dom.window.document;

  let fixedCount = 0;

  questionFixes.forEach(({ questionNum, fixFunc }) => {
    console.log(`\nLooking for Question ${questionNum}...`);
    const svg = findSVGForQuestion(doc, questionNum);

    if (svg) {
      console.log(`  ✓ Found SVG for Question ${questionNum}`);
      if (fixFunc(svg, doc)) {
        fixedCount++;
        console.log(`  ✓ Applied fix successfully`);
      }
    } else {
      console.log(`  ⚠ Could not locate SVG for Question ${questionNum}`);
    }
  });

  // Write back to file
  fs.writeFileSync(filePath, dom.serialize());
  console.log(`\n✓ Updated ${path.basename(filePath)}`);
  console.log(`  ${fixedCount} diagram(s) fixed`);

  return fixedCount;
}

function main() {
  const exportDir = '/Users/Pramod/projects/iit-exams/jee-test-nextjs/physics_exports';

  console.log('SVG Diagram Fixer');
  console.log('='.repeat(60));
  console.log('Adding missing information to physics question diagrams');
  console.log('='.repeat(60));

  const fileFixMap = {
    'physics_questions_01_of_05.html': [
      { questionNum: 10, fixFunc: fixes.question_10 },
      { questionNum: 14, fixFunc: fixes.question_14 },
      { questionNum: 7, fixFunc: fixes.question_7 }
    ],
    'physics_questions_02_of_05.html': [
      { questionNum: 29, fixFunc: fixes.question_29 }
    ]
  };

  let totalFixed = 0;

  Object.entries(fileFixMap).forEach(([filename, questionFixes]) => {
    const filePath = path.join(exportDir, filename);
    if (fs.existsSync(filePath)) {
      const fixed = processHTMLFile(filePath, questionFixes);
      totalFixed += fixed;
    } else {
      console.log(`\n⚠ File not found: ${filename}`);
    }
  });

  console.log('\n' + '='.repeat(60));
  console.log('SUMMARY');
  console.log('='.repeat(60));
  console.log(`Total diagrams fixed: ${totalFixed}`);
  console.log('='.repeat(60));
}

// Run the script
if (require.main === module) {
  main();
}

module.exports = { fixes, findSVGForQuestion };
