require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

(async () => {
  console.log('🔧 Adding validation columns to questions table...\n');
  console.log('⚠️  MANUAL STEP REQUIRED:\n');
  console.log('Since we cannot run ALTER TABLE via the Supabase JS client,');
  console.log('please run the following SQL in your Supabase Dashboard:\n');
  console.log('Dashboard URL: ' + process.env.NEXT_PUBLIC_SUPABASE_URL.replace('/rest/v1', '') + '/project/_/sql\n');
  console.log('='.repeat(70));
  console.log(`
ALTER TABLE questions
ADD COLUMN IF NOT EXISTS validated_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS validation_version INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS validation_notes TEXT;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_questions_validated
ON questions(subject, validated_at)
WHERE validated_at IS NULL;

-- Add comments
COMMENT ON COLUMN questions.validated_at IS 'Timestamp when question was fully validated and corrected';
COMMENT ON COLUMN questions.validation_version IS 'Version of validation logic used (increment when logic changes)';
COMMENT ON COLUMN questions.validation_notes IS 'Notes about validation issues found and fixed';
  `);
  console.log('='.repeat(70));
  console.log('\nAfter running the SQL, the pipeline will automatically use these columns.');
  console.log('\n✅ The database_enrichment_pipeline.js is already ready to use validated_at!');

  process.exit(0);
})();
