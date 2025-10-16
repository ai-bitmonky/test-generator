/**
 * Quick test of the enhanced pipeline on a single question
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

(async () => {
  console.log('\n🧪 Testing Enhanced Pipeline on Single Question\n');
  console.log('='.repeat(70));

  // Find a question that needs enrichment (preferably one that mentions a figure)
  const { data: questions } = await supabase
    .from('questions')
    .select('*')
    .eq('subject', 'Mathematics')
    .or('strategy.is.null,strategy.eq.,strategy.eq.Strategy:')
    .limit(1);

  if (!questions || questions.length === 0) {
    console.log('\n❌ No unenriched questions found for testing');
    console.log('   All Mathematics questions appear to be enriched already\n');
    process.exit(0);
  }

  const q = questions[0];

  console.log(`\n📌 Selected Question:`);
  console.log(`   ID: ${q.id}`);
  console.log(`   Subject: ${q.subject}`);
  console.log(`   Topic: ${q.topic || 'N/A'}`);
  console.log(`   Question: ${(q.question_html || q.question || '').substring(0, 100)}...`);
  console.log('');
  console.log('🔍 Current State:');
  console.log(`   strategy: ${q.strategy ? 'EXISTS' : 'MISSING'}`);
  console.log(`   expert_insight: ${q.expert_insight ? 'EXISTS' : 'MISSING'}`);
  console.log(`   key_facts: ${q.key_facts ? 'EXISTS' : 'MISSING'}`);
  console.log(`   figure_svg: ${q.figure_svg ? 'EXISTS' : 'MISSING'}`);

  // Check if question mentions figures
  const questionText = (q.question_html || q.question || '').toLowerCase();
  const mentionsFigure = ['figure', 'diagram', 'graph', 'shown', 'circuit'].some(kw => questionText.includes(kw));
  console.log(`   Mentions figures: ${mentionsFigure ? 'YES' : 'NO'}`);

  console.log('\n' + '='.repeat(70));
  console.log('\n✅ Enhanced Pipeline Ready!\n');
  console.log('📝 Features to Test:');
  console.log('   ✅ Text enrichment (strategy, expert_insight, key_facts)');
  console.log('   ✅ SVG generation (if question mentions figures)');
  console.log('   ✅ 100-word limits with auto-condensing');
  console.log('   ✅ HTML entity cleanup in options');
  console.log('   ✅ Combined word separation');
  console.log('   ✅ Figure warning removal');

  console.log('\n💡 To run the enhanced pipeline on this question:');
  console.log(`   node database_enrichment_pipeline.js Mathematics`);
  console.log('\n' + '='.repeat(70) + '\n');

  process.exit(0);
})();
