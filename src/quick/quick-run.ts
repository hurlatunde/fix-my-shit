import fs from 'fs';
import path from 'path';

/**
 * Write SUMMARY.md into a quick run directory (plan dir contains PLAN.md).
 */
function writeQuickSummary(planDir: string, objective: string): void {
  const summaryPath = path.join(planDir, 'SUMMARY.md');
  const stamp = new Date().toISOString().slice(0, 10);
  const content = `---
phase: quick
subsystem: quick
tags: [quick]
requirements-completed: []
completed: ${stamp}
---

# Quick run summary

**Objective:** ${objective}

## Accomplishments

- Quick task executed via fms quick.
- Plan run completed (stub execution).
`;
  fs.writeFileSync(summaryPath, content, 'utf-8');
}

/**
 * Read objective from PLAN.md in planDir (first line of <objective> block).
 */
function readObjective(planDir: string): string {
  const planPath = path.join(planDir, 'PLAN.md');
  if (!fs.existsSync(planPath)) return 'Quick task';
  const content = fs.readFileSync(planPath, 'utf-8');
  const m = content.match(/<objective>\s*\n?([\s\S]*?)<\/objective>/i);
  return (m ? m[1].trim().slice(0, 200) : 'Quick task').replace(/\n/g, ' ');
}

/**
 * Run quick plan: read PLAN.md, perform stub execution, write SUMMARY.md.
 */
export function runQuickPlan(planDirPath: string): void {
  const objective = readObjective(planDirPath);
  writeQuickSummary(planDirPath, objective);
}
