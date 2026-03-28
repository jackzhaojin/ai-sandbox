import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Loads capability definitions from JSON files
 */
export class CapabilityLoader {
  constructor(capabilitiesDir = null) {
    this.capabilitiesDir = capabilitiesDir || path.join(__dirname, '..', 'capabilities');
  }

  /**
   * Load a specific capability by name
   * @param {string} capabilityName - Name of the capability
   * @returns {object} Capability definition
   */
  loadCapability(capabilityName) {
    const filePath = path.join(this.capabilitiesDir, `${capabilityName}.json`);

    if (!fs.existsSync(filePath)) {
      throw new Error(`Capability not found: ${capabilityName}`);
    }

    const content = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(content);
  }

  /**
   * Load all available capabilities
   * @returns {Array} Array of capability definitions
   */
  loadAllCapabilities() {
    if (!fs.existsSync(this.capabilitiesDir)) {
      return [];
    }

    const files = fs.readdirSync(this.capabilitiesDir)
      .filter(file => file.endsWith('.json'));

    return files.map(file => {
      const content = fs.readFileSync(path.join(this.capabilitiesDir, file), 'utf8');
      return JSON.parse(content);
    });
  }

  /**
   * List available capability names
   * @returns {Array} Array of capability names
   */
  listCapabilities() {
    if (!fs.existsSync(this.capabilitiesDir)) {
      return [];
    }

    return fs.readdirSync(this.capabilitiesDir)
      .filter(file => file.endsWith('.json'))
      .map(file => file.replace('.json', ''));
  }

  /**
   * Validate capability definition structure
   * @param {object} capability - Capability definition to validate
   * @returns {object} Validation result with isValid and errors
   */
  validateCapability(capability) {
    const errors = [];

    // Required fields
    const requiredFields = ['name', 'description', 'difficulty_levels', 'test_categories', 'success_criteria'];
    for (const field of requiredFields) {
      if (!capability[field]) {
        errors.push(`Missing required field: ${field}`);
      }
    }

    // Validate difficulty levels
    if (capability.difficulty_levels && !Array.isArray(capability.difficulty_levels)) {
      errors.push('difficulty_levels must be an array');
    }

    // Validate test categories
    if (capability.test_categories && !Array.isArray(capability.test_categories)) {
      errors.push('test_categories must be an array');
    }

    // Validate success criteria
    if (capability.success_criteria && typeof capability.success_criteria !== 'object') {
      errors.push('success_criteria must be an object');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}
