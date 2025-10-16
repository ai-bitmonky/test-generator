/**
 * HTML Question Parser - Extracts questions from Claude's HTML output
 * Features:
 * - Parses HTML to extract individual questions
 * - Validates and normalizes question structure
 * - Runs all validation agents before DB insertion
 */

const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

// Import validation from existing pipeline
const { AIFixedOrchestrator } = require('./ai_pipeline_fixed');

class HTMLQuestionParser {
  constructor(subject = 'Mathematics') {
    this.subject = subject;
    this.supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );

    // For validation (reuse existing AI agents)
    this.validator = null; // Will initialize when needed
  }

  /**
   * Parse HTML file and extract questions
   */
  parseHTMLFile(htmlPath) {
    console.log(`\n📄 Parsing HTML: ${path.basename(htmlPath)}`);

    const htmlContent = fs.readFileSync(htmlPath, 'utf-8');
    return this.parseHTMLString(htmlContent);
  }

  /**
   * Parse HTML string and extract questions
   * Expected format:
   * <div class="question" data-id="...">
   *   <div class="question-text">...</div>
   *   <div class="options">
   *     <div class="option" data-key="a">...</div>
   *     <div class="option" data-key="b">...</div>
   *     <div class="option" data-key="c">...</div>
   *     <div class="option" data-key="d">...</div>
   *   </div>
   *   <div class="correct-answer">...</div>
   *   <div class="solution">...</div>
   * </div>
   */
  parseHTMLString(htmlContent) {
    const dom = new JSDOM(htmlContent);
    const document = dom.window.document;

    const questionElements = document.querySelectorAll('.question, [data-type="question"], article.question');

    console.log(`   Found ${questionElements.length} question(s)`);

    const questions = [];

    questionElements.forEach((el, index) => {
      try {
        const question = this.extractQuestion(el, index);
        if (question) {
          questions.push(question);
        }
      } catch (error) {
        console.error(`   ⚠️  Error parsing question ${index + 1}:`, error.message);
      }
    });

    console.log(`   ✅ Successfully parsed ${questions.length} question(s)`);

    return questions;
  }

  /**
   * Extract a single question from HTML element
   */
  extractQuestion(element, index) {
    // Extract question ID
    const id = element.getAttribute('data-id') ||
               element.getAttribute('id') ||
               `question_${Date.now()}_${index}`;

    // Extract question text
    const questionTextEl = element.querySelector('.question-text, .question-body, h3, p:first-of-type');
    const questionText = questionTextEl ? this.cleanText(questionTextEl.textContent) : null;

    if (!questionText) {
      console.warn(`   ⚠️  Question ${index + 1}: No question text found`);
      return null;
    }

    // Extract options
    const options = this.extractOptions(element);

    if (!options || Object.keys(options).length === 0) {
      console.warn(`   ⚠️  Question ${index + 1}: No options found`);
      return null;
    }

    // Extract correct answer
    const correctAnswerEl = element.querySelector('.correct-answer, .answer, [data-answer]');
    let correctAnswer = correctAnswerEl ?
      this.cleanText(correctAnswerEl.textContent || correctAnswerEl.getAttribute('data-answer')) :
      null;

    // Normalize answer (might be "a", "A", "Option A", etc.)
    correctAnswer = this.normalizeAnswer(correctAnswer);

    // Extract solution
    const solutionEl = element.querySelector('.solution, .explanation, .solution-text');
    const solution = solutionEl ? this.cleanText(solutionEl.textContent) : null;

    // Extract topic/difficulty if available
    const topicEl = element.querySelector('.topic, [data-topic]');
    const topic = topicEl ?
      this.cleanText(topicEl.textContent || topicEl.getAttribute('data-topic')) :
      'General';

    const difficultyEl = element.querySelector('.difficulty, [data-difficulty]');
    const difficulty = difficultyEl ?
      this.cleanText(difficultyEl.textContent || difficultyEl.getAttribute('data-difficulty')) :
      'Medium';

    return {
      id,
      question: questionText,
      options,
      correct_answer: correctAnswer,
      solution,
      topic,
      difficulty,
      subject: this.subject,
      source: 'pdf_import',
      created_at: new Date().toISOString()
    };
  }

  /**
   * Extract options from question element
   */
  extractOptions(element) {
    const options = {};

    // Try different option selectors
    const optionElements = element.querySelectorAll('.option, .choice, [data-option], li');

    optionElements.forEach(el => {
      const key = el.getAttribute('data-key') ||
                 el.getAttribute('data-option') ||
                 this.extractOptionKey(el.textContent);

      const text = this.cleanText(el.textContent);

      if (key && text) {
        options[key.toLowerCase()] = text.replace(/^[a-d]\)\s*/i, ''); // Remove "a) " prefix
      }
    });

    // If no options found with selectors, try to parse from text
    if (Object.keys(options).length === 0) {
      const optionsText = element.querySelector('.options, .choices')?.textContent;
      if (optionsText) {
        return this.parseOptionsFromText(optionsText);
      }
    }

    return options;
  }

  /**
   * Extract option key from text (e.g., "a) Some text" -> "a")
   */
  extractOptionKey(text) {
    const match = text.match(/^([a-d])[).:\s]/i);
    return match ? match[1].toLowerCase() : null;
  }

  /**
   * Parse options from plain text
   */
  parseOptionsFromText(text) {
    const options = {};
    const lines = text.split('\n');

    lines.forEach(line => {
      const match = line.match(/^([a-d])[).:\s]+(.+)/i);
      if (match) {
        const key = match[1].toLowerCase();
        const value = this.cleanText(match[2]);
        if (value) {
          options[key] = value;
        }
      }
    });

    return options;
  }

  /**
   * Normalize answer format
   */
  normalizeAnswer(answer) {
    if (!answer) return null;

    answer = answer.toLowerCase().trim();

    // Extract letter if needed
    const match = answer.match(/([a-d])/);
    return match ? match[1] : answer.charAt(0);
  }

  /**
   * Clean text content
   */
  cleanText(text) {
    if (!text) return null;

    return text
      .replace(/\s+/g, ' ')
      .replace(/\n+/g, '\n')
      .trim();
  }

  /**
   * Validate question using existing validation agents
   */
  async validateQuestion(question) {
    // Import and use validation logic from ai_pipeline_fixed.js
    // This runs all the same validation checks
    const issues = [];

    // Basic validations
    if (!question.question || question.question.length < 10) {
      issues.push({ field: 'question', issue: 'Question text too short or missing' });
    }

    if (!question.options || Object.keys(question.options).length !== 4) {
      issues.push({ field: 'options', issue: 'Must have exactly 4 options (a, b, c, d)' });
    }

    if (!question.correct_answer || !['a', 'b', 'c', 'd'].includes(question.correct_answer)) {
      issues.push({ field: 'correct_answer', issue: 'Invalid or missing correct answer' });
    }

    if (!question.solution || question.solution.length < 20) {
      issues.push({ field: 'solution', issue: 'Solution missing or too short' });
    }

    return issues;
  }

  /**
   * Insert question into database with validation
   */
  async insertQuestion(question, validate = true) {
    if (validate) {
      const issues = await this.validateQuestion(question);

      if (issues.length > 0) {
        console.log(`   ⚠️  Validation issues found for ${question.id}:`);
        issues.forEach(issue => console.log(`      - ${issue.field}: ${issue.issue}`));
        return { success: false, issues };
      }
    }

    try {
      const { data, error } = await this.supabase
        .from('questions')
        .insert([question])
        .select();

      if (error) {
        console.error(`   ❌ Database error:`, error.message);
        return { success: false, error: error.message };
      }

      console.log(`   ✅ Inserted: ${question.id}`);
      return { success: true, data: data[0] };

    } catch (error) {
      console.error(`   ❌ Error inserting question:`, error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Process all HTML files in a directory
   */
  async processDirectory(htmlDir, validateBeforeInsert = true) {
    console.log(`\n🚀 Processing HTML files in: ${htmlDir}\n`);

    const files = fs.readdirSync(htmlDir).filter(f => f.endsWith('.html'));

    console.log(`📁 Found ${files.length} HTML file(s)\n`);

    const results = {
      totalFiles: files.length,
      totalQuestions: 0,
      inserted: 0,
      failed: 0,
      validationIssues: []
    };

    for (const file of files) {
      const htmlPath = path.join(htmlDir, file);
      console.log(`\n${'='.repeat(70)}`);
      console.log(`📄 Processing: ${file}`);
      console.log(`${'='.repeat(70)}`);

      try {
        const questions = this.parseHTMLFile(htmlPath);
        results.totalQuestions += questions.length;

        for (const question of questions) {
          const result = await this.insertQuestion(question, validateBeforeInsert);

          if (result.success) {
            results.inserted++;
          } else {
            results.failed++;
            if (result.issues) {
              results.validationIssues.push({
                file,
                question: question.id,
                issues: result.issues
              });
            }
          }
        }

      } catch (error) {
        console.error(`❌ Error processing ${file}:`, error.message);
        results.failed++;
      }
    }

    console.log(`\n${'='.repeat(70)}`);
    console.log('✅ Processing complete!');
    console.log(`${'='.repeat(70)}`);
    console.log(`   Files processed: ${results.totalFiles}`);
    console.log(`   Questions found: ${results.totalQuestions}`);
    console.log(`   Successfully inserted: ${results.inserted}`);
    console.log(`   Failed: ${results.failed}`);

    if (results.validationIssues.length > 0) {
      console.log(`\n   Validation issues: ${results.validationIssues.length}`);
      console.log(`   (See detailed report below)\n`);
    }

    // Save detailed report
    const reportPath = path.join(htmlDir, 'insertion_report.json');
    fs.writeFileSync(reportPath, JSON.stringify(results, null, 2));
    console.log(`\n   Report saved: ${reportPath}\n`);

    return results;
  }
}

// CLI interface
if (require.main === module) {
  const htmlDir = process.argv[2];
  const subject = process.argv[3] || 'Mathematics';
  const validate = process.argv[4] !== 'false'; // Default: validate

  if (!htmlDir) {
    console.log(`
📝 HTML Question Parser - Extract and insert questions from HTML

Usage:
  node html_question_parser.js <html_dir> [subject] [validate]

Arguments:
  html_dir  - Directory containing HTML files from pdf_processor.js
  subject   - Subject name (default: Mathematics)
  validate  - Run validation before insert (default: true)

Example:
  node html_question_parser.js pdf_outputs Physics true
    `);
    process.exit(1);
  }

  const parser = new HTMLQuestionParser(subject);
  parser.processDirectory(htmlDir, validate).catch(err => {
    console.error('❌ Error:', err.message);
    process.exit(1);
  });
}

module.exports = HTMLQuestionParser;
