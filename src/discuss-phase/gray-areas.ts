import fs from 'fs';
import path from 'path';
import inquirer from 'inquirer';

const DEFAULT_GRAY_AREAS = ['Behavior', 'Content', 'Empty state', 'Integration'];

export function getGrayAreasForPhase(fmsRoot: string, phaseNum: number): string[] {
  const roadmapPath = path.join(fmsRoot, 'ROADMAP.md');
  try {
    const content = fs.readFileSync(roadmapPath, 'utf-8');
    const phaseSection = content.match(new RegExp(`### Phase ${phaseNum}:[\\s\\S]*?(?=### Phase \\d|## [^#]|$)`, 'i'));
    if (phaseSection && phaseSection[0].includes('**Goal**')) {
      return DEFAULT_GRAY_AREAS;
    }
  } catch {
    // ignore
  }
  return DEFAULT_GRAY_AREAS;
}

export async function runDiscussion(
  fmsRoot: string,
  phaseNum: number
): Promise<Record<string, string>> {
  const areas = getGrayAreasForPhase(fmsRoot, phaseNum);
  const { selected } = await inquirer.prompt<{ selected: string[] }>([
    {
      type: 'checkbox',
      name: 'selected',
      message: 'Which areas do you want to discuss?',
      choices: areas.map((a) => ({ name: a, value: a })),
      default: areas.slice(0, 2),
    },
  ]);
  const decisions: Record<string, string> = {};
  for (const area of selected) {
    const { answer } = await inquirer.prompt<{ answer: string }>([
      {
        type: 'input',
        name: 'answer',
        message: `${area} — decisions or preferences:`,
        default: 'Use standard approach.',
      },
    ]);
    decisions[area] = answer;
  }
  return decisions;
}
