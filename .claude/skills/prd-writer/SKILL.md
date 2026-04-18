---
name: prd-writer
description: Create Product Requirements Documents (PRDs) that define WHAT to build and WHY. Use when user describes a problem, need, or feature idea that requires documentation before technical design. Creates structured PRDs in ai-docs/ covering problem statement, user needs, success criteria, functional requirements, and constraints. Triggers on requests like "write a PRD for...", "document requirements for...", or when user describes a feature/problem without technical implementation details.
---

# PRD Writer

Create Product Requirements Documents that define the problem space and requirements before technical design begins.

## When to Use

Use this skill when:
- User describes a problem or feature idea
- Starting a new feature or project
- Business requirements need documentation
- Before architectural design begins

Do NOT use for:
- Technical implementation details (use project-architect skill)
- Task breakdowns (use task-breakdown skill)
- Small changes or bug fixes

## Workflow

### 1. Gather Context

Ask clarifying questions to understand:
- **Problem**: What's broken, missing, or painful?
- **Users**: Who is affected? What do they need?
- **Value**: Why does this matter to users/business?
- **Success**: How do we know if this works?
- **Constraints**: What limits exist (technical, budget, timeline)?

### 2. Create PRD

Generate `ai-docs/prd-{feature-name}.md` using the template structure from `references/prd-template.md`.

**Key sections**:
- **Problem Statement**: Current situation, impact, opportunity
- **Goals & Success Criteria**: Measurable objectives and metrics
- **User Personas & Use Cases**: Who uses this and how
- **Requirements**: Functional (must/should/nice-to-have) and non-functional (performance, security)
- **Constraints**: Technical, business, compliance limits
- **Out of Scope**: Explicitly excluded items

### 3. Validate

Review with user before proceeding to architecture/implementation.

## Best Practices

- **Focus on WHY and WHAT, not HOW**: PRD defines the problem and requirements, not the solution
- **Be Specific**: Use measurable criteria, not vague terms like "fast" or "easy"
- **User-Centric**: Start with user needs, not technical features
- **Testable**: Every requirement should be verifiable
- **Prioritize**: Use P0/P1/P2 or Must/Should/Nice-to-Have

## Example

User: "We need a way for users to export their data"

You: [Asks: Why export? What formats? How often? Privacy concerns?]

Then creates: `ai-docs/prd-data-export.md` with full problem statement, user stories, success criteria, and requirements.

## Resources

- `references/prd-template.md` - Full template structure with all sections
