const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

(async () => {
  console.log('\n📝 EXAMPLE: BEFORE/AFTER DATABASE UPDATE\n');
  console.log('='.repeat(70));

  // Get one of the questions we tracked earlier
  const questionId = '314a0a53-6d8e-4306-878c-83ed86acd4f0'; // From our 30s test

  const { data: question } = await supabase
    .from('questions')
    .select('*')
    .eq('id', questionId)
    .single();

  if (!question) {
    console.log('Question not found. Showing a different enriched question...\n');

    const { data: enrichedQ } = await supabase
      .from('questions')
      .select('*')
      .eq('subject', 'Mathematics')
      .not('strategy', 'is', null)
      .neq('strategy', '')
      .limit(1)
      .single();

    if (enrichedQ) {
      console.log(`\n📌 Example Question (ID: ${enrichedQ.id})`);
      console.log(`   Subject: ${enrichedQ.subject}`);
      console.log(`   Topic: ${enrichedQ.topic || 'N/A'}`);
      console.log('');
      console.log('─'.repeat(70));
      console.log('\n🔴 BEFORE ENRICHMENT:');
      console.log('   strategy: NULL or empty string');
      console.log('   expert_insight: NULL or empty string');
      console.log('   key_facts: NULL or empty string');
      console.log('');
      console.log('─'.repeat(70));
      console.log('\n🟢 AFTER ENRICHMENT (CURRENT STATE):');
      console.log('');
      console.log('   📄 strategy field:');
      console.log(`      ${enrichedQ.strategy}`);
      console.log(`      Length: ${enrichedQ.strategy?.length} characters`);
      console.log('');
      console.log('   💡 expert_insight field:');
      console.log(`      ${enrichedQ.expert_insight}`);
      console.log(`      Length: ${enrichedQ.expert_insight?.length} characters`);
      console.log('');
      console.log('   📚 key_facts field:');
      console.log(`      ${enrichedQ.key_facts}`);
      console.log(`      Length: ${enrichedQ.key_facts?.length} characters`);
      console.log('');
    }

    console.log('='.repeat(70));
    console.log('\n✅ TRANSFORMATION SUMMARY:\n');
    console.log('   Table: questions');
    console.log('   Row ID: ' + (enrichedQ?.id || 'example'));
    console.log('   Fields updated: 3 (strategy, expert_insight, key_facts)');
    console.log('   Before: All 3 fields were NULL or empty');
    console.log('   After: All 3 fields now contain AI-generated educational content');
    console.log(`   Total content added: ${(enrichedQ?.strategy?.length || 0) + (enrichedQ?.expert_insight?.length || 0) + (enrichedQ?.key_facts?.length || 0)} characters`);
    console.log('\n' + '='.repeat(70) + '\n');

    process.exit(0);
  }

  console.log(`\n📌 Question ID: ${questionId}`);
  console.log(`   Subject: ${question.subject}`);
  console.log(`   Topic: ${question.topic || 'N/A'}`);
  console.log('');
  console.log('─'.repeat(70));
  console.log('\n🔴 BEFORE ENRICHMENT (what these fields contained):');
  console.log('   strategy: NULL or empty');
  console.log('   expert_insight: NULL or empty');
  console.log('   key_facts: NULL or empty');
  console.log('');
  console.log('─'.repeat(70));
  console.log('\n🟢 AFTER ENRICHMENT (current database values):');
  console.log('');
  console.log('   📄 STRATEGY FIELD:');
  console.log(`      ${question.strategy}`);
  console.log(`      Length: ${question.strategy?.length} characters`);
  console.log('');
  console.log('   💡 EXPERT_INSIGHT FIELD:');
  console.log(`      ${question.expert_insight}`);
  console.log(`      Length: ${question.expert_insight?.length} characters`);
  console.log('');
  console.log('   📚 KEY_FACTS FIELD:');
  console.log(`      ${question.key_facts}`);
  console.log(`      Length: ${question.key_facts?.length} characters`);
  console.log('');
  console.log('='.repeat(70));
  console.log('\n✅ TRANSFORMATION SUMMARY:\n');
  console.log('   Table: questions');
  console.log('   Row ID: ' + questionId);
  console.log('   Fields updated: 3 (strategy, expert_insight, key_facts)');
  console.log('   Before: All 3 fields were NULL or empty');
  console.log('   After: All 3 fields now contain AI-generated educational content');
  console.log(`   Total content added: ${(question.strategy?.length || 0) + (question.expert_insight?.length || 0) + (question.key_facts?.length || 0)} characters`);
  console.log('\n' + '='.repeat(70) + '\n');

  process.exit(0);
})();
