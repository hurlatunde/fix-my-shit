import inquirer from 'inquirer';
import path from 'path';
import { getPhaseBase } from '../phases.js';
import { createQuickPlan } from '../quick/quick-plan.js';
import { runQuickPlan } from '../quick/quick-run.js';

export async function runQuick(fmsRoot: string, taskFromArgs?: string): Promise<void> {
  let task = taskFromArgs?.trim();
  if (!task) {
    const { answer } = await inquirer.prompt<{ answer: string }>([
      {
        type: 'input',
        name: 'answer',
        message: 'What do you want to do? (short task description)',
        default: 'Quick ad-hoc task',
      },
    ]);
    task = answer?.trim() || 'Quick ad-hoc task';
  }

  const planDir = createQuickPlan(fmsRoot, task);
  runQuickPlan(planDir);

  const base = getPhaseBase(fmsRoot);
  const relativeDir = path.relative(process.cwd(), planDir);
  const displayDir = relativeDir.startsWith('..') ? planDir : relativeDir;
  console.log('Done. See', path.join(displayDir, 'SUMMARY.md'));
}
