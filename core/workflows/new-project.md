# New project workflow

Bootstrap planning documents for a greenfield initiative: questions (or PRD), optional research, requirements, roadmap, and project state.

**Creates (default path):** `PROJECT.md`, `REQUIREMENTS.md`, `ROADMAP.md`, `STATE.md`, optional `research/` stubs

**CLI entry:**

```bash
fix-my-shit new-project
fix-my-shit new-project --prd path/to/spec.md
```

---

## 1. Initialize

- Resolve fms root (`fix-my-shit config` shows the active path).
- Ensure the fms root is writable; `phases/`, `quick/`, and `commands/` directories exist after install.

**Note:** Files under `<fms-root>/templates/` are **reference copies** for agents and humans. `new-project` **does not** copy those templates into your planning root automatically — it **generates** planning files from built-in TypeScript logic. Keep `templates/` in sync with generator output when you maintain the product.

---

## 2. Process (maps to CLI)

### Step 1 — Questions or PRD

- **Interactive:** Inquirer-driven questions → `PROJECT.md` with sections including `## Requirements` → `### Active` / `### Out of Scope` (parsed when building requirements).
- **`--prd`:** First argument file content is written as `PROJECT.md` as-is (must include parseable sections if you rely on requirement extraction).

### Step 2 — Optional research

- Prompt: run research? If yes, writes `research/` documents (STACK, FEATURES, ARCHITECTURE, PITFALLS, SUMMARY) as stubs or light content depending on implementation.

### Step 3 — Requirements

- Generates `REQUIREMENTS.md` from `PROJECT.md` Active/Out-of-scope bullets and optional `research/FEATURES.md`.
- IDs use category prefixes (e.g. GEN-01, PROJ-01).

### Step 4 — Roadmap and state

- Writes `ROADMAP.md` (Overview, Phases checklist, Phase Details, Progress table) and `STATE.md` (**Project State**, current focus, position).
- Updates the **Traceability** table in `REQUIREMENTS.md` to map requirement IDs to suggested phases.

### Step 5 — Approval prompt

- User can approve, choose to edit files and re-run, or print paths to `ROADMAP.md` / `STATE.md`.

---

## 3. Branching

- **Re-run:** Safe to run again after manual edits; generators overwrite planning files from current inputs (back up if needed).
- **PRD path:** Skips questioning; still runs research prompt and downstream steps.

---

## 4. Success criteria

- [ ] `PROJECT.md` exists with goal and scope
- [ ] `REQUIREMENTS.md` lists v1 items and traceability
- [ ] `ROADMAP.md` and `STATE.md` exist and reference each other
- [ ] User knows next step (e.g. discuss-phase or plan-phase for phase 1)

---

## 5. Reference shapes

Compare generated files to `templates/PROJECT.md`, `templates/REQUIREMENTS.md`, `templates/ROADMAP.md`, and `templates/STATE.md` — they document the same canonical structure.
