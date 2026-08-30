import { ConsumedWork, OnboardingResult, PlatformConnection, StoredAppData, TasteScoreBreakdown } from '../types';
import { DEFAULT_ARCHETYPE, TASTE_ARCHETYPES } from '../data/archetypesData';
import { ALL_MEDIA_ITEMS } from '../data/contentsData';
import { scoreOnboardingAnswers } from '../data/onboardingQuestions';
import { ensureAnonymousSignIn, getCurrentUid, isFirebaseConfigured, writeUserDoc } from './firebaseClient';

/**
 * ============================================================================
 * [취향팔레트 - 데이터 저장소 & Firebase Firestore / Auth 연동]
 * ============================================================================
 * 저장 데이터:
 * 1. 사용자 식별자 (Firebase Auth 익명 uid)
 * 2. 사용자 유형 (User Archetype & Taste DNA)
 * 3. 시청/열람 작품 (사용자가 직접 등록한 감상 기록)
 * 4. 추천 작품 (협업 필터링 결과) / 성향 분석 점수
 *
 * ★ 저장 정책 ★
 * - 회원 정보와 '추출된 분석 결과'만 Firestore에 저장합니다.
 * - YouTube 영상 제목, Drive 파일명 등 API 원본 데이터는 Firestore에 저장하지 않습니다.
 *   의미 분석이 켜진 경우 원문은 OpenRouter에서 임베딩 처리되지만 앱 서버에는 저장하지 않습니다.
 * - OAuth 액세스 토큰도 절대 저장하지 않습니다.
 * 실제 필터링은 아래 buildFirestorePayload()가 화이트리스트 방식으로 수행합니다.
 * ============================================================================
 */

const LOCAL_STORAGE_KEY = 'taste_palette_app_data_v1';

// 기본 플랫폼 연동 초기 데이터
// 넷플릭스/왓챠/CGV 등 기존 OTT 카드는 실제로 연동 가능한 공개 API가 없어 전부 제거했습니다.
// YouTube·Google Drive는 동일한 Google 계정 로그인 한 번으로 연동됩니다.
// X(트위터)와 Pinterest는 둘 다 무료 API로 일반 사용자 데이터를 읽을 수 없어
// (X: 유료 Basic 플랜 월 $200~ / Pinterest: 앱 심사 통과 전엔 개발자 본인 계정만 연동)
// 예시 데이터 토글로 제공합니다. 모든 카드는 동일한 토글 UI로 통일했습니다.
export const INITIAL_PLATFORMS: PlatformConnection[] = [
  {
    id: 'youtube',
    name: 'YouTube',
    iconName: 'Youtube',
    category: '영상 / 좋아요·시청기록',
    color: '#FF0000',
    kind: 'oauth',
    connected: false,
    itemCount: 0,
    previewItems: [],
    description: '좋아요 표시한 동영상을 가져옵니다',
  },
  {
    id: 'drive',
    name: 'Google Drive',
    iconName: 'HardDrive',
    category: '문서 / 전자책·PDF',
    color: '#1A73E8',
    kind: 'oauth',
    connected: false,
    itemCount: 0,
    previewItems: [],
    description: '최근 문서·PDF 제목만 읽습니다 (내용 미열람)',
  },
  {
    id: 'x',
    name: 'X (Twitter)',
    iconName: 'Twitter',
    category: '소셜 / 좋아요한 글',
    color: '#000000',
    kind: 'demo',
    connected: false,
    itemCount: 0,
    previewItems: [],
    description: '무료 API로는 읽기가 불가능해 예시 데이터로 제공해요',
  },
  {
    id: 'pinterest',
    name: 'Pinterest',
    iconName: 'Image',
    category: '이미지 저장 / 핀보드',
    color: '#E60023',
    kind: 'demo',
    connected: false,
    itemCount: 0,
    previewItems: [],
    description: '앱 심사 전에는 본인 계정만 연동 가능해 예시 데이터로 제공해요',
  },
];

// 신규 사용자의 분석은 실제 연동/입력 데이터만 사용합니다.
export const INITIAL_WATCHED_WORKS: ConsumedWork[] = [];

// 이전 버전에서 실제 사용자 기록처럼 삽입했던 데모 항목 ID입니다.
// 직접 추가한 기록은 다른 ID 형식을 사용하므로 이 목록만 제거해도 사용자 데이터는 보존됩니다.
const LEGACY_SEED_WATCHED_IDS = new Set(['watched-01', 'watched-02', 'watched-03', 'watched-04']);
const LEGACY_SEED_LIKED_IDS = new Set(['movie-01', 'webtoon-01', 'book-05', 'webtoon-06']);

export function removeLegacySeedWatchedWorks(works: ConsumedWork[]): ConsumedWork[] {
  return works.filter(work => !LEGACY_SEED_WATCHED_IDS.has(work.id));
}

export function generateUserId(): string {
  return 'user_pal_' + Math.random().toString(36).substring(2, 9) + '_' + Date.now().toString(36).substring(4);
}

export function loadStoredAppData(): StoredAppData {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      // 이전 버전 로컬 데이터 마이그레이션: 넷플릭스 등 가짜 플랫폼 목록을 쓰던
      // 세션에서 넘어온 경우 platformConnections가 없으므로 기본값으로 채움.
      const knownIds = INITIAL_PLATFORMS.map(p => p.id).join(',');
      const storedIds = Array.isArray(parsed.platformConnections)
        ? parsed.platformConnections.map((p: PlatformConnection) => p.id).join(',')
        : '';
      if (storedIds !== knownIds) {
        parsed.platformConnections = INITIAL_PLATFORMS;
        parsed.syncStatus = { youtube: false, drive: false, x: false, pinterest: false };
      }
      if (!parsed.onboarding) {
        parsed.onboarding = { completed: false, answers: {} };
      }
      if (typeof parsed.welcomeDismissed !== 'boolean') {
        parsed.welcomeDismissed = false;
      }
      if (Array.isArray(parsed.watchedWorks)) {
        parsed.watchedWorks = removeLegacySeedWatchedWorks(parsed.watchedWorks);
      }
      if (
        Array.isArray(parsed.likedWorkIds) &&
        parsed.likedWorkIds.length === LEGACY_SEED_LIKED_IDS.size &&
        parsed.likedWorkIds.every((id: string) => LEGACY_SEED_LIKED_IDS.has(id))
      ) {
        parsed.likedWorkIds = [];
      }
      return parsed;
    }
  } catch (err) {
    console.warn('Failed to load local storage data, using fallback defaults', err);
  }

  const initialData: StoredAppData = {
    // 1. 식별자 (User Identifier)
    userIdentifier: generateUserId(),
    // 2. 사용자 유형 (User Archetype)
    userType: DEFAULT_ARCHETYPE,
    // 3. 시청/열람 작품 (Watched Works)
    watchedWorks: INITIAL_WATCHED_WORKS,
    // 4. 추천 작품 (Recommended Works)
    recommendedWorks: ALL_MEDIA_ITEMS.slice(0, 8),
    likedWorkIds: [],
    syncStatus: {
      youtube: false,
      drive: false,
      x: false,
      pinterest: false,
    },
    platformConnections: INITIAL_PLATFORMS,
    onboarding: { completed: false, answers: {} },
    welcomeDismissed: false,
  };

  saveStoredAppData(initialData);
  return initialData;
}

/**
 * ★ 저장 화이트리스트 ★
 * Firestore로 보낼 필드를 여기서 명시적으로 골라 담습니다. 이 함수를 거치지
 * 않은 값은 서버로 전송되지 않으므로, API 원본 데이터(영상 제목·파일명)와
 * 액세스 토큰이 새어나가지 않도록 보장하는 마지막 방어선입니다.
 */
export function buildFirestorePayload(data: StoredAppData, uid: string) {
  return {
    // 1. 회원 식별자
    userId: uid,
    localIdentifier: data.userIdentifier,

    // 2. 사용자 유형 (분석 결과)
    userType: {
      id: data.userType.id,
      name: data.userType.name,
      badge: data.userType.badge,
      primaryColor: data.userType.primaryColor,
      trendResistanceScore: data.userType.trendResistanceScore,
      dnaScores: data.userType.dnaScores,
    },

    // 3. 성향 분석 점수 (원본이 아닌 '추출된 수치'만)
    scoreBreakdown: data.scoreBreakdown
      ? {
          finalScores: data.scoreBreakdown.finalScores,
          totalAnalyzed: data.scoreBreakdown.totalAnalyzed,
          confidence: data.scoreBreakdown.confidence,
          confidenceIntervals: data.scoreBreakdown.confidenceIntervals ?? null,
          splitHalfReliability: data.scoreBreakdown.splitHalfReliability ?? null,
          analysisEngine: data.scoreBreakdown.analysisEngine ?? 'keyword-fallback',
          semanticModel: data.scoreBreakdown.semanticModel ?? null,
          sources: data.scoreBreakdown.sources.map(s => ({
            id: s.id,
            weight: s.weight,
            analyzedCount: s.analyzedCount,
            matchedCount: s.matchedCount,
            scores: s.scores,
          })),
        }
      : null,

    // 4. 온보딩 취향 테스트 (선택한 보기 ID만)
    onboarding: {
      completed: data.onboarding.completed,
      completedAt: data.onboarding.completedAt ?? null,
      answers: data.onboarding.answers,
    },

    // 5. 사용자가 직접 등록한 감상 기록 (본인 소유 데이터)
    watchedWorks: data.watchedWorks.map(w => ({
      id: w.id,
      mediaItemId: w.mediaItemId,
      title: w.title,
      category: w.category,
      creator: w.creator,
      userRating: w.userRating,
      reviewedAt: w.reviewedAt,
      sourcePlatform: w.sourcePlatform ?? null,
      tags: w.tags,
    })),
    likedWorkIds: data.likedWorkIds,
    recommendedWorkIds: data.recommendedWorks.slice(0, 20).map(m => m.id),

    // 6. 플랫폼 연동 요약 (연동 여부와 건수만 — previewItems·토큰 제외)
    platformSummary: data.platformConnections.map(p => ({
      id: p.id,
      connected: p.connected,
      itemCount: p.itemCount,
      lastSyncedAt: p.lastSyncedAt ?? null,
    })),
  };
}

const RESTORED_SOURCE_LABELS: Record<string, string> = {
  onboarding: '취향 테스트 응답',
  watched: '내 보관함 감상 기록',
  youtube: 'YouTube 좋아요',
  drive: 'Google Drive 문서',
  x: 'X 예시 데이터',
  pinterest: 'Pinterest 예시 데이터',
};

function asRecord(value: unknown): Record<string, any> | null {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, any>
    : null;
}

/** Firestore 화이트리스트 문서를 앱 상태로 안전하게 복원합니다. */
export function restoreStoredAppData(
  local: StoredAppData,
  payload: Record<string, unknown>,
): StoredAppData {
  const cloudUserType = asRecord(payload.userType);
  const baseArchetype = cloudUserType?.id && TASTE_ARCHETYPES[cloudUserType.id]
    ? TASTE_ARCHETYPES[cloudUserType.id]
    : local.userType;

  const cloudWatched = Array.isArray(payload.watchedWorks)
    ? payload.watchedWorks.map(raw => {
        const work = asRecord(raw);
        if (!work || typeof work.id !== 'string' || typeof work.title !== 'string') return null;
        const catalog = ALL_MEDIA_ITEMS.find(item => item.id === work.mediaItemId);
        return {
          id: work.id,
          mediaItemId: typeof work.mediaItemId === 'string' ? work.mediaItemId : '',
          title: work.title,
          category: work.category === 'movie' || work.category === 'webtoon' ? work.category : 'book',
          creator: typeof work.creator === 'string' ? work.creator : '',
          coverUrl: catalog?.coverUrl ?? '',
          userRating: typeof work.userRating === 'number' ? work.userRating : 0,
          reviewedAt: typeof work.reviewedAt === 'string' ? work.reviewedAt : '',
          sourcePlatform: typeof work.sourcePlatform === 'string' ? work.sourcePlatform : undefined,
          tags: Array.isArray(work.tags) ? work.tags.filter((tag: unknown) => typeof tag === 'string') : [],
        } as ConsumedWork;
      }).filter((work): work is ConsumedWork => work !== null)
    : local.watchedWorks;

  const cloudOnboarding = asRecord(payload.onboarding);
  const answers = asRecord(cloudOnboarding?.answers) ?? local.onboarding.answers;
  const restoredOnboarding: OnboardingResult = cloudOnboarding
    ? {
        completed: Boolean(cloudOnboarding.completed),
        completedAt: typeof cloudOnboarding.completedAt === 'string' ? cloudOnboarding.completedAt : undefined,
        answers: Object.fromEntries(Object.entries(answers).filter((entry): entry is [string, string] => typeof entry[1] === 'string')),
      }
    : local.onboarding;
  if (restoredOnboarding.completed && Object.keys(restoredOnboarding.answers).length > 0) {
    restoredOnboarding.scores = scoreOnboardingAnswers(restoredOnboarding.answers);
  }

  const cloudScore = asRecord(payload.scoreBreakdown);
  let scoreBreakdown = local.scoreBreakdown;
  if (cloudScore && asRecord(cloudScore.finalScores) && Array.isArray(cloudScore.sources)) {
    scoreBreakdown = {
      finalScores: cloudScore.finalScores,
      totalAnalyzed: Number(cloudScore.totalAnalyzed) || 0,
      confidence: Number(cloudScore.confidence) || 0,
      confidenceIntervals: cloudScore.confidenceIntervals ?? undefined,
      splitHalfReliability: typeof cloudScore.splitHalfReliability === 'number'
        ? cloudScore.splitHalfReliability
        : undefined,
      analysisEngine: cloudScore.analysisEngine === 'semantic-embedding'
        ? 'semantic-embedding'
        : 'keyword-fallback',
      semanticModel: typeof cloudScore.semanticModel === 'string' ? cloudScore.semanticModel : undefined,
      sources: cloudScore.sources.map((raw: unknown) => {
        const source = asRecord(raw) ?? {};
        return {
          ...source,
          label: RESTORED_SOURCE_LABELS[source.id] ?? String(source.id ?? '복원 데이터'),
        };
      }),
    } as TasteScoreBreakdown;
  }

  const recommendationIds = Array.isArray(payload.recommendedWorkIds) ? payload.recommendedWorkIds : [];
  const restoredRecommendations = recommendationIds
    .map(id => ALL_MEDIA_ITEMS.find(item => item.id === id))
    .filter((item): item is NonNullable<typeof item> => Boolean(item));

  const hasLocalPlatformData = local.platformConnections.some(platform => platform.previewItems.length > 0);
  const restoredPlatforms = hasLocalPlatformData ? local.platformConnections : INITIAL_PLATFORMS;

  return {
    ...local,
    userIdentifier: typeof payload.localIdentifier === 'string'
      ? payload.localIdentifier
      : local.userIdentifier,
    userType: {
      ...baseArchetype,
      trendResistanceScore: typeof cloudUserType?.trendResistanceScore === 'number'
        ? cloudUserType.trendResistanceScore
        : baseArchetype.trendResistanceScore,
    },
    watchedWorks: cloudWatched,
    likedWorkIds: Array.isArray(payload.likedWorkIds)
      ? payload.likedWorkIds.filter((id): id is string => typeof id === 'string')
      : local.likedWorkIds,
    recommendedWorks: restoredRecommendations.length > 0 ? restoredRecommendations : local.recommendedWorks,
    onboarding: restoredOnboarding,
    scoreBreakdown,
    // 원본 플랫폼 항목은 Firestore에 저장하지 않으므로 다시 Google 동기화해야 합니다.
    platformConnections: restoredPlatforms,
    syncStatus: Object.fromEntries(restoredPlatforms.map(platform => [platform.id, platform.connected])),
    welcomeDismissed: true,
  };
}

/** Firestore 쓰기는 실패해도 앱 동작을 막지 않도록 조용히 처리 */
async function syncToFirestore(data: StoredAppData): Promise<void> {
  if (!isFirebaseConfigured()) return;
  try {
    const user = await ensureAnonymousSignIn();
    const uid = getCurrentUid() ?? user?.uid;
    if (!uid) return;

    await writeUserDoc(uid, buildFirestorePayload(data, uid));
  } catch (err) {
    console.error('[Firebase Firestore] 사용자 문서 동기화 실패:', err);
  }
}

// 저장은 자주 일어나므로 쓰기를 묶어 Firestore 호출 횟수를 줄입니다.
let syncTimer: ReturnType<typeof setTimeout> | null = null;
let pendingData: StoredAppData | null = null;
let firestoreSyncEnabled = false;

export function setFirestoreSyncEnabled(enabled: boolean): void {
  firestoreSyncEnabled = enabled;
  if (!enabled && syncTimer) {
    clearTimeout(syncTimer);
    syncTimer = null;
    pendingData = null;
  }
}

export function saveStoredAppData(data: StoredAppData): void {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data));
  } catch (err) {
    console.error('Failed to persist to localStorage', err);
  }

  if (!isFirebaseConfigured() || !firestoreSyncEnabled) return;

  pendingData = data;
  if (syncTimer) clearTimeout(syncTimer);
  syncTimer = setTimeout(() => {
    syncTimer = null;
    const snapshot = pendingData;
    pendingData = null;
    if (snapshot) void syncToFirestore(snapshot);
  }, 1200);
}

/**
 * 사용자 시청/열람 작품 추가 및 저장
 */
export function addWatchedWorkToStore(
  work: Omit<ConsumedWork, 'id' | 'reviewedAt'>,
  currentData: StoredAppData
): StoredAppData {
  const newWork: ConsumedWork = {
    ...work,
    id: 'watched_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 6),
    reviewedAt: new Date().toISOString().split('T')[0],
  };

  const updatedWatched = [newWork, ...currentData.watchedWorks];
  const updatedData: StoredAppData = {
    ...currentData,
    watchedWorks: updatedWatched,
  };

  saveStoredAppData(updatedData);
  return updatedData;
}

/**
 * 찜하기/보관함 토글
 */
export function toggleLikeWorkInStore(mediaId: string, currentData: StoredAppData): StoredAppData {
  const isLiked = currentData.likedWorkIds.includes(mediaId);
  const updatedLiked = isLiked
    ? currentData.likedWorkIds.filter(id => id !== mediaId)
    : [...currentData.likedWorkIds, mediaId];

  const updatedData: StoredAppData = {
    ...currentData,
    likedWorkIds: updatedLiked,
  };

  saveStoredAppData(updatedData);
  return updatedData;
}

/**
 * 온보딩 취향 테스트 결과 저장
 */
export function saveOnboardingResultToStore(
  result: OnboardingResult,
  currentData: StoredAppData
): StoredAppData {
  const updatedData: StoredAppData = { ...currentData, onboarding: result };
  saveStoredAppData(updatedData);
  return updatedData;
}

/**
 * 첫 방문 '계정 연동' 팝업을 닫음 (연동 성공 또는 건너뛰기 모두 호출)
 */
export function dismissWelcomeInStore(currentData: StoredAppData): StoredAppData {
  const updatedData: StoredAppData = { ...currentData, welcomeDismissed: true };
  saveStoredAppData(updatedData);
  return updatedData;
}

/**
 * 플랫폼 연동 상태 및 실제 동기화된 활동 데이터 갱신 (토큰 자체는 저장하지 않음)
 */
export function updatePlatformConnectionsInStore(
  platforms: PlatformConnection[],
  currentData: StoredAppData
): StoredAppData {
  const syncStatus: Record<string, boolean> = {};
  platforms.forEach(p => {
    syncStatus[p.id] = p.connected;
  });

  const updatedData: StoredAppData = {
    ...currentData,
    platformConnections: platforms,
    syncStatus,
  };

  saveStoredAppData(updatedData);
  return updatedData;
}
