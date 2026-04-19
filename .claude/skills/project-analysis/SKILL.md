---
name: project-analysis
description: Analyze existing codebases to document tech stack, patterns, and architecture before designing new features. Use when starting work on an unfamiliar codebase, before creating PRDs or architecture docs, when understanding existing patterns is needed, or when documenting current state for future reference. Creates analysis document in ai-docs/project-analysis.md covering tech stack, file structure, key patterns, and architectural decisions. Triggers on "analyze this codebase", "what's the tech stack?", or before major feature work in new projects.
---

# Project Analysis

Analyze and document existing codebases to understand patterns before building new features.

## When to Use

Use this skill when:
- Starting work on an unfamiliar codebase
- Before writing PRDs or architecture docs
- Need to understand existing patterns and conventions
- Documenting current state for reference

Do NOT use for:
- New projects with no existing code
- Well-understood codebases
- Simple bug fixes

## Workflow

### 1. Explore Tech Stack

Identify:
- **Languages**: Primary and supporting languages
- **Frameworks**: Frontend, backend, testing frameworks
- **Build Tools**: Package managers, bundlers, task runners
- **Dependencies**: Key libraries and their purposes

### 2. Analyze Structure

Document:
- **Directory Layout**: Purpose of each major directory
- **Entry Points**: Where execution starts
- **Module Organization**: How code is organized and imported
- **Configuration**: Key config files and their roles

### 3. Identify Patterns

Look for:
- **Architectural Patterns**: MVC, layered, microservices, etc.
- **Code Conventions**: Naming, formatting, organization
- **Common Utilities**: Shared helpers and their usage
- **Data Flow**: How data moves through the system

### 4. Document Findings

Create `ai-docs/project-analysis.md` with:
- **Tech Stack Summary**: All technologies in use
- **Architecture Overview**: High-level system design
- **Key Files**: Important files and their purposes
- **Patterns to Follow**: Conventions for new code
- **Integration Points**: External systems and APIs

### 5. Note Gaps or Issues

Include:
- Missing documentation
- Inconsistent patterns
- Technical debt
- Areas needing modernization

## Best Practices

- **Be Comprehensive**: Cover all major aspects
- **Reference Examples**: Point to representative files
- **Note Conventions**: Capture implicit patterns
- **Think Forward**: How will new features fit?
- **Stay Objective**: Document what exists, not what should be

## Example

User: "Analyze the authentication service codebase"

You: [Explores structure, identifies Express.js + JWT, documents middleware pattern, notes database schema, creates comprehensive analysis]

Output: `ai-docs/project-analysis.md` with complete tech stack, architecture, and patterns for building auth features.
