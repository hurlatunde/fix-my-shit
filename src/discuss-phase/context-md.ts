import fs from 'fs';
import path from 'path';

export function writeContextMd(
  phaseDir: string,
  padded: string,
  goal: string,
  decisions: Record<string, string>
): string {
  const lines: string[] = [
    `# Phase ${padded}: Context`,
    '',
    `**Gathered:** ${new Date().toISOString().slice(0, 10)}`,
    '**Status:** Ready for planning',
    '',
    '<domain>',
    '## Phase Boundary',
    '',
    goal || '(See ROADMAP for phase goal.)',
    '',
    '</domain>',
    '',
    '<decisions>',
    '## Implementation Decisions',
    '',
  ];
  for (const [area, value] of Object.entries(decisions)) {
    lines.push(`### ${area}`);
    lines.push('');
    lines.push(value);
    lines.push('');
  }
  lines.push('### Claude\'s Discretion');
  lines.push('');
  lines.push('Areas not discussed — use standard approaches.');
  lines.push('');
  lines.push('</decisions>');
  lines.push('');
  lines.push('<specifics>');
  lines.push('## Specific Ideas');
  lines.push('');
  lines.push('None specified.');
  lines.push('');
  lines.push('</specifics>');
  lines.push('');
  lines.push('<deferred>');
  lines.push('## Deferred Ideas');
  lines.push('');
  lines.push('None.');
  lines.push('');
  lines.push('---');

  const outPath = path.join(phaseDir, `${padded}-CONTEXT.md`);
  fs.writeFileSync(outPath, lines.join('\n'), 'utf-8');
  return outPath;
}

export function getPhaseGoal(fmsRoot: string, phaseNum: number): string {
  const roadmapPath = path.join(fmsRoot, 'ROADMAP.md');
  try {
    const content = fs.readFileSync(roadmapPath, 'utf-8');
    const goalMatch = content.match(
      new RegExp(`### Phase ${phaseNum}:[^\\n]+\\n\\*\\*Goal\\*\\*:\\s*([^\\n]+)`, 'i')
    );
    if (goalMatch) return goalMatch[1].trim();
  } catch {
    // ignore
  }
  return '';
}
