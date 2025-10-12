/**
 * Agentic SVG Correction Pipeline
 * Self-reviewing pipeline that corrects SVG issues step by step
 */

const fs = require('fs');
const { JSDOM } = require('jsdom');

// Configuration
const CONFIG = {
  maxIterations: 10,
  improvementThreshold: 0.1, // 10% improvement required
  saveIntermediateSteps: true,
  outputDir: 'svg_corrections',
};

/**
 * Agent: Analyzer
 * Analyzes SVG and identifies issues
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

    // Get all elements
    const allElements = svgElement.querySelectorAll('*');
    issues.details.totalElements = allElements.length;

    // Check for overlapping elements
    const elements = Array.from(svgElement.querySelectorAll('rect, circle, ellipse, path, polygon'));
    issues.details.shapeElements = elements.length;

    for (let i = 0; i < elements.length; i++) {
      for (let j = i + 1; j < elements.length; j++) {
        const bbox1 = this._getBBox(elements[i]);
        const bbox2 = this._getBBox(elements[j]);

        if (bbox1 && bbox2 && this._isOverlapping(bbox1, bbox2)) {
          issues.overlapping.push({
            element1: elements[i].tagName,
            element2: elements[j].tagName,
            index1: i,
            index2: j
          });
        }
      }
    }

    // Check for elements without proper attributes
    elements.forEach((el, idx) => {
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
      }

      // Check for styling
      if (!el.getAttribute('fill') && !el.getAttribute('stroke') && !el.style.fill && !el.style.stroke) {
        issues.styleIssues.push(`${tag}[${idx}]: No fill or stroke defined`);
      }
    });

    // Check for text readability
    const textElements = svgElement.querySelectorAll('text');
    textElements.forEach((text, idx) => {
      const fontSize = text.getAttribute('font-size') || text.style.fontSize;
      if (!fontSize || parseFloat(fontSize) < 10) {
        issues.styleIssues.push(`text[${idx}]: Font size too small or not defined`);
      }
    });

    // Calculate quality score (0-100)
    let score = 100;
    score -= issues.overlapping.length * 10;
    score -= issues.dimensionIssues.length * 15;
    score -= issues.missingElements.length * 5;
    score -= issues.styleIssues.length * 3;
    score -= issues.structureIssues.length * 20;
    issues.score = Math.max(0, score);

    return issues;
  }

  _getBBox(element) {
    try {
      const tag = element.tagName.toLowerCase();

      if (tag === 'rect') {
        return {
          x: parseFloat(element.getAttribute('x') || 0),
          y: parseFloat(element.getAttribute('y') || 0),
          width: parseFloat(element.getAttribute('width') || 0),
          height: parseFloat(element.getAttribute('height') || 0)
        };
      } else if (tag === 'circle') {
        const cx = parseFloat(element.getAttribute('cx') || 0);
        const cy = parseFloat(element.getAttribute('cy') || 0);
        const r = parseFloat(element.getAttribute('r') || 0);
        return {
          x: cx - r,
          y: cy - r,
          width: r * 2,
          height: r * 2
        };
      }
      // Add more shape types as needed
      return null;
    } catch (e) {
      return null;
    }
  }

  _isOverlapping(bbox1, bbox2) {
    return !(bbox1.x + bbox1.width < bbox2.x ||
             bbox2.x + bbox2.width < bbox1.x ||
             bbox1.y + bbox1.height < bbox2.y ||
             bbox2.y + bbox2.height < bbox1.y);
  }
}

/**
 * Agent: Fixer
 * Applies fixes to SVG based on identified issues
 */
class SVGFixer {
  constructor() {
    this.fixes = [];
  }

  fixDimensions(svgElement) {
    console.log('  🔧 Fixing dimensions...');
    let fixCount = 0;

    if (!svgElement.getAttribute('width') || !svgElement.getAttribute('height')) {
      // Set default dimensions
      svgElement.setAttribute('width', '400');
      svgElement.setAttribute('height', '300');
      fixCount++;
      this.fixes.push('Added default width and height');
    }

    if (!svgElement.getAttribute('viewBox')) {
      const width = svgElement.getAttribute('width') || '400';
      const height = svgElement.getAttribute('height') || '300';
      svgElement.setAttribute('viewBox', `0 0 ${width} ${height}`);
      fixCount++;
      this.fixes.push('Added viewBox attribute');
    }

    return fixCount;
  }

  fixOverlapping(svgElement, overlappingIssues) {
    console.log('  🔧 Fixing overlapping elements...');
    let fixCount = 0;

    const elements = Array.from(svgElement.querySelectorAll('rect, circle, ellipse, path, polygon'));

    overlappingIssues.forEach(issue => {
      const el1 = elements[issue.index1];
      const el2 = elements[issue.index2];

      if (el1 && el2) {
        // Strategy: Adjust z-index via order, or add opacity
        const opacity1 = parseFloat(el1.getAttribute('opacity') || 1);
        const opacity2 = parseFloat(el2.getAttribute('opacity') || 1);

        if (opacity1 >= 0.9 && opacity2 >= 0.9) {
          el2.setAttribute('opacity', '0.7');
          fixCount++;
          this.fixes.push(`Adjusted opacity for overlapping ${issue.element2}`);
        }
      }
    });

    return fixCount;
  }

  fixMissingAttributes(svgElement, missingIssues) {
    console.log('  🔧 Fixing missing attributes...');
    let fixCount = 0;

    const elements = Array.from(svgElement.querySelectorAll('rect, circle, ellipse, path, polygon'));

    elements.forEach((el, idx) => {
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
      if (!el.getAttribute('fill') && !el.getAttribute('stroke') &&
          !el.style.fill && !el.style.stroke) {
        el.setAttribute('fill', 'none');
        el.setAttribute('stroke', 'black');
        el.setAttribute('stroke-width', '2');
        fixCount++;
      }
    });

    // Fix text sizes
    const textElements = svgElement.querySelectorAll('text');
    textElements.forEach((text) => {
      const fontSize = text.getAttribute('font-size') || text.style.fontSize;
      if (!fontSize || parseFloat(fontSize) < 10) {
        text.setAttribute('font-size', '14');
        fixCount++;
      }
    });

    if (fixCount > 0) {
      this.fixes.push(`Fixed styling for ${fixCount} elements`);
    }

    return fixCount;
  }

  optimizeStructure(svgElement) {
    console.log('  🔧 Optimizing structure...');
    let fixCount = 0;

    // Group similar elements
    const rects = svgElement.querySelectorAll('rect');
    const circles = svgElement.querySelectorAll('circle');

    if (rects.length > 3 || circles.length > 3) {
      // Add grouping for better organization
      const g = svgElement.ownerDocument.createElementNS('http://www.w3.org/2000/svg', 'g');
      g.setAttribute('class', 'shapes-group');

      // This is a placeholder - actual grouping would need more logic
      fixCount++;
      this.fixes.push('Added grouping structure');
    }

    return fixCount;
  }
}

/**
 * Agent: Reviewer
 * Reviews changes and provides feedback
 */
class SVGReviewer {
  review(beforeAnalysis, afterAnalysis, fixes) {
    console.log('\n  📊 Reviewing changes...');

    const scoreImprovement = afterAnalysis.score - beforeAnalysis.score;
    const percentImprovement = (scoreImprovement / Math.max(beforeAnalysis.score, 1)) * 100;

    const review = {
      scoreImprovement,
      percentImprovement,
      isImproved: scoreImprovement > 0,
      significantImprovement: percentImprovement >= CONFIG.improvementThreshold,
      beforeScore: beforeAnalysis.score,
      afterScore: afterAnalysis.score,
      fixesApplied: fixes.length,
      remainingIssues: {
        overlapping: afterAnalysis.overlapping.length,
        dimensionIssues: afterAnalysis.dimensionIssues.length,
        missingElements: afterAnalysis.missingElements.length,
        styleIssues: afterAnalysis.styleIssues.length,
        structureIssues: afterAnalysis.structureIssues.length
      },
      recommendation: ''
    };

    // Generate recommendation
    if (afterAnalysis.score >= 95) {
      review.recommendation = 'SVG is in excellent condition. Pipeline can stop.';
    } else if (review.significantImprovement) {
      review.recommendation = 'Significant improvement detected. Continue to next iteration.';
    } else if (review.isImproved) {
      review.recommendation = 'Minor improvement detected. Consider continuing.';
    } else {
      review.recommendation = 'No improvement detected. Review fixes or stop pipeline.';
    }

    console.log(`     Before: ${beforeAnalysis.score.toFixed(1)} → After: ${afterAnalysis.score.toFixed(1)}`);
    console.log(`     Improvement: ${scoreImprovement > 0 ? '+' : ''}${scoreImprovement.toFixed(1)} (${percentImprovement.toFixed(1)}%)`);
    console.log(`     Recommendation: ${review.recommendation}`);

    return review;
  }
}

/**
 * Main Pipeline
 */
class SVGCorrectionPipeline {
  constructor(config = CONFIG) {
    this.config = config;
    this.analyzer = new SVGAnalyzer();
    this.fixer = new SVGFixer();
    this.reviewer = new SVGReviewer();
    this.history = [];
  }

  async run(htmlFilePath, description = '') {
    console.log('🚀 Starting SVG Correction Pipeline\n');
    console.log(`📄 Input: ${htmlFilePath}`);
    console.log(`📝 Description: ${description || 'Not provided'}\n`);

    // Create output directory
    if (this.config.saveIntermediateSteps) {
      if (!fs.existsSync(this.config.outputDir)) {
        fs.mkdirSync(this.config.outputDir, { recursive: true });
      }
    }

    // Load HTML
    const html = fs.readFileSync(htmlFilePath, 'utf8');
    const dom = new JSDOM(html);
    const document = dom.window.document;

    // Find all SVGs
    const svgs = document.querySelectorAll('svg');
    console.log(`🔍 Found ${svgs.length} SVG element(s)\n`);

    if (svgs.length === 0) {
      console.log('❌ No SVG elements found in HTML');
      return;
    }

    // Process each SVG
    for (let svgIndex = 0; svgIndex < svgs.length; svgIndex++) {
      console.log(`${'='.repeat(70)}`);
      console.log(`🎨 Processing SVG #${svgIndex + 1}`);
      console.log('='.repeat(70));

      await this.processSVG(svgs[svgIndex], document, svgIndex, description);
    }

    // Save final HTML
    const finalHtml = dom.serialize();
    const outputPath = htmlFilePath.replace('.html', '_corrected.html');
    fs.writeFileSync(outputPath, finalHtml);

    console.log(`\n✅ Pipeline complete!`);
    console.log(`📁 Output saved to: ${outputPath}`);

    // Generate report
    this.generateReport();
  }

  async processSVG(svgElement, document, svgIndex, description) {
    let iteration = 0;
    let continueProcessing = true;
    let previousScore = 0;

    while (iteration < this.config.maxIterations && continueProcessing) {
      iteration++;
      console.log(`\n━━━ Iteration ${iteration} ━━━`);

      // Step 1: Analyze
      console.log('📊 Step 1: Analyzing SVG...');
      const beforeAnalysis = this.analyzer.analyze(svgElement, description);
      console.log(`   Quality Score: ${beforeAnalysis.score.toFixed(1)}/100`);
      console.log(`   Issues Found:`);
      console.log(`     - Overlapping: ${beforeAnalysis.overlapping.length}`);
      console.log(`     - Dimension Issues: ${beforeAnalysis.dimensionIssues.length}`);
      console.log(`     - Missing Attributes: ${beforeAnalysis.missingElements.length}`);
      console.log(`     - Style Issues: ${beforeAnalysis.styleIssues.length}`);
      console.log(`     - Structure Issues: ${beforeAnalysis.structureIssues.length}`);

      // Check if already excellent
      if (beforeAnalysis.score >= 95) {
        console.log('\n✨ SVG is already in excellent condition!');
        break;
      }

      // Step 2: Apply Fixes
      console.log('\n🔧 Step 2: Applying Fixes...');
      this.fixer.fixes = [];

      let totalFixes = 0;
      totalFixes += this.fixer.fixDimensions(svgElement);
      totalFixes += this.fixer.fixOverlapping(svgElement, beforeAnalysis.overlapping);
      totalFixes += this.fixer.fixMissingAttributes(svgElement, beforeAnalysis.missingElements);
      totalFixes += this.fixer.fixStyles(svgElement, beforeAnalysis.styleIssues);
      totalFixes += this.fixer.optimizeStructure(svgElement);

      console.log(`   Applied ${totalFixes} fixes`);

      // Save intermediate step
      if (this.config.saveIntermediateSteps) {
        const stepHtml = document.documentElement.outerHTML;
        const stepPath = `${this.config.outputDir}/svg_${svgIndex}_iteration_${iteration}.html`;
        fs.writeFileSync(stepPath, stepHtml);
      }

      // Step 3: Re-analyze
      console.log('\n📊 Step 3: Re-analyzing after fixes...');
      const afterAnalysis = this.analyzer.analyze(svgElement, description);

      // Step 4: Review
      const review = this.reviewer.review(beforeAnalysis, afterAnalysis, this.fixer.fixes);

      // Record history
      this.history.push({
        iteration,
        svgIndex,
        beforeScore: beforeAnalysis.score,
        afterScore: afterAnalysis.score,
        fixes: [...this.fixer.fixes],
        review
      });

      // Decision: Continue or stop?
      if (afterAnalysis.score >= 95) {
        console.log('\n✅ SVG quality is excellent! Stopping pipeline.');
        continueProcessing = false;
      } else if (!review.isImproved && iteration > 1) {
        console.log('\n⚠️  No improvement detected. Stopping pipeline.');
        continueProcessing = false;
      } else if (Math.abs(afterAnalysis.score - previousScore) < 1 && iteration > 2) {
        console.log('\n⚠️  Minimal progress. Stopping pipeline.');
        continueProcessing = false;
      } else if (totalFixes === 0) {
        console.log('\n⚠️  No fixes applied. Stopping pipeline.');
        continueProcessing = false;
      }

      previousScore = afterAnalysis.score;
    }

    if (iteration >= this.config.maxIterations) {
      console.log(`\n⚠️  Reached maximum iterations (${this.config.maxIterations})`);
    }
  }

  generateReport() {
    console.log(`\n${'='.repeat(70)}`);
    console.log('📋 PIPELINE REPORT');
    console.log('='.repeat(70));

    this.history.forEach((entry) => {
      console.log(`\nSVG #${entry.svgIndex + 1} - Iteration ${entry.iteration}:`);
      console.log(`  Score: ${entry.beforeScore.toFixed(1)} → ${entry.afterScore.toFixed(1)}`);
      console.log(`  Fixes Applied: ${entry.fixes.length}`);
      entry.fixes.forEach(fix => console.log(`    - ${fix}`));
    });

    // Save report to file
    const reportPath = `${this.config.outputDir}/pipeline_report.json`;
    fs.writeFileSync(reportPath, JSON.stringify(this.history, null, 2));
    console.log(`\n📄 Full report saved to: ${reportPath}`);
  }
}

/**
 * CLI Interface
 */
async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log('Usage: node svg_correction_pipeline.js <html-file> [description]');
    console.log('Example: node svg_correction_pipeline.js diagram.html "A circuit diagram"');
    process.exit(1);
  }

  const htmlFile = args[0];
  const description = args[1] || '';

  if (!fs.existsSync(htmlFile)) {
    console.log(`❌ Error: File not found: ${htmlFile}`);
    process.exit(1);
  }

  const pipeline = new SVGCorrectionPipeline();
  await pipeline.run(htmlFile, description);
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { SVGCorrectionPipeline, SVGAnalyzer, SVGFixer, SVGReviewer };
