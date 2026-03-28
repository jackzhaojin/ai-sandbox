/**
 * Multi-Agent Coordinator
 *
 * Orchestrates multiple specialized agents to work on complex tasks in parallel.
 * Handles task decomposition, agent spawning, result aggregation, and error handling.
 *
 * Features:
 * - Parallel agent execution with task queue
 * - Result aggregation and synthesis
 * - Progress tracking and monitoring
 * - Error handling and retry logic
 * - Resource management (max concurrent agents)
 */

const { AgentStateStore } = require('./state-persistence');
const { EventEmitter } = require('events');

/**
 * Task status enumeration
 */
const TaskStatus = {
  PENDING: 'pending',
  RUNNING: 'running',
  COMPLETED: 'completed',
  FAILED: 'failed',
  CANCELLED: 'cancelled'
};

/**
 * Task definition
 */
class Task {
  constructor(id, description, agentType, priority = 0) {
    this.id = id;
    this.description = description;
    this.agentType = agentType;
    this.priority = priority;
    this.status = TaskStatus.PENDING;
    this.result = null;
    this.error = null;
    this.createdAt = Date.now();
    this.startedAt = null;
    this.completedAt = null;
    this.retries = 0;
    this.maxRetries = 3;
  }

  toJSON() {
    return {
      id: this.id,
      description: this.description,
      agentType: this.agentType,
      priority: this.priority,
      status: this.status,
      result: this.result,
      error: this.error,
      createdAt: this.createdAt,
      startedAt: this.startedAt,
      completedAt: this.completedAt,
      retries: this.retries,
      duration: this.completedAt ? this.completedAt - this.startedAt : null
    };
  }
}

/**
 * Multi-Agent Coordinator
 */
class MultiAgentCoordinator extends EventEmitter {
  constructor(options = {}) {
    super();

    this.options = {
      maxConcurrent: options.maxConcurrent || 3,
      stateStorePath: options.stateStorePath || './.coordinator-state',
      enablePersistence: options.enablePersistence !== false,
      retryDelay: options.retryDelay || 1000,
      ...options
    };

    this.tasks = new Map();
    this.runningTasks = new Set();
    this.store = null;
    this.sessionId = `session-${Date.now()}`;

    if (this.options.enablePersistence) {
      this.store = new AgentStateStore(this.options.stateStorePath);
    }
  }

  /**
   * Initialize the coordinator
   */
  async init() {
    if (this.store) {
      await this.store.init();
      await this._loadState();
    }
  }

  /**
   * Load state from persistence
   */
  async _loadState() {
    if (!this.store) return;

    const savedTasks = await this.store.query('task:', { namespace: this.sessionId });

    for (const [key, taskData] of Object.entries(savedTasks)) {
      const task = new Task(
        taskData.id,
        taskData.description,
        taskData.agentType,
        taskData.priority
      );

      Object.assign(task, taskData);
      this.tasks.set(task.id, task);
    }
  }

  /**
   * Save task state to persistence
   */
  async _saveTask(task) {
    if (!this.store) return;

    await this.store.set(`task:${task.id}`, task.toJSON(), {
      namespace: this.sessionId
    });
  }

  /**
   * Generate a unique task ID
   */
  _generateTaskId() {
    return `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Add a task to the queue
   *
   * @param {string} description - Task description
   * @param {string} agentType - Type of agent to execute the task
   * @param {number} priority - Task priority (higher = more important)
   * @returns {Promise<Task>} The created task
   */
  async addTask(description, agentType = 'general', priority = 0) {
    const task = new Task(
      this._generateTaskId(),
      description,
      agentType,
      priority
    );

    this.tasks.set(task.id, task);
    await this._saveTask(task);

    this.emit('task:added', task);

    // Try to start execution immediately
    this._processQueue();

    return task;
  }

  /**
   * Add multiple tasks at once
   *
   * @param {Array} taskDefinitions - Array of {description, agentType, priority}
   * @returns {Promise<Task[]>} Array of created tasks
   */
  async addTasks(taskDefinitions) {
    const tasks = await Promise.all(
      taskDefinitions.map(def =>
        this.addTask(def.description, def.agentType, def.priority)
      )
    );
    return tasks;
  }

  /**
   * Process the task queue
   */
  async _processQueue() {
    // Check if we can start more tasks
    const availableSlots = this.options.maxConcurrent - this.runningTasks.size;
    if (availableSlots <= 0) return;

    // Get pending tasks sorted by priority
    const pendingTasks = Array.from(this.tasks.values())
      .filter(task => task.status === TaskStatus.PENDING)
      .sort((a, b) => b.priority - a.priority);

    // Start as many tasks as we have slots for
    const tasksToStart = pendingTasks.slice(0, availableSlots);

    for (const task of tasksToStart) {
      this._executeTask(task);
    }
  }

  /**
   * Execute a single task
   */
  async _executeTask(task) {
    task.status = TaskStatus.RUNNING;
    task.startedAt = Date.now();
    this.runningTasks.add(task.id);

    await this._saveTask(task);
    this.emit('task:started', task);

    try {
      // Simulate agent execution (in real implementation, this would call the Claude Agent SDK)
      const result = await this._runAgent(task);

      task.status = TaskStatus.COMPLETED;
      task.result = result;
      task.completedAt = Date.now();

      this.emit('task:completed', task);
    } catch (error) {
      task.error = error.message;

      // Retry logic
      if (task.retries < task.maxRetries) {
        task.retries++;
        task.status = TaskStatus.PENDING;

        this.emit('task:retry', task);

        // Exponential backoff
        const delay = this.options.retryDelay * Math.pow(2, task.retries - 1);
        setTimeout(() => this._processQueue(), delay);
      } else {
        task.status = TaskStatus.FAILED;
        task.completedAt = Date.now();

        this.emit('task:failed', task);
      }
    } finally {
      this.runningTasks.delete(task.id);
      await this._saveTask(task);

      // Process next tasks in queue
      this._processQueue();
    }
  }

  /**
   * Run an agent for a task (stub for demonstration)
   * In production, this would integrate with the Claude Agent SDK
   */
  async _runAgent(task) {
    // Simulate agent work with varying durations
    const duration = 1000 + Math.random() * 2000;

    await new Promise(resolve => setTimeout(resolve, duration));

    // Simulate occasional failures
    if (Math.random() < 0.1 && task.retries === 0) {
      throw new Error('Simulated agent failure');
    }

    // Return simulated result
    return {
      agentType: task.agentType,
      taskId: task.id,
      summary: `Completed: ${task.description}`,
      details: {
        executionTime: duration,
        confidence: 0.85 + Math.random() * 0.15
      },
      timestamp: Date.now()
    };
  }

  /**
   * Wait for a specific task to complete
   *
   * @param {string} taskId - Task ID to wait for
   * @param {number} timeout - Timeout in milliseconds
   * @returns {Promise<Task>} The completed task
   */
  async waitForTask(taskId, timeout = 30000) {
    const task = this.tasks.get(taskId);
    if (!task) {
      throw new Error(`Task ${taskId} not found`);
    }

    if (task.status === TaskStatus.COMPLETED || task.status === TaskStatus.FAILED) {
      return task;
    }

    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error(`Task ${taskId} timed out`));
      }, timeout);

      const onComplete = (completedTask) => {
        if (completedTask.id === taskId) {
          clearTimeout(timer);
          this.removeListener('task:completed', onComplete);
          this.removeListener('task:failed', onFailed);
          resolve(completedTask);
        }
      };

      const onFailed = (failedTask) => {
        if (failedTask.id === taskId) {
          clearTimeout(timer);
          this.removeListener('task:completed', onComplete);
          this.removeListener('task:failed', onFailed);
          reject(new Error(`Task ${taskId} failed: ${failedTask.error}`));
        }
      };

      this.on('task:completed', onComplete);
      this.on('task:failed', onFailed);
    });
  }

  /**
   * Wait for all tasks to complete
   *
   * @param {number} timeout - Timeout in milliseconds
   * @returns {Promise<Task[]>} Array of all tasks
   */
  async waitForAll(timeout = 60000) {
    const startTime = Date.now();

    while (true) {
      const pendingCount = Array.from(this.tasks.values())
        .filter(task =>
          task.status === TaskStatus.PENDING ||
          task.status === TaskStatus.RUNNING
        ).length;

      if (pendingCount === 0) {
        break;
      }

      if (Date.now() - startTime > timeout) {
        throw new Error('Timeout waiting for all tasks to complete');
      }

      await new Promise(resolve => setTimeout(resolve, 100));
    }

    return Array.from(this.tasks.values());
  }

  /**
   * Aggregate results from multiple completed tasks
   *
   * @param {string[]} taskIds - Array of task IDs to aggregate (optional)
   * @returns {object} Aggregated results
   */
  aggregateResults(taskIds = null) {
    const tasksToAggregate = taskIds
      ? taskIds.map(id => this.tasks.get(id)).filter(t => t)
      : Array.from(this.tasks.values());

    const completed = tasksToAggregate.filter(t => t.status === TaskStatus.COMPLETED);
    const failed = tasksToAggregate.filter(t => t.status === TaskStatus.FAILED);

    const results = completed.map(t => t.result);
    const totalDuration = completed.reduce((sum, t) => sum + (t.completedAt - t.startedAt), 0);
    const avgDuration = completed.length > 0 ? totalDuration / completed.length : 0;

    return {
      total: tasksToAggregate.length,
      completed: completed.length,
      failed: failed.length,
      successRate: tasksToAggregate.length > 0
        ? completed.length / tasksToAggregate.length
        : 0,
      results,
      averageDuration: avgDuration,
      totalDuration,
      errors: failed.map(t => ({ taskId: t.id, error: t.error }))
    };
  }

  /**
   * Get status of all tasks
   *
   * @returns {object} Status summary
   */
  getStatus() {
    const tasks = Array.from(this.tasks.values());

    return {
      sessionId: this.sessionId,
      total: tasks.length,
      pending: tasks.filter(t => t.status === TaskStatus.PENDING).length,
      running: tasks.filter(t => t.status === TaskStatus.RUNNING).length,
      completed: tasks.filter(t => t.status === TaskStatus.COMPLETED).length,
      failed: tasks.filter(t => t.status === TaskStatus.FAILED).length,
      runningTasks: Array.from(this.runningTasks),
      maxConcurrent: this.options.maxConcurrent
    };
  }

  /**
   * Cancel a task
   *
   * @param {string} taskId - Task ID to cancel
   * @returns {Promise<boolean>} True if cancelled, false if not found or already completed
   */
  async cancelTask(taskId) {
    const task = this.tasks.get(taskId);
    if (!task) return false;

    if (task.status === TaskStatus.COMPLETED || task.status === TaskStatus.FAILED) {
      return false;
    }

    task.status = TaskStatus.CANCELLED;
    task.completedAt = Date.now();

    this.runningTasks.delete(taskId);
    await this._saveTask(task);

    this.emit('task:cancelled', task);

    return true;
  }

  /**
   * Clear all completed and failed tasks
   *
   * @returns {Promise<number>} Number of tasks cleared
   */
  async clearCompleted() {
    const toRemove = Array.from(this.tasks.values())
      .filter(t =>
        t.status === TaskStatus.COMPLETED ||
        t.status === TaskStatus.FAILED ||
        t.status === TaskStatus.CANCELLED
      );

    for (const task of toRemove) {
      this.tasks.delete(task.id);
      if (this.store) {
        await this.store.delete(`task:${task.id}`, { namespace: this.sessionId });
      }
    }

    return toRemove.length;
  }
}

module.exports = {
  MultiAgentCoordinator,
  TaskStatus,
  Task
};
