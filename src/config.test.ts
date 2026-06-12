import fs from 'fs';
import os from 'os';
import path from 'path';
import { fileURLToPath } from 'url';
import { afterEach, describe, expect, it } from 'vitest';
import { loadConfig } from './config.js';

const fixturesDir = path.join(path.dirname(fileURLToPath(import.meta.url)), '../tests/fixtures');

let tempDir: string | null = null;

afterEach(() => {
  if (tempDir) {
    fs.rmSync(tempDir, { recursive: true, force: true });
    tempDir = null;
  }
});

describe('loadConfig', () => {
  it('returns defaults when config.json is missing', () => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'fms-config-'));
    const config = loadConfig(tempDir);
    expect(config.mode).toBe('yolo');
    expect(config.commit_docs).toBe(true);
    expect(config.workflow.research).toBe(true);
  });

  it('merges valid JSON overrides', () => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'fms-config-'));
    fs.writeFileSync(
      path.join(tempDir, 'config.json'),
      JSON.stringify({ mode: 'interactive', commit_docs: false }),
      'utf-8'
    );
    const config = loadConfig(tempDir);
    expect(config.mode).toBe('interactive');
    expect(config.commit_docs).toBe(false);
    expect(config.workflow.research).toBe(true);
  });

  it('parses JSON with line comments', () => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'fms-config-'));
    fs.copyFileSync(
      path.join(fixturesDir, 'config-with-comments.json'),
      path.join(tempDir, 'config.json')
    );
    const config = loadConfig(tempDir);
    expect(config.mode).toBe('interactive');
    expect(config.commit_docs).toBe(false);
    expect(config.workflow.research).toBe(false);
  });
});
