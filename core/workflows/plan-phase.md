# Plan Phase Workflow

Create executable phase plans (PLAN.md files) for a roadmap phase with integrated research and verification.

Default flow: Research (if needed) -> Plan -> Verify -> Done.
Orchestrates fms-phase-researcher, fms-planner, and fms-plan-checker agents with a revision loop (max 3 iterations).

**Creates:** `phases/{N}/{N}-RESEARCH.md`, `phases/{N}/{N}-{M}-PLAN.md`

---

## Process

### 1. Initialize

Load planning context by reading core files:

- `PROJECT.md` (project vision and constraints)
- `REQUIREMENTS.md` (must-haves)
- `ROADMAP.md` (phases and requirement mappings)
- `STATE.md` (current position, blockers, decisions)

Determine:
- `phase_number`: Which phase to plan (from argument or next unplanned)
- `phase_name`: Phase title from ROADMAP.md
- `phase_goal`: What this phase delivers
- `phase_req_ids`: Requirement IDs mapped to this phase
- `phase_dir`: `phases/{N}`
- `has_context`: Does `{phase_dir}/{N}-CONTEXT.md` exist?
- `has_research`: Does `{phase_dir}/{N}-RESEARCH.md` exist?
- `has_plans`: Do `{phase_dir}/{N}-*-PLAN.md` files exist?

If the phase directory doesn't exist, create it.

### 2. Validate Phase

Verify the phase exists in ROADMAP.md. If not found, show available phases and exit.

Extract the phase goal — it must be outcome-shaped ("Working chat interface") not task-shaped ("Build chat components").

### 3. Load CONTEXT.md

Check if `{phase_dir}/{N}-CONTEXT.md` exists.

**If CONTEXT.md exists:** Load it. Extract locked decisions, discretion areas, deferred ideas. Display: `Using phase context from: {path}`

**If CONTEXT.md does not exist:** Ask the user:
- **Continue without context** — Plan using research + requirements only (user preferences not captured)
- **Run discuss-phase first** — Capture design decisions before planning. Display `discuss-phase {N}` and exit.

### 4. Handle Research

**Skip if:** `--skip-research` flag is set.

**If RESEARCH.md already exists AND no `--research` flag:** Use existing, skip to step 5.

**If RESEARCH.md missing OR `--research` flag set:**

Ask the user whether to research:
- **Research first (Recommended)** — Investigate domain, patterns, and dependencies before planning. Best for new features, unfamiliar integrations, or architectural changes.
- **Skip research** — Plan directly from context and requirements. Best for bug fixes, simple refactors, or well-understood tasks.

If user selects "Skip research": skip to step 5.

#### Spawn fms-phase-researcher

Build the researcher prompt:

```
Research how to implement Phase {N}: {phase_name}
Answer: "What do I need to know to PLAN this phase well?"

<files_to_read>
- PROJECT.md
- REQUIREMENTS.md
- ROADMAP.md
- STATE.md
- {phase_dir}/{N}-CONTEXT.md (if exists)
</files_to_read>

Phase description: {phase_goal}
Phase requirement IDs: {phase_req_ids}

Output: Write to {phase_dir}/{N}-RESEARCH.md
```

Spawn the researcher agent using the Task tool:

```
Task(
  prompt=research_prompt,
  subagent_type="generalPurpose",
  description="Research Phase {N}"
)
```

#### Handle Researcher Return

- **`## RESEARCH COMPLETE`:** Display confirmation, continue to step 5.
- **`## RESEARCH BLOCKED`:** Display blocker. Offer: 1) Provide context, 2) Skip research, 3) Abort.

### 5. Check Existing Plans

List `{phase_dir}/{N}-*-PLAN.md` files.

**If plans exist:** Offer:
1. Add more plans
2. View existing plans
3. Replan from scratch (removes existing plans)

### 6. Spawn fms-planner Agent

Build the planner prompt:

```
Create executable plans for Phase {N}: {phase_name}

Mode: {standard | gap_closure}

<files_to_read>
- PROJECT.md
- REQUIREMENTS.md
- ROADMAP.md
- STATE.md
- {phase_dir}/{N}-CONTEXT.md (if exists)
- {phase_dir}/{N}-RESEARCH.md (if exists)
</files_to_read>

Phase requirement IDs (every ID MUST appear in a plan's requirements field): {phase_req_ids}

Output consumed by execute-phase workflow. Plans need:
- YAML frontmatter (phase, plan, type, wave, depends_on, files_modified, autonomous, requirements, must_haves)
- Tasks with files, action, verify, done fields
- Verification criteria
- must_haves derived using goal-backward methodology

Write PLAN.md files to: {phase_dir}/{N}-{NN}-PLAN.md
```

Spawn the planner agent:

```
Task(
  prompt=planner_prompt,
  subagent_type="generalPurpose",
  description="Plan Phase {N}"
)
```

#### Handle Planner Return

- **`## PLANNING COMPLETE`:** Display plan count and wave structure. If `--skip-verify` flag: skip to step 9. Otherwise: step 7.
- **`## PLANNING INCONCLUSIVE`:** Show issues, offer: Add context / Retry / Manual.

### 7. Spawn fms-plan-checker Agent

Build the checker prompt:

```
Verify plans will achieve Phase {N}: {phase_name} goal.

<files_to_read>
- ROADMAP.md (phase goal and requirement IDs)
- REQUIREMENTS.md
- {phase_dir}/{N}-CONTEXT.md (if exists)
- {phase_dir}/{N}-*-PLAN.md (all plan files)
</files_to_read>

Phase requirement IDs (MUST ALL be covered): {phase_req_ids}

Expected output:
- ## VERIFICATION PASSED — all checks pass
- ## ISSUES FOUND — structured issue list
```

Spawn the checker agent:

```
Task(
  prompt=checker_prompt,
  subagent_type="generalPurpose",
  description="Verify Phase {N} plans"
)
```

#### Handle Checker Return

- **`## VERIFICATION PASSED`:** Display confirmation, proceed to step 9.
- **`## ISSUES FOUND`:** Display issues, check iteration count, proceed to step 8.

### 8. Revision Loop (Max 3 Iterations)

Track `iteration_count` (starts at 1 after initial plan + check).

**If iteration_count < 3:**

Display: `Sending back to planner for revision... (iteration {N}/3)`

Build revision prompt:

```
Revise plans for Phase {N}: {phase_name}

Mode: revision

<files_to_read>
- {phase_dir}/{N}-*-PLAN.md (existing plans)
- {phase_dir}/{N}-CONTEXT.md (if exists)
</files_to_read>

Checker issues:
{structured_issues_from_checker}

Make targeted updates to address checker issues.
Do NOT replan from scratch unless issues are fundamental.
Return what changed.
```

Spawn the planner agent in revision mode:

```
Task(
  prompt=revision_prompt,
  subagent_type="generalPurpose",
  description="Revise Phase {N} plans"
)
```

After planner returns -> spawn checker again (step 7), increment iteration_count.

**If iteration_count >= 3:**

Display: `Max iterations reached. {N} issues remain:`

Offer:
1. Force proceed (accept remaining issues)
2. Provide guidance and retry
3. Abandon planning

### 9. Present Final Status

Display phase planning summary:

```
Phase {N}: {Name} — {plan_count} plan(s) in {wave_count} wave(s)

| Wave | Plans | What it builds |
|------|-------|----------------|
| 1 | 01, 02 | (objectives) |
| 2 | 03 | (objective) |

Research: Completed | Used existing | Skipped
Verification: Passed | Passed with override | Skipped

Next: Run execute-phase {N}
```

---

## Modes

### Standard Mode

Full flow: Research -> Plan -> Check -> Revise -> Done.

### Gap Closure Mode (--gaps flag)

Create plans to address verification or UAT failures:

1. Read VERIFICATION.md or UAT.md for failed items
2. Parse gaps (failed truth, reason, artifacts, missing items)
3. Group gaps into plans
4. Create gap closure plans with `gap_closure: true` in frontmatter
5. Run through checker

### Skip Research Mode (--skip-research flag)

Skip directly to planning. Best for well-understood work.

### Force Research Mode (--research flag)

Run research even if RESEARCH.md already exists. Overwrites previous research.

### Skip Verification Mode (--skip-verify flag)

Skip the plan checker. Plans are created but not verified.

---

## Agent Coordination

### Context Efficiency

The orchestrator stays thin — it coordinates agents, it doesn't do their work.

- Orchestrator: Holds file paths and status, ~10-15% context usage
- Each agent: Gets fresh 100% context, works independently
- Structured returns: Agents end with `## RESULT_TYPE` for reliable parsing

### Structured Communication

| Agent | Spawns After | Returns | Consumed By |
|-------|-------------|---------|-------------|
| fms-phase-researcher | Step 4 | `## RESEARCH COMPLETE` or `## RESEARCH BLOCKED` | Orchestrator -> fms-planner |
| fms-planner | Step 6 | `## PLANNING COMPLETE` or revision result | Orchestrator -> fms-plan-checker |
| fms-plan-checker | Step 7 | `## VERIFICATION PASSED` or `## ISSUES FOUND` | Orchestrator -> revision loop |

### Decision Fidelity Chain

CONTEXT.md decisions flow through the entire pipeline:

1. **Researcher** receives locked decisions -> researches THOSE, not alternatives
2. **Planner** receives locked decisions -> implements THOSE exactly
3. **Checker** receives locked decisions -> verifies plans honor THOSE

---

## Success Criteria

- [ ] Phase validated against ROADMAP.md
- [ ] Phase directory created if needed
- [ ] CONTEXT.md loaded and passed to ALL agents (if exists)
- [ ] Research completed (unless skipped or already exists)
- [ ] fms-planner spawned with full context (CONTEXT.md + RESEARCH.md)
- [ ] PLAN.md files created with valid frontmatter and task structure
- [ ] fms-plan-checker spawned for goal-backward verification
- [ ] Verification passed OR user override OR max iterations with user decision
- [ ] User sees status between agent spawns
- [ ] User knows next steps (execute-phase)
