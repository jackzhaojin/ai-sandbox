import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Collects evidence and generates calibration reports
 */
export class EvidenceCollector {
  constructor(evidenceDir = null, reportsDir = null) {
    this.evidenceDir = evidenceDir || path.join(__dirname, '..', 'evidence');
    this.reportsDir = reportsDir || path.join(__dirname, '..', 'reports');
    this.ensureDirectories();
  }

  ensureDirectories() {
    if (!fs.existsSync(this.evidenceDir)) {
      fs.mkdirSync(this.evidenceDir, { recursive: true });
    }
    if (!fs.existsSync(this.reportsDir)) {
      fs.mkdirSync(this.reportsDir, { recursive: true });
    }
  }

  /**
   * Save test results as evidence
   * @param {string} capabilityName - Name of the capability
   * @param {Array} testCases - Original test cases
   * @param {Array} results - Test results
   * @param {object} metrics - Calculated metrics
   * @returns {string} Path to saved evidence file
   */
  saveEvidence(capabilityName, testCases, results, metrics) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `${capabilityName}-${timestamp}.json`;
    const filePath = path.join(this.evidenceDir, filename);

    const evidence = {
      capability: capabilityName,
      executedAt: new Date().toISOString(),
      testCases,
      results,
      metrics,
      summary: {
        totalTests: results.length,
        passed: metrics.passed,
        failed: metrics.failed,
        errors: metrics.errors,
        successRate: metrics.successRate,
        confidenceScore: this.calculateConfidenceScore(metrics)
      }
    };

    fs.writeFileSync(filePath, JSON.stringify(evidence, null, 2));
    return filePath;
  }

  /**
   * Calculate overall confidence score (0-100)
   * @param {object} metrics - Test metrics
   * @returns {number} Confidence score
   */
  calculateConfidenceScore(metrics) {
    // Base score on success rate
    let score = metrics.successRate * 100;

    // Penalize errors more than failures
    const errorPenalty = (metrics.errors / metrics.total) * 20;
    score -= errorPenalty;

    // Ensure score is between 0 and 100
    return Math.max(0, Math.min(100, Math.round(score)));
  }

  /**
   * Generate a markdown calibration report
   * @param {string} capabilityName - Name of the capability
   * @param {object} capability - Capability definition
   * @param {Array} testCases - Original test cases
   * @param {Array} results - Test results
   * @param {object} metrics - Calculated metrics
   * @returns {string} Path to generated report
   */
  generateReport(capabilityName, capability, testCases, results, metrics) {
    const confidenceScore = this.calculateConfidenceScore(metrics);
    const timestamp = new Date().toISOString();

    let report = `# Calibration Report: ${capability.description}\n\n`;
    report += `**Capability:** ${capabilityName}\n`;
    report += `**Generated:** ${timestamp}\n`;
    report += `**Confidence Score:** ${confidenceScore}%\n\n`;

    report += `## Executive Summary\n\n`;
    report += `- **Total Tests:** ${metrics.total}\n`;
    report += `- **Passed:** ${metrics.passed} (${(metrics.successRate * 100).toFixed(1)}%)\n`;
    report += `- **Failed:** ${metrics.failed}\n`;
    report += `- **Errors:** ${metrics.errors}\n`;
    report += `- **Avg Execution Time:** ${metrics.averageExecutionTime.toFixed(2)}ms\n\n`;

    // Success criteria assessment
    report += `## Success Criteria Assessment\n\n`;
    for (const [level, threshold] of Object.entries(capability.success_criteria || {})) {
      const levelMetric = metrics.byDifficulty[level];
      if (levelMetric) {
        const met = levelMetric.successRate >= threshold;
        const status = met ? '✅' : '❌';
        report += `- **${level}:** ${status} ${(levelMetric.successRate * 100).toFixed(1)}% `;
        report += `(threshold: ${(threshold * 100).toFixed(0)}%)\n`;
      }
    }
    report += `\n`;

    // Test results by category
    report += `## Results by Category\n\n`;
    const categories = {};
    for (let i = 0; i < testCases.length; i++) {
      const testCase = testCases[i];
      const result = results[i];
      if (!categories[testCase.category]) {
        categories[testCase.category] = [];
      }
      categories[testCase.category].push({ testCase, result });
    }

    for (const [category, items] of Object.entries(categories)) {
      const passed = items.filter(item => item.result.status === 'passed').length;
      report += `### ${category}\n\n`;
      report += `**Success Rate:** ${(passed / items.length * 100).toFixed(1)}% (${passed}/${items.length})\n\n`;

      for (const { testCase, result } of items) {
        const statusIcon = result.status === 'passed' ? '✅' : '❌';
        report += `${statusIcon} **${testCase.operation}** (${testCase.difficulty})\n`;
        report += `  - Input: \`${JSON.stringify(testCase.input)}\`\n`;
        report += `  - Expected: \`${JSON.stringify(testCase.expected)}\`\n`;
        if (result.status !== 'passed') {
          report += `  - Actual: \`${JSON.stringify(result.actual)}\`\n`;
          if (result.error) {
            report += `  - Error: ${result.error}\n`;
          }
        }
        report += `\n`;
      }
    }

    // Recommendations
    report += `## Recommendations\n\n`;
    if (confidenceScore >= 80) {
      report += `- Capability is well-developed and ready for production use\n`;
      report += `- Consider expanding to more advanced test cases\n`;
    } else if (confidenceScore >= 60) {
      report += `- Capability shows promise but needs improvement\n`;
      report += `- Focus on failed test cases to identify gaps\n`;
    } else {
      report += `- Capability requires significant development\n`;
      report += `- Review implementation approach and test coverage\n`;
    }

    // Save report
    const filename = `${capabilityName}-report.md`;
    const filePath = path.join(this.reportsDir, filename);
    fs.writeFileSync(filePath, report);

    return filePath;
  }

  /**
   * Load evidence from a file
   * @param {string} evidenceFile - Path to evidence file
   * @returns {object} Evidence data
   */
  loadEvidence(evidenceFile) {
    const content = fs.readFileSync(evidenceFile, 'utf8');
    return JSON.parse(content);
  }

  /**
   * List all evidence files for a capability
   * @param {string} capabilityName - Name of the capability
   * @returns {Array} Array of evidence file paths
   */
  listEvidence(capabilityName) {
    if (!fs.existsSync(this.evidenceDir)) {
      return [];
    }

    return fs.readdirSync(this.evidenceDir)
      .filter(file => file.startsWith(capabilityName) && file.endsWith('.json'))
      .map(file => path.join(this.evidenceDir, file));
  }
}
