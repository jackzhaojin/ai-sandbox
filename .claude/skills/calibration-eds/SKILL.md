---
name: calibration-eds
description: |
  Prove `deliver.eds.site` capability through end-to-end execution. Use when validating Edge Delivery Services skills before EDS work, checking aem-cli and GitHub auth availability, establishing baseline confidence, or surfacing Adobe EDS tooling blockers.
---

# Calibration: EDS

Prove `deliver.eds.site` capability through end-to-end execution.

## Prerequisites

Check tooling:
```bash
which aem || echo "aem-cli not found"  # Blocker if missing
gh auth status  # Blocker if not authenticated
```

If missing, document in needs-you.md and stop.

## Steps

1. **Scaffold** - Create minimal EDS structure:
   - `head.html`
   - `scripts/scripts.js`
   - `styles/styles.css`

2. **Add content** - Create `index.html` or `index.md` with one block

3. **Preview** - Run `aem up` (if available) or validate structure manually

4. **Document** - README with setup and run instructions

5. **Validate** - Run verifiers: `git_status_clean`, `files_exist`, `docs_checklist`

6. **Record** - Log to capability-ledger.jsonl

## Known Blockers

| Blocker | Resolution |
|---------|------------|
| aem-cli not installed | Human installs aem-cli |
| GitHub auth missing | Human runs `gh auth login` |
| Template unavailable | Use minimal hand-built structure |

## Success Criteria

EDS structure valid, README exists, all files committed. On success: maturity -> Demonstrated.
