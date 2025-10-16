const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

(async () => {
  console.log('\n🎨 SVG GENERATION STATUS CHECK\n');
  console.log('='.repeat(70));

  // Check for questions with figure references
  const { data: allQuestions } = await supabase
    .from('questions')
    .select('id, subject, question_html, solution_html, figure_svg')
    .limit(500);

  console.log(`\n📊 Analyzing ${allQuestions?.length || 0} questions...\n`);

  let hasFigureReferences = 0;
  let hasSVG = 0;
  let needsSVG = 0;
  let examplesWithFigure = [];
  let examplesWithSVG = [];

  allQuestions?.forEach(q => {
    // Check if question or solution mentions figure/diagram
    const text = (q.question_html || '') + (q.solution_html || '');
    const mentionsFigure = /figure|diagram|graph|image|see\s+the\s+diagram/i.test(text);

    if (mentionsFigure) {
      hasFigureReferences++;

      if (q.figure_svg && q.figure_svg.trim() !== '') {
        hasSVG++;
        if (examplesWithSVG.length < 3) {
          examplesWithSVG.push({
            id: q.id,
            subject: q.subject,
            svg_length: q.figure_svg.length
          });
        }
      } else {
        needsSVG++;
        if (examplesWithFigure.length < 3) {
          examplesWithFigure.push({
            id: q.id,
            subject: q.subject,
            text: text.substring(0, 150)
          });
        }
      }
    }
  });

  console.log('📈 SUMMARY:\n');
  console.log(`Total questions checked: ${allQuestions?.length || 0}`);
  console.log(`Questions mentioning figures/diagrams: ${hasFigureReferences}`);
  console.log(`Questions with SVG generated: ${hasSVG} (${hasFigureReferences > 0 ? ((hasSVG/hasFigureReferences)*100).toFixed(1) : 0}%)`);
  console.log(`Questions needing SVG: ${needsSVG}`);
  console.log('');

  if (examplesWithSVG.length > 0) {
    console.log('✅ EXAMPLES WITH SVG GENERATED:\n');
    examplesWithSVG.forEach((ex, idx) => {
      console.log(`${idx + 1}. Question ID: ${ex.id}`);
      console.log(`   Subject: ${ex.subject}`);
      console.log(`   SVG length: ${ex.svg_length} characters`);
      console.log('');
    });
  } else {
    console.log('⚠️  NO SVG GENERATION DETECTED YET\n');
  }

  if (examplesWithFigure.length > 0) {
    console.log('📋 EXAMPLES NEEDING SVG (mention figures but no SVG yet):\n');
    examplesWithFigure.forEach((ex, idx) => {
      console.log(`${idx + 1}. Question ID: ${ex.id}`);
      console.log(`   Subject: ${ex.subject}`);
      console.log(`   Text: ${ex.text}...`);
      console.log('');
    });
  }

  // Check if figure_svg column exists and has data
  console.log('='.repeat(70));
  console.log('\n🔍 DETAILED CHECK: figure_svg column\n');

  const { data: questionsWithSVG } = await supabase
    .from('questions')
    .select('id, subject, figure_svg')
    .not('figure_svg', 'is', null)
    .neq('figure_svg', '')
    .limit(5);

  if (questionsWithSVG && questionsWithSVG.length > 0) {
    console.log(`✅ Found ${questionsWithSVG.length} questions with SVG data:\n`);

    questionsWithSVG.forEach((q, idx) => {
      console.log(`${idx + 1}. Question ID: ${q.id}`);
      console.log(`   Subject: ${q.subject}`);
      console.log(`   SVG preview: ${q.figure_svg.substring(0, 200)}...`);
      console.log(`   SVG length: ${q.figure_svg.length} characters`);
      console.log('');
    });

    console.log('✅ SVG GENERATION IS WORKING!\n');
  } else {
    console.log('⚠️  NO SVG DATA FOUND IN DATABASE\n');
    console.log('This could mean:');
    console.log('  1. The enrichment pipeline with SVG generation hasn\'t run yet');
    console.log('  2. The figure_svg column doesn\'t exist in the schema');
    console.log('  3. No questions needed SVG generation');
    console.log('');
  }

  console.log('='.repeat(70) + '\n');

  process.exit(0);
})();
