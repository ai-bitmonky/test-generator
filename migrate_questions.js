// Migration script to upload questions to Supabase
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function migrateQuestions() {
  console.log('🚀 Starting question migration...\n');

  // Read questions from JSON file
  const questionsPath = path.join(__dirname, 'mcq_questions_with_solutions.json');
  const questionsData = JSON.parse(fs.readFileSync(questionsPath, 'utf-8'));

  console.log(`📚 Found ${questionsData.length} questions to migrate\n`);

  // Transform questions to match database schema
  const questionsToInsert = questionsData.map(q => ({
    external_id: q.id,
    topic: q.topic,
    difficulty: q.difficulty,
    concepts: q.concepts || [],
    question: q.question,
    options: q.options,
    correct_answer: q.correctAnswer,
    solution_html: q.solutionHtml || '',
    solution_text: q.solutionText || ''
  }));

  // Insert questions in batches of 50
  const batchSize = 50;
  let successCount = 0;
  let errorCount = 0;

  for (let i = 0; i < questionsToInsert.length; i += batchSize) {
    const batch = questionsToInsert.slice(i, i + batchSize);

    console.log(`📤 Uploading batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(questionsToInsert.length/batchSize)} (${batch.length} questions)...`);

    const { data, error } = await supabase
      .from('questions')
      .insert(batch)
      .select();

    if (error) {
      console.error(`❌ Error uploading batch: ${error.message}`);
      errorCount += batch.length;
    } else {
      console.log(`✅ Successfully uploaded ${data.length} questions`);
      successCount += data.length;
    }
  }

  console.log('\n📊 Migration Summary:');
  console.log(`✅ Successfully migrated: ${successCount} questions`);
  if (errorCount > 0) {
    console.log(`❌ Failed: ${errorCount} questions`);
  }

  // Fetch and display statistics
  const { data: stats, error: statsError } = await supabase
    .from('question_stats')
    .select('*');

  if (!statsError && stats) {
    console.log('\n📈 Question Statistics:');
    console.log('Topic\t\t\tDifficulty\tCount');
    console.log('─'.repeat(60));
    stats.forEach(s => {
      console.log(`${s.topic.padEnd(24)}\t${s.difficulty.padEnd(8)}\t${s.question_count}`);
    });
  }
}

migrateQuestions().catch(error => {
  console.error('❌ Migration failed:', error);
  process.exit(1);
});
