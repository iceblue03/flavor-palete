import { describe, expect, it } from 'vitest';
import { TASTE_AXIS_ANCHORS } from '../../data/axisAnchors';
import { cosineSimilarity, scoreEmbeddingAgainstAxes } from './semanticTaste';

describe('semantic taste scoring', () => {
  it('calculates cosine similarity without depending on vector magnitude', () => {
    expect(cosineSimilarity([1, 0], [4, 0])).toBeCloseTo(1);
    expect(cosineSimilarity([1, 0], [0, 1])).toBeCloseTo(0);
  });

  it('maps relative anchor similarity to every taste axis', () => {
    const anchors = TASTE_AXIS_ANCHORS.map(() => ({
      positive: [1, 0],
      negative: [0, 1],
    }));
    const positiveScores = scoreEmbeddingAgainstAxes([1, 0], anchors);
    const neutralScores = scoreEmbeddingAgainstAxes([1, 1], anchors);

    for (const anchor of TASTE_AXIS_ANCHORS) {
      expect(positiveScores[anchor.axis]).toBeGreaterThan(95);
      expect(neutralScores[anchor.axis]).toBe(50);
    }
  });
});
