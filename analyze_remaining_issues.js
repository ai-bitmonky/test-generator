/**
 * Analyze remaining validation issues in the database
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function analyzeRemainingIssues() {
  console.log('📊 Analyzing Remaining Issues\n');
  console.log('='.repeat(70) + '\n');

  // Get all questions with errors or warnings
  const { data: questions, error } = await supabase
    .from('questions')
    .select('id, subject, question_html, validation_errors, validation_warnings')
    .or('validation_errors.not.is.null,validation_warnings.not.is.null')
    .order('subject', { ascending: true });

  if (error) {
    console.error('❌ Error:', error);
    return;
  }

  console.log(`📋 Total questions with issues: ${questions.length}\n`);

  // Group by subject
  const bySubject = {};
  questions.forEach(q => {
    if (!bySubject[q.subject]) {
      bySubject[q.subject] = { errors: [], warnings: [] };
    }
    if (q.validation_errors) bySubject[q.subject].errors.push(q);
    if (q.validation_warnings) bySubject[q.subject].warnings.push(q);
  });

  // Analyze each subject
  for (const [subject, data] of Object.entries(bySubject)) {
    console.log(`\n📚 ${subject}`);
    console.log(`   ❌ Errors: ${data.errors.length}`);
    console.log(`   ⚠️  Warnings: ${data.warnings.length}`);

    // Analyze error types
    if (data.errors.length > 0) {
      const errorTypes = {};
      data.errors.forEach(q => {
        const errors = q.validation_errors;
        if (Array.isArray(errors)) {
          errors.forEach(err => {
            const key = err.field || 'unknown';
            errorTypes[key] = (errorTypes[key] || 0) + 1;
          });
        }
      });
      console.log(`\n   🔍 Error breakdown:`);
      Object.entries(errorTypes)
        .sort((a, b) => b[1] - a[1])
        .forEach(([field, count]) => {
          console.log(`      • ${field}: ${count}`);
        });
    }

    // Analyze warning types
    if (data.warnings.length > 0) {
      const warningTypes = {};
      data.warnings.forEach(q => {
        const warnings = q.validation_warnings;
        if (Array.isArray(warnings)) {
          warnings.forEach(warn => {
            const key = warn.field || 'unknown';
            warningTypes[key] = (warningTypes[key] || 0) + 1;
          });
        }
      });
      console.log(`\n   🔍 Warning breakdown:`);
      Object.entries(warningTypes)
        .sort((a, b) => b[1] - a[1])
        .forEach(([field, count]) => {
          console.log(`      • ${field}: ${count}`);
        });
    }
  }

  console.log('\n' + '='.repeat(70));
  console.log('\n📊 Summary by Subject:\n');

  const table = [];
  for (const [subject, data] of Object.entries(bySubject)) {
    table.push({
      Subject: subject,
      Errors: data.errors.length,
      Warnings: data.warnings.length,
      Total: data.errors.length + data.warnings.length
    });
  }

  console.table(table);

  // Sample some errors for manual review
  console.log('\n📝 Sample Issues (First 5):\n');
  questions.slice(0, 5).forEach((q, idx) => {
    console.log(`${idx + 1}. Question ID: ${q.id} (${q.subject})`);
    console.log(`   HTML: ${q.question_html ? q.question_html.substring(0, 100) : 'N/A'}...`);
    if (q.validation_errors) {
      console.log(`   Errors: ${JSON.stringify(q.validation_errors, null, 2)}`);
    }
    if (q.validation_warnings) {
      console.log(`   Warnings: ${JSON.stringify(q.validation_warnings, null, 2)}`);
    }
    console.log('');
  });
}

analyzeRemainingIssues().catch(console.error);
