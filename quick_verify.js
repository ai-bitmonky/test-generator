const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

(async () => {
  console.log('\n🔍 QUICK VERIFICATION TEST (30 seconds)\n');

  // Get initial counts
  const subjects = ['Mathematics', 'Physics'];
  const initial = {};

  for (const subject of subjects) {
    const { data } = await supabase
      .from('questions')
      .select('id')
      .eq('subject', subject)
      .not('strategy', 'is', null)
      .neq('strategy', '')
      .neq('strategy', 'Strategy:');

    initial[subject] = data?.length || 0;
  }

  console.log('📊 Initial counts:');
  console.log(`   Mathematics: ${initial.Mathematics} enriched`);
  console.log(`   Physics: ${initial.Physics} enriched`);
  console.log('\n⏳ Waiting 30 seconds...\n');

  await new Promise(resolve => setTimeout(resolve, 30000));

  // Check again
  let totalChanges = 0;
  for (const subject of subjects) {
    const { data } = await supabase
      .from('questions')
      .select('id')
      .eq('subject', subject)
      .not('strategy', 'is', null)
      .neq('strategy', '')
      .neq('strategy', 'Strategy:');

    const current = data?.length || 0;
    const change = current - initial[subject];
    totalChanges += change;

    if (change > 0) {
      console.log(`✅ ${subject}: ${initial[subject]} → ${current} (+${change} new enrichments)`);
    } else {
      console.log(`   ${subject}: ${current} (no change in 30s window)`);
    }
  }

  console.log('\n' + '='.repeat(60));
  if (totalChanges > 0) {
    console.log('✅ DATABASE IS ACTIVELY BEING ENRICHED!');
    console.log(`   ${totalChanges} questions enriched in just 30 seconds`);
  } else {
    console.log('⚠️  No changes in 30s (pipeline might be between questions)');
    console.log('   Run again or use the 2-minute test for better detection');
  }
  console.log('='.repeat(60) + '\n');

  process.exit(0);
})();
