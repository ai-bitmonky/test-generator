require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

(async () => {
  const { data: questions, error } = await supabase
    .from('questions')
    .select('id, subject, question_html, figure_svg')
    .eq('subject', 'Physics');

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log('🔍 Physics Questions Figure Analysis\n');
  console.log('='.repeat(70) + '\n');

  let totalQuestions = questions.length;
  let mentionsFigure = 0;
  let hasFigureSVG = 0;
  let mentionsFigureButNoSVG = 0;
  let hasSVGButNoMention = 0;

  const figureKeywords = ['figure', 'diagram', 'graph', 'shown', 'circuit', 'image', 'fig\\.', 'fig\\s'];
  const missingFigureQuestions = [];

  questions.forEach(q => {
    const text = (q.question_html || '').toLowerCase();
    const hasSVG = q.figure_svg && q.figure_svg.trim().length > 0;
    const mentionsFig = figureKeywords.some(kw => new RegExp(kw).test(text));

    if (mentionsFig) mentionsFigure++;
    if (hasSVG) hasFigureSVG++;
    if (mentionsFig && !hasSVG) {
      mentionsFigureButNoSVG++;
      missingFigureQuestions.push({
        id: q.id.substring(0, 8),
        preview: text.substring(0, 100)
      });
    }
    if (!mentionsFig && hasSVG) hasSVGButNoMention++;
  });

  console.log(`📊 Total Physics Questions: ${totalQuestions}\n`);
  console.log(`📈 Figure Statistics:\n`);
  console.log(`   Questions mentioning figure/diagram: ${mentionsFigure} (${(mentionsFigure/totalQuestions*100).toFixed(1)}%)`);
  console.log(`   Questions with SVG figure: ${hasFigureSVG} (${(hasFigureSVG/totalQuestions*100).toFixed(1)}%)`);
  console.log(`   `);
  console.log(`   ⚠️  Mention figure but NO SVG: ${mentionsFigureButNoSVG} (${(mentionsFigureButNoSVG/totalQuestions*100).toFixed(1)}%)`);
  console.log(`   ℹ️  Have SVG but no mention: ${hasSVGButNoMention} (${(hasSVGButNoMention/totalQuestions*100).toFixed(1)}%)`);

  if (missingFigureQuestions.length > 0) {
    console.log('\n' + '='.repeat(70));
    console.log(`\n⚠️  Questions Missing Figures (${missingFigureQuestions.length}):\n`);
    missingFigureQuestions.slice(0, 10).forEach((q, i) => {
      console.log(`   ${i+1}. ${q.id}: ${q.preview}...`);
    });
    if (missingFigureQuestions.length > 10) {
      console.log(`   ... and ${missingFigureQuestions.length - 10} more`);
    }
  }

  console.log('\n' + '='.repeat(70));
  process.exit(0);
})();
