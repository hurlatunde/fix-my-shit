import fs from 'fs';
import path from 'path';
import { getPhaseBase } from '../phases.js';

/**
 * Slugify task description for directory name.
 */
function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40) || 'task';
}

/**
 * Get next run id (001, 002, ...) from existing quick/ subdirs.
 */
function nextQuickId(quickDir: string): string {
  if (!fs.existsSync(quickDir)) return '001';
  const entries = fs.readdirSync(quickDir, { withFileTypes: true });
  const nums = entries
    .filter((d) => d.isDirectory() && /^\d{3}-/.test(d.name))
    .map((d) => parseInt(d.name.slice(0, 3), 10));
  const max = nums.length > 0 ? Math.max(...nums) : 0;
  return String(max + 1).padStart(3, '0');
}

/**
 * Create quick/ dir, generate run id and slug, write minimal PLAN.md.
 * @returns Path to the plan directory (e.g. quick/001-fix-login)
 */
export function createQuickPlan(fmsRoot: string, taskDescription: string): string {
  const base = getPhaseBase(fmsRoot);
  const quickDir = path.join(base, 'quick');
  fs.mkdirSync(quickDir, { recursive: true });

  const runId = nextQuickId(quickDir);
  const slug = slugify(taskDescription);
  const dirName = `${runId}-${slug}`;
  const planDir = path.join(quickDir, dirName);
  fs.mkdirSync(planDir, { recursive: true });

  const objective = taskDescription.trim().slice(0, 200);
  const planContent = `---
phase: quick
plan: "01"
type: execute
wave: 1
depends_on: []
requirements: []
---

<objective>
${objective}
</objective>

<tasks>
<task type="auto">
  <name>Task 1</name>
  <action>Complete the ad-hoc task as described.</action>
  <verify>Check outcome.</verify>
  <done>Done.</done>
</task>
</tasks>

<verification>
- [ ] Task complete
</verification>
`;
  fs.writeFileSync(path.join(planDir, 'PLAN.md'), planContent, 'utf-8');
  return planDir;
}
