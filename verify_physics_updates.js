/**
 * Verify Physics Questions Database Updates
 * Checks that auto-fixes from validation pipeline were saved correctly
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function verifyUpdates() {
  console.log('🔍 Verifying Physics Question Database Updates\n');
  console.log('=' .repeat(70) + '\n');

  // Fetch all Physics questions
  const { data: questions, error } = await supabase
    .from('questions')
    .select('*')
    .eq('subject', 'Physics')
    .order('id', { ascending: true });

  if (error) {
    console.error('❌ Error fetching questions:', error);
    return;
  }

  console.log(`📊 Total Physics Questions: ${questions.length}\n`);

  const stats = {
    total: questions.length,
    withOptions: 0,
    withoutOptions: 0,
    withSolution: 0,
    withoutSolution: 0,
    multiPartWithProperOptions: 0,
    multiPartWithImproperOptions: 0,
    complete: 0,
    incomplete: 0,
  };

  // Multi-part detection patterns
  const multiPartPatterns = [
    /\(a\).*\(b\)/i,
    /part\s+\(a\)/i,
    /\(i\).*\(ii\)/i,
  ];

  const issues = [];

  for (const q of questions) {
    const questionText = q.question_html || q.question || '';
    const hasMultiPart = multiPartPatterns.some(pattern => pattern.test(questionText));

    // Check options
    if (q.options && q.options.a && q.options.b && q.options.c && q.options.d) {
      stats.withOptions++;

      // Check multi-part handling
      if (hasMultiPart) {
        const optionsText = [
          q.options.a || '',
          q.options.b || '',
          q.options.c || '',
          q.options.d || ''
        ].join(' ');

        if (optionsText.toLowerCase().includes('part') ||
            optionsText.includes('(a)') ||
            optionsText.includes('(i)')) {
          stats.multiPartWithProperOptions++;
        } else {
          stats.multiPartWithImproperOptions++;
          issues.push({
            id: q.id.substring(0, 8),
            issue: 'Multi-part question with improper options',
            question: questionText.substring(0, 100) + '...'
          });
        }
      }
    } else {
      stats.withoutOptions++;
      issues.push({
        id: q.id.substring(0, 8),
        issue: 'Missing options',
        question: questionText.substring(0, 100) + '...'
      });
    }

    // Check solution
    if (q.solution_html && q.solution_html.trim() !== '') {
      stats.withSolution++;
    } else {
      stats.withoutSolution++;
      issues.push({
        id: q.id.substring(0, 8),
        issue: 'Missing solution',
        question: questionText.substring(0, 100) + '...'
      });
    }

    // Check completeness (basic check for figure references without SVG)
    const hasFigureRef = ['figure', 'diagram', 'graph', 'shown'].some(kw =>
      questionText.toLowerCase().includes(kw)
    );
    const hasSVG = q.figure_svg && q.figure_svg.trim() !== '';

    if (hasFigureRef && !hasSVG) {
      stats.incomplete++;
      issues.push({
        id: q.id.substring(0, 8),
        issue: 'Figure reference but no SVG',
        question: questionText.substring(0, 100) + '...'
      });
    } else {
      stats.complete++;
    }
  }

  // Print statistics
  console.log('📈 Overall Statistics:\n');
  console.log(`   Options:`);
  console.log(`      With all 4 options: ${stats.withOptions} (${(stats.withOptions/stats.total*100).toFixed(1)}%)`);
  console.log(`      Missing options: ${stats.withoutOptions} (${(stats.withoutOptions/stats.total*100).toFixed(1)}%)\n`);

  console.log(`   Solutions:`);
  console.log(`      With solution: ${stats.withSolution} (${(stats.withSolution/stats.total*100).toFixed(1)}%)`);
  console.log(`      Missing solution: ${stats.withoutSolution} (${(stats.withoutSolution/stats.total*100).toFixed(1)}%)\n`);

  console.log(`   Multi-part Questions:`);
  console.log(`      Proper options: ${stats.multiPartWithProperOptions}`);
  console.log(`      Improper options: ${stats.multiPartWithImproperOptions}\n`);

  console.log(`   Completeness:`);
  console.log(`      Complete: ${stats.complete} (${(stats.complete/stats.total*100).toFixed(1)}%)`);
  console.log(`      Incomplete (figure refs without SVG): ${stats.incomplete} (${(stats.incomplete/stats.total*100).toFixed(1)}%)\n`);

  // Print issues
  if (issues.length > 0) {
    console.log('=' .repeat(70));
    console.log(`\n⚠️  Found ${issues.length} Issues:\n`);

    const grouped = {};
    issues.forEach(issue => {
      if (!grouped[issue.issue]) {
        grouped[issue.issue] = [];
      }
      grouped[issue.issue].push(issue);
    });

    Object.keys(grouped).forEach(issueType => {
      console.log(`\n${issueType} (${grouped[issueType].length}):`);
      grouped[issueType].slice(0, 5).forEach(issue => {
        console.log(`   - Question ${issue.id}: ${issue.question}`);
      });
      if (grouped[issueType].length > 5) {
        console.log(`   ... and ${grouped[issueType].length - 5} more`);
      }
    });
  } else {
    console.log('✅ No issues found - all questions are properly formatted!\n');
  }

  console.log('\n' + '=' .repeat(70));
  console.log('\n✅ Verification Complete!\n');
}

verifyUpdates().catch(console.error);
