require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

(async () => {
  console.log('🔧 Applying validation columns migration...\n');

  try {
    // Add validation columns
    const { error: alterError } = await supabase.rpc('exec_sql', {
      sql: `
        ALTER TABLE questions
        ADD COLUMN IF NOT EXISTS validated_at TIMESTAMP WITH TIME ZONE,
        ADD COLUMN IF NOT EXISTS validation_version INTEGER DEFAULT 1,
        ADD COLUMN IF NOT EXISTS validation_notes TEXT;
      `
    });

    if (alterError) {
      // Try direct SQL if RPC not available
      console.log('⚠️  RPC not available, using direct update approach...\n');

      // Check if columns exist by trying to select them
      const { data: testData, error: testError } = await supabase
        .from('questions')
        .select('validated_at, validation_version, validation_notes')
        .limit(1);

      if (testError && testError.message.includes('column')) {
        console.log('❌ Cannot add columns directly via Supabase client.');
        console.log('   Please run the SQL migration manually:');
        console.log('   node -e "require(\'@supabase/supabase-js\').createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY).rpc(\'exec_sql\', {sql: require(\'fs\').readFileSync(\'add_validation_columns.sql\', \'utf8\')})"');
        process.exit(1);
      }

      console.log('✅ Validation columns already exist!');
    } else {
      console.log('✅ Validation columns added successfully!');
    }

    // Verify columns exist
    const { data, error } = await supabase
      .from('questions')
      .select('id, validated_at, validation_version, validation_notes')
      .limit(1);

    if (error) {
      console.log('❌ Error verifying columns:', error.message);
      process.exit(1);
    }

    console.log('\n📊 Migration verification:');
    console.log('   validated_at:', data[0]?.validated_at || 'NULL');
    console.log('   validation_version:', data[0]?.validation_version || 'NULL');
    console.log('   validation_notes:', data[0]?.validation_notes || 'NULL');

    console.log('\n✅ Migration completed successfully!');
    console.log('\n📝 Next steps:');
    console.log('   1. Update database_enrichment_pipeline.js to use validated_at');
    console.log('   2. Run validation on all subjects');
    console.log('   3. Verify second run processes 0 questions');

  } catch (err) {
    console.error('❌ Migration failed:', err);
    process.exit(1);
  }

  process.exit(0);
})();
