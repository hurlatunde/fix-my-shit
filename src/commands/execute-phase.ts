import fs from 'fs';
import path from 'path';
import { getPhaseBase, getPhaseDir } from '../phases.js';
import { loadConfig } from '../config.js';
import { getPlansForPhase } from '../execute-phase/wave-builder.js';
import { writePlanSummary, buildStubSummary } from '../execute-phase/summary-writer.js';
import { isInsideGitRepo, commitPlanFiles, planCommitMessage } from '../execute-phase/git-commit.js';
import { updateStateAfterPlan } from '../execute-phase/state-updater.js';

export async function runExecutePhase(fmsRoot: string, phaseNum: number): Promise<void> {
  const config = loadConfig(fmsRoot);
  const base = getPhaseBase(fmsRoot);
  const { phaseDir } = getPhaseDir(base, phaseNum);

  if (!fs.existsSync(phaseDir)) {
    console.log('Phase directory not found:', phaseDir);
    return;
  }

  const plans = getPlansForPhase(fmsRoot, phaseNum);
  if (plans.length === 0) {
    console.log('No plans found in', phaseDir);
    return;
  }

  const waves = new Map<number, typeof plans>();
  for (const p of plans) {
    const list = waves.get(p.wave) || [];
    list.push(p);
    waves.set(p.wave, list);
  }
  const waveOrder = [...waves.keys()].sort((a, b) => a - b);

  let plansCompleted = 0;
  const totalPlans = plans.length;

  for (const waveNum of waveOrder) {
    const wavePlans = waves.get(waveNum)!;
    for (const plan of wavePlans) {
      const summaryPath = path.join(phaseDir, `${plan.id}-SUMMARY.md`);
      const alreadyDone = fs.existsSync(summaryPath);
      if (alreadyDone) {
        console.log('Skip (already has summary):', plan.id);
        plansCompleted++;
        const statePathSkip = path.join(base, 'STATE.md');
        if (fs.existsSync(statePathSkip)) {
          updateStateAfterPlan(statePathSkip, phaseNum, plansCompleted, totalPlans);
        }
        continue;
      }
      console.log('Execute plan:', plan.id);
      const content = fs.readFileSync(plan.path, 'utf-8');
      const objective = (plan.frontmatter.objective as string) || plan.id;
      const requirements = (plan.frontmatter.requirements as string[]) || [];
      const summaryContent = buildStubSummary(plan.id, objective, requirements);
      const summaryFilePath = writePlanSummary(phaseDir, plan.id, summaryContent);
      console.log('Wrote', `${plan.id}-SUMMARY.md`);

      if (config.commit_docs && isInsideGitRepo(process.cwd())) {
        const filesModified = (plan.frontmatter.files_modified as string[]) || [];
        const summaryRelative = path.relative(process.cwd(), summaryFilePath);
        const toAdd = [...filesModified, summaryRelative].filter(Boolean);
        const msg = planCommitMessage(phaseNum, plan.id, objective);
        const result = commitPlanFiles(process.cwd(), phaseNum, plan.id, toAdd, msg);
        if (result.success) console.log('Committed:', plan.id);
        else if (result.error && !result.error.includes('nothing to commit')) console.log('Commit skip:', result.error);
      }

      plansCompleted++;
      const statePath = path.join(base, 'STATE.md');
      if (fs.existsSync(statePath)) {
        updateStateAfterPlan(statePath, phaseNum, plansCompleted, totalPlans);
      }
    }
  }
}
