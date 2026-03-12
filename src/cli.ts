#!/usr/bin/env node
import { Command } from 'commander';
import { resolveFmsRoot, readPrefs, writePrefs } from './path-resolver.js';
import { loadConfig } from './config.js';
import { runInstall } from './install.js';
import { runNewProject } from './commands/new-project.js';
import { runDiscussPhase } from './commands/discuss-phase.js';
import { runPlanPhase } from './commands/plan-phase.js';
import { runExecutePhase } from './commands/execute-phase.js';
import { runVerifyWork } from './commands/verify-work.js';
import { runCompletePhase, runCompleteMilestone } from './commands/complete-phase.js';
import { runQuick } from './commands/quick.js';
import { withHooks } from './hooks/index.js';

const program = new Command();

program
  .name('fix-my-shit')
  .description('Structured workflow assistant for Cursor — phased project management')
  .version('1.0.0');

program
  .command('install')
  .description('Install fms to .cursor/fms (local or global)')
  .action(async () => {
    await runInstall();
  });

program
  .command('new-project')
  .description('Start a new project/feature (questions → research → requirements → roadmap)')
  .option('--prd <path>', 'Use PRD/spec file instead of questioning')
  .action(async (opts: { prd?: string }) => {
    const root = resolveFmsRoot();
    await withHooks(
      { fmsRoot: root, command: 'new-project' },
      async () => runNewProject(root, opts.prd ? { prdPath: opts.prd } : undefined)
    );
  });

program
  .command('discuss-phase <phase>')
  .description('Clarify gray areas for a phase and write CONTEXT.md')
  .action(async (phase: string) => {
    const root = resolveFmsRoot();
    const phaseNum = parseInt(phase, 10);
    await withHooks({ fmsRoot: root, command: 'discuss-phase', phase: phaseNum }, async () =>
      runDiscussPhase(root, phaseNum)
    );
  });

program
  .command('plan-phase <phase>')
  .description('Generate executable plans for a phase')
  .action(async (phase: string) => {
    const root = resolveFmsRoot();
    const phaseNum = parseInt(phase, 10);
    await withHooks({ fmsRoot: root, command: 'plan-phase', phase: phaseNum }, async () =>
      runPlanPhase(root, phaseNum)
    );
  });

program
  .command('execute-phase <phase>')
  .description('Run all plans in a phase (wave-based)')
  .action(async (phase: string) => {
    const root = resolveFmsRoot();
    const phaseNum = parseInt(phase, 10);
    await withHooks({ fmsRoot: root, command: 'execute-phase', phase: phaseNum }, async () =>
      runExecutePhase(root, phaseNum)
    );
  });

program
  .command('verify-work <phase>')
  .description('Manually verify phase deliverables')
  .action(async (phase: string) => {
    const root = resolveFmsRoot();
    const phaseNum = parseInt(phase, 10);
    await withHooks({ fmsRoot: root, command: 'verify-work', phase: phaseNum }, async () =>
      runVerifyWork(root, phaseNum)
    );
  });

program
  .command('complete-phase')
  .description('Mark current phase as done')
  .action(() => {
    const root = resolveFmsRoot();
    void withHooks({ fmsRoot: root, command: 'complete-phase' }, async () => {
      runCompletePhase(root);
    });
  });

program
  .command('complete-milestone')
  .description('Mark milestone complete and advance to next')
  .action(() => {
    const root = resolveFmsRoot();
    void withHooks({ fmsRoot: root, command: 'complete-milestone' }, async () => {
      runCompleteMilestone(root);
    });
  });

program
  .command('quick [task...]')
  .description('Quick ad-hoc task (bug fix, small feature)')
  .action(async (taskParts?: string[]) => {
    const task = taskParts?.length ? taskParts.join(' ').trim() : undefined;
    const root = resolveFmsRoot();
    await withHooks({ fmsRoot: root, command: 'quick', args: { task } }, async () =>
      runQuick(root, task)
    );
  });

program
  .command('status')
  .description('Show current project/phase state')
  .action(() => {
    const root = resolveFmsRoot();
    const config = loadConfig(root);
    console.log('fms root:', root);
    console.log('config:', JSON.stringify(config, null, 2));
  });

program
  .command('config')
  .description('Show or change installation path (--set-global, --set-local)')
  .option('--set-global', 'Use global ~/.cursor/fms')
  .option('--set-local', 'Use local ./.cursor/fms')
  .action((opts: { setGlobal?: boolean; setLocal?: boolean }) => {
    if (opts.setGlobal) {
      writePrefs('global');
      console.log('Preference set to global (~/.cursor/fms).');
    } else if (opts.setLocal) {
      writePrefs('local');
      console.log('Preference set to local (./.cursor/fms).');
    } else {
      const root = resolveFmsRoot();
      const prefs = readPrefs();
      const preference = prefs.prefer ?? 'default (local in cwd first, else global)';
      console.log('Current path:', root);
      console.log('Preference:', preference);
    }
  });

program
  .command('help [cmd]')
  .description('Display help for a command')
  .action((cmd?: string) => {
    if (cmd) {
      const c = program.commands.find((c) => c.name() === cmd);
      if (c) c.outputHelp();
      else console.log(`Unknown command: ${cmd}`);
    } else {
      program.outputHelp();
    }
  });

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  if (args.length === 0) {
    await runInstall();
    return;
  }
  program.parse();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
