import fs from 'fs';
import path from 'path';
import { getPhaseBase, getPhaseDir } from '../phases.js';

export interface Deliverable {
  id: string;
  description: string;
  source: string;
}

function getRoadmapPath(fmsRoot: string): string | null {
  const base = getPhaseBase(fmsRoot);
  const p = path.join(base, 'ROADMAP.md');
  return fs.existsSync(p) ? p : null;
}

/**
 * Extract success criteria and plan references for a phase from ROADMAP.
 */
export function getDeliverablesForPhase(fmsRoot: string, phaseNum: number): Deliverable[] {
  const roadmapPath = getRoadmapPath(fmsRoot);
  if (!roadmapPath) return [];

  const content = fs.readFileSync(roadmapPath, 'utf-8');
  const section = content.match(
    new RegExp(`### Phase ${phaseNum}:\\s*[^\\n]+\\n([\\s\\S]*?)(?=\\n### Phase \\d|\\n## [^#]|$)`, 'i')
  );
  if (!section) return [];

  const block = section[1];
  const deliverables: Deliverable[] = [];

  const criteriaBlock = block.match(/\*\*Success Criteria\*\*[^]*?(?=\*\*Plans\*\*|$)/s);
  if (criteriaBlock) {
    const list = criteriaBlock[0].match(/\d+\.\s+[^\n]+/g) || [];
    list.forEach((line, i) => {
      const desc = line.replace(/^\d+\.\s*/, '').trim();
      if (desc) deliverables.push({ id: `criterion-${i + 1}`, description: desc, source: 'ROADMAP Success Criteria' });
    });
  }

  const base = getPhaseBase(fmsRoot);
  const { phaseDir } = getPhaseDir(base, phaseNum);
  if (fs.existsSync(phaseDir)) {
    const planFiles = fs.readdirSync(phaseDir).filter((f) => /^\d+-\d+-PLAN\.md$/.test(f));
    planFiles.forEach((f) => {
      const planId = f.replace(/-PLAN\.md$/, '');
      deliverables.push({
        id: `plan-${planId}`,
        description: `Plan ${planId} deliverables and must_haves`,
        source: `${f}`,
      });
    });
  }

  return deliverables;
}
