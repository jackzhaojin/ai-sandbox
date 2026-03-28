#!/usr/bin/env node

import { CapabilityLoader } from './lib/capability-loader.js';
import { TestGenerator } from './lib/test-generator.js';
import { TestRunner } from './lib/test-runner.js';
import { EvidenceCollector } from './lib/evidence-collector.js';

/**
 * Main calibration runner
 */
class CalibrationRunner {
  constructor() {
    this.loader = new CapabilityLoader();
    this.generator = new TestGenerator();
    this.runner = new TestRunner();
    this.collector = new EvidenceCollector();
  }

  /**
   * Run calibration for a specific capability
   * @param {string} capabilityName - Name of the capability to calibrate
   */
  async calibrateCapability(capabilityName) {
    console.log(`\n🎯 Calibrating: ${capabilityName}`);
    console.log('='.repeat(60));

    try {
      // Load capability definition
      console.log('\n📋 Loading capability definition...');
      const capability = this.loader.loadCapability(capabilityName);
      console.log(`   Description: ${capability.description}`);

      // Validate capability
      const validation = this.loader.validateCapability(capability);
      if (!validation.isValid) {
        console.error('❌ Invalid capability definition:');
        validation.errors.forEach(err => console.error(`   - ${err}`));
        return;
      }

      // Generate test cases
      console.log('\n🧪 Generating test cases...');
      const testCases = this.generator.generateTestCases(capability);
      console.log(`   Generated ${testCases.length} test cases`);

      const testStats = this.generator.getTestStatistics(testCases);
      console.log(`   Difficulty breakdown:`);
      for (const [level, count] of Object.entries(testStats.byDifficulty)) {
        console.log(`     - ${level}: ${count}`);
      }

      // Save test cases
      const testCasesPath = this.generator.saveTestCases(capabilityName, testCases);
      console.log(`   Saved to: ${testCasesPath}`);

      // Execute tests
      console.log('\n▶️  Executing tests...');
      const results = this.runner.executeAllTests(testCases);

      // Calculate metrics
      const metrics = this.runner.calculateMetrics(results, capability);
      console.log(`   Passed: ${metrics.passed}/${metrics.total}`);
      console.log(`   Success Rate: ${(metrics.successRate * 100).toFixed(1)}%`);

      // Save evidence
      console.log('\n💾 Saving evidence...');
      const evidencePath = this.collector.saveEvidence(
        capabilityName,
        testCases,
        results,
        metrics
      );
      console.log(`   Evidence saved to: ${evidencePath}`);

      // Generate report
      console.log('\n📊 Generating calibration report...');
      const reportPath = this.collector.generateReport(
        capabilityName,
        capability,
        testCases,
        results,
        metrics
      );
      console.log(`   Report saved to: ${reportPath}`);

      // Display summary
      const confidenceScore = this.collector.calculateConfidenceScore(metrics);
      console.log('\n' + '='.repeat(60));
      console.log(`✨ CALIBRATION COMPLETE`);
      console.log(`   Confidence Score: ${confidenceScore}%`);
      console.log(`   Status: ${this.getStatusLabel(confidenceScore)}`);
      console.log('='.repeat(60) + '\n');

      return {
        capability: capabilityName,
        confidenceScore,
        metrics,
        reportPath,
        evidencePath
      };
    } catch (error) {
      console.error(`\n❌ Error calibrating ${capabilityName}:`, error.message);
      throw error;
    }
  }

  /**
   * Get status label based on confidence score
   * @param {number} score - Confidence score (0-100)
   * @returns {string} Status label
   */
  getStatusLabel(score) {
    if (score >= 80) return '🟢 Excellent';
    if (score >= 60) return '🟡 Good';
    if (score >= 40) return '🟠 Fair';
    return '🔴 Needs Improvement';
  }

  /**
   * Run calibration for all available capabilities
   */
  async calibrateAll() {
    const capabilities = this.loader.listCapabilities();

    if (capabilities.length === 0) {
      console.log('No capabilities found to calibrate.');
      return;
    }

    console.log(`\n🚀 Running calibration for ${capabilities.length} capabilities...\n`);

    const results = [];
    for (const capability of capabilities) {
      try {
        const result = await this.calibrateCapability(capability);
        results.push(result);
      } catch (error) {
        console.error(`Failed to calibrate ${capability}:`, error.message);
      }
    }

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('📈 CALIBRATION SUMMARY');
    console.log('='.repeat(60));
    for (const result of results) {
      console.log(`${result.capability}: ${result.confidenceScore}% - ${this.getStatusLabel(result.confidenceScore)}`);
    }
    console.log('='.repeat(60) + '\n');
  }

  /**
   * List available capabilities
   */
  listCapabilities() {
    const capabilities = this.loader.listCapabilities();

    console.log('\n📚 Available Capabilities:\n');

    if (capabilities.length === 0) {
      console.log('  No capabilities found.');
    } else {
      capabilities.forEach((cap, idx) => {
        console.log(`  ${idx + 1}. ${cap}`);
      });
    }

    console.log('');
  }
}

// CLI handling
const args = process.argv.slice(2);
const runner = new CalibrationRunner();

if (args.length === 0) {
  console.log(`
🎯 Calibration Framework

Usage:
  node calibrate.js --capability <name>  Calibrate a specific capability
  node calibrate.js --all                Calibrate all capabilities
  node calibrate.js --list               List available capabilities
  node calibrate.js --help               Show this help message

Examples:
  node calibrate.js --capability string-manipulation
  node calibrate.js --all
`);
  process.exit(0);
}

const command = args[0];

switch (command) {
  case '--capability':
    if (!args[1]) {
      console.error('Error: Please specify a capability name');
      process.exit(1);
    }
    runner.calibrateCapability(args[1]).catch(err => {
      console.error('Calibration failed:', err);
      process.exit(1);
    });
    break;

  case '--all':
    runner.calibrateAll().catch(err => {
      console.error('Calibration failed:', err);
      process.exit(1);
    });
    break;

  case '--list':
    runner.listCapabilities();
    break;

  case '--help':
    console.log(`
🎯 Calibration Framework

This tool helps assess AI capabilities through automated test generation and execution.

Commands:
  --capability <name>   Run calibration for a specific capability
  --all                 Run calibration for all available capabilities
  --list                List all available capabilities
  --help                Show this help message

Workflow:
  1. Load capability definition (JSON)
  2. Generate test cases based on templates
  3. Execute tests and collect results
  4. Calculate metrics and confidence scores
  5. Generate evidence and reports
`);
    break;

  default:
    console.error(`Unknown command: ${command}`);
    console.log('Run "node calibrate.js --help" for usage information');
    process.exit(1);
}
