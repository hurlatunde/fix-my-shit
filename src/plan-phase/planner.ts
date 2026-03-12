import fs from 'fs';
import path from 'path';
import { getPhaseDir, ensurePhaseDir, getPhaseBase } from '../phases.js';

function getRoadmapPath(fmsRoot: string): string | null {
  const p = path.join(fmsRoot, 'ROADMAP.md');
  if (fs.existsSync(p)) return p;
  const fallback = path.join(process.cwd(), '.planning', 'ROADMAP.md');
  if (fs.existsSync(fallback)) return fallback;
  return null;
}

function getPhaseRequirementIds(roadmapContent: string, phaseNum: number): string[] {
  const section = roadmapContent.match(
    new RegExp(`### Phase ${phaseNum}:[\\s\\S]*?\\*\\*Requirements\\*\\*:\\s*([^\\n]+)`, 'i')
  );
  if (!section) return [];
  return section[1]
    .split(/[\s,]+/)
    .map((s) => s.trim())
    .filter((s) => /^[A-Z]+-\d+$/.test(s));
}

function getPlanListFromRoadmap(roadmapContent: string, phaseNum: number): { id: string; desc: string }[] {
  const section = roadmapContent.match(
    new RegExp(`### Phase ${phaseNum}:[\\s\\S]*?(?=\\n### Phase \\d|\\n## [^#]|$)`, 'i')
  );
  if (!section) return [];
  const lines = section[0].match(/^-\s+\[\s?[x ]?\s?\]\s+(\d+-\d+):\s*(.+)$/gm) || [];
  return lines.map((line) => {
    const m = line.match(/(\d+-\d+):\s*(.+)$/);
    return m ? { id: m[1], desc: m[2].trim() } : { id: '', desc: '' };
  }).filter((p) => p.id);
}

export function generatePlansForPhase(fmsRoot: string, phaseNum: number): void {
  const base = getPhaseBase(fmsRoot);
  ensurePhaseDir(base, phaseNum);
  const { phaseDir, padded } = getPhaseDir(base, phaseNum);
  const roadmapPath = getRoadmapPath(fmsRoot);
  if (!roadmapPath) {
    throw new Error('ROADMAP.md not found in fms root or .planning/');
  }
  const roadmapContent = fs.readFileSync(roadmapPath, 'utf-8');
  const reqIds = getPhaseRequirementIds(roadmapContent, phaseNum);
  const plans = getPlanListFromRoadmap(roadmapContent, phaseNum);

  if (plans.length === 0) {
    plans.push(
      { id: `${padded}-01`, desc: 'First plan' },
      { id: `${padded}-02`, desc: 'Second plan' },
      { id: `${padded}-03`, desc: 'Third plan' }
    );
  }

  const phaseSlug = phaseDir.split(path.sep).pop() || `phase-${phaseNum}`;
  const reqsByPlan: Record<string, string[]> = {};
  if (reqIds.length >= 3) {
    const n = Math.ceil(reqIds.length / plans.length);
    plans.forEach((p, i) => {
      reqsByPlan[p.id] = reqIds.slice(i * n, (i + 1) * n);
    });
  } else {
    reqIds.forEach((id, i) => {
      const planId = plans[i % plans.length].id;
      if (!reqsByPlan[planId]) reqsByPlan[planId] = [];
      reqsByPlan[planId].push(id);
    });
  }
  if (Object.keys(reqsByPlan).length === 0) {
    plans.forEach((p, i) => {
      reqsByPlan[p.id] = reqIds.length > 0 ? [reqIds[i % reqIds.length]] : [];
    });
  }

  plans.forEach((plan, index) => {
    const planNum = String(index + 1).padStart(2, '0');
    const wave = index + 1;
    const deps = index > 0 ? [plans[index - 1].id] : [];
    const reqs = reqsByPlan[plan.id] || [];
    const frontmatter = `---
phase: ${phaseSlug}
plan: "${planNum}"
type: execute
wave: ${wave}
depends_on: [${deps.map((d) => `"${d}"`).join(', ')}]
files_modified: []
autonomous: true
requirements: [${reqs.map((r) => `"${r}"`).join(', ')}]
must_haves:
  truths: []
  artifacts: []
---

<objective>
${plan.desc}
</objective>

<tasks>
<task type="auto">
  <name>Task 1</name>
  <files></files>
  <action>Implement as per plan.</action>
  <verify>Check outcome.</verify>
  <done>Done.</done>
</task>
</tasks>

<verification>
- [ ] Tasks complete
</verification>
`;
    fs.writeFileSync(
      path.join(phaseDir, `${padded}-${planNum}-PLAN.md`),
      frontmatter,
      'utf-8'
    );
  });
}
