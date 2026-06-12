# Help workflow

Entry point for discovering **fix-my-shit** (fms) commands. Prefer the CLI `--help` output as the authoritative list after install.

---

## CLI

```bash
fix-my-shit                    # Interactive install when run with no args (see package/cli behavior)
fix-my-shit --help             # Lists all commands
fix-my-shit help [command]      # Detailed help for one command name
fix-my-shit install             # Copy core bundle into runtime-specific fms root
fix-my-shit config              # Show or set global vs local fms root preference
fix-my-shit status              # PROJECT / roadmap presence and paths
fix-my-shit new-project         # [--prd path]
fix-my-shit discuss-phase <n>
fix-my-shit plan-phase <n>
fix-my-shit execute-phase <n>
fix-my-shit verify-work <n>
fix-my-shit complete-phase
fix-my-shit complete-milestone
fix-my-shit quick [words...]
fix-my-shit index-codebase
fix-my-shit query "question"
fix-my-shit refresh-codebase
```

Runtime integration (Cursor, etc.) typically wraps these subcommands behind `/fms:...` or skills — behaviors match the same binary.

---

## On-disk artifacts

Installed layout includes `templates/`, `workflows/`, `agents/`, and `research/` (reference markdown). Commands read and write planning state under your resolved fms root or workspace `.planning/` per resolver rules.

---

## Success criteria

- [ ] User can list commands and locate the right verb for discuss / plan / execute / verify.
