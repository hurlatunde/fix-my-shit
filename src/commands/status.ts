import fs from 'fs';
import path from 'path';
import chalk from 'chalk';
import { getPhaseBase } from '../phases.js';

interface ParsedState {
  phaseLine?: string;
  plansLine?: string;
  progressPercent?: string;
  lastActivity?: string;
  milestone?: string;
  milestoneName?: string;
}

function readIfExists(filePath: string): string | null {
  try {
    if (!fs.existsSync(filePath)) return null;
    return fs.readFileSync(filePath, 'utf-8');
  } catch {
    return null;
  }
}

function parseProjectTitle(projectMd: string | null): string | undefined {
  if (!projectMd) return;
  const match = projectMd.match(/^#\s+(.+)$/m);
  return match ? match[1].trim() : undefined;
}

function parseState(stateMd: string | null): ParsedState {
  const parsed: ParsedState = {};
  if (!stateMd) return parsed;

  // YAML-like frontmatter at top for milestone data.
  const frontmatterMatch = stateMd.match(/^---([\s\S]*?)---/);
  const frontmatter = frontmatterMatch ? frontmatterMatch[1] : '';

  const milestoneMatch = frontmatter.match(/milestone:\s*([^\n]+)/);
  if (milestoneMatch) parsed.milestone = milestoneMatch[1].trim();

  const milestoneNameMatch = frontmatter.match(/milestone_name:\s*([^\n]+)/);
  if (milestoneNameMatch) parsed.milestoneName = milestoneNameMatch[1].trim();

  const percentMatch = frontmatter.match(/percent:\s*(\d+)/);
  if (percentMatch) parsed.progressPercent = percentMatch[1];

  const phaseLineMatch = stateMd.match(/Phase:\s*([^\n]+)/);
  if (phaseLineMatch) parsed.phaseLine = phaseLineMatch[1].trim();

  const plansLineMatch = stateMd.match(/Plan:\s*([^\n]+)/);
  if (plansLineMatch) parsed.plansLine = plansLineMatch[1].trim();

  const lastActivityMatch = stateMd.match(/Last activity:\s*([^\n]+)/);
  if (lastActivityMatch) parsed.lastActivity = lastActivityMatch[1].trim();

  return parsed;
}

export async function runStatus(fmsRoot: string): Promise<void> {
  const base = getPhaseBase(fmsRoot);

  const projectPath = path.join(base, 'PROJECT.md');
  const roadmapPath = path.join(base, 'ROADMAP.md');
  const statePath = path.join(base, 'STATE.md');

  const projectMd = readIfExists(projectPath);
  const stateMd = readIfExists(statePath);
  // ROADMAP is currently not parsed for specifics; kept for future use.
  void readIfExists(roadmapPath);

  const projectTitle = parseProjectTitle(projectMd);
  const state = parseState(stateMd);

  const prefix = chalk.cyan('[fms]');

  if (!projectTitle && !state.phaseLine && !state.plansLine) {
    // Fallback: show root when no planning artifacts exist yet.
    // eslint-disable-next-line no-console
    console.log(prefix, `No PROJECT/ROADMAP/STATE found under ${base}.`);
    // eslint-disable-next-line no-console
    console.log(chalk.dim('Run `fms new-project` to initialize planning artifacts.'));
    return;
  }

  const projectLabel = projectTitle ?? state.milestoneName ?? 'Project';
  const milestoneLabel = state.milestone ? ` — Milestone ${state.milestone}` : '';

  // First line: project + milestone.
  // eslint-disable-next-line no-console
  console.log(prefix, `Project: ${projectLabel}${milestoneLabel}`);

  const parts: string[] = [];
  if (state.phaseLine) {
    parts.push(`Phase ${state.phaseLine}`);
  }
  if (state.plansLine) {
    parts.push(`Plans ${state.plansLine}`);
  }
  if (state.progressPercent) {
    parts.push(`Progress ${state.progressPercent}%`);
  }

  if (parts.length) {
    // eslint-disable-next-line no-console
    console.log(parts.join(' — '));
  }

  if (state.lastActivity) {
    // eslint-disable-next-line no-console
    console.log(chalk.dim(`Last activity: ${state.lastActivity}`));
  }
}

