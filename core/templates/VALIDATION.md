# Phase ${PHASE} — Validation Strategy

**Phase:** ${PHASE_NAME}
**Created:** ${DATE}

## Goal

(Phase goal from ROADMAP.md)

## Test Infrastructure

| Property | Value |
|----------|-------|
| Framework | (framework name + version) |
| Config file | (path or "none — Wave 0 creates") |
| Quick run command | `(command)` |
| Full suite command | `(command)` |

## Phase Requirements to Test Map

| Req ID | Behavior | Test Type | Automated Command | Exists? |
|--------|----------|-----------|-------------------|---------|
| (REQ-XX) | (behavior) | unit/integration/e2e | `(command)` | yes/no |

## Sampling Rate

- **Per task commit:** `(quick run command)`
- **Per wave merge:** `(full suite command)`
- **Phase gate:** Full suite green before verify-work

## Per-Task Verification Map

| Task | Plan | Wave | Automated Command | Status |
|------|------|------|-------------------|--------|
| (task) | (plan) | (wave) | `(command)` | pending |

## Wave 0 Requirements

Missing test infrastructure that must be created before implementation:

- [ ] `(tests/test_file)` — covers REQ-(XX)
- [ ] `(tests/conftest)` — shared fixtures
- [ ] Framework install: `(command)` — if none detected

*(If no gaps: "None — existing test infrastructure covers all phase requirements")*

## Verified

- [ ] (Criterion 1)
- [ ] (Criterion 2)

## Summary

(Pass/fail and any fix plans — filled after verify-work.)

---
*Created by fms-phase-researcher, consumed by fms-plan-checker and fms-verifier*
