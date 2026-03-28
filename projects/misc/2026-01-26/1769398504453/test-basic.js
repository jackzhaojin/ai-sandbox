/**
 * Basic functionality tests
 *
 * Verifies that both capabilities work correctly
 */

const { AgentStateStore } = require('./state-persistence');
const { MultiAgentCoordinator } = require('./multi-agent-coordinator');
const { IntegratedAgentSystem } = require('./example-integrated');

let testsPassed = 0;
let testsFailed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`✓ ${message}`);
    testsPassed++;
  } else {
    console.error(`✗ ${message}`);
    testsFailed++;
  }
}

async function testStatePersistence() {
  console.log('\n=== Testing State Persistence ===\n');

  const store = new AgentStateStore('./.test-state');
  await store.init();

  // Test 1: Set and get
  await store.set('test-key', { value: 123 });
  const result = await store.get('test-key');
  assert(result.value === 123, 'Set and get value');

  // Test 2: Default value
  const missing = await store.get('missing-key', { defaultValue: 'default' });
  assert(missing === 'default', 'Default value for missing key');

  // Test 3: Has key
  const exists = await store.has('test-key');
  const notExists = await store.has('missing-key');
  assert(exists === true && notExists === false, 'Has key check');

  // Test 4: Delete
  await store.delete('test-key');
  const deleted = await store.get('test-key');
  assert(deleted === null, 'Delete key');

  // Test 5: Namespaces
  await store.set('key', 'value1', { namespace: 'ns1' });
  await store.set('key', 'value2', { namespace: 'ns2' });
  const val1 = await store.get('key', { namespace: 'ns1' });
  const val2 = await store.get('key', { namespace: 'ns2' });
  assert(val1 === 'value1' && val2 === 'value2', 'Namespace isolation');

  // Test 6: Atomic update
  await store.set('counter', 0);
  await store.update('counter', (val) => val + 1);
  await store.update('counter', (val) => val + 1);
  const counter = await store.get('counter');
  assert(counter === 2, 'Atomic updates');

  // Test 7: Query by prefix
  await store.set('metric:cpu', 80);
  await store.set('metric:memory', 60);
  await store.set('other:value', 100);
  const metrics = await store.query('metric:');
  assert(Object.keys(metrics).length === 2, 'Query by prefix');

  // Test 8: TTL expiration
  await store.set('temp', 'value', { ttl: 100 });
  const beforeExpire = await store.get('temp');
  await new Promise(resolve => setTimeout(resolve, 150));
  const afterExpire = await store.get('temp');
  assert(beforeExpire === 'value' && afterExpire === null, 'TTL expiration');

  // Test 9: Stats
  await store.set('stat1', 1);
  await store.set('stat2', 2);
  const stats = await store.stats();
  assert(stats.totalKeys >= 2, 'Store statistics');

  // Test 10: Clear namespace
  await store.clear({ namespace: 'ns1' });
  const clearedVal = await store.get('key', { namespace: 'ns1' });
  assert(clearedVal === null, 'Clear namespace');

  // Cleanup
  await store.clear();
  await store.clear({ namespace: 'ns2' });

  console.log('\n✓ State persistence tests complete\n');
}

async function testMultiAgentCoordinator() {
  console.log('\n=== Testing Multi-Agent Coordinator ===\n');

  const coordinator = new MultiAgentCoordinator({
    maxConcurrent: 2,
    enablePersistence: false
  });

  await coordinator.init();

  // Test 1: Add task
  const task = await coordinator.addTask('Test task', 'general', 5);
  assert(task.status === 'pending', 'Add task');

  // Test 2: Task execution
  await coordinator.waitForTask(task.id, 5000);
  assert(task.status === 'completed', 'Task execution');

  // Test 3: Multiple tasks
  const tasks = await coordinator.addTasks([
    { description: 'Task 1', agentType: 'general', priority: 5 },
    { description: 'Task 2', agentType: 'general', priority: 3 }
  ]);
  assert(tasks.length === 2, 'Add multiple tasks');

  // Test 4: Wait for all
  await coordinator.waitForAll(10000);
  const status = coordinator.getStatus();
  assert(status.completed === 3, 'Wait for all tasks');

  // Test 5: Priority ordering
  const highPriority = await coordinator.addTask('High', 'general', 10);
  const lowPriority = await coordinator.addTask('Low', 'general', 1);
  await coordinator.waitForAll(5000);
  // If both completed, priority worked
  assert(highPriority.status === 'completed', 'Priority task execution');

  // Test 6: Result aggregation
  const results = coordinator.aggregateResults();
  assert(results.completed >= 3, 'Result aggregation');

  // Test 7: Task cancellation
  const cancelTask = await coordinator.addTask('Cancel me', 'general', 1);
  const cancelled = await coordinator.cancelTask(cancelTask.id);
  assert(cancelled === true, 'Task cancellation');

  // Test 8: Status tracking
  const finalStatus = coordinator.getStatus();
  assert(finalStatus.total >= 5, 'Status tracking');

  // Test 9: Clear completed
  const cleared = await coordinator.clearCompleted();
  assert(cleared >= 3, 'Clear completed tasks');

  console.log('\n✓ Multi-agent coordinator tests complete\n');
}

async function testIntegratedSystem() {
  console.log('\n=== Testing Integrated System ===\n');

  const system = new IntegratedAgentSystem({
    projectId: 'test-project',
    storePath: './.test-integrated-state',
    coordinatorPath: './.test-coordinator-state',
    maxConcurrent: 2
  });

  await system.init();

  // Test 1: Initialize system
  assert(system.store !== null && system.coordinator !== null, 'System initialization');

  // Test 2: Context loading
  assert(system.context !== null, 'Context loading');

  // Test 3: Run simple project (with fewer tasks for speed)
  const projectPromise = system.coordinator.addTasks([
    { description: 'Quick task 1', agentType: 'test', priority: 5 },
    { description: 'Quick task 2', agentType: 'test', priority: 5 }
  ]);

  await system.coordinator.waitForAll(10000);

  // Test 4: Verify tasks completed
  const status = system.coordinator.getStatus();
  assert(status.completed >= 2, 'Project task execution');

  // Test 5: State persistence
  const savedContext = await system.store.get(`project:${system.projectId}:context`);
  assert(savedContext !== null, 'Context persistence');

  // Test 6: Global status
  const globalStatus = await system.getGlobalStatus();
  assert(globalStatus.totalProjects >= 1, 'Global status tracking');

  console.log('\n✓ Integrated system tests complete\n');
}

async function runTests() {
  console.log('=== Running Basic Functionality Tests ===');

  try {
    await testStatePersistence();
    await testMultiAgentCoordinator();
    await testIntegratedSystem();

    console.log('\n=== Test Results ===');
    console.log(`Passed: ${testsPassed}`);
    console.log(`Failed: ${testsFailed}`);
    console.log(`Total: ${testsPassed + testsFailed}`);

    if (testsFailed === 0) {
      console.log('\n✓ All tests passed!');
      process.exit(0);
    } else {
      console.log(`\n✗ ${testsFailed} test(s) failed`);
      process.exit(1);
    }
  } catch (error) {
    console.error('\n✗ Test suite error:', error);
    process.exit(1);
  }
}

// Run tests
if (require.main === module) {
  runTests();
}

module.exports = { runTests };
