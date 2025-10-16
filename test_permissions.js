const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

(async () => {
  console.log('🔍 Testing Supabase Permissions\n');

  // Step 1: Test READ permission
  const { data: readData, error: readError } = await supabase
    .from('questions')
    .select('id, strategy')
    .eq('subject', 'Mathematics')
    .limit(1);

  if (readError) {
    console.log('❌ READ FAILED:', readError.message);
    process.exit(1);
  }

  console.log('✅ READ works - found', readData.length, 'rows');

  if (readData.length === 0) {
    console.log('❌ No Mathematics questions found');
    process.exit(1);
  }

  const testId = readData[0].id;
  const originalStrategy = readData[0].strategy;

  console.log('📌 Test row ID:', testId);
  console.log('📌 Original strategy:', originalStrategy || 'NULL');

  // Step 2: Test UPDATE permission
  console.log('\n🔄 Testing UPDATE...');

  const { data: updateData, error: updateError } = await supabase
    .from('questions')
    .update({ strategy: 'PERMISSION TEST' })
    .eq('id', testId)
    .select();

  console.log('\nUpdate result:');
  console.log('  Error:', updateError?.message || 'None');
  console.log('  Returned rows:', updateData?.length || 0);
  console.log('  Data:', JSON.stringify(updateData, null, 2));

  if (!updateError && (!updateData || updateData.length === 0)) {
    console.log('\n⚠️  UPDATE PERMISSION ISSUE DETECTED');
    console.log('   No error thrown, but 0 rows affected');
    console.log('   This indicates RLS policy is blocking updates');
  }

  // Step 3: Verify if update actually worked
  console.log('\n🔍 Verifying...');
  const { data: verifyData } = await supabase
    .from('questions')
    .select('strategy')
    .eq('id', testId)
    .single();

  console.log('  Current value:', verifyData?.strategy || 'NULL');

  if (verifyData?.strategy === 'PERMISSION TEST') {
    console.log('\n✅ UPDATE WORKS!');

    // Rollback
    await supabase
      .from('questions')
      .update({ strategy: originalStrategy })
      .eq('id', testId);

    console.log('🔄 Rolled back test change');
  } else {
    console.log('\n❌ UPDATE BLOCKED BY RLS POLICY');
    console.log('\n💡 Solution: The NEXT_PUBLIC_SUPABASE_ANON_KEY has read-only access');
    console.log('   You need to use SUPABASE_SERVICE_ROLE_KEY for updates');
  }

  process.exit(0);
})();
