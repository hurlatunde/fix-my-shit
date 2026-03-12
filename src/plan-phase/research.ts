import fs from 'fs';
import path from 'path';
import { getPhaseDir, ensurePhaseDir } from '../phases.js';

export function generatePhaseResearch(fmsRoot: string, phaseNum: number): void {
  ensurePhaseDir(fmsRoot, phaseNum);
  const { phaseDir, padded } = getPhaseDir(fmsRoot, phaseNum);

  const roadmapPath = path.join(fmsRoot, 'ROADMAP.md');
  let goal = '';
  try {
    const content = fs.readFileSync(roadmapPath, 'utf-8');
    const m = content.match(new RegExp(`### Phase ${phaseNum}:[^\\n]+\\n\\*\\*Goal\\*\\*:\\s*([^\\n]+)`, 'i'));
    if (m) goal = m[1].trim();
  } catch {
    goal = 'Phase goal from ROADMAP';
  }

  const stamp = new Date().toISOString().slice(0, 10);
  const body = `# Phase ${padded}: Research\n\n**Researched:** ${stamp}\n\n## Summary\n\n${goal}\n\n## Recommendations\n\n(Stub — add full research or run phase researcher.)\n`;
  fs.writeFileSync(path.join(phaseDir, `${padded}-RESEARCH.md`), body, 'utf-8');
}
