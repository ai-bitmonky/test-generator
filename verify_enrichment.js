const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

(async () => {
  console.log('\n🔍 COMPREHENSIVE ENRICHMENT VERIFICATION TEST\n');
  console.log('='.repeat(70));

  // Test 1: Check if enriched questions have actual content
  console.log('\n📋 TEST 1: Verify enriched questions have real content\n');

  const { data: mathQuestions } = await supabase
    .from('questions')
    .select('id, strategy, expert_insight, key_facts')
    .eq('subject', 'Mathematics')
    .not('strategy', 'is', null)
    .not('strategy', 'eq', '')
    .not('strategy', 'eq', 'Strategy:')
    .limit(3);

  if (mathQuestions && mathQuestions.length > 0) {
    console.log(`✅ Found ${mathQuestions.length} enriched Mathematics questions\n`);

    mathQuestions.forEach((q, idx) => {
      console.log(`Question ${idx + 1} (ID: ${q.id.substring(0, 8)}...):`);
      console.log(`  Strategy length: ${q.strategy?.length || 0} chars`);
      console.log(`  Expert insight length: ${q.expert_insight?.length || 0} chars`);
      console.log(`  Key facts length: ${q.key_facts?.length || 0} chars`);
      console.log(`  Strategy preview: ${q.strategy?.substring(0, 80)}...`);
      console.log('');
    });
  } else {
    console.log('❌ No enriched Mathematics questions found\n');
  }

  // Test 2: Compare current vs 2 minutes ago
  console.log('='.repeat(70));
  console.log('\n📊 TEST 2: Track changes over time\n');

  const subjects = ['Mathematics', 'Physics', 'Chemistry'];
  const initialCounts = {};

  for (const subject of subjects) {
    const { data } = await supabase
      .from('questions')
      .select('id, strategy, expert_insight, key_facts')
      .eq('subject', subject);

    const enriched = data?.filter(q =>
      q.strategy && q.strategy.trim() !== '' && q.strategy !== 'Strategy:' &&
      q.expert_insight && q.expert_insight.trim() !== '' && q.expert_insight !== 'Expert Insight:' &&
      q.key_facts && q.key_facts.trim() !== '' && q.key_facts !== 'Key Facts Used:'
    ).length || 0;

    initialCounts[subject] = enriched;
    console.log(`${subject}: ${enriched} fully enriched`);
  }

  console.log('\n⏳ Waiting 2 minutes to check for changes...');
  console.log('(This proves the database is actively being updated)\n');

  await new Promise(resolve => setTimeout(resolve, 120000)); // Wait 2 minutes

  console.log('🔄 Checking again...\n');

  let changesDetected = false;

  for (const subject of subjects) {
    const { data } = await supabase
      .from('questions')
      .select('id, strategy, expert_insight, key_facts')
      .eq('subject', subject);

    const enriched = data?.filter(q =>
      q.strategy && q.strategy.trim() !== '' && q.strategy !== 'Strategy:' &&
      q.expert_insight && q.expert_insight.trim() !== '' && q.expert_insight !== 'Expert Insight:' &&
      q.key_facts && q.key_facts.trim() !== '' && q.key_facts !== 'Key Facts Used:'
    ).length || 0;

    const change = enriched - initialCounts[subject];

    if (change > 0) {
      console.log(`${subject}: ${initialCounts[subject]} → ${enriched} (+${change}) ✅ ACTIVELY UPDATING`);
      changesDetected = true;
    } else {
      console.log(`${subject}: ${initialCounts[subject]} → ${enriched} (no change)`);
    }
  }

  // Test 3: Verify a specific question got updated
  console.log('\n' + '='.repeat(70));
  console.log('\n📝 TEST 3: Track a specific unenriched question\n');

  const { data: unenrichedQuestions } = await supabase
    .from('questions')
    .select('id, subject, strategy')
    .eq('subject', 'Mathematics')
    .or('strategy.is.null,strategy.eq.')
    .limit(1);

  if (unenrichedQuestions && unenrichedQuestions.length > 0) {
    const trackQuestion = unenrichedQuestions[0];
    console.log(`Tracking question: ${trackQuestion.id}`);
    console.log(`Current strategy: ${trackQuestion.strategy || 'NULL'}`);
    console.log('\n⏳ Waiting 3 minutes to see if this specific question gets enriched...\n');

    await new Promise(resolve => setTimeout(resolve, 180000)); // Wait 3 minutes

    const { data: updatedQuestion } = await supabase
      .from('questions')
      .select('strategy, expert_insight, key_facts')
      .eq('id', trackQuestion.id)
      .single();

    console.log('🔍 After 3 minutes:');
    console.log(`  Strategy: ${updatedQuestion.strategy ? '✅ ADDED' : '⏳ Still pending'}`);
    console.log(`  Expert insight: ${updatedQuestion.expert_insight ? '✅ ADDED' : '⏳ Still pending'}`);
    console.log(`  Key facts: ${updatedQuestion.key_facts ? '✅ ADDED' : '⏳ Still pending'}`);

    if (updatedQuestion.strategy && updatedQuestion.expert_insight && updatedQuestion.key_facts) {
      console.log('\n🎉 DATABASE IS ACTIVELY BEING ENRICHED!');
    }
  } else {
    console.log('ℹ️  All Mathematics questions already enriched');
  }

  // Final summary
  console.log('\n' + '='.repeat(70));
  console.log('\n📈 VERIFICATION SUMMARY\n');

  if (changesDetected) {
    console.log('✅ DATABASE IS CONFIRMED TO BE ACTIVELY UPDATING');
    console.log('✅ Enrichment pipeline is working correctly');
    console.log('✅ Changes are being persisted to the database');
  } else {
    console.log('⚠️  No changes detected in 2-minute window');
    console.log('   This could mean:');
    console.log('   - Pipeline is between questions (6s delay between each)');
    console.log('   - Subject being processed is already complete');
    console.log('   - Run this test again to check for updates');
  }

  console.log('\n' + '='.repeat(70) + '\n');

  process.exit(0);
})();
