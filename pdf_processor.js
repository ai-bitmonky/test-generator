/**
 * PDF Processor - Sends PDF chunks to Claude API with vision
 * Features:
 * - Converts PDF pages to images (Claude vision API)
 * - Sends to Claude with custom prompt
 * - Returns HTML output for parsing
 */

const fs = require('fs');
const path = require('path');
const { PDFDocument } = require('pdf-lib');
const pdf = require('pdf-parse');
require('dotenv').config({ path: '.env.local' });

class PDFProcessor {
  constructor(promptFile) {
    this.apiKey = process.env.ANTHROPIC_API_KEY;
    this.model = 'claude-3-5-sonnet-20241022'; // Vision-capable model
    this.baseURL = 'https://api.anthropic.com/v1/messages';
    this.promptTemplate = this.loadPrompt(promptFile);
    this.delay = 5000; // 5 second delay between API calls
  }

  /**
   * Load prompt template from file
   */
  loadPrompt(promptFile) {
    if (!fs.existsSync(promptFile)) {
      throw new Error(`Prompt file not found: ${promptFile}`);
    }

    return fs.readFileSync(promptFile, 'utf-8');
  }

  /**
   * Extract text from PDF (for context)
   */
  async extractText(pdfPath) {
    try {
      const dataBuffer = fs.readFileSync(pdfPath);
      const data = await pdf(dataBuffer);
      return data.text;
    } catch (error) {
      console.error(`   ⚠️  Could not extract text: ${error.message}`);
      return '';
    }
  }

  /**
   * Call Claude API with PDF document
   * Note: Claude can process PDFs directly without image conversion
   */
  async processPDF(pdfPath, metadata = {}) {
    console.log(`\n📄 Processing PDF: ${path.basename(pdfPath)}`);

    // Read PDF as base64
    const pdfBuffer = fs.readFileSync(pdfPath);
    const base64PDF = pdfBuffer.toString('base64');

    // Extract text for additional context
    const pdfText = await this.extractText(pdfPath);

    // Build prompt with metadata
    let prompt = this.promptTemplate;

    // Replace placeholders in template
    prompt = prompt.replace('{chapter_name}', metadata.name || 'Unknown Chapter');
    prompt = prompt.replace('{page_range}', `${metadata.startPage || '?'}-${metadata.endPage || '?'}`);
    prompt = prompt.replace('{subject}', metadata.subject || 'General');

    // Add text context if available
    if (pdfText) {
      prompt += `\n\n<document_text>\n${pdfText}\n</document_text>`;
    }

    try {
      console.log('   🤖 Sending to Claude API (with document content)...');

      const response = await fetch(this.baseURL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: this.model,
          max_tokens: 16000, // Large output for multiple questions
          messages: [
            {
              role: 'user',
              content: [
                {
                  type: 'document',
                  source: {
                    type: 'base64',
                    media_type: 'application/pdf',
                    data: base64PDF
                  }
                },
                {
                  type: 'text',
                  text: prompt
                }
              ]
            }
          ]
        })
      });

      if (!response.ok) {
        const error = await response.text();
        console.error('   ❌ Claude API Error:', error);

        // Check for rate limiting
        if (error.includes('rate_limit_error')) {
          console.log('   ⏳ Rate limit hit, waiting before retry...');
          await new Promise(resolve => setTimeout(resolve, 10000)); // Wait 10s
          return await this.processPDF(pdfPath, metadata); // Retry
        }

        return null;
      }

      const data = await response.json();
      const htmlOutput = data.content[0].text;

      console.log(`   ✅ Received response (${htmlOutput.length} characters)`);

      return htmlOutput;

    } catch (error) {
      console.error(`   ❌ Error processing PDF: ${error.message}`);
      return null;
    }
  }

  /**
   * Process all chunks from a manifest
   */
  async processChunks(manifestPath, outputDir = 'pdf_outputs') {
    console.log('\n🚀 Starting chunk processing...\n');

    if (!fs.existsSync(manifestPath)) {
      throw new Error(`Manifest not found: ${manifestPath}`);
    }

    // Create output directory
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
    const chunksDir = path.dirname(manifestPath);

    console.log(`📚 Found ${manifest.chunks.length} chunks to process`);
    console.log(`⏱️  Estimated time: ${Math.ceil(manifest.chunks.length * this.delay / 60000)} minutes\n`);

    const results = [];

    for (let i = 0; i < manifest.chunks.length; i++) {
      const chunk = manifest.chunks[i];
      const chunkPath = path.join(chunksDir, chunk.file);

      console.log(`\n${'='.repeat(70)}`);
      console.log(`📝 Processing chunk ${i + 1}/${manifest.chunks.length}`);
      console.log(`${'='.repeat(70)}`);
      console.log(`   Name: ${chunk.name}`);
      console.log(`   Pages: ${chunk.startPage}-${chunk.endPage} (${chunk.pageCount} pages)`);

      // Process with Claude
      const htmlOutput = await this.processPDF(chunkPath, {
        ...chunk,
        subject: manifest.subject || 'General'
      });

      if (htmlOutput) {
        // Save HTML output
        const outputFilename = chunk.file.replace('.pdf', '.html');
        const outputPath = path.join(outputDir, outputFilename);

        fs.writeFileSync(outputPath, htmlOutput);

        console.log(`   💾 Saved HTML: ${outputFilename}`);

        results.push({
          chunk: chunk,
          output: outputPath,
          success: true
        });
      } else {
        console.log(`   ❌ Failed to process chunk`);
        results.push({
          chunk: chunk,
          output: null,
          success: false
        });
      }

      // Rate limiting delay
      if (i < manifest.chunks.length - 1) {
        console.log(`   ⏳ Waiting ${this.delay / 1000}s before next chunk...`);
        await new Promise(resolve => setTimeout(resolve, this.delay));
      }
    }

    // Save processing report
    const report = {
      manifest: manifest,
      processed: new Date().toISOString(),
      results: results,
      summary: {
        total: results.length,
        successful: results.filter(r => r.success).length,
        failed: results.filter(r => !r.success).length
      }
    };

    const reportPath = path.join(outputDir, 'processing_report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

    console.log(`\n${'='.repeat(70)}`);
    console.log('✅ Processing complete!');
    console.log(`${'='.repeat(70)}`);
    console.log(`   Total chunks: ${report.summary.total}`);
    console.log(`   Successful: ${report.summary.successful}`);
    console.log(`   Failed: ${report.summary.failed}`);
    console.log(`   Report saved: ${reportPath}\n`);

    return report;
  }
}

// CLI interface
if (require.main === module) {
  const manifestPath = process.argv[2];
  const promptFile = process.argv[3] || 'pdf_extraction_prompt.txt';
  const outputDir = process.argv[4] || 'pdf_outputs';

  if (!manifestPath) {
    console.log(`
🤖 PDF Processor - Process PDF chunks with Claude AI

Usage:
  node pdf_processor.js <manifest.json> [prompt_file] [output_dir]

Arguments:
  manifest.json  - Manifest from pdf_splitter.js
  prompt_file    - Prompt template file (default: pdf_extraction_prompt.txt)
  output_dir     - Output directory (default: pdf_outputs)

The prompt file can use these placeholders:
  {chapter_name} - Name of the chapter
  {page_range}   - Page range (e.g., "1-30")
  {subject}      - Subject name

Example:
  node pdf_splitter.js textbook.pdf
  node pdf_processor.js pdf_chunks/manifest.json
    `);
    process.exit(1);
  }

  const processor = new PDFProcessor(promptFile);
  processor.processChunks(manifestPath, outputDir).catch(err => {
    console.error('❌ Error:', err.message);
    process.exit(1);
  });
}

module.exports = PDFProcessor;
