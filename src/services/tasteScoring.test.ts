import { describe, expect, it } from 'vitest';
import { PlatformActivityItem, PlatformConnection } from '../types';
import { computeTasteScore } from './tasteScoring';

const GOLDEN_ITEMS: PlatformActivityItem[] = Array.from({ length: 20 }, (_, index) => ({
  id: `golden-${index}`,
  title: index % 2 === 0
    ? `철학과 인문 다큐 리뷰 ${index}`
    : `SF 판타지 세계관 분석 ${index}`,
  subtitle: index % 3 === 0 ? 'PDF' : 'Golden channel',
}));

const YOUTUBE_SOURCE: PlatformConnection = {
  id: 'youtube',
  name: 'YouTube',
  iconName: 'Youtube',
  category: '영상',
  color: '#f00',
  kind: 'oauth',
  connected: true,
  itemCount: GOLDEN_ITEMS.length,
  previewItems: GOLDEN_ITEMS,
  description: '합성 골든 데이터',
};

describe('computeTasteScore regression', () => {
  it('reproduces the same score, reliability, and bootstrap interval', () => {
    const input = {
      onboarding: { completed: false, answers: {} },
      watchedWorks: [],
      platforms: [YOUTUBE_SOURCE],
    };
    const first = computeTasteScore(input);
    const second = computeTasteScore(input);

    expect(first).toEqual(second);
    expect(first.totalAnalyzed).toBe(20);
    expect(first.finalScores.depth).toBeGreaterThan(70);
    expect(first.confidenceIntervals?.depth.lower).toBeLessThanOrEqual(first.finalScores.depth);
    expect(first.confidenceIntervals?.depth.upper).toBeGreaterThanOrEqual(first.finalScores.depth);
    expect(first.splitHalfReliability).toBeGreaterThan(0.8);
  });

  it('uses semantic item scores as the primary platform signal', () => {
    const semanticScores = {
      emotional: 20,
      stimulation: 95,
      depth: 55,
      plotDensity: 92,
      indieGem: 40,
      worldbuilding: 75,
    };
    const result = computeTasteScore({
      onboarding: { completed: false, answers: {} },
      watchedWorks: [],
      platforms: [YOUTUBE_SOURCE],
      semanticByPlatform: {
        youtube: {
          scores: semanticScores,
          itemScores: Object.fromEntries(GOLDEN_ITEMS.map(item => [item.id, semanticScores])),
          model: 'test/free-embedding',
        },
      },
    });

    expect(result.analysisEngine).toBe('semantic-embedding');
    expect(result.semanticModel).toBe('test/free-embedding');
    expect(result.finalScores.stimulation).toBeGreaterThan(85);
    expect(result.finalScores.plotDensity).toBeGreaterThan(80);
  });
});
