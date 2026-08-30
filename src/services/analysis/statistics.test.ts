import { describe, expect, it } from 'vitest';
import {
  bootstrapCI,
  cohensD,
  mulberry32,
  normalPercentileFromD,
  pearsonCorrelation,
  splitHalfReliability,
  statisticalConfidence,
  WeightedTasteSample,
} from './statistics';

const sample = (base: number): WeightedTasteSample => ({
  scores: {
    emotional: base,
    stimulation: 100 - base,
    depth: base + 5,
    plotDensity: 90 - base,
    indieGem: base + 10,
    worldbuilding: 80 - base,
  },
});

describe('statistics', () => {
  it('uses a reproducible seeded PRNG', () => {
    const first = mulberry32(1020);
    const second = mulberry32(1020);
    expect(Array.from({ length: 5 }, first)).toEqual(Array.from({ length: 5 }, second));
  });

  it('produces deterministic 95% bootstrap intervals', () => {
    const samples = [sample(30), sample(40), sample(50), sample(60), sample(70)];
    const first = bootstrapCI(samples, 200, 7);
    const second = bootstrapCI(samples, 200, 7);
    expect(first).toEqual(second);
    expect(first.emotional.lower).toBeLessThan(first.emotional.upper);
    expect(first.emotional.lower).toBeGreaterThanOrEqual(30);
    expect(first.emotional.upper).toBeLessThanOrEqual(70);
  });

  it('calculates split-half reliability from a seeded 50/50 split', () => {
    const samples = Array.from({ length: 20 }, (_, index) => sample(30 + index));
    const reliability = splitHalfReliability(samples, 42);
    expect(reliability).toBeGreaterThan(0.9);
    expect(splitHalfReliability(samples, 42)).toBe(reliability);
  });

  it('handles Pearson correlation and effect-size percentile helpers', () => {
    expect(pearsonCorrelation([1, 2, 3], [2, 4, 6])).toBeCloseTo(1);
    expect(cohensD(70, 50, 10)).toBe(2);
    expect(normalPercentileFromD(0)).toBe(50);
    expect(normalPercentileFromD(1)).toBe(84);
  });

  it('raises confidence when intervals narrow and the sample grows', () => {
    const small = [sample(30), sample(70), sample(35), sample(65)];
    const large = Array.from({ length: 50 }, (_, index) => sample(49 + (index % 3)));
    const smallCi = bootstrapCI(small, 200, 1);
    const largeCi = bootstrapCI(large, 200, 1);
    expect(statisticalConfidence(0.9, largeCi, large.length))
      .toBeGreaterThan(statisticalConfidence(0.9, smallCi, small.length));
  });
});
