/**
 * Adaptive Rate Limiter for AI Pipeline
 * Monitors logs for rate limit errors and adjusts delay automatically
 */

const fs = require('fs');
const { execSync } = require('child_process');

class AdaptiveRateLimiter {
  constructor(logFile, pipelineFile, subject) {
    this.logFile = logFile;
    this.pipelineFile = pipelineFile;
    this.subject = subject;
    this.currentDelay = 5000; // Start with 5 seconds
    this.maxDelay = 15000; // Max 15 seconds
    this.checkInterval = 10000; // Check every 10 seconds
    this.errorThreshold = 3; // If 3+ errors in last check, increase delay
    this.lastErrorCount = 0;
    this.failedQuestions = new Set();
  }

  async start() {
    console.log('🔍 Starting adaptive rate limiter...');
    console.log(`📄 Monitoring: ${this.logFile}`);
    console.log(`⏱️  Initial delay: ${this.currentDelay}ms\n`);

    // Monitor log file
    setInterval(() => this.checkAndAdjust(), this.checkInterval);
  }

  checkAndAdjust() {
    try {
      // Count rate limit errors in last 30 lines
      const logTail = execSync(`tail -30 "${this.logFile}" 2>/dev/null || echo ""`, { encoding: 'utf-8' });
      const errorMatches = logTail.match(/rate_limit_error/g);
      const errorCount = errorMatches ? errorMatches.length : 0;

      // Extract currently processing question
      const processingMatch = logTail.match(/📝 Processing: ([^\n]+)/);
      const currentQuestion = processingMatch ? processingMatch[1].trim() : null;

      if (errorCount > 0) {
        console.log(`⚠️  Detected ${errorCount} rate limit errors in recent log`);

        // Track failed question
        if (currentQuestion) {
          this.failedQuestions.add(currentQuestion);
          console.log(`   Failed question: ${currentQuestion}`);
        }

        // Increase delay if errors are frequent
        if (errorCount >= this.errorThreshold && this.currentDelay < this.maxDelay) {
          const oldDelay = this.currentDelay;
          this.currentDelay = Math.min(this.currentDelay + 1000, this.maxDelay);

          console.log(`\n🔧 ADJUSTING RATE LIMIT`);
          console.log(`   Old delay: ${oldDelay}ms`);
          console.log(`   New delay: ${this.currentDelay}ms`);

          // Update pipeline file
          this.updatePipelineDelay();
        }
      } else if (this.lastErrorCount > 0 && errorCount === 0) {
        // Errors cleared
        console.log(`✅ Rate limit errors cleared (current delay: ${this.currentDelay}ms)`);
      }

      this.lastErrorCount = errorCount;

      // Show status every minute
      if (Date.now() % 60000 < this.checkInterval) {
        this.showStatus();
      }

    } catch (error) {
      // Log file might not exist yet
    }
  }

  updatePipelineDelay() {
    try {
      let content = fs.readFileSync(this.pipelineFile, 'utf-8');

      // Update the delay value
      const regex = /await new Promise\(resolve => setTimeout\(resolve, \d+\)\);/;
      const newLine = `await new Promise(resolve => setTimeout(resolve, ${this.currentDelay}));`;

      if (regex.test(content)) {
        content = content.replace(regex, newLine);
        fs.writeFileSync(this.pipelineFile, content);
        console.log(`   ✅ Updated pipeline delay in ${this.pipelineFile}`);
      }
    } catch (error) {
      console.error(`   ❌ Failed to update pipeline: ${error.message}`);
    }
  }

  showStatus() {
    console.log(`\n📊 STATUS UPDATE`);
    console.log(`   Current delay: ${this.currentDelay}ms`);
    console.log(`   Failed questions tracked: ${this.failedQuestions.size}`);

    if (this.failedQuestions.size > 0) {
      console.log(`   Failed questions: ${Array.from(this.failedQuestions).slice(0, 5).join(', ')}${this.failedQuestions.size > 5 ? '...' : ''}`);
    }
    console.log('');
  }

  getFailedQuestions() {
    return Array.from(this.failedQuestions);
  }
}

// Run if called directly
if (require.main === module) {
  const subject = process.argv[2] || 'Mathematics';
  const logFile = `ai_pipeline_v21_${subject.toLowerCase()}_full.log`;
  const pipelineFile = 'ai_pipeline_fixed.js';

  const limiter = new AdaptiveRateLimiter(logFile, pipelineFile, subject);
  limiter.start();

  console.log('Press Ctrl+C to stop monitoring\n');

  // Handle graceful shutdown
  process.on('SIGINT', () => {
    console.log('\n\n🛑 Stopping adaptive rate limiter...');
    const failed = limiter.getFailedQuestions();

    if (failed.length > 0) {
      console.log(`\n📋 Failed Questions (${failed.length} total):`);
      failed.forEach(q => console.log(`   - ${q}`));

      // Save to file
      const outputFile = `failed_questions_${subject.toLowerCase()}.txt`;
      fs.writeFileSync(outputFile, failed.join('\n'));
      console.log(`\n💾 Saved failed questions to: ${outputFile}`);
    } else {
      console.log('\n✅ No failed questions detected!');
    }

    process.exit(0);
  });
}

module.exports = AdaptiveRateLimiter;
