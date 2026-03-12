import { ensurePhaseDir, getPhaseDir, getPhaseBase } from '../phases.js';
import { runDiscussion } from '../discuss-phase/gray-areas.js';
import { writeContextMd, getPhaseGoal } from '../discuss-phase/context-md.js';

export async function runDiscussPhase(fmsRoot: string, phaseNum: number): Promise<void> {
  const base = getPhaseBase(fmsRoot);
  ensurePhaseDir(base, phaseNum);
  const { phaseDir, padded } = getPhaseDir(base, phaseNum);

  const goal = getPhaseGoal(base, phaseNum);
  const decisions = await runDiscussion(base, phaseNum);
  const outPath = writeContextMd(phaseDir, padded, goal, decisions);
  console.log('Wrote', outPath);
}
