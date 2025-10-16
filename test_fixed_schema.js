/**
 * Test option generation with corrected database schema
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
        model: 'claude-3-haiku-20240307',
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
${questionText.substring(0, 500)}

SOLUTION:
${solutionText.substring(0, 500)}

CORRECT ANSWER SHOULD BE: Option ${correctAnswer.toUpperCase()}

RESPOND IN THIS EXACT JSON FORMAT:
{
  "a": "first option",
  "b": "second option",
  "c": "third option",
  "d": "fourth option"
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
  console.log('\n🧪 Testing Fixed Option Generation with Correct Schema\n');
  console.log('='.repeat(70));

  // Get a question WITHOUT options
  const { data: questions } = await supabase
    .from('questions')
    .select('*')
    .eq('subject', 'Mathematics')
    .is('options', null)
    .limit(1);

  if (!questions || questions.length === 0) {
    console.log('\n❌ No questions with NULL options found\n');
    process.exit(1);
  }

  const q = questions[0];
  const claudeAI = new ClaudeAI(process.env.ANTHROPIC_API_KEY);

  console.log(`\n📌 Testing Question: ${q.id.substring(0, 8)}...`);
  console.log(`   Topic: ${q.topic || 'N/A'}`);
  console.log(`   Correct Answer: ${q.correct_answer?.toUpperCase() || 'NOT SET'}`);
  console.log(`   Current options field: ${q.options}`);

  console.log('\n🤖 Generating options using AI...\n');

  try {
    const options = await claudeAI.generateOptions(q);

    console.log('✅ Generated Options:');
    console.log(`   a: ${options.a}`);
    console.log(`   b: ${options.b}`);
    console.log(`   c: ${options.c}`);
    console.log(`   d: ${options.d}`);

    console.log('\n💾 Saving to database using correct schema...');
    const { data: updateData, error: updateError } = await supabase
      .from('questions')
      .update({
        options: {
          a: options.a,
          b: options.b,
          c: options.c,
          d: options.d
        }
      })
      .eq('id', q.id)
      .select();

    if (updateError) {
      console.log(`\n❌ Update failed: ${updateError.message}\n`);
      process.exit(1);
    }

    console.log('\n✅ SUCCESS! Options saved to database\n');
    console.log('Updated record:');
    console.log(updateData[0].options);
    console.log('\n' + '='.repeat(70));
    console.log('\n✨ Fixed schema works! Ready to run full pipeline.\n');
    console.log('💡 To generate options for all questions:');
    console.log('   node generate_missing_options_fixed.js Mathematics\n');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }

  process.exit(0);
})();
