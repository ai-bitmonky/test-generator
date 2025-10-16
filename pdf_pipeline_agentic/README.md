# AI-Powered Agentic PDF Pipeline

## Overview

This pipeline uses AI agents to automatically extract questions from PDF files, enrich them with solutions and expert advice, validate them, and insert them into the database.

## Features

✅ **PDF Chunking** - Splits large PDFs into manageable chunks
✅ **AI Question Extraction** - Uses Claude AI to extract questions from text
✅ **AI Enrichment** - Generates solution steps, strategies, and expert insights
✅ **AI Classification** - Automatically identifies subject and exam level (JEE Mains/Advanced)
✅ **Full Validation** - Validates all fields before database insertion
✅ **Database Integration** - Automatically inserts validated questions
✅ **Network Resilience** - Handles rate limits and network failures
✅ **Comprehensive Reporting** - Detailed logs and JSON reports

## Pipeline Flow

```
┌─────────────┐
│  Load PDF   │
└──────┬──────┘
       │
       ↓
┌─────────────────┐
│ Split into      │
│ Chunks (pages)  │
└──────┬──────────┘
       │
       ↓
┌─────────────────┐
│ AI Agent 1:     │
│ Extract         │
│ Questions       │
└──────┬──────────┘
       │
       ↓
┌─────────────────┐
│ AI Agent 2:     │
│ Generate        │
│ Solutions &     │
│ Insights        │
└──────┬──────────┘
       │
       ↓
┌─────────────────┐
│ AI Agent 3:     │
│ Classify        │
│ Subject & Level │
└──────┬──────────┘
       │
       ↓
┌─────────────────┐
│ Validation      │
│ Pipeline        │
└──────┬──────────┘
       │
       ↓
┌─────────────────┐
│ Insert into     │
│ Database        │
└─────────────────┘
```

## Installation

No additional dependencies needed if you already have the project set up.

Required packages (already in package.json):
- `pdf-parse` - PDF parsing
- `@supabase/supabase-js` - Database connection
- `dotenv` - Environment variables

## Usage

### Basic Usage

```bash
node pdf_pipeline_agentic/agentic_pdf_pipeline.js <pdf_path> [subject]
```

### Examples

```bash
# Process Mathematics PDF
node pdf_pipeline_agentic/agentic_pdf_pipeline.js ./sample_math.pdf Mathematics

# Process Physics PDF
node pdf_pipeline_agentic/agentic_pdf_pipeline.js ./jee_physics.pdf Physics

# Process Chemistry PDF
node pdf_pipeline_agentic/agentic_pdf_pipeline.js ./chemistry_questions.pdf Chemistry
```

## Configuration

Edit the `CONFIG` object in `agentic_pdf_pipeline.js`:

```javascript
const CONFIG = {
  pdfPath: process.argv[2] || './sample.pdf',    // PDF file path
  subject: process.argv[3] || 'Mathematics',     // Subject name
  chunkSize: 3,                                   // Pages per chunk
  claudeModel: 'claude-3-haiku-20240307',        // AI model
  baseDelay: 5000,                                // Delay between API calls (ms)
  maxRetries: 5,                                  // Max retries for failed calls
  outputDir: 'agentic_pipeline_output',          // Output directory
};
```

## AI Agents

### Agent 1: Question Parser

**Purpose**: Extract questions from PDF text

**Input**: Text chunk from PDF

**Output**: Array of questions with:
- question_text
- options (for MCQ)
- correct_answer
- topic
- sub_topic
- difficulty
- question_type

**Prompt Strategy**: Structured JSON extraction with clear examples

### Agent 2: Question Enricher

**Purpose**: Generate detailed solutions and expert content

**Input**: Basic question data

**Output**: Enriched question with:
- solution_steps (HTML formatted)
- strategy (100 words max)
- expert_insight (100 words max)
- key_facts (array of 3-5 facts)

**Prompt Strategy**: Expert-level content generation with constraints

### Agent 3: Classification Agent

**Purpose**: Identify subject and exam level for each question

**Input**: Question text with enriched content

**Output**: Classification with:
- subject (Physics, Chemistry, or Mathematics)
- exam_level (JEE Mains or JEE Advanced)
- subject_confidence (0.0-1.0)
- exam_level_confidence (0.0-1.0)
- reasoning (explanation of classification)
- complexity_factors (array of factors)
- is_multi_concept (boolean)
- estimated_steps (number)

**JEE Advanced Criteria**:
- Multi-concept integration (2+ concepts)
- Sophisticated reasoning required
- Non-routine problem formulation
- Advanced mathematical/scientific modelling
- Complex constraint analysis
- Multi-step solution pathway (3+ steps)

**JEE Mains Criteria**:
- Single-concept application
- Routine computational exercise
- Direct formula application
- Plug-and-play problems
- 1-2 step solution

**Fallback**: Keyword-based detection if AI classification fails

## Validation

All questions go through comprehensive validation:

✅ **Required Fields**: question_text, correct_answer, topic
✅ **Field Length**: Minimum lengths for question and solution
✅ **MCQ Validation**: Exactly 4 options for MCQ type
✅ **Difficulty**: Must be Easy, Medium, or Hard
✅ **Word Limits**: Strategy and insights max 100 words

Questions with critical errors are **not inserted** into the database.

## Output

### Console Output

Real-time progress with:
- Chunk processing status
- Questions extracted count
- Enrichment progress
- Validation issues
- Database insertion confirmations

### JSON Report

Saved to `agentic_pipeline_output/report_<timestamp>.json`

Contains:
```json
{
  "totalChunks": 10,
  "questionsExtracted": 45,
  "questionsEnriched": 45,
  "questionsValidated": 42,
  "questionsInserted": 42,
  "failed": [...],
  "validationIssues": [...]
}
```

## Error Handling

### Rate Limiting
- **Detection**: Automatic detection of rate limit errors
- **Response**: Progressive backoff (15s, 30s, 45s, 60s, 75s)
- **Retries**: Up to 5 attempts

### Network Failures
- **Detection**: Catches ECONNREFUSED, network errors
- **Response**: Longer waits (30s, 60s, 90s, 120s, 150s)
- **Recovery**: Automatic retry when connection restored

### Validation Failures
- **Critical Errors**: Question skipped, not inserted
- **Warnings**: Logged but question still inserted
- **Tracking**: All issues saved in report

## Best Practices

### 1. PDF Preparation
- Ensure PDF has selectable text (not scanned images)
- Clear formatting helps extraction
- Remove unnecessary headers/footers

### 2. Chunk Size
- **Small PDFs (< 20 pages)**: Use chunkSize: 5
- **Medium PDFs (20-50 pages)**: Use chunkSize: 3
- **Large PDFs (> 50 pages)**: Use chunkSize: 2

### 3. Rate Limiting
- Default 5s delay is safe for most use cases
- Increase to 8s if you encounter rate limits
- Process during off-peak hours for better performance

### 4. Monitoring
- Watch console output for extraction quality
- Check validation issues in real-time
- Review JSON report after completion

## Troubleshooting

### "No questions extracted"
- **Cause**: PDF text not parseable or no questions present
- **Fix**: Check PDF quality, try smaller chunks, inspect text extraction

### "Rate limit errors"
- **Cause**: Too many API calls too quickly
- **Fix**: Increase `baseDelay`, reduce `chunkSize`

### "Validation errors"
- **Cause**: AI generated incomplete or invalid data
- **Fix**: Check prompt quality, review failed questions in report

### "Database insert failed"
- **Cause**: Database connection or schema issues
- **Fix**: Verify Supabase credentials, check table schema

## Advanced Usage

### Custom Validation Rules

Add custom validation in `QuestionValidator`:

```javascript
validate(question) {
  const issues = [];

  // Your custom validation
  if (question.question_text.length > 500) {
    issues.push({
      type: 'warning',
      field: 'question_text',
      message: 'Question is very long'
    });
  }

  return issues;
}
```

### Custom Enrichment

Modify the enrichment prompt in `AIQuestionEnricher`:

```javascript
const prompt = `You are a JEE expert...
[Add your custom instructions here]
`;
```

## Performance

### Typical Processing Time

- **Per Question**: 10-15 seconds (2 AI calls + delays)
- **Per Chunk (3 pages)**: 2-5 minutes (depends on questions per page)
- **Full PDF (50 pages)**: 30-60 minutes

### Cost Estimation

Using Claude Haiku:
- **Per Question**: ~2000 tokens (~$0.0005)
- **100 Questions**: ~200K tokens (~$0.05)
- **1000 Questions**: ~2M tokens (~$0.50)

## Monitoring & Logs

### Real-time Console Output

```
🚀 AI-Powered Agentic PDF Pipeline

📁 PDF: ./sample.pdf
📚 Subject: Mathematics
⚙️  Chunk size: 3 pages

======================================================================

📄 Loading PDF: ./sample.pdf
   ✅ Loaded 15 pages
   📊 Total text length: 45230 characters

✂️  Splitting into chunks (3 pages per chunk)...
   ✅ Created 5 chunks

──────────────────────────────────────────────────────────────────────
🤖 Parsing chunk 1 (pages 1-3)...
   ✅ Extracted 8 questions

🎨 Enriching question 1...
   ✅ Generated solution and insights

✓ Validating question 1...
   ⚠️  Found 1 validation issues:
      - WARNING: strategy - Exceeds 100 words

💾 Inserting into database...
   ✅ Inserted with ID: 1234
```

### JSON Report Structure

```json
{
  "totalChunks": 5,
  "questionsExtracted": 35,
  "questionsEnriched": 35,
  "questionsValidated": 33,
  "questionsInserted": 33,
  "failed": [
    {
      "question": "Calculate the derivative...",
      "reason": "Validation errors",
      "issues": [...]
    }
  ],
  "validationIssues": [
    {
      "question": 12,
      "type": "warning",
      "field": "strategy",
      "message": "Strategy exceeds 100 words"
    }
  ]
}
```

## Integration with Admin Panel

All questions inserted by this pipeline:
- ✅ Automatically appear in admin panel
- ✅ Have complete audit trail
- ✅ Can be edited and version tracked
- ✅ Include AI-generated content

Access at: `http://localhost:3000/admin/questions`

## Future Enhancements

Potential improvements:
- [ ] OCR support for scanned PDFs
- [ ] Image extraction and processing
- [ ] Multi-language support
- [ ] Batch processing multiple PDFs
- [ ] Resume from checkpoint
- [ ] Parallel chunk processing
- [ ] Question deduplication
- [ ] Quality scoring

## Support

For issues:
1. Check console output for errors
2. Review JSON report for details
3. Verify PDF quality and format
4. Check API key and database credentials
5. Review validation issues

## License

Part of the JEE Test NextJS project.
