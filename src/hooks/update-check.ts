import fs from 'fs';
import path from 'path';
import { execFile } from 'child_process';
import { promisify } from 'util';
import chalk from 'chalk';
import type { HookContext, HookStage } from './index.js';

const execFileAsync = promisify(execFile);

const HOOK_NAME = 'update-check';
const NPM_PACKAGE_NAME = 'fix-my-shit';
const ONE_DAY_MS = 24 * 60 * 60 * 1000;

interface UpdateCheckCache {
  lastCheck: string;
  latestVersion: string;
}

function readInstalledVersion(fmsRoot: string): string | null {
  const versionPath = path.join(fmsRoot, 'VERSION');
  try {
    const raw = fs.readFileSync(versionPath, 'utf-8');
    const v = raw.trim();
    return v || null;
  } catch {
    return null;
  }
}

function readCache(cachePath: string): UpdateCheckCache | null {
  try {
    const raw = fs.readFileSync(cachePath, 'utf-8');
    const parsed = JSON.parse(raw) as UpdateCheckCache;
    if (!parsed.lastCheck || !parsed.latestVersion) return null;
    return parsed;
  } catch {
    return null;
  }
}

function writeCache(cachePath: string, cache: UpdateCheckCache): void {
  try {
    fs.mkdirSync(path.dirname(cachePath), { recursive: true });
    fs.writeFileSync(cachePath, JSON.stringify(cache, null, 2), 'utf-8');
  } catch {
    // best-effort only
  }
}

function isStale(cache: UpdateCheckCache): boolean {
  const last = Date.parse(cache.lastCheck);
  if (Number.isNaN(last)) return true;
  return Date.now() - last > ONE_DAY_MS;
}

async function fetchLatestVersionFromNpm(): Promise<string | null> {
  try {
    const { stdout } = await execFileAsync('npm', ['view', NPM_PACKAGE_NAME, 'version'], {
      timeout: 5000,
    });
    const v = stdout.toString().trim();
    return v || null;
  } catch {
    return null;
  }
}

function compareVersions(a: string, b: string): number {
  const pa = a.split('.').map((x) => parseInt(x, 10) || 0);
  const pb = b.split('.').map((x) => parseInt(x, 10) || 0);
  const len = Math.max(pa.length, pb.length);
  for (let i = 0; i < len; i++) {
    const va = pa[i] ?? 0;
    const vb = pb[i] ?? 0;
    if (va > vb) return 1;
    if (va < vb) return -1;
  }
  return 0;
}

function maybePrintUpgradeMessage(installed: string, latest: string): void {
  if (compareVersions(latest, installed) <= 0) return;
  const prefix = chalk.yellow('[fms update]');
  // Keep this short and non-fatal.
  // eslint-disable-next-line no-console
  console.log(
    prefix,
    `A newer version of fix-my-shit is available (${installed} → ${latest}). Consider running`,
    chalk.cyan('npm i -g fix-my-shit'),
    'or using',
    chalk.cyan('npx fix-my-shit'),
    'to get the latest features.'
  );
}

export async function runUpdateCheckHook(stage: HookStage, ctx: HookContext): Promise<void> {
  // Only run on "before" for selected commands where version drift matters.
  if (stage !== 'before') return;
  if (!['new-project', 'plan-phase', 'execute-phase', 'quick'].includes(ctx.command)) return;

  const installed = readInstalledVersion(ctx.fmsRoot);
  if (!installed) return;

  const cachePath = path.join(ctx.fmsRoot, 'hooks', `${HOOK_NAME}.json`);
  let cache = readCache(cachePath);

  if (!cache || isStale(cache)) {
    const latest = await fetchLatestVersionFromNpm();
    if (!latest) return; // do not log noisy errors; hooks must stay quiet on failure
    cache = {
      lastCheck: new Date().toISOString(),
      latestVersion: latest,
    };
    writeCache(cachePath, cache);
  }

  maybePrintUpgradeMessage(installed, cache.latestVersion);
}

