/**
 * AI-Powered Formatting Cleanup Pipeline
 * Fixes:
 * 1. HTML entities in options (μ<sub>s</sub> → μₛ)
 * 2. Combined words without spaces (KWorkTransferWCarnotRefrigeratorK)
 * 3. Missing figure warnings
 */

const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const CONFIG = {
  claudeApiKey: process.env.ANTHROPIC_API_KEY,
  claudeModel: 'claude-3-haiku-20240307',
  subjects: ['Physics', 'Chemistry', 'Mathematics'],
};

// ============================================================================
// Claude AI Helper
// ============================================================================

class ClaudeAI {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.baseUrl = 'https://api.anthropic.com/v1/messages';
  }

  async call(prompt, maxTokens = 1000) {
    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: CONFIG.claudeModel,
          max_tokens: maxTokens,
          messages: [{ role: 'user', content: prompt }],
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        console.error('     ❌ API Error:', error);
        return null;
      }

      const data = await response.json();
      return data.content[0].text.trim();
    } catch (error) {
      console.error('     ❌ API Call Failed:', error.message);
      return null;
    }
  }

  // Fix HTML entities in options
  async cleanOptions(options) {
    const optionsStr = JSON.stringify(options);

    // Check if has HTML entities
    if (!optionsStr.includes('<sub>') && !optionsStr.includes('<sup>') &&
        !optionsStr.includes('<strong>') && !optionsStr.includes('<em>') &&
        !optionsStr.includes('<br')) {
      return options; // No issues
    }

    const prompt = `Convert these multiple choice options from HTML to clean plain text with proper Unicode characters.

Options (JSON): ${optionsStr}

Rules:
1. Replace <sub> with Unicode subscripts (₀₁₂₃₄₅₆₇₈₉)
2. Replace <sup> with Unicode superscripts (⁰¹²³⁴⁵⁶⁷⁸⁹)
3. Remove all HTML tags (<strong>, <em>, <br/>, etc.)
4. Keep the JSON structure with keys a, b, c, d
5. Preserve all mathematical notation and units
6. Use proper Unicode for Greek letters (μ, α, β, etc.)

Provide ONLY the cleaned JSON object, no explanation.`;

    const result = await this.call(prompt, 1000);
    if (!result) return options;

    try {
      // Extract JSON from response
      const jsonMatch = result.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const cleaned = JSON.parse(jsonMatch[0]);
        return cleaned;
      }
    } catch (e) {
      console.error('     ⚠️ Failed to parse cleaned options');
    }

    return options;
  }

  // Fix combined words
  async fixCombinedWords(text) {
    // Check for combined words pattern
    const combinedPattern = /[A-Z]{2,}[a-z]+[A-Z][a-z]+[A-Z]/;
    if (!combinedPattern.test(text)) {
      return text; // No issues
    }

    const prompt = `Fix the combined words in this text by adding proper spaces between words.

Text: ${text}

The text contains words stuck together without spaces (like "KWorkTransferWCarnotRefrigeratorK").

Rules:
1. Add spaces between distinct words
2. Preserve technical terms and abbreviations
3. Keep mathematical notation intact
4. Maintain the original meaning

Provide ONLY the corrected text, no explanation.`;

    const result = await this.call(prompt, 1500);
    return result || text;
  }

  // Remove figure warnings
  removeFigureWarning(text) {
    if (!text) return text;

    // Remove various forms of figure warnings
    let cleaned = text;

    // Remove full warning blocks
    cleaned = cleaned.replace(/⚠️\s*FIGURE MISSING:.*?The figure needs to be added manually\./gi, '');
    cleaned = cleaned.replace(/\[FIGURE NEEDED:.*?\]/gi, '');
    cleaned = cleaned.replace(/⚠️.*?figure.*?not included.*?document.*?\./gi, '');

    // Clean up extra whitespace
    cleaned = cleaned.replace(/\s{2,}/g, ' ').trim();

    return cleaned;
  }
}

// ============================================================================
// Main Pipeline
// ============================================================================

class FormattingCleanupPipeline {
  constructor() {
    this.ai = new ClaudeAI(CONFIG.claudeApiKey);
    this.stats = {
      total: 0,
      optionsCleaned: 0,
      wordsSeparated: 0,
      warningsRemoved: 0,
      errors: 0,
    };
  }

  async processSubject(subject) {
    console.log(`\n${'='.repeat(70)}`);
    console.log(`📋 Processing ${subject} Questions`);
    console.log(`${'='.repeat(70)}\n`);

    // Fetch all questions for this subject
    const { data: questions, error } = await supabase
      .from('questions')
      .select('*')
      .eq('subject', subject);

    if (error) {
      console.error('❌ Error fetching questions:', error);
      return;
    }

    console.log(`Found ${questions.length} questions\n`);

    for (const question of questions) {
      this.stats.total++;

      console.log(`\n📝 Processing: ${question.id.substring(0, 8)}...`);

      let needsUpdate = false;
      const updates = {};

      // 1. Clean options
      if (question.options) {
        const optionsStr = JSON.stringify(question.options);
        if (optionsStr.includes('<sub>') || optionsStr.includes('<sup>') ||
            optionsStr.includes('<strong>') || optionsStr.includes('<em>')) {
          console.log('   🔧 Cleaning HTML in options...');
          const cleaned = await this.ai.cleanOptions(question.options);
          if (JSON.stringify(cleaned) !== JSON.stringify(question.options)) {
            updates.options = cleaned;
            needsUpdate = true;
            this.stats.optionsCleaned++;
            console.log('   ✅ Options cleaned');
          }
          await this.delay(1000); // Rate limiting
        }
      }

      // 2. Fix combined words in question
      if (question.question) {
        const combinedPattern = /[A-Z]{2,}[a-z]+[A-Z][a-z]+[A-Z]/;
        if (combinedPattern.test(question.question)) {
          console.log('   🔧 Separating combined words...');
          const fixed = await this.ai.fixCombinedWords(question.question);
          if (fixed !== question.question) {
            updates.question = fixed;
            needsUpdate = true;
            this.stats.wordsSeparated++;
            console.log('   ✅ Words separated');
          }
          await this.delay(1000); // Rate limiting
        }
      }

      // 3. Remove figure warnings
      if (question.question &&
          (question.question.includes('⚠️ FIGURE MISSING') ||
           question.question.includes('FIGURE MISSING'))) {
        console.log('   🔧 Removing figure warning...');
        const cleaned = this.ai.removeFigureWarning(question.question);
        if (cleaned !== question.question) {
          updates.question = cleaned;
          needsUpdate = true;
          this.stats.warningsRemoved++;
          console.log('   ✅ Warning removed');
        }
      }

      // 4. Update database if needed
      if (needsUpdate) {
        const { error: updateError } = await supabase
          .from('questions')
          .update(updates)
          .eq('id', question.id);

        if (updateError) {
          console.error('   ❌ Update failed:', updateError.message);
          this.stats.errors++;
        } else {
          console.log('   💾 Database updated');
        }
      } else {
        console.log('   ✓ No issues found');
      }

      await this.delay(500); // General delay between questions
    }
  }

  async delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async run() {
    console.log('\n🚀 Starting Formatting Cleanup Pipeline\n');
    console.log(`Using AI Model: ${CONFIG.claudeModel}`);
    console.log(`Subjects: ${CONFIG.subjects.join(', ')}\n`);

    for (const subject of CONFIG.subjects) {
      await this.processSubject(subject);
    }

    this.printSummary();
  }

  printSummary() {
    console.log('\n\n' + '='.repeat(70));
    console.log('✅ Formatting Cleanup Complete');
    console.log('='.repeat(70));
    console.log('\n📊 Summary:');
    console.log(`   Total Questions: ${this.stats.total}`);
    console.log(`   Options Cleaned: ${this.stats.optionsCleaned}`);
    console.log(`   Words Separated: ${this.stats.wordsSeparated}`);
    console.log(`   Warnings Removed: ${this.stats.warningsRemoved}`);
    console.log(`   Errors: ${this.stats.errors}`);
    console.log(`   Success Rate: ${((this.stats.total - this.stats.errors) / this.stats.total * 100).toFixed(1)}%`);
    console.log('\n');
  }
}

// ============================================================================
// Run Pipeline
// ============================================================================

const pipeline = new FormattingCleanupPipeline();
pipeline.run().catch(console.error);
