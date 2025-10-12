/**
 * Agentic SVG Correction Pipeline V2
 * Improved overlap detection including text and line elements
 */

const fs = require('fs');
const { JSDOM } = require('jsdom');

// Configuration
const CONFIG = {
  maxIterations: 10,
  improvementThreshold: 0.1,
  saveIntermediateSteps: true,
  outputDir: 'svg_corrections',
  overlapTolerance: 5, // pixels
};

/**
 * Agent: Analyzer (Enhanced)
 */
class SVGAnalyzer {
  analyze(svgElement, description = '') {
    const issues = {
      overlapping: [],
      dimensionIssues: [],
      missingElements: [],
      styleIssues: [],
      structureIssues: [],
      score: 0,
      details: {}
    };

    if (!svgElement) {
      issues.structureIssues.push('SVG element not found');
      return issues;
    }

    // Check dimensions
    const width = svgElement.getAttribute('width');
    const height = svgElement.getAttribute('height');
    const viewBox = svgElement.getAttribute('viewBox');

    if (!width || !height) {
      issues.dimensionIssues.push('Missing width or height attribute');
    }

    if (!viewBox) {
      issues.dimensionIssues.push('Missing viewBox attribute');
    }

    // Get all visual elements (including text and lines)
    const allElements = svgElement.querySelectorAll('rect, circle, ellipse, path, polygon, line, text');
    issues.details.totalElements = allElements.length;

    // Enhanced overlap detection
    const elementData = [];
    allElements.forEach((el, idx) => {
      // Skip elements in defs (they're definitions, not displayed)
      if (el.closest('defs')) return;

      const bbox = this._getBBox(el);
      if (bbox) {
        elementData.push({
          element: el,
          bbox: bbox,
          tag: el.tagName.toLowerCase(),
          index: idx
        });
      }
    });

    // Check for overlaps
    for (let i = 0; i < elementData.length; i++) {
      for (let j = i + 1; j < elementData.length; j++) {
        const data1 = elementData[i];
        const data2 = elementData[j];

        // Skip if one is a marker (markers are meant to be on lines)
        if (this._isMarkerRelated(data1.element) || this._isMarkerRelated(data2.element)) {
          continue;
        }

        const overlapInfo = this._calculateOverlap(data1.bbox, data2.bbox);

        if (overlapInfo.overlaps) {
          issues.overlapping.push({
            element1: `${data1.tag}[${data1.index}]`,
            element2: `${data2.tag}[${data2.index}]`,
            index1: i,
            index2: j,
            overlapArea: overlapInfo.area,
            overlapPercent: overlapInfo.percent.toFixed(1),
            severity: overlapInfo.percent > 50 ? 'high' : overlapInfo.percent > 20 ? 'medium' : 'low'
          });
        }
      }
    }

    // Check for elements without proper attributes
    allElements.forEach((el, idx) => {
      if (el.closest('defs')) return;

      const tag = el.tagName.toLowerCase();

      if (tag === 'rect') {
        if (!el.getAttribute('x') || !el.getAttribute('y') ||
            !el.getAttribute('width') || !el.getAttribute('height')) {
          issues.missingElements.push(`rect[${idx}]: Missing required attributes`);
        }
      } else if (tag === 'circle') {
        if (!el.getAttribute('cx') || !el.getAttribute('cy') || !el.getAttribute('r')) {
          issues.missingElements.push(`circle[${idx}]: Missing required attributes`);
        }
      } else if (tag === 'path') {
        if (!el.getAttribute('d')) {
          issues.missingElements.push(`path[${idx}]: Missing 'd' attribute`);
        }
      } else if (tag === 'line') {
        if (!el.getAttribute('x1') || !el.getAttribute('y1') ||
            !el.getAttribute('x2') || !el.getAttribute('y2')) {
          issues.missingElements.push(`line[${idx}]: Missing required attributes`);
        }
      }

      // Check for styling (except text which often inherits)
      if (tag !== 'text' && tag !== 'line') {
        if (!el.getAttribute('fill') && !el.getAttribute('stroke') &&
            !el.style.fill && !el.style.stroke) {
          issues.styleIssues.push(`${tag}[${idx}]: No fill or stroke defined`);
        }
      }
    });

    // Check for text readability
    const textElements = svgElement.querySelectorAll('text');
    textElements.forEach((text, idx) => {
      const fontSize = text.getAttribute('font-size') || text.style.fontSize;
      if (!fontSize || parseFloat(fontSize) < 8) {
        issues.styleIssues.push(`text[${idx}]: Font size too small (< 8px)`);
      }
    });

    // Calculate quality score (0-100)
    let score = 100;

    // Weight overlaps heavily
    const highSeverityOverlaps = issues.overlapping.filter(o => o.severity === 'high').length;
    const mediumSeverityOverlaps = issues.overlapping.filter(o => o.severity === 'medium').length;
    const lowSeverityOverlaps = issues.overlapping.filter(o => o.severity === 'low').length;

    score -= highSeverityOverlaps * 15;
    score -= mediumSeverityOverlaps * 8;
    score -= lowSeverityOverlaps * 3;
    score -= issues.dimensionIssues.length * 10;
    score -= issues.missingElements.length * 5;
    score -= issues.styleIssues.length * 2;
    score -= issues.structureIssues.length * 20;

    issues.score = Math.max(0, score);
    issues.details.overlappingCount = issues.overlapping.length;
    issues.details.highSeverity = highSeverityOverlaps;
    issues.details.mediumSeverity = mediumSeverityOverlaps;
    issues.details.lowSeverity = lowSeverityOverlaps;

    return issues;
  }

  _isMarkerRelated(element) {
    const markerAttrs = ['marker-start', 'marker-mid', 'marker-end'];
    return markerAttrs.some(attr => element.hasAttribute(attr));
  }

  _getBBox(element) {
    try {
      const tag = element.tagName.toLowerCase();

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
        return {
          x: cx - r,
          y: cy - r,
          width: r * 2,
          height: r * 2,
          x2: cx + r,
          y2: cy + r
        };
      }
      else if (tag === 'ellipse') {
        const cx = parseFloat(element.getAttribute('cx') || 0);
        const cy = parseFloat(element.getAttribute('cy') || 0);
        const rx = parseFloat(element.getAttribute('rx') || 0);
        const ry = parseFloat(element.getAttribute('ry') || 0);
        return {
          x: cx - rx,
          y: cy - ry,
          width: rx * 2,
          height: ry * 2,
          x2: cx + rx,
          y2: cy + ry
        };
      }
      else if (tag === 'line') {
        const x1 = parseFloat(element.getAttribute('x1') || 0);
        const y1 = parseFloat(element.getAttribute('y1') || 0);
        const x2 = parseFloat(element.getAttribute('x2') || 0);
        const y2 = parseFloat(element.getAttribute('y2') || 0);
        const strokeWidth = parseFloat(element.getAttribute('stroke-width') || 1);

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

        // Rough estimation: 0.6 * fontSize per character width
        const estimatedWidth = text.length * fontSize * 0.6;
        const estimatedHeight = fontSize * 1.2;

        return {
          x: x,
          y: y - estimatedHeight * 0.8, // Text baseline adjustment
          width: estimatedWidth,
          height: estimatedHeight,
          x2: x + estimatedWidth,
          y2: y + estimatedHeight * 0.2
        };
      }
      else if (tag === 'polygon' || tag === 'path') {
        // For complex shapes, try to parse points
        if (tag === 'polygon') {
          const points = element.getAttribute('points');
          if (points) {
            return this._getBBoxFromPoints(points);
          }
        }
        // For paths, this is complex - return null for now
        return null;
      }

      return null;
    } catch (e) {
      return null;
    }
  }

  _getBBoxFromPoints(pointsStr) {
    const coords = pointsStr.trim().split(/[\s,]+/).map(parseFloat);
    const points = [];

    for (let i = 0; i < coords.length; i += 2) {
      if (i + 1 < coords.length) {
        points.push({ x: coords[i], y: coords[i + 1] });
      }
    }

    if (points.length === 0) return null;

    const xs = points.map(p => p.x);
    const ys = points.map(p => p.y);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);

    return {
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY,
      x2: maxX,
      y2: maxY
    };
  }

  _calculateOverlap(bbox1, bbox2) {
    // Calculate intersection
    const xOverlap = Math.max(0, Math.min(bbox1.x2, bbox2.x2) - Math.max(bbox1.x1 || bbox1.x, bbox2.x1 || bbox2.x));
    const yOverlap = Math.max(0, Math.min(bbox1.y2, bbox2.y2) - Math.max(bbox1.y1 || bbox1.y, bbox2.y1 || bbox2.y));

    const overlapArea = xOverlap * yOverlap;
    const area1 = bbox1.width * bbox1.height;
    const area2 = bbox2.width * bbox2.height;
    const minArea = Math.min(area1, area2);

    const overlapPercent = minArea > 0 ? (overlapArea / minArea) * 100 : 0;

    return {
      overlaps: overlapArea > CONFIG.overlapTolerance && overlapPercent > 5,
      area: overlapArea,
      percent: overlapPercent
    };
  }
}

/**
 * Agent: Fixer (Enhanced)
 */
class SVGFixer {
  constructor() {
    this.fixes = [];
  }

  fixDimensions(svgElement) {
    console.log('  🔧 Fixing dimensions...');
    let fixCount = 0;

    if (!svgElement.getAttribute('width') || !svgElement.getAttribute('height')) {
      svgElement.setAttribute('width', '600');
      svgElement.setAttribute('height', '400');
      fixCount++;
      this.fixes.push('Added default width and height');
    }

    if (!svgElement.getAttribute('viewBox')) {
      const width = svgElement.getAttribute('width') || '600';
      const height = svgElement.getAttribute('height') || '400';
      svgElement.setAttribute('viewBox', `0 0 ${width} ${height}`);
      fixCount++;
      this.fixes.push('Added viewBox attribute');
    }

    return fixCount;
  }

  fixOverlapping(svgElement, overlappingIssues, document) {
    console.log('  🔧 Fixing overlapping elements...');
    let fixCount = 0;

    // Group overlaps by severity
    const highSeverity = overlappingIssues.filter(o => o.severity === 'high');
    const mediumSeverity = overlappingIssues.filter(o => o.severity === 'medium');

    // Get all elements
    const allElements = Array.from(svgElement.querySelectorAll('rect, circle, ellipse, path, polygon, line, text'));
    const visibleElements = allElements.filter(el => !el.closest('defs'));

    // Fix high severity overlaps first
    highSeverity.forEach(issue => {
      const elem1 = visibleElements[issue.index1];
      const elem2 = visibleElements[issue.index2];

      if (elem1 && elem2) {
        const tag1 = elem1.tagName.toLowerCase();
        const tag2 = elem2.tagName.toLowerCase();

        // Strategy: Move text elements, add grouping, adjust opacity
        if (tag2 === 'text') {
          // Move text slightly
          const y = parseFloat(elem2.getAttribute('y') || 0);
          elem2.setAttribute('y', (y - 15).toString());
          fixCount++;
          this.fixes.push(`Moved ${issue.element2} to avoid overlap`);
        } else if (tag1 === 'text') {
          const y = parseFloat(elem1.getAttribute('y') || 0);
          elem1.setAttribute('y', (y - 15).toString());
          fixCount++;
          this.fixes.push(`Moved ${issue.element1} to avoid overlap`);
        } else if (tag2 === 'rect' && !elem2.hasAttribute('opacity')) {
          // Add semi-transparency to boxes
          elem2.setAttribute('opacity', '0.9');
          fixCount++;
          this.fixes.push(`Added opacity to ${issue.element2}`);
        }
      }
    });

    // Fix medium severity overlaps
    mediumSeverity.slice(0, 5).forEach(issue => {
      const elem2 = visibleElements[issue.index2];
      if (elem2 && !elem2.hasAttribute('opacity')) {
        elem2.setAttribute('opacity', '0.85');
        fixCount++;
        this.fixes.push(`Added opacity to ${issue.element2} (medium overlap)`);
      }
    });

    return fixCount;
  }

  fixMissingAttributes(svgElement, missingIssues) {
    console.log('  🔧 Fixing missing attributes...');
    let fixCount = 0;

    const elements = Array.from(svgElement.querySelectorAll('rect, circle, ellipse, path, polygon, line'));

    elements.forEach((el) => {
      if (el.closest('defs')) return;

      const tag = el.tagName.toLowerCase();

      if (tag === 'rect') {
        if (!el.getAttribute('x')) { el.setAttribute('x', '0'); fixCount++; }
        if (!el.getAttribute('y')) { el.setAttribute('y', '0'); fixCount++; }
        if (!el.getAttribute('width')) { el.setAttribute('width', '50'); fixCount++; }
        if (!el.getAttribute('height')) { el.setAttribute('height', '50'); fixCount++; }
      } else if (tag === 'circle') {
        if (!el.getAttribute('cx')) { el.setAttribute('cx', '25'); fixCount++; }
        if (!el.getAttribute('cy')) { el.setAttribute('cy', '25'); fixCount++; }
        if (!el.getAttribute('r')) { el.setAttribute('r', '20'); fixCount++; }
      } else if (tag === 'line') {
        if (!el.getAttribute('x1')) { el.setAttribute('x1', '0'); fixCount++; }
        if (!el.getAttribute('y1')) { el.setAttribute('y1', '0'); fixCount++; }
        if (!el.getAttribute('x2')) { el.setAttribute('x2', '100'); fixCount++; }
        if (!el.getAttribute('y2')) { el.setAttribute('y2', '100'); fixCount++; }
      }
    });

    if (fixCount > 0) {
      this.fixes.push(`Added missing attributes to ${fixCount} elements`);
    }

    return fixCount;
  }

  fixStyles(svgElement, styleIssues) {
    console.log('  🔧 Fixing style issues...');
    let fixCount = 0;

    const elements = Array.from(svgElement.querySelectorAll('rect, circle, ellipse, path, polygon'));

    elements.forEach((el) => {
      if (el.closest('defs')) return;

      if (!el.getAttribute('fill') && !el.getAttribute('stroke') &&
          !el.style.fill && !el.style.stroke) {
        el.setAttribute('fill', 'none');
        el.setAttribute('stroke', 'black');
        fixCount++;
      }
    });

    // Check text elements for small fonts
    const textElements = svgElement.querySelectorAll('text');
    textElements.forEach((text) => {
      const fontSize = text.getAttribute('font-size') || text.style.fontSize;
      if (!fontSize || parseFloat(fontSize) < 8) {
        text.setAttribute('font-size', '10');
        fixCount++;
      }
    });

    if (fixCount > 0) {
      this.fixes.push(`Fixed ${fixCount} style issues`);
    }

    return fixCount;
  }

  getFixes() {
    return this.fixes;
  }

  clearFixes() {
    this.fixes = [];
  }
}

/**
 * Agent: Reviewer
 */
class SVGReviewer {
  review(beforeAnalysis, afterAnalysis, fixes) {
    const review = {
      before: beforeAnalysis.score,
      after: afterAnalysis.score,
      improvement: afterAnalysis.score - beforeAnalysis.score,
      percentImprovement: 0,
      recommendation: '',
      details: {},
      isImproved: false
    };

    if (beforeAnalysis.score > 0) {
      review.percentImprovement = (review.improvement / beforeAnalysis.score) * 100;
    }

    review.isImproved = review.improvement > 0;

    // Detailed comparison
    review.details = {
      overlapping: {
        before: beforeAnalysis.overlapping.length,
        after: afterAnalysis.overlapping.length,
        fixed: beforeAnalysis.overlapping.length - afterAnalysis.overlapping.length
      },
      dimensionIssues: {
        before: beforeAnalysis.dimensionIssues.length,
        after: afterAnalysis.dimensionIssues.length,
        fixed: beforeAnalysis.dimensionIssues.length - afterAnalysis.dimensionIssues.length
      },
      styleIssues: {
        before: beforeAnalysis.styleIssues.length,
        after: afterAnalysis.styleIssues.length,
        fixed: beforeAnalysis.styleIssues.length - afterAnalysis.styleIssues.length
      }
    };

    // Provide recommendation
    if (afterAnalysis.score >= 95) {
      review.recommendation = 'SVG is in excellent condition. Pipeline can stop.';
    } else if (afterAnalysis.score >= 85 && review.improvement < 1) {
      review.recommendation = 'SVG is in good condition. Minor improvements made. Can stop.';
    } else if (review.improvement < 0) {
      review.recommendation = 'Fixes made things worse. Revert and try different strategy.';
    } else if (review.improvement === 0) {
      review.recommendation = 'No improvement detected. Try different fixes or stop.';
    } else if (review.percentImprovement >= 5) {
      review.recommendation = 'Good improvement. Continue to next iteration.';
    } else {
      review.recommendation = 'Minimal improvement. Continue with caution or stop.';
    }

    return review;
  }
}

/**
 * Main Pipeline
 */
class SVGCorrectionPipeline {
  constructor() {
    this.analyzer = new SVGAnalyzer();
    this.fixer = new SVGFixer();
    this.reviewer = new SVGReviewer();
    this.report = {
      iterations: [],
      finalScore: 0,
      totalFixes: 0
    };
  }

  async processSVG(svgElement, document, svgIndex, description) {
    console.log(`\n${'='.repeat(70)}`);
    console.log(`🎨 Processing SVG #${svgIndex + 1}`);
    console.log('='.repeat(70));

    let iteration = 1;
    let continueProcessing = true;

    while (iteration <= CONFIG.maxIterations && continueProcessing) {
      console.log(`\n${'━'.repeat(3)} Iteration ${iteration} ${'━'.repeat(3)}`);

      // Step 1: Analyze
      console.log('📊 Step 1: Analyzing SVG...');
      const beforeAnalysis = this.analyzer.analyze(svgElement, description);
      console.log(`   Quality Score: ${beforeAnalysis.score.toFixed(1)}/100`);
      console.log(`   Issues Found:`);
      console.log(`     - Overlapping: ${beforeAnalysis.overlapping.length} (High: ${beforeAnalysis.details.highSeverity}, Med: ${beforeAnalysis.details.mediumSeverity}, Low: ${beforeAnalysis.details.lowSeverity})`);
      console.log(`     - Dimension Issues: ${beforeAnalysis.dimensionIssues.length}`);
      console.log(`     - Missing Attributes: ${beforeAnalysis.missingElements.length}`);
      console.log(`     - Style Issues: ${beforeAnalysis.styleIssues.length}`);
      console.log(`     - Structure Issues: ${beforeAnalysis.structureIssues.length}`);

      // Show overlap details
      if (beforeAnalysis.overlapping.length > 0) {
        console.log(`\n   📋 Overlap Details:`);
        beforeAnalysis.overlapping.slice(0, 10).forEach((overlap, idx) => {
          console.log(`     ${idx + 1}. ${overlap.element1} ↔ ${overlap.element2}`);
          console.log(`        Area: ${overlap.overlapArea.toFixed(1)}px², Severity: ${overlap.severity} (${overlap.overlapPercent}%)`);
        });
        if (beforeAnalysis.overlapping.length > 10) {
          console.log(`     ... and ${beforeAnalysis.overlapping.length - 10} more overlaps`);
        }
      }

      // Step 2: Fix
      console.log(`\n🔧 Step 2: Applying Fixes...`);
      this.fixer.clearFixes();

      let totalFixes = 0;
      totalFixes += this.fixer.fixDimensions(svgElement);
      totalFixes += this.fixer.fixOverlapping(svgElement, beforeAnalysis.overlapping, document);
      totalFixes += this.fixer.fixMissingAttributes(svgElement, beforeAnalysis.missingElements);
      totalFixes += this.fixer.fixStyles(svgElement, beforeAnalysis.styleIssues);

      console.log(`   Applied ${totalFixes} fixes`);

      // Step 3: Re-analyze
      console.log(`\n📊 Step 3: Re-analyzing after fixes...`);
      const afterAnalysis = this.analyzer.analyze(svgElement, description);

      // Step 4: Review
      console.log(`\n  📊 Reviewing changes...`);
      const review = this.reviewer.review(beforeAnalysis, afterAnalysis, this.fixer.getFixes());

      console.log(`     Before: ${review.before.toFixed(1)} → After: ${review.after.toFixed(1)}`);
      console.log(`     Improvement: ${review.improvement >= 0 ? '+' : ''}${review.improvement.toFixed(1)} (${review.percentImprovement.toFixed(1)}%)`);
      console.log(`     Recommendation: ${review.recommendation}`);

      // Save iteration report
      this.report.iterations.push({
        iteration,
        before: beforeAnalysis.score,
        after: afterAnalysis.score,
        improvement: review.improvement,
        fixes: this.fixer.getFixes(),
        details: review.details
      });

      // Save intermediate step
      if (CONFIG.saveIntermediateSteps) {
        this.saveIntermediateStep(document, svgIndex, iteration);
      }

      // Decision: continue or stop?
      if (afterAnalysis.score >= 95) {
        console.log(`\n✅ SVG quality is excellent! Stopping pipeline.`);
        continueProcessing = false;
      } else if (review.improvement <= 0 && iteration > 1) {
        console.log(`\n⚠️  No improvement or regression. Stopping pipeline.`);
        continueProcessing = false;
      } else if (afterAnalysis.score >= 85 && review.improvement < 2) {
        console.log(`\n✅ SVG is in good condition. Stopping pipeline.`);
        continueProcessing = false;
      }

      iteration++;
    }

    if (iteration > CONFIG.maxIterations) {
      console.log(`\n⚠️  Reached maximum iterations (${CONFIG.maxIterations})`);
    }

    console.log(`\n✅ Pipeline complete!`);

    return this.report;
  }

  saveIntermediateStep(document, svgIndex, iteration) {
    if (!fs.existsSync(CONFIG.outputDir)) {
      fs.mkdirSync(CONFIG.outputDir, { recursive: true });
    }

    const filename = `${CONFIG.outputDir}/svg_${svgIndex + 1}_iteration_${iteration}.html`;
    fs.writeFileSync(filename, document.documentElement.outerHTML, 'utf8');
  }
}

/**
 * Main execution
 */
async function main() {
  const args = process.argv.slice(2);

  if (args.length < 1) {
    console.log('Usage: node svg_correction_pipeline_v2.js <html_file> [description]');
    process.exit(1);
  }

  const inputFile = args[0];
  const description = args[1] || '';

  console.log('🚀 Starting SVG Correction Pipeline V2\n');
  console.log(`📄 Input: ${inputFile}`);
  console.log(`📝 Description: ${description}\n`);

  // Read HTML file
  const html = fs.readFileSync(inputFile, 'utf8');
  const dom = new JSDOM(html);
  const document = dom.window.document;

  // Find SVG elements
  const svgElements = document.querySelectorAll('svg');
  console.log(`🔍 Found ${svgElements.length} SVG element(s)\n`);

  if (svgElements.length === 0) {
    console.log('❌ No SVG elements found in the HTML file');
    process.exit(1);
  }

  // Process each SVG
  const pipeline = new SVGCorrectionPipeline();

  for (let i = 0; i < svgElements.length; i++) {
    await pipeline.processSVG(svgElements[i], document, i, description);
  }

  // Save corrected HTML
  const outputFile = inputFile.replace('.html', '_corrected_v2.html');
  fs.writeFileSync(outputFile, document.documentElement.outerHTML, 'utf8');
  console.log(`📁 Output saved to: ${outputFile}`);

  // Save detailed report
  const reportFile = `${CONFIG.outputDir}/pipeline_report_v2.json`;
  fs.writeFileSync(reportFile, JSON.stringify(pipeline.report, null, 2), 'utf8');

  console.log(`\n${'='.repeat(70)}`);
  console.log('📋 PIPELINE REPORT');
  console.log('='.repeat(70));

  pipeline.report.iterations.forEach((iter, idx) => {
    console.log(`\nSVG #1 - Iteration ${iter.iteration}:`);
    console.log(`  Score: ${iter.before.toFixed(1)} → ${iter.after.toFixed(1)}`);
    console.log(`  Fixes Applied: ${iter.fixes.length}`);
    iter.fixes.forEach(fix => {
      console.log(`    - ${fix}`);
    });
  });

  console.log(`\n📄 Full report saved to: ${reportFile}`);
}

main().catch(console.error);
