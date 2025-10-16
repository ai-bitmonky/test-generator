const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

(async () => {
  console.log('🔍 Database Update Test\n');

  // Step 1: Fetch a Mathematics question
  const { data: questions } = await supabase
    .from('questions')
    .select('id, subject, strategy, expert_insight, key_facts')
    .eq('subject', 'Mathematics')
    .limit(1);

  if (!questions || questions.length === 0) {
    console.log('❌ No Mathematics questions found');
    process.exit(1);
  }

  const testQuestion = questions[0];
  console.log('📌 Test Question:');
  console.log(`   ID: ${testQuestion.id}`);
  console.log(`   Current strategy: ${testQuestion.strategy || 'NULL'}`);
  console.log(`   Current insight: ${testQuestion.expert_insight || 'NULL'}`);
  console.log(`   Current facts: ${testQuestion.key_facts || 'NULL'}\n`);

  // Step 2: Try to update it
  console.log('🔄 Attempting update...\n');

  const testData = {
    strategy: 'TEST STRATEGY - This is a test update',
    expert_insight: 'TEST INSIGHT - This is a test update',
    key_facts: 'TEST FACTS - This is a test update'
  };

  const { data: updateResult, error: updateError } = await supabase
    .from('questions')
    .update(testData)
    .eq('id', testQuestion.id)
    .select();

  if (updateError) {
    console.log('❌ Update failed:', updateError.message);
    process.exit(1);
  }

  console.log('✅ Update successful!');
  console.log(`   Rows affected: ${updateResult ? updateResult.length : 0}\n`);

  // Step 3: Verify the update
  const { data: verifyData } = await supabase
    .from('questions')
    .select('strategy, expert_insight, key_facts')
    .eq('id', testQuestion.id)
    .single();

  console.log('🔍 Verification:');
  console.log(`   Strategy: ${verifyData.strategy}`);
  console.log(`   Insight: ${verifyData.expert_insight}`);
  console.log(`   Facts: ${verifyData.key_facts}\n`);

  if (verifyData.strategy === testData.strategy) {
    console.log('✅ DATABASE UPDATE IS WORKING CORRECTLY!\n');
  } else {
    console.log('❌ DATABASE UPDATE FAILED - Data not persisted\n');
  }

  // Step 4: Rollback (clean up test data)
  await supabase
    .from('questions')
    .update({
      strategy: testQuestion.strategy,
      expert_insight: testQuestion.expert_insight,
      key_facts: testQuestion.key_facts
    })
    .eq('id', testQuestion.id);

  console.log('🔄 Test data rolled back');

  process.exit(0);
})();
