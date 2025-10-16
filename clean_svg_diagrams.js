const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

// Patterns that indicate solution content to remove
const SOLUTION_PATTERNS = [
  // Direct answer patterns
  /=\s*\d+\.?\d*\s*(Pa|N|J|W|K|°C|m|cm|kg|μC|μF|V|A)/i, // Numerical answers with units
  /=\s*\d+\.?\d*\s*×\s*10[⁰¹²³⁴⁵⁶⁷⁸⁹⁻]+/i, // Scientific notation answers

  // Solution indicator text
  /key formulas and results/i,
  /solution/i,
  /result/i,
  /final answer/i,
  /therefore/i,
  /thus/i,
  /hence/i,

  // Step indicators
  /step \d+:/i,
  /stage \d+:/i,

  // Calculation patterns
  /ΔQ/i,
  /Q_final/i,
  /Q_initial/i,
  /increase/i,
  /decrease/i,

  // Physical interpretation
  /physical meaning/i,
  /this equals/i,
  /energy density/i,

  // After/Before comparison (solution states)
  /after breakdown/i,
  /after freezing/i,
  /final configuration/i,
  /breaks down/i,
  /shorted/i,
];

// Patterns that are OK to keep (question setup)
const KEEP_PATTERNS = [
  /^[A-Z]₁$|^[A-Z]₂$|^[A-Z]₃$|^[A-Z]₄$/i, // Component labels like C₁, T₁
  /^\d+\.?\d*\s*μF$/i, // Capacitance values
  /^V\s*=\s*\d+\.?\d*\s*V$/i, // Voltage given values
  /^T[₁₂₃₄]\s*=\s*\d+\.?\d*\s*K$/i, // Temperature given values
  /^θ\s*=\s*\d+°$/i, // Angle given values
  /^μ[ₛₖ]\s*=\s*\d+\.?\d*$/i, // Friction coefficient given values
  /^d[₁₂₃]\s*=\s*\d+\.?\d*\s*cm$/i, // Distance given values
  /^L\s*=\s*\d+\.?\d*\s*m$/i, // Length given values
  /^COM$/i, // Center of mass label
  /^E$/i, // Electric field label (without derivation)
  /^F$/i, // Force label (without calculation)
  /^Q[₁₂₃₄]$/i, // Heat transfer labels (without calculation)
  /^Question \d+:/i, // Question header
  /^\+q$|^-q$|^\+$|^-$/i, // Charge indicators
  /^Area A$/i, // Area label
];

function shouldRemoveTextElement(textContent) {
  if (!textContent || textContent.trim().length === 0) return false;

  const text = textContent.trim();

  // First check if it's explicitly a "keep" pattern
  for (const pattern of KEEP_PATTERNS) {
    if (pattern.test(text)) {
      return false; // Keep this element
    }
  }

  // Then check if it matches solution patterns
  for (const pattern of SOLUTION_PATTERNS) {
    if (pattern.test(text)) {
      return true; // Remove this element
    }
  }

  return false; // Default: keep if not explicitly marked for removal
}

function shouldRemoveGroup(group, doc) {
  // Check if group contains solution-related id or class
  const id = group.getAttribute('id') || '';
  const className = group.getAttribute('class') || '';

  if (/solution|result|formula|answer|final|after|broken|step/i.test(id + ' ' + className)) {
    return true;
  }

  // Check if all text in group should be removed
  const texts = group.querySelectorAll('text, tspan');
  if (texts.length === 0) return false;

  let removeCount = 0;
  texts.forEach(text => {
    const content = text.textContent;
    if (shouldRemoveTextElement(content)) {
      removeCount++;
    }
  });

  // If more than 70% of text elements should be removed, remove entire group
  return removeCount / texts.length > 0.7;
}

function cleanSVG(svgElement, doc) {
  // Remove groups that are clearly solution-related
  const groups = svgElement.querySelectorAll('g');
  groups.forEach(group => {
    if (shouldRemoveGroup(group, doc)) {
      console.log(`  Removing group: ${group.getAttribute('id') || 'unnamed'}`);
      group.remove();
    }
  });

  // Remove individual text elements with solution content
  const textElements = svgElement.querySelectorAll('text, tspan');
  textElements.forEach(text => {
    const content = text.textContent;
    if (shouldRemoveTextElement(content)) {
      console.log(`  Removing text: "${content.trim().substring(0, 50)}..."`);

      // Check if parent should be removed too (e.g., if it's just wrapping this text)
      const parent = text.parentElement;
      if (parent && parent.tagName === 'text' && parent.childNodes.length === 1) {
        parent.remove();
      } else {
        text.remove();
      }
    }
  });

  // Remove formula/result boxes (rects with specific patterns)
  const rects = svgElement.querySelectorAll('rect');
  rects.forEach(rect => {
    const fill = rect.getAttribute('fill') || '';
    const stroke = rect.getAttribute('stroke') || '';

    // Check if this rect is part of a solution box (often has specific styling)
    const nextSibling = rect.nextElementSibling;
    if (nextSibling && nextSibling.tagName === 'text') {
      const textContent = nextSibling.textContent;
      if (shouldRemoveTextElement(textContent)) {
        console.log(`  Removing rect (solution box)`);
        rect.remove();
      }
    }
  });

  // Remove arrows and markers that indicate "after" or "result" transitions
  const markers = svgElement.querySelectorAll('line, path, polygon');
  markers.forEach(marker => {
    const id = marker.getAttribute('id') || '';
    if (/transition|arrow|change|result/i.test(id)) {
      console.log(`  Removing transition marker: ${id}`);
      marker.remove();
    }
  });
}

function processHTMLFile(filePath) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`Processing: ${path.basename(filePath)}`);
  console.log('='.repeat(60));

  const html = fs.readFileSync(filePath, 'utf8');
  const dom = new JSDOM(html);
  const doc = dom.window.document;

  // Find all SVG elements
  const svgs = doc.querySelectorAll('svg');
  console.log(`Found ${svgs.length} SVG elements`);

  let cleanedCount = 0;
  svgs.forEach((svg, index) => {
    // Check if this SVG is in a solution section
    let parent = svg.parentElement;
    let inSolution = false;

    while (parent) {
      const className = parent.getAttribute('class') || '';
      if (className.includes('solution')) {
        inSolution = true;
        break;
      }
      parent = parent.parentElement;
    }

    if (inSolution) {
      console.log(`\nSVG ${index + 1}: In solution section - considering removal`);
      // You might want to remove entire solution SVGs
      // For now, we'll clean them
    } else {
      console.log(`\nSVG ${index + 1}: In question section - cleaning`);
    }

    const beforeText = svg.querySelectorAll('text, tspan').length;
    cleanSVG(svg, doc);
    const afterText = svg.querySelectorAll('text, tspan').length;

    if (beforeText !== afterText) {
      console.log(`  Cleaned: ${beforeText} → ${afterText} text elements`);
      cleanedCount++;
    }
  });

  // Write cleaned HTML back
  const outputPath = filePath.replace('.html', '_cleaned.html');
  fs.writeFileSync(outputPath, dom.serialize());
  console.log(`\n✓ Saved cleaned version to: ${path.basename(outputPath)}`);
  console.log(`  ${cleanedCount} SVG(s) were modified`);

  return { total: svgs.length, cleaned: cleanedCount };
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

  console.log('SVG Diagram Cleaner');
  console.log('='.repeat(60));
  console.log('Removing solution details from physics question diagrams');
  console.log('='.repeat(60));

  let totalSVGs = 0;
  let totalCleaned = 0;

  files.forEach(file => {
    const filePath = path.join(exportDir, file);
    if (fs.existsSync(filePath)) {
      const result = processHTMLFile(filePath);
      totalSVGs += result.total;
      totalCleaned += result.cleaned;
    } else {
      console.log(`\n⚠ File not found: ${file}`);
    }
  });

  console.log('\n' + '='.repeat(60));
  console.log('SUMMARY');
  console.log('='.repeat(60));
  console.log(`Total SVG diagrams processed: ${totalSVGs}`);
  console.log(`SVG diagrams cleaned: ${totalCleaned}`);
  console.log(`Unchanged: ${totalSVGs - totalCleaned}`);
  console.log('\nCleaned files saved with "_cleaned" suffix');
  console.log('='.repeat(60));
}

// Run the script
if (require.main === module) {
  main();
}

module.exports = { cleanSVG, shouldRemoveTextElement };
