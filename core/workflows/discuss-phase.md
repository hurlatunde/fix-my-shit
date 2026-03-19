# Discuss Phase Workflow

Capture implementation decisions before planning. Produces CONTEXT.md that downstream agents (researcher, planner, checker) consume.

You are a thinking partner, not an interviewer. The user is the visionary — you are the builder. Your job is to capture decisions that guide research and planning.

**Creates:** `phases/{N}/{N}-CONTEXT.md`

---

## Downstream Awareness

CONTEXT.md feeds into:

1. **fms-phase-researcher** — Reads CONTEXT.md to know WHAT to research
   - "User wants card-based layout" -> researcher investigates card patterns
   - "Infinite scroll decided" -> researcher looks into virtualization
2. **fms-planner** — Reads CONTEXT.md to know WHAT decisions are locked
   - "Pull-to-refresh on mobile" -> planner includes that in task specs
   - "Claude's Discretion: loading skeleton" -> planner can decide approach
3. **fms-plan-checker** — Reads CONTEXT.md to verify plans honor decisions
   - Locked decisions must have implementing tasks
   - Deferred ideas must NOT appear in plans

Your job: Capture decisions clearly enough that downstream agents act on them without asking the user again.

Not your job: Figure out HOW to implement. That's research and planning.

---

## Process

### 1. Load Context

Read:
- `ROADMAP.md` — phase goal and scope (FIXED boundary)
- `PROJECT.md` — project vision
- `REQUIREMENTS.md` — must-haves mapped to this phase

### 2. Identify Gray Areas

Gray areas are implementation decisions the user cares about — things that could go multiple ways.

Based on the phase domain:
- Something users SEE -> visual presentation, interactions, states
- Something users CALL -> interface contracts, responses, errors
- Something users RUN -> invocation, output, behavior modes
- Something users READ -> structure, tone, depth, flow

For each gray area, identify 2-3 reasonable options. Present them to the user.

### 3. Deep-Dive Selected Areas

For each area the user wants to discuss:
- Present options with brief tradeoffs
- Capture the user's choice as a **locked decision**
- Mark areas user defers as **deferred ideas**
- Mark areas user leaves to AI judgment as **Claude's discretion**

### 4. Write CONTEXT.md

Write to `phases/{N}/{N}-CONTEXT.md` using the template structure:

**Required sections:**

- **Domain** — What this phase delivers (phase boundary)
- **Decisions** — Locked choices the planner MUST implement exactly
- **Claude's Discretion** — Areas where the AI can use judgment
- **Deferred Ideas** — Out of scope, noted for future phases
- **Canonical References** — External specs or ADRs agents should read
- **Specifics** — Concrete requirements and acceptance criteria

---

## Scope Guardrail (Critical)

The phase boundary comes from ROADMAP.md and is FIXED. Discussion clarifies HOW to implement what's scoped, never WHETHER to add new capabilities.

**Allowed (clarifying ambiguity):**
- "How should posts be displayed?" (layout, density)
- "What happens on empty state?" (within the feature)

**Not allowed (scope creep):**
- "Should we also add comments?" (new capability)
- "What about search/filtering?" (new capability)

When user suggests scope creep: Note it in Deferred Ideas, redirect to phase scope.

---

## Success Criteria

- [ ] Phase goal and scope understood from ROADMAP.md
- [ ] Gray areas identified and presented to user
- [ ] User decisions captured (locked, discretion, deferred)
- [ ] CONTEXT.md written with all required sections
- [ ] No scope creep — phase boundary maintained
- [ ] Decisions specific enough for downstream agents
