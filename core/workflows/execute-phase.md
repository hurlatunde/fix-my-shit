# Execute phase workflow

Orchestrate executing all plans for a roadmap phase. Two layers: **CLI** prepares waves and stub documentation; **implementation** is done by an agent in the IDE using the executor spec.

**Creates (CLI):** `phases/{N}/{N}-{M}-SUMMARY.md` (stub body until an agent replaces it), `STATE.md` updates

**Creates (agent):** Real code changes, filled SUMMARY content, optional verification artifacts when you run verify workflows

---

## 1. Initialize

**Resolve planning base:** `PROJECT.md`, `ROADMAP.md`, `STATE.md`, and `phases/` may live under the workspace `.planning/` directory when the roadmap is anchored there; otherwise under your fms install root alongside `templates/` and `workflows/`.

**Config:** `<fms-root>/config.json` — notably `commit_docs` (whether to git-add/commit doc paths after stub summaries).

**CLI entry:**

```bash
fix-my-shit execute-phase <phase>
```

---

## 2. Orchestrator (CLI) behavior

The `execute-phase` command:

1. Resolves `phases/<N>/`.
2. Loads all `*-PLAN.md`; groups plans by **`wave`** in YAML frontmatter; runs lower wave numbers first.
3. **Skips** a plan if `phases/<N>/<plan-id>-SUMMARY.md` already exists.
4. For each remaining plan in wave order:
   - Writes a **stub** `*-SUMMARY.md` (placeholder until an agent implements the plan).
   - If `commit_docs` is true and the current working directory is a git repo: may commit documented paths from plan frontmatter (`files_modified`) plus the summary file.
   - Updates `STATE.md` progress when that file exists.

**Important:** The CLI does **not** invoke an LLM or execute task `<action>` bodies. Treat stub summaries as a checklist scaffold; agents produce real outcomes.

---

## 3. Implementation (agent)

For each plan, use **fms-executor** from `agents/fms-executor.md`:

- Read the PLAN file, project docs, and phase CONTEXT when referenced.
- Implement tasks in the codebase; replace stub SUMMARY with verification results, deviations, and follow-ups.
- Prefer atomic commits per plan when working in git, as described in the executor agent.

**Parallelism:** Same-wave plans may be run in parallel by your AI runtime; sequential waves preserve dependencies encoded in frontmatter.

---

## 4. Structured outcomes

- **After CLI only:** New stub SUMMARY files; STATE advancement.
- **After agent completion:** SUMMARY reflects real verification; codebase matches PLAN tasks.

---

## 5. Success criteria

- [ ] Phase directory exists with at least one `*-PLAN.md`
- [ ] Each plan is either skipped (existing SUMMARY) or receives a new SUMMARY file
- [ ] `STATE.md` updated when present
- [ ] Agents replace stubs with real work when executing in the IDE

**Next:** `fix-my-shit verify-work <phase>`, conversational UAT, or `complete-phase`.
