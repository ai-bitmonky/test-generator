#!/usr/bin/env node
/**
 * Database Restore Script
 * Restores questions and data from a backup directory
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

// Get backup directory from command line argument
const backupDirArg = process.argv[2];

if (!backupDirArg) {
  console.error('❌ Please provide backup directory path');
  console.error('Usage: node restore_database.js <backup-directory>');
  console.error('Example: node restore_database.js ./backups/backup_2025-10-07T12-30-00');
  process.exit(1);
}

const backupDir = path.resolve(backupDirArg);

if (!fs.existsSync(backupDir)) {
  console.error(`❌ Backup directory not found: ${backupDir}`);
  process.exit(1);
}

async function loadBackupFile(filename) {
  const filePath = path.join(backupDir, filename);

  if (!fs.existsSync(filePath)) {
    console.log(`⚠️  File not found: ${filename}`);
    return null;
  }

  const content = fs.readFileSync(filePath, 'utf-8');
  return JSON.parse(content);
}

async function restoreQuestions() {
  console.log('\n📚 Restoring questions...');

  const questions = await loadBackupFile('questions.json');

  if (!questions || questions.length === 0) {
    console.log('⚠️  No questions to restore');
    return 0;
  }

  // Transform questions to match database schema
  const questionsToInsert = questions.map(q => ({
    external_id: q.external_id,
    topic: q.topic,
    difficulty: q.difficulty,
    concepts: q.concepts || [],
    question: q.question,
    options: q.options,
    correct_answer: q.correct_answer,
    solution_html: q.solution_html || '',
    solution_text: q.solution_text || ''
  }));

  // Insert in batches of 50
  const batchSize = 50;
  let successCount = 0;
  let errorCount = 0;

  for (let i = 0; i < questionsToInsert.length; i += batchSize) {
    const batch = questionsToInsert.slice(i, i + batchSize);

    console.log(`📤 Restoring batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(questionsToInsert.length/batchSize)} (${batch.length} questions)...`);

    const { data, error } = await supabase
      .from('questions')
      .upsert(batch, { onConflict: 'external_id' })
      .select();

    if (error) {
      console.error(`❌ Error restoring batch: ${error.message}`);
      errorCount += batch.length;
    } else {
      console.log(`✅ Successfully restored ${data.length} questions`);
      successCount += data.length;
    }
  }

  console.log(`\n📊 Questions Restore Summary:`);
  console.log(`   ✅ Success: ${successCount}`);
  if (errorCount > 0) {
    console.log(`   ❌ Failed: ${errorCount}`);
  }

  return successCount;
}

async function verifyRestore() {
  console.log('\n🔍 Verifying restore...');

  // Check questions count
  const { data: questions, error: qError } = await supabase
    .from('questions')
    .select('id', { count: 'exact', head: true });

  if (qError) {
    console.error('❌ Error verifying questions:', qError.message);
  } else {
    console.log(`✅ Total questions in database: ${questions?.length || 0}`);
  }

  // Check question stats
  const { data: stats, error: sError } = await supabase
    .from('question_stats')
    .select('*');

  if (sError) {
    console.error('❌ Error fetching stats:', sError.message);
  } else {
    console.log('\n📊 Question Statistics:');
    console.log('Topic\t\t\tDifficulty\tCount');
    console.log('─'.repeat(60));
    stats?.forEach(s => {
      console.log(`${s.topic.padEnd(24)}\t${s.difficulty.padEnd(8)}\t${s.question_count}`);
    });
  }
}

async function main() {
  console.log('🔓 JEE Test Generator - Database Restore');
  console.log('='  .repeat(70));
  console.log(`\n📁 Restoring from: ${backupDir}`);

  // Load manifest
  const manifest = await loadBackupFile('manifest.json');

  if (manifest) {
    console.log(`\n📄 Backup Information:`);
    console.log(`   Date: ${manifest.backup_date}`);
    console.log(`   Questions: ${manifest.statistics.questions}`);
  }

  // Confirm before proceeding
  console.log('\n⚠️  WARNING: This will insert/update questions in the database!');
  console.log('⚠️  Make sure you have run the schema files first!');
  console.log('\nPress Ctrl+C to cancel, or wait 5 seconds to continue...');

  await new Promise(resolve => setTimeout(resolve, 5000));

  // Restore questions
  const restoredCount = await restoreQuestions();

  // Verify restore
  await verifyRestore();

  console.log('\n' + '='.repeat(70));
  console.log('✅ RESTORE COMPLETED!');
  console.log('='.repeat(70));
  console.log(`\n📊 Restored ${restoredCount} questions`);
  console.log('\n💡 Note: Tests and question history are NOT restored automatically');
  console.log('💡 Use Supabase dashboard to import those files if needed');
  console.log('='  .repeat(70));
}

main().catch(error => {
  console.error('\n❌ Restore failed:', error);
  process.exit(1);
});
