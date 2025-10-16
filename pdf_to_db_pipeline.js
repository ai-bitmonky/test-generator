/**
 * PDF to Database Pipeline - Complete orchestrator
 *
 * Full workflow:
 * 1. Split PDF by chapters (max 30 pages per chunk)
 * 2. Process each chunk with Claude API
 * 3. Parse HTML output to extract questions
 * 4. Validate questions with all agents
 * 5. Insert into database
 */

const fs = require('fs');
const path = require('path');
const PDFSplitter = require('./pdf_splitter');
const PDFProcessor = require('./pdf_processor');
const HTMLQuestionParser = require('./html_question_parser');

class PDFToDatabasePipeline {
  constructor(options = {}) {
    this.pdfPath = options.pdfPath;
    this.subject = options.subject || 'Mathematics';
    this.promptFile = options.promptFile || 'pdf_extraction_prompt.txt';
    this.workDir = options.workDir || `pdf_pipeline_${Date.now()}`;
    this.validateQuestions = options.validate !== false; // Default: true

    // Create work directory
    if (!fs.existsSync(this.workDir)) {
      fs.mkdirSync(this.workDir, { recursive: true });
    }

    this.chunksDir = path.join(this.workDir, 'chunks');
    this.outputsDir = path.join(this.workDir, 'outputs');

    // Track progress
    this.stats = {
      startTime: null,
      endTime: null,
      pdfInfo: null,
      chunksCreated: 0,
      chunksProcessed: 0,
      questionsExtracted: 0,
      questionsInserted: 0,
      questionsFailed: 0
    };
  }

  /**
   * Step 1: Split PDF into chunks
   */
  async splitPDF() {
    console.log('\n' + '='.repeat(80));
    console.log('STEP 1: SPLITTING PDF BY CHAPTERS');
    console.log('='.repeat(80) + '\n');

    const splitter = new PDFSplitter(this.pdfPath, this.chunksDir);
    const result = await splitter.split();

    this.stats.pdfInfo = {
      source: this.pdfPath,
      totalPages: result.manifest.totalPages,
      totalChunks: result.manifest.totalChunks
    };
    this.stats.chunksCreated = result.manifest.totalChunks;

    console.log(`\n✅ Step 1 complete: Created ${this.stats.chunksCreated} chunks\n`);

    return result.manifest;
  }

  /**
   * Step 2: Process all chunks with Claude API
   */
  async processChunks(manifest) {
    console.log('\n' + '='.repeat(80));
    console.log('STEP 2: PROCESSING CHUNKS WITH CLAUDE API');
    console.log('='.repeat(80) + '\n');

    // Ensure prompt file exists
    if (!fs.existsSync(this.promptFile)) {
      throw new Error(`Prompt file not found: ${this.promptFile}\nCreate this file with your extraction prompt before running the pipeline.`);
    }

    const processor = new PDFProcessor(this.promptFile);
    const manifestPath = path.join(this.chunksDir, 'manifest.json');

    // Update manifest with subject
    manifest.subject = this.subject;
    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));

    const result = await processor.processChunks(manifestPath, this.outputsDir);

    this.stats.chunksProcessed = result.summary.successful;

    console.log(`\n✅ Step 2 complete: Processed ${this.stats.chunksProcessed}/${this.stats.chunksCreated} chunks\n`);

    if (result.summary.failed > 0) {
      console.log(`⚠️  Warning: ${result.summary.failed} chunks failed to process`);
    }

    return result;
  }

  /**
   * Step 3: Parse HTML and insert into database
   */
  async parseAndInsert() {
    console.log('\n' + '='.repeat(80));
    console.log('STEP 3: PARSING HTML AND INSERTING INTO DATABASE');
    console.log('='.repeat(80) + '\n');

    const parser = new HTMLQuestionParser(this.subject);
    const result = await parser.processDirectory(this.outputsDir, this.validateQuestions);

    this.stats.questionsExtracted = result.totalQuestions;
    this.stats.questionsInserted = result.inserted;
    this.stats.questionsFailed = result.failed;

    console.log(`\n✅ Step 3 complete: Inserted ${this.stats.questionsInserted}/${this.stats.questionsExtracted} questions\n`);

    if (result.failed > 0) {
      console.log(`⚠️  Warning: ${result.failed} questions failed validation or insertion`);
    }

    return result;
  }

  /**
   * Run complete pipeline
   */
  async run() {
    this.stats.startTime = Date.now();

    console.log('\n' + '╔' + '═'.repeat(78) + '╗');
    console.log('║' + ' '.repeat(20) + '📚 PDF TO DATABASE PIPELINE' + ' '.repeat(30) + '║');
    console.log('╚' + '═'.repeat(78) + '╝\n');

    console.log(`📄 Input PDF: ${this.pdfPath}`);
    console.log(`📚 Subject: ${this.subject}`);
    console.log(`📝 Prompt file: ${this.promptFile}`);
    console.log(`📁 Work directory: ${this.workDir}`);
    console.log(`✅ Validation: ${this.validateQuestions ? 'Enabled' : 'Disabled'}\n`);

    try {
      // Step 1: Split PDF
      const manifest = await this.splitPDF();

      // Step 2: Process with Claude
      await this.processChunks(manifest);

      // Step 3: Parse and insert
      await this.parseAndInsert();

      // Done!
      this.stats.endTime = Date.now();
      this.printSummary();

    } catch (error) {
      console.error('\n❌ Pipeline failed:', error.message);
      console.error(error.stack);
      throw error;
    }
  }

  /**
   * Print final summary
   */
  printSummary() {
    const duration = Math.round((this.stats.endTime - this.stats.startTime) / 1000);
    const minutes = Math.floor(duration / 60);
    const seconds = duration % 60;

    console.log('\n' + '╔' + '═'.repeat(78) + '╗');
    console.log('║' + ' '.repeat(25) + '🎉 PIPELINE COMPLETE' + ' '.repeat(32) + '║');
    console.log('╚' + '═'.repeat(78) + '╝\n');

    console.log('📊 FINAL SUMMARY:\n');
    console.log('PDF Processing:');
    console.log(`   Source: ${this.stats.pdfInfo.source}`);
    console.log(`   Total pages: ${this.stats.pdfInfo.totalPages}`);
    console.log(`   Chunks created: ${this.stats.chunksCreated}`);
    console.log(`   Chunks processed: ${this.stats.chunksProcessed}`);

    console.log('\nQuestion Extraction:');
    console.log(`   Questions found: ${this.stats.questionsExtracted}`);
    console.log(`   Successfully inserted: ${this.stats.questionsInserted}`);
    console.log(`   Failed: ${this.stats.questionsFailed}`);

    if (this.stats.questionsExtracted > 0) {
      const successRate = ((this.stats.questionsInserted / this.stats.questionsExtracted) * 100).toFixed(1);
      console.log(`   Success rate: ${successRate}%`);
    }

    console.log('\nTiming:');
    console.log(`   Total duration: ${minutes}m ${seconds}s`);

    console.log('\nOutput files:');
    console.log(`   Work directory: ${this.workDir}`);
    console.log(`   PDF chunks: ${this.chunksDir}`);
    console.log(`   HTML outputs: ${this.outputsDir}`);

    // Save detailed report
    const reportPath = path.join(this.workDir, 'pipeline_report.json');
    fs.writeFileSync(reportPath, JSON.stringify({
      config: {
        pdfPath: this.pdfPath,
        subject: this.subject,
        promptFile: this.promptFile,
        validateQuestions: this.validateQuestions
      },
      stats: this.stats,
      timestamp: new Date().toISOString()
    }, null, 2));

    console.log(`\n💾 Full report saved: ${reportPath}\n`);
  }
}

// CLI interface
if (require.main === module) {
  const args = process.argv.slice(2);

  if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
    console.log(`
╔═══════════════════════════════════════════════════════════════════════════════╗
║                     📚 PDF TO DATABASE PIPELINE                              ║
║                                                                              ║
║  Complete pipeline: PDF → Chapters → Claude AI → Questions → Database       ║
╚═══════════════════════════════════════════════════════════════════════════════╝

USAGE:
  node pdf_to_db_pipeline.js <pdf_file> [options]

REQUIRED:
  pdf_file              Path to PDF file to process

OPTIONS:
  --subject <name>      Subject name (default: Mathematics)
  --prompt <file>       Prompt template file (default: pdf_extraction_prompt.txt)
  --workdir <dir>       Work directory (default: pdf_pipeline_<timestamp>)
  --no-validate         Skip validation before database insertion
  --chapters <file>     Chapter definition file (optional, <pdf>_chapters.json)

EXAMPLES:

  1. Basic usage (Mathematics):
     node pdf_to_db_pipeline.js textbook.pdf

  2. Specify subject:
     node pdf_to_db_pipeline.js physics_book.pdf --subject Physics

  3. Custom prompt and work directory:
     node pdf_to_db_pipeline.js chem.pdf --subject Chemistry --prompt my_prompt.txt --workdir chem_output

  4. Define chapters (create textbook_chapters.json first):
     node pdf_to_db_pipeline.js textbook.pdf

     textbook_chapters.json format:
     {
       "chapters": [
         { "name": "Chapter 1: Algebra", "startPage": 1, "endPage": 45 },
         { "name": "Chapter 2: Geometry", "startPage": 46, "endPage": 89 }
       ]
     }

WORKFLOW:
  1. Split PDF by chapters (max 30 pages per chunk)
  2. Send each chunk to Claude API with your prompt
  3. Parse HTML output to extract questions
  4. Run validation agents on each question
  5. Insert validated questions into database

REQUIREMENTS:
  - ANTHROPIC_API_KEY in .env.local
  - Prompt template file (pdf_extraction_prompt.txt)
  - Database credentials in .env.local

OUTPUT:
  - PDF chunks in <workdir>/chunks/
  - HTML outputs in <workdir>/outputs/
  - Processing reports in <workdir>/
  - Questions inserted into database
    `);
    process.exit(0);
  }

  const pdfPath = args[0];

  if (!fs.existsSync(pdfPath)) {
    console.error(`❌ Error: PDF file not found: ${pdfPath}`);
    process.exit(1);
  }

  // Parse options
  const options = { pdfPath };

  for (let i = 1; i < args.length; i++) {
    if (args[i] === '--subject' && args[i + 1]) {
      options.subject = args[i + 1];
      i++;
    } else if (args[i] === '--prompt' && args[i + 1]) {
      options.promptFile = args[i + 1];
      i++;
    } else if (args[i] === '--workdir' && args[i + 1]) {
      options.workDir = args[i + 1];
      i++;
    } else if (args[i] === '--no-validate') {
      options.validate = false;
    }
  }

  // Run pipeline
  const pipeline = new PDFToDatabasePipeline(options);
  pipeline.run().catch(err => {
    console.error('\n❌ Fatal error:', err.message);
    process.exit(1);
  });
}

module.exports = PDFToDatabasePipeline;
