# Self-Improvement Loop Integration Design

## Goal
Wire practice-loop, retrospective, and reference refresh into idle/scheduled execution

## Current State Analysis

### Idle Detection
- Executive loop returns `'no_work'` when no tasks available
- Currently just sleeps for IDLE_SLEEP_MS (30s default)
- This idle time is **wasted** - not used for self-improvement

### Existing Skills
1. **practice-loop** (`.claude/skills/practice-loop/SKILL.md`)
   - Runs practice tasks to improve skill confidence
   - Should trigger when: idle, waiting for input, rate limited, low confidence skills needed

2. **retrospective** (`.claude/skills/retrospective/SKILL.md`)
   - Periodic analysis of outcomes
   - Should trigger: weekly (Sunday), after 10+ outcomes, on-demand

3. **reference-refresh** (`.claude/skills/reference-refresh/SKILL.md`)
   - Updates external references
   - Should trigger: weekly, before using stale references

## Design Approach

### 1. Create Self-Improvement Trigger Module
Location: `src/agentic/calibration/self-improvement-triggers.ts`

This module will:
- Track last run timestamps
- Check if conditions are met for each self-improvement activity
- Generate work items for self-improvement tasks

### 2. Integrate into Executive Loop
Modify `src/core/executive-loop.ts` Phase 3 (Select Work):

```typescript
// === PHASE 3: SELECT WORK ===
logAgentic('PHASE 3: Select Work (Priority: P1 > P2 > P3)');
const selectedWork = await selectWorkWithSteps();

if (!selectedWork) {
  // NEW: Check for self-improvement opportunities
  const selfImprovementWork = await checkSelfImprovementTriggers();

  if (selfImprovementWork) {
    // Execute self-improvement task
    return await executeSelfImprovement(selfImprovementWork);
  }

  logAgentic('  No work available in queue');
  return 'no_work';
}
```

### 3. Self-Improvement Work Types

#### Type 1: Practice Loop (Idle-triggered)
- **Trigger**: No P1/P2 work available
- **Action**: Create practice task for lowest-confidence skill needed by P1 goals
- **Format**: Add to goals.md as `[SELF-ENHANCE] Practice: {skill_id}`

#### Type 2: Retrospective (Schedule-triggered)
- **Trigger**: Weekly (Sunday) OR 10+ new capability-ledger entries since last retro
- **Action**: Run retrospective analysis, update skill confidence
- **Format**: Add to goals.md as `[SELF-ENHANCE] Weekly Retrospective`

#### Type 3: Reference Refresh (Schedule-triggered)
- **Trigger**: Weekly (Sunday) AND references >7 days stale
- **Action**: Refresh Mode A/B references
- **Format**: Add to goals.md as `[SELF-ENHANCE] Reference Refresh`

### 4. State Tracking
Create `workspace/self-improvement-state.json`:
```json
{
  "last_practice_at": "2026-01-25T10:00:00Z",
  "last_retrospective_at": "2026-01-21T00:00:00Z",
  "last_reference_refresh_at": "2026-01-21T00:00:00Z",
  "practice_count": 5,
  "retrospective_count": 2,
  "outcomes_since_last_retro": 15
}
```

### 5. Implementation Priority

**Phase 1: Practice Loop** (Highest ROI)
1. Create self-improvement-triggers.ts
2. Add idle detection in executive-loop.ts
3. Generate practice tasks based on capability gaps
4. Track state in self-improvement-state.json

**Phase 2: Retrospective** (Medium ROI)
1. Add weekly schedule check
2. Count outcomes since last retrospective
3. Generate retrospective tasks

**Phase 3: Reference Refresh** (Lower ROI)
1. Add weekly schedule check
2. Check reference staleness
3. Generate refresh tasks

## Integration Points

### Files to Modify
1. `src/core/executive-loop.ts` - Add self-improvement check in Phase 3
2. NEW: `src/agentic/calibration/self-improvement-triggers.ts` - Trigger logic
3. NEW: `src/deterministic/self-improvement-state.ts` - State persistence

### Files to Read
1. `capabilities/*.yml` - For skill confidence levels
2. `ledgers/capability-ledger.jsonl` - For outcome counting
3. `references/reference-registry.yaml` - For staleness check
4. `workspace/goals.md` - To understand P1 goals and skill needs

## Success Criteria
1. ✅ When idle, agent generates practice tasks
2. ✅ Weekly retrospectives run automatically
3. ✅ References refresh weekly
4. ✅ All self-improvement work tagged with `[SELF-ENHANCE]`
5. ✅ State tracked and persisted across restarts
6. ✅ Code compiles and runs
7. ✅ Changes committed to git

## Constitutional Compliance
- ✅ No spending beyond caps (all local execution)
- ✅ No permanent deletions (only adding tasks)
- ✅ No external publishing
- ✅ All activity logged
- ✅ Output goes to agent-outputs (this design doc)
