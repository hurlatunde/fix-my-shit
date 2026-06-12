import fs from 'fs';
import os from 'os';
import path from 'path';
import { fileURLToPath } from 'url';
import { afterEach, describe, expect, it } from 'vitest';
import { getPhaseDir } from './phases.js';

const fixturesDir = path.join(path.dirname(fileURLToPath(import.meta.url)), '../tests/fixtures');

const tempDirs: string[] = [];

function makeTempFmsRoot(roadmap?: string): string {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'fms-phases-'));
  tempDirs.push(root);
  if (roadmap !== undefined) {
    fs.writeFileSync(path.join(root, 'ROADMAP.md'), roadmap, 'utf-8');
  }
  return root;
}

afterEach(() => {
  for (const dir of tempDirs.splice(0)) {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

describe('getPhaseDir', () => {
  it('derives slug from ROADMAP phase section', () => {
    const root = makeTempFmsRoot(
      fs.readFileSync(path.join(fixturesDir, 'roadmap-sample.md'), 'utf-8')
    );
    const { phaseDir, slug } = getPhaseDir(root, 2);
    expect(slug).toBe('new-project');
    expect(phaseDir).toBe(path.join(root, 'phases', '02-new-project'));
  });

  it('uses fallback slug when roadmap is missing', () => {
    const root = makeTempFmsRoot();
    const { slug, phaseDir } = getPhaseDir(root, 1);
    expect(slug).toBe('foundation');
    expect(phaseDir).toBe(path.join(root, 'phases', '01-foundation'));
  });
});
