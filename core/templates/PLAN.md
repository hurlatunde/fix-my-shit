---
phase: ${PHASE}
plan: ${PLAN_NUMBER}
type: execute
wave: 1
depends_on: []
files_modified: []
autonomous: true
requirements: []
must_haves:
  truths: []
  artifacts: []
  key_links: []
---

<objective>
(What this plan accomplishes in 1-2 sentences.)

Purpose: (Why this matters for the phase goal.)
Output: (Artifacts created or modified.)
</objective>

<context>
@PROJECT.md
@ROADMAP.md
@STATE.md
@phases/${PHASE}/${PHASE}-RESEARCH.md
</context>

<tasks>

<task type="auto">
  <name>Task 1: (Action-oriented name)</name>
  <files>(exact file paths created or modified)</files>
  <action>
  (Specific implementation instructions. Include what to avoid and WHY.
  Must be detailed enough that a different AI instance can execute
  without asking clarifying questions.)
  </action>
  <verify>(Command or check to prove completion)</verify>
  <done>(Measurable acceptance criteria)</done>
</task>

</tasks>

<verification>
(Overall plan verification — commands or checks that confirm
all tasks work together as intended.)
</verification>

<success_criteria>
(Measurable completion state. What must be TRUE when this plan is done.)
</success_criteria>

<output>
After completion, create `phases/${PHASE}/${PHASE}-${PLAN_NUMBER}-SUMMARY.md`
</output>
