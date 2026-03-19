#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const coreSrc = path.join(root, 'core');
const distDir = path.join(root, 'dist');
const coreDest = path.join(distDir, 'core');
const hooksSrc = path.join(distDir, 'hooks');
const hooksDest = path.join(coreDest, 'hooks');

if (!fs.existsSync(coreSrc)) {
  console.error('core/ not found');
  process.exit(1);
}

if (!fs.existsSync(distDir)) {
  console.error('dist/ not found; run tsc first');
  process.exit(1);
}

// Copy core/ to dist/core/
fs.cpSync(coreSrc, coreDest, { recursive: true });

// Copy compiled hooks from dist/hooks to dist/core/hooks
if (fs.existsSync(hooksSrc)) {
  fs.mkdirSync(hooksDest, { recursive: true });
  for (const name of fs.readdirSync(hooksSrc)) {
    const src = path.join(hooksSrc, name);
    if (fs.statSync(src).isFile() && (name.endsWith('.js') || name.endsWith('.cjs'))) {
      fs.copyFileSync(src, path.join(hooksDest, name));
    }
  }
}

console.log('Copied core bundle to dist/core');
