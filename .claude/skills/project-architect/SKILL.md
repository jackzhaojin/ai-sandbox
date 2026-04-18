---
name: project-architect
description: Create comprehensive architectural documentation for complex features or projects requiring multiple components, clear API design, and phase-based implementation. Use when starting complex features (3+ days work) that need system design, component specifications, or multi-phase planning. Creates architecture docs in ai-docs/architect/ defining system components, data flow, API contracts, and implementation phases. Triggers on "design the architecture for...", "create system design for...", or complex feature requests after PRD exists.
---

# Project Architect

Create architectural documentation that defines HOW a system will be built at a high level.

## When to Use

Use this skill when:
- PRD exists and is approved
- Feature requires multiple components or systems
- Clear API design is needed
- Phase-based implementation is required
- Architectural decisions need documentation

Do NOT use for:
- Simple bug fixes or small features (< 1 day)
- When no PRD exists (use prd-writer first)
- Detailed task-level instructions (use task-breakdown)

## Workflow

### 1. Read the PRD

Start by reading the PRD to understand requirements, constraints, and success criteria.

### 2. Gather Technical Context

Ask clarifying questions:
- **Existing Patterns**: What similar features exist in the codebase?
- **Technology Choices**: Any required tech stack or frameworks?
- **Performance Needs**: Response time, scalability targets?
- **Integration Points**: What external systems are involved?

### 3. Design the Architecture

Create `ai-docs/architect/{feature-name}-architecture.md` using template from `references/architecture-template.md`.

**Key sections**:
- **Overview**: Purpose, goals, scope
- **System Architecture**: Components, data flow, integration points
- **Technical Design**: Tech stack, API design, component specs
- **Security & Performance**: Key considerations
- **Implementation Phases**: Logical order for building

### 4. Validate

Review with user before proceeding to task breakdown.

## Best Practices

- **Start with WHY**: Reference the PRD's business value
- **Be Specific**: File paths, function names, data structures
- **Show Trade-offs**: Document alternatives and why they were rejected
- **Think in Phases**: Break complex features into stages
- **Reference Examples**: Point to similar existing patterns
- **Component-First**: Define clear boundaries and interfaces

## Example

User: "Design the architecture for a real-time collaboration feature"

You: [Asks about existing patterns, tech preferences, performance needs]

Then creates: `ai-docs/architect/realtime-collaboration-architecture.md` with WebSocket design, state management, conflict resolution, and 3-phase implementation plan.

## Resources

- `references/architecture-template.md` - Full template with all sections
