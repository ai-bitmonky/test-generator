const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

(async () => {
  console.log('\n🔍 DETAILED FIELD TRACKING TEST (30 seconds)\n');
  console.log('Table: questions');
  console.log('Fields being updated: strategy, expert_insight, key_facts\n');
  console.log('='.repeat(70));

  // Get initial state with detailed field tracking
  const subjects = ['Mathematics', 'Physics'];
  const initialState = {};

  for (const subject of subjects) {
    const { data } = await supabase
      .from('questions')
      .select('id, strategy, expert_insight, key_facts')
      .eq('subject', subject);

    initialState[subject] = {
      total: data?.length || 0,
      withStrategy: data?.filter(q => q.strategy && q.strategy.trim() !== '' && q.strategy !== 'Strategy:').length || 0,
      withExpertInsight: data?.filter(q => q.expert_insight && q.expert_insight.trim() !== '' && q.expert_insight !== 'Expert Insight:').length || 0,
      withKeyFacts: data?.filter(q => q.key_facts && q.key_facts.trim() !== '' && q.key_facts !== 'Key Facts Used:').length || 0,
      fullyEnriched: data?.filter(q =>
        q.strategy && q.strategy.trim() !== '' && q.strategy !== 'Strategy:' &&
        q.expert_insight && q.expert_insight.trim() !== '' && q.expert_insight !== 'Expert Insight:' &&
        q.key_facts && q.key_facts.trim() !== '' && q.key_facts !== 'Key Facts Used:'
      ).length || 0,
      questions: data
    };
  }

  console.log('\n📊 INITIAL STATE:\n');
  for (const subject of subjects) {
    const state = initialState[subject];
    console.log(`${subject} (${state.total} total questions):`);
    console.log(`  ✓ strategy field populated: ${state.withStrategy}`);
    console.log(`  ✓ expert_insight field populated: ${state.withExpertInsight}`);
    console.log(`  ✓ key_facts field populated: ${state.withKeyFacts}`);
    console.log(`  ✓ All 3 fields populated: ${state.fullyEnriched}`);
    console.log('');
  }

  console.log('⏳ Waiting 30 seconds to track changes...\n');
  await new Promise(resolve => setTimeout(resolve, 30000));

  console.log('🔄 Checking for updates...\n');
  console.log('='.repeat(70));

  let totalChanges = 0;
  const changedQuestions = [];

  for (const subject of subjects) {
    const { data } = await supabase
      .from('questions')
      .select('id, strategy, expert_insight, key_facts')
      .eq('subject', subject);

    const currentState = {
      withStrategy: data?.filter(q => q.strategy && q.strategy.trim() !== '' && q.strategy !== 'Strategy:').length || 0,
      withExpertInsight: data?.filter(q => q.expert_insight && q.expert_insight.trim() !== '' && q.expert_insight !== 'Expert Insight:').length || 0,
      withKeyFacts: data?.filter(q => q.key_facts && q.key_facts.trim() !== '' && q.key_facts !== 'Key Facts Used:').length || 0,
      fullyEnriched: data?.filter(q =>
        q.strategy && q.strategy.trim() !== '' && q.strategy !== 'Strategy:' &&
        q.expert_insight && q.expert_insight.trim() !== '' && q.expert_insight !== 'Expert Insight:' &&
        q.key_facts && q.key_facts.trim() !== '' && q.key_facts !== 'Key Facts Used:'
      ).length || 0
    };

    const changes = {
      strategy: currentState.withStrategy - initialState[subject].withStrategy,
      expert_insight: currentState.withExpertInsight - initialState[subject].withExpertInsight,
      key_facts: currentState.withKeyFacts - initialState[subject].withKeyFacts,
      fully_enriched: currentState.fullyEnriched - initialState[subject].fullyEnriched
    };

    // Find specific questions that changed
    const initial = initialState[subject].questions;
    const current = data;

    for (const q of current) {
      const initialQ = initial.find(i => i.id === q.id);
      if (initialQ) {
        const fieldsChanged = [];

        if ((!initialQ.strategy || initialQ.strategy.trim() === '' || initialQ.strategy === 'Strategy:') &&
            q.strategy && q.strategy.trim() !== '' && q.strategy !== 'Strategy:') {
          fieldsChanged.push('strategy');
        }

        if ((!initialQ.expert_insight || initialQ.expert_insight.trim() === '' || initialQ.expert_insight === 'Expert Insight:') &&
            q.expert_insight && q.expert_insight.trim() !== '' && q.expert_insight !== 'Expert Insight:') {
          fieldsChanged.push('expert_insight');
        }

        if ((!initialQ.key_facts || initialQ.key_facts.trim() === '' || initialQ.key_facts === 'Key Facts Used:') &&
            q.key_facts && q.key_facts.trim() !== '' && q.key_facts !== 'Key Facts Used:') {
          fieldsChanged.push('key_facts');
        }

        if (fieldsChanged.length > 0) {
          changedQuestions.push({
            subject,
            id: q.id,
            fields: fieldsChanged
          });
        }
      }
    }

    console.log(`\n📈 ${subject} CHANGES:\n`);
    console.log(`  strategy field: ${initialState[subject].withStrategy} → ${currentState.withStrategy} (${changes.strategy > 0 ? '+' : ''}${changes.strategy})`);
    console.log(`  expert_insight field: ${initialState[subject].withExpertInsight} → ${currentState.withExpertInsight} (${changes.expert_insight > 0 ? '+' : ''}${changes.expert_insight})`);
    console.log(`  key_facts field: ${initialState[subject].withKeyFacts} → ${currentState.withKeyFacts} (${changes.key_facts > 0 ? '+' : ''}${changes.key_facts})`);
    console.log(`  Fully enriched: ${initialState[subject].fullyEnriched} → ${currentState.fullyEnriched} (${changes.fully_enriched > 0 ? '+' : ''}${changes.fully_enriched})`);

    totalChanges += changes.fully_enriched;
  }

  console.log('\n' + '='.repeat(70));
  console.log('\n📝 SPECIFIC QUESTIONS THAT WERE UPDATED:\n');

  if (changedQuestions.length > 0) {
    changedQuestions.forEach((q, idx) => {
      console.log(`${idx + 1}. Question ID: ${q.id}`);
      console.log(`   Subject: ${q.subject}`);
      console.log(`   Table: questions`);
      console.log(`   Fields updated: ${q.fields.join(', ')}`);
      console.log('');
    });

    console.log('✅ DATABASE UPDATE CONFIRMED!');
    console.log(`   Total: ${changedQuestions.length} questions updated`);
    console.log(`   Table: questions`);
    console.log(`   Fields: strategy, expert_insight, key_facts`);
  } else {
    console.log('⚠️  No changes detected in this 30-second window');
    console.log('   (Pipeline may be between questions - try running again)');
  }

  console.log('\n' + '='.repeat(70) + '\n');

  process.exit(0);
})();
