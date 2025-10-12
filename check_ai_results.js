const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function checkResults() {
  const questionIds = [
    'Areas_Integration_1', 'Areas_Integration_2', 'Areas_Integration_3', 'Areas_Integration_4',
    'Combinatorics_153', 'Areas_Integration_5', 'Areas_Integration_6', 'Areas_Integration_7',
    'Areas_Integration_8', 'Algebra_130'
  ];

  console.log('\n📊 AI-GENERATED CONTENT VERIFICATION REPORT\n');
  console.log('='.repeat(100));

  for (const qId of questionIds) {
    const { data, error } = await supabase
      .from('questions')
      .select('id, question, options, correct_answer, difficulty, question_type, strategy, expert_insight, key_facts')
      .eq('id', qId)
      .single();

    if (error) {
      console.log(`\n❌ ${qId}: Error - ${error.message}`);
      continue;
    }

    console.log(`\n${'='.repeat(100)}`);
    console.log(`📝 ${data.id}`);
    console.log(`${'='.repeat(100)}`);

    console.log(`\n📄 Question: ${data.question.substring(0, 150)}...`);

    console.log(`\n🎯 Options:`);
    if (data.options && typeof data.options === 'object') {
      console.log(`   A: ${data.options.a || '[MISSING]'}`);
      console.log(`   B: ${data.options.b || '[MISSING]'}`);
      console.log(`   C: ${data.options.c || '[MISSING]'}`);
      console.log(`   D: ${data.options.d || '[MISSING]'}`);
    } else {
      console.log(`   ❌ No options object found`);
    }

    console.log(`\n✅ Correct Answer: ${data.correct_answer || '[MISSING]'}`);
    console.log(`⚡ Difficulty: ${data.difficulty || '[MISSING]'}`);
    console.log(`🏷️  Question Type: ${data.question_type || '[MISSING]'}`);

    console.log(`\n📚 AI-GENERATED CONTENT:`);
    console.log(`\n🎯 Strategy (${data.strategy ? data.strategy.length : 0} chars):`);
    if (data.strategy && data.strategy !== '[Not Set]') {
      console.log(`   ✅ ${data.strategy.substring(0, 200)}...`);
    } else {
      console.log(`   ❌ NOT GENERATED`);
    }

    console.log(`\n💡 Expert Insight (${data.expert_insight ? data.expert_insight.length : 0} chars):`);
    if (data.expert_insight && data.expert_insight !== '[Not Set]') {
      console.log(`   ✅ ${data.expert_insight.substring(0, 200)}...`);
    } else {
      console.log(`   ❌ NOT GENERATED`);
    }

    console.log(`\n📐 Key Facts (${data.key_facts ? data.key_facts.length : 0} chars):`);
    if (data.key_facts && data.key_facts !== '[Not Set]') {
      console.log(`   ✅ ${data.key_facts.substring(0, 200)}...`);
    } else {
      console.log(`   ❌ NOT GENERATED`);
    }
  }

  console.log('\n' + '='.repeat(100));
  console.log('\n✨ Report Complete\n');
}

checkResults();
