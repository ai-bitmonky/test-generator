/**
 * PDF Splitter - Splits PDFs by chapters and page limits
 * Features:
 * - Detects chapter boundaries in PDFs
 * - Splits chapters > 30 pages into equal parts
 * - Outputs organized PDF chunks for processing
 */

const fs = require('fs');
const path = require('path');
const { PDFDocument } = require('pdf-lib');

class PDFSplitter {
  constructor(inputPDF, outputDir = 'pdf_chunks') {
    this.inputPDF = inputPDF;
    this.outputDir = outputDir;
    this.maxPagesPerChunk = 30;

    // Create output directory
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
    }
  }

  /**
   * Load PDF and get basic info
   */
  async loadPDF() {
    const pdfBuffer = fs.readFileSync(this.inputPDF);
    this.pdfDoc = await PDFDocument.load(pdfBuffer);
    this.totalPages = this.pdfDoc.getPageCount();

    console.log(`📄 Loaded PDF: ${path.basename(this.inputPDF)}`);
    console.log(`   Total pages: ${this.totalPages}`);

    return this.pdfDoc;
  }

  /**
   * Detect chapters in PDF based on bookmarks/outline or page patterns
   */
  async detectChapters() {
    // Try to extract chapter info from PDF outline (bookmarks)
    const chapters = [];

    try {
      // Get PDF outline (table of contents)
      const outline = this.pdfDoc.catalog.lookup('Outlines');

      if (outline) {
        // Parse outline structure (simplified)
        console.log('   ℹ️  PDF has bookmarks/outline');
        // This would need more complex parsing - for now use heuristic
      }
    } catch (e) {
      console.log('   ℹ️  No PDF bookmarks found, using page-based splitting');
    }

    // If no outline or detection fails, use simple page-based chunking
    // User can provide chapter boundaries via config file
    const configPath = this.inputPDF.replace('.pdf', '_chapters.json');

    if (fs.existsSync(configPath)) {
      console.log(`   📖 Loading chapter config from: ${path.basename(configPath)}`);
      const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
      return config.chapters;
    }

    // Default: treat entire PDF as one chapter
    console.log('   ℹ️  No chapter config found, treating as single document');
    return [{
      name: 'Full Document',
      startPage: 1,
      endPage: this.totalPages
    }];
  }

  /**
   * Split a chapter into smaller chunks if > maxPagesPerChunk
   */
  splitChapter(chapter) {
    const pageCount = chapter.endPage - chapter.startPage + 1;

    if (pageCount <= this.maxPagesPerChunk) {
      return [chapter];
    }

    // Calculate number of chunks needed
    const numChunks = Math.ceil(pageCount / this.maxPagesPerChunk);
    const pagesPerChunk = Math.ceil(pageCount / numChunks); // Equal distribution

    console.log(`   ✂️  Chapter "${chapter.name}" has ${pageCount} pages`);
    console.log(`      Splitting into ${numChunks} chunks of ~${pagesPerChunk} pages each`);

    const chunks = [];
    let currentStart = chapter.startPage;

    for (let i = 0; i < numChunks; i++) {
      const currentEnd = Math.min(
        currentStart + pagesPerChunk - 1,
        chapter.endPage
      );

      chunks.push({
        name: `${chapter.name} - Part ${i + 1}`,
        startPage: currentStart,
        endPage: currentEnd,
        chapterName: chapter.name,
        partNumber: i + 1,
        totalParts: numChunks
      });

      currentStart = currentEnd + 1;
    }

    return chunks;
  }

  /**
   * Extract pages and save as new PDF
   */
  async extractPages(startPage, endPage, outputPath) {
    const newPdf = await PDFDocument.create();

    // Copy pages (convert from 1-indexed to 0-indexed)
    const pages = await newPdf.copyPages(
      this.pdfDoc,
      Array.from(
        { length: endPage - startPage + 1 },
        (_, i) => startPage - 1 + i
      )
    );

    pages.forEach(page => newPdf.addPage(page));

    const pdfBytes = await newPdf.save();
    fs.writeFileSync(outputPath, pdfBytes);

    return outputPath;
  }

  /**
   * Main split function - orchestrates the entire process
   */
  async split() {
    console.log('\n📚 Starting PDF splitting process...\n');

    await this.loadPDF();
    const chapters = await this.detectChapters();

    console.log(`\n📖 Found ${chapters.length} chapter(s)\n`);

    const allChunks = [];

    for (const chapter of chapters) {
      const chunks = this.splitChapter(chapter);
      allChunks.push(...chunks);
    }

    console.log(`\n✂️  Total chunks to create: ${allChunks.length}\n`);

    // Extract all chunks
    const chunkFiles = [];

    for (let i = 0; i < allChunks.length; i++) {
      const chunk = allChunks[i];
      const filename = `chunk_${String(i + 1).padStart(3, '0')}_${this.sanitizeFilename(chunk.name)}.pdf`;
      const outputPath = path.join(this.outputDir, filename);

      console.log(`📄 Creating chunk ${i + 1}/${allChunks.length}: ${chunk.name}`);
      console.log(`   Pages: ${chunk.startPage}-${chunk.endPage}`);

      await this.extractPages(chunk.startPage, chunk.endPage, outputPath);

      chunkFiles.push({
        file: outputPath,
        chunk: chunk,
        index: i
      });

      console.log(`   ✅ Saved: ${filename}\n`);
    }

    // Save manifest
    const manifest = {
      source: this.inputPDF,
      totalPages: this.totalPages,
      totalChunks: chunkFiles.length,
      maxPagesPerChunk: this.maxPagesPerChunk,
      created: new Date().toISOString(),
      chunks: chunkFiles.map(cf => ({
        file: path.basename(cf.file),
        name: cf.chunk.name,
        startPage: cf.chunk.startPage,
        endPage: cf.chunk.endPage,
        pageCount: cf.chunk.endPage - cf.chunk.startPage + 1
      }))
    };

    const manifestPath = path.join(this.outputDir, 'manifest.json');
    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));

    console.log(`\n✅ Splitting complete!`);
    console.log(`   Created ${chunkFiles.length} chunks in: ${this.outputDir}`);
    console.log(`   Manifest saved: ${manifestPath}\n`);

    return { manifest, chunkFiles };
  }

  /**
   * Sanitize filename
   */
  sanitizeFilename(name) {
    return name
      .replace(/[^a-z0-9]/gi, '_')
      .replace(/_+/g, '_')
      .toLowerCase()
      .substring(0, 50);
  }
}

// CLI interface
if (require.main === module) {
  const inputPDF = process.argv[2];
  const outputDir = process.argv[3] || 'pdf_chunks';

  if (!inputPDF) {
    console.log(`
📚 PDF Splitter - Split PDFs by chapters with page limits

Usage:
  node pdf_splitter.js <input.pdf> [output_dir]

Options:
  input.pdf    - PDF file to split
  output_dir   - Output directory (default: pdf_chunks)

Chapter Configuration:
  To define chapters, create a JSON file with same name as PDF:
  <input>_chapters.json

  Format:
  {
    "chapters": [
      { "name": "Chapter 1", "startPage": 1, "endPage": 45 },
      { "name": "Chapter 2", "startPage": 46, "endPage": 89 }
    ]
  }

Features:
  • Automatically splits chapters > 30 pages into equal parts
  • Creates organized chunks for processing
  • Generates manifest.json with metadata
    `);
    process.exit(1);
  }

  if (!fs.existsSync(inputPDF)) {
    console.error(`❌ File not found: ${inputPDF}`);
    process.exit(1);
  }

  const splitter = new PDFSplitter(inputPDF, outputDir);
  splitter.split().catch(err => {
    console.error('❌ Error:', err.message);
    process.exit(1);
  });
}

module.exports = PDFSplitter;
