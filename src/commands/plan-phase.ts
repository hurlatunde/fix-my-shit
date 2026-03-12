import fs from 'fs';
import path from 'path';
import inquirer from 'inquirer';
import { getPhaseDir, ensurePhaseDir, getPhaseBase } from '../phases.js';
import { loadConfig } from '../config.js';
import { generatePhaseResearch } from '../plan-phase/research.js';
import { generatePlansForPhase } from '../plan-phase/planner.js';
import { checkPlansForPhase } from '../plan-phase/plan-checker.js';

function getRoadmapPath(fmsRoot: string): string | null {
  const p = path.join(fmsRoot, 'ROADMAP.md');
  if (fs.existsSync(p)) return p;
  const fallback = path.join(process.cwd(), '.planning', 'ROADMAP.md');
  if (fs.existsSync(fallback)) return fallback;
  return null;
}

export async function runPlanPhase(fmsRoot: string, phaseNum: number): Promise<void> {
  const base = getPhaseBase(fmsRoot);
  ensurePhaseDir(base, phaseNum);
  const { phaseDir, padded } = getPhaseDir(base, phaseNum);
  const config = loadConfig(fmsRoot);
  const researchPath = path.join(phaseDir, `${padded}-RESEARCH.md`);
  const hasResearch = fs.existsSync(researchPath);

  if (config.workflow?.research && !hasResearch) {
    const { runResearch } = await inquirer.prompt<{ runResearch: boolean }>([
      {
        type: 'confirm',
        name: 'runResearch',
        message: 'Run research? (Y/n)',
        default: true,
      },
    ]);
    if (runResearch) {
      generatePhaseResearch(base, phaseNum);
      console.log('Wrote', researchPath);
    }
  }

  const roadmapPath = getRoadmapPath(fmsRoot);
  if (!roadmapPath) {
    console.error('ROADMAP.md not found. Run fms new-project first.');
    return;
  }

  generatePlansForPhase(fmsRoot, phaseNum);
  const planFiles = fs.readdirSync(phaseDir).filter((f) => /-\d+-PLAN\.md$/.test(f));
  console.log('Wrote', planFiles.map((f) => path.join(phaseDir, f)).join(', '));

  const check = checkPlansForPhase(fmsRoot, phaseNum);
  if (check.passed) {
    console.log('Plan verification passed.');
  } else {
    console.log('Issues:');
    check.issues.forEach((i) => console.log(' -', i));
    console.log('Add missing requirement IDs to plan frontmatter or re-run plan-phase.');
  }
}
