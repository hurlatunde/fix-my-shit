# Extensibility: hooks, templates, agents, and workflows

Fix My Shit (fms) is designed so you can extend it without changing the CLI itself. This document explains how the on-disk layout works, how local installs override global ones, and how to add your own templates, agents, and workflows.

## Directory layout and anchors

When you run `npx fix-my-shit` (or `fms install`), the installer creates a stable layout under the chosen fms root (either `./.cursor/fms` or `~/.cursor/fms`):

- `VERSION` — the installed fms version (e.g. `1.0.0`)
- `fms-file-manifest.json` — JSON manifest listing all paths created by the installer
- `hooks/` — built-in and user hooks (runtime state such as `hooks/update-check.json` lives here)
- `templates/` — template files used by planners/executors
- `agents/` — agent configuration and behavior files
- `workflows/` — workflow definitions
- `phases/` — per-phase plans and summaries for projects created via `fms new-project`
- `quick/` — quick mode plans and summaries
- `commands/`, `research/`, and other internal directories

`VERSION` and `fms-file-manifest.json` together anchor the install:

- `VERSION` tells you which release is installed.
- `fms-file-manifest.json` records all paths created during installation so future tooling can validate that the expected layout exists.

Runtime files written later (for example `hooks/update-check.json` or phase summaries under `phases/`) are not required to appear in the manifest; they are treated as data produced on top of the anchored layout.

## Local vs global installs

Path resolution is handled centrally by `resolveFmsRoot`:

- Local first: `./.cursor/fms` in your current workspace, if it exists.
- Otherwise: global `~/.cursor/fms`.
- Preferences: you can force either with `fms config --set-local` or `fms config --set-global`.

Because all high-level commands call `resolveFmsRoot`, any helpers that work against the fms root automatically inherit **local-over-global** behavior:

- A project-local `.cursor/fms` will always be used when present.
- Only when no local install exists will the global `~/.cursor/fms` be used.

## Custom templates, agents, and workflows

You can extend fms by dropping files under the fms root:

- `templates/` — add custom planning or execution templates.
- `agents/` — define custom agents for planning, execution, or verification.
- `workflows/` — define higher-level workflows that orchestrate agents and templates.

The CLI provides helper functions (in `src/extensibility.ts`) that discover these artifacts:

- `listTemplates(fmsRoot: string): string[]` — lists files under `templates/` as relative paths.
- `listAgents(fmsRoot: string): string[]` — lists files under `agents/`.
- `listWorkflows(fmsRoot: string): string[]` — lists files under `workflows/`.

These helpers:

- Respect whatever `fmsRoot` the caller passes (typically from `resolveFmsRoot`).
- Handle missing directories gracefully by returning an empty array.
- Return only files, not directories, as sorted relative paths (e.g. `templates/my-template.md`).

Future versions of fms can plug these helpers directly into planner and executor flows so that your custom templates, agents, and workflows participate in the same lifecycle without changing the on-disk contract.

## Hooks as an extensibility point

In addition to templates/agents/workflows, fms exposes a hook system:

- Hooks live under `hooks/` in the fms root.
- Built-in hooks include:
  - `update-check` — checks npm for newer versions and suggests upgrades without breaking commands.
  - `context-monitor` — prints context window guidance before heavy planning/execution commands.
  - `statusline` — prints a concise status line after core workflow commands.

Hooks are invoked via the shared hook runner in `src/hooks/index.ts` and are wrapped around core commands (`new-project`, `plan-phase`, `execute-phase`, `verify-work`, `complete-phase`, `complete-milestone`, and `quick`) using a `withHooks` helper. Hook failures are logged and never break the primary command flow.

You can extend this behavior by adding additional hook modules under `hooks/` and wiring them into the registry, following the same non-throwing, defensive patterns.

