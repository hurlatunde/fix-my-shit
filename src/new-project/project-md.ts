import fs from 'fs';
import path from 'path';
import { QuestioningAnswers } from './questioning.js';

function escapeMd(text: string): string {
  return text.replace(/\n/g, ' ').trim();
}

export function generateProjectMdFromAnswers(answers: QuestioningAnswers, fmsRoot: string): void {
  const name = answers.projectName || 'Project';
  const coreValue = answers.goal?.slice(0, 200) || 'To be defined.';
  const content = `# ${name}

## What This Is

${escapeMd(answers.goal) || 'To be defined.'}

## Core Value

${escapeMd(coreValue)}

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] (Add requirements from discussion or PRD)

### Out of Scope

${(answers.outOfScope || 'None defined yet.')
  .split(/[,;]/)
  .map((s) => s.trim())
  .filter(Boolean)
  .map((s) => `- ${s}`)
  .join('\n') || '- None defined yet'}

## Context

${escapeMd(answers.constraints) || 'No additional context.'}

## Constraints

- **Scope:** v1 as discussed; out of scope listed above.

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| (TBD) | — | — Pending |

---
*Last updated: ${new Date().toISOString().slice(0, 10)} after new-project*
`;
  const outPath = path.join(fmsRoot, 'PROJECT.md');
  fs.mkdirSync(fmsRoot, { recursive: true });
  fs.writeFileSync(outPath, content, 'utf-8');
}

export function generateProjectMdFromPrd(prdContent: string, fmsRoot: string, projectName?: string): void {
  const name = projectName || extractTitle(prdContent) || 'Project';
  const outPath = path.join(fmsRoot, 'PROJECT.md');
  fs.mkdirSync(fmsRoot, { recursive: true });
  fs.writeFileSync(outPath, prdContent, 'utf-8');
}

function extractTitle(content: string): string | null {
  const match = content.match(/^#\s+(.+)$/m);
  return match ? match[1].trim() : null;
}
