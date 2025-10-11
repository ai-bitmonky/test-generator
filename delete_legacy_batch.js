#!/usr/bin/env node
/**
 * Delete legacy Mathematics questions in batches
 * Deletes questions one by one to ensure they're actually removed
 */

const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function deleteLegacyBatch() {
  console.log('🧹 Deleting legacy Mathematics questions in batches...\n');

  let totalDeleted = 0;
  let batchNumber = 1;
  const batchSize = 50;

  while (true) {
    // Get a batch of legacy questions
    const { data: legacyBatch, error: queryError } = await supabase
      .from('questions')
      .select('id, external_id')
      .eq('subject', 'Mathematics')
      .is('chapter', null)
      .limit(batchSize);

    if (queryError) {
      console.error('❌ Error querying questions:', queryError.message);
      break;
    }

    if (!legacyBatch || legacyBatch.length === 0) {
      console.log('\n✅ No more legacy questions to delete!');
      break;
    }

    console.log(`📦 Batch ${batchNumber}: Deleting ${legacyBatch.length} questions...`);

    // Delete each question in this batch
    let successCount = 0;
    let errorCount = 0;

    for (const question of legacyBatch) {
      const { error: deleteError } = await supabase
        .from('questions')
        .delete()
        .eq('id', question.id);

      if (deleteError) {
        console.error(`   ❌ Failed to delete ${question.external_id}:`, deleteError.message);
        errorCount++;
      } else {
        successCount++;
      }
    }

    totalDeleted += successCount;
    console.log(`   ✅ Successfully deleted: ${successCount}, Failed: ${errorCount}`);

    batchNumber++;

    // Small delay between batches
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  console.log('\n' + '='.repeat(70));
  console.log(`✅ Deletion Complete: ${totalDeleted} questions removed`);
  console.log('='.repeat(70));

  // Final verification
  console.log('\n🔍 Final verification...');
  const { data: remaining, error } = await supabase
    .from('questions')
    .select('id')
    .eq('subject', 'Mathematics')
    .is('chapter', null);

  if (!error) {
    console.log(`   Remaining NULL chapter questions: ${remaining.length}`);
  }

  const { data: allMath, error: e2 } = await supabase
    .from('questions')
    .select('subject');

  if (!e2) {
    const counts = {};
    allMath.forEach(q => {
      counts[q.subject] = (counts[q.subject] || 0) + 1;
    });
    console.log('\n📚 Final Question Counts:');
    Object.entries(counts).forEach(([subject, count]) => {
      console.log(`   • ${subject}: ${count} questions`);
    });
  }
}

deleteLegacyBatch().catch(error => {
  console.error('❌ Deletion failed:', error);
  process.exit(1);
});
