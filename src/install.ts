import fs from 'fs';
import path from 'path';
import os from 'os';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';
import chalk from 'chalk';
import inquirer from 'inquirer';
import { getFmsStructure } from './structure.js';
import {
  convertAgentMarkdownForRuntime,
  generateCodexAgentToml,
  listCoreAgentFiles,
  mergeCodexConfigToml,
} from './agent-convert.js';
import {
  type Runtime,
  type InstallTarget,
  type InstallCliOptions,
  type LocationChoice,
  RUNTIMES,
  parseInstallArgs,
  getFmsRoot,
  getGlobalRoot,
  getLocalRoot,
} from './runtime-paths.js';

const require = createRequire(import.meta.url);
const art = require('ascii-art');

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CORE_ROOT = path.join(__dirname, 'core');

const FMS_VERSION = '1.0.1';
const PATCHES_DIR_NAME = 'fms-local-patches';
const MANIFEST_NAME = 'fms-file-manifest.json';
const FMS_DESCRIPTION =
  'Structured workflow assistant for Cursor — phased project management and issue resolution by Hurlatunde.';

const FMS_ASCII_ART_FALLBACK = `
█████████  ██    ██   ███████
██         ████  ██   ██
█████      ██ ██ ██   ███████
██         ██  ████   ██
██         ██    ██   ███████
`.trim();

function formatDisplayRoot(root: string): string {
  const home = os.homedir();
  const cwd = process.cwd();

  if (root === home) {
    return '~';
  }

  if (root.startsWith(home + path.sep)) {
    return root.replace(home, '~');
  }

  if (root === cwd) {
    return '.';
  }

  if (root.startsWith(cwd + path.sep)) {
    return root.replace(cwd, '.');
  }

  return root;
}

async function renderFmsBanner(): Promise<string> {
  try {
    const rendered = await art.font('FMS', 'Doom');
    return typeof rendered === 'string' ? rendered : FMS_ASCII_ART_FALLBACK;
  } catch {
    return FMS_ASCII_ART_FALLBACK;
  }
}

async function promptLocation(runtime: Runtime): Promise<LocationChoice> {
  const globalRoot = formatDisplayRoot(getGlobalRoot(runtime));
  const localRoot = formatDisplayRoot(getLocalRoot(runtime));

  const { location } = await inquirer.prompt<{ location: LocationChoice }>([
    {
      type: 'list',
      name: 'location',
      message: 'Where would you like to install?',
      choices: [
        { name: `Global (${globalRoot}) - available in all projects`, value: 'global' },
        { name: `Local  (${localRoot}) - this project only`, value: 'local' },
      ],
      default: 'global',
    },
  ]);
  return location;
}

async function promptRuntime(): Promise<Runtime | 'all'> {
  const { runtime } = await inquirer.prompt<{ runtime: Runtime | 'all' }>([
    {
      type: 'list',
      name: 'runtime',
      message: 'Which runtime(s) would you like to install for?',
      choices: [
        { name: 'Cursor       (~/.cursor)', value: 'cursor' },
        { name: 'Claude Code  (~/.claude)', value: 'claude' },
        { name: 'OpenCode     (~/.config/opencode)', value: 'opencode' },
        { name: 'Gemini       (~/.gemini)', value: 'gemini' },
        { name: 'Codex        (~/.codex)', value: 'codex' },
        { name: 'Copilot      (~/.copilot)', value: 'copilot' },
        { name: 'Antigravity  (~/.gemini/antigravity)', value: 'antigravity' },
        { name: 'All supported runtimes', value: 'all' },
      ],
      default: 'cursor',
    },
  ]);

  return runtime;
}

/**
 * Resolve install targets from CLI options; prompt for runtime and location when not specified.
 */
export async function resolveInstallTargets(opts: InstallCliOptions = {}): Promise<InstallTarget[]> {
  const { runtimes: fromArgs, location: locationFromArgs } = parseInstallArgs(opts);

  let runtimes: Runtime[];
  if (fromArgs.length > 0) {
    runtimes = fromArgs;
  } else {
    const chosen = await promptRuntime();
    runtimes = chosen === 'all' ? [...RUNTIMES] : [chosen];
  }

  let location: LocationChoice;
  if (locationFromArgs !== null) {
    location = locationFromArgs;
  } else {
    location = await promptLocation(runtimes[0]);
  }

  return runtimes.map((runtime) => ({
    runtime,
    location,
    root: getFmsRoot(runtime, location),
  }));
}

function step(msg: string): void {
  console.log(chalk.green('  ✓'), msg);
}

const TEXT_EXTENSIONS = new Set(['.md', '.json', '.js', '.cjs', '.toml', '.txt']);

function isTextFile(name: string): boolean {
  return TEXT_EXTENSIONS.has(path.extname(name).toLowerCase());
}

/**
 * Recursively copy directory from src to dest, applying minimal templating for text files.
 * Replaces ${FMS_RUNTIME} and ${FMS_ROOT} with runtime and fmsRoot.
 */
function copyDir(
  src: string,
  dest: string,
  runtime: Runtime,
  fmsRoot: string
): void {
  if (!fs.existsSync(src)) return;
  fs.mkdirSync(dest, { recursive: true });

  const fmsRootNorm = fmsRoot.replace(/\\/g, '/');
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      copyDir(srcPath, destPath, runtime, fmsRoot);
    } else {
      if (isTextFile(entry.name)) {
        let content = fs.readFileSync(srcPath, 'utf-8');
        content = content.replace(/\$\{FMS_RUNTIME\}/g, runtime);
        content = content.replace(/\$\{FMS_ROOT\}/g, fmsRootNorm);
        fs.writeFileSync(destPath, content, 'utf-8');
      } else {
        fs.copyFileSync(srcPath, destPath);
      }
    }
  }
}

/**
 * Populate the fms root from the bundled core. Copies templates, workflows, references, agents, hooks
 * and ensures phases, quick, commands directories exist.
 */
function populateFmsRootForRuntime(target: InstallTarget, created: string[]): void {
  const { runtime, root } = target;

  if (!fs.existsSync(CORE_ROOT)) {
    throw new Error(`Core bundle not found at ${CORE_ROOT}; run npm run build`);
  }

  copyDir(path.join(CORE_ROOT, 'templates'), path.join(root, 'templates'), runtime, root);
  created.push(path.join(root, 'templates'));

  copyDir(path.join(CORE_ROOT, 'workflows'), path.join(root, 'workflows'), runtime, root);
  created.push(path.join(root, 'workflows'));

  copyDir(path.join(CORE_ROOT, 'references'), path.join(root, 'research'), runtime, root);
  created.push(path.join(root, 'research'));

  writeAgentsForRuntime(target);
  created.push(path.join(root, 'agents'));

  copyDir(path.join(CORE_ROOT, 'hooks'), path.join(root, 'hooks'), runtime, root);
  created.push(path.join(root, 'hooks'));

  for (const d of ['phases', 'quick', 'commands']) {
    const full = path.join(root, d);
    fs.mkdirSync(full, { recursive: true });
    created.push(full);
  }
}

function writeAgentsForRuntime(target: InstallTarget): void {
  const { runtime, root: fmsRoot } = target;
  const coreAgentsDir = path.join(CORE_ROOT, 'agents');
  const agentFiles = listCoreAgentFiles(coreAgentsDir);
  const outDir = path.join(fmsRoot, 'agents');
  fs.mkdirSync(outDir, { recursive: true });

  // Clean any existing generated agents to avoid stale files
  for (const entry of fs.readdirSync(outDir)) {
    if (entry.startsWith('fms-') && (entry.endsWith('.md') || entry.endsWith('.agent.md') || entry.endsWith('.toml'))) {
      fs.rmSync(path.join(outDir, entry), { force: true });
    }
  }

  const codexAgents: Array<{ name: string; description: string }> = [];

  for (const filePath of agentFiles) {
    const raw = fs.readFileSync(filePath, 'utf-8');
    const converted = convertAgentMarkdownForRuntime(raw, runtime);
    fs.writeFileSync(path.join(outDir, converted.filename), converted.content, 'utf-8');

    if (runtime === 'codex') {
      codexAgents.push({ name: converted.name, description: converted.description });
      const toml = generateCodexAgentToml(converted.name, converted.content);
      fs.writeFileSync(path.join(outDir, `${converted.name}.toml`), toml, 'utf-8');
    }
  }

  if (runtime === 'codex') {
    const configPath = path.join(fmsRoot, 'config.toml');
    const existing = fs.existsSync(configPath) ? fs.readFileSync(configPath, 'utf-8') : null;
    const merged = mergeCodexConfigToml(existing, codexAgents);
    fs.writeFileSync(configPath, merged, 'utf-8');
  }
}

function hashFile(fullPath: string): string {
  const buf = fs.readFileSync(fullPath);
  return crypto.createHash('sha256').update(buf).digest('hex');
}

/**
 * Recursively collect relative path -> sha256 for all files under root.
 * Skips fms-file-manifest.json and fms-local-patches/.
 */
function collectManifest(root: string): Record<string, string> {
  const result: Record<string, string> = {};

  function walk(dir: string): void {
    if (!fs.existsSync(dir)) return;
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      const rel = path.relative(root, full).replace(/\\/g, '/');
      if (entry.isDirectory()) {
        if (rel === PATCHES_DIR_NAME || rel.startsWith(PATCHES_DIR_NAME + '/')) continue;
        walk(full);
      } else {
        if (rel === MANIFEST_NAME) continue;
        result[rel] = hashFile(full);
      }
    }
  }

  walk(root);
  return result;
}

function writeManifest(fmsRoot: string): string {
  const files = collectManifest(fmsRoot);
  const manifest = {
    version: FMS_VERSION,
    timestamp: new Date().toISOString(),
    files,
  };
  const manifestPath = path.join(fmsRoot, MANIFEST_NAME);
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), 'utf-8');
  return manifestPath;
}

/**
 * If re-installing, backup any files that were modified since last install.
 * Returns list of modified file paths (relative to fmsRoot).
 */
function saveLocalPatches(fmsRoot: string): string[] {
  const manifestPath = path.join(fmsRoot, MANIFEST_NAME);
  if (!fs.existsSync(manifestPath)) return [];

  let prev: { version?: string; files?: Record<string, string> };
  try {
    prev = JSON.parse(fs.readFileSync(manifestPath, 'utf-8')) as {
      version?: string;
      files?: Record<string, string>;
    };
  } catch {
    return [];
  }

  const modified: string[] = [];
  const patchesRoot = path.join(fmsRoot, PATCHES_DIR_NAME);

  for (const [rel, oldHash] of Object.entries(prev.files ?? {})) {
    const full = path.join(fmsRoot, rel);
    if (!fs.existsSync(full)) continue;
    const currentHash = hashFile(full);
    if (currentHash !== oldHash) {
      const backup = path.join(patchesRoot, rel);
      fs.mkdirSync(path.dirname(backup), { recursive: true });
      fs.copyFileSync(full, backup);
      modified.push(rel);
    }
  }

  if (modified.length > 0) {
    const metaPath = path.join(patchesRoot, 'backup-meta.json');
    fs.writeFileSync(
      metaPath,
      JSON.stringify(
        { fromVersion: prev.version ?? 'unknown', files: modified, backedUpAt: new Date().toISOString() },
        null,
        2
      ),
      'utf-8'
    );
  }

  return modified;
}

export interface InstallResult {
  target: InstallTarget;
  modifiedBackedUp: string[];
}

/**
 * Install fms for a single runtime target. Backs up modified files if re-installing,
 * populates from core bundle, writes manifest. Returns summary for logging.
 */
export function installForRuntime(target: InstallTarget): InstallResult {
  const { runtime, location, root: fmsRoot } = target;
  const modifiedBackedUp: string[] = [];

  if (fs.existsSync(fmsRoot)) {
    modifiedBackedUp.push(...saveLocalPatches(fmsRoot));
    fs.rmSync(fmsRoot, { recursive: true, force: true });
  }

  const created: string[] = [];
  fs.mkdirSync(fmsRoot, { recursive: true });
  created.push(fmsRoot);

  populateFmsRootForRuntime(target, created);
  fs.writeFileSync(path.join(fmsRoot, 'VERSION'), FMS_VERSION + '\n', 'utf-8');
  fs.writeFileSync(
    path.join(fmsRoot, 'package.json'),
    JSON.stringify(
      { name: 'fms-config', private: true, description: 'fms install config' },
      null,
      2
    ),
    'utf-8'
  );
  writeManifest(fmsRoot);

  for (const dir of ['templates', 'workflows', 'agents', 'research', 'hooks']) {
    const full = path.join(fmsRoot, dir);
    if (fs.existsSync(full) && fs.readdirSync(full).length === 0) {
      console.log(chalk.yellow(`  Warning: ${dir}/ is empty after install`));
    }
  }

  // Runtime-specific agent validation
  const agentsDir = path.join(fmsRoot, 'agents');
  if (fs.existsSync(agentsDir)) {
    const entries = fs.readdirSync(agentsDir);
    const mdAgents = entries.filter((f) => f.startsWith('fms-') && f.endsWith('.md'));
    const copilotAgents = entries.filter((f) => f.startsWith('fms-') && f.endsWith('.agent.md'));
    const tomlAgents = entries.filter((f) => f.startsWith('fms-') && f.endsWith('.toml'));

    if (runtime === 'copilot') {
      if (copilotAgents.length === 0) {
        console.log(chalk.yellow('  Warning: no .agent.md agents generated for Copilot'));
      }
    } else if (runtime === 'codex') {
      const configPath = path.join(fmsRoot, 'config.toml');
      if (!fs.existsSync(configPath)) {
        console.log(chalk.yellow('  Warning: config.toml missing for Codex'));
      }
      if (tomlAgents.length === 0) {
        console.log(chalk.yellow('  Warning: no .toml agent configs generated for Codex'));
      }
      if (mdAgents.length === 0) {
        console.log(chalk.yellow('  Warning: no .md agent prompts generated for Codex'));
      }
    } else {
      if (mdAgents.length === 0) {
        console.log(chalk.yellow('  Warning: no .md agents generated'));
      }
    }
  } else {
    console.log(chalk.yellow('  Warning: agents/ directory missing after install'));
  }

  return { target, modifiedBackedUp };
}

export async function runInstall(opts: InstallCliOptions = {}): Promise<void> {
  const bannerArt = await renderFmsBanner();
  console.log('\n' + chalk.cyan(bannerArt) + '\n');
  console.log(chalk.cyan.bold('Fix My Shit') + chalk.gray(' v' + FMS_VERSION));
  console.log(chalk.gray(FMS_DESCRIPTION) + '\n');

  const targets = await resolveInstallTargets(opts);

  if (targets.length > 0) {
    const locationLabel = targets[0].location === 'global' ? 'Global' : 'Local';
    const runtimeLabels = targets.map((t) => t.runtime.charAt(0).toUpperCase() + t.runtime.slice(1)).join(', ');
    console.log(chalk.gray(`[selected: ${locationLabel} for ${runtimeLabels}]\n`));
  }

  for (const target of targets) {
    const { runtime, location, root: fmsRoot } = target;
    console.log(chalk.cyan(`\n  Installing for ${runtime} (${location}) at ${formatDisplayRoot(fmsRoot)}\n`));

    const result = installForRuntime(target);

    step('Populated templates, workflows, agents, hooks, research');
    step('Wrote VERSION (' + FMS_VERSION + ')');
    step('Wrote package.json');
    step('Wrote file manifest (fms-file-manifest.json)');
    step(`Finished ${runtime} (${location})`);

    if (result.modifiedBackedUp.length > 0) {
      console.log(
        chalk.yellow(
          `  Local changes backed up (${result.modifiedBackedUp.length} file(s)) in ${PATCHES_DIR_NAME}/`
        )
      );
    }
  }

  console.log('\nDone! Run /fms:help in Cursor to get started.\n');
}
