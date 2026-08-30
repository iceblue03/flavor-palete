import {
  TasteConfidenceIntervals,
  TasteDNAScores,
} from '../../types';

export const TASTE_AXES = [
  'emotional',
  'stimulation',
  'depth',
  'plotDensity',
  'indieGem',
  'worldbuilding',
] as const satisfies readonly (keyof TasteDNAScores)[];

export interface WeightedTasteSample {
  scores: TasteDNAScores;
  weight?: number;
  /** 같은 출처 안에서 표본 수를 유지하며 재표집하기 위한 층 */
  group?: string;
}

export function mulberry32(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state += 0x6d2b79f5;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

function emptyScores(): TasteDNAScores {
  return {
    emotional: 0,
    stimulation: 0,
    depth: 0,
    plotDensity: 0,
    indieGem: 0,
    worldbuilding: 0,
  };
}

export function weightedMean(samples: WeightedTasteSample[]): TasteDNAScores {
  if (samples.length === 0) {
    return {
      emotional: 50,
      stimulation: 50,
      depth: 50,
      plotDensity: 50,
      indieGem: 50,
      worldbuilding: 50,
    };
  }

  const total = emptyScores();
  let weightSum = 0;
  for (const sample of samples) {
    const weight = Math.max(0, sample.weight ?? 1);
    for (const axis of TASTE_AXES) total[axis] += sample.scores[axis] * weight;
    weightSum += weight;
  }
  if (weightSum === 0) return weightedMean(samples.map(sample => ({ ...sample, weight: 1 })));
  for (const axis of TASTE_AXES) total[axis] = total[axis] / weightSum;
  return total;
}

function groupedWeightedMean(samples: WeightedTasteSample[]): TasteDNAScores {
  const groupNames = [...new Set(samples.map(sample => sample.group ?? 'all'))];
  if (groupNames.length <= 1) return weightedMean(samples);
  const groupMeans: WeightedTasteSample[] = groupNames.map(groupName => {
    const group = samples.filter(sample => (sample.group ?? 'all') === groupName);
    const scores = weightedMean(group);
    for (const axis of TASTE_AXES) scores[axis] = Math.max(0, Math.min(100, scores[axis]));
    return {
      scores,
      weight: group.reduce((sum, sample) => sum + Math.max(0, sample.weight ?? 1), 0),
    };
  });
  return weightedMean(groupMeans);
}

function percentile(sorted: number[], probability: number): number {
  if (sorted.length === 0) return 50;
  const index = (sorted.length - 1) * probability;
  const lower = Math.floor(index);
  const fraction = index - lower;
  return sorted[lower + 1] === undefined
    ? sorted[lower]
    : sorted[lower] + fraction * (sorted[lower + 1] - sorted[lower]);
}

export function bootstrapCI(
  samples: WeightedTasteSample[],
  iterations = 200,
  seed = 1020,
): TasteConfidenceIntervals {
  const distributions: Record<keyof TasteDNAScores, number[]> = {
    emotional: [],
    stimulation: [],
    depth: [],
    plotDensity: [],
    indieGem: [],
    worldbuilding: [],
  };

  if (samples.length === 0) {
    return Object.fromEntries(TASTE_AXES.map(axis => [axis, { lower: 50, upper: 50 }])) as TasteConfidenceIntervals;
  }

  const random = mulberry32(seed);
  const groups = [...new Set(samples.map(sample => sample.group ?? 'all'))]
    .map(group => samples.filter(sample => (sample.group ?? 'all') === group));
  for (let iteration = 0; iteration < Math.max(1, iterations); iteration += 1) {
    const resample = groups.flatMap(group => Array.from(
      { length: group.length },
      () => group[Math.floor(random() * group.length)],
    ));
    const mean = groupedWeightedMean(resample);
    for (const axis of TASTE_AXES) distributions[axis].push(Math.max(0, Math.min(100, mean[axis])));
  }

  return Object.fromEntries(TASTE_AXES.map(axis => {
    const values = distributions[axis].sort((a, b) => a - b);
    return [axis, {
      lower: Math.round(percentile(values, 0.025)),
      upper: Math.round(percentile(values, 0.975)),
    }];
  })) as TasteConfidenceIntervals;
}

export function pearsonCorrelation(a: number[], b: number[]): number {
  if (a.length !== b.length || a.length < 2) return 0;
  const meanA = a.reduce((sum, value) => sum + value, 0) / a.length;
  const meanB = b.reduce((sum, value) => sum + value, 0) / b.length;
  let numerator = 0;
  let varianceA = 0;
  let varianceB = 0;
  for (let index = 0; index < a.length; index += 1) {
    const deltaA = a[index] - meanA;
    const deltaB = b[index] - meanB;
    numerator += deltaA * deltaB;
    varianceA += deltaA ** 2;
    varianceB += deltaB ** 2;
  }
  const denominator = Math.sqrt(varianceA * varianceB);
  if (denominator === 0) return 0;
  return Math.max(-1, Math.min(1, numerator / denominator));
}

export function splitHalfReliability(
  samples: WeightedTasteSample[],
  seed = 1020,
): number {
  if (samples.length < 4) return 0;
  const random = mulberry32(seed);
  const leftSamples: WeightedTasteSample[] = [];
  const rightSamples: WeightedTasteSample[] = [];
  const groupNames = [...new Set(samples.map(sample => sample.group ?? 'all'))];
  for (const groupName of groupNames) {
    const shuffled = samples.filter(sample => (sample.group ?? 'all') === groupName);
    for (let index = shuffled.length - 1; index > 0; index -= 1) {
      const swapIndex = Math.floor(random() * (index + 1));
      [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
    }
    if (shuffled.length === 1) {
      leftSamples.push(shuffled[0]);
      rightSamples.push(shuffled[0]);
      continue;
    }
    const midpoint = Math.floor(shuffled.length / 2);
    leftSamples.push(...shuffled.slice(0, midpoint));
    rightSamples.push(...shuffled.slice(midpoint));
  }
  const left = groupedWeightedMean(leftSamples);
  const right = groupedWeightedMean(rightSamples);
  return pearsonCorrelation(
    TASTE_AXES.map(axis => left[axis]),
    TASTE_AXES.map(axis => right[axis]),
  );
}

export function cohensD(userScore: number, populationMean: number, populationSd: number): number {
  return populationSd > 0 ? (userScore - populationMean) / populationSd : 0;
}

export function normalPercentileFromD(effectSize: number): number {
  const sign = effectSize < 0 ? -1 : 1;
  const x = Math.abs(effectSize) / Math.sqrt(2);
  const t = 1 / (1 + 0.3275911 * x);
  const erf = sign * (1 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-x * x));
  return Math.round(50 * (1 + erf));
}

export function statisticalConfidence(
  reliability: number,
  intervals: TasteConfidenceIntervals,
  sampleCount: number,
): number {
  if (sampleCount === 0) return 0;
  const reliabilityScore = Math.max(0, reliability) * 50;
  const averageWidth = TASTE_AXES.reduce(
    (sum, axis) => sum + (intervals[axis].upper - intervals[axis].lower),
    0,
  ) / TASTE_AXES.length;
  const precisionScore = Math.max(0, 1 - averageWidth / 100) * 30;
  const sampleScore = Math.min(1, sampleCount / 40) * 20;
  return Math.round(Math.min(100, reliabilityScore + precisionScore + sampleScore));
}
