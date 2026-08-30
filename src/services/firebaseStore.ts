import { ConsumedWork, OnboardingResult, PlatformConnection, StoredAppData } from '../types';
import { DEFAULT_ARCHETYPE } from '../data/archetypesData';
import { ALL_MEDIA_ITEMS } from '../data/contentsData';
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
 * - YouTube 영상 제목, Drive 파일명 등 API 원본 데이터는 저장하지 않습니다.
 *   (해당 원본은 브라우저 메모리/localStorage에만 머무르고, tasteScoring.ts에서
 *    점수와 개수로 환산된 뒤 그 숫자만 서버로 올라갑니다.)
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

// 초기 시청/열람 작품 시드 데이터
export const INITIAL_WATCHED_WORKS: ConsumedWork[] = [
  {
    id: 'watched-01',
    mediaItemId: 'movie-01',
    title: '애프터썬 (Aftersun)',
    category: 'movie',
    creator: '샬롯 웰스',
    coverUrl: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=600&q=80',
    userRating: 5,
    reviewedAt: '2026-08-20',
    sourcePlatform: '넷플릭스',
    tags: ['#기억', '#새벽감성', '#가슴먹먹'],
    userNote: '엔딩 크레딧 올라갈 때 눈물이 멈추지 않았다. 오랜만에 만난 인생 영화.',
  },
  {
    id: 'watched-02',
    mediaItemId: 'webtoon-01',
    title: '숲속의 담',
    category: 'webtoon',
    creator: '다홍',
    coverUrl: 'https://images.unsplash.com/photo-1511497584788-87676104235f?auto=format&fit=crop&w=600&q=80',
    userRating: 5,
    reviewedAt: '2026-08-25',
    sourcePlatform: '네이버 웹툰',
    tags: ['#철학적동화', '#따뜻한위로', '#색채미학'],
    userNote: '양산형 웹툰 속에서 발견한 보물 같은 명작. 담이의 성장이 너무 아름다움.',
  },
  {
    id: 'watched-03',
    mediaItemId: 'book-01',
    title: '우리가 빛의 속도로 갈 수 없다면',
    category: 'book',
    creator: '김초엽',
    coverUrl: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=600&q=80',
    userRating: 5,
    reviewedAt: '2026-08-15',
    sourcePlatform: '리디북스',
    tags: ['#SF소설', '#다정한시선', '#인생작'],
    userNote: '우주라는 차가운 배경 속에서 사람의 그리움을 이렇게 따스하게 담아낼 수 있다니.',
  },
  {
    id: 'watched-04',
    mediaItemId: 'movie-04',
    title: '소공녀',
    category: 'movie',
    creator: '전고운',
    coverUrl: 'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?auto=format&fit=crop&w=600&q=80',
    userRating: 4,
    reviewedAt: '2026-08-10',
    sourcePlatform: '넷플릭스',
    tags: ['#나만의취향', '#위스키', '#청춘'],
    userNote: '남들이 뭐라 하든 나만의 취향과 존엄을 지키는 미소가 멋졌다.',
  },
];

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
    likedWorkIds: ['movie-01', 'webtoon-01', 'book-05', 'webtoon-06'],
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

/** Firestore 쓰기는 실패해도 앱 동작을 막지 않도록 조용히 처리 */
async function syncToFirestore(data: StoredAppData): Promise<void> {
  if (!isFirebaseConfigured()) return;
  try {
    const user = await ensureAnonymousSignIn();
    const uid = user?.uid ?? getCurrentUid();
    if (!uid) return;

    await writeUserDoc(uid, buildFirestorePayload(data, uid));
  } catch (err) {
    console.error('[Firebase Firestore] 사용자 문서 동기화 실패:', err);
  }
}

// 저장은 자주 일어나므로 쓰기를 묶어 Firestore 호출 횟수를 줄입니다.
let syncTimer: ReturnType<typeof setTimeout> | null = null;
let pendingData: StoredAppData | null = null;

export function saveStoredAppData(data: StoredAppData): void {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data));
  } catch (err) {
    console.error('Failed to persist to localStorage', err);
  }

  if (!isFirebaseConfigured()) return;

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
