import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { describe, expect, it } from 'vitest';
import { compareVersions, getPackageVersion } from './version.js';

describe('getPackageVersion', () => {
  it('returns version from package.json', () => {
    const pkgPath = path.join(
      path.dirname(fileURLToPath(import.meta.url)),
      '..',
      '..',
      'package.json'
    );
    const expected = (JSON.parse(fs.readFileSync(pkgPath, 'utf-8')) as { version: string }).version;
    expect(getPackageVersion()).toBe(expected);
  });
});

describe('compareVersions', () => {
  it('orders patch releases', () => {
    expect(compareVersions('1.0.0', '1.0.1')).toBe(-1);
    expect(compareVersions('1.0.1', '1.0.0')).toBe(1);
  });

  it('treats equal versions as zero', () => {
    expect(compareVersions('2.3.4', '2.3.4')).toBe(0);
  });

  it('handles unequal segment lengths', () => {
    expect(compareVersions('1.0', '1.0.0')).toBe(0);
    expect(compareVersions('1.0.0', '1.1')).toBe(-1);
  });

  it('treats non-numeric segments as zero', () => {
    expect(compareVersions('1.0.0-beta', '1.0.0')).toBe(0);
  });
});
