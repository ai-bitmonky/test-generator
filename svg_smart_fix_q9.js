/**
 * Smart SVG fixer for physics diagrams
 * Only fixes actual readability problems, not intentional overlaps
 */

const fs = require('fs');
const { JSDOM } = require('jsdom');

function analyzeSVG(svgElement) {
  console.log('🔍 Analyzing SVG for readability issues...\n');

  const textElements = Array.from(svgElement.querySelectorAll('text'));
  const issues = [];

  // Build bounding boxes for all text
  const textBoxes = textElements.map((text, idx) => {
    const x = parseFloat(text.getAttribute('x') || 0);
    const y = parseFloat(text.getAttribute('y') || 0);
    const fontSize = parseFloat(text.getAttribute('font-size') || 12);
    const content = text.textContent.trim();
    const width = content.length * fontSize * 0.6;
    const height = fontSize * 1.2;

    return {
      element: text,
      index: idx,
      content: content,
      x, y, width, height,
      x2: x + width,
      y2: y + height * 0.2,
      y1: y - height * 0.8
    };
  });

  // Check text-text overlaps
  for (let i = 0; i < textBoxes.length; i++) {
    for (let j = i + 1; j < textBoxes.length; j++) {
      const box1 = textBoxes[i];
      const box2 = textBoxes[j];

      const xOverlap = Math.max(0, Math.min(box1.x2, box2.x2) - Math.max(box1.x, box2.x));
      const yOverlap = Math.max(0, Math.min(box1.y2, box2.y2) - Math.max(box1.y1, box2.y1));

      const overlapArea = xOverlap * yOverlap;

      if (overlapArea > 20) {
        issues.push({
          type: 'text-text-overlap',
          element1: box1,
          element2: box2,
          overlapArea,
          severity: overlapArea > 100 ? 'high' : overlapArea > 50 ? 'medium' : 'low'
        });
      }
    }
  }

  // Check if text boxes overlap with coordinate axes or diagram elements
  const lines = Array.from(svgElement.querySelectorAll('line'));
  const rects = Array.from(svgElement.querySelectorAll('rect'));

  rects.forEach((rect, rectIdx) => {
    const rx = parseFloat(rect.getAttribute('x') || 0);
    const ry = parseFloat(rect.getAttribute('y') || 0);
    const rw = parseFloat(rect.getAttribute('width') || 0);
    const rh = parseFloat(rect.getAttribute('height') || 0);

    // Check if rect overlaps significantly with main diagram elements
    textBoxes.forEach(box => {
      const xOverlap = Math.max(0, Math.min(rx + rw, box.x2) - Math.max(rx, box.x));
      const yOverlap = Math.max(0, Math.min(ry + rh, box.y2) - Math.max(ry, box.y1));
      const overlapArea = xOverlap * yOverlap;

      if (overlapArea > 50) {
        issues.push({
          type: 'rect-text-overlap',
          rect: rect,
          rectIndex: rectIdx,
          text: box,
          overlapArea,
          severity: overlapArea > 200 ? 'high' : 'medium'
        });
      }
    });
  });

  return issues;
}

function fixReadabilityIssues(svgElement, issues) {
  console.log(`📋 Found ${issues.length} readability issues\n`);

  const fixes = [];

  // Group issues by type
  const textOverlaps = issues.filter(i => i.type === 'text-text-overlap');
  const rectOverlaps = issues.filter(i => i.type === 'rect-text-overlap');

  console.log(`  - Text-text overlaps: ${textOverlaps.length}`);
  console.log(`  - Rect-text overlaps: ${rectOverlaps.length}\n`);

  // Fix high severity text overlaps
  const processedTexts = new Set();

  textOverlaps
    .filter(issue => issue.severity === 'high' || issue.severity === 'medium')
    .forEach((issue, idx) => {
      const box1 = issue.element1;
      const box2 = issue.element2;

      // Decide which one to move (prefer moving shorter text)
      const moveBox = box1.content.length < box2.content.length ? box1 : box2;

      if (processedTexts.has(moveBox.index)) {
        return; // Already moved this text
      }

      const elem = moveBox.element;
      const currentX = parseFloat(elem.getAttribute('x'));
      const currentY = parseFloat(elem.getAttribute('y'));

      // Determine best direction to move
      // If overlap is horizontal, move vertically; if vertical, move horizontally
      const xOverlap = Math.min(box1.x2, box2.x2) - Math.max(box1.x, box2.x);
      const yOverlap = Math.min(box1.y2, box2.y2) - Math.max(box1.y1, box2.y1);

      if (xOverlap > yOverlap) {
        // More horizontal overlap - move vertically
        const direction = box1.y < box2.y ? -1 : 1;
        elem.setAttribute('y', (currentY + direction * 20).toString());
        fixes.push(`Moved text "${moveBox.content.substring(0, 30)}..." vertically by ${direction * 20}px`);
      } else {
        // More vertical overlap - move horizontally
        const direction = box1.x < box2.x ? -1 : 1;
        elem.setAttribute('x', (currentX + direction * 15).toString());
        fixes.push(`Moved text "${moveBox.content.substring(0, 30)}..." horizontally by ${direction * 15}px`);
      }

      processedTexts.add(moveBox.index);
    });

  // Fix rect-text overlaps by moving rects slightly
  const processedRects = new Set();

  rectOverlaps
    .filter(issue => issue.severity === 'high')
    .forEach(issue => {
      if (processedRects.has(issue.rectIndex)) return;

      const rect = issue.rect;
      const currentX = parseFloat(rect.getAttribute('x') || 0);
      const currentY = parseFloat(rect.getAttribute('y') || 0);

      // Move rect right and up slightly
      rect.setAttribute('x', (currentX + 10).toString());
      rect.setAttribute('y', (currentY - 5).toString());

      fixes.push(`Moved rect at (${currentX}, ${currentY}) to avoid text overlap`);
      processedRects.add(issue.rectIndex);

      // Move text inside rect
      const fill = rect.getAttribute('fill');
      const rx = currentX;
      const ry = currentY;
      const rw = parseFloat(rect.getAttribute('width') || 0);
      const rh = parseFloat(rect.getAttribute('height') || 0);

      const textElements = Array.from(svgElement.querySelectorAll('text'));
      textElements.forEach(text => {
        const tx = parseFloat(text.getAttribute('x') || 0);
        const ty = parseFloat(text.getAttribute('y') || 0);

        // Check if text is inside rect
        if (tx >= rx && tx <= rx + rw && ty >= ry && ty <= ry + rh) {
          text.setAttribute('x', (tx + 10).toString());
          text.setAttribute('y', (ty - 5).toString());
        }
      });
    });

  return fixes;
}

function main() {
  const inputFile = 'question_9_physics_full.html';
  const html = fs.readFileSync(inputFile, 'utf8');
  const dom = new JSDOM(html);
  const document = dom.window.document;
  const svgElement = document.querySelector('svg');

  if (!svgElement) {
    console.log('❌ No SVG found');
    return;
  }

  console.log('🎨 Smart SVG Fix for Question 9\n');
  console.log('='.repeat(70) + '\n');

  // Analyze
  const issues = analyzeSVG(svgElement);

  if (issues.length === 0) {
    console.log('✅ No readability issues found!\n');
    return;
  }

  // Show details
  console.log('📊 Issue Details:\n');
  issues.forEach((issue, idx) => {
    if (issue.type === 'text-text-overlap') {
      console.log(`  ${idx + 1}. Text overlap (${issue.severity}):`);
      console.log(`     "${issue.element1.content.substring(0, 30)}..." ↔ "${issue.element2.content.substring(0, 30)}..."`);
      console.log(`     Overlap area: ${issue.overlapArea.toFixed(1)}px²\n`);
    } else if (issue.type === 'rect-text-overlap') {
      console.log(`  ${idx + 1}. Box-text overlap (${issue.severity}):`);
      console.log(`     Rect[${issue.rectIndex}] ↔ "${issue.text.content.substring(0, 30)}..."`);
      console.log(`     Overlap area: ${issue.overlapArea.toFixed(1)}px²\n`);
    }
  });

  // Fix
  console.log('🔧 Applying fixes...\n');
  const fixes = fixReadabilityIssues(svgElement, issues);

  console.log(`\n✅ Applied ${fixes.length} fixes:\n`);
  fixes.forEach((fix, idx) => {
    console.log(`  ${idx + 1}. ${fix}`);
  });

  // Ensure SVG has proper dimensions
  if (!svgElement.getAttribute('viewBox')) {
    const width = svgElement.getAttribute('width') || '600';
    const height = svgElement.getAttribute('height') || '400';
    svgElement.setAttribute('viewBox', `0 0 ${width} ${height}`);
    console.log(`\n  + Added viewBox attribute`);
  }

  // Save
  const outputFile = 'question_9_physics_smart_fixed.html';
  fs.writeFileSync(outputFile, document.documentElement.outerHTML, 'utf8');

  console.log(`\n📁 Saved to: ${outputFile}`);
  console.log('\n' + '='.repeat(70));
}

main();
