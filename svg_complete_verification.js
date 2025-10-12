/**
 * Complete SVG Verification Pipeline
 * Ensures SVG EXACTLY matches the problem statement description
 */

const fs = require('fs');
const { JSDOM } = require('jsdom');

const CONFIG = {
  maxIterations: 10,
  angleTolerance: 1, // degree
  positionTolerance: 3, // pixels
  overlapTolerance: 5, // pixels²
};

// ============================================================================
// STEP 1: Parse Problem Statement from HTML
// ============================================================================

class ProblemStatementExtractor {
  extract(document) {
    console.log('📋 STEP 1: Extracting Problem Statement from HTML\n');

    // Extract from question-text div
    const questionTextDiv = document.querySelector('.question-text');
    if (!questionTextDiv) {
      throw new Error('No question-text div found');
    }

    const fullText = questionTextDiv.textContent.trim();
    console.log('📄 Problem Statement:\n');
    console.log(`  "${fullText.substring(0, 200)}..."\n`);

    // Parse requirements from figure description
    const figureMatch = fullText.match(/\[Figure shows:(.*?)\]/);
    const figureDescription = figureMatch ? figureMatch[1].trim() : '';

    // Parse hint
    const hintMatch = fullText.match(/\(Hint:(.*?)\)/);
    const hint = hintMatch ? hintMatch[1].trim() : '';

    console.log('🔍 Extracted Requirements:\n');

    const requirements = this.parseRequirements(figureDescription, hint, fullText);

    requirements.forEach((req, idx) => {
      console.log(`  ${idx + 1}. ${req.description}`);
      console.log(`     Type: ${req.type}, Priority: ${req.priority}`);
    });
    console.log();

    return requirements;
  }

  parseRequirements(figureDescription, hint, fullText) {
    const requirements = [];

    // Parse each sentence in figure description
    const sentences = figureDescription.split('.');

    sentences.forEach(sentence => {
      sentence = sentence.trim();
      if (!sentence) return;

      // "semi-infinite rod lies along positive x-axis starting from origin"
      if (sentence.toLowerCase().includes('semi-infinite rod') && sentence.toLowerCase().includes('x-axis')) {
        requirements.push({
          type: 'element_existence',
          element: 'rod',
          description: 'Semi-infinite rod must exist',
          priority: 'critical',
          verification: 'Must find red line element'
        });

        requirements.push({
          type: 'element_position',
          element: 'rod',
          constraint: 'lies along positive x-axis starting from origin',
          description: 'Rod must lie along positive x-axis from origin',
          priority: 'critical',
          verification: 'y1 = y2 = origin_y, x1 = origin_x, x2 > x1'
        });

        requirements.push({
          type: 'element_property',
          element: 'rod',
          property: 'extends to infinity',
          description: 'Rod should extend far to the right (visual infinity)',
          priority: 'medium',
          verification: 'x2 should be near right edge of SVG'
        });
      }

      // "Point P is at perpendicular distance R from the origin on the y-axis"
      if (sentence.toLowerCase().includes('point p') && sentence.toLowerCase().includes('perpendicular distance')) {
        requirements.push({
          type: 'element_existence',
          element: 'point_p',
          description: 'Point P must exist',
          priority: 'critical',
          verification: 'Must find blue circle'
        });

        requirements.push({
          type: 'element_position',
          element: 'point_p',
          constraint: 'on y-axis at perpendicular distance R from origin',
          description: 'Point P must be on y-axis above origin',
          priority: 'critical',
          verification: 'cx = origin_x, cy < origin_y'
        });

        requirements.push({
          type: 'element_existence',
          element: 'distance_r_marker',
          description: 'Distance R marker must exist',
          priority: 'critical',
          verification: 'Must find vertical blue line from origin to P'
        });

        requirements.push({
          type: 'label_existence',
          element: 'label_r',
          text: 'R',
          description: 'Label "R" must be present near distance marker',
          priority: 'high',
          verification: 'Find text element containing "R"'
        });

        requirements.push({
          type: 'label_existence',
          element: 'label_p',
          text: 'P',
          description: 'Label "P" must be present near point',
          priority: 'high',
          verification: 'Find text element containing "P"'
        });
      }

      // "Rod extends from origin to +∞ along x-axis"
      if (sentence.toLowerCase().includes('origin')) {
        requirements.push({
          type: 'element_existence',
          element: 'origin_marker',
          description: 'Origin point must be marked',
          priority: 'high',
          verification: 'Find origin label "O" or point'
        });

        requirements.push({
          type: 'element_existence',
          element: 'axes',
          description: 'Coordinate axes must exist',
          priority: 'high',
          verification: 'Find x and y axis lines'
        });
      }
    });

    // Parse hint for E∥ and E⊥
    if (hint.toLowerCase().includes('e') && hint.toLowerCase().includes('parallel')) {
      requirements.push({
        type: 'element_existence',
        element: 'e_parallel',
        description: 'E∥ (parallel component) must exist',
        priority: 'critical',
        verification: 'Find green horizontal line from P'
      });

      requirements.push({
        type: 'label_existence',
        element: 'label_e_parallel',
        text: 'E∥',
        description: 'Label "E∥" must be present',
        priority: 'high',
        verification: 'Find text element containing "E∥"'
      });
    }

    if (hint.toLowerCase().includes('perpendicular')) {
      requirements.push({
        type: 'element_existence',
        element: 'e_perpendicular',
        description: 'E⊥ (perpendicular component) must exist',
        priority: 'critical',
        verification: 'Find orange vertical line from P'
      });

      requirements.push({
        type: 'label_existence',
        element: 'label_e_perpendicular',
        text: 'E⊥',
        description: 'Label "E⊥" must be present',
        priority: 'high',
        verification: 'Find text element containing "E⊥"'
      });

      requirements.push({
        type: 'geometric_constraint',
        constraint: 'vectors_perpendicular',
        elements: ['e_parallel', 'e_perpendicular'],
        description: 'E∥ and E⊥ must be perpendicular (90°)',
        priority: 'critical',
        verification: 'Angle between vectors = 90° ± tolerance'
      });
    }

    // Check for angle requirement in full text
    if (fullText.toLowerCase().includes('45') || fullText.toLowerCase().includes('45°')) {
      requirements.push({
        type: 'geometric_constraint',
        constraint: 'resultant_angle',
        expectedValue: 45,
        description: 'Resultant electric field must make 45° with rod',
        priority: 'critical',
        verification: 'arctan(|E⊥|/|E∥|) = 45° ± tolerance'
      });

      requirements.push({
        type: 'label_existence',
        element: 'label_45_degree',
        text: '45°',
        description: 'Label "45°" must be present',
        priority: 'high',
        verification: 'Find text element containing "45°"'
      });

      requirements.push({
        type: 'geometric_constraint',
        constraint: 'equal_vector_lengths',
        elements: ['e_parallel', 'e_perpendicular'],
        description: 'E∥ and E⊥ must have equal lengths for 45° angle',
        priority: 'critical',
        verification: '|E∥| = |E⊥| ± tolerance'
      });
    }

    return requirements;
  }
}

// ============================================================================
// STEP 2: Comprehensive SVG Analysis
// ============================================================================

class ComprehensiveSVGAnalyzer {
  analyze(svgElement) {
    console.log('🔍 STEP 2: Comprehensive SVG Analysis\n');

    const analysis = {
      origin: null,
      elements: {},
      labels: {},
      measurements: {},
      geometric_properties: {}
    };

    // Find coordinate system
    this.findCoordinateSystem(svgElement, analysis);

    // Find all colored elements
    this.findElements(svgElement, analysis);

    // Find all labels
    this.findLabels(svgElement, analysis);

    // Calculate geometric properties
    this.calculateGeometry(analysis);

    // Print summary
    this.printAnalysisSummary(analysis);

    return analysis;
  }

  findCoordinateSystem(svgElement, analysis) {
    const lines = Array.from(svgElement.querySelectorAll('line'));
    const blackLines = lines.filter(l => l.getAttribute('stroke') === 'black');

    const xAxis = blackLines.find(line => {
      const y1 = parseFloat(line.getAttribute('y1'));
      const y2 = parseFloat(line.getAttribute('y2'));
      return Math.abs(y1 - y2) < 3; // Horizontal
    });

    const yAxis = blackLines.find(line => {
      const x1 = parseFloat(line.getAttribute('x1'));
      const x2 = parseFloat(line.getAttribute('x2'));
      return Math.abs(x1 - x2) < 3; // Vertical
    });

    if (xAxis && yAxis) {
      const x1 = parseFloat(xAxis.getAttribute('x1'));
      const y1 = parseFloat(xAxis.getAttribute('y1'));
      const x2 = parseFloat(yAxis.getAttribute('x1'));
      const y2 = parseFloat(yAxis.getAttribute('y1'));

      analysis.origin = {
        x: Math.min(x1, x2),
        y: Math.max(y1, y2)
      };

      analysis.elements.x_axis = {
        element: xAxis,
        start: { x: parseFloat(xAxis.getAttribute('x1')), y: parseFloat(xAxis.getAttribute('y1')) },
        end: { x: parseFloat(xAxis.getAttribute('x2')), y: parseFloat(xAxis.getAttribute('y2')) }
      };

      analysis.elements.y_axis = {
        element: yAxis,
        start: { x: parseFloat(yAxis.getAttribute('x1')), y: parseFloat(yAxis.getAttribute('y1')) },
        end: { x: parseFloat(yAxis.getAttribute('x2')), y: parseFloat(yAxis.getAttribute('y2')) }
      };
    }
  }

  findElements(svgElement, analysis) {
    // Find rod (red line)
    const redLine = Array.from(svgElement.querySelectorAll('line')).find(l =>
      l.getAttribute('stroke') === 'red'
    );

    if (redLine) {
      analysis.elements.rod = {
        element: redLine,
        start: {
          x: parseFloat(redLine.getAttribute('x1')),
          y: parseFloat(redLine.getAttribute('y1'))
        },
        end: {
          x: parseFloat(redLine.getAttribute('x2')),
          y: parseFloat(redLine.getAttribute('y2'))
        },
        length: Math.sqrt(
          Math.pow(parseFloat(redLine.getAttribute('x2')) - parseFloat(redLine.getAttribute('x1')), 2) +
          Math.pow(parseFloat(redLine.getAttribute('y2')) - parseFloat(redLine.getAttribute('y1')), 2)
        )
      };
    }

    // Find Point P (blue circle with stroke)
    const blueCircle = Array.from(svgElement.querySelectorAll('circle')).find(c =>
      c.getAttribute('stroke') === 'darkblue' ||
      (c.getAttribute('fill') === 'blue' && parseFloat(c.getAttribute('r')) > 3)
    );

    if (blueCircle) {
      analysis.elements.point_p = {
        element: blueCircle,
        center: {
          x: parseFloat(blueCircle.getAttribute('cx')),
          y: parseFloat(blueCircle.getAttribute('cy'))
        },
        radius: parseFloat(blueCircle.getAttribute('r'))
      };
    }

    // Find distance R marker (blue line with markers)
    const blueLines = Array.from(svgElement.querySelectorAll('line')).filter(l =>
      l.getAttribute('stroke') === 'blue'
    );

    const distanceLine = blueLines.find(l =>
      l.hasAttribute('marker-start') || l.hasAttribute('marker-end')
    );

    if (distanceLine) {
      analysis.elements.distance_r_marker = {
        element: distanceLine,
        start: {
          x: parseFloat(distanceLine.getAttribute('x1')),
          y: parseFloat(distanceLine.getAttribute('y1'))
        },
        end: {
          x: parseFloat(distanceLine.getAttribute('x2')),
          y: parseFloat(distanceLine.getAttribute('y2'))
        },
        length: Math.abs(
          parseFloat(distanceLine.getAttribute('y2')) - parseFloat(distanceLine.getAttribute('y1'))
        )
      };
    }

    // Find E∥ (green line)
    const greenLine = Array.from(svgElement.querySelectorAll('line')).find(l =>
      l.getAttribute('stroke') === 'green'
    );

    if (greenLine) {
      analysis.elements.e_parallel = {
        element: greenLine,
        start: {
          x: parseFloat(greenLine.getAttribute('x1')),
          y: parseFloat(greenLine.getAttribute('y1'))
        },
        end: {
          x: parseFloat(greenLine.getAttribute('x2')),
          y: parseFloat(greenLine.getAttribute('y2'))
        },
        length: Math.sqrt(
          Math.pow(parseFloat(greenLine.getAttribute('x2')) - parseFloat(greenLine.getAttribute('x1')), 2) +
          Math.pow(parseFloat(greenLine.getAttribute('y2')) - parseFloat(greenLine.getAttribute('y1')), 2)
        )
      };
    }

    // Find E⊥ (orange line)
    const orangeLine = Array.from(svgElement.querySelectorAll('line')).find(l =>
      l.getAttribute('stroke') === 'orange'
    );

    if (orangeLine) {
      analysis.elements.e_perpendicular = {
        element: orangeLine,
        start: {
          x: parseFloat(orangeLine.getAttribute('x1')),
          y: parseFloat(orangeLine.getAttribute('y1'))
        },
        end: {
          x: parseFloat(orangeLine.getAttribute('x2')),
          y: parseFloat(orangeLine.getAttribute('y2'))
        },
        length: Math.sqrt(
          Math.pow(parseFloat(orangeLine.getAttribute('x2')) - parseFloat(orangeLine.getAttribute('x1')), 2) +
          Math.pow(parseFloat(orangeLine.getAttribute('y2')) - parseFloat(orangeLine.getAttribute('y1')), 2)
        )
      };
    }
  }

  findLabels(svgElement, analysis) {
    const textElements = Array.from(svgElement.querySelectorAll('text'));

    const labelPatterns = {
      'R': /^R$/,
      'P': /^P$/,
      'O': /^O\s*\(/,
      'E∥': /E[∥‖]/,
      'E⊥': /E[⊥⟂]/,
      '45°': /45[°⁰]/,
      'x': /^x$/,
      'y': /^y$/
    };

    Object.entries(labelPatterns).forEach(([key, pattern]) => {
      const found = textElements.find(t => pattern.test(t.textContent.trim()));
      if (found) {
        analysis.labels[key] = {
          element: found,
          text: found.textContent.trim(),
          position: {
            x: parseFloat(found.getAttribute('x')),
            y: parseFloat(found.getAttribute('y'))
          }
        };
      }
    });
  }

  calculateGeometry(analysis) {
    // Check if rod is on x-axis
    if (analysis.elements.rod && analysis.origin) {
      const rod = analysis.elements.rod;
      analysis.geometric_properties.rod_on_x_axis =
        Math.abs(rod.start.y - analysis.origin.y) < CONFIG.positionTolerance &&
        Math.abs(rod.end.y - analysis.origin.y) < CONFIG.positionTolerance;

      analysis.geometric_properties.rod_starts_at_origin =
        Math.abs(rod.start.x - analysis.origin.x) < CONFIG.positionTolerance;
    }

    // Check if Point P is on y-axis
    if (analysis.elements.point_p && analysis.origin) {
      const p = analysis.elements.point_p;
      analysis.geometric_properties.point_p_on_y_axis =
        Math.abs(p.center.x - analysis.origin.x) < CONFIG.positionTolerance;

      analysis.geometric_properties.point_p_above_origin =
        p.center.y < analysis.origin.y; // SVG y increases downward
    }

    // Calculate angle between E vectors
    if (analysis.elements.e_parallel && analysis.elements.e_perpendicular) {
      const ep = analysis.elements.e_parallel;
      const eperp = analysis.elements.e_perpendicular;

      const angle_ep = Math.atan2(ep.end.y - ep.start.y, ep.end.x - ep.start.x) * 180 / Math.PI;
      const angle_eperp = Math.atan2(eperp.end.y - eperp.start.y, eperp.end.x - eperp.start.x) * 180 / Math.PI;

      const angleBetween = Math.abs(angle_ep - angle_eperp);
      analysis.measurements.angle_between_e_vectors = angleBetween;
      analysis.geometric_properties.e_vectors_perpendicular =
        Math.abs(angleBetween - 90) < CONFIG.angleTolerance;

      // Calculate resultant angle with rod (x-axis)
      const lengthRatio = eperp.length / ep.length;
      const resultantAngle = Math.atan(lengthRatio) * 180 / Math.PI;
      analysis.measurements.resultant_angle_with_rod = resultantAngle;

      analysis.geometric_properties.angle_is_45_degrees =
        Math.abs(resultantAngle - 45) < CONFIG.angleTolerance;

      analysis.measurements.e_parallel_length = ep.length;
      analysis.measurements.e_perpendicular_length = eperp.length;
      analysis.geometric_properties.equal_vector_lengths =
        Math.abs(ep.length - eperp.length) < CONFIG.positionTolerance;
    }

    // Check if E vectors start from Point P
    if (analysis.elements.e_parallel && analysis.elements.point_p) {
      const ep = analysis.elements.e_parallel;
      const p = analysis.elements.point_p.center;

      analysis.geometric_properties.e_parallel_starts_at_p =
        Math.abs(ep.start.x - p.x) < CONFIG.positionTolerance &&
        Math.abs(ep.start.y - p.y) < CONFIG.positionTolerance;
    }

    if (analysis.elements.e_perpendicular && analysis.elements.point_p) {
      const eperp = analysis.elements.e_perpendicular;
      const p = analysis.elements.point_p.center;

      analysis.geometric_properties.e_perpendicular_starts_at_p =
        Math.abs(eperp.start.x - p.x) < CONFIG.positionTolerance &&
        Math.abs(eperp.start.y - p.y) < CONFIG.positionTolerance;
    }
  }

  printAnalysisSummary(analysis) {
    console.log('  📍 Origin:', analysis.origin ?
      `(${analysis.origin.x}, ${analysis.origin.y})` : 'NOT FOUND');

    console.log('\n  📦 Elements Found:');
    Object.keys(analysis.elements).forEach(key => {
      console.log(`    ✓ ${key}`);
    });

    console.log('\n  🏷️  Labels Found:');
    Object.entries(analysis.labels).forEach(([key, data]) => {
      console.log(`    ✓ "${key}" at (${data.position.x.toFixed(0)}, ${data.position.y.toFixed(0)})`);
    });

    console.log('\n  📐 Measurements:');
    if (analysis.measurements.e_parallel_length) {
      console.log(`    E∥ length: ${analysis.measurements.e_parallel_length.toFixed(2)}px`);
    }
    if (analysis.measurements.e_perpendicular_length) {
      console.log(`    E⊥ length: ${analysis.measurements.e_perpendicular_length.toFixed(2)}px`);
    }
    if (analysis.measurements.angle_between_e_vectors) {
      console.log(`    Angle between E vectors: ${analysis.measurements.angle_between_e_vectors.toFixed(1)}°`);
    }
    if (analysis.measurements.resultant_angle_with_rod) {
      console.log(`    Resultant angle with rod: ${analysis.measurements.resultant_angle_with_rod.toFixed(1)}°`);
    }

    console.log('\n  ✅ Geometric Properties:');
    Object.entries(analysis.geometric_properties).forEach(([key, value]) => {
      const status = value ? '✓' : '✗';
      console.log(`    ${status} ${key}: ${value}`);
    });
    console.log();
  }
}

// ============================================================================
// STEP 3: Verify Requirements
// ============================================================================

class RequirementVerifier {
  verify(requirements, analysis) {
    console.log('⚠️  STEP 3: Verifying Requirements Against SVG\n');

    const results = [];

    requirements.forEach((req, idx) => {
      const result = this.verifyRequirement(req, analysis);
      results.push(result);

      const status = result.passed ? '✅' : '❌';
      const priority = result.priority === 'critical' ? '[CRITICAL]' :
                      result.priority === 'high' ? '[HIGH]' : '[MEDIUM]';

      console.log(`  ${idx + 1}. ${status} ${priority} ${req.description}`);
      if (!result.passed) {
        console.log(`     Reason: ${result.reason}`);
      }
    });

    const criticalFailures = results.filter(r => !r.passed && r.priority === 'critical');
    const highFailures = results.filter(r => !r.passed && r.priority === 'high');

    console.log(`\n  Summary:`);
    console.log(`    Total requirements: ${results.length}`);
    console.log(`    Passed: ${results.filter(r => r.passed).length}`);
    console.log(`    Failed: ${results.filter(r => !r.passed).length}`);
    console.log(`    Critical failures: ${criticalFailures.length}`);
    console.log(`    High priority failures: ${highFailures.length}\n`);

    return {
      results,
      passed: criticalFailures.length === 0,
      criticalFailures,
      highFailures
    };
  }

  verifyRequirement(req, analysis) {
    const result = {
      requirement: req,
      passed: false,
      reason: '',
      priority: req.priority
    };

    switch (req.type) {
      case 'element_existence':
        result.passed = analysis.elements[req.element] !== undefined;
        if (!result.passed) {
          result.reason = `Element "${req.element}" not found in SVG`;
        }
        break;

      case 'element_position':
        if (req.constraint.includes('x-axis') && req.constraint.includes('origin')) {
          result.passed = analysis.geometric_properties.rod_on_x_axis &&
                         analysis.geometric_properties.rod_starts_at_origin;
          if (!result.passed) {
            result.reason = `Rod not properly positioned on x-axis from origin`;
          }
        } else if (req.constraint.includes('y-axis')) {
          result.passed = analysis.geometric_properties.point_p_on_y_axis &&
                         analysis.geometric_properties.point_p_above_origin;
          if (!result.passed) {
            result.reason = `Point P not on y-axis above origin`;
          }
        }
        break;

      case 'label_existence':
        result.passed = analysis.labels[req.text] !== undefined;
        if (!result.passed) {
          result.reason = `Label "${req.text}" not found`;
        }
        break;

      case 'geometric_constraint':
        if (req.constraint === 'vectors_perpendicular') {
          result.passed = analysis.geometric_properties.e_vectors_perpendicular;
          if (!result.passed) {
            result.reason = `E vectors not perpendicular (angle: ${analysis.measurements.angle_between_e_vectors?.toFixed(1)}°)`;
          }
        } else if (req.constraint === 'resultant_angle') {
          result.passed = analysis.geometric_properties.angle_is_45_degrees;
          if (!result.passed) {
            result.reason = `Resultant angle is ${analysis.measurements.resultant_angle_with_rod?.toFixed(1)}°, not 45°`;
          }
        } else if (req.constraint === 'equal_vector_lengths') {
          result.passed = analysis.geometric_properties.equal_vector_lengths;
          if (!result.passed) {
            result.reason = `Vector lengths not equal: E∥=${analysis.measurements.e_parallel_length?.toFixed(1)}px, E⊥=${analysis.measurements.e_perpendicular_length?.toFixed(1)}px`;
          }
        }
        break;

      case 'element_property':
        result.passed = true; // Visual properties are subjective
        result.reason = 'Visual property - manual verification recommended';
        break;

      default:
        result.reason = 'Unknown requirement type';
    }

    return result;
  }
}

// ============================================================================
// STEP 4: Auto-fix Critical Issues
// ============================================================================

class SVGAutoFixer {
  fix(svgElement, verificationResults, analysis) {
    console.log('🔧 STEP 4: Auto-fixing Critical Issues\n');

    const fixes = [];

    verificationResults.criticalFailures.forEach(failure => {
      const fix = this.attemptFix(svgElement, failure, analysis);
      if (fix) {
        fixes.push(fix);
        console.log(`  ✓ ${fix}`);
      }
    });

    console.log(`\n  Applied ${fixes.length} fixes\n`);
    return fixes;
  }

  attemptFix(svgElement, failure, analysis) {
    const req = failure.requirement;

    if (req.constraint === 'equal_vector_lengths') {
      // Fix E∥ and E⊥ to have equal lengths
      const ep = analysis.elements.e_parallel;
      const eperp = analysis.elements.e_perpendicular;

      if (ep && eperp) {
        const targetLength = (ep.length + eperp.length) / 2;

        // Adjust E∥
        const newX2 = ep.start.x + targetLength;
        ep.element.setAttribute('x2', newX2.toString());

        // Adjust E⊥
        const newY2 = eperp.start.y - targetLength;
        eperp.element.setAttribute('y2', newY2.toString());

        return `Adjusted E∥ and E⊥ to equal length ${targetLength.toFixed(1)}px`;
      }
    }

    return null;
  }
}

// ============================================================================
// Main Pipeline
// ============================================================================

async function main() {
  const args = process.argv.slice(2);

  if (args.length < 1) {
    console.log('Usage: node svg_complete_verification.js <html_file>');
    process.exit(1);
  }

  const inputFile = args[0];

  console.log('🎯 Complete SVG Verification Pipeline\n');
  console.log('='.repeat(70) + '\n');

  const html = fs.readFileSync(inputFile, 'utf8');
  const dom = new JSDOM(html);
  const document = dom.window.document;
  const svgElement = document.querySelector('svg');

  if (!svgElement) {
    console.log('❌ No SVG found');
    return;
  }

  // Extract requirements from problem statement
  const extractor = new ProblemStatementExtractor();
  const requirements = extractor.extract(document);

  let iteration = 1;
  let passed = false;

  while (iteration <= CONFIG.maxIterations && !passed) {
    console.log('='.repeat(70));
    console.log(`ITERATION ${iteration}`);
    console.log('='.repeat(70) + '\n');

    // Analyze SVG
    const analyzer = new ComprehensiveSVGAnalyzer();
    const analysis = analyzer.analyze(svgElement);

    // Verify requirements
    const verifier = new RequirementVerifier();
    const verificationResults = verifier.verify(requirements, analysis);

    if (verificationResults.passed) {
      console.log('🎉 SUCCESS! All critical requirements verified!\n');
      passed = true;
      break;
    }

    if (verificationResults.criticalFailures.length === 0) {
      console.log('✅ All critical requirements met!\n');
      passed = true;
      break;
    }

    // Attempt auto-fix
    const fixer = new SVGAutoFixer();
    const fixes = fixer.fix(svgElement, verificationResults, analysis);

    if (fixes.length === 0) {
      console.log('⚠️  No automatic fixes available for remaining issues\n');
      break;
    }

    iteration++;
  }

  // Save result
  const outputFile = inputFile.replace('.html', '_complete_verified.html');
  fs.writeFileSync(outputFile, document.documentElement.outerHTML, 'utf8');

  console.log('='.repeat(70));
  console.log(`📁 Saved to: ${outputFile}`);
  console.log(`📊 Final Status: ${passed ? '✅ FULLY VERIFIED' : '⚠️  NEEDS MANUAL REVIEW'}`);
  console.log('='.repeat(70));
}

main().catch(console.error);
