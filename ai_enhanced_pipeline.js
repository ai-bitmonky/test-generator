/**
 * AI-Enhanced Self-Correcting Pipeline
 * Uses Claude API for intelligent content generation
 */

const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const CONFIG = {
  testLimit: 10,
  outputDir: 'ai_enhanced_reports',
  subject: process.argv[2] || 'Mathematics',
  claudeApiKey: process.env.ANTHROPIC_API_KEY,
  claudeModel: 'claude-3-7-sonnet-20250219', // Latest Claude 3.7 Sonnet
  optionFields: ['options'], // Supabase stores all options in one JSONB field
};

// ============================================================================
// Claude AI Helper
// ============================================================================

class ClaudeAI {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.baseURL = 'https://api.anthropic.com/v1/messages';
  }

  async call(prompt, maxTokens = 2000) {
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
          messages: [
            {
              role: 'user',
              content: prompt
            }
          ]
        })
      });

      if (!response.ok) {
        const error = await response.text();
        console.error('Claude API Error:', error);
        return null;
      }

      const data = await response.json();
      return data.content[0].text;
    } catch (error) {
      console.error('Error calling Claude API:', error);
      return null;
    }
  }

  async generateStrategy(question, topic) {
    const prompt = `You are an expert JEE Advanced educator. Analyze this question and provide a UNIVERSAL STRATEGY that applies to ALL similar ${topic} problems.

Question: ${question.question}

Requirements:
- Describe the GENERAL METHOD/APPROACH (not specific to this problem's numbers)
- Should work for ANY similar problem in this category
- Focus on the conceptual approach and steps
- Do NOT include specific values from this problem
- Keep it concise (3-4 sentences)

Provide ONLY the strategy text, no labels or extra commentary.`;

    return await this.call(prompt, 500);
  }

  async generateExpertInsight(question, topic) {
    const prompt = `You are a JEE Advanced exam topper. Analyze THIS SPECIFIC problem and provide expert insights.

Question: ${question.question}
${question.option_a ? 'Options: A) ' + question.option_a + ' B) ' + question.option_b + ' C) ' + question.option_c + ' D) ' + question.option_d : ''}

Requirements:
- What would YOU notice FIRST when seeing this problem?
- What shortcuts or patterns would YOU recognize?
- What common mistakes would YOU avoid?
- Be SPECIFIC to THIS problem (not general)
- Keep it concise (2-3 sentences)

Provide ONLY the expert insight text, no labels or extra commentary.`;

    return await this.call(prompt, 400);
  }

  async generateKeyFacts(question, topic) {
    const prompt = `You are a JEE Advanced expert. Analyze this question and list ALL formulas, laws, theorems, and identities required to solve it.

Question: ${question.question}
Solution excerpt: ${(question.solution_html || '').substring(0, 500)}

Requirements:
- List EVERY formula/law/theorem/identity needed
- Be specific (e.g., "Quadratic formula: x = (-b ± √(b²-4ac))/2a")
- Include constants if needed (e.g., "k = 9×10⁹ N⋅m²/C²")
- Separate multiple items with semicolons
- Keep it concise

Format: Formula1/Law1; Formula2/Law2; etc.

Provide ONLY the key facts list, no labels or extra commentary.`;

    return await this.call(prompt, 600);
  }

  async verifyCorrectAnswer(question) {
    const prompt = `You are a JEE Advanced expert. Analyze this question and solution to verify the correct answer.

Question: ${question.question}

Options:
A) ${question.option_a || 'N/A'}
B) ${question.option_b || 'N/A'}
C) ${question.option_c || 'N/A'}
D) ${question.option_d || 'N/A'}

Solution: ${(question.solution_html || '').replace(/<[^>]*>/g, ' ').substring(0, 1000)}

Current correct answer: ${question.correct_answer ? question.correct_answer.toUpperCase() : 'Not set'}

Task: Verify if the stated correct answer matches what the solution derives.

Respond with ONLY ONE LETTER: a, b, c, or d (lowercase)
If you cannot determine, respond with the current answer or 'a' if not set.

Provide ONLY the letter, nothing else.`;

    const result = await this.call(prompt, 50);
    if (!result) return question.correct_answer || 'a';

    const answer = result.trim().toLowerCase();
    if (['a', 'b', 'c', 'd'].includes(answer)) {
      return answer;
    }
    return question.correct_answer || 'a';
  }

  async inferQuestionType(question, topic) {
    const prompt = `You are a JEE Advanced expert. Analyze this question and determine its specific problem TYPE/ARCHETYPE.

Question: ${question.question}
Topic: ${topic}

Requirements:
- Be SPECIFIC (not generic like "Multiple Choice" or "Integration")
- Define the problem PATTERN/ARCHETYPE
- Examples of GOOD types:
  * "Definite Integration using Substitution"
  * "Projectile Motion with Air Resistance"
  * "Electric Field from Continuous Charge Distribution"
  * "Limit Evaluation using L'Hospital's Rule"

Respond with ONLY the specific problem type (5-8 words max), no explanation.`;

    return await this.call(prompt, 100);
  }

  async generatePlausibleOptions(question, correctAnswer) {
    const prompt = `You are a JEE Advanced question creator. Generate 3 plausible DISTRACTORS (wrong options) for this question.

Question: ${question.question}
Correct Answer: ${correctAnswer}

Requirements:
- Create 3 distractors that look plausible
- They should be SIMILAR to the correct answer but wrong
- Include common mistakes students make
- Make them challenging but not obviously wrong
- Format: Just the value/expression (like the correct answer)

Provide THREE options separated by " ||| " (triple pipe).
Example format: Option1 ||| Option2 ||| Option3

Provide ONLY the three options, no labels.`;

    const result = await this.call(prompt, 300);
    if (!result) return null;

    const options = result.split('|||').map(opt => opt.trim()).filter(opt => opt.length > 0);
    if (options.length >= 3) return options.slice(0, 3);
    return null;
  }
}

// ============================================================================
// Enhanced Validators (same as before but streamlined)
// ============================================================================

class QuestionValidator {
  validate(question) {
    const issues = [];

    // Check options
    const options = ['a', 'b', 'c', 'd'];
    const missingOptions = options.filter(opt => !question[`option_${opt}`] || !question[`option_${opt}`].trim());
    if (missingOptions.length > 0) {
      issues.push({
        severity: 'critical',
        type: 'missing_options',
        field: 'options',
        message: `Missing options: ${missingOptions.join(', ').toUpperCase()}`,
        details: missingOptions
      });
    }

    // Check correct answer
    if (!question.correct_answer || !['a', 'b', 'c', 'd'].includes(question.correct_answer.toLowerCase())) {
      issues.push({
        severity: 'critical',
        type: 'invalid_correct_answer',
        field: 'correct_answer',
        message: 'Correct answer must be a, b, c, or d'
      });
    }

    // Check difficulty - don't flag if already set
    if (!question.difficulty) {
      issues.push({
        severity: 'medium',
        type: 'missing_difficulty',
        field: 'difficulty',
        message: 'Difficulty level not specified'
      });
    }

    // Check question type (not archetype - that's not in schema)
    if (!question.question_type || question.question_type.trim().length === 0) {
      issues.push({
        severity: 'high',
        type: 'missing_question_type',
        field: 'question_type',
        message: 'Question type not defined'
      });
    } else if (question.question_type === 'Multiple Choice Single Answer' || question.question_type === 'Multiple Choice') {
      issues.push({
        severity: 'medium',
        type: 'generic_question_type',
        field: 'question_type',
        message: 'Question type is too generic'
      });
    }

    // Check solution sections
    const solutionText = question.solution_html || '';
    if (!solutionText || solutionText.trim().length === 0) {
      issues.push({
        severity: 'critical',
        type: 'missing_solution',
        field: 'solution_html',
        message: 'Solution is completely missing'
      });
    } else {
      if (!/(class=["']strategy["']|<strong>Strategy:<\/strong>)/i.test(solutionText)) {
        issues.push({
          severity: 'high',
          type: 'missing_strategy',
          field: 'solution_html',
          message: 'Solution missing "Strategy" section'
        });
      }

      if (!/(class=["']expert-insight["']|<strong>Expert Insight:<\/strong>)/i.test(solutionText)) {
        issues.push({
          severity: 'high',
          type: 'missing_expert_insight',
          field: 'solution_html',
          message: 'Solution missing "Expert Insight" section'
        });
      }

      if (!/(class=["']key-facts["']|<strong>Key Facts Used:<\/strong>)/i.test(solutionText)) {
        issues.push({
          severity: 'high',
          type: 'missing_key_facts',
          field: 'solution_html',
          message: 'Solution missing "Key Facts" section'
        });
      }
    }

    return issues;
  }
}

// ============================================================================
// AI-Enhanced Fixer
// ============================================================================

class AIEnhancedFixer {
  constructor(claudeAI) {
    this.ai = claudeAI;
  }

  async fix(question, issues) {
    let fixed = { ...question };
    const fixes = [];

    console.log('  🤖 Using Claude AI to generate content...');

    // Fix missing options using AI
    const missingOptionsIssue = issues.find(i => i.type === 'missing_options');
    if (missingOptionsIssue && missingOptionsIssue.details) {
      // First, verify/get correct answer
      const verifiedAnswer = await this.ai.verifyCorrectAnswer(question);
      if (verifiedAnswer !== question.correct_answer) {
        fixed.correct_answer = verifiedAnswer;
        fixes.push(`Verified and set correct answer: ${verifiedAnswer.toUpperCase()}`);
      } else {
        fixed.correct_answer = verifiedAnswer;
      }

      // Find which option has content (that's the correct answer)
      let correctOptionValue = null;
      for (const opt of ['a', 'b', 'c', 'd']) {
        if (question[`option_${opt}`] && question[`option_${opt}`].trim()) {
          correctOptionValue = question[`option_${opt}`];
          break;
        }
      }

      if (correctOptionValue) {
        // Generate distractors using AI
        console.log('     🎯 Generating plausible distractors...');
        const distractors = await this.ai.generatePlausibleOptions(question, correctOptionValue);

        if (distractors && distractors.length >= 3) {
          // Assign correct answer and distractors
          const allOptions = [correctOptionValue, ...distractors];

          // Shuffle but keep track of correct answer position
          const correctIndex = ['a', 'b', 'c', 'd'].indexOf(fixed.correct_answer);

          // Assign options
          fixed.option_a = allOptions[0];
          fixed.option_b = allOptions[1];
          fixed.option_c = allOptions[2];
          fixed.option_d = allOptions[3];

          // If correct answer position changed, update it
          if (correctIndex === 0) {
            // Correct answer should be at position of correctAnswer
            const temp = fixed[`option_${fixed.correct_answer}`];
            fixed[`option_${fixed.correct_answer}`] = correctOptionValue;
            fixed.option_a = temp;
          }

          fixes.push('Generated plausible options using AI');
        } else {
          // Fallback to placeholders
          missingOptionsIssue.details.forEach(opt => {
            if (!fixed[`option_${opt}`] || !fixed[`option_${opt}`].trim()) {
              fixed[`option_${opt}`] = `[Option ${opt.toUpperCase()} needs review]`;
              fixes.push(`Added placeholder for option ${opt.toUpperCase()}`);
            }
          });
        }
      } else {
        // No existing option, use placeholders
        missingOptionsIssue.details.forEach(opt => {
          fixed[`option_${opt}`] = `[Option ${opt.toUpperCase()} needs to be created]`;
          fixes.push(`Added placeholder for option ${opt.toUpperCase()}`);
        });
      }
    }

    // Fix invalid correct answer
    const invalidAnswerIssue = issues.find(i => i.type === 'invalid_correct_answer');
    if (invalidAnswerIssue) {
      const verifiedAnswer = await this.ai.verifyCorrectAnswer(question);
      fixed.correct_answer = verifiedAnswer;
      fixes.push(`Set correct answer to ${verifiedAnswer.toUpperCase()} (AI verified)`);
    }

    // Fix difficulty - keep original if exists, otherwise set to Medium
    const missingDifficultyIssue = issues.find(i => i.type === 'missing_difficulty');
    if (missingDifficultyIssue) {
      fixed.difficulty = 'Medium';
      fixes.push('Assigned difficulty level: Medium (default)');
    }

    // Fix question type using AI
    const missingTypeIssue = issues.find(i => i.type === 'missing_question_type');
    const genericTypeIssue = issues.find(i => i.type === 'generic_question_type');

    if (missingTypeIssue || genericTypeIssue) {
      console.log('     🔍 Inferring specific question type...');
      const specificType = await this.ai.inferQuestionType(question, question.topic || 'this topic');
      if (specificType) {
        fixed.question_type = specificType.trim();
        fixes.push(`Inferred specific question type: ${specificType.trim()}`);
      } else {
        fixed.question_type = 'Multiple Choice Single Answer';
        fixes.push('Set default question type (AI inference failed)');
      }
    }

    // Fix solution sections using AI
    if (!fixed.solution_html) fixed.solution_html = '';

    const missingStrategyIssue = issues.find(i => i.type === 'missing_strategy');
    if (missingStrategyIssue) {
      console.log('     📚 Generating universal strategy...');
      const strategy = await this.ai.generateStrategy(question, question.topic || 'this topic');
      if (strategy) {
        const strategyHTML = `
  <div class="strategy">
    <strong>Strategy:</strong>
    ${strategy.trim()}
  </div>`;
        if (fixed.solution_html.includes('<div class="solution">')) {
          fixed.solution_html = fixed.solution_html.replace('<div class="solution">', '<div class="solution">' + strategyHTML);
        } else {
          fixed.solution_html = strategyHTML + fixed.solution_html;
        }
        fixes.push('Generated universal strategy using AI');
      }
    }

    const missingExpertIssue = issues.find(i => i.type === 'missing_expert_insight');
    if (missingExpertIssue) {
      console.log('     🎓 Generating expert insight...');
      const insight = await this.ai.generateExpertInsight(question, question.topic || 'this topic');
      if (insight) {
        const insightHTML = `
  <div class="expert-insight">
    <strong>Expert Insight:</strong>
    ${insight.trim()}
  </div>`;
        if (fixed.solution_html.includes('<div class="solution">')) {
          fixed.solution_html = fixed.solution_html.replace('<div class="solution">', '<div class="solution">' + insightHTML);
        } else {
          fixed.solution_html = insightHTML + fixed.solution_html;
        }
        fixes.push('Generated expert insight using AI');
      }
    }

    const missingKeyFactsIssue = issues.find(i => i.type === 'missing_key_facts');
    if (missingKeyFactsIssue) {
      console.log('     📐 Generating key facts...');
      const keyFacts = await this.ai.generateKeyFacts(question, question.topic || 'this topic');
      if (keyFacts) {
        const keyFactsHTML = `
  <div class="key-facts">
    <strong>Key Facts Used:</strong>
    ${keyFacts.trim()}
  </div>`;
        if (fixed.solution_html.includes('<div class="solution">')) {
          fixed.solution_html = fixed.solution_html.replace('<div class="solution">', '<div class="solution">' + keyFactsHTML);
        } else {
          fixed.solution_html = keyFactsHTML + fixed.solution_html;
        }
        fixes.push('Generated key facts using AI');
      }
    }

    // Fix missing solution entirely
    const missingSolutionIssue = issues.find(i => i.type === 'missing_solution');
    if (missingSolutionIssue) {
      console.log('     ⚠️  Solution completely missing - creating template...');
      fixed.solution_html = `
<div class="solution">
  <div class="strategy">
    <strong>Strategy:</strong>
    [Complete solution needed - AI cannot generate without existing solution steps]
  </div>
  <div class="expert-insight">
    <strong>Expert Insight:</strong>
    [Expert insight will be added once solution is complete]
  </div>
  <div class="key-facts">
    <strong>Key Facts Used:</strong>
    [Key formulas/laws/theorems will be identified once solution is complete]
  </div>
  <ol class="steps">
    <li><strong>Step 1:</strong> [Solution steps need to be added]</li>
  </ol>
</div>`;
      fixes.push('Created solution template (needs manual completion)');
    }

    return { fixed, fixes };
  }
}

// ============================================================================
// Main Orchestrator
// ============================================================================

class AIEnhancedOrchestrator {
  constructor() {
    this.validator = new QuestionValidator();
    this.claudeAI = new ClaudeAI(CONFIG.claudeApiKey);
    this.fixer = new AIEnhancedFixer(this.claudeAI);
  }

  async run() {
    console.log('🤖 AI-Enhanced Self-Correcting Pipeline\n');
    console.log(`📚 Subject: ${CONFIG.subject}`);
    console.log(`🎯 Processing first ${CONFIG.testLimit} questions with issues`);
    console.log(`🧠 Using Claude AI for intelligent content generation\n`);

    const { data: questions, error } = await supabase
      .from('questions')
      .select('*')
      .eq('subject', CONFIG.subject)
      .limit(100);

    if (error) {
      console.error('❌ Error:', error);
      return;
    }

    console.log(`📥 Fetched ${questions.length} questions\n`);

    const results = [];
    let processedCount = 0;

    for (const question of questions) {
      if (processedCount >= CONFIG.testLimit) break;

      console.log('='.repeat(70));
      console.log(`📝 Processing: ${question.question_id || 'Question ' + (processedCount + 1)}`);
      console.log('='.repeat(70));

      const issues = this.validator.validate(question);

      if (issues.length === 0) {
        console.log('✅ No issues, skipping...\n');
        continue;
      }

      processedCount++;
      console.log(`\n📊 Found ${issues.length} issues\n`);

      const { fixed, fixes } = await this.fixer.fix(question, issues);

      console.log('\n🔍 Re-validating...');
      const afterIssues = this.validator.validate(fixed);

      console.log(`\n📈 Results:`);
      console.log(`   Before: ${issues.length} issues`);
      console.log(`   After:  ${afterIssues.length} issues`);
      console.log(`   Fixed:  ${issues.length - afterIssues.length}\n`);

      if (fixes.length > 0) {
        console.log('💾 Updating database...');
        const { error: updateError } = await supabase
          .from('questions')
          .update({
            question: fixed.question,
            question_html: fixed.question_html,
            option_a: fixed.option_a,
            option_b: fixed.option_b,
            option_c: fixed.option_c,
            option_d: fixed.option_d,
            correct_answer: fixed.correct_answer,
            solution_html: fixed.solution_html,
            difficulty: fixed.difficulty,
            question_type: fixed.question_type,
          })
          .eq('id', question.id);

        if (updateError) {
          console.log('   ❌ Update failed:', updateError.message);
        } else {
          console.log('   ✅ Updated successfully');
        }
      }

      results.push({
        question_id: question.question_id,
        beforeIssues: issues,
        afterIssues: afterIssues,
        fixes: fixes,
        original: question,
        fixed: fixed,
      });

      console.log('\n');

      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    this.generateReport(results);
  }

  generateReport(results) {
    if (!fs.existsSync(CONFIG.outputDir)) {
      fs.mkdirSync(CONFIG.outputDir, { recursive: true });
    }

    const timestamp = Date.now();
    const jsonFile = `${CONFIG.outputDir}/ai_enhanced_${CONFIG.subject}_${timestamp}.json`;

    fs.writeFileSync(jsonFile, JSON.stringify(results, null, 2), 'utf8');

    console.log('='.repeat(70));
    console.log('✅ AI-Enhanced Pipeline Complete');
    console.log('='.repeat(70));
    console.log(`\n📄 Report: ${jsonFile}`);
    console.log(`\n📊 Summary:`);
    console.log(`   Processed: ${results.length}`);
    console.log(`   Issues before: ${results.reduce((s, r) => s + r.beforeIssues.length, 0)}`);
    console.log(`   Issues after: ${results.reduce((s, r) => s + r.afterIssues.length, 0)}`);
    console.log(`   Fixes applied: ${results.reduce((s, r) => s + r.fixes.length, 0)}\n`);
  }
}

async function main() {
  const orchestrator = new AIEnhancedOrchestrator();
  await orchestrator.run();
}

main().catch(console.error);
