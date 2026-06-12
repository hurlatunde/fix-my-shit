# Verify work workflow

Interactively confirm that phase deliverables are met before closing a phase or milestone. Driven by roadmap and plan-derived expectations.

**CLI entry:**

```bash
fix-my-shit verify-work <phase>
```

---

## 1. Initialize

- Resolve phase base and ensure `ROADMAP.md` exists for deliverable extraction.
- `verify-work` loads deliverables for the phase from `ROADMAP.md` and related planning files (success criteria, requirement links, plan references).

If no deliverables are found, the CLI reports that and exits.

---

## 2. Process

1. **Present** each deliverable as a yes/no confirm prompt.
2. **Track** any “no” answers as failures.
3. **Report:** On failure, suggest fix plans or debug agent; on success, report all confirmed.

**Note:** This is **interactive CLI verification**, not automated test execution. Use `templates/VALIDATION.md` for mapping requirements to automated commands.

---

## 3. Artifacts

- Fill or maintain `phases/{N}/{N}-UAT.md` during conversational UAT (see `templates/UAT.md`).
- Failed checks often feed **gap closure** planning (`plan-phase` with gaps mode when your orchestrator supports it).

---

## 4. Success criteria

- [ ] Every deliverable for the phase was confirmed or explicitly failed
- [ ] Failures route to fixes before `complete-phase` when process requires it

**Next:** `complete-phase`, new plans for gaps, or documentation updates.
