/**
 * Executes test cases and collects results
 */
export class TestRunner {
  constructor() {
    this.operations = this.initializeOperations();
  }

  /**
   * Initialize operation implementations
   * @returns {object} Map of operation names to functions
   */
  initializeOperations() {
    return {
      // String manipulation operations
      uppercase: (input) => input.toUpperCase(),
      lowercase: (input) => input.toLowerCase(),
      extract_word: (input, params) => {
        const words = input.split(' ');
        return words[params.index];
      },
      extract_numbers: (input) => {
        return input.match(/\d+/g) || [];
      },
      pad_left: (input, params) => {
        return String(input).padStart(params.width, params.char);
      },
      validate_email: (input) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(input);
      },

      // Data processing operations
      filter_even: (input) => input.filter(n => n % 2 === 0),
      sum: (input) => input.reduce((a, b) => a + b, 0),
      extract_names: (input) => input.map(obj => obj.name),
      sort_ascending: (input) => [...input].sort((a, b) => a - b),
      group_sum_by_category: (input) => {
        return input.reduce((acc, item) => {
          acc[item.category] = (acc[item.category] || 0) + item.value;
          return acc;
        }, {});
      },
      flatten_deep: (input) => {
        const flatten = (arr) => {
          return arr.reduce((acc, val) => {
            return Array.isArray(val) ? acc.concat(flatten(val)) : acc.concat(val);
          }, []);
        };
        return flatten(input);
      }
    };
  }

  /**
   * Execute a single test case
   * @param {object} testCase - Test case to execute
   * @returns {object} Test result
   */
  executeTest(testCase) {
    const startTime = Date.now();
    const result = {
      id: testCase.id,
      status: 'pending',
      passed: false,
      executionTime: 0,
      error: null,
      actual: null,
      expected: testCase.expected
    };

    try {
      const operation = this.operations[testCase.operation];
      if (!operation) {
        throw new Error(`Unknown operation: ${testCase.operation}`);
      }

      // Execute the operation
      const actual = operation(testCase.input, testCase.params);
      result.actual = actual;

      // Compare result with expected
      result.passed = this.compareResults(actual, testCase.expected);
      result.status = result.passed ? 'passed' : 'failed';
    } catch (error) {
      result.status = 'error';
      result.error = error.message;
    }

    result.executionTime = Date.now() - startTime;
    return result;
  }

  /**
   * Compare actual and expected results
   * @param {*} actual - Actual result
   * @param {*} expected - Expected result
   * @returns {boolean} Whether results match
   */
  compareResults(actual, expected) {
    // Handle arrays
    if (Array.isArray(expected)) {
      if (!Array.isArray(actual)) return false;
      if (actual.length !== expected.length) return false;
      return actual.every((val, idx) => this.compareResults(val, expected[idx]));
    }

    // Handle objects
    if (typeof expected === 'object' && expected !== null) {
      if (typeof actual !== 'object' || actual === null) return false;
      const expectedKeys = Object.keys(expected);
      const actualKeys = Object.keys(actual);
      if (expectedKeys.length !== actualKeys.length) return false;
      return expectedKeys.every(key => this.compareResults(actual[key], expected[key]));
    }

    // Handle primitives
    return actual === expected;
  }

  /**
   * Execute all test cases
   * @param {Array} testCases - Test cases to execute
   * @returns {Array} Test results
   */
  executeAllTests(testCases) {
    return testCases.map(testCase => this.executeTest(testCase));
  }

  /**
   * Calculate success metrics from test results
   * @param {Array} results - Test results
   * @param {object} capability - Capability definition
   * @returns {object} Success metrics
   */
  calculateMetrics(results, capability) {
    const metrics = {
      total: results.length,
      passed: 0,
      failed: 0,
      errors: 0,
      successRate: 0,
      byDifficulty: {},
      averageExecutionTime: 0
    };

    let totalTime = 0;

    for (const result of results) {
      if (result.status === 'passed') metrics.passed++;
      else if (result.status === 'failed') metrics.failed++;
      else if (result.status === 'error') metrics.errors++;

      totalTime += result.executionTime;
    }

    metrics.successRate = metrics.total > 0 ? metrics.passed / metrics.total : 0;
    metrics.averageExecutionTime = metrics.total > 0 ? totalTime / metrics.total : 0;

    // Calculate success rate by difficulty
    for (const level of capability.difficulty_levels || []) {
      const levelResults = results.filter(r => {
        const testCase = results.testCases?.find(tc => tc.id === r.id);
        return testCase?.difficulty === level;
      });

      if (levelResults.length > 0) {
        const levelPassed = levelResults.filter(r => r.status === 'passed').length;
        metrics.byDifficulty[level] = {
          total: levelResults.length,
          passed: levelPassed,
          successRate: levelPassed / levelResults.length
        };
      }
    }

    return metrics;
  }
}
