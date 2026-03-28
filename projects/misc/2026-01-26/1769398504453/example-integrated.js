/**
 * Integration Example: State Persistence + Multi-Agent Coordination
 *
 * Demonstrates how both capabilities work together to create a powerful
 * autonomous agent system that can:
 * - Coordinate multiple agents working in parallel
 * - Share state between agents via the persistence layer
 * - Track and aggregate results across agent runs
 * - Resume work after interruptions
 */

const { AgentStateStore } = require('./state-persistence');
const { MultiAgentCoordinator } = require('./multi-agent-coordinator');

/**
 * Enhanced Coordinator that integrates with shared state
 */
class IntegratedAgentSystem {
  constructor(options = {}) {
    this.store = new AgentStateStore(options.storePath || './.integrated-state');
    this.coordinator = new MultiAgentCoordinator({
      ...options,
      stateStorePath: options.coordinatorPath || './.coordinator-state'
    });

    this.projectId = options.projectId || `project-${Date.now()}`;
  }

  async init() {
    await this.store.init();
    await this.coordinator.init();

    // Load project context
    const context = await this.store.get(`project:${this.projectId}:context`, {
      defaultValue: {
        created: Date.now(),
        totalTasks: 0,
        completedTasks: 0
      }
    });

    this.context = context;

    // Set up event handlers to track progress in shared state
    this.coordinator.on('task:completed', async (task) => {
      await this._onTaskCompleted(task);
    });

    this.coordinator.on('task:failed', async (task) => {
      await this._onTaskFailed(task);
    });
  }

  async _onTaskCompleted(task) {
    // Store task result in shared state
    await this.store.set(
      `result:${task.id}`,
      {
        taskId: task.id,
        agentType: task.agentType,
        result: task.result,
        completedAt: task.completedAt,
        duration: task.completedAt - task.startedAt
      },
      { namespace: this.projectId }
    );

    // Update project context
    this.context.completedTasks++;
    await this._saveContext();

    // Update shared insights
    await this._updateSharedInsights(task);
  }

  async _onTaskFailed(task) {
    // Log failure in shared state
    await this.store.set(
      `failure:${task.id}`,
      {
        taskId: task.id,
        agentType: task.agentType,
        error: task.error,
        failedAt: task.completedAt,
        retries: task.retries
      },
      { namespace: this.projectId }
    );
  }

  async _updateSharedInsights(task) {
    // Agents can contribute to shared insights that others can use
    const insights = await this.store.get(`insights:${task.agentType}`, {
      namespace: this.projectId,
      defaultValue: []
    });

    insights.push({
      taskId: task.id,
      summary: task.result?.summary || 'No summary',
      timestamp: Date.now()
    });

    // Keep only last 10 insights per agent type
    if (insights.length > 10) {
      insights.shift();
    }

    await this.store.set(`insights:${task.agentType}`, insights, {
      namespace: this.projectId
    });
  }

  async _saveContext() {
    await this.store.set(`project:${this.projectId}:context`, this.context);
  }

  /**
   * Run a research project with multiple specialized agents
   */
  async runResearchProject(topic) {
    console.log(`\n=== Starting Research Project: ${topic} ===\n`);

    // Define research tasks
    const researchTasks = [
      {
        description: `Research current best practices for ${topic}`,
        agentType: 'research',
        priority: 10
      },
      {
        description: `Analyze security implications of ${topic}`,
        agentType: 'security',
        priority: 9
      },
      {
        description: `Evaluate performance considerations for ${topic}`,
        agentType: 'performance',
        priority: 8
      },
      {
        description: `Review existing implementations of ${topic}`,
        agentType: 'code-analysis',
        priority: 7
      },
      {
        description: `Compile documentation and examples for ${topic}`,
        agentType: 'documentation',
        priority: 6
      }
    ];

    // Store project metadata
    await this.store.set(`project:${this.projectId}:metadata`, {
      topic,
      startedAt: Date.now(),
      taskCount: researchTasks.length
    });

    this.context.totalTasks += researchTasks.length;
    await this._saveContext();

    // Add tasks to coordinator
    const tasks = await this.coordinator.addTasks(researchTasks);
    console.log(`Dispatched ${tasks.length} tasks to specialized agents\n`);

    // Monitor progress
    const progressInterval = setInterval(async () => {
      const status = this.coordinator.getStatus();
      const ctx = await this.store.get(`project:${this.projectId}:context`);

      console.log(`Progress: ${status.completed}/${status.total} tasks completed`);
      console.log(`Project context: ${ctx.completedTasks}/${ctx.totalTasks} total tasks`);
    }, 2000);

    // Wait for completion
    await this.coordinator.waitForAll(60000);
    clearInterval(progressInterval);

    console.log('\n✓ All research tasks completed\n');

    // Generate final report using shared state
    return await this._generateReport();
  }

  /**
   * Generate a comprehensive report from all agent results
   */
  async _generateReport() {
    console.log('Generating comprehensive report...\n');

    // Get all results from shared state
    const results = await this.store.query('result:', { namespace: this.projectId });

    // Get all insights
    const allInsights = await this.store.query('insights:', { namespace: this.projectId });

    // Aggregate by agent type
    const byAgentType = {};

    for (const [key, result] of Object.entries(results)) {
      const agentType = result.agentType;
      if (!byAgentType[agentType]) {
        byAgentType[agentType] = [];
      }
      byAgentType[agentType].push(result);
    }

    const report = {
      projectId: this.projectId,
      generatedAt: Date.now(),
      summary: {
        totalTasks: this.context.totalTasks,
        completedTasks: this.context.completedTasks,
        agentTypes: Object.keys(byAgentType).length
      },
      resultsByAgent: byAgentType,
      insights: allInsights,
      recommendations: await this._generateRecommendations(byAgentType)
    };

    // Store the report
    await this.store.set(`project:${this.projectId}:report`, report);

    return report;
  }

  /**
   * Generate recommendations based on agent findings
   */
  async _generateRecommendations(resultsByAgent) {
    const recommendations = [];

    // Synthesize insights from different agents
    if (resultsByAgent.security) {
      recommendations.push({
        category: 'Security',
        priority: 'high',
        summary: 'Review security findings from security agent',
        taskCount: resultsByAgent.security.length
      });
    }

    if (resultsByAgent.performance) {
      recommendations.push({
        category: 'Performance',
        priority: 'medium',
        summary: 'Implement performance optimizations identified',
        taskCount: resultsByAgent.performance.length
      });
    }

    if (resultsByAgent.documentation) {
      recommendations.push({
        category: 'Documentation',
        priority: 'low',
        summary: 'Update documentation based on findings',
        taskCount: resultsByAgent.documentation.length
      });
    }

    return recommendations;
  }

  /**
   * Resume a previous project
   */
  async resumeProject(projectId) {
    console.log(`\n=== Resuming Project: ${projectId} ===\n`);

    this.projectId = projectId;

    // Load project context
    const metadata = await this.store.get(`project:${projectId}:metadata`);
    const context = await this.store.get(`project:${projectId}:context`);

    if (!metadata || !context) {
      throw new Error(`Project ${projectId} not found`);
    }

    console.log('Loaded project metadata:', metadata);
    console.log('Project context:', context);
    console.log('');

    // Check if there's an existing report
    const existingReport = await this.store.get(`project:${projectId}:report`);

    if (existingReport) {
      console.log('Found existing report:');
      console.log(`- Generated at: ${new Date(existingReport.generatedAt).toISOString()}`);
      console.log(`- Completed tasks: ${existingReport.summary.completedTasks}`);
      console.log(`- Agent types: ${existingReport.summary.agentTypes}`);
      console.log('');
      return existingReport;
    }

    return null;
  }

  /**
   * Get status across all projects
   */
  async getGlobalStatus() {
    const allProjects = await this.store.keys('project:', {});
    const projectIds = new Set();

    // Extract unique project IDs
    allProjects.forEach(key => {
      const match = key.match(/project:([^:]+):/);
      if (match) {
        projectIds.add(match[1]);
      }
    });

    const status = {
      totalProjects: projectIds.size,
      projects: []
    };

    for (const projectId of projectIds) {
      const metadata = await this.store.get(`project:${projectId}:metadata`);
      const context = await this.store.get(`project:${projectId}:context`);

      if (metadata && context) {
        status.projects.push({
          projectId,
          topic: metadata.topic,
          completedTasks: context.completedTasks,
          totalTasks: context.totalTasks,
          progress: (context.completedTasks / context.totalTasks * 100).toFixed(1) + '%'
        });
      }
    }

    return status;
  }
}

/**
 * Demo: Run an integrated research project
 */
async function demonstrateIntegration() {
  console.log('=== Integrated Agent System Demo ===');

  const system = new IntegratedAgentSystem({
    projectId: `research-${Date.now()}`
  });

  await system.init();

  // Run a research project
  const report = await system.runResearchProject('microservices architecture');

  // Display report
  console.log('=== Final Report ===\n');
  console.log('Summary:');
  console.log(`  Total tasks: ${report.summary.totalTasks}`);
  console.log(`  Completed: ${report.summary.completedTasks}`);
  console.log(`  Agent types involved: ${report.summary.agentTypes}`);
  console.log('');

  console.log('Results by Agent:');
  for (const [agentType, results] of Object.entries(report.resultsByAgent)) {
    console.log(`\n  ${agentType}:`);
    results.forEach((result, idx) => {
      console.log(`    ${idx + 1}. ${result.result.summary}`);
      console.log(`       Duration: ${result.duration}ms`);
    });
  }

  console.log('\nRecommendations:');
  report.recommendations.forEach((rec, idx) => {
    console.log(`  ${idx + 1}. [${rec.priority.toUpperCase()}] ${rec.category}`);
    console.log(`     ${rec.summary}`);
  });

  console.log('\n=== Demo Complete ===');

  return report;
}

/**
 * Demo: Resume and review previous projects
 */
async function demonstrateResumption() {
  console.log('\n=== Project Resumption Demo ===');

  // Create and run first project
  const system1 = new IntegratedAgentSystem({
    projectId: 'demo-project-1'
  });
  await system1.init();

  console.log('\nRunning initial project...');
  await system1.runResearchProject('authentication systems');

  // Simulate agent restart - create new system instance
  console.log('\n--- Simulating system restart ---\n');

  const system2 = new IntegratedAgentSystem();
  await system2.init();

  // Get global status
  const globalStatus = await system2.getGlobalStatus();
  console.log('Global Status:');
  console.log(`  Total projects: ${globalStatus.totalProjects}`);
  globalStatus.projects.forEach(proj => {
    console.log(`    - ${proj.projectId}: ${proj.topic} (${proj.progress})`);
  });

  // Resume the project
  const report = await system2.resumeProject('demo-project-1');

  if (report) {
    console.log('\nSuccessfully loaded previous report!');
    console.log(`Report generated at: ${new Date(report.generatedAt).toISOString()}`);
  }

  console.log('\n=== Resumption Demo Complete ===');
}

// Run demos
if (require.main === module) {
  (async () => {
    try {
      await demonstrateIntegration();
      await demonstrateResumption();
    } catch (error) {
      console.error('Demo error:', error);
    }
  })();
}

module.exports = {
  IntegratedAgentSystem,
  demonstrateIntegration,
  demonstrateResumption
};
