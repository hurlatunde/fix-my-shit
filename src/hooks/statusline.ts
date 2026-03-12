import fs from 'fs';
import path from 'path';
import chalk from 'chalk';
import type { HookContext, HookStage } from './index.js';
import { getPhaseBase } from '../phases.js';

interface StatusInfo {
  milestone?: string;
  milestoneName?: string;
  phaseLine?: string;
  plansLine?: string;
  progressPercent?: string;
  lastActivity?: string;
}

function parseStatusInfo(statePath: string): StatusInfo {
  const info: StatusInfo = {};
  try {
    const content = fs.readFileSync(statePath, 'utf-8');
    const headerEnd = content.indexOf('---', 3);
    const header = headerEnd !== -1 ? content.slice(0, headerEnd) : content;

    const milestoneMatch = header.match(/milestone:\s*([^\n]+)/);
    if (milestoneMatch) info.milestone = milestoneMatch[1].trim();

    const milestoneNameMatch = header.match(/milestone_name:\s*([^\n]+)/);
    if (milestoneNameMatch) info.milestoneName = milestoneNameMatch[1].trim();

    const percentMatch = header.match(/percent:\s*(\d+)/);
    if (percentMatch) info.progressPercent = percentMatch[1];

    const phaseLineMatch = content.match(/Phase:\s*[^\n]+/);
    if (phaseLineMatch) info.phaseLine = phaseLineMatch[0].replace(/^Phase:\s*/, '').trim();

    const plansLineMatch = content.match(/Plan:\s*[^\n]+/);
    if (plansLineMatch) info.plansLine = plansLineMatch[0].replace(/^Plan:\s*/, '').trim();

    const lastActivityMatch = content.match(/Last activity:\s*([^\n]+)/);
    if (lastActivityMatch) info.lastActivity = lastActivityMatch[1].trim();
  } catch {
    // best-effort only
  }
  return info;
}

export async function runStatuslineHook(stage: HookStage, ctx: HookContext): Promise<void> {
  // Only run after major workflow commands.
  if (stage !== 'after') return;
  if (!['new-project', 'plan-phase', 'execute-phase', 'verify-work', 'quick'].includes(ctx.command)) return;

  const base = getPhaseBase(ctx.fmsRoot);
  const statePath = path.join(base, 'STATE.md');
  if (!fs.existsSync(statePath)) return;

  const info = parseStatusInfo(statePath);

  const parts: string[] = [];

  if (info.milestone || info.milestoneName) {
    const projectLabel = info.milestoneName ? `${info.milestoneName}` : 'Project';
    const milestoneLabel = info.milestone ? `Milestone ${info.milestone}` : '';
    parts.push(`${projectLabel}${milestoneLabel ? ` — ${milestoneLabel}` : ''}`);
  }

  if (info.phaseLine) {
    parts.push(`Phase ${info.phaseLine}`);
  }

  if (info.plansLine) {
    // Ensure this stays compact (e.g. "Plans 0 of 2 in current phase").
    parts.push(`Plans ${info.plansLine}`);
  }

  if (info.progressPercent) {
    parts.push(`Progress ${info.progressPercent}%`);
  }

  const prefix = chalk.cyan('[fms]');
  const line = parts.length ? parts.join(' — ') : `Command "${ctx.command}" completed.`;

  // eslint-disable-next-line no-console
  console.log(prefix, line);

  if (info.lastActivity) {
    const secondary = chalk.dim(`Last activity: ${info.lastActivity}`);
    // eslint-disable-next-line no-console
    console.log(secondary);
  }
}

