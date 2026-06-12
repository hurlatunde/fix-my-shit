import { describe, expect, it } from 'vitest';
import { planCommitMessage } from './git-commit.js';

describe('planCommitMessage', () => {
  it('builds fms-prefixed message with truncated description', () => {
    const msg = planCommitMessage(2, '02-03', 'Short objective');
    expect(msg).toBe('fms: phase 2 plan 02-03 — Short objective');
  });

  it('strips newlines and truncates long descriptions', () => {
    const long = 'a'.repeat(80);
    const msg = planCommitMessage(1, '01-01', `line1\nline2\n${long}`);
    expect(msg).toMatch(/^fms: phase 1 plan 01-01 — /);
    expect(msg).not.toContain('\n');
    expect(msg.length).toBeLessThanOrEqual('fms: phase 1 plan 01-01 — '.length + 60);
  });
});
