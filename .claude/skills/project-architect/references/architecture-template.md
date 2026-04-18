# Architecture Template

Use this template structure when creating architectural documentation.

```markdown
# {Feature Name} - Architecture

**Created**: {Date}
**Status**: Draft | Approved | Implemented

---

## Overview

### Purpose
{Why this feature exists}

### Goals
- {Primary objectives}
- {Success criteria}

### Scope
- **In Scope**: {What's included}
- **Out of Scope**: {What's excluded}

---

## System Architecture

### High-Level Design
{Description of major components and how they interact}

### Components
1. **{Component Name}** (`path/to/file`): {Purpose and responsibilities}
2. **{Component Name}** (`path/to/file`): {Purpose and responsibilities}

### Data Flow
{How data moves through the system}

### Integration Points
{External systems, APIs, services}

---

## Technical Design

### Technology Stack
- **Frontend**: {Languages, frameworks}
- **Backend**: {Languages, frameworks}
- **Database**: {Type, schema considerations}

### API Design
**Endpoint**: `POST /api/example`
**Request**:
```json
{
  "field": "value"
}
```
**Response**:
```json
{
  "result": "value"
}
```

### Component Specifications
{Detailed component designs with interfaces}

###State Management
{How application state is managed}

---

## Security & Performance

### Security Considerations
- {Authentication/authorization}
- {Data protection}
- {Input validation}

### Performance Targets
- {Response time goals}
- {Scalability requirements}

---

## Dependencies

### External Dependencies
- {Third-party services}
- {Libraries}

### Internal Dependencies
- {Other features or systems}

---

## Implementation Phases

### Phase 1: {Name}
- **Duration**: {Estimate}
- **Deliverables**: {What gets built}
- **Tasks**: {Task IDs if applicable}
```
