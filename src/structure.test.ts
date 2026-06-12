import path from 'path';
import { describe, expect, it } from 'vitest';
import { FMS_DIRS, FMS_FILES, getFmsStructure, getManifestPaths } from './structure.js';

describe('getFmsStructure', () => {
  it('returns expected dirs and files', () => {
    const { dirs, files } = getFmsStructure();
    expect(dirs).toEqual([...FMS_DIRS]);
    expect(files).toEqual([...FMS_FILES]);
    expect(dirs).toContain('phases');
    expect(files).toContain('VERSION');
  });
});

describe('getManifestPaths', () => {
  it('returns sorted relative paths', () => {
    const root = '/tmp/fms-root';
    const created = [
      path.join(root, 'phases'),
      path.join(root, 'VERSION'),
      path.join(root, 'hooks'),
    ];
    expect(getManifestPaths(root, created)).toEqual(['VERSION', 'hooks', 'phases']);
  });
});
