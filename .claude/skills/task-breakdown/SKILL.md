---
name: task-breakdown
description: Create detailed task specifications with step-by-step implementation instructions for complex features. Use after architecture documents exist, when breaking down multi-phase features into implementable tasks, defining dependencies and duration estimates, or creating detailed HOW-level instructions. Outputs to ai-docs/tasks/ directory. Triggers on "break down this feature into tasks", "create implementation tasks for...", or when detailed execution steps are needed after architectural design is complete.
---

# Task Breakdown

Create detailed, implementable task specifications from architectural designs.

## When to Use

Use this skill when:
- Architecture document exists for a feature
- Multi-phase feature needs breakdown into tasks
- Detailed step-by-step instructions required
- Dependencies and execution order must be clear

Do NOT use for:
- Requirements gathering (use prd-writer)
- High-level system design (use project-architect)
- Simple single-file changes

## Workflow

### 1. Read Architecture

Start by reading the architecture document from `ai-docs/architect/` to understand the system design.

### 2. Identify Phases

Break the feature into logical implementation phases:
- **Phase 1**: Foundation/infrastructure
- **Phase 2**: Core functionality
- **Phase 3**: Integration and polish

### 3. Create Task Files

For each task, create `ai-docs/tasks/task-{phase}-{number}-{name}.md`:

**Key sections**:
- **Overview**: What this task accomplishes
- **Dependencies**: Which tasks must complete first
- **Implementation Steps**: Detailed HOW instructions
- **Files to Modify**: Specific file paths
- **Acceptance Criteria**: How to verify completion
- **Estimated Duration**: Realistic time estimate

### 4. Define Dependencies

Ensure tasks are ordered correctly with clear dependency chains.

## Best Practices

- **Be Specific**: Include exact file paths, function names, code patterns
- **One Task = One PR**: Each task should be independently reviewable
- **Test First**: Include testing steps in each task
- **Build Incrementally**: Each task should leave the codebase in a working state
- **Reference Architecture**: Link back to architecture decisions

## Example

Input: Architecture for "real-time collaboration"

Output:
- `task-1-1-websocket-server.md`
- `task-1-2-client-connection.md`
- `task-2-1-state-sync.md`
- `task-2-2-conflict-resolution.md`

Each with detailed steps, dependencies, and acceptance criteria.
