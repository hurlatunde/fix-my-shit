import { describe, expect, it } from 'vitest';
import { cosineSimilarity } from './embedder.js';

describe('cosineSimilarity', () => {
  it('returns 1 for identical vectors', () => {
    expect(cosineSimilarity([1, 0, 0], [1, 0, 0])).toBeCloseTo(1);
  });

  it('returns 0 for orthogonal vectors', () => {
    expect(cosineSimilarity([1, 0], [0, 1])).toBeCloseTo(0);
  });

  it('returns NaN for zero vectors', () => {
    expect(Number.isNaN(cosineSimilarity([0, 0], [1, 1]))).toBe(true);
  });
});
