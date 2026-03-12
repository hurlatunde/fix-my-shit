import fs from 'fs';
import path from 'path';
import inquirer from 'inquirer';

export function generateRoadmapAndState(fmsRoot: string): void {
  const projectPath = path.join(fmsRoot, 'PROJECT.md');
  const requirementsPath = path.join(fmsRoot, 'REQUIREMENTS.md');
  const summaryPath = path.join(fmsRoot, 'research', 'SUMMARY.md');

  let projectContent = '';
  let requirementsContent = '';
  let summaryContent = '';
  try {
    projectContent = fs.readFileSync(projectPath, 'utf-8');
  } catch {}
  try {
    requirementsContent = fs.readFileSync(requirementsPath, 'utf-8');
  } catch {}
  try {
    summaryContent = fs.readFileSync(summaryPath, 'utf-8');
  } catch {}

  const titleMatch = projectContent.match(/^#\s+(.+)$/m);
  const name = titleMatch ? titleMatch[1].trim() : 'Project';
  const reqIdMatches = requirementsContent.match(/\*\*(GEN|INST|PROJ|CONF|CURS|DISC|PLAN|EXEC|VERI|QUIK)-\d+\*\*/g) || [];
  const reqIds = [...new Set(reqIdMatches.map((s) => s.replace(/\*\*/g, '')))];

  const phaseCount = 6;
  const phases = [
    { num: 1, name: 'Foundation', goal: 'Installer, path resolution, config' },
    { num: 2, name: 'New Project', goal: 'new-project flow: questions, research, requirements, roadmap' },
    { num: 3, name: 'Discuss & Plan', goal: 'discuss-phase, plan-phase' },
    { num: 4, name: 'Execute & Verify', goal: 'execute-phase, verify-work, complete' },
    { num: 5, name: 'Quick Mode & Cursor', goal: 'quick mode, Cursor integration' },
    { num: 6, name: 'Polish', goal: 'hooks, status, help' },
  ];

  const roadmapLines: string[] = [
    `# Roadmap: ${name}`,
    '',
    '## Overview',
    '',
    'Phases derived from requirements. Update as needed.',
    '',
    '## Phases',
    '',
    ...phases.map((p) => `- [ ] **Phase ${p.num}: ${p.name}** - ${p.goal}`),
    '',
    '## Phase Details',
    '',
  ];
  phases.forEach((p) => {
    roadmapLines.push(`### Phase ${p.num}: ${p.name}`);
    roadmapLines.push(`**Goal**: ${p.goal}`);
    roadmapLines.push('**Requirements**: (map from REQUIREMENTS.md)');
    roadmapLines.push('**Success Criteria**: (define per phase)');
    roadmapLines.push('');
  });
  roadmapLines.push('## Progress');
  roadmapLines.push('');
  roadmapLines.push('| Phase | Status |');
  roadmapLines.push('|-------|--------|');
  phases.forEach((p) => roadmapLines.push(`| ${p.num}. ${p.name} | Not started |`));
  roadmapLines.push('');

  fs.writeFileSync(path.join(fmsRoot, 'ROADMAP.md'), roadmapLines.join('\n'), 'utf-8');

  const stateLines: string[] = [
    '# Project State',
    '',
    `See: PROJECT.md`,
    '',
    '**Current focus:** Phase 1',
    '',
    '## Current Position',
    '',
    'Phase: 1',
    'Status: Ready to plan',
    `Last activity: ${new Date().toISOString().slice(0, 10)} — new-project`,
    '',
    'Progress: 0%',
    '',
    '---',
  ];
  fs.writeFileSync(path.join(fmsRoot, 'STATE.md'), stateLines.join('\n'), 'utf-8');

  updateRequirementsTraceability(fmsRoot, phases);
}

function updateRequirementsTraceability(fmsRoot: string, phases: { num: number; name: string }[]): void {
  const reqPath = path.join(fmsRoot, 'REQUIREMENTS.md');
  let content = '';
  try {
    content = fs.readFileSync(reqPath, 'utf-8');
  } catch {
    return;
  }
  const idMatches = content.match(/\*\*(GEN|INST|PROJ|CONF|CURS|DISC|PLAN|EXEC|VERI|QUIK)-\d+\*\*/g) || [];
  const ids = [...new Set(idMatches.map((s) => s.replace(/\*\*/g, '')))];
  const traceSection = [
    '## Traceability',
    '',
    '| Requirement | Phase | Status |',
    '|-------------|-------|--------|',
    ...ids.map((id) => `| ${id} | Phase ${assignPhase(id)} | Pending |`),
    '',
  ].join('\n');
  if (content.includes('## Traceability')) {
    content = content.replace(/## Traceability[\s\S]*?(?=---|$)/, traceSection);
  } else {
    content = content.trimEnd() + '\n\n' + traceSection;
  }
  fs.writeFileSync(reqPath, content, 'utf-8');
}

function assignPhase(reqId: string): number {
  if (reqId.startsWith('INST') || reqId.startsWith('CONF') || reqId.startsWith('GEN')) return 1;
  if (reqId.startsWith('PROJ')) return 2;
  if (reqId.startsWith('DISC') || reqId.startsWith('PLAN')) return 3;
  if (reqId.startsWith('EXEC') || reqId.startsWith('VERI')) return 4;
  if (reqId.startsWith('QUIK') || reqId.startsWith('CURS')) return 5;
  return 6;
}

export async function promptApproval(fmsRoot: string): Promise<void> {
  const roadmapPath = path.join(fmsRoot, 'ROADMAP.md');
  const statePath = path.join(fmsRoot, 'STATE.md');
  const { action } = await inquirer.prompt<{ action: string }>([
    {
      type: 'list',
      name: 'action',
      message: 'Approve roadmap?',
      choices: [
        { name: 'Yes — approve and continue', value: 'approve' },
        { name: "No — I'll edit and re-run", value: 'edit' },
        { name: 'Show paths to ROADMAP and STATE', value: 'show' },
      ],
    },
  ]);
  if (action === 'approve') {
    console.log('Roadmap approved. Next: /gsd:discuss-phase 1 or /gsd:plan-phase 1');
  } else if (action === 'edit') {
    console.log('Edit ROADMAP.md and REQUIREMENTS.md as needed, then run `fms new-project` again.');
  } else {
    console.log('ROADMAP:', roadmapPath);
    console.log('STATE:', statePath);
  }
}
