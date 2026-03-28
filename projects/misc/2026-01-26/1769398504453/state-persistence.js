/**
 * State Persistence Layer
 *
 * A lightweight, file-based key-value store for agent state management.
 * Provides atomic operations, namespaces, and TTL support.
 *
 * Features:
 * - JSON-based storage for portability
 * - Atomic read-modify-write operations
 * - Namespace support for multi-agent scenarios
 * - TTL (time-to-live) for automatic cleanup
 * - Query capabilities (prefix, pattern matching)
 */

const fs = require('fs').promises;
const path = require('path');

class AgentStateStore {
  constructor(storePath = './.agent-state') {
    this.storePath = storePath;
    this.cache = new Map();
    this.locks = new Map();
  }

  /**
   * Initialize the store (create directory if needed)
   */
  async init() {
    try {
      await fs.mkdir(this.storePath, { recursive: true });
      await this.load();
    } catch (error) {
      throw new Error(`Failed to initialize state store: ${error.message}`);
    }
  }

  /**
   * Load all state from disk into memory cache
   */
  async load() {
    try {
      const files = await fs.readdir(this.storePath);
      for (const file of files) {
        if (file.endsWith('.json')) {
          const namespace = file.replace('.json', '');
          const content = await fs.readFile(
            path.join(this.storePath, file),
            'utf-8'
          );
          this.cache.set(namespace, JSON.parse(content));
        }
      }
    } catch (error) {
      // If directory doesn't exist or is empty, that's okay
      if (error.code !== 'ENOENT') {
        throw error;
      }
    }
  }

  /**
   * Get the file path for a namespace
   */
  _getNamespacePath(namespace) {
    return path.join(this.storePath, `${namespace}.json`);
  }

  /**
   * Acquire a lock for a namespace (simple mutex with timeout)
   */
  async _acquireLock(namespace, timeout = 5000) {
    const startTime = Date.now();
    while (this.locks.get(namespace)) {
      if (Date.now() - startTime > timeout) {
        throw new Error(`Failed to acquire lock for namespace "${namespace}" after ${timeout}ms`);
      }
      await new Promise(resolve => setTimeout(resolve, 10));
    }
    this.locks.set(namespace, true);
  }

  /**
   * Release a lock for a namespace
   */
  _releaseLock(namespace) {
    this.locks.delete(namespace);
  }

  /**
   * Get namespace data (in memory)
   */
  _getNamespace(namespace) {
    if (!this.cache.has(namespace)) {
      this.cache.set(namespace, {});
    }
    return this.cache.get(namespace);
  }

  /**
   * Persist namespace to disk (atomic write)
   */
  async _persistNamespace(namespace) {
    const data = this._getNamespace(namespace);
    const filePath = this._getNamespacePath(namespace);
    const tempPath = `${filePath}.tmp`;

    try {
      // Write to temp file first
      await fs.writeFile(tempPath, JSON.stringify(data, null, 2), 'utf-8');
      // Atomic rename
      await fs.rename(tempPath, filePath);
    } catch (error) {
      // Clean up temp file if it exists
      try {
        await fs.unlink(tempPath);
      } catch {}
      throw new Error(`Failed to persist namespace ${namespace}: ${error.message}`);
    }
  }

  /**
   * Internal set without lock (assumes lock is already held)
   */
  async _setInternal(key, value, namespace, ttl = null) {
    const data = this._getNamespace(namespace);

    data[key] = {
      value,
      createdAt: Date.now(),
      expiresAt: ttl ? Date.now() + ttl : null
    };

    await this._persistNamespace(namespace);
  }

  /**
   * Set a value in the store
   *
   * @param {string} key - The key to set
   * @param {any} value - The value to store (must be JSON serializable)
   * @param {object} options - Options (namespace, ttl)
   * @returns {Promise<void>}
   */
  async set(key, value, options = {}) {
    const { namespace = 'default', ttl = null } = options;

    await this._acquireLock(namespace);
    try {
      await this._setInternal(key, value, namespace, ttl);
    } finally {
      this._releaseLock(namespace);
    }
  }

  /**
   * Internal get without lock (assumes lock is already held if needed)
   */
  _getInternal(key, namespace, defaultValue = null) {
    const data = this._getNamespace(namespace);
    const entry = data[key];

    if (!entry) {
      return defaultValue;
    }

    // Check TTL (note: we just skip expired, don't delete here to avoid lock issues)
    if (entry.expiresAt && entry.expiresAt < Date.now()) {
      return defaultValue;
    }

    return entry.value;
  }

  /**
   * Get a value from the store
   *
   * @param {string} key - The key to retrieve
   * @param {object} options - Options (namespace, defaultValue)
   * @returns {Promise<any>} The value, or defaultValue if not found
   */
  async get(key, options = {}) {
    const { namespace = 'default', defaultValue = null } = options;
    return this._getInternal(key, namespace, defaultValue);
  }

  /**
   * Delete a key from the store
   *
   * @param {string} key - The key to delete
   * @param {object} options - Options (namespace)
   * @returns {Promise<boolean>} True if key was deleted, false if not found
   */
  async delete(key, options = {}) {
    const { namespace = 'default' } = options;

    await this._acquireLock(namespace);
    try {
      const data = this._getNamespace(namespace);
      const existed = key in data;

      if (existed) {
        delete data[key];
        await this._persistNamespace(namespace);
      }

      return existed;
    } finally {
      this._releaseLock(namespace);
    }
  }

  /**
   * Check if a key exists
   *
   * @param {string} key - The key to check
   * @param {object} options - Options (namespace)
   * @returns {Promise<boolean>}
   */
  async has(key, options = {}) {
    const { namespace = 'default' } = options;
    const data = this._getNamespace(namespace);
    const entry = data[key];

    if (!entry) {
      return false;
    }

    // Check TTL
    if (entry.expiresAt && entry.expiresAt < Date.now()) {
      await this.delete(key, { namespace });
      return false;
    }

    return true;
  }

  /**
   * Get all keys matching a prefix
   *
   * @param {string} prefix - The prefix to match
   * @param {object} options - Options (namespace)
   * @returns {Promise<string[]>} Array of matching keys
   */
  async keys(prefix = '', options = {}) {
    const { namespace = 'default' } = options;
    const data = this._getNamespace(namespace);

    return Object.keys(data)
      .filter(key => key.startsWith(prefix))
      .filter(key => {
        const entry = data[key];
        return !entry.expiresAt || entry.expiresAt >= Date.now();
      });
  }

  /**
   * Get all entries matching a prefix
   *
   * @param {string} prefix - The prefix to match
   * @param {object} options - Options (namespace)
   * @returns {Promise<object>} Object with key-value pairs
   */
  async query(prefix = '', options = {}) {
    const { namespace = 'default' } = options;
    const matchingKeys = await this.keys(prefix, { namespace });
    const result = {};

    for (const key of matchingKeys) {
      result[key] = await this.get(key, { namespace });
    }

    return result;
  }

  /**
   * Update a value atomically with a function
   *
   * @param {string} key - The key to update
   * @param {function} updateFn - Function that receives current value and returns new value
   * @param {object} options - Options (namespace, defaultValue)
   * @returns {Promise<any>} The new value
   */
  async update(key, updateFn, options = {}) {
    const { namespace = 'default', defaultValue = null } = options;

    await this._acquireLock(namespace);
    try {
      const currentValue = this._getInternal(key, namespace, defaultValue);
      const newValue = updateFn(currentValue);
      await this._setInternal(key, newValue, namespace);
      return newValue;
    } finally {
      this._releaseLock(namespace);
    }
  }

  /**
   * Clear all data in a namespace
   *
   * @param {object} options - Options (namespace)
   * @returns {Promise<void>}
   */
  async clear(options = {}) {
    const { namespace = 'default' } = options;

    await this._acquireLock(namespace);
    try {
      this.cache.set(namespace, {});
      await this._persistNamespace(namespace);
    } finally {
      this._releaseLock(namespace);
    }
  }

  /**
   * Get stats about the store
   *
   * @param {object} options - Options (namespace)
   * @returns {Promise<object>} Stats object
   */
  async stats(options = {}) {
    const { namespace = 'default' } = options;
    const data = this._getNamespace(namespace);

    const keys = Object.keys(data);
    const now = Date.now();
    let expiredCount = 0;
    let totalSize = 0;

    for (const key of keys) {
      const entry = data[key];
      if (entry.expiresAt && entry.expiresAt < now) {
        expiredCount++;
      }
      totalSize += JSON.stringify(entry).length;
    }

    return {
      namespace,
      totalKeys: keys.length,
      activeKeys: keys.length - expiredCount,
      expiredKeys: expiredCount,
      approximateSizeBytes: totalSize
    };
  }

  /**
   * Clean up expired entries
   *
   * @param {object} options - Options (namespace)
   * @returns {Promise<number>} Number of entries cleaned
   */
  async cleanup(options = {}) {
    const { namespace = 'default' } = options;

    await this._acquireLock(namespace);
    try {
      const data = this._getNamespace(namespace);
      const now = Date.now();
      let cleanedCount = 0;

      for (const key of Object.keys(data)) {
        const entry = data[key];
        if (entry.expiresAt && entry.expiresAt < now) {
          delete data[key];
          cleanedCount++;
        }
      }

      if (cleanedCount > 0) {
        await this._persistNamespace(namespace);
      }

      return cleanedCount;
    } finally {
      this._releaseLock(namespace);
    }
  }
}

module.exports = { AgentStateStore };
