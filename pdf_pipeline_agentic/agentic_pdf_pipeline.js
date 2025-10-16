/**
 * AI-Powered Agentic PDF Pipeline
 *
 * Flow:
 * 1. Load PDF file
 * 2. Split into chunks (pages/sections)
 * 3. AI parsing: Extract questions from chunks
 * 4. AI enrichment: Generate solution steps, expert advice, etc.
 * 5. AI classification: Identify subject and exam level
 * 6. Full validation pipeline
 * 7. Insert validated questions into database
 */

const fs = require('fs');
const path = require('path');
const pdf = require('pdf-parse');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

// Import Classification Agent
const ClassificationAgent = require('./classification_agent.js');

// Initialize Supabase
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// Configuration
const CONFIG = {
  pdfPath: process.argv[2] || './sample.pdf',
  subject: process.argv[3] || 'Mathematics',
  chunkSize: 3, // Pages per chunk
  claudeApiKey: process.env.ANTHROPIC_API_KEY,
  claudeModel: 'claude-3-haiku-20240307',
  baseDelay: 5000, // 5s between API calls
  maxRetries: 5,
  outputDir: 'agentic_pipeline_output',
};

// ============================================================================
// Claude AI Client
// ============================================================================

class ClaudeAI {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.baseURL = 'https://api.anthropic.com/v1/messages';
  }

  async call(prompt, maxTokens = 4000, retries = CONFIG.maxRetries) {
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const response = await fetch(this.baseURL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': this.apiKey,
            'anthropic-version': '2023-06-01',
          },
          body: JSON.stringify({
            model: CONFIG.claudeModel,
            max_tokens: maxTokens,
            messages: [{ role: 'user', content: prompt }]
          })
        });

        if (!response.ok) {
          const errorText = await response.text();
          const isRateLimit = errorText.includes('rate_limit_error');

          if (isRateLimit && attempt < retries) {
            const waitTime = 15000 * attempt;
            console.error(`   ⚠️  Rate limit, waiting ${waitTime/1000}s...`);
            await new Promise(resolve => setTimeout(resolve, waitTime));
            continue;
          }

          throw new Error(`API Error: ${errorText.substring(0, 100)}`);
        }

        const data = await response.json();
        return data.content[0].text;
      } catch (error) {
        const isNetworkError = error.message.includes('fetch failed') ||
                               error.message.includes('ECONNREFUSED') ||
                               error.message.includes('network');

        if (isNetworkError && attempt < retries) {
          const waitTime = 30000 * attempt;
          console.error(`   🌐 Network error, waiting ${waitTime/1000}s...`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
          continue;
        }

        if (attempt < retries) {
          const waitTime = 15000 * attempt;
          console.error(`   ⚠️  Error, retrying in ${waitTime/1000}s...`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
          continue;
        }

        throw error;
      }
    }
  }
}

// ============================================================================
// PDF Processor
// ============================================================================

class PDFProcessor {
  async loadPDF(pdfPath) {
    console.log(`📄 Loading PDF: ${pdfPath}`);

    const dataBuffer = fs.readFileSync(pdfPath);
    const data = await pdf(dataBuffer);

    console.log(`   ✅ Loaded ${data.numpages} pages`);
    console.log(`   📊 Total text length: ${data.text.length} characters\n`);

    return data;
  }

  splitIntoChunks(pdfData, chunkSize = CONFIG.chunkSize) {
    console.log(`✂️  Splitting into chunks (${chunkSize} pages per chunk)...`);

    // Split text by page breaks (approximation)
    const pages = pdfData.text.split(/\n\n\n+/);
    const chunks = [];

    for (let i = 0; i < pages.length; i += chunkSize) {
      const chunk = pages.slice(i, i + chunkSize).join('\n\n\n');
      chunks.push({
        index: Math.floor(i / chunkSize),
        pageRange: `${i + 1}-${Math.min(i + chunkSize, pages.length)}`,
        content: chunk,
      });
    }

    console.log(`   ✅ Created ${chunks.length} chunks\n`);
    return chunks;
  }
}

// ============================================================================
// AI Question Parser
// ============================================================================

class AIQuestionParser {
  constructor(claudeAI, subject) {
    this.claudeAI = claudeAI;
    this.subject = subject;
  }

  async parseChunk(chunk) {
    console.log(`🤖 Parsing chunk ${chunk.index + 1} (pages ${chunk.pageRange})...`);

    const prompt = `You are an expert at extracting JEE ${this.subject} questions from text.

Extract ALL questions from the following text. For EACH question, provide:

1. question_text: The complete question text
2. options: Array of 4 options (if MCQ) or null
3. correct_answer: The correct answer
4. topic: Main topic (e.g., "Calculus", "Mechanics")
5. sub_topic: Specific sub-topic
6. difficulty: "Easy", "Medium", or "Hard"
7. question_type: "MCQ", "Numerical", "Integer", or "Subjective"

Return ONLY a valid JSON array of questions. Example format:
[
  {
    "question_text": "Find the derivative of x^2 + 3x + 2",
    "options": ["2x + 3", "2x + 2", "x + 3", "2x"],
    "correct_answer": "2x + 3",
    "topic": "Calculus",
    "sub_topic": "Differentiation",
    "difficulty": "Easy",
    "question_type": "MCQ"
  }
]

If no questions found, return empty array [].

TEXT TO PARSE:
${chunk.content.substring(0, 10000)}`;

    try {
      const response = await this.claudeAI.call(prompt, 4000);

      // Extract JSON from response
      const jsonMatch = response.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        console.log(`   ⚠️  No valid JSON found in response`);
        return [];
      }

      const questions = JSON.parse(jsonMatch[0]);
      console.log(`   ✅ Extracted ${questions.length} questions\n`);

      return questions;
    } catch (error) {
      console.error(`   ❌ Failed to parse chunk: ${error.message}\n`);
      return [];
    }
  }
}

// ============================================================================
// AI Question Enricher
// ============================================================================

class AIQuestionEnricher {
  constructor(claudeAI, subject) {
    this.claudeAI = claudeAI;
    this.subject = subject;
  }

  async enrichQuestion(question, index) {
    console.log(`🎨 Enriching question ${index + 1}...`);

    const prompt = `You are a JEE ${this.subject} expert. For the following question, provide:

1. solution_steps: Detailed step-by-step solution (as HTML with <p>, <br>, <strong> tags)
2. strategy: Best approach/strategy to solve (100 words max)
3. expert_insight: Key insight or common mistake (100 words max)
4. key_facts: Array of 3-5 important facts/formulas to remember

Question: ${question.question_text}
${question.options ? 'Options: ' + JSON.stringify(question.options) : ''}
Correct Answer: ${question.correct_answer}

Return ONLY valid JSON:
{
  "solution_steps": "<p>Step 1: ...</p><p>Step 2: ...</p>",
  "strategy": "...",
  "expert_insight": "...",
  "key_facts": ["fact 1", "fact 2", "fact 3"]
}`;

    try {
      const response = await this.claudeAI.call(prompt, 2000);

      // Extract JSON
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No valid JSON in response');
      }

      const enrichment = JSON.parse(jsonMatch[0]);
      console.log(`   ✅ Generated solution and insights\n`);

      return {
        ...question,
        solution_html: enrichment.solution_steps,
        strategy: enrichment.strategy,
        expert_insight: enrichment.expert_insight,
        key_facts: enrichment.key_facts,
      };
    } catch (error) {
      console.error(`   ⚠️  Enrichment failed: ${error.message}`);
      return {
        ...question,
        solution_html: `<p>Solution for: ${question.question_text}</p>`,
        strategy: 'Standard approach for this topic',
        expert_insight: 'Pay attention to key concepts',
        key_facts: ['Important concept'],
      };
    }
  }
}

// ============================================================================
// Question Validator (from existing pipeline)
// ============================================================================

class QuestionValidator {
  validate(question) {
    const issues = [];

    // Required fields
    if (!question.question_text || question.question_text.length < 10) {
      issues.push({ type: 'error', field: 'question_text', message: 'Question text too short or missing' });
    }

    if (!question.correct_answer) {
      issues.push({ type: 'error', field: 'correct_answer', message: 'Missing correct answer' });
    }

    if (!question.topic) {
      issues.push({ type: 'error', field: 'topic', message: 'Missing topic' });
    }

    if (!['Easy', 'Medium', 'Hard'].includes(question.difficulty)) {
      issues.push({ type: 'warning', field: 'difficulty', message: 'Invalid difficulty level' });
    }

    // MCQ validation
    if (question.question_type === 'MCQ') {
      if (!Array.isArray(question.options) || question.options.length !== 4) {
        issues.push({ type: 'error', field: 'options', message: 'MCQ must have exactly 4 options' });
      }
    }

    // Solution validation
    if (!question.solution_html || question.solution_html.length < 20) {
      issues.push({ type: 'warning', field: 'solution_html', message: 'Solution seems too short' });
    }

    // Strategy validation
    if (question.strategy && question.strategy.split(' ').length > 100) {
      issues.push({ type: 'warning', field: 'strategy', message: 'Strategy exceeds 100 words' });
    }

    return issues;
  }
}

// ============================================================================
// Database Inserter
// ============================================================================

class DatabaseInserter {
  async insertQuestion(question, subject) {
    try {
      const questionData = {
        external_id: `AI_GEN_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        subject: subject,
        topic: question.topic,
        sub_topic: question.sub_topic || null,
        difficulty: question.difficulty,
        question_type: question.question_type,
        question_html: question.question_text,
        options: question.options ? JSON.stringify(question.options) : null,
        correct_answer: question.correct_answer,
        solution_html: question.solution_html,
        strategy: question.strategy,
        expert_insight: question.expert_insight,
        key_facts: question.key_facts,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('questions')
        .insert([questionData])
        .select();

      if (error) throw error;

      return data[0];
    } catch (error) {
      throw new Error(`Database insert failed: ${error.message}`);
    }
  }
}

// ============================================================================
// Main Pipeline Orchestrator
// ============================================================================

class AgenticPDFPipeline {
  constructor() {
    this.pdfProcessor = new PDFProcessor();
    this.claudeAI = new ClaudeAI(CONFIG.claudeApiKey);
    this.parser = new AIQuestionParser(this.claudeAI, CONFIG.subject);
    this.enricher = new AIQuestionEnricher(this.claudeAI, CONFIG.subject);
    this.classifier = new ClassificationAgent(this.claudeAI);
    this.validator = new QuestionValidator();
    this.inserter = new DatabaseInserter();
  }

  async run() {
    console.log('🚀 AI-Powered Agentic PDF Pipeline\n');
    console.log(`📁 PDF: ${CONFIG.pdfPath}`);
    console.log(`📚 Subject: ${CONFIG.subject}`);
    console.log(`⚙️  Chunk size: ${CONFIG.chunkSize} pages\n`);
    console.log('='.repeat(70) + '\n');

    const results = {
      totalChunks: 0,
      questionsExtracted: 0,
      questionsEnriched: 0,
      questionsClassified: 0,
      questionsValidated: 0,
      questionsInserted: 0,
      failed: [],
      validationIssues: [],
      classificationIssues: [],
    };

    try {
      // Step 1: Load PDF
      const pdfData = await this.pdfProcessor.loadPDF(CONFIG.pdfPath);

      // Step 2: Split into chunks
      const chunks = this.pdfProcessor.splitIntoChunks(pdfData);
      results.totalChunks = chunks.length;

      // Step 3-6: Process each chunk
      for (const chunk of chunks) {
        console.log('─'.repeat(70));

        // Step 3: Parse questions from chunk
        const parsedQuestions = await this.parser.parseChunk(chunk);
        results.questionsExtracted += parsedQuestions.length;

        if (parsedQuestions.length === 0) {
          console.log(`⏭️  No questions in chunk, skipping...\n`);
          continue;
        }

        // Process each question
        for (let i = 0; i < parsedQuestions.length; i++) {
          const question = parsedQuestions[i];

          try {
            // Step 4: Enrich with AI
            const enrichedQuestion = await this.enricher.enrichQuestion(question, i);
            results.questionsEnriched++;

            // Delay between API calls
            await new Promise(resolve => setTimeout(resolve, CONFIG.baseDelay));

            // Step 5: Classify with AI
            console.log(`🔍 Classifying question ${i + 1}...`);
            const classification = await this.classifier.classifyQuestion(enrichedQuestion);
            results.questionsClassified++;

            // Add classification to question
            enrichedQuestion.subject = classification.subject;
            enrichedQuestion.exam_level = classification.exam_level;
            enrichedQuestion.classification_metadata = {
              subject_confidence: classification.subject_confidence,
              exam_level_confidence: classification.exam_level_confidence,
              reasoning: classification.reasoning,
              complexity_factors: classification.complexity_factors,
              is_multi_concept: classification.is_multi_concept,
              estimated_steps: classification.estimated_steps,
            };

            // Validate classification
            const classificationIssues = this.classifier.validateClassification(classification);
            if (classificationIssues.length > 0) {
              console.log(`   ⚠️  Classification issues:`);
              classificationIssues.forEach(issue => {
                console.log(`      - ${issue.type.toUpperCase()}: ${issue.field} - ${issue.message}`);
                results.classificationIssues.push({ question: i + 1, ...issue });
              });
            }

            // Delay between API calls
            await new Promise(resolve => setTimeout(resolve, CONFIG.baseDelay));

            // Step 6: Validate
            console.log(`✓ Validating question ${i + 1}...`);
            const issues = this.validator.validate(enrichedQuestion);

            if (issues.length > 0) {
              console.log(`   ⚠️  Found ${issues.length} validation issues:`);
              issues.forEach(issue => {
                console.log(`      - ${issue.type.toUpperCase()}: ${issue.field} - ${issue.message}`);
                results.validationIssues.push({ question: i + 1, ...issue });
              });
            }

            // Only insert if no critical errors
            const hasErrors = issues.some(i => i.type === 'error');

            if (!hasErrors) {
              results.questionsValidated++;

              // Step 7: Insert into database
              console.log(`💾 Inserting into database...`);
              const inserted = await this.inserter.insertQuestion(enrichedQuestion, enrichedQuestion.subject);
              results.questionsInserted++;
              console.log(`   ✅ Inserted with ID: ${inserted.id} (${enrichedQuestion.subject}, ${enrichedQuestion.exam_level})\n`);
            } else {
              console.log(`   ❌ Skipping insert due to validation errors\n`);
              results.failed.push({
                question: question.question_text.substring(0, 100),
                reason: 'Validation errors',
                issues,
              });
            }

          } catch (error) {
            console.error(`   ❌ Failed to process question: ${error.message}\n`);
            results.failed.push({
              question: question.question_text?.substring(0, 100) || 'Unknown',
              reason: error.message,
            });
          }
        }
      }

      // Generate report
      this.generateReport(results);

    } catch (error) {
      console.error('\n❌ Pipeline failed:', error.message);
      console.error(error.stack);
      process.exit(1);
    }
  }

  generateReport(results) {
    console.log('\n' + '='.repeat(70));
    console.log('📊 PIPELINE COMPLETE');
    console.log('='.repeat(70));

    console.log(`\n✅ Successfully processed:`);
    console.log(`   Chunks processed: ${results.totalChunks}`);
    console.log(`   Questions extracted: ${results.questionsExtracted}`);
    console.log(`   Questions enriched: ${results.questionsEnriched}`);
    console.log(`   Questions classified: ${results.questionsClassified}`);
    console.log(`   Questions validated: ${results.questionsValidated}`);
    console.log(`   Questions inserted: ${results.questionsInserted}`);

    if (results.classificationIssues.length > 0) {
      console.log(`\n⚠️  Classification issues: ${results.classificationIssues.length}`);
    }

    if (results.validationIssues.length > 0) {
      console.log(`\n⚠️  Validation issues: ${results.validationIssues.length}`);
    }

    if (results.failed.length > 0) {
      console.log(`\n❌ Failed questions: ${results.failed.length}`);
      results.failed.slice(0, 5).forEach((f, i) => {
        console.log(`   ${i + 1}. ${f.question.substring(0, 80)}...`);
        console.log(`      Reason: ${f.reason}`);
      });
    }

    // Save detailed report
    if (!fs.existsSync(CONFIG.outputDir)) {
      fs.mkdirSync(CONFIG.outputDir, { recursive: true });
    }

    const reportPath = path.join(CONFIG.outputDir, `report_${Date.now()}.json`);
    fs.writeFileSync(reportPath, JSON.stringify(results, null, 2));

    console.log(`\n📄 Detailed report saved: ${reportPath}\n`);
  }
}

// ============================================================================
// Run Pipeline
// ============================================================================

async function main() {
  if (!CONFIG.claudeApiKey) {
    console.error('❌ Error: ANTHROPIC_API_KEY not found in environment');
    process.exit(1);
  }

  if (!fs.existsSync(CONFIG.pdfPath)) {
    console.error(`❌ Error: PDF file not found: ${CONFIG.pdfPath}`);
    console.error('\nUsage: node agentic_pdf_pipeline.js <pdf_path> [subject]');
    process.exit(1);
  }

  const pipeline = new AgenticPDFPipeline();
  await pipeline.run();
}

main().catch(console.error);
