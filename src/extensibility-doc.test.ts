import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { describe, expect, it } from 'vitest';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const coreRoot = path.join(repoRoot, 'core');
const extensibilityDoc = path.join(repoRoot, 'docs', 'extensibility.md');
const cliSource = path.join(repoRoot, 'src', 'cli.ts');

/** Keep in sync with docs/extensibility.md directory tree. */
const DOCUMENTED_AGENTS = [
  'fms-planner.md',
  'fms-plan-checker.md',
  'fms-executor.md',
  'fms-phase-researcher.md',
  'fms-verifier.md',
  'fms-debugger.md',
  'fms-codebase-mapper.md',
];

const DOCUMENTED_WORKFLOWS = [
  'new-project.md',
  'discuss-phase.md',
  'plan-phase.md',
  'execute-phase.md',
  'map-codebase.md',
  'verify-work.md',
  'quick.md',
  'help.md',
];

const DOCUMENTED_REFERENCES = [
  'README.md',
  'verification-patterns.md',
  'git-integration.md',
  'questioning.md',
  'continuation-format.md',
];

const DOCUMENTED_TEMPLATE_TOP = [
  'PROJECT.md',
  'ROADMAP.md',
  'REQUIREMENTS.md',
  'STATE.md',
  'PLAN.md',
  'RESEARCH.md',
  'VALIDATION.md',
  'CONTEXT.md',
  'DEBUG.md',
  'UAT.md',
  'UI-SPEC.md',
];

const DOCUMENTED_TEMPLATE_RESEARCH = [
  'SUMMARY.md',
  'STACK.md',
  'FEATURES.md',
  'ARCHITECTURE.md',
  'PITFALLS.md',
];

const DOCUMENTED_HOOKED_COMMANDS = [
  'new-project',
  'discuss-phase',
  'plan-phase',
  'execute-phase',
  'verify-work',
  'complete-phase',
  'complete-milestone',
  'quick',
];

function listFiles(dir: string): string[] {
  return fs
    .readdirSync(dir)
    .filter((name) => fs.statSync(path.join(dir, name)).isFile())
    .sort();
}

function readDoc(): string {
  return fs.readFileSync(extensibilityDoc, 'utf-8');
}

function extractHookedCommandsFromCli(): string[] {
  const source = fs.readFileSync(cliSource, 'utf-8');
  const matches = [...source.matchAll(/command:\s*'([^']+)'/g)].map((m) => m[1]);
  return [...new Set(matches)].sort();
}

describe('extensibility doc contract', () => {
  const doc = readDoc();

  it('core/agents matches documented manifest', () => {
    const actual = listFiles(path.join(coreRoot, 'agents'));
    expect(actual).toEqual([...DOCUMENTED_AGENTS].sort());
  });

  it('core/workflows matches documented manifest', () => {
    const actual = listFiles(path.join(coreRoot, 'workflows'));
    expect(actual).toEqual([...DOCUMENTED_WORKFLOWS].sort());
  });

  it('core/references matches documented manifest', () => {
    const actual = listFiles(path.join(coreRoot, 'references'));
    expect(actual).toEqual([...DOCUMENTED_REFERENCES].sort());
  });

  it('core/templates top-level matches documented manifest', () => {
    const actual = listFiles(path.join(coreRoot, 'templates'));
    expect(actual).toEqual([...DOCUMENTED_TEMPLATE_TOP].sort());
  });

  it('core/templates/research-project matches documented manifest', () => {
    const actual = listFiles(path.join(coreRoot, 'templates', 'research-project'));
    expect(actual).toEqual([...DOCUMENTED_TEMPLATE_RESEARCH].sort());
  });

  it('documents every bundled agent, workflow, and reference file', () => {
    const allNames = [
      ...DOCUMENTED_AGENTS,
      ...DOCUMENTED_WORKFLOWS,
      ...DOCUMENTED_REFERENCES,
      ...DOCUMENTED_TEMPLATE_TOP,
      ...DOCUMENTED_TEMPLATE_RESEARCH,
    ];
    for (const name of allNames) {
      expect(doc, `docs/extensibility.md should mention ${name}`).toContain(name);
    }
  });

  it('hooked commands in cli.ts match documented list', () => {
    const fromCli = extractHookedCommandsFromCli();
    expect(fromCli).toEqual([...DOCUMENTED_HOOKED_COMMANDS].sort());
  });

  it('documents key extensibility topics', () => {
    expect(doc).toContain('config.json');
    expect(doc).toContain('resolveFmsRoot');
    expect(doc).toContain('getPhaseBase');
    expect(doc).toContain('.fms-prefs.json');
    expect(doc).toContain('codebase/');
  });
});
