# Quick mode workflow

Ad-hoc tasks without full phase research, plan checker, or verifier by default. Same PLAN/SUMMARY shape as phased work, but stored under `quick/`.

**Creates:** `quick/{NNN}-{slug}/PLAN.md`, `quick/{NNN}-{slug}/SUMMARY.md`

**CLI entry:**

```bash
fix-my-shit quick [task description words...]
```

If you omit the task, the CLI prompts for a short description.

---

## 1. Initialize

- Resolve phase base (same rules as phased work — workspace `.planning/` or fms root).
- `quick/` directory is created under that base if missing.

---

## 2. Orchestrator (CLI) behavior

1. Assigns next run id (`001`, `002`, …) from existing `quick/*` directory names.
2. Writes `PLAN.md` with minimal frontmatter (`phase: quick`, `wave: 1`, empty `depends_on` / `requirements`) and a single generic task block plus `<objective>` from your task text.
3. **Stub execution:** Reads the objective, writes `SUMMARY.md` with a completed timestamp and placeholder accomplishments — **no agent invocation**.

**Relationship to templates:** Plan structure mirrors `templates/PLAN.md` (objective, tasks, verification) but lives outside `phases/`.

**Not included by default:** fms-phase-researcher, fms-plan-checker, fms-verifier loops — route back to full `plan-phase` when you need that rigor.

---

## 3. Implementation (agent)

Open `quick/.../PLAN.md` in your AI tool; use **fms-executor** (`agents/fms-executor.md`) to perform the real work in the repo, then expand `SUMMARY.md` with actual verification and changes.

---

## 4. Success criteria

- [ ] New `quick/<id>-<slug>/` directory with PLAN and SUMMARY
- [ ] User or agent completes the described task and updates SUMMARY beyond the stub
- [ ] Optional: commit from your normal git workflow (quick mode does not auto-commit code)

---

## 5. Next steps

Return to phased work with `plan-phase` / `execute-phase` when the ad-hoc item grows into a roadmap phase.
