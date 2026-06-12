import fs from 'fs';
import path from 'path';
import os from 'os';

import type { InstallTarget } from './runtime-paths.js';
import { getRuntimeDirName } from './runtime-paths.js';

export const CURSOR_NATIVE_MANIFEST = 'cursor-native-manifest.json';
const MANAGED_BY = 'fix-my-shit';

type CommandKind = 'workflow' | 'cli';

interface FmsCommandSpec {
  slug: string;
  title: string;
  kind: CommandKind;
  workflow?: string;
  subagents?: string;
  cli: string;
  description: string;
}

const FMS_COMMANDS: FmsCommandSpec[] = [
  {
    slug: 'map-codebase',
    title: 'Map Codebase',
    kind: 'workflow',
    workflow: 'map-codebase',
    subagents: 'fms-codebase-mapper',
    cli: 'map-codebase',
    description: 'Analyze the codebase with parallel mapper agents (9 documents).',
  },
  {
    slug: 'new-project',
    title: 'New Project',
    kind: 'workflow',
    workflow: 'new-project',
    cli: 'new-project',
    description: 'Bootstrap planning documents (questions, research, requirements, roadmap).',
  },
  {
    slug: 'discuss-phase',
    title: 'Discuss Phase',
    kind: 'workflow',
    workflow: 'discuss-phase',
    cli: 'discuss-phase <phase>',
    description: 'Clarify gray areas for a phase and write CONTEXT.md.',
  },
  {
    slug: 'plan-phase',
    title: 'Plan Phase',
    kind: 'workflow',
    workflow: 'plan-phase',
    subagents: 'fms-phase-researcher, fms-planner, fms-plan-checker',
    cli: 'plan-phase <phase>',
    description: 'Generate executable plans for a phase with research and verification.',
  },
  {
    slug: 'execute-phase',
    title: 'Execute Phase',
    kind: 'workflow',
    workflow: 'execute-phase',
    subagents: 'fms-executor',
    cli: 'execute-phase <phase>',
    description: 'Run all plans in a phase (wave-based execution).',
  },
  {
    slug: 'verify-work',
    title: 'Verify Work',
    kind: 'workflow',
    workflow: 'verify-work',
    subagents: 'fms-verifier, fms-debugger',
    cli: 'verify-work <phase>',
    description: 'Manually verify phase deliverables with interactive UAT.',
  },
  {
    slug: 'quick',
    title: 'Quick Task',
    kind: 'workflow',
    workflow: 'quick',
    subagents: 'fms-planner, fms-executor',
    cli: 'quick "task description"',
    description: 'Ad-hoc task with fms guarantees (atomic commits, state tracking).',
  },
  {
    slug: 'status',
    title: 'Status',
    kind: 'cli',
    cli: 'status',
    description: 'Show current project/phase state from the resolved fms root.',
  },
  {
    slug: 'config',
    title: 'Config',
    kind: 'cli',
    cli: 'config',
    description: 'Show or change install path preference (global vs local).',
  },
  {
    slug: 'help',
    title: 'Help',
    kind: 'cli',
    cli: 'help [command]',
    description: 'Display help for fms commands.',
  },
  {
    slug: 'install',
    title: 'Install',
    kind: 'cli',
    cli: 'install',
    description: 'Install or upgrade fms in the selected runtime(s).',
  },
  {
    slug: 'index-codebase',
    title: 'Index Codebase',
    kind: 'cli',
    cli: 'index-codebase',
    description: 'Build RAG index from codebase analysis documents.',
  },
  {
    slug: 'query',
    title: 'Query Codebase',
    kind: 'cli',
    cli: 'query "question"',
    description: 'Query the codebase RAG index by meaning.',
  },
  {
    slug: 'refresh-codebase',
    title: 'Refresh Codebase',
    kind: 'cli',
    cli: 'refresh-codebase',
    description: 'Detect drift and rebuild the RAG index.',
  },
  {
    slug: 'complete-phase',
    title: 'Complete Phase',
    kind: 'cli',
    cli: 'complete-phase',
    description: 'Mark the current phase as done.',
  },
  {
    slug: 'complete-milestone',
    title: 'Complete Milestone',
    kind: 'cli',
    cli: 'complete-milestone',
    description: 'Archive milestone and advance to the next.',
  },
];

export function getCursorDir(target: InstallTarget): string {
  const dirName = getRuntimeDirName(target.runtime);
  if (target.location === 'global') {
    return path.join(os.homedir(), dirName);
  }
  return path.join(process.cwd(), dirName);
}

function readManifest(fmsRoot: string): string[] {
  const manifestPath = path.join(fmsRoot, CURSOR_NATIVE_MANIFEST);
  if (!fs.existsSync(manifestPath)) return [];

  try {
    const parsed = JSON.parse(fs.readFileSync(manifestPath, 'utf-8')) as { files?: string[] };
    return parsed.files ?? [];
  } catch {
    return [];
  }
}

/**
 * Remove previously managed Cursor native files listed in the fms manifest.
 * Call before deleting the fms root on reinstall.
 */
export function cleanupCursorNativeIntegration(fmsRoot: string, target: InstallTarget): void {
  const cursorDir = getCursorDir(target);
  const managed = readManifest(fmsRoot);

  for (const rel of managed) {
    const full = path.join(cursorDir, rel);
    if (fs.existsSync(full)) {
      fs.rmSync(full, { force: true });
    }
  }

  removeEmptyManagedDirs(cursorDir, managed);
}

function removeEmptyManagedDirs(cursorDir: string, managed: string[]): void {
  const dirs = new Set<string>();
  for (const rel of managed) {
    const dir = path.dirname(rel);
    if (dir && dir !== '.') dirs.add(dir);
  }

  const sorted = [...dirs].sort((a, b) => b.length - a.length);
  for (const dir of sorted) {
    const full = path.join(cursorDir, dir);
    if (fs.existsSync(full) && fs.readdirSync(full).length === 0) {
      fs.rmSync(full, { recursive: true, force: true });
    }
  }
}

function tagAgentContent(content: string): string {
  if (!content.startsWith('---')) return content;
  const endIndex = content.indexOf('---', 3);
  if (endIndex === -1) return content;

  const frontmatter = content.substring(3, endIndex).trim();
  const body = content.substring(endIndex + 3);
  if (/^managed-by:/m.test(frontmatter)) {
    return content;
  }

  return `---\n${frontmatter}\nmanaged-by: ${MANAGED_BY}\n---${body}`;
}

function renderWorkflowCommand(spec: FmsCommandSpec, fmsRoot: string): string {
  const workflowPath = path.join(fmsRoot, 'workflows', `${spec.workflow}.md`);
  const subagentLine = spec.subagents
    ? `2. Use subagents from \`.cursor/agents/\` (${spec.subagents}).`
    : '2. Use subagents from `.cursor/agents/` when the workflow specifies them.';

  return `# FMS ${spec.title}

Run the fix-my-shit ${spec.slug} workflow.

1. Read \`${workflowPath}\` and follow it completely.
${subagentLine}
3. Use the user's arguments when provided (e.g. phase number, task description).

Alternative terminal command: \`fms ${spec.cli}\`

FMS root: ${fmsRoot}
`;
}

function renderCliCommand(spec: FmsCommandSpec): string {
  return `# FMS ${spec.title}

Run in the project terminal:

    fms ${spec.cli}

${spec.description}
`;
}

function renderOverviewSkill(fmsRoot: string): string {
  const commandList = FMS_COMMANDS.map((c) => `/fms-${c.slug}`).join(', ');

  return `---
name: fms
description: Fix My Shit phased workflow — map, plan, execute, verify. Use when user mentions fms or phased project management.
managed-by: ${MANAGED_BY}
---

# Fix My Shit (fms)

Structured phased project management: map → initialize → discuss → plan → execute → verify.

Entry commands: ${commandList}

FMS root: ${fmsRoot}

Read \`${path.join(fmsRoot, 'workflows/help.md')}\` for the full command list and workflow details.

Workflow-primary commands read \`${fmsRoot}/workflows/\` and spawn subagents from \`.cursor/agents/\`.
Utility commands run \`fms <command>\` in the terminal.
`;
}

function copyAgents(fmsRoot: string, cursorDir: string): string[] {
  const srcDir = path.join(fmsRoot, 'agents');
  const destDir = path.join(cursorDir, 'agents');
  fs.mkdirSync(destDir, { recursive: true });

  const written: string[] = [];
  if (!fs.existsSync(srcDir)) return written;

  for (const file of fs.readdirSync(srcDir)) {
    if (!file.startsWith('fms-') || !file.endsWith('.md')) continue;

    const content = tagAgentContent(fs.readFileSync(path.join(srcDir, file), 'utf-8'));
    fs.writeFileSync(path.join(destDir, file), content, 'utf-8');
    written.push(path.join('agents', file).replace(/\\/g, '/'));
  }

  return written;
}

function writeCommands(cursorDir: string, fmsRoot: string): string[] {
  const destDir = path.join(cursorDir, 'commands');
  fs.mkdirSync(destDir, { recursive: true });

  const written: string[] = [];
  for (const spec of FMS_COMMANDS) {
    const filename = `fms-${spec.slug}.md`;
    const content =
      spec.kind === 'workflow' ? renderWorkflowCommand(spec, fmsRoot) : renderCliCommand(spec);
    fs.writeFileSync(path.join(destDir, filename), content, 'utf-8');
    written.push(path.join('commands', filename).replace(/\\/g, '/'));
  }

  return written;
}

function writeOverviewSkill(cursorDir: string, fmsRoot: string): string[] {
  const skillDir = path.join(cursorDir, 'skills', 'fms');
  fs.mkdirSync(skillDir, { recursive: true });

  const rel = path.join('skills', 'fms', 'SKILL.md').replace(/\\/g, '/');
  fs.writeFileSync(path.join(skillDir, 'SKILL.md'), renderOverviewSkill(fmsRoot), 'utf-8');
  return [rel];
}

function writeCursorNativeManifest(fmsRoot: string, files: string[]): void {
  const manifest = {
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    managedBy: MANAGED_BY,
    files: files.sort(),
  };
  fs.writeFileSync(
    path.join(fmsRoot, CURSOR_NATIVE_MANIFEST),
    JSON.stringify(manifest, null, 2),
    'utf-8'
  );
}

export interface CursorNativeInstallResult {
  cursorDir: string;
  files: string[];
}

/**
 * Install Cursor-native integration: subagents, slash commands, and overview skill.
 * Assumes the fms bundle is already populated at target.root.
 */
export function installCursorNativeIntegration(target: InstallTarget): CursorNativeInstallResult {
  const { root: fmsRoot } = target;
  const cursorDir = getCursorDir(target);

  const files = [
    ...copyAgents(fmsRoot, cursorDir),
    ...writeCommands(cursorDir, fmsRoot),
    ...writeOverviewSkill(cursorDir, fmsRoot),
  ];

  writeCursorNativeManifest(fmsRoot, files);

  return { cursorDir, files };
}
