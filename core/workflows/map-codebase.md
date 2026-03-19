# Map Codebase Workflow

Orchestrate parallel codebase mapper agents to analyze a codebase and produce structured documents in `codebase/`.

Each agent has fresh context, explores a specific focus area, and writes documents directly. The orchestrator only receives confirmation + line counts, then writes a summary.

**Creates:** `codebase/` folder with 7 structured documents about the codebase state.

---

## Philosophy

**Why dedicated mapper agents:**
- Fresh context per domain (no token contamination)
- Agents write documents directly (no context transfer back to orchestrator)
- Orchestrator only summarizes what was created (minimal context usage)
- Faster execution (agents run simultaneously)

**Document quality over length:**
Include enough detail to be useful as reference. Prioritize practical examples (especially code patterns) over arbitrary brevity.

**Always include file paths:**
Documents are reference material when planning/executing. Always include actual file paths formatted with backticks: `src/services/user.ts`.

---

## Process

### 1. Check Existing

Check if `codebase/` already exists.

**If exists:**

```
codebase/ already exists with these documents:
[List files found]

What's next?
1. Refresh — Delete existing and remap codebase
2. Update — Keep existing, only update specific documents
3. Skip — Use existing codebase map as-is
```

Wait for user response.

- If "Refresh": Delete `codebase/`, continue to step 2.
- If "Update": Ask which documents to update, continue to step 3 (filtered).
- If "Skip": Exit workflow.

**If doesn't exist:** Continue to step 2.

### 2. Create Structure

Create `codebase/` directory.

Expected output files:
- STACK.md (from tech mapper)
- INTEGRATIONS.md (from tech mapper)
- ARCHITECTURE.md (from arch mapper)
- STRUCTURE.md (from arch mapper)
- CONVENTIONS.md (from quality mapper)
- TESTING.md (from quality mapper)
- CONCERNS.md (from concerns mapper)

### 3. Spawn 4 Parallel Mapper Agents

Spawn 4 parallel `fms-codebase-mapper` agents using the Task tool. Use `run_in_background=true` for parallel execution.

**Agent 1: Tech Focus**

```
Task(
  subagent_type="generalPurpose",
  run_in_background=true,
  description="Map codebase tech stack",
  prompt="Focus: tech

Analyze this codebase for technology stack and external integrations.

Write these documents to codebase/:
- STACK.md — Languages, runtime, frameworks, dependencies, configuration
- INTEGRATIONS.md — External APIs, databases, auth providers, webhooks

Explore thoroughly. Write documents directly using the templates from the fms-codebase-mapper agent spec. Return confirmation only."
)
```

**Agent 2: Architecture Focus**

```
Task(
  subagent_type="generalPurpose",
  run_in_background=true,
  description="Map codebase architecture",
  prompt="Focus: arch

Analyze this codebase architecture and directory structure.

Write these documents to codebase/:
- ARCHITECTURE.md — Pattern, layers, data flow, abstractions, entry points
- STRUCTURE.md — Directory layout, key locations, naming conventions

Explore thoroughly. Write documents directly using the templates from the fms-codebase-mapper agent spec. Return confirmation only."
)
```

**Agent 3: Quality Focus**

```
Task(
  subagent_type="generalPurpose",
  run_in_background=true,
  description="Map codebase conventions",
  prompt="Focus: quality

Analyze this codebase for coding conventions and testing patterns.

Write these documents to codebase/:
- CONVENTIONS.md — Code style, naming, patterns, error handling
- TESTING.md — Framework, structure, mocking, coverage

Explore thoroughly. Write documents directly using the templates from the fms-codebase-mapper agent spec. Return confirmation only."
)
```

**Agent 4: Concerns Focus**

```
Task(
  subagent_type="generalPurpose",
  run_in_background=true,
  description="Map codebase concerns",
  prompt="Focus: concerns

Analyze this codebase for technical debt, known issues, and areas of concern.

Write this document to codebase/:
- CONCERNS.md — Tech debt, bugs, security, performance, fragile areas

Explore thoroughly. Write document directly using the template from the fms-codebase-mapper agent spec. Return confirmation only."
)
```

### 4. Collect Confirmations

Wait for all 4 agents to complete.

Read each agent's output file to collect confirmations.

Expected confirmation format from each agent:

```
## Mapping Complete

**Focus:** {focus}
**Documents written:**
- `codebase/{DOC1}.md` ({N} lines)
- `codebase/{DOC2}.md` ({N} lines)

Ready for orchestrator summary.
```

What you receive: Just file paths and line counts. NOT document contents.

If any agent failed, note the failure and continue with successful documents.

### 5. Verify Output

Verify all documents created successfully. Check:

- All 7 documents exist
- No empty documents (each should have >20 lines)

If any documents missing or empty, note which agents may have failed.

### 6. Present Final Status

Display completion summary:

```
Codebase mapping complete.

Created codebase/:
- STACK.md ([N] lines) — Technologies and dependencies
- ARCHITECTURE.md ([N] lines) — System design and patterns
- STRUCTURE.md ([N] lines) — Directory layout and organization
- CONVENTIONS.md ([N] lines) — Code style and patterns
- TESTING.md ([N] lines) — Test structure and practices
- INTEGRATIONS.md ([N] lines) — External services and APIs
- CONCERNS.md ([N] lines) — Technical debt and issues

Next: Run new-project or plan-phase to use codebase context for planning.

Also available:
- Re-run mapping: map-codebase
- Review specific file: Read codebase/STACK.md
- Edit any document before proceeding
```

---

## Success Criteria

- [ ] `codebase/` directory created
- [ ] 4 parallel mapper agents spawned
- [ ] Agents write documents directly (orchestrator doesn't receive document contents)
- [ ] Confirmations collected from agent output
- [ ] All 7 codebase documents exist and are non-empty
- [ ] Clear completion summary with line counts
- [ ] User offered clear next steps
