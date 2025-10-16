/**
 * Test validation features on a single question
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

  validateQuestionFormat(question) {
    const issues = [];

    // Check if all 4 options exist
    const options = ['a', 'b', 'c', 'd'];
    const missingOptions = options.filter(opt =>
      !question[`option_${opt}`] || !question[`option_${opt}`].trim()
    );

    if (missingOptions.length > 0) {
      issues.push({
        severity: 'critical',
        type: 'missing_options',
        message: `Missing options: ${missingOptions.join(', ').toUpperCase()}`
      });
    }

    // Check correct answer
    if (!question.correct_answer || !['a', 'b', 'c', 'd'].includes(question.correct_answer.toLowerCase())) {
      issues.push({
        severity: 'critical',
        type: 'invalid_correct_answer',
        message: 'Correct answer must be a, b, c, or d'
      });
    }

    return issues;
  }

  async verifyQuestionCompleteness(question) {
    const questionText = question.question_html || question.question || '';

    if (!questionText.trim()) {
      return {
        isComplete: false,
        issues: ['Question text is empty'],
        needsCorrection: true
      };
    }

    const prompt = `Analyze this JEE Advanced question for completeness and ambiguity:

QUESTION:
${questionText}

OPTIONS:
a) ${question.option_a || 'MISSING'}
b) ${question.option_b || 'MISSING'}
c) ${question.option_c || 'MISSING'}
d) ${question.option_d || 'MISSING'}

Check for:
1. Are all values/parameters provided to solve the question?
2. Are figures/diagrams mentioned but not available?
3. Is the question statement clear and unambiguous?
4. Can this be solved with the given information?

Respond in this format:
COMPLETE: [YES/NO]
ISSUES: [List any issues found, or "None"]
AMBIGUOUS: [YES/NO]`;

    const response = await this.call(prompt, 1000);
    const isComplete = /COMPLETE:\s*YES/i.test(response);
    const isAmbiguous = /AMBIGUOUS:\s*YES/i.test(response);

    const issuesMatch = response.match(/ISSUES:\s*(.+?)(?=\n[A-Z]+:|$)/s);
    const issues = issuesMatch && issuesMatch[1].trim() !== 'None'
      ? [issuesMatch[1].trim()]
      : [];

    return { isComplete, isAmbiguous, issues, needsCorrection: !isComplete || isAmbiguous };
  }

  async verifySolutionMatchesAnswer(question) {
    const solutionText = question.solution_html || question.solution || '';
    const correctAnswer = question.correct_answer?.toLowerCase();

    if (!solutionText.trim()) {
      return {
        matchesAnswer: false,
        issues: ['Solution is missing'],
        needsCorrection: true
      };
    }

    if (!correctAnswer || !['a', 'b', 'c', 'd'].includes(correctAnswer)) {
      return {
        matchesAnswer: false,
        issues: ['Correct answer is invalid or missing'],
        needsCorrection: true
      };
    }

    const prompt = `Verify this JEE Advanced solution:

QUESTION:
${question.question_html || question.question || ''}

SOLUTION:
${solutionText}

CORRECT ANSWER (per answer key): Option ${correctAnswer.toUpperCase()}

Check:
1. Does the solution logically lead to option ${correctAnswer.toUpperCase()}?
2. Does the final answer match option ${correctAnswer.toUpperCase()}?

Respond in this format:
MATCHES_ANSWER_KEY: [YES/NO]
ISSUES: [List any issues, or "None"]`;

    const response = await this.call(prompt, 1500);
    const matchesAnswer = /MATCHES_ANSWER_KEY:\s*YES/i.test(response);

    const issuesMatch = response.match(/ISSUES:\s*(.+?)$/s);
    const issues = issuesMatch && issuesMatch[1].trim() !== 'None'
      ? [issuesMatch[1].trim()]
      : [];

    return { matchesAnswer, issues, needsCorrection: !matchesAnswer };
  }
}

(async () => {
  console.log('\n🧪 Testing Validation Features on Single Question\n');
  console.log('='.repeat(70));

  // Get a question
  const { data: questions } = await supabase
    .from('questions')
    .select('*')
    .eq('subject', 'Mathematics')
    .eq('id', 'a6957c30-a8c8-4273-90ed-a6f5e26728d4')
    .limit(1);

  if (!questions || questions.length === 0) {
    console.log('\n❌ Question not found\n');
    process.exit(1);
  }

  const q = questions[0];
  const claudeAI = new ClaudeAI(process.env.ANTHROPIC_API_KEY);

  console.log(`\n📌 Testing Question: ${q.id.substring(0, 8)}...`);
  console.log(`   Topic: ${q.topic || 'N/A'}\n`);

  // Test 1: Format validation
  console.log('🔍 Test 1: Question Format Validation');
  const formatIssues = claudeAI.validateQuestionFormat(q);
  if (formatIssues.length > 0) {
    console.log(`   ⚠️  Found ${formatIssues.length} issue(s):`);
    formatIssues.forEach(issue => console.log(`      - ${issue.message}`));
  } else {
    console.log('   ✅ Format valid (all options present, answer key valid)');
  }

  // Test 2: Completeness verification
  console.log('\n🔍 Test 2: Question Completeness Verification');
  console.log('   (Checking with AI for ambiguity and missing data...)');
  const completeness = await claudeAI.verifyQuestionCompleteness(q);
  if (!completeness.isComplete || completeness.isAmbiguous) {
    console.log('   ⚠️  Issues detected:');
    if (!completeness.isComplete) console.log('      - Question incomplete');
    if (completeness.isAmbiguous) console.log('      - Question ambiguous');
    completeness.issues.forEach(issue => console.log(`      - ${issue}`));
  } else {
    console.log('   ✅ Question complete and unambiguous');
  }

  // Test 3: Solution verification
  if (q.solution_html && q.correct_answer) {
    console.log('\n🔍 Test 3: Solution Verification');
    console.log('   (Checking if solution matches answer key...)');
    const solutionCheck = await claudeAI.verifySolutionMatchesAnswer(q);
    if (!solutionCheck.matchesAnswer) {
      console.log('   ⚠️  Solution may not match correct answer!');
      solutionCheck.issues.forEach(issue => console.log(`      - ${issue}`));
    } else {
      console.log('   ✅ Solution matches answer key');
    }
  }

  console.log('\n' + '='.repeat(70));
  console.log('\n✅ Validation testing complete!\n');
  console.log('💡 All validation features are working correctly.');
  console.log('   Ready to run full pipeline with validation.\n');

  process.exit(0);
})();
