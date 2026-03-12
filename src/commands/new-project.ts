import fs from 'fs';
import path from 'path';
import inquirer from 'inquirer';
import { runQuestioning } from '../new-project/questioning.js';
import { generateProjectMdFromAnswers, generateProjectMdFromPrd } from '../new-project/project-md.js';
import { runResearch } from '../new-project/research.js';
import { generateRequirementsMd } from '../new-project/requirements.js';
import { generateRoadmapAndState, promptApproval } from '../new-project/roadmap.js';

export async function runNewProject(fmsRoot: string, options?: { prdPath?: string }): Promise<void> {
  fs.mkdirSync(fmsRoot, { recursive: true });

  let projectMdWritten = false;
  if (options?.prdPath) {
    const fullPath = path.isAbsolute(options.prdPath) ? options.prdPath : path.join(process.cwd(), options.prdPath);
    const content = fs.readFileSync(fullPath, 'utf-8');
    generateProjectMdFromPrd(content, fmsRoot);
    projectMdWritten = true;
    console.log('Generated PROJECT.md from PRD:', options.prdPath);
  }

  if (!projectMdWritten) {
    const answers = await runQuestioning();
    generateProjectMdFromAnswers(answers, fmsRoot);
    console.log('Wrote PROJECT.md');
  }

  const { runResearch: doResearch } = await inquirer.prompt<{ runResearch: boolean }>([
    {
      type: 'confirm',
      name: 'runResearch',
      message: 'Run research? (Y/n)',
      default: true,
    },
  ]);
  if (doResearch) {
    runResearch(fmsRoot);
    console.log('Wrote research/ (STACK, FEATURES, ARCHITECTURE, PITFALLS, SUMMARY)');
  }

  generateRequirementsMd(fmsRoot);
  console.log('Wrote REQUIREMENTS.md');

  generateRoadmapAndState(fmsRoot);
  console.log('Wrote ROADMAP.md and STATE.md');

  await promptApproval(fmsRoot);
}
