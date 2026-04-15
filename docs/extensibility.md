# Extensibility: Hooks, Templates, Agents, and Workflows

Fix My Shit (fms) is designed so you can extend it without changing the CLI itself. This document explains the on-disk layout, how local installs override global ones, multi-runtime support, and how to add your own templates, agents, and workflows.

## Directory Layout

When you run `npx fix-my-shit` (or `fms install`), the installer creates a stable layout under the chosen fms root:

```
<fms-root>/
├── VERSION                    # Installed fms version
├── fms-file-manifest.json     # JSON manifest of all installed paths + hashes
├── package.json               # Minimal package metadata
├── templates/                 # Template files used by planners/executors
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
│   └── research-project/      # Research sub-templates
│       ├── SUMMARY.md
│       ├── STACK.md
│       ├── FEATURES.md
│       ├── ARCHITECTURE.md
│       └── PITFALLS.md
├── agents/                    # Agent configuration and behavior files
│   ├── fms-planner.md
│   ├── fms-plan-checker.md
│   ├── fms-executor.md
│   ├── fms-phase-researcher.md
│   ├── fms-verifier.md
│   ├── fms-debugger.md
│   └── fms-codebase-mapper.md
├── workflows/                 # Workflow definitions
│   ├── new-project.md
│   ├── discuss-phase.md
│   ├── plan-phase.md
│   ├── execute-phase.md
│   ├── map-codebase.md
│   ├── verify-work.md
│   ├── quick.md
│   └── help.md
├── research/                  # Reference documents (from core/references)
│   ├── verification-patterns.md
│   ├── git-integration.md
│   ├── questioning.md
│   └── continuation-format.md
├── hooks/                     # Built-in and user hooks
├── phases/                    # Per-phase plans and summaries
├── quick/                     # Quick mode plans and summaries
└── commands/                  # Internal command state
```

### Anchoring Files

`VERSION` and `fms-file-manifest.json` together anchor the install:

- **`VERSION`** — Which release is installed.
- **`fms-file-manifest.json`** — Records every installed file path and its SHA-256 hash. Used to detect local modifications on re-install.

Runtime files written later (phase summaries, quick task outputs, hook state like `hooks/update-check.json`) are not required to appear in the manifest; they are data produced on top of the anchored layout.

## Supported Runtimes

fms supports 7 runtimes. Each has its own global and local install path:

| Runtime       | Global path                      | Local path (project)     |
|---------------|----------------------------------|--------------------------|
| Cursor        | `~/.cursor/fms`                  | `./.cursor/fms`          |
| Claude Code   | `~/.claude/fms`                  | `./.claude/fms`          |
| OpenCode      | `~/.config/opencode/fms`         | `./.opencode/fms`        |
| Gemini        | `~/.gemini/fms`                  | `./.gemini/fms`          |
| Codex         | `~/.codex/fms`                   | `./.codex/fms`           |
| Copilot       | `~/.copilot/fms`                 | `./.github/fms`          |
| Antigravity   | `~/.gemini/antigravity/fms`      | `./.agent/fms`           |

### Agent File Formats by Runtime

The agent file format varies by runtime:

- **Cursor / Claude / OpenCode / Gemini / Antigravity**: `agents/fms-*.md`
- **Copilot**: `agents/fms-*.agent.md` (tool names mapped to Copilot conventions)
- **Codex**: `agents/fms-*.md` plus `agents/fms-*.toml` and a root `config.toml` that registers agents

The installer handles format conversion automatically via `agent-convert.ts`.

## Local vs Global Installs

Path resolution is handled centrally by `resolveFmsRoot`:

1. **Local first:** `./<runtime-local-path>/fms` in the current workspace, if it exists.
2. **Otherwise:** Global `~/<runtime-global-path>/fms`.
3. **Preferences:** Force either with `fms config --set-local` or `fms config --set-global`.

All high-level commands call `resolveFmsRoot`, so any helpers that work against the fms root automatically inherit **local-over-global** behavior. A project-local install will always be used when present.

## Custom Templates, Agents, and Workflows

Extend fms by dropping files under the fms root:

- **`templates/`** — Custom planning or execution templates.
- **`agents/`** — Custom agents for planning, execution, or verification.
- **`workflows/`** — Higher-level workflows that orchestrate agents and templates.

The CLI provides helper functions (in `src/extensibility.ts`) that discover these artifacts:

| Function | Description |
|----------|-------------|
| `listTemplates(fmsRoot)` | Lists files under `templates/` as relative paths |
| `listAgents(fmsRoot)` | Lists files under `agents/` |
| `listWorkflows(fmsRoot)` | Lists files under `workflows/` |

These helpers respect whatever `fmsRoot` the caller passes (typically from `resolveFmsRoot`), handle missing directories gracefully (returning an empty array), and return only files — not directories — as sorted relative paths.

## Hooks

fms exposes a lifecycle hook system that wraps core commands without interfering with them.

### Built-in Hooks

| Hook | Description |
|------|-------------|
| `update-check` | Checks npm for newer versions and suggests upgrades |
| `context-monitor` | Prints context window guidance before heavy planning/execution commands |
| `statusline` | Prints a concise status line after core workflow commands |

### How Hooks Work

Hooks are invoked via the shared hook runner in `src/hooks/index.ts` using a `withHooks` helper that wraps core commands. The lifecycle is:

1. **Before hooks** run in parallel before the command executes.
2. **The command** runs normally.
3. **After hooks** run in parallel when the command completes (including on error).

Hook failures are logged with `[fms:hook]` prefix and never break the primary command flow.

### Hooked Commands

The following commands run inside `withHooks`:

- `new-project`
- `discuss-phase`
- `plan-phase`
- `execute-phase`
- `verify-work`
- `complete-phase`
- `complete-milestone`
- `quick`

### Adding Custom Hooks

Add hook modules under `hooks/` and wire them into the `builtInHooks` registry in `src/hooks/index.ts`. Follow the same non-throwing, defensive patterns — every hook should be wrapped in a try/catch and return `Promise<void>`.

## Manifest and Local Patches

- **`fms-file-manifest.json`** — Records every installed file and its SHA-256 hash. On re-install, the installer compares current file hashes against the manifest to detect local modifications.
- **`fms-local-patches/`** — If you re-install and had modified any installed files, those versions are copied here before overwriting. A `backup-meta.json` file lists what was backed up (including the previous version) so you can compare or reapply changes after upgrading.

## Template Variables

Text files (`.md`, `.json`, `.js`, `.cjs`, `.toml`, `.txt`) are templated during install with:

| Variable | Replaced with |
|----------|---------------|
| `${FMS_RUNTIME}` | The runtime name (e.g. `cursor`, `claude`) |
| `${FMS_ROOT}` | The absolute fms root path (forward slashes) |
