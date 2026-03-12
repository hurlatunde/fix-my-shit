import fs from 'fs';
import path from 'path';
import { getPhaseBase, getPhaseDir } from '../phases.js';

export interface PlanInfo {
  id: string;
  wave: number;
  path: string;
  frontmatter: { phase?: string; plan?: string; wave?: number; depends_on?: string[]; requirements?: string[]; files_modified?: string[]; objective?: string };
}

function parseFrontmatter(content: string): Record<string, unknown> {
  const match = content.match(/^---\s*\n([\s\S]*?)\n---/);
  if (!match) return {};
  const block = match[1];
  const result: Record<string, unknown> = {};
  let key = '';
  let value: string | string[] = '';
  for (const line of block.split('\n')) {
    const keyMatch = line.match(/^(\w+):\s*(.*)$/);
    if (keyMatch) {
      if (key) result[key] = value;
      key = keyMatch[1];
      const rest = keyMatch[2].trim();
      if (rest.startsWith('[')) {
        value = rest
          .slice(1, -1)
          .split(',')
          .map((s) => s.replace(/^["'\s]+|["'\s]+$/g, '').trim())
          .filter(Boolean);
      } else {
        value = rest.replace(/^["']|["']$/g, '');
      }
    }
  }
  if (key) result[key] = value;
  return result;
}

function extractObjective(content: string): string {
  const m = content.match(/<objective>\s*\n?([\s\S]*?)<\/objective>/i);
  if (!m) return '';
  return m[1].trim().slice(0, 80);
}

export function getPlansForPhase(fmsRoot: string, phaseNum: number): PlanInfo[] {
  const base = getPhaseBase(fmsRoot);
  const { phaseDir } = getPhaseDir(base, phaseNum);
  if (!fs.existsSync(phaseDir)) return [];
  const files = fs.readdirSync(phaseDir).filter((f) => /^\d+-\d+-PLAN\.md$/.test(f));
  const plans: PlanInfo[] = [];
  for (const file of files) {
    const planPath = path.join(phaseDir, file);
    const content = fs.readFileSync(planPath, 'utf-8');
    const fm = parseFrontmatter(content) as PlanInfo['frontmatter'];
    const wave = Number(fm.wave) || 1;
    const id = file.replace(/-PLAN\.md$/, '');
    plans.push({
      id,
      wave,
      path: planPath,
      frontmatter: { ...fm, objective: extractObjective(content) || fm.objective },
    });
  }
  plans.sort((a, b) => (a.wave !== b.wave ? a.wave - b.wave : a.id.localeCompare(b.id)));
  return plans;
}

export function getPlansByWave(fmsRoot: string, phaseNum: number): Map<number, string[]> {
  const plans = getPlansForPhase(fmsRoot, phaseNum);
  const map = new Map<number, string[]>();
  for (const p of plans) {
    const list = map.get(p.wave) || [];
    list.push(p.id);
    map.set(p.wave, list);
  }
  return map;
}
