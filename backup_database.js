#!/usr/bin/env node
/**
 * Database Backup Script
 * Creates a complete backup of all questions and user data from Supabase
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

// Create backup directory with timestamp
const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
const backupDir = path.join(__dirname, 'backups', `backup_${timestamp}`);

function createBackupDirectory() {
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }
}

async function backupQuestions() {
  console.log('\n📚 Backing up questions...');

  const { data: questions, error } = await supabase
    .from('questions')
    .select('*')
    .order('external_id');

  if (error) {
    console.error('❌ Error fetching questions:', error.message);
    return false;
  }

  const filePath = path.join(backupDir, 'questions.json');
  fs.writeFileSync(filePath, JSON.stringify(questions, null, 2), 'utf-8');

  console.log(`✅ Backed up ${questions.length} questions to questions.json`);
  return questions.length;
}

async function backupQuestionStats() {
  console.log('\n📊 Generating question statistics...');

  const { data: stats, error } = await supabase
    .from('question_stats')
    .select('*')
    .order('topic');

  if (error) {
    console.error('❌ Error fetching question stats:', error.message);
    return false;
  }

  const filePath = path.join(backupDir, 'question_stats.json');
  fs.writeFileSync(filePath, JSON.stringify(stats, null, 2), 'utf-8');

  console.log(`✅ Generated statistics for ${stats.length} topic-difficulty combinations`);
  return stats.length;
}

async function backupTests() {
  console.log('\n🧪 Backing up tests...');

  const { data: tests, error } = await supabase
    .from('tests')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('❌ Error fetching tests:', error.message);
    return false;
  }

  const filePath = path.join(backupDir, 'tests.json');
  fs.writeFileSync(filePath, JSON.stringify(tests, null, 2), 'utf-8');

  console.log(`✅ Backed up ${tests.length} tests to tests.json`);
  return tests.length;
}

async function backupQuestionHistory() {
  console.log('\n📖 Backing up question history...');

  const { data: history, error } = await supabase
    .from('question_history')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('❌ Error fetching question history:', error.message);
    return false;
  }

  const filePath = path.join(backupDir, 'question_history.json');
  fs.writeFileSync(filePath, JSON.stringify(history, null, 2), 'utf-8');

  console.log(`✅ Backed up ${history.length} question history records to question_history.json`);
  return history.length;
}

function generateBackupManifest(stats) {
  console.log('\n📄 Creating backup manifest...');

  const manifest = {
    backup_date: new Date().toISOString(),
    backup_timestamp: timestamp,
    supabase_url: supabaseUrl,
    statistics: stats,
    files: [
      'questions.json',
      'question_stats.json',
      'tests.json',
      'question_history.json',
      'manifest.json'
    ],
    schema_files: [
      '../supabase_schema.sql',
      '../supabase_question_history_schema.sql',
      '../fix_tests_rls.sql'
    ],
    notes: [
      'This backup contains all questions, tests, and user interaction history',
      'To restore: Run schema files first, then use restore_database.js',
      'Questions can be restored using migrate_questions.js with questions.json'
    ]
  };

  const filePath = path.join(backupDir, 'manifest.json');
  fs.writeFileSync(filePath, JSON.stringify(manifest, null, 2), 'utf-8');

  console.log('✅ Created backup manifest');
}

function copySchemaFiles() {
  console.log('\n📋 Copying schema files...');

  const schemaFiles = [
    'supabase_schema.sql',
    'supabase_question_history_schema.sql',
    'fix_tests_rls.sql'
  ];

  let copiedCount = 0;

  schemaFiles.forEach(file => {
    const sourcePath = path.join(__dirname, file);
    const destPath = path.join(backupDir, file);

    if (fs.existsSync(sourcePath)) {
      fs.copyFileSync(sourcePath, destPath);
      copiedCount++;
    }
  });

  console.log(`✅ Copied ${copiedCount} schema files`);
}

function generateReadme() {
  console.log('\n📝 Generating README...');

  const readme = `# Database Backup - ${timestamp}

## Backup Information

**Date:** ${new Date().toISOString()}
**Supabase URL:** ${supabaseUrl}

## Contents

This backup contains:

1. **questions.json** - All mathematics questions with solutions
2. **question_stats.json** - Question statistics by topic and difficulty
3. **tests.json** - All completed tests (anonymized user data)
4. **question_history.json** - User interaction history with questions
5. **Schema files** - Database schema SQL files
6. **manifest.json** - Backup metadata and file listing

## Restore Instructions

### Option 1: Restore to New Supabase Project

1. Create a new Supabase project
2. Run schema files in this order:
   \`\`\`bash
   # In Supabase SQL Editor
   1. supabase_schema.sql
   2. supabase_question_history_schema.sql
   3. fix_tests_rls.sql
   \`\`\`

3. Update .env.local with new Supabase credentials

4. Restore questions:
   \`\`\`bash
   # Copy questions.json to project root
   cp questions.json ../questions_restore.json

   # Modify migrate_questions.js to use questions_restore.json
   # Run migration
   node migrate_questions.js
   \`\`\`

### Option 2: Restore Specific Data

#### Restore Questions Only
\`\`\`bash
# Use Supabase dashboard to import questions.json
# Or use migrate_questions.js script
\`\`\`

#### Restore Tests (Requires matching user IDs)
\`\`\`bash
# Import tests.json via Supabase dashboard
# Ensure user_id references exist in auth.users
\`\`\`

## Backup Statistics

See manifest.json for detailed statistics.

## Notes

- User passwords are NOT included (managed by Supabase Auth)
- Tests include user_id references but no personal information
- Question history links users to questions via external_id
- All timestamps are in UTC

## Security

⚠️ This backup may contain sensitive data:
- User test history
- Performance analytics
- Question interaction patterns

Store securely and do not share publicly.

---

Generated by backup_database.js
`;

  const readmePath = path.join(backupDir, 'README.md');
  fs.writeFileSync(readmePath, readme, 'utf-8');

  console.log('✅ Generated README.md');
}

async function main() {
  console.log('🔐 JEE Test Generator - Database Backup');
  console.log('='  .repeat(70));

  // Create backup directory
  createBackupDirectory();
  console.log(`\n📁 Backup directory: ${backupDir}`);

  // Backup all data
  const stats = {
    questions: await backupQuestions(),
    questionStats: await backupQuestionStats(),
    tests: await backupTests(),
    questionHistory: await backupQuestionHistory()
  };

  // Copy schema files
  copySchemaFiles();

  // Generate manifest
  generateBackupManifest(stats);

  // Generate README
  generateReadme();

  // Create a compressed backup info
  console.log('\n' + '='.repeat(70));
  console.log('✅ BACKUP COMPLETED SUCCESSFULLY!');
  console.log('='.repeat(70));
  console.log('\n📊 Backup Summary:');
  console.log(`   Questions: ${stats.questions}`);
  console.log(`   Question Stats: ${stats.questionStats}`);
  console.log(`   Tests: ${stats.tests}`);
  console.log(`   Question History: ${stats.questionHistory}`);
  console.log(`\n📁 Location: ${backupDir}`);
  console.log(`\n💾 Total Files: ${fs.readdirSync(backupDir).length}`);

  // Calculate total size
  let totalSize = 0;
  fs.readdirSync(backupDir).forEach(file => {
    const filePath = path.join(backupDir, file);
    const stats = fs.statSync(filePath);
    totalSize += stats.size;
  });

  console.log(`📦 Total Size: ${(totalSize / 1024).toFixed(2)} KB`);
  console.log('\n💡 Tip: Keep this backup in a secure location!');
  console.log('='  .repeat(70));
}

main().catch(error => {
  console.error('\n❌ Backup failed:', error);
  process.exit(1);
});
