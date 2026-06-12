import { describe, expect, it } from 'vitest';
import { RUNTIMES, parseInstallArgs } from './runtime-paths.js';

describe('parseInstallArgs', () => {
  it('selects all runtimes when all flag is set', () => {
    const { runtimes, location } = parseInstallArgs({ all: true });
    expect(runtimes).toEqual(RUNTIMES);
    expect(location).toBeNull();
  });

  it('selects individual runtime flags', () => {
    const { runtimes } = parseInstallArgs({ cursor: true, codex: true });
    expect(runtimes).toEqual(['cursor', 'codex']);
  });

  it('parses global and local location', () => {
    expect(parseInstallArgs({ global: true }).location).toBe('global');
    expect(parseInstallArgs({ local: true }).location).toBe('local');
  });

  it('returns empty runtimes when no flags', () => {
    expect(parseInstallArgs({}).runtimes).toEqual([]);
  });
});
