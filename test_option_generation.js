/**
 * Test option generation on a single question
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

class ClaudeAI {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.baseURL = 'https://api.anthropic.com/v1/messages';
  }

  async call(prompt, maxTokens = 2000) {
    const response = await fetch(this.baseURL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: maxTokens,
        messages: [{ role: 'user', content: prompt }]
      })
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.content[0].text;
  }

  async generateOptions(question) {
    const questionText = question.question_html || question.question || '';
    const solutionText = question.solution_html || question.solution || '';
    const correctAnswer = question.correct_answer?.toLowerCase() || 'a';

    const prompt = `You are an expert in creating JEE Advanced multiple choice questions. Generate 4 options for this question.

QUESTION:
${questionText}

SOLUTION:
${solutionText}

CORRECT ANSWER SHOULD BE: Option ${correctAnswer.toUpperCase()}

INSTRUCTIONS:
1. Analyze the solution to determine the EXACT correct answer
2. Generate option ${correctAnswer.toUpperCase()} as the correct answer matching the solution
3. Generate 3 other plausible but INCORRECT distractors
4. Distractors should represent common mistakes students make
5. All options should be in the same format (same units, same precision)

RESPOND IN THIS EXACT JSON FORMAT:
{
  "option_a": "first option text here",
  "option_b": "second option text here",
  "option_c": "third option text here",
  "option_d": "fourth option text here",
  "reasoning": "Brief explanation"
}

IMPORTANT: Provide ONLY the JSON, no other text`;

    const response = await this.call(prompt, 2000);
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Could not parse JSON from response');
    }

    return JSON.parse(jsonMatch[0]);
  }
}

(async () => {
  console.log('\n🧪 Testing Option Generation on Single Question\n');
  console.log('='.repeat(70));

  // Get a question with missing options
  const { data: questions } = await supabase
    .from('questions')
    .select('*')
    .eq('subject', 'Mathematics')
    .is('option_a', null)
    .limit(1);

  if (!questions || questions.length === 0) {
    console.log('\n❌ No questions with missing options found\n');
    process.exit(1);
  }

  const q = questions[0];
  const claudeAI = new ClaudeAI(process.env.ANTHROPIC_API_KEY);

  console.log(`\n📌 Testing Question: ${q.id.substring(0, 8)}...`);
  console.log(`   Topic: ${q.topic || 'N/A'}`);
  console.log(`   Correct Answer: ${q.correct_answer?.toUpperCase() || 'NOT SET'}`);
  console.log(`\n📖 Question: ${(q.question_html || q.question || '').substring(0, 200)}...`);

  console.log('\n🎯 Generating 4 options using Claude AI...\n');

  try {
    const options = await claudeAI.generateOptions(q);

    console.log('✅ Options Generated Successfully!\n');
    console.log('=' .repeat(70));
    console.log(`\nOption A: ${options.option_a}`);
    console.log(`\nOption B: ${options.option_b}`);
    console.log(`\nOption C: ${options.option_c}`);
    console.log(`\nOption D: ${options.option_d}`);
    console.log('\n' + '='.repeat(70));
    console.log(`\n💡 Reasoning:\n${options.reasoning}\n`);
    console.log('=' + '='.repeat(70));

    console.log('\n✨ Option generation working correctly!');
    console.log('\n💡 To run on all questions: node generate_missing_options.js Mathematics\n');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }

  process.exit(0);
})();
