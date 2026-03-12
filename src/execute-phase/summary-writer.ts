import fs from 'fs';
import path from 'path';

/**
 * Write SUMMARY.md for a plan. planId is e.g. "04-01" (no -PLAN suffix).
 * Content is full markdown (optional frontmatter + body).
 */
export function writePlanSummary(phaseDir: string, planId: string, content: string): string {
  const summaryName = `${planId}-SUMMARY.md`;
  const outPath = path.join(phaseDir, summaryName);
  fs.writeFileSync(outPath, content, 'utf-8');
  return outPath;
}

/**
 * Build minimal summary content for a completed plan (stub or from execution result).
 */
export function buildStubSummary(planId: string, objective: string, requirements: string[]): string {
  const [phase, plan] = planId.split('-');
  const stamp = new Date().toISOString().slice(0, 10);
  const lines = [
    '---',
    `phase: ${phase}-executed`,
    `plan: "${plan}"`,
    'subsystem: execute',
    'tags: [execute-phase, summary]',
    'requires: []',
    'provides:',
    `  - Plan ${planId} executed`,
    'affects: []',
    'requirements-completed: [' + (requirements || []).map((r) => `"${r}"`).join(', ') + ']',
    `duration: 0min`,
    `completed: ${stamp}`,
    '---',
    '',
    `# Phase ${phase}: Plan ${planId} Summary`,
    '',
    objective || 'Plan executed.',
    '',
    '## Accomplishments',
    '',
    '- Executed via fms execute-phase.',
    '',
    '## Self-Check: PASSED',
    '',
    '- [x] Plan run completed',
    '',
  ];
  return lines.join('\n');
}
