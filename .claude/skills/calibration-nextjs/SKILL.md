---
name: calibration-nextjs
description: |
  Prove `deliver.nextjs.app.basic` capability through end-to-end execution. Use when validating Next.js delivery skills before important work, establishing baseline confidence from evidence, surfacing blockers (tooling, templates), or when nextjs.build.basic confidence is untested or low.
---

# Calibration: Next.js

Prove `deliver.nextjs.app.basic` capability through end-to-end execution.

## Steps

1. **Scaffold**
   ```bash
   npx create-next-app@latest calibration-nextjs --typescript --tailwind --app
   ```

2. **Modify** - Add custom component in `components/HelloCalibration.tsx`, import in `app/page.tsx`

3. **Build** - `npm run build` must exit 0

4. **Document** - README with run instructions (`npm run dev`)

5. **Validate** - Run verifiers:
   - `git_status_clean`
   - `node_install`
   - `node_build`
   - `docs_checklist`

6. **Record** - Log to capability-ledger.jsonl:
   ```json
   {"event": "CALIBRATION_COMPLETE", "skill": "deliver.nextjs.app.basic", "result": "PASS|FAIL"}
   ```

## Success Criteria

All verifiers PASS. On success: `nextjs.build.basic` confidence +10, maturity -> Demonstrated.

## On Failure

Document which verifier failed, error output, and what would unblock. Update skill confidence negatively.
