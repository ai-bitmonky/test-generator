# 📚 PDF to Database Pipeline

Complete automated pipeline for extracting JEE exam questions from PDF textbooks and inserting them into the database with full validation.

## 🎯 Overview

This pipeline automates the entire process of converting PDF textbooks into structured question data:

```
PDF File → Chapter Splitting → Claude AI Processing → Question Extraction → Validation → Database
```

## 🏗️ Architecture

The system consists of 4 main components:

### 1. **PDF Splitter** (`pdf_splitter.js`)
- Splits large PDFs by chapters
- Enforces 30-page maximum per chunk
- Supports custom chapter definitions
- Generates manifest for tracking

### 2. **PDF Processor** (`pdf_processor.js`)
- Sends PDF chunks to Claude API with vision
- Uses customizable prompts
- Handles rate limiting automatically
- Saves HTML output for parsing

### 3. **HTML Question Parser** (`html_question_parser.js`)
- Extracts questions from Claude's HTML output
- Validates question structure
- Runs all validation agents
- Inserts into database

### 4. **Main Orchestrator** (`pdf_to_db_pipeline.js`)
- Coordinates all components
- Manages workflow
- Tracks progress and statistics
- Generates comprehensive reports

## 📋 Prerequisites

### 1. Environment Setup

Add to `.env.local`:
```env
ANTHROPIC_API_KEY=your_api_key_here
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_key
```

### 2. Dependencies

Already installed:
```bash
npm install pdf-parse pdf-lib jsdom
```

### 3. Prompt Template

The pipeline uses `pdf_extraction_prompt.txt` (already created) which instructs Claude how to extract and format questions.

## 🚀 Usage

### Basic Usage

```bash
node pdf_to_db_pipeline.js textbook.pdf
```

This will:
1. Split the PDF into chapters (max 30 pages each)
2. Process each chunk with Claude AI
3. Extract and validate questions
4. Insert into database

### With Options

```bash
# Specify subject
node pdf_to_db_pipeline.js physics_book.pdf --subject Physics

# Custom work directory
node pdf_to_db_pipeline.js chem.pdf --subject Chemistry --workdir chem_output

# Use custom prompt
node pdf_to_db_pipeline.js math.pdf --prompt custom_prompt.txt

# Skip validation (faster but risky)
node pdf_to_db_pipeline.js test.pdf --no-validate
```

### Defining Chapters

Create a JSON file with the same name as your PDF:

**textbook.pdf** → **textbook_chapters.json**

```json
{
  "chapters": [
    { "name": "Chapter 1: Mechanics", "startPage": 1, "endPage": 45 },
    { "name": "Chapter 2: Thermodynamics", "startPage": 46, "endPage": 89 },
    { "name": "Chapter 3: Electromagnetism", "startPage": 90, "endPage": 135 }
  ]
}
```

If no chapter file exists, the entire PDF is treated as one document.

## 📊 Output Structure

After running, you'll get:

```
pdf_pipeline_<timestamp>/
├── chunks/                      # Split PDF files
│   ├── chunk_001_chapter_1.pdf
│   ├── chunk_002_chapter_2_part_1.pdf
│   ├── chunk_003_chapter_2_part_2.pdf
│   └── manifest.json           # Metadata about chunks
│
├── outputs/                     # Claude's HTML outputs
│   ├── chunk_001_chapter_1.html
│   ├── chunk_002_chapter_2_part_1.html
│   ├── chunk_003_chapter_2_part_2.html
│   ├── processing_report.json  # Processing statistics
│   └── insertion_report.json   # Database insertion results
│
└── pipeline_report.json         # Complete pipeline summary
```

## 📈 Example Output

```
╔══════════════════════════════════════════════════════════════════════════════╗
║                        🎉 PIPELINE COMPLETE                                   ║
╚══════════════════════════════════════════════════════════════════════════════╝

📊 FINAL SUMMARY:

PDF Processing:
   Source: physics_textbook.pdf
   Total pages: 245
   Chunks created: 9
   Chunks processed: 9

Question Extraction:
   Questions found: 127
   Successfully inserted: 124
   Failed: 3
   Success rate: 97.6%

Timing:
   Total duration: 47m 32s

Output files:
   Work directory: pdf_pipeline_1234567890
   PDF chunks: pdf_pipeline_1234567890/chunks
   HTML outputs: pdf_pipeline_1234567890/outputs

💾 Full report saved: pdf_pipeline_1234567890/pipeline_report.json
```

## 🔍 Validation

Before inserting into the database, each question is validated for:

✅ **Completeness**
- Question text is at least 10 characters
- All 4 options (a, b, c, d) are present
- Correct answer is specified and valid
- Solution is at least 20 characters

✅ **Content Quality** (using AI agents from existing pipeline)
- Question is self-contained and solvable
- Solution steps match the answer
- No missing figures (or properly noted)
- Mathematical notation is clean
- Word limits enforced (100 words)

✅ **Formatting**
- HTML entities converted to Unicode
- Combined words separated
- Figure warnings removed

## 🎛️ Individual Components

You can also run components separately:

### 1. Split PDF Only

```bash
node pdf_splitter.js textbook.pdf output_dir
```

Creates chunks and manifest without processing.

### 2. Process Chunks Only

```bash
node pdf_processor.js pdf_chunks/manifest.json prompt.txt output_dir
```

Processes pre-split chunks with Claude.

### 3. Parse HTML Only

```bash
node html_question_parser.js html_dir Subject true
```

Extracts questions from HTML files and inserts into database.

## 🔧 Customization

### Custom Prompt

Edit `pdf_extraction_prompt.txt` or create a new one:

```txt
You are an expert at extracting {subject} questions...

Extract all questions in this format:
<div class="question">
  ...
</div>
```

Use placeholders:
- `{chapter_name}` - Chapter name from manifest
- `{page_range}` - Page range (e.g., "1-30")
- `{subject}` - Subject name

### Adjust Rate Limiting

Edit `pdf_processor.js`:

```javascript
this.delay = 5000; // Change delay (milliseconds)
```

### Modify Validation Rules

Edit validation in `html_question_parser.js`:

```javascript
async validateQuestion(question) {
  const issues = [];

  // Add custom validation rules
  if (question.question.length < 20) {
    issues.push({ field: 'question', issue: 'Too short' });
  }

  return issues;
}
```

## 🐛 Troubleshooting

### Rate Limit Errors

If you see rate limit errors:

```bash
# Increase delay in pdf_processor.js
this.delay = 10000; // 10 seconds
```

Or use the adaptive rate limiter:

```bash
node adaptive_rate_limiter.js pdf_outputs/processing_report.json
```

### Validation Failures

Check `outputs/insertion_report.json` for details:

```json
{
  "validationIssues": [
    {
      "file": "chunk_001.html",
      "question": "Physics_Ch1_Q5",
      "issues": [
        { "field": "solution", "issue": "Solution missing or too short" }
      ]
    }
  ]
}
```

### Claude Output Format Issues

If Claude doesn't follow the HTML format:

1. Check `pdf_extraction_prompt.txt` is clear
2. Review HTML output in `outputs/` directory
3. Adjust prompt to be more specific
4. Try with claude-3-5-sonnet model (more capable)

### Missing Chapters

If chapter detection fails:

1. Create manual chapter definition file
2. Name it `<pdf_name>_chapters.json`
3. Define all chapters with start/end pages

## 📚 Advanced Features

### Parallel Processing

Process multiple PDFs in parallel:

```bash
# Terminal 1
node pdf_to_db_pipeline.js physics.pdf --subject Physics --workdir physics_out &

# Terminal 2
node pdf_to_db_pipeline.js chemistry.pdf --subject Chemistry --workdir chem_out &

# Terminal 3
node pdf_to_db_pipeline.js math.pdf --subject Mathematics --workdir math_out &
```

### Resume Failed Chunks

If processing fails mid-way:

```bash
# Re-process only failed chunks
node pdf_processor.js pdf_chunks/manifest.json

# Or parse already processed HTML
node html_question_parser.js pdf_outputs Subject
```

### Batch Processing

Create a batch script:

```bash
#!/bin/bash
for pdf in pdfs/*.pdf; do
  subject=$(basename "$pdf" .pdf)
  node pdf_to_db_pipeline.js "$pdf" --subject "$subject"
done
```

## 🎯 Best Practices

1. **Start Small**: Test with a single chapter before processing entire textbooks

2. **Check Prompts**: Review the first few HTML outputs to ensure quality

3. **Monitor Progress**: Check logs and reports in real-time

4. **Validate Output**: Always enable validation unless you're certain of the data quality

5. **Backup Database**: Before large imports, backup your database

6. **Rate Limiting**: Be respectful of API limits - use appropriate delays

7. **Quality Over Speed**: Better to process slowly with high quality than quickly with errors

## 📝 Example Workflow

```bash
# 1. Prepare PDF and chapter definitions
cp textbook.pdf ./
cat > textbook_chapters.json <<EOF
{
  "chapters": [
    { "name": "Chapter 1: Kinematics", "startPage": 1, "endPage": 32 },
    { "name": "Chapter 2: Dynamics", "startPage": 33, "endPage": 68 }
  ]
}
EOF

# 2. Run pipeline
node pdf_to_db_pipeline.js textbook.pdf --subject Physics

# 3. Check results
cat pdf_pipeline_*/pipeline_report.json

# 4. Review any failures
cat pdf_pipeline_*/outputs/insertion_report.json

# 5. If needed, reprocess with validation disabled
node html_question_parser.js pdf_pipeline_*/outputs Physics false
```

## 🔗 Integration with Existing Pipeline

This system integrates seamlessly with the existing AI pipeline (`ai_pipeline_fixed.js`):

1. **PDF Pipeline** extracts questions from PDFs → Database
2. **AI Pipeline** fixes and validates existing questions → Database

Both use the same validation agents and database schema.

## 📊 Performance

Typical processing times:

- **Splitting**: ~1-2 seconds per PDF
- **Claude Processing**: ~30-60 seconds per chunk (depends on pages)
- **Extraction**: ~1-2 seconds per HTML file
- **Validation**: ~5-10 seconds per question (with AI validation)

For a 200-page textbook:
- ~7 chunks (30 pages each)
- ~7-14 minutes total processing time
- ~50-100 questions extracted

## 🛠️ Future Enhancements

Potential improvements:

- [ ] OCR support for scanned PDFs
- [ ] Automatic figure extraction and SVG conversion
- [ ] Multi-language support
- [ ] Question deduplication
- [ ] Automatic topic classification
- [ ] Difficulty prediction using AI
- [ ] Support for other question types (subjective, numerical)

## 📞 Support

For issues or questions:

1. Check this README
2. Review log files in work directory
3. Examine detailed reports (JSON files)
4. Check existing validation pipeline documentation

## 📄 License

Part of the JEE Test Generator project.
