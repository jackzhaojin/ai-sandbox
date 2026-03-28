/**
 * Example: Multi-Agent Coordinator Usage
 *
 * Demonstrates how to orchestrate multiple specialized agents for complex tasks:
 * - Parallel task execution
 * - Progress monitoring
 * - Result aggregation
 * - Error handling and retries
 */

const { MultiAgentCoordinator } = require('./multi-agent-coordinator');

async function demonstrateCoordinator() {
  console.log('=== Multi-Agent Coordinator Demo ===\n');

  const coordinator = new MultiAgentCoordinator({
    maxConcurrent: 3,
    enablePersistence: true
  });

  await coordinator.init();

  // Set up event listeners
  coordinator.on('task:added', (task) => {
    console.log(`[ADDED] Task ${task.id}: ${task.description}`);
  });

  coordinator.on('task:started', (task) => {
    console.log(`[STARTED] Task ${task.id}: ${task.description}`);
  });

  coordinator.on('task:completed', (task) => {
    const duration = task.completedAt - task.startedAt;
    console.log(`[COMPLETED] Task ${task.id} in ${duration}ms`);
  });

  coordinator.on('task:failed', (task) => {
    console.log(`[FAILED] Task ${task.id}: ${task.error}`);
  });

  coordinator.on('task:retry', (task) => {
    console.log(`[RETRY] Task ${task.id} (attempt ${task.retries + 1})`);
  });

  console.log('1. Adding tasks for complex research project...\n');

  // Scenario: Research project with multiple specialized agents
  const tasks = await coordinator.addTasks([
    {
      description: 'Research security best practices for authentication',
      agentType: 'security',
      priority: 10
    },
    {
      description: 'Analyze performance bottlenecks in API endpoints',
      agentType: 'performance',
      priority: 8
    },
    {
      description: 'Review code quality and maintainability',
      agentType: 'code-quality',
      priority: 7
    },
    {
      description: 'Check accessibility compliance',
      agentType: 'accessibility',
      priority: 6
    },
    {
      description: 'Generate API documentation',
      agentType: 'documentation',
      priority: 5
    }
  ]);

  console.log(`\nAdded ${tasks.length} tasks to the queue`);
  console.log('Status:', coordinator.getStatus());
  console.log('');

  // Monitor progress
  console.log('2. Monitoring progress...\n');

  const progressInterval = setInterval(() => {
    const status = coordinator.getStatus();
    console.log(`Progress: ${status.completed}/${status.total} completed, ${status.running} running, ${status.pending} pending`);
  }, 1000);

  // Wait for all tasks to complete
  console.log('Waiting for all tasks to complete...\n');

  try {
    await coordinator.waitForAll(30000);
    clearInterval(progressInterval);

    console.log('\n3. All tasks completed!\n');

    // Get final status
    const finalStatus = coordinator.getStatus();
    console.log('Final status:', finalStatus);
    console.log('');

    // Aggregate results
    console.log('4. Aggregating results...\n');
    const aggregated = coordinator.aggregateResults();

    console.log('Aggregated Results:');
    console.log(`- Total tasks: ${aggregated.total}`);
    console.log(`- Completed: ${aggregated.completed}`);
    console.log(`- Failed: ${aggregated.failed}`);
    console.log(`- Success rate: ${(aggregated.successRate * 100).toFixed(1)}%`);
    console.log(`- Average duration: ${aggregated.averageDuration.toFixed(0)}ms`);
    console.log(`- Total duration: ${aggregated.totalDuration.toFixed(0)}ms`);
    console.log('');

    // Show individual results
    console.log('5. Individual results:\n');
    aggregated.results.forEach((result, index) => {
      console.log(`Result ${index + 1}:`);
      console.log(`  Agent: ${result.agentType}`);
      console.log(`  Summary: ${result.summary}`);
      console.log(`  Confidence: ${(result.details.confidence * 100).toFixed(1)}%`);
      console.log('');
    });

    // Show errors if any
    if (aggregated.errors.length > 0) {
      console.log('Errors:');
      aggregated.errors.forEach(err => {
        console.log(`  Task ${err.taskId}: ${err.error}`);
      });
      console.log('');
    }

  } catch (error) {
    clearInterval(progressInterval);
    console.error('Error waiting for tasks:', error.message);
  }

  console.log('=== Demo Complete ===');
}

async function demonstrateAdvancedFeatures() {
  console.log('\n=== Advanced Features Demo ===\n');

  const coordinator = new MultiAgentCoordinator({
    maxConcurrent: 2  // Lower concurrency to show queuing
  });

  await coordinator.init();

  console.log('1. Dynamic task priority...\n');

  // Add low priority task
  const lowPriorityTask = await coordinator.addTask(
    'Low priority background analysis',
    'general',
    1
  );

  // Add high priority task (should execute first)
  const highPriorityTask = await coordinator.addTask(
    'Critical security scan',
    'security',
    10
  );

  console.log('Added tasks with different priorities');
  console.log(`Low priority: ${lowPriorityTask.id}`);
  console.log(`High priority: ${highPriorityTask.id}`);
  console.log('');

  // Wait a bit to see which executes first
  await new Promise(resolve => setTimeout(resolve, 500));

  console.log('2. Task cancellation...\n');

  // Add a task and cancel it
  const cancelTask = await coordinator.addTask(
    'Task to be cancelled',
    'general',
    5
  );

  console.log(`Added task ${cancelTask.id}`);

  const cancelled = await coordinator.cancelTask(cancelTask.id);
  console.log(`Cancelled: ${cancelled}`);
  console.log('');

  // Wait for remaining tasks
  await coordinator.waitForAll(10000);

  console.log('3. Clearing completed tasks...\n');

  const clearedCount = await coordinator.clearCompleted();
  console.log(`Cleared ${clearedCount} completed tasks`);

  const status = coordinator.getStatus();
  console.log(`Remaining tasks: ${status.total}`);
  console.log('');

  console.log('=== Advanced Features Demo Complete ===');
}

// Run demos
if (require.main === module) {
  (async () => {
    try {
      await demonstrateCoordinator();
      await demonstrateAdvancedFeatures();
    } catch (error) {
      console.error('Demo error:', error);
    }
  })();
}

module.exports = {
  demonstrateCoordinator,
  demonstrateAdvancedFeatures
};
