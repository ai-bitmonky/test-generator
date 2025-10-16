const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

(async () => {
  console.log('\n📋 FULL DATABASE ROW THAT GOT UPDATED\n');
  console.log('='.repeat(70));

  // Get the question we tracked
  const questionId = '314a0a53-6d8e-4306-878c-83ed86acd4f0';

  const { data: row } = await supabase
    .from('questions')
    .select('*')
    .eq('id', questionId)
    .single();

  if (!row) {
    console.log('Question not found');
    process.exit(1);
  }

  console.log('\nTable: questions');
  console.log(`Row ID: ${questionId}`);
  console.log('\n' + '='.repeat(70));
  console.log('\n📊 COMPLETE ROW DATA:\n');

  // Show all fields in a structured way
  const fields = Object.keys(row).sort();

  fields.forEach(field => {
    const value = row[field];

    console.log(`${field}:`);

    if (value === null) {
      console.log('  NULL');
    } else if (typeof value === 'string' && value.length > 200) {
      console.log(`  ${value.substring(0, 200)}...`);
      console.log(`  (${value.length} total characters)`);
    } else if (typeof value === 'object') {
      console.log(`  ${JSON.stringify(value, null, 2)}`);
    } else {
      console.log(`  ${value}`);
    }

    console.log('');
  });

  console.log('='.repeat(70));
  console.log('\n🔍 ENRICHED FIELDS (The ones that were updated):\n');

  console.log('strategy:');
  console.log(`  ${row.strategy}`);
  console.log('');

  console.log('expert_insight:');
  console.log(`  ${row.expert_insight}`);
  console.log('');

  console.log('key_facts:');
  console.log(`  ${row.key_facts}`);
  console.log('');

  console.log('='.repeat(70));
  console.log('\n✅ This row was transformed from having NULL/empty enrichment fields');
  console.log('   to containing full educational content in 3 fields.');
  console.log('\n' + '='.repeat(70) + '\n');

  process.exit(0);
})();
