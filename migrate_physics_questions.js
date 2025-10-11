#!/usr/bin/env node
/**
 * Migration script to upload Physics questions to Supabase
 * Handles additional metadata: chapter, subtopic, tags, strategy, expert_insight, key_facts
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

async function migratePhysicsQuestions() {
  console.log('🔬 Starting Physics question migration...\n');

  // Read questions from JSON file
  const questionsPath = path.join(__dirname, 'physics_questions_with_solutions.json');
  const questionsData = JSON.parse(fs.readFileSync(questionsPath, 'utf-8'));

  console.log(`📚 Found ${questionsData.length} physics questions in file\n`);

  // Fetch existing question IDs from database
  console.log('🔍 Checking for existing questions...');
  const { data: existingQuestions, error: fetchError } = await supabase
    .from('questions')
    .select('external_id');

  if (fetchError) {
    console.error('❌ Error fetching existing questions:', fetchError.message);
    process.exit(1);
  }

  const existingIds = new Set(existingQuestions.map(q => q.external_id));
  console.log(`📊 Found ${existingIds.size} existing questions in database\n`);

  // Transform questions to match database schema and filter duplicates
  const questionsToInsert = questionsData
    .filter(q => {
      if (existingIds.has(q.id)) {
        console.log(`⏭️  Skipping duplicate: ${q.id}`);
        return false;
      }
      if (!q.correct_answer) {
        console.log(`⏭️  Skipping question without answer: ${q.id}`);
        return false;
      }
      return true;
    })
    .map(q => ({
      external_id: q.id,
      subject: q.subject || 'Physics',
      chapter: q.chapter || '',
      topic: q.topic || '',
      subtopic: q.subtopic || '',
      difficulty: q.difficulty || 'MEDIUM',
      tags: q.tags || [],
      question_type: q.type || 'Multiple Choice Single Answer',
      concepts: [],  // Empty for now, can be populated later
      question: q.question,
      question_html: q.question_html || '',
      options: q.options,
      correct_answer: q.correct_answer,
      strategy: q.strategy || '',
      expert_insight: q.expert_insight || '',
      key_facts: q.key_facts || '',
      solution_html: q.solution_html || '',
      solution_text: q.solution_text || ''
    }));

  console.log(`\n📝 ${questionsToInsert.length} new questions to insert\n`);

  if (questionsToInsert.length === 0) {
    console.log('✅ No new questions to migrate. All questions already exist in database.');
    return;
  }

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
    console.log('Subject\t\tChapter/Topic\t\t\tDifficulty\tCount');
    console.log('─'.repeat(80));
    stats.forEach(s => {
      const subject = (s.subject || 'N/A').padEnd(12);
      const chapter = (s.chapter_or_topic || s.topic || 'N/A').padEnd(24);
      const difficulty = (s.difficulty || 'N/A').padEnd(8);
      console.log(`${subject}\t${chapter}\t${difficulty}\t${s.question_count}`);
    });
  }

  // Show subject breakdown
  const { data: subjectCounts, error: subjectError } = await supabase
    .from('questions')
    .select('subject');

  if (!subjectError && subjectCounts) {
    const subjects = {};
    subjectCounts.forEach(q => {
      const subject = q.subject || 'Unknown';
      subjects[subject] = (subjects[subject] || 0) + 1;
    });

    console.log('\n📚 Questions by Subject:');
    Object.entries(subjects).forEach(([subject, count]) => {
      console.log(`  • ${subject}: ${count} questions`);
    });
  }
}

migratePhysicsQuestions().catch(error => {
  console.error('❌ Migration failed:', error);
  process.exit(1);
});
