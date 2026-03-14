<div align="center">

[![npm version](https://img.shields.io/npm/v/fix-my-shit.svg)](https://www.npmjs.com/package/fix-my-shit)
[![GitHub Actions](https://img.shields.io/github/actions/workflow/status/Hurlatunde/fix-my-shit/test.yml?label=tests)](https://github.com/Hurlatunde/fix-my-shit/actions)
[![GitHub stars](https://img.shields.io/github/stars/Hurlatunde/fix-my-shit)](https://github.com/Hurlatunde/fix-my-shit)

## Fix My Shit (fms)

<p align="center">Structured, phased project management and issue resolution for Cursor, delivered as a small Node.js CLI. fms helps you go from vague idea to verified, committed outcome using a repeatable 6‑phase flow, plus Quick Mode for small tasks.</p>

<p align="center"><strong>Initialize → Discuss → Plan → Execute → Verify → Complete</strong></p>

<p align="center"><em>Plain-text artifacts in <code>.cursor/fms/</code> or <code>~/.cursor/fms/</code> · Built for Cursor, CLI works in any terminal</em></p>

```bash
npx fix-my-shit@latest
```

</div>

---

## How It Works

Run fms from your project root so it can use your Git repo and Cursor context. Then **new-project** understands where you're working — questions focus on what you're adding, and planning loads your patterns.

### 1. Initialize Project

**`/fms:new-project`** or **`fms new-project`**

One command, one flow. The system:

- **Questions** — Asks until it understands your idea (goals, constraints, tech preferences, edge cases)
- **Research** — Spawns parallel agents to investigate the domain (optional but recommended)
- **Requirements** — Extracts what's v1, v2, and out of scope
- **Roadmap** — Creates phases mapped to requirements

You approve the roadmap. Now you're ready to build.

**Creates:** `PROJECT.md`, `REQUIREMENTS.md`, `ROADMAP.md`, `STATE.md`, `research/`

### 2. Discuss Phase

**`/fms:discuss-phase 1`** or **`fms discuss-phase 1`**

This is where you shape the implementation.

Your roadmap has a sentence or two per phase. That's not enough context to build the way you imagine. This step captures your preferences before research or planning.

The system analyzes the phase and identifies gray areas:

- **Visual features** → Layout, density, interactions, empty states
- **APIs/CLIs** → Response format, flags, error handling, verbosity
- **Content systems** → Structure, tone, depth, flow
- **Organization tasks** → Grouping criteria, naming, duplicates, exceptions

For each area you select, it asks until you're satisfied. The output — **CONTEXT.md** — feeds the next steps: the researcher knows what to investigate, and the planner knows what's decided. The deeper you go here, the more the system builds what you want. Skip it and you get reasonable defaults.

**Creates:** `phases/{phase}/` with **`{phase}-CONTEXT.md`**

### 3. Plan Phase

**`/fms:plan-phase 1`** or **`fms plan-phase 1`**

The system:

- **Researches** — How to implement this phase, guided by your CONTEXT.md
- **Plans** — Creates 2–3 atomic task plans with structured format
- **Verifies** — Checks plans against requirements, loops until they pass

Each plan is small enough to run in a fresh context. No degradation, no "I'll be more concise now."

**Creates:** `phases/{phase}/{phase}-RESEARCH.md`, `phases/{phase}/{phase}-{N}-PLAN.md`

### 4. Execute Phase

**`/fms:execute-phase 1`** or **`fms execute-phase 1`**

The system:

- **Runs plans in waves** — Parallel where possible, sequential when dependent
- **Fresh context per plan** — Implementation gets a clean context window
- **Commits per task** — Every task gets its own atomic commit (when in a Git repo)
- **Verifies against goals** — Checks the codebase delivers what the phase promised

Walk away, come back to completed work with clean git history.

**How wave execution works:** Plans are grouped into waves by dependencies. Within a wave, plans run in parallel. Waves run one after another. Independent plans → same wave → parallel. Dependent plans → later wave → wait for dependencies. File conflicts → sequential or same plan. Vertical slices (e.g. one feature end-to-end per plan) parallelize better than horizontal layers (e.g. all models, then all APIs).

**Creates:** `phases/{phase}/{phase}-{N}-SUMMARY.md`, `phases/{phase}/{phase}-VERIFICATION.md`

### 5. Verify Work

**`/fms:verify-work 1`** or **`fms verify-work 1`**

This is where you confirm it actually works.

Automated verification checks that code exists and tests pass. The system:

- **Extracts testable deliverables** — What you should be able to do now
- **Walks you through one at a time** — "Can you log in with email?" Yes/no, or describe what's wrong
- **Diagnoses failures** — Spawns debug agents to find root causes
- **Creates fix plans** — Ready for re-execution

If everything passes, you move on. If something's broken, run **execute-phase** again with the fix plans.

**Creates:** `phases/{phase}/{phase}-UAT.md`, and fix plans if issues are found

### 6. Repeat → Complete → Next Milestone

```
/fms:discuss-phase 2
/fms:plan-phase 2
/fms:execute-phase 2
/fms:verify-work 2
...
/fms:complete-milestone
/fms:new-milestone
```

Loop **discuss → plan → execute → verify** until the milestone is complete. Each phase gets your input (discuss), research (plan), clean execution (execute), and human verification (verify). When all phases are done, **complete-milestone** archives the milestone and tags the release. **new-milestone** starts the next version — same flow as new-project but for your existing codebase. Each milestone is a clean cycle: define → build → ship.

For full **Cursor slash commands ↔ terminal** mapping, see `docs/cursor-commands.md`.

---

## Quick Mode

**`/fms:quick`** or **`fms quick`**

For ad-hoc tasks that don't need full planning.

Quick mode gives you fms guarantees (atomic commits, state tracking) with a shorter path:

- Same agents — Planner and executor, same quality
- Skips optional steps — No research, no plan checker, no verifier
- Separate tracking — Lives in `quick/`, not under phases

Use for: bug fixes, small features, config changes, one-off tasks.

**Example:** `fms quick "Add dark mode toggle to settings"`

**Creates:** `quick/{task-id}-{slug}/PLAN.md`, `SUMMARY.md`

---

## Why It Works

### Context engineering

The assistant is much more effective when it has the right context. fms handles that for you:

| File / folder   | What it does |
|-----------------|--------------|
| `PROJECT.md`    | Project vision, always loaded |
| `research/`     | Ecosystem knowledge (stack, features, architecture, pitfalls) |
| `REQUIREMENTS.md` | Scoped v1/v2 requirements with phase traceability |
| `ROADMAP.md`    | Where you're going, what's done |
| `STATE.md`      | Decisions, blockers, position — memory across sessions |
| `PLAN.md`       | Atomic task with structure and verification steps |
| `SUMMARY.md`    | What happened, what changed, committed to history |
| `quick/`        | Ad-hoc task plans and summaries |

Size and structure are tuned so context stays useful. Stay within them for consistent results.

### Structured plans

Every plan is structured so the executor gets clear instructions:

- **Task name** — What to build
- **Files** — Where to edit
- **Action** — Concrete steps (libraries, validation, behavior)
- **Verify** — How to confirm it works
- **Done** — Success criteria

Precise instructions and verification are built in.

### Multi-agent orchestration

Each stage uses the same idea: a thin orchestrator spawns specialized agents, collects results, and passes work to the next step.

| Stage      | Orchestrator | Agents |
|------------|--------------|--------|
| Research   | Coordinates, presents findings | Parallel researchers (stack, features, architecture, pitfalls) |
| Planning   | Validates, manages iteration | Planner creates plans, checker verifies, loop until pass |
| Execution  | Groups into waves, tracks progress | Executors implement (parallel where possible), fresh context per plan |
| Verification | Presents results, routes next | Verifier checks codebase against goals, debuggers diagnose failures |

The orchestrator doesn't do the heavy work. It spawns agents and integrates results. You can run a full phase — research, multiple plans, verification — and your main session stays responsive.

---

## Installation

You need **Node.js >= 18**.

- **One-off via npx** (recommended):

  ```bash
  npx fix-my-shit@latest
  ```

- **Local dev dependency:**

  ```bash
  npm install --save-dev fix-my-shit
  ```

  Add a script in `package.json`:

  ```json
  {
    "scripts": {
      "fms": "fix-my-shit"
    }
  }
  ```

  Then run: `npm run fms`

On first run, fms asks whether you want a **local** root (e.g. `.cursor/fms/` in the current project) or a **global** root (e.g. `~/.cursor/fms/`), then creates the folder structure, config, and templates.

---

## Tech stack

- **Language:** TypeScript  
- **Runtime:** Node.js >= 18  
- **CLI:** commander, inquirer, chalk  
- **Artifacts:** Markdown/JSON in `.cursor/fms/` or `~/.cursor/fms/`

---

## More detail

- **`.planning/PROJECT.md`** — What fms is and who it's for  
- **`.planning/ROADMAP.md`** — Phase breakdown and progress  
- **`.planning/STATE.md`** — Current execution state  
- **`docs/cursor-commands.md`** — Slash commands and terminal parity  

---

## License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.

---

## Security Policy

We take security seriously. See **[SECURITY.md](SECURITY.md)** for supported versions and how to report vulnerabilities. In short:

1. **Do not** open a public issue for security vulnerabilities.
2. **Email** the maintainer (see package.json or your preferred contact) with a description of the issue, steps to reproduce, and any impact assessment.
3. We will acknowledge your report and work with you to understand and address it.

We appreciate responsible disclosure and will credit reporters (unless they prefer to remain anonymous) when the issue is resolved.