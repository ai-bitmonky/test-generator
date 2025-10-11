#!/usr/bin/env node
/**
 * Replace Mathematics Questions
 * 1. Delete all existing Mathematics questions
 * 2. Insert new complete mathematics questions
 */

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

async function replaceMathQuestions() {
  console.log('🔄 Starting Mathematics question replacement...\n');

  // Step 1: Count existing math questions
  console.log('📊 Checking existing mathematics questions...');
  const { data: existingMath, error: countError } = await supabase
    .from('questions')
    .select('id, external_id', { count: 'exact' })
    .eq('subject', 'Mathematics');

  if (countError) {
    console.error('❌ Error counting math questions:', countError.message);
    process.exit(1);
  }

  console.log(`Found ${existingMath.length} existing mathematics questions\n`);

  // Step 2: Delete existing math questions
  console.log('🗑️  Deleting existing mathematics questions...');
  const { error: deleteError } = await supabase
    .from('questions')
    .delete()
    .eq('subject', 'Mathematics');

  if (deleteError) {
    console.error('❌ Error deleting questions:', deleteError.message);
    process.exit(1);
  }

  console.log(`✅ Deleted ${existingMath.length} mathematics questions\n`);

  // Step 3: Load new math questions
  console.log('📚 Loading new mathematics questions...');
  const questionsPath = path.join(__dirname, 'complete_math_questions.json');
  const questionsData = JSON.parse(fs.readFileSync(questionsPath, 'utf-8'));

  console.log(`Found ${questionsData.length} new mathematics questions\n`);

  // Step 4: Transform questions to match database schema
  // Filter out questions without correct_answer (required field)
  const questionsToInsert = questionsData
    .filter(q => q.correct_answer != null && q.correct_answer !== '')
    .map(q => ({
      external_id: q.id,
      subject: q.subject || 'Mathematics',
      chapter: q.chapter || '',
      topic: q.topic || '',
      subtopic: q.subtopic || '',
      difficulty: q.difficulty || 'MEDIUM',
      tags: q.tags || [],
      question_type: q.type || 'Multiple Choice Single Answer',
      concepts: [],
      question: q.question,
      question_html: q.question_html || '',
      options: q.options,
      correct_answer: q.correct_answer,
      strategy: '',  // Not in math data
      expert_insight: '',  // Not in math data
      key_facts: '',  // Not in math data
      solution_html: q.solution_html || '',
      solution_text: q.solution_text || ''
    }));

  const skipped = questionsData.length - questionsToInsert.length;
  if (skipped > 0) {
    console.log(`⚠️  Skipping ${skipped} questions without correct answers\n`);
  }

  // Step 5: Insert new questions in batches
  console.log(`📤 Inserting ${questionsToInsert.length} new mathematics questions...\n`);

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

  // Step 6: Show summary
  console.log('\n' + '='.repeat(70));
  console.log('📊 Replacement Summary:');
  console.log('='.repeat(70));
  console.log(`🗑️  Deleted: ${existingMath.length} old mathematics questions`);
  console.log(`✅ Inserted: ${successCount} new mathematics questions`);
  if (errorCount > 0) {
    console.log(`❌ Failed: ${errorCount} questions`);
  }

  // Step 7: Show updated statistics
  const { data: stats, error: statsError } = await supabase
    .from('question_stats')
    .select('*')
    .eq('subject', 'Mathematics');

  if (!statsError && stats) {
    console.log('\n📈 Mathematics Question Statistics:');
    console.log('Chapter/Topic\t\t\tDifficulty\tCount');
    console.log('─'.repeat(70));
    stats.forEach(s => {
      const chapter = (s.chapter_or_topic || s.topic || 'N/A').padEnd(30);
      const difficulty = (s.difficulty || 'N/A').padEnd(8);
      console.log(`${chapter}\t${difficulty}\t${s.question_count}`);
    });
  }

  // Show all subjects
  const { data: allSubjects, error: subError } = await supabase
    .from('questions')
    .select('subject');

  if (!subError && allSubjects) {
    const subjects = {};
    allSubjects.forEach(q => {
      const subject = q.subject || 'Unknown';
      subjects[subject] = (subjects[subject] || 0) + 1;
    });

    console.log('\n📚 Total Questions by Subject:');
    Object.entries(subjects).sort().forEach(([subject, count]) => {
      console.log(`  • ${subject}: ${count} questions`);
    });
  }

  console.log('\n' + '='.repeat(70));
  console.log('✅ Mathematics questions replacement complete!');
  console.log('='.repeat(70));
}

replaceMathQuestions().catch(error => {
  console.error('\n❌ Replacement failed:', error);
  process.exit(1);
});
