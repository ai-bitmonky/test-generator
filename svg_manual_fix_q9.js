/**
 * Manual SVG fixes for Question 9
 * Addresses specific overlapping text issues
 */

const fs = require('fs');
const { JSDOM } = require('jsdom');

function fixQuestion9SVG() {
  const inputFile = 'question_9_physics_full.html';
  const html = fs.readFileSync(inputFile, 'utf8');
  const dom = new JSDOM(html);
  const document = dom.window.document;
  const svgElement = document.querySelector('svg');

  if (!svgElement) {
    console.log('❌ No SVG found');
    return;
  }

  console.log('🔧 Applying manual fixes to Question 9 SVG...\n');

  // Get all text elements
  const textElements = Array.from(svgElement.querySelectorAll('text'));

  // Identify specific overlapping text
  const fixes = [];

  textElements.forEach((text, idx) => {
    const content = text.textContent.trim();
    const x = parseFloat(text.getAttribute('x') || 0);
    const y = parseFloat(text.getAttribute('y') || 0);

    // Fix 1: "O (0,0)" label - move slightly left
    if (content.includes('O (0,0)')) {
      text.setAttribute('x', '60');
      text.setAttribute('y', '300');
      fixes.push(`Moved origin label to avoid overlap with axes`);
    }

    // Fix 2: "Uniform charge density λ" - move down
    else if (content.includes('Uniform charge density')) {
      text.setAttribute('y', '315');
      fixes.push(`Moved "Uniform charge density λ" label down`);
    }

    // Fix 3: "(parallel to rod)" - adjust position
    else if (content.includes('parallel to rod')) {
      text.setAttribute('y', '175');
      fixes.push(`Moved "(parallel to rod)" text down`);
    }

    // Fix 4: "E∥" - ensure it doesn't overlap with other elements
    else if (content.includes('E∥')) {
      text.setAttribute('x', '130');
      text.setAttribute('y', '135');
      fixes.push(`Adjusted E∥ position`);
    }

    // Fix 5: "(perpendicular)" label
    else if (content.includes('perpendicular')) {
      text.setAttribute('x', '115');
      fixes.push(`Moved "(perpendicular)" label right`);
    }

    // Fix 6: "Rod (extends to +∞)" - move up
    else if (content.includes('Rod (extends')) {
      text.setAttribute('y', '260');
      fixes.push(`Moved "Rod extends" label up`);
    }
  });

  // Fix overlapping boxes
  const rects = Array.from(svgElement.querySelectorAll('rect'));

  rects.forEach((rect) => {
    const fill = rect.getAttribute('fill');
    const y = parseFloat(rect.getAttribute('y') || 0);
    const height = parseFloat(rect.getAttribute('height') || 0);

    // Result box - move right to avoid field vectors
    if (fill === '#E6F3FF') {
      rect.setAttribute('x', '320');
      rect.setAttribute('y', '85');
      fixes.push(`Moved Result box right and up`);

      // Adjust text inside result box
      textElements.forEach(text => {
        const tx = parseFloat(text.getAttribute('x') || 0);
        const ty = parseFloat(text.getAttribute('y') || 0);

        if (tx >= 300 && tx <= 580 && ty >= 85 && ty <= 190) {
          text.setAttribute('x', (tx + 20).toString());
          text.setAttribute('y', (ty - 5).toString());
        }
      });
    }

    // Hint box - ensure it doesn't overlap with axes
    if (fill === '#FFF9E6') {
      const currentY = parseFloat(rect.getAttribute('y') || 0);
      if (currentY < 320) {
        rect.setAttribute('y', '320');
        fixes.push(`Moved Hint box down`);

        // Adjust text inside hint box
        textElements.forEach(text => {
          const tx = parseFloat(text.getAttribute('x') || 0);
          const ty = parseFloat(text.getAttribute('y') || 0);

          if (tx >= 50 && tx <= 560 && ty >= 320 && ty <= 390) {
            const newY = ty + (320 - currentY);
            text.setAttribute('y', newY.toString());
          }
        });
      }
    }
  });

  // Add spacing to reduce overlaps
  console.log(`\n✅ Applied ${fixes.length} fixes:\n`);
  fixes.forEach((fix, idx) => {
    console.log(`  ${idx + 1}. ${fix}`);
  });

  // Increase SVG height to accommodate changes
  svgElement.setAttribute('height', '420');
  svgElement.setAttribute('viewBox', '0 0 600 420');
  fixes.push('Increased SVG height to 420');

  // Save corrected version
  const outputFile = 'question_9_physics_fixed_manual.html';
  fs.writeFileSync(outputFile, document.documentElement.outerHTML, 'utf8');

  console.log(`\n📁 Saved to: ${outputFile}`);
  console.log(`\n🎨 Total fixes applied: ${fixes.length}`);
}

fixQuestion9SVG();
