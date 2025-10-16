const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const REPORT_FILE = 'enrichment_progress_report.txt';
let checkCount = 0;
let startTime = Date.now();

async function checkEnrichmentStatus() {
  checkCount++;
  const timestamp = new Date().toLocaleString();
  const elapsed = Math.floor((Date.now() - startTime) / 1000 / 60);

  console.log(`\n${'='.repeat(70)}`);
  console.log(`Check #${checkCount} at ${timestamp} (${elapsed} min elapsed)`);
  console.log('='.repeat(70));

  let report = `\n${'='.repeat(70)}\n`;
  report += `CHECK #${checkCount} - ${timestamp} (${elapsed} min elapsed)\n`;
  report += '='.repeat(70) + '\n\n';

  const subjects = ['Mathematics', 'Physics', 'Chemistry'];
  const results = {};

  for (const subject of subjects) {
    const { data, error } = await supabase
      .from('questions')
      .select('id, strategy, expert_insight, key_facts')
      .eq('subject', subject);

    if (error) {
      console.log(`${subject}: ERROR - ${error.message}`);
      report += `${subject}: ERROR - ${error.message}\n`;
      continue;
    }

    const total = data?.length || 0;
    const enriched = data?.filter(q =>
      q.strategy && q.strategy.trim() !== '' && q.strategy !== 'Strategy:' &&
      q.expert_insight && q.expert_insight.trim() !== '' && q.expert_insight !== 'Expert Insight:' &&
      q.key_facts && q.key_facts.trim() !== '' && q.key_facts !== 'Key Facts Used:'
    ).length || 0;

    const partialStrategy = data?.filter(q =>
      q.strategy && q.strategy.trim() !== '' && q.strategy !== 'Strategy:'
    ).length || 0;

    const partialInsight = data?.filter(q =>
      q.expert_insight && q.expert_insight.trim() !== '' && q.expert_insight !== 'Expert Insight:'
    ).length || 0;

    const partialFacts = data?.filter(q =>
      q.key_facts && q.key_facts.trim() !== '' && q.key_facts !== 'Key Facts Used:'
    ).length || 0;

    results[subject] = {
      total,
      enriched,
      partialStrategy,
      partialInsight,
      partialFacts,
      remaining: total - enriched,
      percentage: ((enriched / total) * 100).toFixed(1)
    };

    const output = `${subject}:
  Total questions: ${total}
  Fully enriched: ${enriched} (${results[subject].percentage}%)
  Remaining: ${results[subject].remaining}

  Partial enrichment:
    - With strategy: ${partialStrategy} (${((partialStrategy/total)*100).toFixed(1)}%)
    - With expert_insight: ${partialInsight} (${((partialInsight/total)*100).toFixed(1)}%)
    - With key_facts: ${partialFacts} (${((partialFacts/total)*100).toFixed(1)}%)
`;

    console.log(output);
    report += output + '\n';
  }

  // Calculate changes since last check
  if (checkCount > 1 && global.lastResults) {
    report += '\n' + '-'.repeat(70) + '\n';
    report += 'CHANGES SINCE LAST CHECK (1 minute ago):\n';
    report += '-'.repeat(70) + '\n\n';

    for (const subject of subjects) {
      const current = results[subject];
      const previous = global.lastResults[subject];

      if (previous) {
        const enrichedChange = current.enriched - previous.enriched;
        const strategyChange = current.partialStrategy - previous.partialStrategy;
        const insightChange = current.partialInsight - previous.partialInsight;
        const factsChange = current.partialFacts - previous.partialFacts;

        const changeReport = `${subject}:
  Fully enriched: ${enrichedChange > 0 ? '+' : ''}${enrichedChange}
  Strategy added: ${strategyChange > 0 ? '+' : ''}${strategyChange}
  Expert insight added: ${insightChange > 0 ? '+' : ''}${insightChange}
  Key facts added: ${factsChange > 0 ? '+' : ''}${factsChange}
  Progress rate: ${(enrichedChange / 1).toFixed(1)} questions/minute
`;

        console.log(changeReport);
        report += changeReport + '\n';
      }
    }
  }

  // Summary
  const totalEnriched = Object.values(results).reduce((sum, r) => sum + r.enriched, 0);
  const totalQuestions = Object.values(results).reduce((sum, r) => sum + r.total, 0);
  const totalRemaining = totalQuestions - totalEnriched;
  const overallPercentage = ((totalEnriched / totalQuestions) * 100).toFixed(1);

  const summary = `
${'='.repeat(70)}
OVERALL SUMMARY:
${'='.repeat(70)}
Total enriched: ${totalEnriched}/${totalQuestions} (${overallPercentage}%)
Total remaining: ${totalRemaining}
Estimated time remaining: ${Math.ceil(totalRemaining / 3)} minutes (at 3 q/min)
`;

  console.log(summary);
  report += summary + '\n';

  // Save to file
  fs.appendFileSync(REPORT_FILE, report);
  console.log(`\n✅ Report appended to ${REPORT_FILE}`);

  // Store for next comparison
  global.lastResults = results;
}

// Initialize report file
const initReport = `
${'='.repeat(70)}
DATABASE ENRICHMENT MONITORING REPORT
Started: ${new Date().toLocaleString()}
${'='.repeat(70)}

Monitoring database enrichment progress every 60 seconds...
Press Ctrl+C to stop monitoring.

`;

fs.writeFileSync(REPORT_FILE, initReport);
console.log('📊 Starting enrichment monitoring...');
console.log(`📝 Writing progress to: ${REPORT_FILE}`);
console.log('Press Ctrl+C to stop\n');

// Run first check immediately
checkEnrichmentStatus();

// Then check every 60 seconds
setInterval(checkEnrichmentStatus, 60000);
