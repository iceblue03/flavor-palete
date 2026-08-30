import { describe, expect, it } from 'vitest';
import { ConsumedWork, StoredAppData } from '../types';
import { DEFAULT_ARCHETYPE } from '../data/archetypesData';
import { ALL_MEDIA_ITEMS } from '../data/contentsData';
import {
  INITIAL_PLATFORMS,
  INITIAL_WATCHED_WORKS,
  removeLegacySeedWatchedWorks,
  restoreStoredAppData,
} from './firebaseStore';

const userWork: ConsumedWork = {
  id: 'work-user-owned',
  mediaItemId: 'book-custom',
  title: '사용자가 직접 추가한 책',
  category: 'book',
  creator: '작가',
  coverUrl: '',
  userRating: 5,
  reviewedAt: '2026-08-30',
  tags: [],
};

describe('initial and migrated taste data', () => {
  it('does not seed fake watched works for a new user', () => {
    expect(INITIAL_WATCHED_WORKS).toEqual([]);
  });

  it('removes only known legacy demo records and preserves user records', () => {
    const legacy = { ...userWork, id: 'watched-01' };
    expect(removeLegacySeedWatchedWorks([legacy, userWork])).toEqual([userWork]);
  });

  it('restores a Google-linked Firestore profile without inventing raw platform data', () => {
    const local: StoredAppData = {
      userIdentifier: 'local-new-device',
      userType: DEFAULT_ARCHETYPE,
      watchedWorks: [],
      recommendedWorks: ALL_MEDIA_ITEMS.slice(0, 2),
      likedWorkIds: [],
      syncStatus: {},
      platformConnections: INITIAL_PLATFORMS,
      onboarding: { completed: false, answers: {} },
      welcomeDismissed: false,
    };
    const restored = restoreStoredAppData(local, {
      localIdentifier: 'cloud-user',
      userType: { id: 'dopamine-suspense', trendResistanceScore: 64 },
      watchedWorks: [{ ...userWork, coverUrl: undefined }],
      likedWorkIds: ['movie-01'],
      recommendedWorkIds: ['movie-01'],
      onboarding: { completed: true, answers: { q1: 'b' } },
      scoreBreakdown: {
        finalScores: DEFAULT_ARCHETYPE.dnaScores,
        totalAnalyzed: 25,
        confidence: 72,
        analysisEngine: 'semantic-embedding',
        semanticModel: 'test/free',
        sources: [{
          id: 'youtube', weight: 2, analyzedCount: 25, matchedCount: 25,
          scores: DEFAULT_ARCHETYPE.dnaScores,
        }],
      },
    });

    expect(restored.userIdentifier).toBe('cloud-user');
    expect(restored.userType.id).toBe('dopamine-suspense');
    expect(restored.watchedWorks[0].title).toBe(userWork.title);
    expect(restored.onboarding.scores).toBeDefined();
    expect(restored.scoreBreakdown?.semanticModel).toBe('test/free');
    expect(restored.platformConnections.every(platform => !platform.connected)).toBe(true);
    expect(restored.platformConnections.every(platform => platform.previewItems.length === 0)).toBe(true);
  });
});
