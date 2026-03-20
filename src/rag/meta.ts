import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

export interface FocusTimestamps {
  tech?: string;
  arch?: string;
  quality?: string;
  concerns?: string;
  summary?: string;
}

export interface CodebaseMeta {
  version: 1;
  mappedAt: string;
  gitCommit: string | null;
  focusTimestamps: FocusTimestamps;
}

export type FocusArea = 'tech' | 'arch' | 'quality' | 'concerns';

export interface DriftResult {
  hasDrift: boolean;
  changedFiles: string[];
  affectedFocusAreas: FocusArea[];
  commitsBehind: number;
  isGitRepo: boolean;
}

const FOCUS_DOC_MAP: Record<FocusArea, string[]> = {
  tech: ['STACK.md', 'INTEGRATIONS.md'],
  arch: ['ARCHITECTURE.md', 'STRUCTURE.md', 'SYMBOLS.md'],
  quality: ['CONVENTIONS.md', 'TESTING.md'],
  concerns: ['CONCERNS.md'],
};

const PATH_TO_FOCUS: Array<{ pattern: RegExp; focus: FocusArea }> = [
  { pattern: /package\.json|requirements\.txt|Cargo\.toml|go\.mod|pyproject\.toml|\.nvmrc/, focus: 'tech' },
  { pattern: /\.(env|config)\b/, focus: 'tech' },
  { pattern: /tsconfig|eslint|prettier|biome/, focus: 'quality' },
  { pattern: /\.test\.|\.spec\.|__tests__|jest\.config|vitest\.config/, focus: 'quality' },
  { pattern: /\.github\/|\.ci\/|Dockerfile|docker-compose/, focus: 'tech' },
];

function getMetaPath(codebaseDir: string): string {
  return path.join(codebaseDir, 'meta.json');
}

function getCurrentGitCommit(cwd: string): string | null {
  try {
    return execSync('git rev-parse HEAD', { cwd, encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'] }).trim();
  } catch {
    return null;
  }
}

function isGitRepo(cwd: string): boolean {
  try {
    execSync('git rev-parse --is-inside-work-tree', { cwd, encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'] });
    return true;
  } catch {
    return false;
  }
}

function getChangedFilesSinceCommit(commit: string, cwd: string): string[] {
  try {
    const output = execSync(`git diff --name-only ${commit}..HEAD`, {
      cwd,
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    return output.trim().split('\n').filter(Boolean);
  } catch {
    return [];
  }
}

function getCommitCountSince(commit: string, cwd: string): number {
  try {
    const output = execSync(`git rev-list --count ${commit}..HEAD`, {
      cwd,
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    return parseInt(output.trim(), 10) || 0;
  } catch {
    return 0;
  }
}

function mapFilesToFocusAreas(files: string[]): FocusArea[] {
  const areas = new Set<FocusArea>();

  for (const file of files) {
    let matched = false;
    for (const rule of PATH_TO_FOCUS) {
      if (rule.pattern.test(file)) {
        areas.add(rule.focus);
        matched = true;
        break;
      }
    }
    if (!matched) {
      areas.add('arch');
      areas.add('concerns');
    }
  }

  return Array.from(areas);
}

export function writeMeta(codebaseDir: string, focusAreas?: FocusArea[]): void {
  const projectRoot = path.resolve(codebaseDir, '..');
  const now = new Date().toISOString();
  const existing = readMeta(codebaseDir);

  const focusTimestamps: FocusTimestamps = existing?.focusTimestamps ?? {};
  if (focusAreas) {
    for (const area of focusAreas) {
      focusTimestamps[area] = now;
    }
  } else {
    focusTimestamps.tech = now;
    focusTimestamps.arch = now;
    focusTimestamps.quality = now;
    focusTimestamps.concerns = now;
  }
  focusTimestamps.summary = now;

  const meta: CodebaseMeta = {
    version: 1,
    mappedAt: now,
    gitCommit: getCurrentGitCommit(projectRoot),
    focusTimestamps,
  };

  fs.writeFileSync(getMetaPath(codebaseDir), JSON.stringify(meta, null, 2), 'utf-8');
}

export function readMeta(codebaseDir: string): CodebaseMeta | null {
  const metaPath = getMetaPath(codebaseDir);
  if (!fs.existsSync(metaPath)) return null;
  try {
    return JSON.parse(fs.readFileSync(metaPath, 'utf-8')) as CodebaseMeta;
  } catch {
    return null;
  }
}

export function detectDrift(codebaseDir: string): DriftResult {
  const projectRoot = path.resolve(codebaseDir, '..');
  const meta = readMeta(codebaseDir);
  const gitAvailable = isGitRepo(projectRoot);

  if (!meta) {
    return {
      hasDrift: true,
      changedFiles: [],
      affectedFocusAreas: ['tech', 'arch', 'quality', 'concerns'],
      commitsBehind: 0,
      isGitRepo: gitAvailable,
    };
  }

  if (gitAvailable && meta.gitCommit) {
    const changedFiles = getChangedFilesSinceCommit(meta.gitCommit, projectRoot);
    const commitsBehind = getCommitCountSince(meta.gitCommit, projectRoot);

    if (changedFiles.length === 0) {
      return { hasDrift: false, changedFiles: [], affectedFocusAreas: [], commitsBehind: 0, isGitRepo: true };
    }

    return {
      hasDrift: true,
      changedFiles,
      affectedFocusAreas: mapFilesToFocusAreas(changedFiles),
      commitsBehind,
      isGitRepo: true,
    };
  }

  const mappedAt = new Date(meta.mappedAt).getTime();
  const ageMs = Date.now() - mappedAt;
  const ageHours = ageMs / (1000 * 60 * 60);

  if (ageHours > 24) {
    return {
      hasDrift: true,
      changedFiles: [],
      affectedFocusAreas: ['tech', 'arch', 'quality', 'concerns'],
      commitsBehind: 0,
      isGitRepo: false,
    };
  }

  return { hasDrift: false, changedFiles: [], affectedFocusAreas: [], commitsBehind: 0, isGitRepo: false };
}

export function getFocusDocuments(focus: FocusArea): string[] {
  return FOCUS_DOC_MAP[focus] ?? [];
}
