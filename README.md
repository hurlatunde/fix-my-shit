## Fix My Shit (fms)

Structured, phased project management and issue resolution for Cursor, delivered as a small Node.js CLI. fms helps you go from vague idea to verified, committed outcome using a repeatable 6‑phase flow, plus a Quick Mode for small tasks.

- **Initialize → Discuss → Plan → Execute → Verify → Complete**
- **All artifacts are plain text** (Markdown/JSON) in `.cursor/fms/` (or `~/.cursor/fms/` in global mode)
- **Built for Cursor users**, but the CLI also works in a regular terminal without Cursor.

---

### Installation

You need **Node.js \(>= 18\)**.

You can run fms via `npx` without a global install:

```bash
npx fix-my-shit
```

On first run, fms will:

- Ask whether you want a **local** fms root in the current project (e.g. `.cursor/fms/`)
- Or a **global** fms root in your home directory \(e.g. `~/.cursor/fms/`\)
- Create the base folder structure, config, and templates

If you prefer a local install:

```bash
npm install fix-my-shit --save-dev
```

Then use:

```bash
npx fix-my-shit
```

or add a script in your `package.json`:

```json
{
  "scripts": {
    "fms": "fix-my-shit"
  }
}
```

and run:

```bash
npm run fms
```

---

### Core Flows

fms is organized around **phases** and **quick runs**. Command names may evolve, but conceptually you get:

- **New project setup**: initialize a project, ask questions, and generate `PROJECT.md`, `REQUIREMENTS.md`, `ROADMAP.md`, and `STATE.md`.
- **Phase workflow**:
  - `Initialize` — set up the phase and context.
  - `Discuss` — clarify gray areas and write `CONTEXT.md`.
  - `Plan` — research and generate a small set of atomic plan files for the phase.
  - `Execute` — run plans in waves, with one atomic commit per plan when in a Git repo.
  - `Verify` — walk through deliverables, spawn debug/fix plans when needed.
  - `Complete` — archive the phase/milestone and update `STATE.md`.
- **Quick Mode**:
  - A shorter flow for ad‑hoc tasks (bug fixes, small features) that still produces plans, execution summaries, and optional commits, storing artifacts under `quick/`.

When wired into Cursor, these flows are available via slash commands such as `/fms:new-project`, `/fms:plan-phase`, `/fms:execute-phase`, and `/fms:quick` (or documented terminal equivalents).

For a deeper description of behavior and requirements, see:

- `./.planning/PROJECT.md` — What fms is and who it is for.
- `./.planning/ROADMAP.md` — Phase breakdown and progress.
- `./.planning/STATE.md` — Current execution state.

---

### Tech Stack

- **Language**: TypeScript
- **Runtime**: Node.js \(>= 18\)
- **CLI**: `commander`, `inquirer`, `chalk`
- **Artifacts**: Markdown/JSON in `.cursor/fms/` or `~/.cursor/fms/`

---

### License

MIT © Hurlatunde

