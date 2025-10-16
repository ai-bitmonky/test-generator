const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

/**
 * Comprehensive SVG fixes for all identified issues
 */

// Helper function to add text label to SVG
function addTextLabel(svgElement, doc, x, y, text, options = {}) {
  const label = doc.createElementNS('http://www.w3.org/2000/svg', 'text');
  label.setAttribute('x', x.toString());
  label.setAttribute('y', y.toString());
  label.setAttribute('text-anchor', options.anchor || 'middle');
  label.setAttribute('font-size', options.fontSize || '13');
  label.setAttribute('fill', options.color || '#2c3e50');
  label.setAttribute('font-weight', options.weight || 'bold');
  if (options.fontStyle) label.setAttribute('font-style', options.fontStyle);
  label.textContent = text;
  svgElement.appendChild(label);
  return label;
}

// Helper function to replace text content in SVG
function replaceTextInSVG(svgElement, oldText, newText) {
  const texts = svgElement.querySelectorAll('text, tspan');
  let replaced = false;
  texts.forEach(text => {
    if (text.textContent.includes(oldText)) {
      text.textContent = text.textContent.replace(oldText, newText);
      replaced = true;
    }
  });
  return replaced;
}

const fixes = {
  // CRITICAL: Q36 - Wrong radius value
  question_36: (svgElement, doc) => {
    console.log('  CRITICAL FIX: Changing r = 0.20 m to r = 1.0 cm');
    const replaced = replaceTextInSVG(svgElement, 'r = 0.20 m', 'r = 1.0 cm');
    if (!replaced) {
      // If not found, add it
      addTextLabel(svgElement, doc, 400, 350, 'r = 1.0 cm', { color: '#e74c3c' });
    }
    return true;
  },

  // Q14 - Add all capacitor values (already attempted, verify)
  question_14_enhanced: (svgElement, doc) => {
    console.log('  Adding all capacitor values to circuit');
    // Enhanced positions based on typical circuit layout
    const caps = [
      { label: 'C₁ = 1.00 μF', x: 180, y: 200, color: '#3498db' },
      { label: 'C₂ = 2.00 μF', x: 420, y: 200, color: '#27ae60' },
      { label: 'C₃ = 3.00 μF', x: 180, y: 340, color: '#9b59b6' },
      { label: 'C₄ = 4.00 μF', x: 420, y: 340, color: '#e67e22' }
    ];

    caps.forEach(cap => {
      addTextLabel(svgElement, doc, cap.x, cap.y, cap.label, {
        color: cap.color,
        fontSize: '12'
      });
    });
    return true;
  },

  // Q31 - Add disk radius and distance
  question_31: (svgElement, doc) => {
    console.log('  Adding disk radius R = 64.0 cm and distance D = 25.9 cm');
    addTextLabel(svgElement, doc, 400, 380, 'R = 64.0 cm', { color: '#3498db' });
    addTextLabel(svgElement, doc, 500, 150, 'D = 25.9 cm', { color: '#e74c3c' });
    return true;
  },

  // Q11 - Add cylinder dimensions
  question_11: (svgElement, doc) => {
    console.log('  Adding cylinder radius r = 0.20 m and height h = 10 cm');
    addTextLabel(svgElement, doc, 450, 360, 'r = 0.20 m');
    addTextLabel(svgElement, doc, 220, 250, 'h = 10 cm', { color: '#e74c3c' });
    return true;
  },

  // Q12 - Add plate separation
  question_12: (svgElement, doc) => {
    console.log('  Adding plate separation d = 7.12 mm');
    addTextLabel(svgElement, doc, 400, 250, 'd = 7.12 mm', { fontSize: '12' });
    return true;
  },

  // Q16 - Add capacitor values
  question_16: (svgElement, doc) => {
    console.log('  Adding C₁ = 2.00 μF and C₂ = 8.00 μF');
    addTextLabel(svgElement, doc, 250, 280, 'C₁ = 2.00 μF', { color: '#3498db', fontSize: '12' });
    addTextLabel(svgElement, doc, 450, 280, 'C₂ = 8.00 μF', { color: '#27ae60', fontSize: '12' });
    return true;
  },

  // Q20 & Q23 - Add particle separation
  question_20: (svgElement, doc) => {
    console.log('  Adding separation d = 4.0 cm');
    addTextLabel(svgElement, doc, 400, 250, 'd = 4.0 cm', { fontSize: '12' });
    return true;
  },

  question_23: (svgElement, doc) => {
    console.log('  Adding separation d = 4.0 cm');
    addTextLabel(svgElement, doc, 400, 250, 'd = 4.0 cm', { fontSize: '12' });
    return true;
  },

  // Q26 & Q35 - Add distances
  question_26: (svgElement, doc) => {
    console.log('  Adding distance d = 1.40 cm');
    addTextLabel(svgElement, doc, 400, 300, 'd = 1.40 cm', { fontSize: '12' });
    return true;
  },

  question_35: (svgElement, doc) => {
    console.log('  Adding distance d = 1.40 cm');
    addTextLabel(svgElement, doc, 400, 300, 'd = 1.40 cm', { fontSize: '12' });
    return true;
  },

  // Q37 - Add charge values
  question_37: (svgElement, doc) => {
    console.log('  Adding q₁ = 3.40 pC and q₂ = 6.00 pC');
    addTextLabel(svgElement, doc, 250, 200, 'q₁ = 3.40 pC', { color: '#e74c3c', fontSize: '11' });
    addTextLabel(svgElement, doc, 550, 200, 'q₂ = 6.00 pC', { color: '#3498db', fontSize: '11' });
    return true;
  },

  // Q41 - Add sphere radius
  question_41: (svgElement, doc) => {
    console.log('  Adding sphere radius r = 1.0 cm');
    addTextLabel(svgElement, doc, 400, 350, 'r = 1.0 cm', { fontSize: '12' });
    return true;
  },

  // Q42 - Add ring radius
  question_42: (svgElement, doc) => {
    console.log('  Adding ring radius R = 8.20 cm');
    addTextLabel(svgElement, doc, 400, 380, 'R = 8.20 cm', { color: '#3498db' });
    return true;
  },

  // Q109 - Add height and distance
  question_109: (svgElement, doc) => {
    console.log('  Adding h = 0.10 m and d = 0.506 m');
    addTextLabel(svgElement, doc, 200, 150, 'h = 0.10 m', { fontSize: '11' });
    addTextLabel(svgElement, doc, 500, 350, 'd = 0.506 m', { fontSize: '11' });
    return true;
  },

  // Q119 - Add rod length, mass, and angle
  question_119: (svgElement, doc) => {
    console.log('  Adding L = 0.500 m, M = 4.00 kg, θ = 60.0°');
    addTextLabel(svgElement, doc, 300, 250, 'L = 0.500 m', { fontSize: '11' });
    addTextLabel(svgElement, doc, 300, 200, 'M = 4.00 kg', { fontSize: '11' });
    addTextLabel(svgElement, doc, 450, 150, 'θ = 60.0°', { fontSize: '11', color: '#e67e22' });
    return true;
  },

  // Q171 & Q182 - Add shell and pulley dimensions
  question_171: (svgElement, doc) => {
    console.log('  Adding M = 4.5 kg, R = 8.5 cm, r = 5.0 cm, m = 0.60 kg');
    addTextLabel(svgElement, doc, 300, 200, 'M = 4.5 kg', { fontSize: '11' });
    addTextLabel(svgElement, doc, 300, 220, 'R = 8.5 cm', { fontSize: '11', color: '#3498db' });
    addTextLabel(svgElement, doc, 450, 250, 'r = 5.0 cm', { fontSize: '11', color: '#e67e22' });
    addTextLabel(svgElement, doc, 550, 350, 'm = 0.60 kg', { fontSize: '11' });
    return true;
  },

  question_182: (svgElement, doc) => {
    console.log('  Adding M = 4.5 kg, R = 8.5 cm, r = 5.0 cm, m = 0.60 kg');
    addTextLabel(svgElement, doc, 300, 200, 'M = 4.5 kg', { fontSize: '11' });
    addTextLabel(svgElement, doc, 300, 220, 'R = 8.5 cm', { fontSize: '11', color: '#3498db' });
    addTextLabel(svgElement, doc, 450, 250, 'r = 5.0 cm', { fontSize: '11', color: '#e67e22' });
    addTextLabel(svgElement, doc, 550, 350, 'm = 0.60 kg', { fontSize: '11' });
    return true;
  },

  // Q194 - Add loop radius
  question_194: (svgElement, doc) => {
    console.log('  Adding loop radius r = 0.48 m');
    addTextLabel(svgElement, doc, 500, 250, 'r = 0.48 m', { color: '#9b59b6' });
    return true;
  }
};

function findSVGForQuestion(doc, questionNumber) {
  // Try multiple strategies to find the SVG

  // Strategy 1: Look for heading with question number
  const allElements = doc.querySelectorAll('*');
  for (let elem of allElements) {
    const text = elem.textContent;
    if (text && text.match(new RegExp(`Question\\s+${questionNumber}:`))) {
      // Found question, now look for SVG nearby
      let sibling = elem.nextElementSibling;
      let attempts = 0;
      while (sibling && attempts < 20) {
        if (sibling.tagName === 'svg' || sibling.querySelector('svg')) {
          return sibling.tagName === 'svg' ? sibling : sibling.querySelector('svg');
        }
        // Stop if we hit another question
        if (sibling.textContent && sibling.textContent.includes('Question ')) {
          break;
        }
        sibling = sibling.nextElementSibling;
        attempts++;
      }
    }
  }

  return null;
}

function processHTMLFile(filePath, questionFixes) {
  console.log(`\n${'='.repeat(70)}`);
  console.log(`Processing: ${path.basename(filePath)}`);
  console.log('='.repeat(70));

  const html = fs.readFileSync(filePath, 'utf8');
  const dom = new JSDOM(html);
  const doc = dom.window.document;

  let fixedCount = 0;

  questionFixes.forEach(({ questionNum, fixFunc }) => {
    console.log(`\nSearching for Question ${questionNum}...`);
    const svg = findSVGForQuestion(doc, questionNum);

    if (svg) {
      console.log(`  ✓ Found SVG for Question ${questionNum}`);
      try {
        if (fixFunc(svg, doc)) {
          fixedCount++;
          console.log(`  ✓ Successfully applied fix`);
        }
      } catch (err) {
        console.log(`  ⚠ Error applying fix: ${err.message}`);
      }
    } else {
      console.log(`  ⚠ Could not locate SVG for Question ${questionNum}`);
    }
  });

  // Save to new file with _corrected suffix
  const outputPath = filePath.replace('.html', '_corrected.html');
  fs.writeFileSync(outputPath, dom.serialize());
  console.log(`\n✓ Saved corrected version to: ${path.basename(outputPath)}`);
  console.log(`  ${fixedCount} diagram(s) fixed`);

  return fixedCount;
}

function main() {
  const exportDir = '/Users/Pramod/projects/iit-exams/jee-test-nextjs/physics_exports';

  console.log('═'.repeat(70));
  console.log('COMPREHENSIVE SVG DIAGRAM FIXER');
  console.log('═'.repeat(70));
  console.log('Fixing all critical and high-priority SVG diagram issues');
  console.log('Creating new corrected HTML files with _corrected suffix');
  console.log('═'.repeat(70));

  const fileFixMap = {
    'physics_questions_01_of_05.html': [
      { questionNum: 36, fixFunc: fixes.question_36 },      // CRITICAL: wrong value
      { questionNum: 14, fixFunc: fixes.question_14_enhanced },
      { questionNum: 31, fixFunc: fixes.question_31 },
      { questionNum: 11, fixFunc: fixes.question_11 },
      { questionNum: 12, fixFunc: fixes.question_12 },
      { questionNum: 16, fixFunc: fixes.question_16 },
      { questionNum: 20, fixFunc: fixes.question_20 },
      { questionNum: 23, fixFunc: fixes.question_23 },
      { questionNum: 26, fixFunc: fixes.question_26 },
      { questionNum: 35, fixFunc: fixes.question_35 },
      { questionNum: 37, fixFunc: fixes.question_37 },
      { questionNum: 41, fixFunc: fixes.question_41 },
      { questionNum: 42, fixFunc: fixes.question_42 }
    ],
    'physics_questions_03_of_05.html': [
      { questionNum: 109, fixFunc: fixes.question_109 },
      { questionNum: 119, fixFunc: fixes.question_119 }
    ],
    'physics_questions_04_of_05.html': [
      { questionNum: 171, fixFunc: fixes.question_171 },
      { questionNum: 182, fixFunc: fixes.question_182 },
      { questionNum: 194, fixFunc: fixes.question_194 }
    ]
  };

  let totalFixed = 0;
  const results = {};

  Object.entries(fileFixMap).forEach(([filename, questionFixes]) => {
    const filePath = path.join(exportDir, filename);
    if (fs.existsSync(filePath)) {
      const fixed = processHTMLFile(filePath, questionFixes);
      totalFixed += fixed;
      results[filename] = { attempted: questionFixes.length, fixed };
    } else {
      console.log(`\n⚠ File not found: ${filename}`);
      results[filename] = { attempted: 0, fixed: 0 };
    }
  });

  console.log('\n' + '═'.repeat(70));
  console.log('FINAL SUMMARY');
  console.log('═'.repeat(70));
  console.log(`Total diagrams fixed: ${totalFixed}`);
  console.log('\nResults by file:');
  Object.entries(results).forEach(([file, stats]) => {
    console.log(`  ${file}: ${stats.fixed}/${stats.attempted} fixes applied`);
  });
  console.log('\n✓ New corrected HTML files created with "_corrected" suffix');
  console.log('═'.repeat(70));
}

if (require.main === module) {
  main();
}

module.exports = { fixes, findSVGForQuestion, addTextLabel };
