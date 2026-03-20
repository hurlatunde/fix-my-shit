# Map Codebase Workflow

Orchestrate parallel codebase mapper agents to analyze a codebase and produce structured documents in `codebase/`.

Each agent has fresh context, explores a specific focus area, and writes documents directly. The orchestrator only receives confirmation + line counts, then generates a cross-reference summary.

**Creates:** `codebase/` folder with 9 structured documents about the codebase state.

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

Expected output files (9 total):
- STACK.md (from tech mapper)
- INTEGRATIONS.md (from tech mapper)
- ARCHITECTURE.md (from arch mapper)
- STRUCTURE.md (from arch mapper)
- SYMBOLS.md (from arch mapper)
- CONVENTIONS.md (from quality mapper)
- TESTING.md (from quality mapper)
- CONCERNS.md (from concerns mapper)
- SUMMARY.md (generated after all mappers complete — step 5)

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

Analyze this codebase architecture, directory structure, and exported symbols.

Write these documents to codebase/:
- ARCHITECTURE.md — Pattern, layers, data flow, abstractions, entry points
- STRUCTURE.md — Directory layout, key locations, naming conventions
- SYMBOLS.md — Exported functions, classes, types, constants indexed by file path

For SYMBOLS.md: Read source files and catalog every exported symbol with a one-line description. This enables agents to find specific functions without reading entire files.

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

### 5. Generate SUMMARY.md (Cross-Reference Index)

After all 4 mapper agents complete, spawn a 5th agent **sequentially** to read all generated documents and produce a cross-referencing summary.

```
Task(
  subagent_type="generalPurpose",
  description="Generate codebase summary",
  prompt="Read all documents in the codebase/ directory:
- codebase/STACK.md
- codebase/INTEGRATIONS.md
- codebase/ARCHITECTURE.md
- codebase/STRUCTURE.md
- codebase/SYMBOLS.md
- codebase/CONVENTIONS.md
- codebase/TESTING.md
- codebase/CONCERNS.md

Write codebase/SUMMARY.md with this structure:

# Codebase Summary

**Analysis Date:** [today's date]

## Overview
Brief 3-5 line project description synthesized from all documents.

## Document Index
One line per document: **DOC.md** — key highlights (technologies, patterns, counts).

## Cross-References
Identify themes that span multiple documents. For each cross-cutting theme:
- Name the theme
- List which documents mention it and in which section
- Example: 'Duplicated parseFrontmatter() — CONCERNS.md > Tech Debt, SYMBOLS.md > src/execute-phase/wave-builder.ts + src/plan-phase/plan-checker.ts'

## Key Patterns (Quick Reference)
5-10 bullet points: the most common patterns an agent needs when working in this codebase.
Each bullet: what to do + which document has details.

Keep SUMMARY.md under 120 lines. It is a navigation aid, not a copy of the other documents.
Return confirmation only."
)
```

### 6. Verify Output

Verify all documents created successfully. Check:

- All 9 documents exist (8 from mappers + SUMMARY.md)
- No empty documents (each should have >20 lines)

If any documents missing or empty, note which agents may have failed.

### 7. Write meta.json

Write `codebase/meta.json` to track when the mapping was performed:

```json
{
  "version": 1,
  "mappedAt": "<current ISO timestamp>",
  "gitCommit": "<current git HEAD hash, or null if not a git repo>",
  "focusTimestamps": {
    "tech": "<timestamp>",
    "arch": "<timestamp>",
    "quality": "<timestamp>",
    "concerns": "<timestamp>",
    "summary": "<timestamp>"
  }
}
```

If using the CLI: run `fms index-codebase` which writes meta.json automatically.

If writing manually: create the file with the current timestamp and git commit hash (run `git rev-parse HEAD` if available).

This enables `fms refresh-codebase` to detect drift and suggest incremental updates later.

### 8. Present Final Status

Display completion summary:

```
Codebase mapping complete.

Created codebase/ (9 documents):
- STACK.md ([N] lines) — Technologies and dependencies
- ARCHITECTURE.md ([N] lines) — System design and patterns
- STRUCTURE.md ([N] lines) — Directory layout and organization
- SYMBOLS.md ([N] lines) — Exported functions, classes, types
- CONVENTIONS.md ([N] lines) — Code style and patterns
- TESTING.md ([N] lines) — Test structure and practices
- INTEGRATIONS.md ([N] lines) — External services and APIs
- CONCERNS.md ([N] lines) — Technical debt and issues
- SUMMARY.md ([N] lines) — Cross-reference index

Next: Run new-project or plan-phase to use codebase context for planning.

Also available:
- Detect drift: fms refresh-codebase
- Re-run mapping: map-codebase
- Review specific file: Read codebase/STACK.md
- Edit any document before proceeding
```

### 9. Build RAG Index (Optional)

After documents are verified, check if the embedding library is available:

**If `@huggingface/transformers` or `@xenova/transformers` is installed:**

Run `fms index-codebase` (or `node dist/cli.js index-codebase`) to build a semantic search index over the codebase analysis documents.

Report in summary:
```
RAG index built: {N} chunks indexed ({dim}-dim vectors)
Agents can now query codebase knowledge semantically.
```

**If not available:**

Note in the completion summary:
```
Optional: Install @huggingface/transformers and run `fms index-codebase`
to enable semantic search over codebase analysis documents.
```

Do not fail or block the workflow — the RAG index is a quality enhancement, not a requirement. The 9 markdown documents are fully usable without it.

---

## Success Criteria

- [ ] `codebase/` directory created
- [ ] 4 parallel mapper agents spawned
- [ ] Agents write documents directly (orchestrator doesn't receive document contents)
- [ ] Confirmations collected from agent output
- [ ] SUMMARY.md generated as cross-reference index (sequential 5th agent)
- [ ] All 9 codebase documents exist and are non-empty
- [ ] meta.json written with mapping timestamp and git commit
- [ ] Clear completion summary with line counts
- [ ] RAG index built if embedding library available (optional)
- [ ] User offered clear next steps (including refresh-codebase)
