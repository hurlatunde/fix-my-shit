# Phase ${PHASE} — Research

**Researched:** ${DATE}
**Domain:** (primary technology/problem domain)
**Confidence:** HIGH | MEDIUM | LOW

## Summary

(2-3 paragraph executive summary of research findings.)

**Primary recommendation:** (one-liner actionable guidance)

## User Constraints

Copy verbatim from CONTEXT.md if it exists.

### Locked Decisions

- (from CONTEXT.md Decisions section)

### Claude's Discretion

- (from CONTEXT.md Discretion section)

### Deferred Ideas (OUT OF SCOPE)

- (from CONTEXT.md Deferred section)

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| (name) | (ver) | (what it does) | (why experts use it) |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| (name) | (ver) | (what it does) | (use case) |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| (standard) | (alternative) | (when alternative makes sense) |

## Architecture Patterns

### Recommended Structure

```
src/
├── (folder)/        # (purpose)
├── (folder)/        # (purpose)
└── (folder)/        # (purpose)
```

### Pattern: (Pattern Name)

**What:** (description)
**When to use:** (conditions)
**Example:**

```typescript
// Source: (official docs URL)
(code)
```

### Anti-Patterns to Avoid

- **(Anti-pattern):** (why it's bad, what to do instead)

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| (problem) | (what you'd build) | (library) | (edge cases, complexity) |

## Common Pitfalls

### Pitfall: (Name)

**What goes wrong:** (description)
**Why it happens:** (root cause)
**How to avoid:** (prevention strategy)
**Warning signs:** (how to detect early)

## Code Examples

Verified patterns from official sources:

### (Common Operation)

```typescript
// Source: (official docs URL)
(code)
```

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| (REQ-ID) | (from REQUIREMENTS.md) | (which research findings enable implementation) |

## Open Questions

1. **(Question)**
   - What we know: (partial info)
   - What's unclear: (the gap)
   - Recommendation: (how to handle)

## Sources

### Primary (HIGH confidence)

- (official docs URL) — (what was checked)

### Secondary (MEDIUM confidence)

- (verified source) — (what was found)

### Tertiary (LOW confidence)

- (unverified source, marked for validation)

## Metadata

**Confidence breakdown:**

- Standard stack: (level) — (reason)
- Architecture: (level) — (reason)
- Pitfalls: (level) — (reason)

---
*Created by fms-phase-researcher*
