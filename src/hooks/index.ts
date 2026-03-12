import chalk from 'chalk';
import { resolveFmsRoot } from '../path-resolver.js';

export type HookStage = 'before' | 'after';

export interface HookContext {
  /**
   * Effective fms root (local .cursor/fms or global ~/.cursor/fms).
   */
  fmsRoot: string;
  /**
   * Logical command name (e.g. "new-project", "execute-phase").
   */
  command: string;
  /**
   * Phase number when applicable (e.g. execute-phase 4).
   */
  phase?: number;
  /**
   * Optional arguments bag for future hooks.
   */
  args?: unknown;
}

/**
 * Lightweight debug logger for hook failures.
 */
function logHookError(hookName: string, stage: HookStage, err: unknown): void {
  const prefix = chalk.dim('[fms:hook]');
  const message =
    err instanceof Error ? `${err.name}: ${err.message}` : typeof err === 'string' ? err : 'Unknown error';
  // Hooks must never break primary command flows; log and continue.
  console.warn(prefix, `Hook "${hookName}" (${stage}) failed:`, message);
}

/**
 * Shared registry of built-in hooks. Additional hooks can be added here in the future.
 *
 * Each hook receives the stage and context and returns a Promise<void>.
 * Implementations are responsible for being resilient and non-throwing; any
 * uncaught errors are handled by runLifecycleHooks.
 */
type HookFn = (stage: HookStage, ctx: HookContext) => Promise<void> | void;

const builtInHooks: Record<string, HookFn> = {
  // Implemented in dedicated modules (06-01 Tasks 2–3).
  async 'update-check'(stage, ctx) {
    const { runUpdateCheckHook } = await import('./update-check.js');
    await runUpdateCheckHook(stage, ctx);
  },
  async 'context-monitor'(stage, ctx) {
    const { runContextMonitorHook } = await import('./context-monitor.js');
    await runContextMonitorHook(stage, ctx);
  },
  async statusline(stage, ctx) {
    const { runStatuslineHook } = await import('./statusline.js');
    await runStatuslineHook(stage, ctx);
  },
};

export async function runLifecycleHooks(stage: HookStage, ctx: HookContext): Promise<void> {
  const root = ctx.fmsRoot ?? resolveFmsRoot();
  const effectiveCtx: HookContext = { ...ctx, fmsRoot: root };

  const entries = Object.entries(builtInHooks);
  if (!entries.length) return;

  await Promise.all(
    entries.map(async ([name, hook]) => {
      try {
        await hook(stage, effectiveCtx);
      } catch (err) {
        logHookError(name, stage, err);
      }
    })
  );
}

export async function withHooks<T>(
  ctx: HookContext,
  run: () => Promise<T>
): Promise<T> {
  await runLifecycleHooks('before', ctx);
  try {
    return await run();
  } finally {
    await runLifecycleHooks('after', ctx);
  }
}

