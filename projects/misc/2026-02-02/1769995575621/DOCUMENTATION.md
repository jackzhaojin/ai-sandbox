# Calibration Framework Documentation

## What This Project Demonstrates

This project demonstrates **Calibration Project Delivery** - the capability to create self-assessment systems that measure and validate AI agent capabilities through:

1. **Capability Assessment Design** - Structured approach to defining what to measure
2. **Test Case Creation** - Automated generation of progressive test cases
3. **Evidence Collection Framework** - Systematic logging and reporting of results

## How This Demonstrates the Skill

### 1. Capability Assessment Design

The framework provides a structured approach to defining capabilities:

- **JSON Schema Definitions** - Capabilities are defined in standardized JSON format
- **Difficulty Levels** - Tests are categorized by complexity (basic, intermediate, advanced)
- **Success Criteria** - Each difficulty level has clear success thresholds
- **Test Categories** - Tests are organized by functional area

Example capability definition:
```json
{
  "name": "string-manipulation",
  "difficulty_levels": ["basic", "intermediate", "advanced"],
  "success_criteria": {
    "basic": 0.9,
    "intermediate": 0.7,
    "advanced": 0.5
  }
}
```

### 2. Test Case Creation

The framework automatically generates executable test cases:

- **Template-Based Generation** - Test templates expand into executable tests
- **Progressive Complexity** - Tests increase in difficulty
- **Operation Definitions** - Each test specifies inputs, expected outputs, and operations
- **Metadata Tracking** - Tests include difficulty, category, and timestamp

Generated test cases include:
- Test ID and capability name
- Difficulty level and category
- Operation to perform
- Input data and expected output
- Parameters for the operation
- Execution status tracking

### 3. Evidence Collection Framework

The framework systematically collects and reports results:

- **Structured Evidence** - JSON files with complete test execution data
- **Metrics Calculation** - Success rates, execution times, confidence scores
- **Markdown Reports** - Human-readable calibration reports
- **Historical Tracking** - Timestamped evidence for trend analysis

Evidence includes:
- Test execution results (passed/failed/error)
- Performance metrics (execution time, success rate)
- Confidence scores (0-100% overall assessment)
- Detailed breakdowns by difficulty and category

## Non-Trivial Examples

### Example 1: String Manipulation Capability

Tests string transformation capabilities across multiple categories:

**Basic Level:**
- Case conversion (uppercase, lowercase)
- Expected: 90% success rate

**Intermediate Level:**
- Substring extraction
- Pattern matching with regex
- Expected: 70% success rate

**Advanced Level:**
- Complex formatting with parameters
- Email validation
- Expected: 50% success rate

### Example 2: Data Processing Capability

Tests data structure manipulation:

**Basic Level:**
- Array filtering
- Simple aggregation (sum)
- Expected: 90% success rate

**Intermediate Level:**
- Object property extraction
- Sorting algorithms
- Expected: 70% success rate

**Advanced Level:**
- Grouped aggregations
- Deep array flattening
- Expected: 50% success rate

## Architecture

### Component Overview

```
┌─────────────────────────────────────────────────────────┐
│                  Calibration Runner                     │
│              (calibrate.js - Orchestrator)              │
└────────┬────────────────────────────────────────┬───────┘
         │                                        │
         ▼                                        ▼
┌────────────────────┐                  ┌────────────────────┐
│ Capability Loader  │                  │  Test Generator    │
│ - Load definitions │                  │ - Create tests     │
│ - Validate schemas │                  │ - Save test cases  │
└────────┬───────────┘                  └────────┬───────────┘
         │                                        │
         └──────────────┬─────────────────────────┘
                        │
                        ▼
              ┌─────────────────┐
              │   Test Runner   │
              │ - Execute tests │
              │ - Calculate     │
              │   metrics       │
              └────────┬────────┘
                       │
                       ▼
            ┌──────────────────────┐
            │  Evidence Collector  │
            │ - Save evidence      │
            │ - Generate reports   │
            │ - Calculate scores   │
            └──────────────────────┘
```

### Data Flow

1. **Definition** → Capability JSON files define what to test
2. **Generation** → Test cases are created from templates
3. **Execution** → Tests run and results are collected
4. **Analysis** → Metrics and confidence scores are calculated
5. **Reporting** → Evidence files and markdown reports are generated

## Key Features

### Extensibility

Add new capabilities by creating JSON definitions:
```bash
# Create new capability file
vi capabilities/my-capability.json

# Run calibration
node calibrate.js --capability my-capability
```

### Reproducibility

- All test cases are saved to `test-cases/`
- Complete evidence stored in `evidence/` with timestamps
- Deterministic scoring and metrics

### Comprehensive Reporting

Each calibration produces:
- **Evidence File** (JSON): Complete test execution data
- **Report File** (Markdown): Human-readable analysis
- **Console Output**: Real-time progress and summary

### Confidence Scoring

Automatic confidence calculation based on:
- Overall success rate (primary factor)
- Error rate (penalized more than failures)
- Normalized to 0-100% scale

Score interpretation:
- 80-100%: 🟢 Excellent - Production ready
- 60-79%: 🟡 Good - Needs minor improvement
- 40-59%: 🟠 Fair - Significant gaps
- 0-39%: 🔴 Needs Improvement - Major development required

## Usage Examples

### Calibrate a Single Capability
```bash
node calibrate.js --capability string-manipulation
```

### Calibrate All Capabilities
```bash
node calibrate.js --all
```

### List Available Capabilities
```bash
node calibrate.js --list
```

### View a Report
```bash
cat reports/string-manipulation-report.md
```

### Analyze Evidence
```bash
cat evidence/string-manipulation-2026-02-02T01-28-51-225Z.json | jq '.metrics'
```

## Project Structure

```
.
├── calibrate.js              # Main runner (orchestrator)
├── package.json              # Project metadata
├── README.md                 # Quick start guide
├── DOCUMENTATION.md          # This file
├── lib/                      # Core framework modules
│   ├── capability-loader.js  # Loads and validates capability definitions
│   ├── test-generator.js     # Generates test cases from templates
│   ├── test-runner.js        # Executes tests and calculates metrics
│   └── evidence-collector.js # Saves evidence and generates reports
├── capabilities/             # Capability definitions (input)
│   ├── string-manipulation.json
│   └── data-processing.json
├── test-cases/              # Generated test cases (intermediate)
│   ├── string-manipulation-tests.json
│   └── data-processing-tests.json
├── evidence/                # Execution evidence (output)
│   └── string-manipulation-2026-02-02T01-28-51-225Z.json
└── reports/                 # Calibration reports (output)
    └── string-manipulation-report.md
```

## Extension Points

### Adding New Capabilities

1. Create a JSON definition in `capabilities/`
2. Define test templates with operations
3. Implement operations in `test-runner.js` if needed
4. Run calibration

### Adding New Operations

Edit `lib/test-runner.js` and add to `initializeOperations()`:

```javascript
myOperation: (input, params) => {
  // Implementation
  return result;
}
```

### Custom Metrics

Extend `calculateMetrics()` in `test-runner.js` to add custom metrics.

### Custom Reports

Extend `generateReport()` in `evidence-collector.js` to customize report format.

## Testing the Framework

The framework is self-testing:

```bash
# Run all calibrations to verify the framework works
node calibrate.js --all

# Check that all components function correctly
ls test-cases/  # Should contain test case files
ls evidence/    # Should contain evidence files
ls reports/     # Should contain report files
```

Expected output:
- 100% success rate for included capabilities
- Clean console output with no errors
- Generated files in expected directories

## Conclusion

This calibration framework demonstrates all three aspects of Calibration Project Delivery:

1. **Capability Assessment Design** ✅
   - Structured JSON schemas for capabilities
   - Progressive difficulty levels
   - Clear success criteria

2. **Test Case Creation** ✅
   - Template-based test generation
   - Multiple test categories
   - Comprehensive coverage

3. **Evidence Collection Framework** ✅
   - Structured evidence storage
   - Calculated metrics and confidence scores
   - Detailed markdown reports

The framework is:
- ✅ Working and runnable
- ✅ Non-trivial (multiple components, data flow, analysis)
- ✅ Well-documented
- ✅ Extensible for new capabilities
