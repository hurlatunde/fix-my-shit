import fs from 'fs';
import os from 'os';
import path from 'path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { readPrefs, resolveFmsRoot, writePrefs } from './path-resolver.js';

let tempHome: string;
let tempCwd: string;
let previousHome: string | undefined;

beforeEach(() => {
  previousHome = process.env.HOME;
  tempHome = fs.mkdtempSync(path.join(os.tmpdir(), 'fms-home-'));
  tempCwd = fs.mkdtempSync(path.join(os.tmpdir(), 'fms-cwd-'));
  process.env.HOME = tempHome;
});

afterEach(() => {
  if (previousHome === undefined) {
    delete process.env.HOME;
  } else {
    process.env.HOME = previousHome;
  }
  fs.rmSync(tempHome, { recursive: true, force: true });
  fs.rmSync(tempCwd, { recursive: true, force: true });
});

describe('readPrefs / writePrefs', () => {
  it('reads local prefs over global', () => {
    writePrefs('global', tempCwd);
    const localDir = path.join(tempCwd, '.cursor', 'fms');
    fs.mkdirSync(localDir, { recursive: true });
    fs.writeFileSync(
      path.join(localDir, '.fms-prefs.json'),
      JSON.stringify({ prefer: 'local' }),
      'utf-8'
    );
    expect(readPrefs(tempCwd).prefer).toBe('local');
  });
});

describe('resolveFmsRoot', () => {
  it('honors prefer global', () => {
    writePrefs('global', tempCwd);
    expect(resolveFmsRoot(tempCwd)).toBe(path.join(tempHome, '.cursor', 'fms'));
  });

  it('honors prefer local', () => {
    writePrefs('local', tempCwd);
    expect(resolveFmsRoot(tempCwd)).toBe(path.join(tempCwd, '.cursor', 'fms'));
  });

  it('defaults to local when .cursor/fms exists in cwd', () => {
    const localFms = path.join(tempCwd, '.cursor', 'fms');
    fs.mkdirSync(localFms, { recursive: true });
    expect(resolveFmsRoot(tempCwd)).toBe(path.resolve(localFms));
  });

  it('falls back to global when local install is absent', () => {
    expect(resolveFmsRoot(tempCwd)).toBe(path.join(tempHome, '.cursor', 'fms'));
  });
});
