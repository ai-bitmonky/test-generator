/**
 * SVG Verification & Correction Pipeline
 * Ensures SVG accurately represents the problem description
 */

const fs = require('fs');
const { JSDOM } = require('jsdom');

const CONFIG = {
  maxIterations: 5,
  overlapTolerance: 5, // pixels
  angleTolerance: 2, // degrees
  positionTolerance: 5, // pixels
};

// ============================================================================
// STEP 1: Parse Problem Description
// ============================================================================

class ProblemDescriptionParser {
  parse(description) {
    console.log('📋 STEP 1: Parsing Problem Description\n');

    const constraints = {
      elements: [],
      positions: [],
      angles: [],
      relationships: [],
      labels: []
    };

    // Extract from description text
    if (description.includes('semi-infinite rod') || description.includes('Semi-Infinite')) {
      constraints.elements.push({
        type: 'line',
        name: 'rod',
        color: 'red',
        description: 'Semi-infinite rod along positive x-axis',
        required: true
      });

      constraints.positions.push({
        element: 'rod',
        constraint: 'lies along positive x-axis from origin',
        verification: 'y1 = y2 = origin_y, x1 = origin_x, x2 > x1'
      });
    }

    if (description.includes('Point P') && description.includes('perpendicular distance R')) {
      constraints.elements.push({
        type: 'circle',
        name: 'point_p',
        color: 'blue',
        description: 'Point P on y-axis at distance R',
        required: true
      });

      constraints.positions.push({
        element: 'point_p',
        constraint: 'on y-axis at perpendicular distance R from origin',
        verification: 'cx = origin_x, cy < origin_y'
      });

      constraints.elements.push({
        type: 'line',
        name: 'distance_r',
        color: 'blue',
        description: 'Distance R marker',
        required: true
      });
    }

    if (description.includes('Electric Field') || description.includes('E∥') || description.includes('E⊥')) {
      constraints.elements.push({
        type: 'line',
        name: 'e_parallel',
        color: 'green',
        description: 'Electric field component parallel to rod',
        required: true
      });

      constraints.elements.push({
        type: 'line',
        name: 'e_perpendicular',
        color: 'orange',
        description: 'Electric field component perpendicular to rod',
        required: true
      });

      constraints.angles.push({
        name: '45_degree_angle',
        description: 'Angle between E and rod = 45°',
        elements: ['e_parallel', 'e_perpendicular'],
        expectedAngle: 45,
        verification: 'arctan(|E⊥|/|E∥|) = 45°'
      });
    }

    // Labels that must be present
    constraints.labels = [
      { text: 'P', position: 'near point_p' },
      { text: 'R', position: 'near distance line' },
      { text: 'E∥', position: 'near e_parallel' },
      { text: 'E⊥', position: 'near e_perpendicular' },
      { text: '45°', position: 'near angle' },
      { text: 'x', position: 'end of x-axis' },
      { text: 'y', position: 'end of y-axis' },
      { text: 'O', position: 'at origin' }
    ];

    // Relationship constraints
    constraints.relationships = [
      { type: 'must_intersect', elements: ['distance_r', 'point_p'], reason: 'R measures from origin to P' },
      { type: 'must_start_from', elements: ['e_parallel', 'point_p'], reason: 'E vectors start at P' },
      { type: 'must_start_from', elements: ['e_perpendicular', 'point_p'], reason: 'E vectors start at P' },
      { type: 'perpendicular', elements: ['e_parallel', 'e_perpendicular'], reason: 'Components are orthogonal' },
      { type: 'parallel_to_axis', element: 'rod', axis: 'x', reason: 'Rod along x-axis' },
      { type: 'parallel_to_axis', element: 'e_parallel', axis: 'x', reason: 'E∥ parallel to rod' },
      { type: 'parallel_to_axis', element: 'e_perpendicular', axis: 'y', reason: 'E⊥ perpendicular to rod' }
    ];

    console.log(`  ✓ Identified ${constraints.elements.length} required elements`);
    console.log(`  ✓ Identified ${constraints.positions.length} position constraints`);
    console.log(`  ✓ Identified ${constraints.angles.length} angle constraints`);
    console.log(`  ✓ Identified ${constraints.relationships.length} relationship constraints`);
    console.log(`  ✓ Identified ${constraints.labels.length} required labels\n`);

    return constraints;
  }
}

// ============================================================================
// STEP 2: Analyze Current SVG
// ============================================================================

class SVGAnalyzer {
  analyze(svgElement) {
    console.log('🔍 STEP 2: Analyzing Current SVG\n');

    const analysis = {
      elements: [],
      positions: {},
      angles: {},
      overlaps: [],
      measurements: {}
    };

    // Find origin (intersection of axes)
    const axes = Array.from(svgElement.querySelectorAll('line')).filter(line => {
      const stroke = line.getAttribute('stroke');
      return stroke === 'black';
    });

    if (axes.length >= 2) {
      const xAxis = axes.find(line => {
        const y1 = parseFloat(line.getAttribute('y1'));
        const y2 = parseFloat(line.getAttribute('y2'));
        return Math.abs(y1 - y2) < 5; // Horizontal
      });

      const yAxis = axes.find(line => {
        const x1 = parseFloat(line.getAttribute('x1'));
        const x2 = parseFloat(line.getAttribute('x2'));
        return Math.abs(x1 - x2) < 5; // Vertical
      });

      if (xAxis && yAxis) {
        analysis.positions.origin = {
          x: parseFloat(xAxis.getAttribute('x1')),
          y: parseFloat(xAxis.getAttribute('y1'))
        };
        console.log(`  ✓ Origin detected at (${analysis.positions.origin.x}, ${analysis.positions.origin.y})`);
      }
    }

    // Find and classify all elements by color
    const colorMap = {
      'red': 'rod',
      'blue': 'point_p_or_distance',
      'green': 'e_parallel',
      'orange': 'e_perpendicular',
      'purple': 'angle'
    };

    // Analyze lines
    svgElement.querySelectorAll('line').forEach(line => {
      const stroke = line.getAttribute('stroke');
      const x1 = parseFloat(line.getAttribute('x1'));
      const y1 = parseFloat(line.getAttribute('y1'));
      const x2 = parseFloat(line.getAttribute('x2'));
      const y2 = parseFloat(line.getAttribute('y2'));

      const category = colorMap[stroke] || 'other';

      analysis.elements.push({
        type: 'line',
        element: line,
        category,
        color: stroke,
        start: { x: x1, y: y1 },
        end: { x: x2, y: y2 },
        length: Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2),
        angle: Math.atan2(y2 - y1, x2 - x1) * 180 / Math.PI
      });

      if (category !== 'other') {
        analysis.positions[category] = { x1, y1, x2, y2 };
      }
    });

    // Analyze circles
    svgElement.querySelectorAll('circle').forEach(circle => {
      const fill = circle.getAttribute('fill');
      const stroke = circle.getAttribute('stroke');
      const cx = parseFloat(circle.getAttribute('cx'));
      const cy = parseFloat(circle.getAttribute('cy'));
      const r = parseFloat(circle.getAttribute('r'));

      const color = stroke || fill;
      const category = colorMap[color] || 'other';

      analysis.elements.push({
        type: 'circle',
        element: circle,
        category,
        color,
        center: { x: cx, y: cy },
        radius: r
      });

      if (category !== 'other') {
        analysis.positions[category + '_circle'] = { cx, cy, r };
      }
    });

    // Calculate angles between vectors
    const eParallel = analysis.elements.find(e => e.category === 'e_parallel');
    const ePerpendicular = analysis.elements.find(e => e.category === 'e_perpendicular');

    if (eParallel && ePerpendicular) {
      // Calculate angle between the vectors
      const angle1 = eParallel.angle;
      const angle2 = ePerpendicular.angle;
      const angleBetween = Math.abs(angle1 - angle2);

      analysis.angles.e_vectors = {
        e_parallel_angle: angle1,
        e_perpendicular_angle: angle2,
        angle_between: angleBetween,
        is_perpendicular: Math.abs(angleBetween - 90) < CONFIG.angleTolerance
      };

      // The angle with the rod (x-axis) should be 45°
      const angleWithRod = Math.atan2(ePerpendicular.length, eParallel.length) * 180 / Math.PI;
      analysis.angles.resultant_with_rod = angleWithRod;

      console.log(`  ✓ E∥ angle: ${angle1.toFixed(1)}°`);
      console.log(`  ✓ E⊥ angle: ${angle2.toFixed(1)}°`);
      console.log(`  ✓ Angle between E vectors: ${angleBetween.toFixed(1)}°`);
      console.log(`  ✓ Resultant angle with rod: ${angleWithRod.toFixed(1)}°`);
    }

    // Detect overlaps (only problematic ones)
    analysis.overlaps = this.detectProblematicOverlaps(svgElement);

    console.log(`  ✓ Detected ${analysis.overlaps.length} problematic overlaps\n`);

    return analysis;
  }

  detectProblematicOverlaps(svgElement) {
    const textElements = Array.from(svgElement.querySelectorAll('text'))
      .filter(t => !t.closest('defs'));

    const overlaps = [];

    for (let i = 0; i < textElements.length; i++) {
      for (let j = i + 1; j < textElements.length; j++) {
        const bbox1 = this.getTextBBox(textElements[i]);
        const bbox2 = this.getTextBBox(textElements[j]);

        const xOverlap = Math.max(0, Math.min(bbox1.x2, bbox2.x2) - Math.max(bbox1.x, bbox2.x));
        const yOverlap = Math.max(0, Math.min(bbox1.y2, bbox2.y2) - Math.max(bbox1.y, bbox2.y));
        const area = xOverlap * yOverlap;

        if (area > CONFIG.overlapTolerance) {
          overlaps.push({
            element1: textElements[i],
            element2: textElements[j],
            text1: textElements[i].textContent.trim(),
            text2: textElements[j].textContent.trim(),
            area
          });
        }
      }
    }

    return overlaps;
  }

  getTextBBox(textElement) {
    const x = parseFloat(textElement.getAttribute('x') || 0);
    const y = parseFloat(textElement.getAttribute('y') || 0);
    const fontSize = parseFloat(textElement.getAttribute('font-size') || 12);
    const text = textElement.textContent || '';
    const width = text.length * fontSize * 0.6;
    const height = fontSize * 1.2;

    return {
      x, y: y - height * 0.8,
      width, height,
      x2: x + width,
      y2: y + height * 0.2
    };
  }
}

// ============================================================================
// STEP 3: Identify Discrepancies
// ============================================================================

class DiscrepancyDetector {
  detect(constraints, analysis) {
    console.log('⚠️  STEP 3: Identifying Discrepancies\n');

    const discrepancies = [];

    // Check element presence
    constraints.elements.forEach(requiredElement => {
      const found = analysis.elements.some(e => e.category === requiredElement.name);
      if (!found && requiredElement.required) {
        discrepancies.push({
          type: 'missing_element',
          severity: 'high',
          element: requiredElement.name,
          description: `Missing required element: ${requiredElement.description}`
        });
      }
    });

    // Check angle constraints
    constraints.angles.forEach(angleConstraint => {
      if (angleConstraint.name === '45_degree_angle' && analysis.angles.resultant_with_rod) {
        const actual = analysis.angles.resultant_with_rod;
        const expected = angleConstraint.expectedAngle;
        const diff = Math.abs(actual - expected);

        if (diff > CONFIG.angleTolerance) {
          discrepancies.push({
            type: 'angle_mismatch',
            severity: 'high',
            constraint: angleConstraint.name,
            expected: expected,
            actual: actual,
            difference: diff,
            description: `Angle should be ${expected}° but is ${actual.toFixed(1)}°`
          });
        }
      }
    });

    // Check perpendicularity
    if (analysis.angles.e_vectors && !analysis.angles.e_vectors.is_perpendicular) {
      discrepancies.push({
        type: 'not_perpendicular',
        severity: 'medium',
        description: `E∥ and E⊥ should be perpendicular (90°), but angle is ${analysis.angles.e_vectors.angle_between.toFixed(1)}°`
      });
    }

    // Check overlaps
    analysis.overlaps.forEach(overlap => {
      discrepancies.push({
        type: 'text_overlap',
        severity: 'medium',
        text1: overlap.text1,
        text2: overlap.text2,
        area: overlap.area,
        description: `Text overlap: "${overlap.text1}" and "${overlap.text2}" (${overlap.area.toFixed(1)}px²)`
      });
    });

    // Check label presence
    constraints.labels.forEach(label => {
      const textElements = Array.from(analysis.elements[0]?.element?.ownerDocument?.querySelectorAll('text') || []);
      const found = textElements.some(t => t.textContent.includes(label.text));

      if (!found) {
        discrepancies.push({
          type: 'missing_label',
          severity: 'low',
          label: label.text,
          description: `Missing label: "${label.text}"`
        });
      }
    });

    // Priority sorting
    discrepancies.sort((a, b) => {
      const severityOrder = { high: 0, medium: 1, low: 2 };
      return severityOrder[a.severity] - severityOrder[b.severity];
    });

    console.log(`  Found ${discrepancies.length} discrepancies:\n`);
    discrepancies.forEach((d, idx) => {
      console.log(`  ${idx + 1}. [${d.severity.toUpperCase()}] ${d.type}: ${d.description}`);
    });
    console.log();

    return discrepancies;
  }
}

// ============================================================================
// STEP 4: Generate Corrected SVG
// ============================================================================

class SVGCorrector {
  correct(svgElement, discrepancies, analysis) {
    console.log('🔧 STEP 4: Generating Corrected SVG\n');

    const fixes = [];

    discrepancies.forEach(discrepancy => {
      switch (discrepancy.type) {
        case 'angle_mismatch':
          this.fixAngle(svgElement, analysis, discrepancy, fixes);
          break;

        case 'text_overlap':
          this.fixTextOverlap(svgElement, discrepancy, fixes);
          break;

        case 'not_perpendicular':
          this.ensurePerpendicular(svgElement, analysis, fixes);
          break;

        default:
          console.log(`  ⚠️  No fix available for: ${discrepancy.type}`);
      }
    });

    console.log(`  Applied ${fixes.length} fixes\n`);
    return fixes;
  }

  fixAngle(svgElement, analysis, discrepancy, fixes) {
    // Adjust E∥ and E⊥ to ensure 45° angle
    const eParallel = analysis.elements.find(e => e.category === 'e_parallel');
    const ePerpendicular = analysis.elements.find(e => e.category === 'e_perpendicular');

    if (eParallel && ePerpendicular) {
      // Ensure equal lengths for 45° angle
      const avgLength = (eParallel.length + ePerpendicular.length) / 2;

      // Adjust E∥ (horizontal)
      const startX = eParallel.start.x;
      const startY = eParallel.start.y;
      eParallel.element.setAttribute('x2', (startX + avgLength).toString());

      // Adjust E⊥ (vertical)
      ePerpendicular.element.setAttribute('y2', (startY - avgLength).toString());

      fixes.push(`Adjusted E∥ and E⊥ lengths to ${avgLength.toFixed(1)}px for 45° angle`);
    }
  }

  fixTextOverlap(svgElement, discrepancy, fixes) {
    // Find the text elements
    const allText = Array.from(svgElement.querySelectorAll('text'));
    const text1 = allText.find(t => t.textContent.includes(discrepancy.text1));
    const text2 = allText.find(t => t.textContent.includes(discrepancy.text2));

    if (!text1 || !text2) return;

    // Move the shorter text
    const textToMove = discrepancy.text1.length < discrepancy.text2.length ? text1 : text2;
    const currentY = parseFloat(textToMove.getAttribute('y'));

    // Move up by 20px
    textToMove.setAttribute('y', (currentY - 20).toString());
    fixes.push(`Moved "${textToMove.textContent.trim()}" up by 20px to avoid overlap`);
  }

  ensurePerpendicular(svgElement, analysis, fixes) {
    // Ensure E∥ is exactly horizontal and E⊥ is exactly vertical
    const eParallel = analysis.elements.find(e => e.category === 'e_parallel');
    const ePerpendicular = analysis.elements.find(e => e.category === 'e_perpendicular');

    if (eParallel && eParallel.start.y !== eParallel.end.y) {
      eParallel.element.setAttribute('y2', eParallel.start.y.toString());
      fixes.push('Corrected E∥ to be exactly horizontal');
    }

    if (ePerpendicular && ePerpendicular.start.x !== ePerpendicular.end.x) {
      ePerpendicular.element.setAttribute('x2', ePerpendicular.start.x.toString());
      fixes.push('Corrected E⊥ to be exactly vertical');
    }
  }
}

// ============================================================================
// STEP 5: Verify Against Requirements
// ============================================================================

class SVGVerifier {
  verify(constraints, svgElement) {
    console.log('✅ STEP 5: Verifying Against Requirements\n');

    const analyzer = new SVGAnalyzer();
    const analysis = analyzer.analyze(svgElement);

    const detector = new DiscrepancyDetector();
    const discrepancies = detector.detect(constraints, analysis);

    const passed = discrepancies.filter(d => d.severity === 'high').length === 0;

    console.log(`  Verification Result: ${passed ? '✅ PASS' : '❌ FAIL'}\n`);

    return { passed, discrepancies, analysis };
  }
}

// ============================================================================
// Main Pipeline
// ============================================================================

async function main() {
  const args = process.argv.slice(2);

  if (args.length < 2) {
    console.log('Usage: node svg_verification_pipeline.js <html_file> <description>');
    process.exit(1);
  }

  const inputFile = args[0];
  const description = args.slice(1).join(' ');

  console.log('🎯 SVG Verification & Correction Pipeline\n');
  console.log('='.repeat(70) + '\n');

  const html = fs.readFileSync(inputFile, 'utf8');
  const dom = new JSDOM(html);
  const document = dom.window.document;
  const svgElement = document.querySelector('svg');

  if (!svgElement) {
    console.log('❌ No SVG found');
    return;
  }

  // Pipeline execution
  const parser = new ProblemDescriptionParser();
  const constraints = parser.parse(description);

  let iteration = 1;
  let passed = false;

  while (iteration <= CONFIG.maxIterations && !passed) {
    console.log(`${'='.repeat(70)}`);
    console.log(`ITERATION ${iteration}`);
    console.log('='.repeat(70) + '\n');

    const analyzer = new SVGAnalyzer();
    const analysis = analyzer.analyze(svgElement);

    const detector = new DiscrepancyDetector();
    const discrepancies = detector.detect(constraints, analysis);

    if (discrepancies.length === 0) {
      console.log('🎉 No discrepancies found! SVG is correct.\n');
      passed = true;
      break;
    }

    const corrector = new SVGCorrector();
    corrector.correct(svgElement, discrepancies, analysis);

    const verifier = new SVGVerifier();
    const result = verifier.verify(constraints, svgElement);

    passed = result.passed;

    if (passed) {
      console.log('🎉 All high-severity issues resolved!\n');
      break;
    }

    iteration++;
  }

  // Save result
  const outputFile = inputFile.replace('.html', '_verified.html');
  fs.writeFileSync(outputFile, document.documentElement.outerHTML, 'utf8');

  console.log('='.repeat(70));
  console.log(`📁 Saved to: ${outputFile}`);
  console.log(`📊 Final Status: ${passed ? '✅ VERIFIED' : '⚠️  NEEDS REVIEW'}`);
  console.log('='.repeat(70));
}

main().catch(console.error);
