import fs from 'fs';
import path from 'path';
import { getPhaseDir, getPhaseBase } from '../phases.js';

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

function parseFrontmatter(content: string): { requirements?: string[]; phase?: string; plan?: string; wave?: number; must_haves?: unknown } {
  const match = content.match(/^---\s*\n([\s\S]*?)\n---/);
  if (!match) return {};
  const block = match[1];
  const requirements: string[] = [];
  let phase: string | undefined;
  let plan: string | undefined;
  let wave: number | undefined;
  let must_haves: unknown;
  const reqMatch = block.match(/requirements:\s*\[([^\]]*)\]/i);
  if (reqMatch) {
    reqMatch[1].split(',').forEach((s) => {
      const id = s.replace(/["'\s]/g, '').trim();
      if (id) requirements.push(id);
    });
  }
  const phaseMatch = block.match(/phase:\s*(.+)/i);
  if (phaseMatch) phase = phaseMatch[1].trim();
  const planMatch = block.match(/plan:\s*["']?(\d+)["']?/i);
  if (planMatch) plan = planMatch[1];
  const waveMatch = block.match(/wave:\s*(\d+)/i);
  if (waveMatch) wave = parseInt(waveMatch[1], 10);
  if (block.includes('must_haves:')) must_haves = {};
  return { requirements, phase, plan, wave, must_haves };
}

export function checkPlansForPhase(
  fmsRoot: string,
  phaseNum: number
): { passed: boolean; issues: string[] } {
  const issues: string[] = [];
  const base = getPhaseBase(fmsRoot);
  const { phaseDir } = getPhaseDir(base, phaseNum);
  const roadmapPath = getRoadmapPath(fmsRoot);
  if (!roadmapPath) {
    return { passed: false, issues: ['ROADMAP.md not found'] };
  }
  const roadmapContent = fs.readFileSync(roadmapPath, 'utf-8');
  const requiredIds = getPhaseRequirementIds(roadmapContent, phaseNum);

  const planFiles = fs.readdirSync(phaseDir).filter((f) => /^\d+-\d+-PLAN\.md$/.test(f));
  const coveredIds = new Set<string>();

  for (const file of planFiles) {
    const content = fs.readFileSync(path.join(phaseDir, file), 'utf-8');
    const fm = parseFrontmatter(content);
    if (!fm.phase) issues.push(`${file}: missing frontmatter 'phase'`);
    if (!fm.plan) issues.push(`${file}: missing frontmatter 'plan'`);
    if (fm.wave == null) issues.push(`${file}: missing frontmatter 'wave'`);
    if (!fm.requirements || fm.requirements.length === 0) issues.push(`${file}: missing or empty 'requirements'`);
    if (!fm.must_haves) issues.push(`${file}: missing 'must_haves'`);
    (fm.requirements || []).forEach((id: string) => coveredIds.add(id));
  }

  const missing = requiredIds.filter((id) => !coveredIds.has(id));
  if (missing.length > 0) {
    issues.push(`Phase requirement IDs not in any plan: ${missing.join(', ')}`);
  }

  return {
    passed: issues.length === 0,
    issues,
  };
}
