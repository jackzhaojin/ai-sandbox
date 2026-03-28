/**
 * Example: State Persistence Layer Usage
 *
 * This demonstrates how agents can use the state store to:
 * - Remember user preferences across sessions
 * - Track task progress
 * - Cache expensive computations
 * - Share state between agents
 */

const { AgentStateStore } = require('./state-persistence');

async function demonstrateStatePersistence() {
  console.log('=== Agent State Persistence Demo ===\n');

  const store = new AgentStateStore();
  await store.init();

  // Example 1: User preferences
  console.log('1. Storing user preferences...');
  await store.set('user:preferences', {
    language: 'javascript',
    theme: 'dark',
    notifications: true
  });

  const prefs = await store.get('user:preferences');
  console.log('Retrieved preferences:', prefs);
  console.log('');

  // Example 2: Task progress tracking
  console.log('2. Tracking task progress...');
  await store.set('task:build:status', 'in_progress');
  await store.set('task:build:progress', 0);

  // Simulate progress updates
  for (let i = 25; i <= 100; i += 25) {
    await store.update('task:build:progress', (current) => i);
    console.log(`Build progress: ${i}%`);
  }

  await store.set('task:build:status', 'completed');
  console.log('Build completed!');
  console.log('');

  // Example 3: Caching with TTL
  console.log('3. Caching data with TTL (3 seconds)...');
  await store.set('cache:weather', {
    temp: 72,
    conditions: 'sunny'
  }, { ttl: 3000 });

  console.log('Cached data:', await store.get('cache:weather'));
  console.log('Waiting 3 seconds for expiration...');
  await new Promise(resolve => setTimeout(resolve, 3500));
  console.log('After expiration:', await store.get('cache:weather', { defaultValue: 'EXPIRED' }));
  console.log('');

  // Example 4: Multi-agent namespaces
  console.log('4. Using namespaces for different agents...');
  await store.set('findings', 'Security issue found', { namespace: 'security-agent' });
  await store.set('findings', 'Performance bottleneck detected', { namespace: 'performance-agent' });

  const securityFindings = await store.get('findings', { namespace: 'security-agent' });
  const perfFindings = await store.get('findings', { namespace: 'performance-agent' });

  console.log('Security agent findings:', securityFindings);
  console.log('Performance agent findings:', perfFindings);
  console.log('');

  // Example 5: Querying by prefix
  console.log('5. Querying keys by prefix...');
  await store.set('metric:requests:total', 1523);
  await store.set('metric:requests:errors', 12);
  await store.set('metric:latency:p50', 45);
  await store.set('metric:latency:p99', 230);

  const requestMetrics = await store.query('metric:requests:');
  const latencyMetrics = await store.query('metric:latency:');

  console.log('Request metrics:', requestMetrics);
  console.log('Latency metrics:', latencyMetrics);
  console.log('');

  // Example 6: Atomic updates
  console.log('6. Atomic counter updates...');
  await store.set('counter', 0);

  // Simulate multiple concurrent increments
  const increments = Array(5).fill(null).map((_, i) =>
    store.update('counter', (current) => current + 1)
  );

  await Promise.all(increments);
  const finalCount = await store.get('counter');
  console.log('Final counter value:', finalCount);
  console.log('');

  // Example 7: Stats and cleanup
  console.log('7. Store statistics and cleanup...');
  const stats = await store.stats();
  console.log('Store stats:', stats);

  const cleaned = await store.cleanup();
  console.log(`Cleaned up ${cleaned} expired entries`);
  console.log('');

  // Example 8: Session restoration
  console.log('8. Session restoration...');
  await store.set('session:last_query', 'Find all TODOs in the codebase');
  await store.set('session:context', {
    files_read: ['app.js', 'utils.js'],
    current_task: 'code_review'
  });

  // Simulate agent restart
  const newStore = new AgentStateStore();
  await newStore.init();

  const restoredQuery = await newStore.get('session:last_query');
  const restoredContext = await newStore.get('session:context');

  console.log('Restored last query:', restoredQuery);
  console.log('Restored context:', restoredContext);
  console.log('');

  console.log('=== Demo Complete ===');
}

// Run the demo
if (require.main === module) {
  demonstrateStatePersistence().catch(console.error);
}

module.exports = { demonstrateStatePersistence };
