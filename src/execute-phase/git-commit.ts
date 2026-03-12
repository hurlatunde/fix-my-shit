import { spawnSync } from 'child_process';
import path from 'path';

export function isInsideGitRepo(cwd?: string): boolean {
  const dir = cwd ?? process.cwd();
  const r = spawnSync('git', ['rev-parse', '--is-inside-work-tree'], {
    cwd: dir,
    encoding: 'utf-8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  return r.stdout?.trim() === 'true';
}

export function commitPlanFiles(
  cwd: string,
  phaseNum: number,
  planId: string,
  filesToAdd: string[],
  message: string
): { success: boolean; error?: string } {
  if (filesToAdd.length === 0) {
    return { success: false, error: 'No files to add' };
  }
  for (const file of filesToAdd) {
    const add = spawnSync('git', ['add', file], { cwd, encoding: 'utf-8', stdio: ['ignore', 'pipe', 'pipe'] });
    if (add.status !== 0) {
      return { success: false, error: add.stderr?.trim() || 'git add failed' };
    }
  }
  const commit = spawnSync('git', ['commit', '-m', message], { cwd, encoding: 'utf-8', stdio: ['ignore', 'pipe', 'pipe'] });
  if (commit.status !== 0) {
    return { success: false, error: commit.stderr?.trim() || 'git commit failed' };
  }
  return { success: true };
}

/**
 * Build commit message for a plan. shortDesc from objective or planId.
 */
export function planCommitMessage(phaseNum: number, planId: string, shortDesc: string): string {
  const desc = shortDesc.slice(0, 60).replace(/\n/g, ' ');
  return `gsd: phase ${phaseNum} plan ${planId} — ${desc}`;
}
