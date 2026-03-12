import fs from 'fs';
import path from 'path';

const PLANNING_ROOT = path.join(process.cwd(), '.planning');

/** When ROADMAP is under .planning, use .planning as base so phase dirs stay in workspace. */
export function getPhaseBase(fmsRoot: string): string {
  const inFms = path.join(fmsRoot, 'ROADMAP.md');
  if (fs.existsSync(inFms)) return fmsRoot;
  if (fs.existsSync(path.join(PLANNING_ROOT, 'ROADMAP.md'))) return PLANNING_ROOT;
  return fmsRoot;
}

const FALLBACK_SLUGS: Record<number, string> = {
  1: 'foundation',
  2: 'new-project',
  3: 'discuss-and-plan',
  4: 'execute-and-verify',
  5: 'quick-mode-and-cursor',
  6: 'polish',
};

export function getPhaseDir(fmsRoot: string, phaseNum: number): { phaseDir: string; padded: string; slug: string } {
  const padded = String(phaseNum).padStart(2, '0');
  let slug = FALLBACK_SLUGS[phaseNum];
  const roadmapPath = path.join(fmsRoot, 'ROADMAP.md');
  try {
    const content = fs.readFileSync(roadmapPath, 'utf-8');
    const phaseSection = content.match(new RegExp(`### Phase ${phaseNum}:\\s*(.+?)(?=\\n|$)`, 'i'));
    if (phaseSection) {
      slug = phaseSection[1]
        .trim()
        .toLowerCase()
        .replace(/\s*-\s*.*$/, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '') || slug;
    }
  } catch {
    // use fallback
  }
  const phaseDir = path.join(fmsRoot, 'phases', `${padded}-${slug}`);
  return { phaseDir, padded, slug };
}

export function ensurePhaseDir(fmsRoot: string, phaseNum: number): string {
  const { phaseDir } = getPhaseDir(fmsRoot, phaseNum);
  fs.mkdirSync(phaseDir, { recursive: true });
  return phaseDir;
}
