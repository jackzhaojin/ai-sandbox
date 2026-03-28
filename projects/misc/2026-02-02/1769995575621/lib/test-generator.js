import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Generates test cases from capability definitions
 */
export class TestGenerator {
  constructor(outputDir = null) {
    this.outputDir = outputDir || path.join(__dirname, '..', 'test-cases');
    this.ensureOutputDir();
  }

  ensureOutputDir() {
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
    }
  }

  /**
   * Generate test cases for a capability
   * @param {object} capability - Capability definition
   * @returns {Array} Generated test cases
   */
  generateTestCases(capability) {
    const testCases = [];
    const templates = capability.test_templates || [];

    for (let i = 0; i < templates.length; i++) {
      const template = templates[i];
      testCases.push({
        id: `${capability.name}-${i + 1}`,
        capabilityName: capability.name,
        difficulty: template.difficulty,
        category: template.category,
        operation: template.operation,
        input: template.input,
        expected: template.expected,
        params: template.params || {},
        status: 'pending',
        timestamp: new Date().toISOString()
      });
    }

    return testCases;
  }

  /**
   * Save generated test cases to file
   * @param {string} capabilityName - Name of the capability
   * @param {Array} testCases - Test cases to save
   * @returns {string} Path to saved file
   */
  saveTestCases(capabilityName, testCases) {
    const filename = `${capabilityName}-tests.json`;
    const filePath = path.join(this.outputDir, filename);

    const data = {
      capability: capabilityName,
      generatedAt: new Date().toISOString(),
      totalTests: testCases.length,
      testCases
    };

    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    return filePath;
  }

  /**
   * Load test cases from file
   * @param {string} capabilityName - Name of the capability
   * @returns {object} Test cases data
   */
  loadTestCases(capabilityName) {
    const filename = `${capabilityName}-tests.json`;
    const filePath = path.join(this.outputDir, filename);

    if (!fs.existsSync(filePath)) {
      return null;
    }

    const content = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(content);
  }

  /**
   * Get test statistics
   * @param {Array} testCases - Test cases to analyze
   * @returns {object} Statistics about test cases
   */
  getTestStatistics(testCases) {
    const stats = {
      total: testCases.length,
      byDifficulty: {},
      byCategory: {},
      byStatus: {}
    };

    for (const testCase of testCases) {
      // Count by difficulty
      stats.byDifficulty[testCase.difficulty] = (stats.byDifficulty[testCase.difficulty] || 0) + 1;

      // Count by category
      stats.byCategory[testCase.category] = (stats.byCategory[testCase.category] || 0) + 1;

      // Count by status
      stats.byStatus[testCase.status] = (stats.byStatus[testCase.status] || 0) + 1;
    }

    return stats;
  }
}
