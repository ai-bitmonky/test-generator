/**
 * Semantic SVG Fixer
 * Understands logical grouping of diagram elements
 */

const fs = require('fs');
const { JSDOM } = require('jsdom');

// Define logical groups based on comments and colors
const LOGICAL_GROUPS = {
  TITLE: { color: 'black', keywords: ['Semi-Infinite', 'Electric Field'] },
  AXES: { color: 'black', elements: ['line', 'polygon', 'text'], keywords: ['x', 'y'] },
  ORIGIN: { keywords: ['O (0,0)'] },
  ROD: { color: 'red', keywords: ['Rod', 'charge density'] },
  POINT_P: { color: 'blue', keywords: ['P'] },
  DISTANCE_R: { color: 'blue', keywords: ['R'] },
  E_PARALLEL: { color: 'green', keywords: ['E∥', 'parallel'] },
  E_PERPENDICULAR: { color: 'orange', keywords: ['E⊥', 'perpendicular'] },
  ANGLE: { color: 'purple', keywords: ['45°'] },
  RESULT_BOX: { fill: '#E6F3FF', keywords: ['Result'] },
  HINT_BOX: { fill: '#FFF9E6', keywords: ['Hint'] }
};

function identifyElementGroup(element) {
  const tag = element.tagName.toLowerCase();
  const text = element.textContent?.trim() || '';
  const color = element.getAttribute('stroke') || element.getAttribute('fill');
  const fill = element.getAttribute('fill');

  // Check each group
  for (const [groupName, groupDef] of Object.entries(LOGICAL_GROUPS)) {
    // Check by keywords
    if (groupDef.keywords) {
      for (const keyword of groupDef.keywords) {
        if (text.includes(keyword)) {
          return groupName;
        }
      }
    }

    // Check by color
    if (groupDef.color && color === groupDef.color) {
      return groupName;
    }

    // Check by fill
    if (groupDef.fill && fill === groupDef.fill) {
      return groupName;
    }
  }

  return 'UNKNOWN';
}

function buildLogicalGroups(svgElement) {
  const groups = {};

  // Initialize groups
  for (const groupName of Object.keys(LOGICAL_GROUPS)) {
    groups[groupName] = [];
  }
  groups['UNKNOWN'] = [];

  // Classify all elements
  const allElements = svgElement.querySelectorAll('*');
  allElements.forEach((element, idx) => {
    if (element.closest('defs')) return; // Skip defs

    const groupName = identifyElementGroup(element);
    groups[groupName].push({
      element,
      index: idx,
      tag: element.tagName.toLowerCase(),
      text: element.textContent?.trim() || '',
      bbox: getBoundingBox(element)
    });
  });

  return groups;
}

function getBoundingBox(element) {
  const tag = element.tagName.toLowerCase();

  try {
    if (tag === 'rect') {
      const x = parseFloat(element.getAttribute('x') || 0);
      const y = parseFloat(element.getAttribute('y') || 0);
      const width = parseFloat(element.getAttribute('width') || 0);
      const height = parseFloat(element.getAttribute('height') || 0);
      return { x, y, width, height, x2: x + width, y2: y + height };
    }
    else if (tag === 'circle') {
      const cx = parseFloat(element.getAttribute('cx') || 0);
      const cy = parseFloat(element.getAttribute('cy') || 0);
      const r = parseFloat(element.getAttribute('r') || 0);
      return { x: cx - r, y: cy - r, width: r * 2, height: r * 2, x2: cx + r, y2: cy + r };
    }
    else if (tag === 'line') {
      const x1 = parseFloat(element.getAttribute('x1') || 0);
      const y1 = parseFloat(element.getAttribute('y1') || 0);
      const x2 = parseFloat(element.getAttribute('x2') || 0);
      const y2 = parseFloat(element.getAttribute('y2') || 0);
      const strokeWidth = parseFloat(element.getAttribute('stroke-width') || 2);

      return {
        x: Math.min(x1, x2) - strokeWidth/2,
        y: Math.min(y1, y2) - strokeWidth/2,
        width: Math.abs(x2 - x1) + strokeWidth,
        height: Math.abs(y2 - y1) + strokeWidth,
        x2: Math.max(x1, x2) + strokeWidth/2,
        y2: Math.max(y1, y2) + strokeWidth/2
      };
    }
    else if (tag === 'text') {
      const x = parseFloat(element.getAttribute('x') || 0);
      const y = parseFloat(element.getAttribute('y') || 0);
      const fontSize = parseFloat(element.getAttribute('font-size') || 12);
      const text = element.textContent || '';
      const width = text.length * fontSize * 0.6;
      const height = fontSize * 1.2;

      return {
        x: x,
        y: y - height * 0.8,
        width: width,
        height: height,
        x2: x + width,
        y2: y + height * 0.2
      };
    }
    else if (tag === 'polygon') {
      const points = element.getAttribute('points');
      if (points) {
        const coords = points.trim().split(/[\s,]+/).map(parseFloat);
        const xs = [], ys = [];
        for (let i = 0; i < coords.length; i += 2) {
          xs.push(coords[i]);
          ys.push(coords[i + 1]);
        }
        const minX = Math.min(...xs);
        const maxX = Math.max(...xs);
        const minY = Math.min(...ys);
        const maxY = Math.max(...ys);
        return { x: minX, y: minY, width: maxX - minX, height: maxY - minY, x2: maxX, y2: maxY };
      }
    }
    else if (tag === 'path') {
      // Simplified bbox for path
      return { x: 0, y: 0, width: 0, height: 0, x2: 0, y2: 0 };
    }
  } catch (e) {
    return null;
  }

  return null;
}

function checkOverlap(bbox1, bbox2) {
  if (!bbox1 || !bbox2) return { overlaps: false, area: 0 };

  const xOverlap = Math.max(0, Math.min(bbox1.x2, bbox2.x2) - Math.max(bbox1.x, bbox2.x));
  const yOverlap = Math.max(0, Math.min(bbox1.y2, bbox2.y2) - Math.max(bbox1.y, bbox2.y));
  const area = xOverlap * yOverlap;

  return {
    overlaps: area > 10,
    area: area
  };
}

function analyzeInterGroupOverlaps(groups) {
  console.log('🔍 Analyzing inter-group overlaps...\n');

  const issues = [];

  // Define which group overlaps are problematic
  const problematicOverlaps = [
    // Text overlaps with other text from different groups
    { group1: 'E_PARALLEL', group2: 'ANGLE', type: 'text-text' },
    { group1: 'E_PERPENDICULAR', group2: 'ANGLE', type: 'text-text' },
    { group1: 'ROD', group2: 'ORIGIN', type: 'text-text' },
    { group1: 'ROD', group2: 'AXES', type: 'text-text' },

    // Boxes overlapping with vectors
    { group1: 'RESULT_BOX', group2: 'E_PARALLEL', type: 'box-vector' },
    { group1: 'RESULT_BOX', group2: 'E_PERPENDICULAR', type: 'box-vector' },
    { group1: 'HINT_BOX', group2: 'AXES', type: 'box-element' },
  ];

  problematicOverlaps.forEach(overlap => {
    const group1Elements = groups[overlap.group1] || [];
    const group2Elements = groups[overlap.group2] || [];

    group1Elements.forEach(elem1 => {
      group2Elements.forEach(elem2 => {
        const overlapInfo = checkOverlap(elem1.bbox, elem2.bbox);

        if (overlapInfo.overlaps) {
          issues.push({
            type: overlap.type,
            group1: overlap.group1,
            group2: overlap.group2,
            element1: elem1,
            element2: elem2,
            overlapArea: overlapInfo.area,
            severity: overlapInfo.area > 100 ? 'high' : overlapInfo.area > 50 ? 'medium' : 'low'
          });
        }
      });
    });
  });

  return issues;
}

function fixOverlaps(groups, issues) {
  console.log(`📋 Found ${issues.length} problematic inter-group overlaps\n`);

  if (issues.length === 0) {
    console.log('✅ No problematic overlaps found!\n');
    return [];
  }

  console.log('📊 Issue Details:\n');
  issues.forEach((issue, idx) => {
    console.log(`  ${idx + 1}. ${issue.type} (${issue.severity}):`);
    console.log(`     ${issue.group1} ↔ ${issue.group2}`);
    console.log(`     "${issue.element1.text.substring(0, 30)}" ↔ "${issue.element2.text.substring(0, 30)}"`);
    console.log(`     Overlap: ${issue.overlapArea.toFixed(1)}px²\n`);
  });

  const fixes = [];

  // Fix text-text overlaps
  const textOverlaps = issues.filter(i => i.type === 'text-text');

  textOverlaps.forEach(issue => {
    const elem1 = issue.element1.element;
    const elem2 = issue.element2.element;
    const text1 = issue.element1.text;
    const text2 = issue.element2.text;

    // Determine which to move based on priority (ANGLE has highest priority to stay)
    let elemToMove, groupToMove, textToMove;

    if (issue.group1 === 'ANGLE') {
      elemToMove = elem2;
      groupToMove = issue.group2;
      textToMove = text2;
    } else if (issue.group2 === 'ANGLE') {
      elemToMove = elem1;
      groupToMove = issue.group1;
      textToMove = text1;
    } else {
      // Move the one with more text (usually secondary label)
      elemToMove = text1.length > text2.length ? elem1 : elem2;
      groupToMove = text1.length > text2.length ? issue.group1 : issue.group2;
      textToMove = text1.length > text2.length ? text1 : text2;
    }

    const currentX = parseFloat(elemToMove.getAttribute('x'));
    const currentY = parseFloat(elemToMove.getAttribute('y'));

    // Move based on group context
    if (groupToMove === 'E_PARALLEL') {
      if (textToMove.includes('parallel')) {
        // Move "(parallel to rod)" down
        elemToMove.setAttribute('y', (currentY + 25).toString());
        fixes.push(`Moved "${textToMove.substring(0, 30)}..." down by 25px to avoid ${issue.group1 === groupToMove ? issue.group2 : issue.group1}`);
      } else if (textToMove.includes('E∥')) {
        // Move "E∥" label up or left
        elemToMove.setAttribute('y', (currentY - 20).toString());
        elemToMove.setAttribute('x', (currentX - 10).toString());
        fixes.push(`Moved "E∥" up by 20px and left by 10px to avoid ${issue.group1 === groupToMove ? issue.group2 : issue.group1}`);
      }
    }
    else if (groupToMove === 'ROD' && textToMove.includes('charge')) {
      // Move "Uniform charge density λ" down
      elemToMove.setAttribute('y', (currentY + 20).toString());
      fixes.push(`Moved "Uniform charge density λ" down by 20px to avoid ${issue.group1 === groupToMove ? issue.group2 : issue.group1}`);
    }
    else if (groupToMove === 'ORIGIN') {
      // Move origin label left
      elemToMove.setAttribute('x', (currentX - 15).toString());
      fixes.push(`Moved origin label left by 15px to avoid ${issue.group1 === groupToMove ? issue.group2 : issue.group1}`);
    }
  });

  // Fix box-vector overlaps
  const boxOverlaps = issues.filter(i => i.type === 'box-vector' || i.type === 'box-element');

  boxOverlaps.forEach(issue => {
    const boxElem = issue.group1.includes('BOX') ? issue.element1.element : issue.element2.element;
    const boxGroup = issue.group1.includes('BOX') ? issue.group1 : issue.group2;

    const currentX = parseFloat(boxElem.getAttribute('x'));
    const currentY = parseFloat(boxElem.getAttribute('y'));
    const width = parseFloat(boxElem.getAttribute('width'));
    const height = parseFloat(boxElem.getAttribute('height'));

    if (boxGroup === 'RESULT_BOX') {
      // Move result box up and right
      const newX = currentX + 30;
      const newY = currentY - 10;
      boxElem.setAttribute('x', newX.toString());
      boxElem.setAttribute('y', newY.toString());

      // Move text inside the box
      const textElements = groups[boxGroup].filter(e => e.tag === 'text');
      textElements.forEach(textData => {
        const tx = parseFloat(textData.element.getAttribute('x'));
        const ty = parseFloat(textData.element.getAttribute('y'));

        if (tx >= currentX && tx <= currentX + width && ty >= currentY && ty <= currentY + height) {
          textData.element.setAttribute('x', (tx + 30).toString());
          textData.element.setAttribute('y', (ty - 10).toString());
        }
      });

      fixes.push(`Moved Result Box right by 30px and up by 10px to avoid vectors`);
    }
    else if (boxGroup === 'HINT_BOX') {
      // Move hint box down
      const newY = Math.max(currentY, 340);
      boxElem.setAttribute('y', newY.toString());

      // Move text inside
      const textElements = groups[boxGroup].filter(e => e.tag === 'text');
      textElements.forEach(textData => {
        const tx = parseFloat(textData.element.getAttribute('x'));
        const ty = parseFloat(textData.element.getAttribute('y'));

        if (tx >= currentX && tx <= currentX + width && ty >= currentY && ty <= currentY + height) {
          textData.element.setAttribute('y', (ty + (newY - currentY)).toString());
        }
      });

      fixes.push(`Moved Hint Box down to y=340 to avoid axes`);
    }
  });

  return fixes;
}

function main() {
  const inputFile = 'question_9_physics_full.html';

  console.log('🎨 Semantic SVG Fixer for Question 9\n');
  console.log('='.repeat(70) + '\n');

  const html = fs.readFileSync(inputFile, 'utf8');
  const dom = new JSDOM(html);
  const document = dom.window.document;
  const svgElement = document.querySelector('svg');

  if (!svgElement) {
    console.log('❌ No SVG found');
    return;
  }

  // Step 1: Build logical groups
  const groups = buildLogicalGroups(svgElement);

  console.log('📦 Identified Logical Groups:\n');
  for (const [groupName, elements] of Object.entries(groups)) {
    if (elements.length > 0) {
      console.log(`  ${groupName}: ${elements.length} elements`);
    }
  }
  console.log();

  // Step 2: Analyze inter-group overlaps
  const issues = analyzeInterGroupOverlaps(groups);

  // Step 3: Fix overlaps
  const fixes = fixOverlaps(groups, issues);

  console.log(`\n✅ Applied ${fixes.length} semantic fixes:\n`);
  fixes.forEach((fix, idx) => {
    console.log(`  ${idx + 1}. ${fix}`);
  });

  // Ensure proper dimensions
  if (!svgElement.getAttribute('viewBox')) {
    const width = svgElement.getAttribute('width') || '600';
    const height = svgElement.getAttribute('height') || '400';
    svgElement.setAttribute('viewBox', `0 0 ${width} ${height}`);
    console.log(`\n  + Added viewBox attribute`);
  }

  // Increase height if hint box was moved
  if (fixes.some(f => f.includes('Hint Box'))) {
    svgElement.setAttribute('height', '420');
    svgElement.setAttribute('viewBox', '0 0 600 420');
    console.log(`  + Increased SVG height to 420`);
  }

  // Save
  const outputFile = 'question_9_physics_semantic_fixed.html';
  fs.writeFileSync(outputFile, document.documentElement.outerHTML, 'utf8');

  console.log(`\n📁 Saved to: ${outputFile}`);
  console.log('\n' + '='.repeat(70));
}

main();
