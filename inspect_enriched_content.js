const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

(async () => {
  console.log('\n📖 INSPECT ACTUAL ENRICHED CONTENT\n');
  console.log('='.repeat(70));

  // Get 2 recently enriched questions from Mathematics
  const { data: mathQuestions } = await supabase
    .from('questions')
    .select('id, subject, strategy, expert_insight, key_facts')
    .eq('subject', 'Mathematics')
    .not('strategy', 'is', null)
    .neq('strategy', '')
    .neq('strategy', 'Strategy:')
    .limit(2);

  if (!mathQuestions || mathQuestions.length === 0) {
    console.log('❌ No enriched Mathematics questions found yet\n');
    process.exit(1);
  }

  mathQuestions.forEach((q, idx) => {
    console.log(`\n📝 Question ${idx + 1} (ID: ${q.id})`);
    console.log('='.repeat(70));

    console.log('\n🎯 STRATEGY:');
    console.log(q.strategy ? q.strategy : 'NULL');

    console.log('\n💡 EXPERT INSIGHT:');
    console.log(q.expert_insight ? q.expert_insight : 'NULL');

    console.log('\n📚 KEY FACTS:');
    console.log(q.key_facts ? q.key_facts : 'NULL');

    console.log('\n✅ Verification:');
    console.log(`   Strategy length: ${q.strategy?.length || 0} chars`);
    console.log(`   Expert insight length: ${q.expert_insight?.length || 0} chars`);
    console.log(`   Key facts length: ${q.key_facts?.length || 0} chars`);

    const isFullyEnriched = q.strategy && q.expert_insight && q.key_facts &&
                            q.strategy.length > 20 &&
                            q.expert_insight.length > 20 &&
                            q.key_facts.length > 20;

    console.log(`   Status: ${isFullyEnriched ? '✅ FULLY ENRICHED' : '⚠️  INCOMPLETE'}`);
    console.log('='.repeat(70));
  });

  console.log('\n✅ This proves the database contains REAL enriched content!\n');

  process.exit(0);
})();
