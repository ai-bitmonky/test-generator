#!/usr/bin/env node
/**
 * Revert the insertion of excluded questions
 * Deletes questions by their external_id
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function revertInsertions() {
  console.log('🔄 Reverting excluded questions insertion...\n');

  // Read the JSON file to get the IDs
  const jsonData = JSON.parse(
    fs.readFileSync('excluded_questions_detailed.json', 'utf8')
  );

  const allQuestions = [
    ...jsonData.mathematics,
    ...jsonData.physics
  ];

  console.log(`📊 Found ${allQuestions.length} questions to delete\n`);

  let deleted = 0;
  let notFound = 0;
  let failed = 0;

  for (let i = 0; i < allQuestions.length; i++) {
    const q = allQuestions[i];
    const num = i + 1;

    console.log(`[${num}/${allQuestions.length}] Deleting ${q.id}...`);

    try {
      const { data, error } = await supabase
        .from('questions')
        .delete()
        .eq('external_id', q.id)
        .select();

      if (error) {
        console.log(`  ❌ Error: ${error.message}`);
        failed++;
      } else if (!data || data.length === 0) {
        console.log(`  ⏭️  Not found (may have been already deleted)`);
        notFound++;
      } else {
        console.log(`  ✅ Deleted`);
        deleted++;
      }

      // Small delay
      await new Promise(resolve => setTimeout(resolve, 50));

    } catch (error) {
      console.log(`  ❌ Exception: ${error.message}`);
      failed++;
    }
  }

  console.log('\n' + '='.repeat(70));
  console.log('📊 REVERT RESULTS');
  console.log('='.repeat(70));
  console.log(`✅ Deleted: ${deleted}`);
  console.log(`⏭️  Not found: ${notFound}`);
  console.log(`❌ Failed: ${failed}`);
  console.log('='.repeat(70));

  return { deleted, notFound, failed };
}

// Main execution
revertInsertions()
  .then(results => {
    console.log('\n✨ Revert complete!');
    process.exit(results.failed > 0 ? 1 : 0);
  })
  .catch(error => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  });
