import fs from 'fs';
import os from 'os';
import path from 'path';
import { fileURLToPath } from 'url';
import { afterEach, describe, expect, it } from 'vitest';
import { getPlansByWave, getPlansForPhase } from './wave-builder.js';

const fixturesDir = path.join(path.dirname(fileURLToPath(import.meta.url)), '../../tests/fixtures');

const tempDirs: string[] = [];

function setupPhaseWithPlans(): string {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'fms-wave-'));
  tempDirs.push(root);
  fs.writeFileSync(
    path.join(root, 'ROADMAP.md'),
    fs.readFileSync(path.join(fixturesDir, 'roadmap-sample.md'), 'utf-8')
  );
  const phaseDir = path.join(root, 'phases', '01-foundation');
  fs.mkdirSync(phaseDir, { recursive: true });
  fs.copyFileSync(path.join(fixturesDir, 'plan-wave1.md'), path.join(phaseDir, '01-01-PLAN.md'));
  fs.copyFileSync(
    path.join(fixturesDir, 'plan-wave2-depends.md'),
    path.join(phaseDir, '01-02-PLAN.md')
  );
  return root;
}

afterEach(() => {
  for (const dir of tempDirs.splice(0)) {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

describe('getPlansForPhase', () => {
  it('loads plans sorted by wave then id', () => {
    const root = setupPhaseWithPlans();
    const plans = getPlansForPhase(root, 1);
    expect(plans.map((p) => p.id)).toEqual(['01-01', '01-02']);
    expect(plans.map((p) => p.wave)).toEqual([1, 2]);
    expect(plans[0].frontmatter.requirements).toEqual(['GEN-01', 'INST-02']);
    expect(plans[0].frontmatter.objective).toContain('foundation installer');
  });
});

describe('getPlansByWave', () => {
  it('groups plan ids by wave number', () => {
    const root = setupPhaseWithPlans();
    const byWave = getPlansByWave(root, 1);
    expect(byWave.get(1)).toEqual(['01-01']);
    expect(byWave.get(2)).toEqual(['01-02']);
  });
});
