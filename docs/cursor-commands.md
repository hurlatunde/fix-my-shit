# Fix My Shit (fms) — Commands Reference

All fms commands can be run from the terminal. In Cursor, use the command palette or a terminal to run the equivalent. This document maps slash commands to terminal commands for full parity.

## Core Workflow

| Slash / usage                | Terminal command                      |
|------------------------------|---------------------------------------|
| `/fms:install`               | `fms install` or `npx fix-my-shit`    |
| `/fms:new-project`           | `fms new-project`                     |
| `/fms:new-project --prd X`   | `fms new-project --prd <path>`        |
| `/fms:map-codebase`          | `fms map-codebase`                    |
| `/fms:discuss-phase N`       | `fms discuss-phase <phase>`           |
| `/fms:plan-phase N`          | `fms plan-phase <phase>`              |
| `/fms:execute-phase N`       | `fms execute-phase <phase>`           |
| `/fms:verify-work N`         | `fms verify-work <phase>`             |
| `/fms:complete-phase`        | `fms complete-phase`                  |
| `/fms:complete-milestone`    | `fms complete-milestone`              |

## Quick Mode & Status

| Slash / usage                | Terminal command                      |
|------------------------------|---------------------------------------|
| `/fms:quick`                 | `fms quick`                           |
| `/fms:quick "task desc"`     | `fms quick "task description"`        |
| `/fms:status`                | `fms status`                          |

## Codebase Intelligence (RAG)

| Slash / usage                | Terminal command                      |
|------------------------------|---------------------------------------|
| `/fms:index-codebase`        | `fms index-codebase`                  |
| `/fms:query "question"`      | `fms query "question"`                |
| `/fms:refresh-codebase`      | `fms refresh-codebase`                |

## Configuration & Help

| Slash / usage                | Terminal command                      |
|------------------------------|---------------------------------------|
| `/fms:config`                | `fms config`                          |
| `/fms:config --set-global`   | `fms config --set-global`             |
| `/fms:config --set-local`    | `fms config --set-local`              |
| `/fms:help [cmd]`            | `fms help [command]`                  |

## Install Flags

Skip prompts by passing flags:

```bash
npx fix-my-shit@latest install --cursor --global
npx fix-my-shit@latest install --claude --local
npx fix-my-shit@latest install --all --global
```

Runtime flags: `--cursor`, `--claude`, `--opencode`, `--gemini`, `--codex`, `--copilot`, `--antigravity`, `--all`

Location flags: `--global` / `-g`, `--local` / `-l`

## How to Run in Cursor

1. **Terminal:** Open the integrated terminal and run any `fms <command>` (or `npx fix-my-shit` with no args to run the installer).
2. **Command palette:** Use Cursor's command palette to run a terminal command (e.g. "Run task" or "Terminal: Run command") and enter the fms command.
3. **Slash commands:** If you have a Cursor rule or extension that maps `/fms:quick` to "run `fms quick` in terminal", use that. Otherwise, run the terminal command from the tables above.

All functionality is available from the CLI; there is no separate Cursor-only API.
