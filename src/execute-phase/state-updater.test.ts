import fs from 'fs';
import os from 'os';
import path from 'path';
import { fileURLToPath } from 'url';
import { afterEach, describe, expect, it } from 'vitest';
import { updateStateAfterPlan } from './state-updater.js';

const fixturesDir = path.join(path.dirname(fileURLToPath(import.meta.url)), '../../tests/fixtures');

let tempDir: string | null = null;

afterEach(() => {
  if (tempDir) {
    fs.rmSync(tempDir, { recursive: true, force: true });
    tempDir = null;
  }
});

describe('updateStateAfterPlan', () => {
  it('updates timestamps, activity, and plan counter', () => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'fms-state-'));
    const statePath = path.join(tempDir, 'STATE.md');
    fs.copyFileSync(path.join(fixturesDir, 'state-sample.md'), statePath);

    updateStateAfterPlan(statePath, 2, 1, 3);
    const content = fs.readFileSync(statePath, 'utf-8');

    expect(content).toMatch(/last_updated: "\d{4}-\d{2}-\d{2}T/);
    expect(content).toContain('last_activity:');
    expect(content).toContain('Phase 2 plan 1/3 executed');
    expect(content).toContain('Plan: 1 of 3 in current phase');
  });
});
