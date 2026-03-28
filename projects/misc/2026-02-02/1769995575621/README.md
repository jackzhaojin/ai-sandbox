# Calibration Project Delivery Framework

A self-calibration system for assessing AI agent capabilities through automated test generation, execution, and evidence collection.

## What This Demonstrates

This project demonstrates **Calibration Project Delivery** by:

1. **Capability Assessment Design** - Framework for defining and measuring capabilities
2. **Test Case Creation** - Automated generation of test cases at varying difficulty levels
3. **Evidence Collection** - Structured logging and reporting of results with metrics

## How It Works

The calibration framework consists of:

1. **Capability Definitions** - JSON schemas that define what to test
2. **Test Generator** - Creates test cases based on capability specs
3. **Test Runner** - Executes tests and collects evidence
4. **Evidence Collector** - Aggregates results into calibration reports

## Quick Start

```bash
# Run a calibration assessment
node calibrate.js --capability string-manipulation

# Run all calibrations
node calibrate.js --all

# Generate a new capability template
node generate-capability.js my-capability
```

## Project Structure

```
.
├── calibrate.js              # Main calibration runner
├── lib/
│   ├── capability-loader.js  # Loads capability definitions
│   ├── test-generator.js     # Generates test cases
│   ├── test-runner.js        # Executes tests
│   └── evidence-collector.js # Collects and reports results
├── capabilities/             # Capability definitions
│   ├── string-manipulation.json
│   ├── data-processing.json
│   └── error-handling.json
├── test-cases/              # Generated test cases (auto-created)
├── evidence/                # Test results and evidence (auto-created)
└── reports/                 # Calibration reports (auto-created)
```

## Example Capability Definition

```json
{
  "name": "string-manipulation",
  "description": "Ability to transform and manipulate text strings",
  "difficulty_levels": ["basic", "intermediate", "advanced"],
  "test_categories": [
    "case_conversion",
    "substring_extraction",
    "pattern_matching",
    "formatting"
  ],
  "success_criteria": {
    "basic": 0.9,
    "intermediate": 0.7,
    "advanced": 0.5
  }
}
```

## Evidence Collection

Each test run produces:
- **Test Results** - Pass/fail status, execution time, error messages
- **Performance Metrics** - Success rate by difficulty level
- **Confidence Score** - Overall capability assessment (0-100%)
- **Detailed Report** - Markdown report with examples and analysis

## Built With

- Node.js (vanilla JavaScript)
- JSON for capability definitions
- Markdown for reports
