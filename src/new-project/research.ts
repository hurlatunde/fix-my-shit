import fs from 'fs';
import path from 'path';

export function runResearch(fmsRoot: string): void {
  const researchDir = path.join(fmsRoot, 'research');
  fs.mkdirSync(researchDir, { recursive: true });

  const projectPath = path.join(fmsRoot, 'PROJECT.md');
  let projectSnippet = '';
  try {
    projectSnippet = fs.readFileSync(projectPath, 'utf-8').slice(0, 500);
  } catch {
    projectSnippet = 'No PROJECT.md yet.';
  }

  const stamp = new Date().toISOString().slice(0, 10);
  const files: [string, string][] = [
    [
      'STACK.md',
      `# Stack Research\n\n**Researched:** ${stamp}\n**Confidence:** LOW (stub)\n\n## Recommended Stack\n\nDerived from project context. Replace with real research.\n\n\`\`\`\n${projectSnippet}\n\`\`\`\n`,
    ],
    [
      'FEATURES.md',
      `# Feature Research\n\n**Researched:** ${stamp}\n\n## Table Stakes\n\n(Extract from PROJECT.md or run full research.)\n\n## Differentiators\n\n(To be filled.)\n`,
    ],
    [
      'ARCHITECTURE.md',
      `# Architecture Research\n\n**Researched:** ${stamp}\n\n## Components\n\n(To be derived from project goal.)\n`,
    ],
    [
      'PITFALLS.md',
      `# Pitfalls Research\n\n**Researched:** ${stamp}\n\n## Critical Pitfalls\n\n(To be filled.)\n`,
    ],
    [
      'SUMMARY.md',
      `# Research Summary\n\n**Researched:** ${stamp}\n\n## Summary\n\nStub research. Run full research (e.g. phase researcher) for real content.\n\n## Key Findings\n\n- Stack: see STACK.md\n- Features: see FEATURES.md\n- Architecture: see ARCHITECTURE.md\n- Pitfalls: see PITFALLS.md\n`,
    ],
  ];

  for (const [name, body] of files) {
    fs.writeFileSync(path.join(researchDir, name), body, 'utf-8');
  }
}
