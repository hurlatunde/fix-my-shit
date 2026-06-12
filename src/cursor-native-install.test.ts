import fs from 'fs';
import os from 'os';
import path from 'path';
import { fileURLToPath } from 'url';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import {
  CURSOR_NATIVE_MANIFEST,
  cleanupCursorNativeIntegration,
  getCursorDir,
  installCursorNativeIntegration,
} from './cursor-native-install.js';
import { installForRuntime } from './install.js';
import type { InstallTarget } from './runtime-paths.js';

const moduleDir = path.dirname(fileURLToPath(import.meta.url));
const projectCore = path.join(moduleDir, '..', 'core');
const testCoreLink = path.join(moduleDir, 'core');

let tempHome: string;
let tempCwd: string;
let previousHome: string | undefined;
let previousCwd: string;

function setupMinimalFmsRoot(fmsRoot: string): void {
  const agentsDir = path.join(fmsRoot, 'agents');
  fs.mkdirSync(agentsDir, { recursive: true });
  fs.writeFileSync(
    path.join(agentsDir, 'fms-planner.md'),
    '---\nname: fms-planner\ndescription: Test planner\ntools: Read, Write\n---\n\n# Planner\n',
    'utf-8'
  );
  fs.mkdirSync(path.join(fmsRoot, 'workflows'), { recursive: true });
  fs.writeFileSync(path.join(fmsRoot, 'workflows', 'help.md'), '# Help\n', 'utf-8');
}

function cursorTarget(fmsRoot: string): InstallTarget {
  return { runtime: 'cursor', location: 'local', root: fmsRoot };
}

beforeAll(() => {
  if (!fs.existsSync(testCoreLink) && fs.existsSync(projectCore)) {
    fs.symlinkSync(projectCore, testCoreLink, 'dir');
  }
});

afterAll(() => {
  if (fs.existsSync(testCoreLink) && fs.lstatSync(testCoreLink).isSymbolicLink()) {
    fs.unlinkSync(testCoreLink);
  }
});

beforeEach(() => {
  previousHome = process.env.HOME;
  previousCwd = process.cwd();
  tempHome = fs.mkdtempSync(path.join(os.tmpdir(), 'fms-native-home-'));
  tempCwd = fs.mkdtempSync(path.join(os.tmpdir(), 'fms-native-cwd-'));
  process.env.HOME = tempHome;
  process.chdir(tempCwd);
});

afterEach(() => {
  process.chdir(previousCwd);
  if (previousHome === undefined) {
    delete process.env.HOME;
  } else {
    process.env.HOME = previousHome;
  }
  fs.rmSync(tempHome, { recursive: true, force: true });
  fs.rmSync(tempCwd, { recursive: true, force: true });
});

describe('installCursorNativeIntegration', () => {
  it('copies agents into .cursor/agents with managed-by tag', () => {
    const fmsRoot = path.join(tempCwd, '.cursor', 'fms');
    setupMinimalFmsRoot(fmsRoot);

    installCursorNativeIntegration(cursorTarget(fmsRoot));

    const agentPath = path.join(tempCwd, '.cursor', 'agents', 'fms-planner.md');
    expect(fs.existsSync(agentPath)).toBe(true);
    const content = fs.readFileSync(agentPath, 'utf-8');
    expect(content).toContain('managed-by: fix-my-shit');
    expect(content).toContain('name: fms-planner');
  });

  it('writes CLI command template for status', () => {
    const fmsRoot = path.join(tempCwd, '.cursor', 'fms');
    setupMinimalFmsRoot(fmsRoot);

    installCursorNativeIntegration(cursorTarget(fmsRoot));

    const commandPath = path.join(tempCwd, '.cursor', 'commands', 'fms-status.md');
    expect(fs.existsSync(commandPath)).toBe(true);
    const content = fs.readFileSync(commandPath, 'utf-8');
    expect(content).toContain('# FMS Status');
    expect(content).toContain('fms status');
  });

  it('writes workflow command template for plan-phase', () => {
    const fmsRoot = path.join(tempCwd, '.cursor', 'fms');
    setupMinimalFmsRoot(fmsRoot);

    installCursorNativeIntegration(cursorTarget(fmsRoot));

    const commandPath = path.join(tempCwd, '.cursor', 'commands', 'fms-plan-phase.md');
    expect(fs.existsSync(commandPath)).toBe(true);
    const content = fs.readFileSync(commandPath, 'utf-8');
    expect(content).toContain('workflows/plan-phase.md');
    expect(content).toContain('fms-phase-researcher, fms-planner, fms-plan-checker');
  });

  it('writes overview skill at .cursor/skills/fms/SKILL.md', () => {
    const fmsRoot = path.join(tempCwd, '.cursor', 'fms');
    setupMinimalFmsRoot(fmsRoot);

    installCursorNativeIntegration(cursorTarget(fmsRoot));

    const skillPath = path.join(tempCwd, '.cursor', 'skills', 'fms', 'SKILL.md');
    expect(fs.existsSync(skillPath)).toBe(true);
    const content = fs.readFileSync(skillPath, 'utf-8');
    expect(content).toContain('name: fms');
    expect(content).toContain('/fms-help');
    expect(content).toContain(fmsRoot);
  });

  it('writes cursor-native-manifest.json under fms root', () => {
    const fmsRoot = path.join(tempCwd, '.cursor', 'fms');
    setupMinimalFmsRoot(fmsRoot);

    const result = installCursorNativeIntegration(cursorTarget(fmsRoot));

    const manifestPath = path.join(fmsRoot, CURSOR_NATIVE_MANIFEST);
    expect(fs.existsSync(manifestPath)).toBe(true);
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8')) as { files: string[] };
    expect(manifest.files).toEqual(result.files.sort());
    expect(manifest.files).toContain('agents/fms-planner.md');
    expect(manifest.files).toContain('commands/fms-status.md');
    expect(manifest.files).toContain('skills/fms/SKILL.md');
  });
});

describe('cleanupCursorNativeIntegration', () => {
  it('removes previously managed files on reinstall', () => {
    const fmsRoot = path.join(tempCwd, '.cursor', 'fms');
    setupMinimalFmsRoot(fmsRoot);
    const target = cursorTarget(fmsRoot);

    installCursorNativeIntegration(target);

    const agentPath = path.join(tempCwd, '.cursor', 'agents', 'fms-planner.md');
    const commandPath = path.join(tempCwd, '.cursor', 'commands', 'fms-status.md');
    expect(fs.existsSync(agentPath)).toBe(true);
    expect(fs.existsSync(commandPath)).toBe(true);

    cleanupCursorNativeIntegration(fmsRoot, target);

    expect(fs.existsSync(agentPath)).toBe(false);
    expect(fs.existsSync(commandPath)).toBe(false);
  });
});

describe('getCursorDir', () => {
  it('uses project .cursor for local installs', () => {
    const fmsRoot = path.join(tempCwd, '.cursor', 'fms');
    fs.mkdirSync(path.dirname(fmsRoot), { recursive: true });
    expect(fs.realpathSync(getCursorDir(cursorTarget(fmsRoot)))).toBe(
      fs.realpathSync(path.join(tempCwd, '.cursor'))
    );
  });

  it('uses home .cursor for global installs', () => {
    const fmsRoot = path.join(tempHome, '.cursor', 'fms');
    expect(getCursorDir({ runtime: 'cursor', location: 'global', root: fmsRoot })).toBe(
      path.join(tempHome, '.cursor')
    );
  });
});

describe('installForRuntime cursor native opt-out', () => {
  it('skips native paths when noCursorNative is set', () => {
    if (!fs.existsSync(testCoreLink)) {
      expect(fs.existsSync(projectCore)).toBe(true);
      return;
    }

    const target: InstallTarget = {
      runtime: 'cursor',
      location: 'local',
      root: path.join(tempCwd, '.cursor', 'fms'),
    };

    installForRuntime(target, { noCursorNative: true });

    expect(fs.existsSync(path.join(tempCwd, '.cursor', 'fms', 'agents'))).toBe(true);
    expect(fs.existsSync(path.join(tempCwd, '.cursor', 'commands'))).toBe(false);
    expect(fs.existsSync(path.join(tempCwd, '.cursor', 'skills', 'fms', 'SKILL.md'))).toBe(false);
    expect(fs.existsSync(path.join(target.root, CURSOR_NATIVE_MANIFEST))).toBe(false);
  });

  it('installs native paths by default for cursor runtime', () => {
    if (!fs.existsSync(testCoreLink)) {
      expect(fs.existsSync(projectCore)).toBe(true);
      return;
    }

    const target: InstallTarget = {
      runtime: 'cursor',
      location: 'local',
      root: path.join(tempCwd, '.cursor', 'fms'),
    };

    installForRuntime(target);

    expect(fs.existsSync(path.join(tempCwd, '.cursor', 'agents', 'fms-planner.md'))).toBe(true);
    expect(fs.existsSync(path.join(tempCwd, '.cursor', 'commands', 'fms-help.md'))).toBe(true);
    expect(fs.existsSync(path.join(tempCwd, '.cursor', 'skills', 'fms', 'SKILL.md'))).toBe(true);
    expect(fs.existsSync(path.join(target.root, CURSOR_NATIVE_MANIFEST))).toBe(true);
  });
});
