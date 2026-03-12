import path from 'path';
import fs from 'fs';
import os from 'os';

const PREFS_FILE = '.fms-prefs.json';

export interface FmsPrefs {
  prefer?: 'global' | 'local';
}

function prefsPath(cwd: string, scope: 'local' | 'global'): string {
  const home = os.homedir();
  const dir = scope === 'local' ? path.join(cwd, '.cursor', 'fms') : path.join(home, '.cursor', 'fms');
  return path.join(dir, PREFS_FILE);
}

/**
 * Read effective prefs: cwd prefs override home prefs.
 */
export function readPrefs(cwd?: string): FmsPrefs {
  const start = cwd ?? process.cwd();
  const home = os.homedir();
  for (const dir of [path.join(start, '.cursor', 'fms'), path.join(home, '.cursor', 'fms')]) {
    const file = path.join(dir, PREFS_FILE);
    try {
      const raw = fs.readFileSync(file, 'utf-8');
      const data = JSON.parse(raw) as FmsPrefs;
      if (data.prefer === 'global' || data.prefer === 'local') return data;
    } catch {
      // ignore
    }
  }
  return {};
}

/**
 * Write prefs to the given scope (local = cwd .cursor/fms, global = home .cursor/fms).
 */
export function writePrefs(prefer: 'global' | 'local', cwd?: string): void {
  const start = cwd ?? process.cwd();
  const home = os.homedir();
  const dir = prefer === 'local' ? path.join(start, '.cursor', 'fms') : path.join(home, '.cursor', 'fms');
  fs.mkdirSync(dir, { recursive: true });
  const file = path.join(dir, PREFS_FILE);
  fs.writeFileSync(file, JSON.stringify({ prefer }, null, 2), 'utf-8');
}

/**
 * Resolves the fms root directory. Respects .fms-prefs.json prefer (global | local).
 * Default: local .cursor/fms in cwd first, else ~/.cursor/fms.
 */
export function resolveFmsRoot(cwd?: string): string {
  const start = cwd ?? process.cwd();
  const home = os.homedir();
  const localFms = path.join(start, '.cursor', 'fms');
  const globalFms = path.join(home, '.cursor', 'fms');
  const prefs = readPrefs(start);

  if (prefs.prefer === 'global') {
    return globalFms;
  }
  if (prefs.prefer === 'local') {
    return localFms;
  }
  try {
    const stat = fs.statSync(localFms);
    if (stat.isDirectory()) return path.resolve(localFms);
  } catch {
    // .cursor/fms does not exist in cwd
  }
  return globalFms;
}
