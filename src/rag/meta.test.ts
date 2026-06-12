import fs from 'fs';
import os from 'os';
import path from 'path';
import { afterEach, describe, expect, it } from 'vitest';
import { getFocusDocuments, readMeta, writeMeta } from './meta.js';

let tempDir: string | null = null;

afterEach(() => {
  if (tempDir) {
    fs.rmSync(tempDir, { recursive: true, force: true });
    tempDir = null;
  }
});

describe('getFocusDocuments', () => {
  it('returns mapped doc names per focus area', () => {
    expect(getFocusDocuments('tech')).toContain('STACK.md');
    expect(getFocusDocuments('quality')).toContain('TESTING.md');
  });
});

describe('readMeta / writeMeta', () => {
  it('roundtrips meta.json in codebase dir', () => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'fms-meta-'));
    const projectRoot = path.join(tempDir, 'project');
    const codebaseDir = path.join(projectRoot, 'codebase');
    fs.mkdirSync(codebaseDir, { recursive: true });

    writeMeta(codebaseDir, ['tech', 'arch']);
    const meta = readMeta(codebaseDir);

    expect(meta).not.toBeNull();
    expect(meta?.version).toBe(1);
    expect(meta?.focusTimestamps.tech).toBeDefined();
    expect(meta?.focusTimestamps.arch).toBeDefined();
    expect(fs.existsSync(path.join(codebaseDir, 'meta.json'))).toBe(true);
  });
});
