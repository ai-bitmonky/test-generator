const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

(async () => {
  console.log('📊 Current Database Enrichment Status:\n');

  const subjects = ['Mathematics', 'Physics', 'Chemistry'];

  for (const subject of subjects) {
    const { data, error } = await supabase
      .from('questions')
      .select('id, strategy, expert_insight, key_facts')
      .eq('subject', subject);

    if (error) {
      console.log(`${subject}: ERROR - ${error.message}\n`);
      continue;
    }

    const total = data?.length || 0;
    const enriched = data?.filter(q =>
      q.strategy && q.strategy.trim() !== '' && q.strategy !== 'Strategy:' &&
      q.expert_insight && q.expert_insight.trim() !== '' && q.expert_insight !== 'Expert Insight:' &&
      q.key_facts && q.key_facts.trim() !== '' && q.key_facts !== 'Key Facts Used:'
    ).length || 0;

    console.log(`${subject}:`);
    console.log(`  Total: ${total}`);
    console.log(`  Fully enriched: ${enriched} (${((enriched/total)*100).toFixed(1)}%)`);
    console.log(`  Need enrichment: ${total - enriched}\n`);
  }

  process.exit(0);
})();
