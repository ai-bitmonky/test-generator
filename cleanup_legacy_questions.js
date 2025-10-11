#!/usr/bin/env node
/**
 * Remove legacy Mathematics questions that have null or empty chapter values
 * These are the old 142 questions that should have been replaced during migration
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function cleanupLegacyQuestions() {
  console.log('🧹 Starting cleanup of legacy Mathematics questions...\n');

  // Step 1: Identify legacy questions (Mathematics with null chapter)
  console.log('📊 Identifying legacy questions...');
  const { data: legacyQuestions, error: queryError } = await supabase
    .from('questions')
    .select('id, external_id, topic, subject, chapter')
    .eq('subject', 'Mathematics')
    .is('chapter', null);

  if (queryError) {
    console.error('❌ Error querying legacy questions:', queryError.message);
    process.exit(1);
  }

  console.log(`Found ${legacyQuestions.length} legacy Mathematics questions with null chapter\n`);

  if (legacyQuestions.length === 0) {
    console.log('✅ No legacy questions to clean up!');
    return;
  }

  // Show sample of questions to be deleted
  console.log('📋 Sample of questions to be deleted:');
  legacyQuestions.slice(0, 5).forEach(q => {
    console.log(`  - ID: ${q.external_id || q.id}, Topic: ${q.topic}, Chapter: ${q.chapter || 'null'}`);
  });
  console.log('  ...\n');

  // Step 2: Create backup before deletion
  console.log('💾 Creating backup...');
  const backupDir = './backups';
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
  const backupFile = `${backupDir}/legacy_questions_backup_${timestamp}.json`;

  fs.writeFileSync(backupFile, JSON.stringify(legacyQuestions, null, 2), 'utf-8');
  console.log(`✅ Backup created: ${backupFile}\n`);

  // Step 3: Delete legacy questions
  console.log('🗑️  Deleting legacy questions...');
  const { error: deleteError } = await supabase
    .from('questions')
    .delete()
    .eq('subject', 'Mathematics')
    .is('chapter', null);

  if (deleteError) {
    console.error('❌ Error deleting questions:', deleteError.message);
    console.log('Backup is safe at:', backupFile);
    process.exit(1);
  }

  console.log(`✅ Successfully deleted ${legacyQuestions.length} legacy questions\n`);

  // Step 4: Verify cleanup
  console.log('🔍 Verifying cleanup...');
  const { data: remainingLegacy, error: verifyError } = await supabase
    .from('questions')
    .select('id', { count: 'exact', head: true })
    .eq('subject', 'Mathematics')
    .is('chapter', null);

  if (verifyError) {
    console.error('⚠️  Warning: Could not verify cleanup:', verifyError.message);
  }

  // Step 5: Show updated statistics
  const { data: mathQuestions, error: mathError } = await supabase
    .from('questions')
    .select('chapter', { count: 'exact' })
    .eq('subject', 'Mathematics');

  if (!mathError) {
    console.log('📈 Updated Mathematics Question Statistics:');
    console.log(`   Total Mathematics questions: ${mathQuestions.length}`);

    // Count by chapter
    const chapterCounts = {};
    mathQuestions.forEach(q => {
      const ch = q.chapter || 'Unknown';
      chapterCounts[ch] = (chapterCounts[ch] || 0) + 1;
    });

    console.log('\n   By Chapter:');
    Object.entries(chapterCounts)
      .sort((a, b) => b[1] - a[1])
      .forEach(([chapter, count]) => {
        console.log(`   • ${chapter}: ${count} questions`);
      });
  }

  // Step 6: Show overall database stats
  const { data: allSubjects, error: allError } = await supabase
    .from('questions')
    .select('subject');

  if (!allError) {
    const subjectCounts = {};
    allSubjects.forEach(q => {
      const s = q.subject || 'Unknown';
      subjectCounts[s] = (subjectCounts[s] || 0) + 1;
    });

    console.log('\n📚 Total Questions by Subject:');
    Object.entries(subjectCounts).forEach(([subject, count]) => {
      console.log(`   • ${subject}: ${count} questions`);
    });
  }

  console.log('\n' + '='.repeat(70));
  console.log('✅ Cleanup Complete!');
  console.log('='.repeat(70));
  console.log(`Deleted: ${legacyQuestions.length} legacy questions`);
  console.log(`Backup: ${backupFile}`);
  console.log('='.repeat(70));
}

cleanupLegacyQuestions().catch(error => {
  console.error('❌ Cleanup failed:', error);
  process.exit(1);
});
