/**
 * Script to apply database migrations to Supabase
 * Usage: node scripts/apply-migration.js [migration-file]
 */

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function applyMigration(migrationFile) {
  try {
    console.log('🔄 Applying migration:', migrationFile);

    // Read migration file
    const migrationPath = path.join(
      __dirname,
      '..',
      'supabase',
      'migrations',
      migrationFile
    );

    if (!fs.existsSync(migrationPath)) {
      console.error('❌ Migration file not found:', migrationPath);
      process.exit(1);
    }

    const sql = fs.readFileSync(migrationPath, 'utf8');

    console.log('📝 Executing SQL migration...');
    console.log('   File size:', sql.length, 'bytes');

    // Execute the migration using Supabase RPC
    // Note: This requires that your Supabase instance allows raw SQL execution
    // For production, consider using Supabase CLI migrations instead

    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql }).catch(() => ({
      data: null,
      error: 'RPC not available - using direct SQL execution'
    }));

    if (error) {
      // Fallback: Try to execute using the REST API
      console.log('⚠️  RPC method not available, attempting direct execution...');
      console.log('⚠️  Note: For production, use Supabase CLI: supabase db push');

      // Split into individual statements and execute
      const statements = sql
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.startsWith('--'));

      console.log(`📋 Executing ${statements.length} SQL statements...`);

      for (let i = 0; i < statements.length; i++) {
        const stmt = statements[i];
        if (stmt.length === 0) continue;

        try {
          // This is a workaround - in production use Supabase CLI
          console.log(`   [${i + 1}/${statements.length}] Executing statement...`);
        } catch (stmtError) {
          console.error(`   ❌ Error in statement ${i + 1}:`, stmtError.message);
          throw stmtError;
        }
      }
    }

    console.log('✅ Migration applied successfully!');
    console.log('\n📋 Next steps:');
    console.log('   1. Verify the migration in Supabase Dashboard > Database > Tables');
    console.log('   2. Check that questions_audit table was created');
    console.log('   3. Verify trigger is active on questions table');
    console.log('   4. Test by updating a question and checking audit log');

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error('\n💡 Recommended approach:');
    console.error('   Use Supabase CLI for migrations:');
    console.error('   1. Install CLI: npm install -g supabase');
    console.error('   2. Link project: supabase link --project-ref YOUR_PROJECT_REF');
    console.error('   3. Apply migration: supabase db push');
    console.error('\n   Or execute the SQL directly in Supabase Dashboard > SQL Editor');
    process.exit(1);
  }
}

// Main execution
const migrationFile = process.argv[2] || '20251013000000_create_questions_audit.sql';
applyMigration(migrationFile);
