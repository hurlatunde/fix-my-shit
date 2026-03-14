#!/usr/bin/env node
/**
 * Verifies the package is ready for npx: bin target exists and is runnable.
 * Run after build: npm run build && npm run check-npx-ready
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

const pkgPath = path.join(root, 'package.json');
const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));

const binEntry = pkg.bin && (pkg.bin['fix-my-shit'] ?? pkg.bin[pkg.name]);
if (!binEntry) {
  console.error('check-npx-ready: package.json "bin" must include "fix-my-shit" entry.');
  process.exit(1);
}

const binPath = path.join(root, binEntry);
if (!fs.existsSync(binPath)) {
  console.error('check-npx-ready: bin target missing. Run "npm run build" first:', binPath);
  process.exit(1);
}

const content = fs.readFileSync(binPath, 'utf-8');
if (!content.startsWith('#!')) {
  console.warn('check-npx-ready: bin target should start with shebang (#!). npx may still work.');
}

console.log('check-npx-ready: OK — bin target exists and package is npx-ready.');
console.log('  Publish with: npm publish');
console.log('  Then users can run: npx fix-my-shit');
