import fs from 'fs';
import path from 'path';
import chalk from 'chalk';
import type { HookContext, HookStage } from './index.js';
import { getPhaseBase } from '../phases.js';
import { loadConfig } from '../config.js';

interface PhaseContext {
  currentPhase?: number;
  totalPhases?: number;
  plansCompleted?: number;
  totalPlansInPhase?: number;
}

function parseState(statePath: string): PhaseContext {
  try {
    const content = fs.readFileSync(statePath, 'utf-8');
    const result: PhaseContext = {};

    const phaseMatch = content.match(/Phase:\s*(\d+)\s+of\s+(\d+)/);
    if (phaseMatch) {
      result.currentPhase = parseInt(phaseMatch[1], 10);
      result.totalPhases = parseInt(phaseMatch[2], 10);
    }

    const planMatch = content.match(/Plan:\s*(\d+)\s+of\s+(\d+)\s+in current phase/);
    if (planMatch) {
      result.plansCompleted = parseInt(planMatch[1], 10);
      result.totalPlansInPhase = parseInt(planMatch[2], 10);
    }

    return result;
  } catch {
    return {};
  }
}

export async function runContextMonitorHook(stage: HookStage, ctx: HookContext): Promise<void> {
  // Only run before plan/execute operations.
  if (stage !== 'before') return;
  if (!['plan-phase', 'execute-phase'].includes(ctx.command)) return;

  const base = getPhaseBase(ctx.fmsRoot);
  const statePath = path.join(base, 'STATE.md');
  if (!fs.existsSync(statePath)) return;

  const phase = parseState(statePath);
  const config = loadConfig(ctx.fmsRoot);

  if (!phase.currentPhase || !phase.totalPhases || !phase.totalPlansInPhase) return;

  const remaining =
    phase.totalPlansInPhase - (phase.plansCompleted ?? 0);
  const parallel = config.parallelization || config.workflow?.auto_advance;

  if (remaining <= 0 && !parallel) return;

  const prefix = chalk.dim('[fms context]');

  const parts: string[] = [];
  parts.push(
    `You are in Phase ${phase.currentPhase} of ${phase.totalPhases} with ${phase.totalPlansInPhase} plan(s) total.`
  );
  if (remaining > 0) {
    parts.push(
      `${remaining} plan(s) remain in this phase. Keep each plan context-window sized for best agent performance.`
    );
  }
  if (parallel) {
    parts.push('Parallel execution is enabled; avoid cross-plan coupling to stay within context limits.');
  }

  // eslint-disable-next-line no-console
  console.log(prefix, parts.join(' '));
}

