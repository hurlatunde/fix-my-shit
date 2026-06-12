import path from 'path';
import { fileURLToPath } from 'url';
import { describe, expect, it } from 'vitest';
import { chunkMarkdownByH2 } from './indexer.js';

const fixturesDir = path.join(path.dirname(fileURLToPath(import.meta.url)), '../../tests/fixtures');

describe('chunkMarkdownByH2', () => {
  it('splits markdown into sections with ids', () => {
    const filePath = path.join(fixturesDir, 'chunk-sample.md');
    const chunks = chunkMarkdownByH2(filePath);
    expect(chunks.length).toBeGreaterThanOrEqual(2);
    expect(chunks.map((c) => c.section)).toContain('First Section');
    expect(chunks.map((c) => c.section)).toContain('Second Section');
    expect(chunks[0].id).toMatch(/^chunk-sample\.md:/);
  });
});
