import path from 'path';
import os from 'os';

export type Runtime =
  | 'cursor'
  | 'claude'
  | 'opencode'
  | 'gemini'
  | 'codex'
  | 'copilot'
  | 'antigravity';

export type LocationChoice = 'global' | 'local';

export interface InstallTarget {
  runtime: Runtime;
  location: LocationChoice;
  root: string;
}

export const RUNTIMES: Runtime[] = [
  'cursor',
  'claude',
  'opencode',
  'gemini',
  'codex',
  'copilot',
  'antigravity',
];

/**
 * Directory name for local installs (e.g. .cursor, .claude, .github for copilot).
 */
export function getRuntimeDirName(runtime: Runtime): string {
  switch (runtime) {
    case 'cursor':
      return '.cursor';
    case 'claude':
      return '.claude';
    case 'opencode':
      return '.opencode';
    case 'gemini':
      return '.gemini';
    case 'codex':
      return '.codex';
    case 'copilot':
      return '.github';
    case 'antigravity':
      return '.agent';
  }
}

/**
 * Absolute global config root including /fms (e.g. ~/.cursor/fms, ~/.config/opencode/fms).
 */
export function getGlobalRoot(runtime: Runtime): string {
  const home = os.homedir();
  switch (runtime) {
    case 'cursor':
      return path.join(home, '.cursor', 'fms');
    case 'claude':
      return path.join(home, '.claude', 'fms');
    case 'opencode':
      return path.join(home, '.config', 'opencode', 'fms');
    case 'gemini':
      return path.join(home, '.gemini', 'fms');
    case 'codex':
      return path.join(home, '.codex', 'fms');
    case 'copilot':
      return path.join(home, '.copilot', 'fms');
    case 'antigravity':
      return path.join(home, '.gemini', 'antigravity', 'fms');
  }
}

/**
 * Project-relative install root including /fms (e.g. ./.cursor/fms, ./.github/fms).
 */
export function getLocalRoot(runtime: Runtime): string {
  const cwd = process.cwd();
  const dirName = getRuntimeDirName(runtime);
  return path.join(cwd, dirName, 'fms');
}

/**
 * Get the fms root for a given runtime and location.
 */
export function getFmsRoot(runtime: Runtime, location: LocationChoice): string {
  return location === 'global' ? getGlobalRoot(runtime) : getLocalRoot(runtime);
}

export interface InstallCliOptions {
  cursor?: boolean;
  claude?: boolean;
  opencode?: boolean;
  gemini?: boolean;
  codex?: boolean;
  copilot?: boolean;
  antigravity?: boolean;
  all?: boolean;
  global?: boolean;
  local?: boolean;
}

/**
 * Parse CLI options into selected runtimes and location (if any).
 */
export function parseInstallArgs(opts: InstallCliOptions): {
  runtimes: Runtime[];
  location: LocationChoice | null;
} {
  const runtimes: Runtime[] = [];
  if (opts.all) {
    runtimes.push(...RUNTIMES);
  } else {
    if (opts.cursor) runtimes.push('cursor');
    if (opts.claude) runtimes.push('claude');
    if (opts.opencode) runtimes.push('opencode');
    if (opts.gemini) runtimes.push('gemini');
    if (opts.codex) runtimes.push('codex');
    if (opts.copilot) runtimes.push('copilot');
    if (opts.antigravity) runtimes.push('antigravity');
  }

  let location: LocationChoice | null = null;
  if (opts.global) location = 'global';
  if (opts.local) location = 'local';

  return { runtimes, location };
}
