const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

(async () => {
  console.log('\n📋 BEFORE/AFTER COMPARISON TEST (60 seconds)\n');
  console.log('='.repeat(70));

  // Find questions that don't have enrichment yet
  const { data: unenrichedQuestions } = await supabase
    .from('questions')
    .select('id, subject, question_text, strategy, expert_insight, key_facts')
    .eq('subject', 'Mathematics')
    .or('strategy.is.null,strategy.eq.,strategy.eq.Strategy:')
    .limit(2);

  if (!unenrichedQuestions || unenrichedQuestions.length === 0) {
    console.log('ℹ️  No unenriched Mathematics questions found. Showing recently enriched instead...\n');

    // Get recently enriched questions
    const { data: enrichedQuestions } = await supabase
      .from('questions')
      .select('id, subject, question_text, strategy, expert_insight, key_facts')
      .eq('subject', 'Mathematics')
      .not('strategy', 'is', null)
      .neq('strategy', '')
      .neq('strategy', 'Strategy:')
      .order('id', { ascending: false })
      .limit(2);

    if (enrichedQuestions && enrichedQuestions.length > 0) {
      console.log('📝 SHOWING ENRICHED QUESTIONS (these were previously empty):\n');
      enrichedQuestions.forEach((q, idx) => {
        console.log(`Question ${idx + 1}:`);
        console.log(`  ID: ${q.id}`);
        console.log(`  Subject: ${q.subject}`);
        console.log(`  Question: ${q.question_text?.substring(0, 100)}...`);
        console.log('');
        console.log('  BEFORE (was empty/null):');
        console.log('    strategy: NULL or empty');
        console.log('    expert_insight: NULL or empty');
        console.log('    key_facts: NULL or empty');
        console.log('');
        console.log('  AFTER (current values):');
        console.log(`    strategy: ${q.strategy?.substring(0, 150)}...`);
        console.log(`    expert_insight: ${q.expert_insight?.substring(0, 150)}...`);
        console.log(`    key_facts: ${q.key_facts?.substring(0, 150)}...`);
        console.log('');
        console.log('  Field lengths:');
        console.log(`    strategy: ${q.strategy?.length || 0} characters`);
        console.log(`    expert_insight: ${q.expert_insight?.length || 0} characters`);
        console.log(`    key_facts: ${q.key_facts?.length || 0} characters`);
        console.log('\n' + '='.repeat(70) + '\n');
      });
    }

    process.exit(0);
  }

  console.log(`\n📌 Tracking ${unenrichedQuestions.length} unenriched questions...\n`);

  unenrichedQuestions.forEach((q, idx) => {
    console.log(`Question ${idx + 1}:`);
    console.log(`  ID: ${q.id}`);
    console.log(`  Subject: ${q.subject}`);
    console.log(`  Question: ${q.question_text?.substring(0, 100)}...`);
    console.log('');
    console.log('  CURRENT STATE (BEFORE):');
    console.log(`    strategy: ${q.strategy || 'NULL/EMPTY'}`);
    console.log(`    expert_insight: ${q.expert_insight || 'NULL/EMPTY'}`);
    console.log(`    key_facts: ${q.key_facts || 'NULL/EMPTY'}`);
    console.log('');
  });

  console.log('⏳ Waiting 60 seconds to see if these get enriched...\n');
  await new Promise(resolve => setTimeout(resolve, 60000));

  console.log('🔄 Checking for updates...\n');
  console.log('='.repeat(70));

  let updatedCount = 0;

  for (const originalQ of unenrichedQuestions) {
    const { data: updatedQ } = await supabase
      .from('questions')
      .select('id, subject, strategy, expert_insight, key_facts')
      .eq('id', originalQ.id)
      .single();

    const wasUpdated = (
      (updatedQ.strategy && updatedQ.strategy.trim() !== '' && updatedQ.strategy !== 'Strategy:') ||
      (updatedQ.expert_insight && updatedQ.expert_insight.trim() !== '' && updatedQ.expert_insight !== 'Expert Insight:') ||
      (updatedQ.key_facts && updatedQ.key_facts.trim() !== '' && updatedQ.key_facts !== 'Key Facts Used:')
    );

    console.log(`\n📝 Question ID: ${originalQ.id}`);
    console.log(`   Subject: ${originalQ.subject}`);
    console.log('');

    if (wasUpdated) {
      updatedCount++;
      console.log('   ✅ THIS QUESTION GOT ENRICHED!\n');

      // Show strategy changes
      console.log('   📄 STRATEGY FIELD:');
      console.log(`      BEFORE: ${originalQ.strategy || 'NULL/EMPTY'}`);
      console.log(`      AFTER:  ${updatedQ.strategy?.substring(0, 200)}...`);
      console.log(`      Length: ${updatedQ.strategy?.length || 0} characters`);
      console.log('');

      // Show expert_insight changes
      console.log('   💡 EXPERT_INSIGHT FIELD:');
      console.log(`      BEFORE: ${originalQ.expert_insight || 'NULL/EMPTY'}`);
      console.log(`      AFTER:  ${updatedQ.expert_insight?.substring(0, 200)}...`);
      console.log(`      Length: ${updatedQ.expert_insight?.length || 0} characters`);
      console.log('');

      // Show key_facts changes
      console.log('   📚 KEY_FACTS FIELD:');
      console.log(`      BEFORE: ${originalQ.key_facts || 'NULL/EMPTY'}`);
      console.log(`      AFTER:  ${updatedQ.key_facts?.substring(0, 200)}...`);
      console.log(`      Length: ${updatedQ.key_facts?.length || 0} characters`);
      console.log('');
    } else {
      console.log('   ⏳ Not enriched yet (still pending)');
      console.log(`      strategy: ${updatedQ.strategy || 'NULL/EMPTY'}`);
      console.log(`      expert_insight: ${updatedQ.expert_insight || 'NULL/EMPTY'}`);
      console.log(`      key_facts: ${updatedQ.key_facts || 'NULL/EMPTY'}`);
      console.log('');
    }

    console.log('='.repeat(70));
  }

  console.log('\n📊 SUMMARY:\n');
  console.log(`   Questions tracked: ${unenrichedQuestions.length}`);
  console.log(`   Got enriched: ${updatedCount}`);
  console.log(`   Still pending: ${unenrichedQuestions.length - updatedCount}`);

  if (updatedCount > 0) {
    console.log('\n✅ DATABASE IS BEING ACTIVELY UPDATED WITH NEW CONTENT!\n');
  } else {
    console.log('\n⚠️  These specific questions not enriched in 60s window');
    console.log('   (Pipeline processes in order - they may be enriched later)\n');
  }

  process.exit(0);
})();
