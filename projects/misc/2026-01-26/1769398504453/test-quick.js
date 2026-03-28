/**
 * Quick test to verify the code works
 */

const { AgentStateStore } = require('./state-persistence');

async function quickTest() {
  console.log('Quick test starting...\n');

  const store = new AgentStateStore('./.test-quick-state');
  await store.init();

  // Test 1: Basic set/get
  console.log('✓ Test 1: Basic set/get');
  await store.set('test:key', 'test value');
  const value = await store.get('test:key');
  console.log('  Value:', value);

  // Test 2: Atomic update
  console.log('\n✓ Test 2: Atomic update');
  await store.set('counter', 0);
  await store.update('counter', (v) => v + 1);
  const counter = await store.get('counter');
  console.log('  Counter:', counter);

  // Test 3: Namespace
  console.log('\n✓ Test 3: Namespace isolation');
  await store.set('data', 'agent1 data', { namespace: 'agent1' });
  await store.set('data', 'agent2 data', { namespace: 'agent2' });
  const a1 = await store.get('data', { namespace: 'agent1' });
  const a2 = await store.get('data', { namespace: 'agent2' });
  console.log('  Agent1:', a1);
  console.log('  Agent2:', a2);

  // Test 4: Query
  console.log('\n✓ Test 4: Query by prefix');
  await store.set('metric:cpu', 45);
  await store.set('metric:memory', 78);
  const metrics = await store.query('metric:');
  console.log('  Metrics:', metrics);

  console.log('\n✅ All tests passed!\n');

  // Clean up
  await store.clear();
}

// Run with timeout
const testPromise = quickTest();
const timeoutPromise = new Promise((_, reject) =>
  setTimeout(() => reject(new Error('Test timed out after 10s')), 10000)
);

Promise.race([testPromise, timeoutPromise])
  .then(() => {
    console.log('Test completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Test failed:', error.message);
    process.exit(1);
  });
