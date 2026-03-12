# Fix My Shit (fms) — Cursor slash commands and terminal parity

All fms commands can be run from the terminal. In Cursor, use the command palette or a terminal to run the equivalent. This document maps conceptual slash commands to terminal commands for full parity.

## Command mapping

| Slash / usage              | Terminal command                    |
|----------------------------|-------------------------------------|
| `/fms:install`             | `fms install` or `npx fix-my-shit`  |
| `/fms:new-project`         | `fms new-project`                   |
| `/fms:new-project --prd X` | `fms new-project --prd <path>`      |
| `/fms:discuss-phase N`     | `fms discuss-phase <phase>`         |
| `/fms:plan-phase N`        | `fms plan-phase <phase>`            |
| `/fms:execute-phase N`     | `fms execute-phase <phase>`         |
| `/fms:verify-work N`       | `fms verify-work <phase>`           |
| `/fms:complete-phase`      | `fms complete-phase`               |
| `/fms:complete-milestone`  | `fms complete-milestone`            |
| `/fms:quick`               | `fms quick`                        |
| `/fms:quick "task desc"`   | `fms quick "task description"`      |
| `/fms:status`              | `fms status`                       |
| `/fms:config`              | `fms config`                       |
| `/fms:config --set-global`| `fms config --set-global`          |
| `/fms:config --set-local` | `fms config --set-local`           |
| `/fms:help [cmd]`          | `fms help [command]`                |

## How to run in Cursor

1. **Terminal:** Open the integrated terminal and run any `fms <command>` (or `npx fix-my-shit` with no args to run the installer).
2. **Command palette:** Use Cursor’s command palette to run a terminal command (e.g. “Run task” or “Terminal: Run command”) and enter the fms command.
3. **Slash commands:** If you have a Cursor rule or extension that maps `/fms:quick` to “run `fms quick` in terminal”, use that. Otherwise, run the terminal command from the table above.

All functionality is available from the CLI; there is no separate Cursor-only API. Use the terminal (or a task that runs these commands) for full parity.
