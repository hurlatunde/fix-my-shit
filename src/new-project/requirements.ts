import fs from 'fs';
import path from 'path';

export interface RequirementCandidate {
  category: string;
  text: string;
  tier: 'v1' | 'v2' | 'out';
}

const CATEGORY_PREFIX: Record<string, string> = {
  installer: 'INST',
  config: 'CONF',
  cursor: 'CURS',
  project: 'PROJ',
  discuss: 'DISC',
  plan: 'PLAN',
  execute: 'EXEC',
  verify: 'VERI',
  quick: 'QUIK',
  general: 'GEN',
};

export function parseRequirementSources(fmsRoot: string): RequirementCandidate[] {
  const projectPath = path.join(fmsRoot, 'PROJECT.md');
  const featuresPath = path.join(fmsRoot, 'research', 'FEATURES.md');
  const candidates: RequirementCandidate[] = [];

  let projectContent = '';
  try {
    projectContent = fs.readFileSync(projectPath, 'utf-8');
  } catch {
    return candidates;
  }

  const activeMatch = projectContent.match(/### Active\s+([\s\S]*?)(?=### |## |$)/i);
  if (activeMatch) {
    const bullets = activeMatch[1].match(/^-\s+\[[\sx]\]\s+(.+)$/gm) || [];
    bullets.forEach((line) => {
      const text = line.replace(/^-\s+\[[\sx]\]\s+/, '').trim();
      if (text) candidates.push({ category: 'general', text, tier: 'v1' });
    });
  }

  const outMatch = projectContent.match(/### Out of Scope\s+([\s\S]*?)(?=## |$)/i);
  if (outMatch) {
    const bullets = outMatch[1].match(/^-\s+(.+)$/gm) || [];
    bullets.forEach((line) => {
      const text = line.replace(/^-\s+/, '').trim();
      if (text) candidates.push({ category: 'general', text, tier: 'out' });
    });
  }

  let featuresContent = '';
  try {
    featuresContent = fs.readFileSync(featuresPath, 'utf-8');
  } catch {
    // no research
  }
  if (featuresContent && candidates.length === 0) {
    candidates.push({ category: 'features', text: 'Table stakes from research', tier: 'v1' });
  }

  if (candidates.length === 0) {
    candidates.push({ category: 'general', text: 'Project goals from PROJECT.md', tier: 'v1' });
  }
  return candidates;
}

export function generateRequirementsMd(fmsRoot: string): void {
  const candidates = parseRequirementSources(fmsRoot);
  const byCategory: Record<string, RequirementCandidate[]> = {};
  for (const c of candidates) {
    if (!byCategory[c.category]) byCategory[c.category] = [];
    byCategory[c.category].push(c);
  }
  const categories = Object.keys(byCategory);
  const reqIds: string[] = [];
  let traceRows: string[] = [];
  const lines: string[] = [
    '# Requirements',
    '',
    '**Defined:** ' + new Date().toISOString().slice(0, 10),
    '**Core Value:** (See PROJECT.md)',
    '',
    '## v1 Requirements',
    '',
  ];

  categories.forEach((cat) => {
    const prefix = CATEGORY_PREFIX[cat] || 'REQ';
    const items = byCategory[cat].filter((c) => c.tier === 'v1');
    if (items.length === 0) return;
    lines.push('### ' + cat.charAt(0).toUpperCase() + cat.slice(1));
    lines.push('');
    items.forEach((c, i) => {
      const id = `${prefix}-${String(i + 1).padStart(2, '0')}`;
      reqIds.push(id);
      lines.push(`- [ ] **${id}**: ${c.text}`);
      traceRows.push(`| ${id} | Phase TBD | Pending |`);
    });
    lines.push('');
  });

  lines.push('## v2 Requirements');
  lines.push('');
  lines.push('(Deferred — add when scoping.)');
  lines.push('');
  lines.push('## Out of Scope');
  lines.push('');
  byCategory['general']?.filter((c) => c.tier === 'out').forEach((c) => {
    lines.push(`- ${c.text}`);
  });
  if (!byCategory['general']?.some((c) => c.tier === 'out')) {
    lines.push('- None defined.');
  }
  lines.push('');
  lines.push('## Traceability');
  lines.push('');
  lines.push('| Requirement | Phase | Status |');
  lines.push('|-------------|-------|--------|');
  lines.push(...traceRows);
  lines.push('');
  lines.push('---');

  const outPath = path.join(fmsRoot, 'REQUIREMENTS.md');
  fs.writeFileSync(outPath, lines.join('\n'), 'utf-8');
}
