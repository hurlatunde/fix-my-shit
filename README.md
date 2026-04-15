<div align="center">

## Fix My Shit

<p align="center">Structured, phased project management and issue resolution for AI coding assistants, delivered as a small Node.js CLI. fms helps you go from vague idea to verified, committed outcome using a repeatable 6‑phase flow, plus Quick Mode for small tasks and Codebase Mapping for deep project understanding.</p>

[![npm version](https://img.shields.io/npm/v/fix-my-shit.svg?style=for-the-badge&logo=npm&logoColor=white&color=CB3837)](https://www.npmjs.com/package/fix-my-shit)
[![GitHub Actions](https://img.shields.io/github/actions/workflow/status/Hurlatunde/fix-my-shit/publish.yml?label=tests&style=for-the-badge&logo=githubactions&logoColor=white&color=CB3837)](https://github.com/Hurlatunde/fix-my-shit/actions/workflows/publish.yml)
[![GitHub stars](https://img.shields.io/github/stars/Hurlatunde/fix-my-shit?style=for-the-badge&logo=npm&logoColor=white&color=CB3837)](https://github.com/Hurlatunde/fix-my-shit)

<p align="center"><strong>Map → Initialize → Discuss → Plan → Execute → Verify → Complete</strong></p>

<p align="center"><em>Plain-text artifacts in your chosen runtime root (e.g. <code>.cursor/fms/</code>, <code>~/.claude/fms/</code>) · Multi-runtime install · Optional semantic search via RAG</em></p>

```bash
npx fix-my-shit@latest
```

</div>

---

## How It Works

Run fms from your project root so it can use your Git repo and AI runtime context. Then commands understand where you're working — questions focus on what you're adding, and planning loads your patterns.

### 0. Init

**`/fms:map-codebase`** or **`fms map-codebase`**

**When to Use:** Existing (brownfield) codebases.

For existing codebases, start here. The system spawns 4 parallel mapper agents that analyze your project and write structured documents:

- **Tech** — Languages, runtime, frameworks, dependencies → `STACK.md`, `INTEGRATIONS.md`
- **Architecture** — Patterns, layers, data flow, symbol index → `ARCHITECTURE.md`, `STRUCTURE.md`, `SYMBOLS.md`
- **Quality** — Code style, naming, testing patterns → `CONVENTIONS.md`, `TESTING.md`
- **Concerns** — Tech debt, bugs, security, fragile areas → `CONCERNS.md`

A 5th agent then reads all documents and generates a cross-reference index (`SUMMARY.md`). The result is 9 documents that other agents reference when planning and executing — they know your patterns, your file structure, and your exported symbols without reading every file.

**Creates:** `codebase/` with 9 structured documents + `meta.json`

### 1. Initialize Project

**`/fms:new-project`** or **`fms new-project`**

One command, one flow. The system:

- **Questions** — Asks until it understands your idea (goals, constraints, tech preferences, edge cases)
- **Research** — Spawns parallel agents to investigate the domain (optional but recommended)
- **Requirements** — Extracts what's v1, v2, and out of scope
- **Roadmap** — Creates phases mapped to requirements

You approve the roadmap. Now you're ready to build.

**Flags:** `--prd <path>` — Skip questioning and import from a PRD/spec file

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

The system orchestrates three specialized agents in sequence:

1. **Researcher** (`fms-phase-researcher`) — Investigates the domain, identifies standard stack, patterns, and pitfalls. Produces `RESEARCH.md` with confidence levels and source hierarchy.
2. **Planner** (`fms-planner`) — Creates 2-3 atomic task plans using goal-backward methodology. Each plan has YAML frontmatter (wave, dependencies, requirements, must_haves) and structured tasks with files, action, verify, and done fields.
3. **Checker** (`fms-plan-checker`) — Verifies plans will achieve the phase goal before execution. Checks 7 dimensions: requirement coverage, task completeness, dependency correctness, key links, scope sanity, verification derivation, and context compliance. Returns structured issues if problems are found.

If the checker finds issues, plans go back to the planner for targeted revision (max 3 iterations). Each plan is small enough to run in a fresh context window without quality degradation.

**Flags:** `--research` (force re-research), `--skip-research`, `--skip-verify`, `--gaps` (plan fixes for verification failures)

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

## Codebase Intelligence (RAG)

fms can build a semantic search index over your codebase analysis documents, so agents can query project knowledge by meaning instead of keyword.

### Build the index

```bash
fms index-codebase
```

Reads all `.md` files from `codebase/`, chunks by heading, and generates 768-dimensional embeddings using a local HuggingFace model (`nomic-embed-text-v1`). No API keys, no network calls — everything runs locally.

**Requires:** `@huggingface/transformers` (listed as optional dependency — install it to enable RAG)

### Query the index

```bash
fms query "How does the install flow work?"
```

Embeds your question, computes cosine similarity against all chunks, and returns the most relevant sections with source references.

### Detect drift

```bash
fms refresh-codebase
```

Compares the current git HEAD against the last mapping commit. If files have changed, it flags which codebase documents may be stale and rebuilds the RAG index.

**Creates:** `codebase/index.json` (chunks + embeddings), updates `codebase/meta.json`

---

## Why It Works

### Context engineering

The assistant is much more effective when it has the right context. fms handles that for you:

| File / folder     | What it does |
|-------------------|--------------|
| `codebase/`       | 9 structured analysis documents — tech, architecture, symbols, conventions, concerns |
| `PROJECT.md`      | Project vision, always loaded |
| `research/`       | Ecosystem knowledge (stack, features, architecture, pitfalls) |
| `REQUIREMENTS.md` | Scoped v1/v2 requirements with phase traceability |
| `ROADMAP.md`      | Where you're going, what's done |
| `STATE.md`        | Decisions, blockers, position — memory across sessions |
| `CONTEXT.md`      | Locked decisions, discretion areas, deferred ideas for a phase |
| `PLAN.md`         | Atomic task with YAML frontmatter, goal-backward must_haves, and structured tasks |
| `SUMMARY.md`      | What happened, what changed, committed to history |
| `quick/`          | Ad-hoc task plans and summaries |

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
| Codebase mapping | Creates structure, verifies output | 4 parallel mappers (tech, arch, quality, concerns) + 1 sequential summarizer |
| Research   | Coordinates, presents findings | Parallel researchers (stack, features, architecture, pitfalls) |
| Planning   | Validates, manages iteration | Researcher investigates domain, planner creates plans, plan-checker verifies (7 dimensions), revision loop (max 3x) |
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

On first run, fms asks **which runtime(s)** you want to install for and whether you want a **local** or **global** install. It then installs a **full bundle** (templates, workflows, agents, hooks, references) into the chosen location — not empty folders. You can re-run the installer to add more runtimes or upgrade; any files you changed are backed up to `fms-local-patches/` before overwriting.

### Supported runtimes and locations

| Runtime     | Global path                    | Local path (project)   |
|------------|--------------------------------|------------------------|
| Cursor     | `~/.cursor/fms`                | `./.cursor/fms`        |
| Claude Code| `~/.claude/fms`                | `./.claude/fms`        |
| OpenCode   | `~/.config/opencode/fms`       | `./.opencode/fms`      |
| Gemini     | `~/.gemini/fms`                | `./.gemini/fms`        |
| Codex      | `~/.codex/fms`                 | `./.codex/fms`         |
| Copilot    | `~/.copilot/fms`               | `./.github/fms`        |
| Antigravity| `~/.gemini/antigravity/fms`    | `./.agent/fms`         |

### Install flags

Skip prompts by passing flags:

```bash
npx fix-my-shit@latest install --cursor --global
npx fix-my-shit@latest install --claude --local
npx fix-my-shit@latest install --all --global
```

Options: `--cursor`, `--claude`, `--opencode`, `--gemini`, `--codex`, `--copilot`, `--antigravity`, `--all`, and `--global` / `-g` / `--local` / `-l`.

### Agents (runtime-specific formats)

fms installs agents into `<runtime>/fms/agents/`, but **the agent file format varies by runtime**:

- **Cursor / Claude / OpenCode / Gemini / Antigravity**: `agents/fms-*.md`
- **Copilot**: `agents/fms-*.agent.md` (tool names mapped to Copilot)
- **Codex**: `agents/fms-*.md` plus `agents/fms-*.toml` and a root `config.toml` block that registers the agents

If you edit installed agents locally and reinstall, your modified versions are backed up under `fms-local-patches/` before overwriting.

### Manifest and local patches

- **`fms-file-manifest.json`** — Records every installed file and its hash. Used to detect which files you changed when you re-run the installer.
- **`fms-local-patches/`** — If you re-install and had modified any installed files, those versions are copied here before overwriting. A `backup-meta.json` file lists what was backed up so you can compare or reapply changes after upgrading.

---

## CLI Reference

| Command | Description |
|---------|-------------|
| `fms install` | Install fms to selected runtime(s) |
| `fms new-project [--prd <path>]` | Start a new project (questions → research → requirements → roadmap) |
| `fms map-codebase` | Analyze codebase with parallel mapper agents (9 documents) |
| `fms discuss-phase <N>` | Clarify gray areas for a phase |
| `fms plan-phase <N>` | Generate executable plans for a phase |
| `fms execute-phase <N>` | Run all plans in a phase (wave-based) |
| `fms verify-work <N>` | Manually verify phase deliverables |
| `fms complete-phase` | Mark current phase as done |
| `fms complete-milestone` | Archive milestone and advance to next |
| `fms quick ["task"]` | Quick ad-hoc task with fms guarantees |
| `fms status` | Show current project/phase state |
| `fms config` | Show or change install path preference |
| `fms index-codebase` | Build RAG index from codebase analysis documents |
| `fms query "question"` | Query the codebase RAG index |
| `fms refresh-codebase` | Detect drift and rebuild RAG index |
| `fms help [command]` | Display help for a command |

---

## Tech stack

- **Language:** TypeScript 5.3+
- **Runtime:** Node.js >= 18 (ESM)
- **CLI:** Commander, Inquirer, Chalk
- **RAG (optional):** `@huggingface/transformers` — local embeddings with `nomic-embed-text-v1` (768-dim)
- **Artifacts:** Markdown/JSON in the installed runtime root (e.g. `.cursor/fms/`, `~/.claude/fms/` depending on install choice)

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