/**
 * Fix the 45° angle in Question 9
 * Ensure E∥ and E⊥ have equal lengths
 */

const fs = require('fs');
const { JSDOM } = require('jsdom');

function fix45DegreeAngle() {
  const inputFile = 'question_9_physics_full.html';
  const html = fs.readFileSync(inputFile, 'utf8');
  const dom = new JSDOM(html);
  const document = dom.window.document;
  const svgElement = document.querySelector('svg');

  if (!svgElement) {
    console.log('❌ No SVG found');
    return;
  }

  console.log('🔧 Fixing 45° Angle in Question 9\n');
  console.log('='.repeat(70) + '\n');

  // Find the E∥ and E⊥ vectors
  const lines = Array.from(svgElement.querySelectorAll('line'));

  const eParallel = lines.find(line => line.getAttribute('stroke') === 'green');
  const ePerpendicular = lines.find(line => line.getAttribute('stroke') === 'orange');

  if (!eParallel || !ePerpendicular) {
    console.log('❌ Could not find E∥ and E⊥ vectors');
    return;
  }

  // Get current coordinates
  const parallel = {
    x1: parseFloat(eParallel.getAttribute('x1')),
    y1: parseFloat(eParallel.getAttribute('y1')),
    x2: parseFloat(eParallel.getAttribute('x2')),
    y2: parseFloat(eParallel.getAttribute('y2'))
  };

  const perpendicular = {
    x1: parseFloat(ePerpendicular.getAttribute('x1')),
    y1: parseFloat(ePerpendicular.getAttribute('y1')),
    x2: parseFloat(ePerpendicular.getAttribute('x2')),
    y2: parseFloat(ePerpendicular.getAttribute('y2'))
  };

  // Calculate current lengths
  const parallelLength = Math.abs(parallel.x2 - parallel.x1);
  const perpendicularLength = Math.abs(perpendicular.y2 - perpendicular.y1);

  console.log('📊 Current State:\n');
  console.log(`  E∥ (green):  ${parallel.x1},${parallel.y1} → ${parallel.x2},${parallel.y2}`);
  console.log(`  Length: ${parallelLength}px`);
  console.log();
  console.log(`  E⊥ (orange): ${perpendicular.x1},${perpendicular.y1} → ${perpendicular.x2},${perpendicular.y2}`);
  console.log(`  Length: ${perpendicularLength}px`);
  console.log();

  const currentAngle = Math.atan2(perpendicularLength, parallelLength) * 180 / Math.PI;
  console.log(`  Current angle with rod: ${currentAngle.toFixed(1)}°`);
  console.log(`  Target angle: 45.0°\n`);

  // Fix: Use average length for both
  const targetLength = 70; // Good visual length

  // Update E∥ (horizontal from P)
  eParallel.setAttribute('x2', (parallel.x1 + targetLength).toString());

  // Update E⊥ (vertical from P, going up)
  ePerpendicular.setAttribute('y2', (perpendicular.y1 - targetLength).toString());

  console.log('✅ Applied Fixes:\n');
  console.log(`  E∥: Extended to length ${targetLength}px (x2 = ${parallel.x1 + targetLength})`);
  console.log(`  E⊥: Extended to length ${targetLength}px (y2 = ${perpendicular.y1 - targetLength})`);
  console.log();

  // Verify
  const newAngle = Math.atan2(targetLength, targetLength) * 180 / Math.PI;
  console.log(`  New angle with rod: ${newAngle.toFixed(1)}° ✓\n`);

  // Adjust text labels if needed
  const textElements = Array.from(svgElement.querySelectorAll('text'));

  // Move "E∥" label to center of new vector
  const eParallelText = textElements.find(t => t.textContent.includes('E∥') && t.getAttribute('fill') === 'green');
  if (eParallelText) {
    const newX = parallel.x1 + targetLength / 2 - 10;
    eParallelText.setAttribute('x', newX.toString());
    console.log(`  Adjusted E∥ label position to x=${newX}`);
  }

  // Move "(parallel to rod)" label
  const parallelText = textElements.find(t => t.textContent.includes('parallel to rod'));
  if (parallelText) {
    const newX = parallel.x1 + targetLength / 2 - 20;
    parallelText.setAttribute('x', newX.toString());
    console.log(`  Adjusted "(parallel to rod)" label position`);
  }

  // Save
  const outputFile = 'question_9_physics_45_degree_fixed.html';
  fs.writeFileSync(outputFile, document.documentElement.outerHTML, 'utf8');

  console.log(`\n📁 Saved to: ${outputFile}`);
  console.log('\n' + '='.repeat(70));
}

fix45DegreeAngle();
