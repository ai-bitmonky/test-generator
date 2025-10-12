/**
 * Comprehensive Question Validation Pipeline
 * Multi-agent system to validate every aspect of questions from database
 */

const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const CONFIG = {
  batchSize: 10,
  outputDir: 'validation_reports',
  runAllSubjects: process.argv[2] === 'all', // Run all subjects
  singleSubject: process.argv[2] !== 'all' ? process.argv[2] : null,
};

// ============================================================================
// Agent 1: Problem Consistency Validator
// ============================================================================

class ProblemConsistencyValidator {
  validate(question) {
    console.log('  🔍 Agent 1: Validating Problem Consistency...');

    const issues = [];

    // Check if question text exists and is not empty
    if (!question.question || question.question.trim().length === 0) {
      issues.push({
        severity: 'critical',
        agent: 'Problem Consistency',
        issue: 'Question text is empty or missing',
        field: 'question'
      });
    }

    // Check for ambiguous language
    const ambiguousPatterns = [
      /\?\?/g,
      /\[unclear\]/gi,
      /\[missing\]/gi,
      /\[TODO\]/gi,
      /\.\.\./g,
    ];

    ambiguousPatterns.forEach(pattern => {
      if (pattern.test(question.question)) {
        issues.push({
          severity: 'high',
          agent: 'Problem Consistency',
          issue: `Ambiguous content detected in question: ${pattern.source}`,
          field: 'question'
        });
      }
    });

    // Check for incomplete sentences - DISABLED per user request
    // const questionText = question.question.trim();
    // if (!questionText.endsWith('?') && !questionText.endsWith('.') &&
    //     !questionText.includes('find') && !questionText.includes('calculate')) {
    //   issues.push({
    //     severity: 'medium',
    //     agent: 'Problem Consistency',
    //     issue: 'Question may be incomplete (no proper ending punctuation)',
    //     field: 'question'
    //   });
    // }

    // Check for LaTeX consistency
    const unrenderedLatex = [
      /\\\$/g,
      /\\\(/g,
      /\\\)/g,
      /\\\[/g,
      /\\\]/g,
    ];

    unrenderedLatex.forEach(pattern => {
      if (pattern.test(question.question)) {
        issues.push({
          severity: 'high',
          agent: 'Problem Consistency',
          issue: 'Unrendered LaTeX detected',
          field: 'question',
          details: `Pattern: ${pattern.source}`
        });
      }
    });

    const result = {
      passed: issues.length === 0,
      issues: issues
    };

    console.log(`     ${result.passed ? '✅' : '❌'} Found ${issues.length} issues`);
    return result;
  }
}

// ============================================================================
// Agent 2: Figure Validator
// ============================================================================

class FigureValidator {
  validate(question) {
    console.log('  🔍 Agent 2: Validating Figures...');

    const issues = [];

    // Check if figure is mentioned in question
    const figureKeywords = [
      /figure\s+shows?/gi,
      /diagram\s+shows?/gi,
      /graph\s+shows?/gi,
      /\[Figure/gi,
      /see\s+(the\s+)?figure/gi,
      /in\s+(the\s+)?figure/gi,
      /from\s+(the\s+)?figure/gi,
      /as\s+shown/gi,
    ];

    const figureRequired = figureKeywords.some(pattern => pattern.test(question.question));

    if (figureRequired) {
      // Check if SVG or image is available
      const hasSVG = question.question_html?.includes('<svg') || false;
      const hasImage = question.question_html?.includes('<img') || false;
      const hasFigureTag = question.question_html?.includes('figure') || false;

      if (!hasSVG && !hasImage && !hasFigureTag) {
        issues.push({
          severity: 'critical',
          agent: 'Figure Validator',
          issue: 'Figure mentioned in problem but no visual element found',
          field: 'question_html',
          details: 'Question references a figure but question_html has no SVG, image, or figure tag'
        });
      }

      // Check for MISSING FIGURE tag
      if (question.question_html?.includes('MISSING FIGURE')) {
        issues.push({
          severity: 'critical',
          agent: 'Figure Validator',
          issue: 'Question explicitly marked with MISSING FIGURE',
          field: 'question_html'
        });
      }

      // If SVG exists, verify it matches description
      if (hasSVG) {
        const result = this.validateSVGConsistency(question);
        issues.push(...result);
      }
    }

    const result = {
      passed: issues.length === 0,
      issues: issues,
      figureRequired: figureRequired
    };

    console.log(`     ${result.passed ? '✅' : '❌'} Found ${issues.length} issues`);
    return result;
  }

  validateSVGConsistency(question) {
    const issues = [];

    // Extract figure description from question
    const figureDescMatch = question.question.match(/\[Figure shows?:(.*?)\]/i);
    if (figureDescMatch) {
      const description = figureDescMatch[1].trim();

      // Check if SVG is very small (likely placeholder)
      const svgMatch = question.question_html?.match(/<svg[^>]*>/);
      if (svgMatch) {
        const widthMatch = svgMatch[0].match(/width="(\d+)"/);
        const heightMatch = svgMatch[0].match(/height="(\d+)"/);

        if (widthMatch && heightMatch) {
          const width = parseInt(widthMatch[1]);
          const height = parseInt(heightMatch[1]);

          if (width < 100 || height < 100) {
            issues.push({
              severity: 'medium',
              agent: 'Figure Validator',
              issue: 'SVG dimensions very small, may be placeholder',
              field: 'question_html',
              details: `Width: ${width}px, Height: ${height}px`
            });
          }
        }
      }
    }

    return issues;
  }
}

// ============================================================================
// Agent 3: Options Validator
// ============================================================================

class OptionsValidator {
  validate(question) {
    console.log('  🔍 Agent 3: Validating Options...');

    const issues = [];

    // Check if options exist
    if (!question.options || typeof question.options !== 'object') {
      issues.push({
        severity: 'critical',
        agent: 'Options Validator',
        issue: 'Options field is missing or invalid',
        field: 'options'
      });
      return { passed: false, issues };
    }

    const options = question.options;

    // Check if all four options exist (a, b, c, d)
    const requiredOptions = ['a', 'b', 'c', 'd'];
    const missingOptions = requiredOptions.filter(opt => !options[opt] || options[opt].trim() === '');

    if (missingOptions.length > 0) {
      issues.push({
        severity: 'critical',
        agent: 'Options Validator',
        issue: `Missing options: ${missingOptions.join(', ')}`,
        field: 'options',
        details: `Found only: ${Object.keys(options).filter(k => options[k]).join(', ')}`
      });
    }

    // Check for duplicate options
    const optionValues = Object.values(options).filter(v => v && v.trim());
    const uniqueValues = new Set(optionValues.map(v => v.trim().toLowerCase()));

    if (optionValues.length !== uniqueValues.size) {
      issues.push({
        severity: 'high',
        agent: 'Options Validator',
        issue: 'Duplicate options detected',
        field: 'options'
      });
    }

    // Check if correct_answer is valid
    if (!question.correct_answer) {
      issues.push({
        severity: 'critical',
        agent: 'Options Validator',
        issue: 'No correct answer specified',
        field: 'correct_answer'
      });
    } else {
      const answerKey = question.correct_answer.toLowerCase();
      if (!requiredOptions.includes(answerKey)) {
        issues.push({
          severity: 'critical',
          agent: 'Options Validator',
          issue: `Invalid correct answer: "${question.correct_answer}" (must be a, b, c, or d)`,
          field: 'correct_answer'
        });
      }
    }

    // Check for LaTeX issues in options
    requiredOptions.forEach(opt => {
      if (options[opt]) {
        if (/\\\$|\\\(|\\\)/.test(options[opt])) {
          issues.push({
            severity: 'medium',
            agent: 'Options Validator',
            issue: `Unrendered LaTeX in option ${opt.toUpperCase()}`,
            field: 'options',
            details: options[opt].substring(0, 50)
          });
        }
      }
    });

    const result = {
      passed: issues.length === 0,
      issues: issues
    };

    console.log(`     ${result.passed ? '✅' : '❌'} Found ${issues.length} issues`);
    return result;
  }
}

// ============================================================================
// Agent 4: Solution Consistency Validator
// ============================================================================

class SolutionConsistencyValidator {
  validate(question) {
    console.log('  🔍 Agent 4: Validating Solution Consistency...');

    const issues = [];

    // Check if solution exists
    if (!question.solution_html && !question.solution_text) {
      issues.push({
        severity: 'critical',
        agent: 'Solution Consistency',
        issue: 'No solution provided',
        field: 'solution_html'
      });
      return { passed: false, issues };
    }

    const solutionText = question.solution_html || question.solution_text || '';

    // Check if solution mentions the correct answer - DISABLED per user request
    // if (question.correct_answer) {
    //   const answerRegex = new RegExp(`option\\s+${question.correct_answer}|answer\\s+(is\\s+)?${question.correct_answer}|\\(${question.correct_answer}\\)`, 'gi');

    //   if (!answerRegex.test(solutionText)) {
    //     issues.push({
    //       severity: 'high',
    //       agent: 'Solution Consistency',
    //       issue: `Solution doesn't explicitly mention the correct answer (${question.correct_answer.toUpperCase()})`,
    //       field: 'solution_html'
    //     });
    //   }
    // }

    // Check for required solution components
    const hasStrategy = /strategy/gi.test(solutionText);
    const hasExpertInsight = /expert\s+insight/gi.test(solutionText);
    const hasKeyFacts = /key\s+facts/gi.test(solutionText);
    const hasSteps = /step\s+\d|<ol|<li/gi.test(solutionText);

    if (!hasStrategy) {
      issues.push({
        severity: 'medium',
        agent: 'Solution Consistency',
        issue: 'Solution missing "Strategy" section',
        field: 'solution_html'
      });
    }

    if (!hasExpertInsight) {
      issues.push({
        severity: 'medium',
        agent: 'Solution Consistency',
        issue: 'Solution missing "Expert Insight" section',
        field: 'solution_html'
      });
    }

    if (!hasKeyFacts) {
      issues.push({
        severity: 'medium',
        agent: 'Solution Consistency',
        issue: 'Solution missing "Key Facts Used" section',
        field: 'solution_html'
      });
    }

    if (!hasSteps) {
      issues.push({
        severity: 'high',
        agent: 'Solution Consistency',
        issue: 'Solution missing step-by-step breakdown',
        field: 'solution_html'
      });
    }

    // Check for formulas/theorems in key facts
    if (hasKeyFacts) {
      const keyFactsMatch = solutionText.match(/key\s+facts[^<]*<\/strong>(.*?)(?=<div|$)/gis);
      if (keyFactsMatch) {
        const keyFactsContent = keyFactsMatch[0];

        // Should contain mathematical formulas or theorem names
        const hasFormulas = /[=+\-*/^√∫∑∏]/g.test(keyFactsContent) ||
                           /theorem|formula|law|equation|identity/gi.test(keyFactsContent);

        if (!hasFormulas) {
          issues.push({
            severity: 'low',
            agent: 'Solution Consistency',
            issue: 'Key Facts section may not contain formulas/theorems',
            field: 'solution_html'
          });
        }
      }
    }

    const result = {
      passed: issues.filter(i => i.severity === 'critical' || i.severity === 'high').length === 0,
      issues: issues
    };

    console.log(`     ${result.passed ? '✅' : '❌'} Found ${issues.length} issues`);
    return result;
  }
}

// ============================================================================
// Agent 5: Answer Correctness Validator
// ============================================================================

class AnswerCorrectnessValidator {
  validate(question) {
    console.log('  🔍 Agent 5: Validating Answer Correctness...');

    const issues = [];

    // This agent performs logical checks, not absolute correctness
    // (absolute correctness requires domain expertise)

    // Check if answer exists in solution
    if (question.correct_answer && question.solution_html) {
      const correctOpt = question.correct_answer.toLowerCase();
      const correctValue = question.options?.[correctOpt];

      if (correctValue) {
        // Check if the solution contains the answer value
        const normalizedAnswer = correctValue.trim().toLowerCase();
        const normalizedSolution = question.solution_html.toLowerCase();

        // Simple check: does the solution mention the answer value?
        // (This is a heuristic, not foolproof)
        const answerMentioned = normalizedSolution.includes(normalizedAnswer.substring(0, 20));

        if (!answerMentioned && correctValue.length > 5) {
          issues.push({
            severity: 'medium',
            agent: 'Answer Correctness',
            issue: 'Solution may not derive/mention the stated answer',
            field: 'solution_html',
            details: 'Answer value not found in solution text'
          });
        }
      }
    }

    // Check for contradictions
    const solutionText = question.solution_html || '';

    // Look for phrases indicating uncertainty
    const uncertainPhrases = [
      /might be/gi,
      /possibly/gi,
      /not sure/gi,
      /unclear/gi,
      /need\s+to\s+verify/gi,
      /cannot\s+determine/gi,
    ];

    uncertainPhrases.forEach(pattern => {
      if (pattern.test(solutionText)) {
        issues.push({
          severity: 'high',
          agent: 'Answer Correctness',
          issue: 'Solution contains uncertain language',
          field: 'solution_html',
          details: `Pattern: ${pattern.source}`
        });
      }
    });

    const result = {
      passed: issues.filter(i => i.severity === 'high').length === 0,
      issues: issues,
      note: 'This agent performs logical consistency checks. Manual review recommended for absolute correctness.'
    };

    console.log(`     ${result.passed ? '✅' : '❌'} Found ${issues.length} issues`);
    return result;
  }
}

// ============================================================================
// Agent 6: Question Type Validator
// ============================================================================

class QuestionTypeValidator {
  validate(question) {
    console.log('  🔍 Agent 6: Validating Question Type...');

    const issues = [];

    // Check if question_type exists
    if (!question.question_type || question.question_type.trim() === '') {
      issues.push({
        severity: 'high',
        agent: 'Question Type',
        issue: 'Question type not defined',
        field: 'question_type'
      });
    } else {
      // Validate if type matches content
      const type = question.question_type.toLowerCase();
      const questionText = question.question.toLowerCase();
      const optionsCount = question.options ? Object.keys(question.options).length : 0;

      // Check for consistency
      if (type.includes('multiple choice') && optionsCount < 2) {
        issues.push({
          severity: 'high',
          agent: 'Question Type',
          issue: 'Type is "Multiple Choice" but insufficient options',
          field: 'question_type'
        });
      }

      if (type.includes('numerical') && optionsCount > 0) {
        issues.push({
          severity: 'medium',
          agent: 'Question Type',
          issue: 'Type is "Numerical" but has multiple choice options',
          field: 'question_type'
        });
      }

      if (type.includes('true/false') && optionsCount !== 2) {
        issues.push({
          severity: 'medium',
          agent: 'Question Type',
          issue: 'Type is "True/False" but doesn\'t have exactly 2 options',
          field: 'question_type'
        });
      }

      // Suggest type based on content
      const suggestedType = this.suggestType(question);
      if (suggestedType && suggestedType.toLowerCase() !== type) {
        issues.push({
          severity: 'low',
          agent: 'Question Type',
          issue: `Type may be incorrect. Current: "${question.question_type}", Suggested: "${suggestedType}"`,
          field: 'question_type'
        });
      }
    }

    const result = {
      passed: issues.filter(i => i.severity === 'high').length === 0,
      issues: issues
    };

    console.log(`     ${result.passed ? '✅' : '❌'} Found ${issues.length} issues`);
    return result;
  }

  suggestType(question) {
    const questionText = question.question.toLowerCase();
    const optionsCount = question.options ? Object.keys(question.options).length : 0;

    if (optionsCount === 4) {
      if (questionText.includes('which') || questionText.includes('select') ||
          questionText.includes('choose') || questionText.includes('correct')) {
        return 'Multiple Choice Single Answer';
      }
    }

    if (optionsCount === 0 || !question.options) {
      if (questionText.includes('calculate') || questionText.includes('find') ||
          questionText.includes('determine') || questionText.includes('how many')) {
        return 'Numerical';
      }
    }

    if (optionsCount === 2) {
      return 'True/False';
    }

    return 'Multiple Choice Single Answer'; // Default
  }
}

// ============================================================================
// Master Orchestrator
// ============================================================================

class ValidationOrchestrator {
  constructor() {
    this.agents = [
      new ProblemConsistencyValidator(),
      new FigureValidator(),
      new OptionsValidator(),
      new SolutionConsistencyValidator(),
      new AnswerCorrectnessValidator(),
      new QuestionTypeValidator(),
    ];
  }

  async validateQuestion(question) {
    console.log(`\n${'='.repeat(70)}`);
    console.log(`📝 Validating Question: ${question.external_id}`);
    console.log(`   Subject: ${question.subject}, Topic: ${question.topic}`);
    console.log('='.repeat(70));

    const results = {
      external_id: question.external_id,
      subject: question.subject,
      topic: question.topic,
      question: question,
      agentResults: [],
      overallPass: true,
      criticalIssues: [],
      highIssues: [],
      mediumIssues: [],
      lowIssues: []
    };

    // Run all agents
    for (const agent of this.agents) {
      const result = agent.validate(question);
      results.agentResults.push(result);

      // Categorize issues
      result.issues.forEach(issue => {
        if (issue.severity === 'critical') {
          results.criticalIssues.push(issue);
          results.overallPass = false;
        } else if (issue.severity === 'high') {
          results.highIssues.push(issue);
          results.overallPass = false;
        } else if (issue.severity === 'medium') {
          results.mediumIssues.push(issue);
        } else {
          results.lowIssues.push(issue);
        }
      });
    }

    const totalIssues = results.criticalIssues.length + results.highIssues.length +
                       results.mediumIssues.length + results.lowIssues.length;

    console.log(`\n📊 Validation Summary:`);
    console.log(`   Overall: ${results.overallPass ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`   Critical Issues: ${results.criticalIssues.length}`);
    console.log(`   High Issues: ${results.highIssues.length}`);
    console.log(`   Medium Issues: ${results.mediumIssues.length}`);
    console.log(`   Low Issues: ${results.lowIssues.length}`);
    console.log(`   Total Issues: ${totalIssues}`);

    return results;
  }

  async processDatabase() {
    console.log('🚀 Starting Question Validation Pipeline\n');
    console.log('='.repeat(70));

    let subjects = [];

    if (CONFIG.runAllSubjects) {
      // Get all unique subjects
      const { data: subjectData } = await supabase
        .from('questions')
        .select('subject')
        .order('subject');

      subjects = [...new Set(subjectData.map(q => q.subject))];
      console.log(`📚 Processing all subjects: ${subjects.join(', ')}\n`);
    } else if (CONFIG.singleSubject) {
      subjects = [CONFIG.singleSubject];
      console.log(`📚 Processing subject: ${CONFIG.singleSubject}\n`);
    } else {
      // Process all questions together
      subjects = ['All'];
    }

    for (const subject of subjects) {
      await this.processSubject(subject);
    }

    console.log(`\n${'='.repeat(70)}`);
    console.log('✅ Validation Pipeline Complete');
    console.log('='.repeat(70));
  }

  async processSubject(subject) {
    console.log(`\n${'█'.repeat(70)}`);
    console.log(`📖 PROCESSING SUBJECT: ${subject}`);
    console.log('█'.repeat(70) + '\n');

    // Fetch questions for this subject
    let query = supabase
      .from('questions')
      .select('*')
      .order('external_id');

    if (subject !== 'All') {
      query = query.eq('subject', subject);
    }

    const { data: questions, error } = await query;

    if (error) {
      console.error(`❌ Error fetching questions for ${subject}:`, error);
      return;
    }

    console.log(`📦 Fetched ${questions.length} questions for ${subject}\n`);

    if (questions.length === 0) {
      console.log(`⚠️  No questions found for ${subject}\n`);
      return;
    }

    const allResults = [];
    const questionsWithIssues = [];
    const batchReports = [];

    // Process in batches of 10
    for (let i = 0; i < questions.length; i += CONFIG.batchSize) {
      const batch = questions.slice(i, i + CONFIG.batchSize);
      const batchNum = Math.floor(i / CONFIG.batchSize) + 1;
      const totalBatches = Math.ceil(questions.length / CONFIG.batchSize);

      console.log(`\n${'='.repeat(70)}`);
      console.log(`📦 Batch ${batchNum}/${totalBatches} - Questions ${i + 1} to ${Math.min(i + CONFIG.batchSize, questions.length)}`);
      console.log('='.repeat(70));

      const batchResults = [];

      for (const question of batch) {
        const result = await this.validateQuestion(question);
        allResults.push(result);
        batchResults.push(result);

        if (!result.overallPass || result.mediumIssues.length > 0 || result.lowIssues.length > 0) {
          questionsWithIssues.push(result);
        }
      }

      // Generate batch report
      const batchWithIssues = batchResults.filter(r =>
        !r.overallPass || r.mediumIssues.length > 0 || r.lowIssues.length > 0
      );

      batchReports.push({
        batchNum,
        startIndex: i + 1,
        endIndex: Math.min(i + CONFIG.batchSize, questions.length),
        results: batchResults,
        questionsWithIssues: batchWithIssues
      });

      // Generate separate HTML file for this batch
      if (batchWithIssues.length > 0) {
        this.generateBatchHTMLFile(subject, batchNum, i + 1, Math.min(i + CONFIG.batchSize, questions.length), batchResults, batchWithIssues);
      }

      console.log(`\n  📊 Batch ${batchNum} Summary:`);
      console.log(`     Questions processed: ${batchResults.length}`);
      console.log(`     Questions with issues: ${batchWithIssues.length}`);
      console.log(`     Pass rate: ${((batchResults.filter(r => r.overallPass && r.mediumIssues.length === 0 && r.lowIssues.length === 0).length / batchResults.length) * 100).toFixed(1)}%`);

      // Small delay between batches
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    // Generate comprehensive report for this subject
    this.generateSubjectReport(subject, allResults, questionsWithIssues, batchReports);
  }

  generateBatchHTMLFile(subject, batchNum, startIndex, endIndex, allBatchResults, batchWithIssues) {
    if (!fs.existsSync(CONFIG.outputDir)) {
      fs.mkdirSync(CONFIG.outputDir, { recursive: true });
    }

    const sanitizedSubject = subject.replace(/[^a-zA-Z0-9]/g, '_');
    const timestamp = Date.now();
    const fileName = `${CONFIG.outputDir}/${sanitizedSubject}_Batch${String(batchNum).padStart(2, '0')}_Q${startIndex}-${endIndex}_${timestamp}.html`;

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject} - Batch ${batchNum} (Questions ${startIndex}-${endIndex})</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      line-height: 1.8;
      padding: 30px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
    }
    .container { max-width: 1200px; margin: 0 auto; background: white; padding: 40px; border-radius: 15px; box-shadow: 0 10px 50px rgba(0,0,0,0.3); }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px; margin-bottom: 30px; text-align: center; }
    .header h1 { font-size: 36px; margin-bottom: 10px; }
    .header .batch-info { font-size: 20px; opacity: 0.9; }
    .summary {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      gap: 15px;
      margin: 30px 0;
    }
    .summary-card {
      background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
      color: white;
      padding: 20px;
      border-radius: 10px;
      text-align: center;
      box-shadow: 0 4px 10px rgba(0,0,0,0.1);
    }
    .summary-card h3 { font-size: 13px; opacity: 0.9; margin-bottom: 10px; text-transform: uppercase; }
    .summary-card .value { font-size: 32px; font-weight: bold; }
    .question-card {
      border: 3px solid #e0e0e0;
      border-radius: 12px;
      padding: 30px;
      margin: 30px 0;
      background: #fafafa;
      box-shadow: 0 4px 12px rgba(0,0,0,0.08);
    }
    .question-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 25px;
      padding-bottom: 15px;
      border-bottom: 3px solid #3498db;
    }
    .question-id { font-size: 22px; font-weight: bold; color: #2c3e50; font-family: 'Courier New', monospace; }
    .badge {
      padding: 8px 16px;
      border-radius: 25px;
      font-size: 12px;
      font-weight: bold;
      text-transform: uppercase;
    }
    .badge.critical { background: #e74c3c; color: white; }
    .badge.high { background: #e67e22; color: white; }
    .badge.medium { background: #f39c12; color: white; }
    .badge.low { background: #95a5a6; color: white; }
    .meta {
      background: #ecf0f1;
      padding: 15px;
      border-radius: 8px;
      margin: 20px 0;
      font-size: 15px;
    }
    .meta strong { color: #2c3e50; }
    .issue-section {
      background: #fff3cd;
      border-left: 5px solid #ffc107;
      padding: 20px;
      margin: 20px 0;
      border-radius: 8px;
    }
    .issue-section h3 { color: #856404; margin-bottom: 15px; }
    .issue {
      background: white;
      border-left: 5px solid #e74c3c;
      padding: 15px;
      margin: 12px 0;
      border-radius: 6px;
    }
    .issue.high { border-left-color: #e67e22; }
    .issue.medium { border-left-color: #f39c12; }
    .issue.low { border-left-color: #95a5a6; }
    .issue-header {
      font-weight: bold;
      color: #2c3e50;
      margin-bottom: 8px;
      font-size: 15px;
    }
    .issue-details {
      color: #7f8c8d;
      font-size: 14px;
      margin-top: 8px;
      padding: 8px;
      background: #f8f9fa;
      border-radius: 4px;
    }
    .question-content {
      background: #ffffff;
      padding: 25px;
      border-radius: 10px;
      margin: 20px 0;
      border: 2px solid #dee2e6;
      line-height: 2;
      font-size: 17px;
    }
    .question-content h4 {
      color: #2c3e50;
      margin-bottom: 15px;
      border-bottom: 3px solid #3498db;
      padding-bottom: 10px;
      font-size: 20px;
    }
    .options { margin: 25px 0; }
    .option {
      padding: 18px;
      margin: 12px 0;
      background: #f8f9fa;
      border-radius: 8px;
      border-left: 5px solid #3498db;
      font-size: 16px;
      transition: all 0.2s;
    }
    .option:hover { background: #e8f4f8; transform: translateX(5px); }
    .option.correct {
      border-left-color: #27ae60;
      background: linear-gradient(135deg, #e8f8f5 0%, #d5f4e6 100%);
      font-weight: bold;
      box-shadow: 0 2px 8px rgba(39, 174, 96, 0.2);
    }
    .option strong { color: #2c3e50; margin-right: 10px; font-size: 18px; }
    .solution {
      background: linear-gradient(135deg, #e8f6f3 0%, #dfe6e9 100%);
      padding: 25px;
      border-radius: 10px;
      margin: 25px 0;
      border: 3px solid #27ae60;
    }
    .solution h4 { color: #27ae60; margin-bottom: 20px; font-size: 22px; }
    .back-to-top {
      position: fixed;
      bottom: 30px;
      right: 30px;
      background: #3498db;
      color: white;
      padding: 15px;
      border-radius: 50%;
      width: 55px;
      height: 55px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 22px;
      cursor: pointer;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      transition: all 0.3s;
    }
    .back-to-top:hover { background: #2980b9; transform: translateY(-5px); }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>📚 ${subject}</h1>
      <div class="batch-info">Batch ${batchNum}: Questions ${startIndex} - ${endIndex}</div>
      <div style="font-size: 14px; margin-top: 10px; opacity: 0.8;">Generated: ${new Date().toLocaleString()}</div>
    </div>

    <div class="summary">
      <div class="summary-card">
        <h3>Total Questions</h3>
        <div class="value">${allBatchResults.length}</div>
      </div>
      <div class="summary-card" style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);">
        <h3>With Issues</h3>
        <div class="value">${batchWithIssues.length}</div>
      </div>
      <div class="summary-card" style="background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);">
        <h3>Pass Rate</h3>
        <div class="value">${((allBatchResults.length - batchWithIssues.length) / allBatchResults.length * 100).toFixed(0)}%</div>
      </div>
      <div class="summary-card" style="background: linear-gradient(135deg, #fa709a 0%, #fee140 100%);">
        <h3>Total Issues</h3>
        <div class="value">${batchWithIssues.reduce((sum, r) => sum + r.criticalIssues.length + r.highIssues.length + r.mediumIssues.length + r.lowIssues.length, 0)}</div>
      </div>
    </div>

    <h2 style="margin: 40px 0 20px 0; color: #2c3e50; border-bottom: 4px solid #3498db; padding-bottom: 15px; font-size: 28px;">
      📝 Questions with Issues (${batchWithIssues.length} of ${allBatchResults.length})
    </h2>

    ${batchWithIssues.map(result => this.generateQuestionHTML(result)).join('\n')}

    ${batchWithIssues.length === 0 ? '<div style="text-align: center; padding: 60px; background: #e8f8f5; border-radius: 10px; margin: 40px 0;"><h2 style="color: #27ae60; font-size: 28px;">🎉 All questions in this batch passed validation!</h2></div>' : ''}
  </div>

  <div class="back-to-top" onclick="window.scrollTo({top: 0, behavior: 'smooth'})">↑</div>
</body>
</html>`;

    fs.writeFileSync(fileName, html, 'utf8');
    console.log(`     📄 Batch report saved: ${fileName}`);
  }

  generateSubjectReport(subject, allResults, questionsWithIssues, batchReports) {
    console.log(`\n📊 Generating Report for ${subject}...`);

    if (!fs.existsSync(CONFIG.outputDir)) {
      fs.mkdirSync(CONFIG.outputDir, { recursive: true });
    }

    const timestamp = Date.now();
    const sanitizedSubject = subject.replace(/[^a-zA-Z0-9]/g, '_');
    const reportFile = `${CONFIG.outputDir}/${sanitizedSubject}_validation_report_${timestamp}.html`;

    const html = this.generateSubjectHTML(subject, allResults, questionsWithIssues, batchReports);
    fs.writeFileSync(reportFile, html, 'utf8');

    // Also save JSON summary
    const summaryFile = `${CONFIG.outputDir}/${sanitizedSubject}_validation_summary_${timestamp}.json`;
    const summary = {
      subject: subject,
      timestamp: new Date().toISOString(),
      totalQuestions: allResults.length,
      questionsWithIssues: questionsWithIssues.length,
      passRate: ((allResults.length - questionsWithIssues.length) / allResults.length * 100).toFixed(1),
      criticalCount: allResults.reduce((sum, r) => sum + r.criticalIssues.length, 0),
      highCount: allResults.reduce((sum, r) => sum + r.highIssues.length, 0),
      mediumCount: allResults.reduce((sum, r) => sum + r.mediumIssues.length, 0),
      lowCount: allResults.reduce((sum, r) => sum + r.lowIssues.length, 0),
      totalBatches: batchReports.length,
      batchSummaries: batchReports.map(br => ({
        batchNum: br.batchNum,
        questionsProcessed: br.results.length,
        questionsWithIssues: br.questionsWithIssues.length,
        passRate: ((br.results.length - br.questionsWithIssues.length) / br.results.length * 100).toFixed(1)
      }))
    };
    fs.writeFileSync(summaryFile, JSON.stringify(summary, null, 2), 'utf8');

    console.log(`\n📄 Reports saved for ${subject}:`);
    console.log(`   HTML: ${reportFile}`);
    console.log(`   JSON: ${summaryFile}`);
    console.log(`\n📈 Summary for ${subject}:`);
    console.log(`   Total Questions: ${summary.totalQuestions}`);
    console.log(`   Questions with Issues: ${summary.questionsWithIssues}`);
    console.log(`   Pass Rate: ${summary.passRate}%`);
    console.log(`   Total Batches: ${summary.totalBatches}`);
    console.log(`   Critical Issues: ${summary.criticalCount}`);
    console.log(`   High Issues: ${summary.highCount}`);
    console.log(`   Medium Issues: ${summary.mediumCount}`);
    console.log(`   Low Issues: ${summary.lowCount}`);
  }

  generateReport(allResults, questionsWithIssues) {
    // Legacy method - kept for backwards compatibility
    this.generateSubjectReport('All', allResults, questionsWithIssues, []);
  }

  generateSubjectHTML(subject, allResults, questionsWithIssues, batchReports) {
    const batchNavigation = batchReports.length > 0 ? `
    <div class="batch-navigation" style="margin: 20px 0; padding: 15px; background: #ecf0f1; border-radius: 8px;">
      <h3 style="margin-bottom: 10px;">📦 Batch Navigation</h3>
      <div style="display: flex; gap: 10px; flex-wrap: wrap;">
        ${batchReports.map(br => `
          <a href="#batch-${br.batchNum}" style="padding: 8px 15px; background: ${br.questionsWithIssues.length > 0 ? '#e74c3c' : '#27ae60'}; color: white; border-radius: 5px; text-decoration: none; font-weight: bold;">
            Batch ${br.batchNum}
            <span style="display: block; font-size: 11px;">${br.startIndex}-${br.endIndex}</span>
          </a>
        `).join('')}
      </div>
    </div>` : '';

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject} - Validation Report</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      line-height: 1.6;
      padding: 20px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
    }
    .container { max-width: 1400px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; box-shadow: 0 10px 40px rgba(0,0,0,0.2); }
    h1 { color: #2c3e50; margin-bottom: 10px; border-bottom: 4px solid #3498db; padding-bottom: 10px; font-size: 32px; }
    .subject-title { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px; border-radius: 8px; margin: 20px 0; text-align: center; font-size: 24px; font-weight: bold; }
    .summary {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 20px;
      margin: 20px 0;
    }
    .summary-card {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 20px;
      border-radius: 8px;
      box-shadow: 0 4px 6px rgba(0,0,0,0.1);
      transition: transform 0.2s;
    }
    .summary-card:hover { transform: translateY(-5px); }
    .summary-card h3 { font-size: 14px; opacity: 0.9; margin-bottom: 10px; text-transform: uppercase; }
    .summary-card .value { font-size: 36px; font-weight: bold; }
    .batch-section {
      margin: 40px 0;
      padding: 20px;
      background: #f8f9fa;
      border-radius: 8px;
      border-left: 5px solid #3498db;
    }
    .batch-header {
      font-size: 24px;
      color: #2c3e50;
      margin-bottom: 15px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .question-card {
      border: 2px solid #ddd;
      border-radius: 10px;
      padding: 25px;
      margin: 20px 0;
      background: white;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      transition: all 0.3s;
    }
    .question-card:hover { box-shadow: 0 4px 16px rgba(0,0,0,0.15); transform: translateX(5px); }
    .question-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
      padding-bottom: 15px;
      border-bottom: 3px solid #e0e0e0;
    }
    .question-id {
      font-size: 20px;
      font-weight: bold;
      color: #2c3e50;
      font-family: 'Courier New', monospace;
    }
    .badge {
      padding: 6px 14px;
      border-radius: 20px;
      font-size: 11px;
      font-weight: bold;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .badge.critical { background: #e74c3c; color: white; }
    .badge.high { background: #e67e22; color: white; }
    .badge.medium { background: #f39c12; color: white; }
    .badge.low { background: #95a5a6; color: white; }
    .badge.pass { background: #27ae60; color: white; }
    .meta {
      color: #7f8c8d;
      font-size: 14px;
      margin: 15px 0;
      padding: 10px;
      background: #ecf0f1;
      border-radius: 5px;
    }
    .issue-list { margin-top: 20px; }
    .issue {
      background: white;
      border-left: 5px solid #e74c3c;
      padding: 15px;
      margin: 12px 0;
      border-radius: 6px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.05);
    }
    .issue.high { border-left-color: #e67e22; }
    .issue.medium { border-left-color: #f39c12; }
    .issue.low { border-left-color: #95a5a6; }
    .issue-header {
      font-weight: bold;
      color: #2c3e50;
      margin-bottom: 8px;
      font-size: 15px;
    }
    .issue-details {
      color: #7f8c8d;
      font-size: 13px;
      margin-top: 5px;
      padding: 5px;
      background: #f8f9fa;
      border-radius: 3px;
    }
    .question-content {
      background: #fff;
      padding: 20px;
      border-radius: 8px;
      margin: 15px 0;
      border: 2px solid #e0e0e0;
      font-size: 16px;
      line-height: 1.8;
    }
    .question-content h4 { color: #2c3e50; margin-bottom: 10px; border-bottom: 2px solid #3498db; padding-bottom: 5px; }
    .options { margin: 20px 0; }
    .option {
      padding: 15px;
      margin: 10px 0;
      background: #f8f9fa;
      border-radius: 6px;
      border-left: 4px solid #3498db;
      font-size: 15px;
      transition: all 0.2s;
    }
    .option:hover { background: #e8f4f8; }
    .option.correct { border-left-color: #27ae60; background: #e8f8f5; font-weight: bold; }
    .option strong { color: #2c3e50; margin-right: 8px; }
    .solution {
      margin-top: 20px;
      padding: 20px;
      background: linear-gradient(135deg, #e8f6f3 0%, #dfe6e9 100%);
      border-radius: 8px;
      border: 2px solid #27ae60;
    }
    .solution h4 { color: #27ae60; margin-bottom: 15px; font-size: 18px; }
    .collapsible {
      cursor: pointer;
      padding: 12px;
      background: #3498db;
      color: white;
      border: none;
      width: 100%;
      text-align: left;
      border-radius: 6px;
      margin: 10px 0;
      font-size: 16px;
      font-weight: bold;
      transition: all 0.3s;
    }
    .collapsible:hover { background: #2980b9; transform: translateX(5px); }
    .collapsible:after { content: ' ▼'; float: right; }
    .collapsible.active:after { content: ' ▲'; }
    .content {
      display: none;
      padding: 20px;
      background: #ecf0f1;
      border-radius: 6px;
      margin-bottom: 15px;
      animation: fadeIn 0.3s;
    }
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(-10px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .stats { display: flex; gap: 20px; margin: 20px 0; flex-wrap: wrap; }
    .stat { background: #3498db; color: white; padding: 15px 25px; border-radius: 8px; flex: 1; min-width: 150px; }
    .back-to-top {
      position: fixed;
      bottom: 30px;
      right: 30px;
      background: #3498db;
      color: white;
      padding: 15px;
      border-radius: 50%;
      width: 50px;
      height: 50px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 20px;
      cursor: pointer;
      box-shadow: 0 4px 8px rgba(0,0,0,0.2);
      transition: all 0.3s;
    }
    .back-to-top:hover { background: #2980b9; transform: translateY(-5px); }
  </style>
</head>
<body>
  <div class="container">
    <h1>🔍 Question Validation Report</h1>
    <div class="subject-title">${subject}</div>
    <p style="color: #7f8c8d; margin-bottom: 20px;">Generated: ${new Date().toLocaleString()}</p>

    <div class="summary">
      <div class="summary-card">
        <h3>Total Questions</h3>
        <div class="value">${allResults.length}</div>
      </div>
      <div class="summary-card" style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);">
        <h3>Questions with Issues</h3>
        <div class="value">${questionsWithIssues.length}</div>
      </div>
      <div class="summary-card" style="background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);">
        <h3>Pass Rate</h3>
        <div class="value">${((allResults.length - questionsWithIssues.length) / allResults.length * 100).toFixed(1)}%</div>
      </div>
      <div class="summary-card" style="background: linear-gradient(135deg, #fa709a 0%, #fee140 100%);">
        <h3>Total Batches</h3>
        <div class="value">${batchReports.length}</div>
      </div>
      <div class="summary-card" style="background: linear-gradient(135deg, #ff6b6b 0%, #ee5a6f 100%);">
        <h3>Critical Issues</h3>
        <div class="value">${allResults.reduce((sum, r) => sum + r.criticalIssues.length, 0)}</div>
      </div>
      <div class="summary-card" style="background: linear-gradient(135deg, #ffa751 0%, #ffe259 100%);">
        <h3>High Issues</h3>
        <div class="value">${allResults.reduce((sum, r) => sum + r.highIssues.length, 0)}</div>
      </div>
    </div>

    ${batchNavigation}

    <h2 style="margin-top: 40px; color: #2c3e50; border-bottom: 3px solid #3498db; padding-bottom: 10px;">Questions with Discrepancies</h2>

    ${batchReports.length > 0 ?
      batchReports.map(br => `
        <div class="batch-section" id="batch-${br.batchNum}">
          <div class="batch-header">
            <span>📦 Batch ${br.batchNum}: Questions ${br.startIndex}-${br.endIndex}</span>
            <span class="badge ${br.questionsWithIssues.length === 0 ? 'pass' : 'high'}">${br.questionsWithIssues.length} issues</span>
          </div>
          ${br.questionsWithIssues.map(result => this.generateQuestionHTML(result)).join('\n')}
        </div>
      `).join('\n') :
      questionsWithIssues.map(result => this.generateQuestionHTML(result)).join('\n')
    }

    ${questionsWithIssues.length === 0 ? '<p style="text-align: center; color: #27ae60; font-size: 20px; padding: 60px; background: #e8f8f5; border-radius: 10px; margin: 40px 0;">🎉 All questions passed validation!</p>' : ''}
  </div>

  <div class="back-to-top" onclick="window.scrollTo({top: 0, behavior: 'smooth'})">↑</div>

  <script>
    document.querySelectorAll('.collapsible').forEach(btn => {
      btn.addEventListener('click', function() {
        this.classList.toggle('active');
        const content = this.nextElementSibling;
        if (content.style.display === 'block') {
          content.style.display = 'none';
        } else {
          content.style.display = 'block';
        }
      });
    });
  </script>
</body>
</html>`;
  }

  generateHTML(allResults, questionsWithIssues) {
    return this.generateSubjectHTML('All', allResults, questionsWithIssues, []);
  }

  _generateHTMLLegacy(allResults, questionsWithIssues) {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Question Validation Report</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      line-height: 1.6;
      padding: 20px;
      background: #f5f5f5;
    }
    .container { max-width: 1400px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
    h1 { color: #2c3e50; margin-bottom: 10px; border-bottom: 3px solid #3498db; padding-bottom: 10px; }
    .summary {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 20px;
      margin: 20px 0;
    }
    .summary-card {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 20px;
      border-radius: 8px;
      box-shadow: 0 4px 6px rgba(0,0,0,0.1);
    }
    .summary-card h3 { font-size: 14px; opacity: 0.9; margin-bottom: 10px; }
    .summary-card .value { font-size: 32px; font-weight: bold; }
    .question-card {
      border: 1px solid #ddd;
      border-radius: 8px;
      padding: 20px;
      margin: 20px 0;
      background: #fafafa;
    }
    .question-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 15px;
      padding-bottom: 10px;
      border-bottom: 2px solid #e0e0e0;
    }
    .question-id {
      font-size: 18px;
      font-weight: bold;
      color: #2c3e50;
    }
    .badge {
      padding: 5px 12px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: bold;
      text-transform: uppercase;
    }
    .badge.critical { background: #e74c3c; color: white; }
    .badge.high { background: #e67e22; color: white; }
    .badge.medium { background: #f39c12; color: white; }
    .badge.low { background: #95a5a6; color: white; }
    .badge.pass { background: #27ae60; color: white; }
    .meta { color: #7f8c8d; font-size: 14px; margin: 10px 0; }
    .issue-list { margin-top: 15px; }
    .issue {
      background: white;
      border-left: 4px solid #e74c3c;
      padding: 12px;
      margin: 10px 0;
      border-radius: 4px;
    }
    .issue.high { border-left-color: #e67e22; }
    .issue.medium { border-left-color: #f39c12; }
    .issue.low { border-left-color: #95a5a6; }
    .issue-header { font-weight: bold; color: #2c3e50; margin-bottom: 5px; }
    .issue-details { color: #7f8c8d; font-size: 14px; margin-top: 5px; }
    .question-content {
      background: white;
      padding: 15px;
      border-radius: 5px;
      margin: 15px 0;
      border: 1px solid #e0e0e0;
    }
    .options { margin: 15px 0; }
    .option {
      padding: 10px;
      margin: 5px 0;
      background: #f8f9fa;
      border-radius: 4px;
      border-left: 3px solid #3498db;
    }
    .option.correct { border-left-color: #27ae60; background: #e8f8f5; }
    .solution { margin-top: 15px; padding: 15px; background: #e8f6f3; border-radius: 5px; }
    .collapsible { cursor: pointer; padding: 10px; background: #3498db; color: white; border: none; width: 100%; text-align: left; border-radius: 5px; margin: 10px 0; font-size: 16px; }
    .collapsible:hover { background: #2980b9; }
    .content { display: none; padding: 15px; background: #ecf0f1; border-radius: 5px; margin-bottom: 10px; }
    .stats { display: flex; gap: 20px; margin: 20px 0; flex-wrap: wrap; }
    .stat { background: #3498db; color: white; padding: 15px 25px; border-radius: 8px; }
  </style>
</head>
<body>
  <div class="container">
    <h1>🔍 Question Validation Report</h1>
    <p style="color: #7f8c8d; margin-bottom: 20px;">Generated: ${new Date().toLocaleString()}</p>

    <div class="summary">
      <div class="summary-card">
        <h3>Total Questions</h3>
        <div class="value">${allResults.length}</div>
      </div>
      <div class="summary-card" style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);">
        <h3>Questions with Issues</h3>
        <div class="value">${questionsWithIssues.length}</div>
      </div>
      <div class="summary-card" style="background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);">
        <h3>Pass Rate</h3>
        <div class="value">${((allResults.length - questionsWithIssues.length) / allResults.length * 100).toFixed(1)}%</div>
      </div>
      <div class="summary-card" style="background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);">
        <h3>Critical Issues</h3>
        <div class="value">${allResults.reduce((sum, r) => sum + r.criticalIssues.length, 0)}</div>
      </div>
    </div>

    <h2 style="margin-top: 40px; color: #2c3e50;">Questions with Discrepancies</h2>

    ${questionsWithIssues.map(result => this.generateQuestionHTML(result)).join('\n')}

    ${questionsWithIssues.length === 0 ? '<p style="text-align: center; color: #27ae60; font-size: 18px; padding: 40px;">🎉 All questions passed validation!</p>' : ''}
  </div>

  <script>
    document.querySelectorAll('.collapsible').forEach(btn => {
      btn.addEventListener('click', function() {
        this.classList.toggle('active');
        const content = this.nextElementSibling;
        content.style.display = content.style.display === 'block' ? 'none' : 'block';
      });
    });
  </script>
</body>
</html>`;
  }

  generateQuestionHTML(result) {
    const q = result.question;
    const allIssues = [...result.criticalIssues, ...result.highIssues, ...result.mediumIssues, ...result.lowIssues];

    const severityBadge = result.criticalIssues.length > 0 ? 'critical' :
                         result.highIssues.length > 0 ? 'high' :
                         result.mediumIssues.length > 0 ? 'medium' : 'low';

    return `
    <div class="question-card">
      <div class="question-header">
        <div class="question-id">${result.external_id}</div>
        <div class="badge ${severityBadge}">${severityBadge} - ${allIssues.length} issues</div>
      </div>

      <div class="meta">
        <strong>Subject:</strong> ${result.subject} |
        <strong>Topic:</strong> ${result.topic} |
        <strong>Type:</strong> ${q.question_type || 'Not specified'}
      </div>

      <div class="issue-list">
        <h3 style="color: #2c3e50; margin-bottom: 10px;">⚠️ Issues Found:</h3>
        ${allIssues.map(issue => `
          <div class="issue ${issue.severity}">
            <div class="issue-header">
              <span class="badge ${issue.severity}">${issue.severity}</span>
              [${issue.agent}] ${issue.issue}
            </div>
            ${issue.details ? `<div class="issue-details">Details: ${issue.details}</div>` : ''}
            ${issue.field ? `<div class="issue-details">Field: <code>${issue.field}</code></div>` : ''}
          </div>
        `).join('')}
      </div>

      <button class="collapsible">📄 View Question Details</button>
      <div class="content">
        <div class="question-content">
          <h4>Question:</h4>
          <div>${q.question_html || q.question || 'No question text'}</div>
        </div>

        ${q.options ? `
          <div class="options">
            <h4>Options:</h4>
            ${Object.entries(q.options).map(([key, value]) => `
              <div class="option ${key === q.correct_answer?.toLowerCase() ? 'correct' : ''}">
                <strong>${key.toUpperCase()}.</strong> ${value}
                ${key === q.correct_answer?.toLowerCase() ? ' ✓ <em>(Correct)</em>' : ''}
              </div>
            `).join('')}
          </div>
        ` : '<p>No options available</p>'}

        ${q.solution_html ? `
          <div class="solution">
            <h4>Solution:</h4>
            ${q.solution_html}
          </div>
        ` : '<p>No solution available</p>'}
      </div>
    </div>`;
  }
}

// ============================================================================
// Main Execution
// ============================================================================

async function main() {
  const orchestrator = new ValidationOrchestrator();
  await orchestrator.processDatabase();
}

main().catch(console.error);
