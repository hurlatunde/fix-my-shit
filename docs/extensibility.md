# Extensibility: hooks, templates, agents, and workflows

Fix My Shit (fms) is designed so you can extend behavior by editing files in your install tree. This document explains the on-disk layout, what the **CLI** reads vs what your **AI runtime** reads, and how to customize templates, agents, and workflows.

## CLI root vs runtime install roots

Two different paths matter:

| Layer                    | Path                                                             | Purpose                                                                                                |
| ------------------------ | ---------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| **CLI planning root**    | `./.cursor/fms` or `~/.cursor/fms` (via `resolveFmsRoot`)        | Where `fms new-project`, `fms plan-phase`, `fms execute-phase`, etc. read and write planning artifacts |
| **Runtime install root** | Per-runtime path (see [Supported runtimes](#supported-runtimes)) | Where `fms install` copies agents, workflows, and templates for Cursor, Claude, Copilot, etc.          |

`fms install --claude` (or any non-Cursor runtime) still installs agents under `./.claude/fms` for Claude to consume. **CLI commands always use `.cursor/fms`** unless you change product code in `src/path-resolver.ts`. If you use Claude Code only, install there for agents _and_ keep a `.cursor/fms` tree (or symlink planning files) if you want the CLI to manage the same project.

Preference for local vs global CLI root is stored in **`.fms-prefs.json`** inside the chosen `.cursor/fms` directory (`fms config --set-local` / `--set-global`).

## Directory layout and anchors

When you run `npx fix-my-shit` (or `fms install`), the installer creates this layout under the **runtime** fms root (example: `./.cursor/fms`):

```
<fms-root>/
├── VERSION                    # Installed fms version (from npm package)
├── fms-file-manifest.json     # JSON manifest of all installed paths + hashes
├── package.json               # Minimal package metadata
├── config.json                # Optional — CLI behavior (see Configuration)
├── config.toml                # Codex only — agent registry
├── templates/                 # Reference templates (see Templates vs generators)
│   ├── PROJECT.md
│   ├── ROADMAP.md
│   ├── REQUIREMENTS.md
│   ├── STATE.md
│   ├── PLAN.md
│   ├── RESEARCH.md
│   ├── VALIDATION.md
│   ├── CONTEXT.md
│   ├── DEBUG.md
│   ├── UAT.md
│   ├── UI-SPEC.md
│   └── research-project/
│       ├── SUMMARY.md
│       ├── STACK.md
│       ├── FEATURES.md
│       ├── ARCHITECTURE.md
│       └── PITFALLS.md
├── agents/
│   ├── fms-planner.md
│   ├── fms-plan-checker.md
│   ├── fms-executor.md
│   ├── fms-phase-researcher.md
│   ├── fms-verifier.md
│   ├── fms-debugger.md
│   └── fms-codebase-mapper.md
├── workflows/
│   ├── new-project.md
│   ├── discuss-phase.md
│   ├── plan-phase.md
│   ├── execute-phase.md
│   ├── map-codebase.md
│   ├── verify-work.md
│   ├── quick.md
│   └── help.md
├── research/                  # From core/references (principles, not full workflows)
│   ├── README.md
│   ├── verification-patterns.md
│   ├── git-integration.md
│   ├── questioning.md
│   └── continuation-format.md
├── hooks/                     # Hook runtime data (e.g. update-check.json cache)
├── phases/                    # Per-phase plans and summaries
├── quick/                     # Quick mode plans and summaries
└── commands/                  # Internal command state
```

`config.json` is **not** created by install; create it manually when you need non-default CLI behavior.

### Anchoring files

`VERSION` and `fms-file-manifest.json` anchor the install:

- `VERSION` — release installed (read from npm `package.json` at install time).
- `fms-file-manifest.json` — every installed file path and SHA-256 hash.

Runtime data (e.g. `hooks/update-check.json`, `phases/*-SUMMARY.md`) is not in the manifest.

## Configuration (`config.json`)

Optional file at `<fms-root>/config.json`. Loaded by `loadConfig()` in `src/config.ts`; missing or invalid files fall back to defaults.

| Key                           | Default      | Used by                                                         |
| ----------------------------- | ------------ | --------------------------------------------------------------- |
| `commit_docs`                 | `true`       | `execute-phase` — git-add/commit doc paths after stub summaries |
| `mode`                        | `"yolo"`     | Planning flows (`yolo` \| `interactive`)                        |
| `granularity`                 | `"standard"` | Plan sizing                                                     |
| `parallelization`             | `true`       | Context-monitor guidance                                        |
| `model_profile`               | `"balanced"` | Model selection hints                                           |
| `workflow.research`           | `true`       | Prompt before phase research                                    |
| `workflow.plan_check`         | `true`       | Run plan-checker                                                |
| `workflow.verifier`           | `true`       | Verification workflow                                           |
| `workflow.nyquist_validation` | `true`       | Test coverage validation                                        |
| `workflow.auto_advance`       | `true`       | Parallel / auto-advance hints                                   |

JSON with `//` or `/* */` comments is supported. Config is always read from the **CLI fms root** (`.cursor/fms`), not from `.planning/`.

Example:

```json
{
  "commit_docs": false,
  "workflow": {
    "research": false
  }
}
```

## Templates vs `fms new-project` generators

- **`templates/`** — Copied verbatim at install (with `${FMS_RUNTIME}` / `${FMS_ROOT}` substitution). Reference shapes for agents and humans (e.g. copy `PLAN.md` into `phases/`).
- **`fms new-project` does not render from `templates/`**. It generates `PROJECT.md`, `REQUIREMENTS.md`, `ROADMAP.md`, and `STATE.md` via `src/new-project/*`. Generators are **authoritative** for default output.
- **Maintenance rule:** When generator output changes, update matching files under **`core/templates/`** in this repo so installers stay aligned.

## Planning root and `.planning/`

`getPhaseBase()` in `src/phases.ts` picks where phase dirs and planning markdown live:

1. `<fms-root>/ROADMAP.md` exists → use `<fms-root>`
2. Else `.planning/ROADMAP.md` exists → use `.planning/`
3. Else → `<fms-root>`

`phases/`, `quick/`, and reads of `PROJECT.md` / `STATE.md` follow that base. **`fms new-project` writes to the CLI fms root** (`.cursor/fms`), not automatically to `.planning/` — use `.planning/` when you intentionally keep the roadmap there.

## Supported runtimes

Seven runtimes; each has global and local install paths (`src/runtime-paths.ts`):

| Runtime     | Global path                 | Local path (project) |
| ----------- | --------------------------- | -------------------- |
| Cursor      | `~/.cursor/fms`             | `./.cursor/fms`      |
| Claude Code | `~/.claude/fms`             | `./.claude/fms`      |
| OpenCode    | `~/.config/opencode/fms`    | `./.opencode/fms`    |
| Gemini      | `~/.gemini/fms`             | `./.gemini/fms`      |
| Codex       | `~/.codex/fms`              | `./.codex/fms`       |
| Copilot     | `~/.copilot/fms`            | `./.github/fms`      |
| Antigravity | `~/.gemini/antigravity/fms` | `./.agent/fms`       |

### Agent file formats by runtime

- **Cursor / Claude / OpenCode / Gemini / Antigravity**: `agents/fms-*.md`
- **Copilot**: `agents/fms-*.agent.md`
- **Codex**: `agents/fms-*.md`, `agents/fms-*.toml`, and root `config.toml`

Conversion is handled by `src/agent-convert.ts` during install.

## Cursor native integration

When installing for **Cursor** (unless `--no-cursor-native` is passed), `src/cursor-native-install.ts` registers Settings-visible files alongside the fms bundle:

| Destination                   | Source               | Purpose                                                  |
| ----------------------------- | -------------------- | -------------------------------------------------------- |
| `.cursor/agents/fms-*.md`     | `<fms-root>/agents/` | Subagents in Settings (tagged `managed-by: fix-my-shit`) |
| `.cursor/commands/fms-*.md`   | Generated            | Slash commands (`/fms-help`, `/fms-plan-phase`, …)       |
| `.cursor/skills/fms/SKILL.md` | Generated            | Overview skill for discovery                             |

Global installs use `~/.cursor/` instead of `./.cursor/`.

**Routing:**

- **Workflow-primary commands** tell the agent to read `<fms-root>/workflows/*.md` and spawn subagents (map, plan, execute, verify, discuss, quick, new-project).
- **CLI-primary commands** tell the agent to run `fms …` in the terminal (status, config, help, RAG, complete-\* ).

**Manifest:** `<fms-root>/cursor-native-manifest.json` lists every managed native file. On reinstall, the installer removes those paths before repopulating the fms bundle and regenerating native files. User-created agents/commands/skills without `managed-by: fix-my-shit` are not touched.

**Opt-out:** `fms install --cursor --no-cursor-native` installs only `.cursor/fms/`.

See `docs/cursor-commands.md` for the full slash-command table.

## Local vs global CLI root

`resolveFmsRoot()` in `src/path-resolver.ts`:

1. Honor `.fms-prefs.json` if `prefer` is `global` or `local`
2. Default: use `./.cursor/fms` when it exists, else `~/.cursor/fms`

`fms config --set-local` / `--set-global` writes prefs under `.cursor/fms`.

## Custom templates, agents, and workflows

Edit files under your **runtime** install tree:

| Directory    | Who reads it        | Notes                                                                                             |
| ------------ | ------------------- | ------------------------------------------------------------------------------------------------- |
| `templates/` | Agents, humans      | Overrides survive until reinstall (see [Manifest and local patches](#manifest-and-local-patches)) |
| `agents/`    | AI runtime          | Custom `fms-*.md` agents picked up by Cursor/Claude/etc.                                          |
| `workflows/` | AI runtime / skills | Orchestration docs; referenced by Cursor slash commands                                           |

The CLI does **not** auto-invoke custom agents or workflows. Cursor slash commands (installed under `.cursor/commands/`) reference bundled workflows and subagents. TypeScript helpers in `src/extensibility.ts` list top-level files only (not nested paths like `templates/research-project/STACK.md`); nothing in the CLI calls them yet.

## Hooks

Built-in hooks ship **inside the npm package** (`src/hooks/`). They run via `withHooks` in `src/hooks/index.ts`. The installer's `hooks/` directory holds **runtime cache files**, not pluggable hook code.

| Hook              | Stage    | Commands                                                             | Behavior                                                               |
| ----------------- | -------- | -------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| `update-check`    | `before` | `new-project`, `plan-phase`, `execute-phase`, `quick`                | Compare installed `VERSION` to npm; cache in `hooks/update-check.json` |
| `context-monitor` | `before` | `plan-phase`, `execute-phase`                                        | Context-window guidance from `STATE.md`                                |
| `statusline`      | `after`  | `new-project`, `plan-phase`, `execute-phase`, `verify-work`, `quick` | Compact status from `STATE.md`                                         |

All of these commands are wrapped in `withHooks` (including `discuss-phase`, `complete-phase`, `complete-milestone`, which may not trigger every hook):

- `new-project`, `discuss-phase`, `plan-phase`, `execute-phase`, `verify-work`, `complete-phase`, `complete-milestone`, `quick`

Hook failures log as `[fms:hook]` and never abort the command.

**Adding a new hook** requires changing the npm package: implement in `src/hooks/`, register in `builtInHooks` in `src/hooks/index.ts`, and rebuild. Dropping a file into `<fms-root>/hooks/` alone does not register it.

## Workspace: `codebase/` and RAG

Separate from the fms root. `fms map-codebase` / agents write analysis under **`./codebase/`** in the project repo. `fms index-codebase`, `fms query`, and `fms refresh-codebase` operate on that directory (see `src/rag/`). Not part of the install manifest.

## Manifest and local patches

- **`fms-file-manifest.json`** — SHA-256 of every installed file. Re-install compares hashes to detect local edits.
- **`fms-local-patches/`** — Modified files backed up before overwrite; includes `backup-meta.json`.

## Template variables

Text files (`.md`, `.json`, `.js`, `.cjs`, `.toml`, `.txt`) get substitution at install:

| Variable         | Replaced with                            |
| ---------------- | ---------------------------------------- |
| `${FMS_RUNTIME}` | Runtime name (e.g. `cursor`, `claude`)   |
| `${FMS_ROOT}`    | Absolute fms root path (forward slashes) |

## Keeping this document current

This doc is checked in CI. When you change install layout or extensibility behavior, update **both** this file and the contract test.

### Source-of-truth map

| Topic               | Update when changing                                             | Code / path                |
| ------------------- | ---------------------------------------------------------------- | -------------------------- |
| Install tree        | Add/remove `core/templates`, `agents`, `workflows`, `references` | `core/`, `src/install.ts`  |
| CLI root resolution | Path or prefs logic                                              | `src/path-resolver.ts`     |
| Planning base       | `.planning/` behavior                                            | `src/phases.ts`            |
| Config keys         | New `config.json` options                                        | `src/config.ts`            |
| Runtimes / paths    | New runtime or paths                                             | `src/runtime-paths.ts`     |
| Agent formats       | Conversion rules                                                 | `src/agent-convert.ts`     |
| Hooks               | New hook or command wiring                                       | `src/hooks/`, `src/cli.ts` |
| Bundled layout dirs | Installer directories                                            | `src/structure.ts`         |

### Automated check

`src/extensibility-doc.test.ts` verifies:

1. Files under `core/agents`, `core/workflows`, `core/references`, and `core/templates` match the documented manifest.
2. Each bundled filename appears in `docs/extensibility.md`.
3. Hooked commands in `src/cli.ts` match the documented list.

If the test fails, update this document and the `DOCUMENTED_*` constants in that test file.

### PR checklist

- [ ] Changed `core/` layout → updated tree in this doc + `extensibility-doc.test.ts`
- [ ] Changed generator output → updated `core/templates/` + [Templates vs generators](#templates-vs-fms-new-project-generators)
- [ ] Changed CLI behavior → updated relevant section (config, hooks, planning root)
- [ ] Ran `npm test` locally
