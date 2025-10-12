const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function testFormattingFixes() {
  console.log('Testing formatting fix agents on specific issues...\n');
  
  // Test the updated pipeline on the Physics questions with known issues
  const testQuestions = [
    '0f61fe76-a8bb-46cc-8cce-42b3491a3652', // HTML in options
    '79584adb-bf27-4713-a5a5-61000314fd9d', // Combined words
    'fc2697fb-5a43-4615-ad68-f901f70005b1'  // Figure warning
  ];
  
  for (const id of testQuestions) {
    const { data: q } = await supabase
      .from('questions')
      .select('*')
      .eq('id', id)
      .single();
      
    console.log('='.repeat(70));
    console.log(`Question ID: ${id.substring(0, 8)}...`);
    console.log('='.repeat(70));
    console.log('\nBEFORE:');
    if (q.options) console.log('Options:', JSON.stringify(q.options).substring(0, 200));
    if (q.question) console.log('Question preview:', q.question.substring(0, 200));
    console.log('\n');
  }
  
  console.log('\n✅ Run the pipeline now to see these get fixed!\n');
  console.log('Command: node ai_pipeline_fixed.js Physics\n');
}

testFormattingFixes().catch(console.error);
