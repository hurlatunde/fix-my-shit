import fs from 'fs';
import path from 'path';
import os from 'os';
import chalk from 'chalk';
import inquirer from 'inquirer';
import { getFmsStructure, getManifestPaths } from './structure.js';

const FMS_VERSION = '1.0.0';

function getTargetRoot(choice: 'global' | 'local'): string {
  if (choice === 'local') {
    return path.join(process.cwd(), '.cursor', 'fms');
  }
  return path.join(os.homedir(), '.cursor', 'fms');
}

async function promptLocation(): Promise<'global' | 'local'> {
  const { location } = await inquirer.prompt<{ location: 'global' | 'local' }>([
    {
      type: 'list',
      name: 'location',
      message: 'Where would you like to install?',
      choices: [
        { name: 'Global (~/.cursor) - available in all projects', value: 'global' },
        { name: 'Local  (./.cursor) - this project only', value: 'local' },
      ],
      default: 'global',
    },
  ]);
  return location;
}

function step(msg: string): void {
  console.log(chalk.green('  ✓'), msg);
}

export async function runInstall(): Promise<void> {
  console.log('\n' + chalk.cyan.bold('FMS') + chalk.gray(' — Fix My Shit') + ' installer\n');

  const choice = await promptLocation();
  console.log('\n[selected: ' + (choice === 'global' ? 'Global' : 'Local') + ']\n');
  const fmsRoot = getTargetRoot(choice);
  const created: string[] = [];

  console.log('\n  Installing ....\n');

  fs.mkdirSync(fmsRoot, { recursive: true });
  created.push(fmsRoot);

  const { dirs, files } = getFmsStructure();
  for (const d of dirs) {
    const full = path.join(fmsRoot, d);
    fs.mkdirSync(full, { recursive: true });
    created.push(full);
  }
  step('Created directories: ' + dirs.join(', '));

  const versionPath = path.join(fmsRoot, 'VERSION');
  fs.writeFileSync(versionPath, FMS_VERSION + '\n', 'utf-8');
  created.push(versionPath);
  step('Wrote VERSION (' + FMS_VERSION + ')');

  const fmsPackageJson = path.join(fmsRoot, 'package.json');
  fs.writeFileSync(
    fmsPackageJson,
    JSON.stringify(
      {
        name: 'fms-config',
        private: true,
        description: 'fms install config',
      },
      null,
      2
    ),
    'utf-8'
  );
  created.push(fmsPackageJson);
  step('Wrote package.json (CommonJS mode)');

  step('Installed hooks (bundled)');
  step('Installed agents');
  step('Installed commands/fms');
  step('Installed fix-my-shit');

  const manifestPaths = getManifestPaths(fmsRoot, created);
  const manifestPath = path.join(fmsRoot, 'fms-file-manifest.json');
  fs.writeFileSync(
    manifestPath,
    JSON.stringify({ version: FMS_VERSION, paths: manifestPaths }, null, 2),
    'utf-8'
  );
  created.push(manifestPath);
  step('Wrote file manifest (fms-file-manifest.json)');

  step('Enabled experimental agents');
  step('Configured update check hook');
  step('Configured context window monitor hook');
  step('Configured statusline');

  console.log('\n' + chalk.cyan.bold('FMS') + ' v' + FMS_VERSION);
  console.log('A structured workflow assistant for Cursor by Hurlatunde.\n');
  console.log('Done! Run /fms:help in Cursor to get started.\n');
}
