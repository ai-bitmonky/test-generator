/**
 * Apply exam_level migration to the database
 */

const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

// Initialize Supabase
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function applyMigration() {
  console.log('🔄 Applying exam_level migration...\n');

  const migrationPath = '../supabase/migrations/20251013000001_add_exam_level.sql';
  const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

  console.log('📝 Migration SQL:');
  console.log(migrationSQL);
  console.log('\n' + '='.repeat(70) + '\n');

  try {
    // Execute the migration
    console.log('⚡ Executing migration...');

    // Note: Supabase client doesn't support raw SQL execution directly
    // You need to run this SQL in Supabase Dashboard SQL Editor
    console.log('\n⚠️  IMPORTANT:');
    console.log('   The Supabase JS client does not support raw SQL execution.');
    console.log('   Please run the SQL above in one of these ways:\n');
    console.log('   Option 1: Supabase Dashboard');
    console.log('   - Go to: https://supabase.com/dashboard/project/<your-project>/sql');
    console.log('   - Copy the SQL from: supabase/migrations/20251013000001_add_exam_level.sql');
    console.log('   - Paste and execute\n');
    console.log('   Option 2: Supabase CLI');
    console.log('   - Run: supabase db push\n');
    console.log('   Option 3: Manual SQL');
    console.log('   - Run the following command:');
    console.log('   ALTER TABLE questions ADD COLUMN IF NOT EXISTS exam_level TEXT CHECK (exam_level IN (\'JEE Mains\', \'JEE Advanced\', NULL));');
    console.log('   CREATE INDEX IF NOT EXISTS idx_questions_exam_level ON questions(exam_level);\n');

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  }
}

applyMigration();
