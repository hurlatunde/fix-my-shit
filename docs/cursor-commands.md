# Fix My Shit (fms) — Cursor slash commands and terminal parity

All fms commands can be run from the terminal. On **Cursor** installs, the installer also registers native slash commands, subagents, and an overview skill in Cursor Settings.

## Slash command names

Cursor slash commands use the **filename** under `.cursor/commands/` (or `~/.cursor/commands/` for global installs):

| Slash in Cursor           | Terminal command                   |
| ------------------------- | ---------------------------------- |
| `/fms-install`            | `fms install` or `npx fix-my-shit` |
| `/fms-new-project`        | `fms new-project`                  |
| `/fms-discuss-phase`      | `fms discuss-phase <phase>`        |
| `/fms-plan-phase`         | `fms plan-phase <phase>`           |
| `/fms-execute-phase`      | `fms execute-phase <phase>`        |
| `/fms-verify-work`        | `fms verify-work <phase>`          |
| `/fms-complete-phase`     | `fms complete-phase`               |
| `/fms-complete-milestone` | `fms complete-milestone`           |
| `/fms-map-codebase`       | (workflow only — see below)        |
| `/fms-quick`              | `fms quick`                        |
| `/fms-status`             | `fms status`                       |
| `/fms-config`             | `fms config`                       |
| `/fms-help`               | `fms help [command]`               |
| `/fms-index-codebase`     | `fms index-codebase`               |
| `/fms-query`              | `fms query "question"`             |
| `/fms-refresh-codebase`   | `fms refresh-codebase`             |

Older docs used a colon form (`/fms:help`). Native Cursor commands use hyphens (`/fms-help`).

## What the installer registers (Cursor only)

| Cursor Settings | Install path                                 | Contents                                 |
| --------------- | -------------------------------------------- | ---------------------------------------- |
| Subagents       | `.cursor/agents/` or `~/.cursor/agents/`     | Copies of `fms-*.md` from the fms bundle |
| Commands        | `.cursor/commands/` or `~/.cursor/commands/` | One `fms-*.md` per command               |
| Skills          | `.cursor/skills/fms/SKILL.md`                | Overview skill for discovery             |

The fms bundle itself remains at `.cursor/fms/` (workflows, templates, research, hooks).

Skip native registration with:

```bash
npx fix-my-shit@latest install --cursor --local --no-cursor-native
```

After install, reload the Cursor window so Settings picks up new files.

## Workflow vs CLI routing

Slash commands use two strategies:

**Workflow-primary** (agent reads `.cursor/fms/workflows/` and spawns subagents):

- `/fms-map-codebase`, `/fms-new-project`, `/fms-discuss-phase`, `/fms-plan-phase`, `/fms-execute-phase`, `/fms-verify-work`, `/fms-quick`

**CLI-primary** (agent runs `fms …` in the terminal):

- `/fms-status`, `/fms-config`, `/fms-help`, `/fms-install`, `/fms-index-codebase`, `/fms-query`, `/fms-refresh-codebase`, `/fms-complete-phase`, `/fms-complete-milestone`

Heavy AI work (mapping, planning, executing plans) is implemented as **workflows + subagents**. The CLI still provides scaffolding, state updates, RAG utilities, and alternate paths for some commands.

## How to run in Cursor

1. **Slash commands:** Type `/` and choose an `fms-*` command from the menu (after install + reload).
2. **Terminal:** Run any `fms <command>` in the integrated terminal.
3. **Subagents:** Invoke `fms-planner`, `fms-executor`, etc. from the subagent picker or via workflow orchestration.

## Install flags

```bash
npx fix-my-shit@latest install --cursor --global
npx fix-my-shit@latest install --claude --local
npx fix-my-shit@latest install --all --global
npx fix-my-shit@latest install --cursor --local --no-cursor-native
```

Runtime flags: `--cursor`, `--claude`, `--opencode`, `--gemini`, `--codex`, `--copilot`, `--antigravity`, `--all`

Location flags: `--global` / `-g`, `--local` / `-l`

Opt-out: `--no-cursor-native` (Cursor only — keeps `.cursor/fms/` without touching agents/commands/skills)
