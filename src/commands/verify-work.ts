import inquirer from 'inquirer';
import { getDeliverablesForPhase } from '../verify/deliverables.js';

export async function runVerifyWork(fmsRoot: string, phaseNum: number): Promise<void> {
  const deliverables = getDeliverablesForPhase(fmsRoot, phaseNum);
  if (deliverables.length === 0) {
    console.log('No deliverables found for phase', phaseNum);
    return;
  }

  console.log('\nPhase', phaseNum, '— Verify deliverables:\n');
  let anyFail = false;
  for (const d of deliverables) {
    const { confirmed } = await inquirer.prompt<{ confirmed: boolean }>([
      {
        type: 'confirm',
        name: 'confirmed',
        message: d.description,
        default: true,
      },
    ]);
    if (!confirmed) anyFail = true;
  }

  if (anyFail) {
    console.log('\nConsider: create a fix plan or run a debug agent to address failed items.');
  } else {
    console.log('\nAll deliverables confirmed.');
  }
}
