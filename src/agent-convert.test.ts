import { describe, expect, it } from 'vitest';
import { convertAgentMarkdownForRuntime, getCodexConfigMarker } from './agent-convert.js';

const sampleAgent = `---
name: fms-executor
description: Executes FMS plans
tools: Read, Write, Bash
---

# Executor

Do the work.
`;

describe('convertAgentMarkdownForRuntime', () => {
  it('converts for cursor with comma-separated tools', () => {
    const result = convertAgentMarkdownForRuntime(sampleAgent, 'cursor');
    expect(result.filename).toBe('fms-executor.md');
    expect(result.content).toContain('tools: Read, Write, Bash');
    expect(result.content).toContain('# Executor');
  });

  it('converts for gemini with YAML tool list', () => {
    const result = convertAgentMarkdownForRuntime(sampleAgent, 'gemini');
    expect(result.filename).toBe('fms-executor.md');
    expect(result.content).toContain('tools:');
    expect(result.content).toContain('- read_file');
  });

  it('converts for copilot with tools array', () => {
    const result = convertAgentMarkdownForRuntime(sampleAgent, 'copilot');
    expect(result.filename).toBe('fms-executor.agent.md');
    expect(result.content).toContain("tools: ['");
  });
});

describe('getCodexConfigMarker', () => {
  it('returns stable managed marker string', () => {
    expect(getCodexConfigMarker()).toBe(
      '# FMS Agent Configuration — managed by fix-my-shit installer'
    );
  });
});
