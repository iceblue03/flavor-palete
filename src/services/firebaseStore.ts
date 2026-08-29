import { ConsumedWork, MediaItem, PlatformConnection, StoredAppData, TasteArchetype, TasteDNAScores } from '../types';
import { DEFAULT_ARCHETYPE, TASTE_ARCHETYPES } from '../data/archetypesData';
import { ALL_MEDIA_ITEMS } from '../data/contentsData';

/**
 * ============================================================================
 * [취향팔레트 - 데이터 저장소 & Firebase Firestore / Auth 인터페이스]
 * ============================================================================
 * PRD 저장 데이터 요구사항:
 * 1. 사용자 식별자 (Identifier / UUID)
 * 2. 사용자 유형 (User Archetype & Taste DNA)
 * 3. 시청/열람 작품 (Watched Works List with user rating & metadata)
 * 4. 추천 작품 (Recommended Works generated via Collaborative Filtering)
 * 
 * *제약조건 준수: Firebase 연동 위치는 상세한 TODO 주석으로 명시*
 * ============================================================================
 */

// TODO: [Firebase Auth] Initialize Firebase Auth instance
// import { getAuth, signInAnonymously, onAuthStateChanged, User } from 'firebase/auth';
// const auth = getAuth(firebaseApp);

// TODO: [Firebase Firestore] Initialize Cloud Firestore database instance
// import { getFirestore, doc, setDoc, getDoc, collection, query, where, getDocs, updateDoc, arrayUnion } from 'firebase/firestore';
// const db = getFirestore(firebaseApp);

const LOCAL_STORAGE_KEY = 'taste_palette_app_data_v1';

// 기본 플랫폼 연동 초기 데이터
export const INITIAL_PLATFORMS: PlatformConnection[] = [
  {
    id: 'netflix',
    name: '넷플릭스',
    iconName: 'Film',
    category: 'OTT / 영화·드라마',
    color: '#E50914',
    connected: true,
    itemCount: 42,
    lastSyncedAt: '2026-08-29 19:40',
    previewTitles: ['애프터썬', '소공녀', '서치', '디스토피아 2077'],
  },
  {
    id: 'naver-webtoon',
    name: '네이버 웹툰',
    iconName: 'Palette',
    category: '웹툰 / 만화',
    color: '#00DC64',
    connected: true,
    itemCount: 89,
    lastSyncedAt: '2026-08-29 20:15',
    previewTitles: ['숲속의 담', '고래별', '미래의 골동품 가게', '스피릿 핑거스'],
  },
  {
    id: 'ridi',
    name: '리디북스 & 밀리의서재',
    iconName: 'BookOpen',
    category: '도서 / 전자책',
    color: '#1F8CE6',
    connected: true,
    itemCount: 23,
    lastSyncedAt: '2026-08-29 18:30',
    previewTitles: ['우리가 빛의 속도로 갈 수 없다면', '천 개의 파랑', '달까지 가자'],
  },
  {
    id: 'watcha',
    name: '왓챠피디아 (Watcha)',
    iconName: 'Star',
    category: '영화 / 평점 아카이브',
    color: '#FF0558',
    connected: false,
    itemCount: 0,
    previewTitles: ['평점 데이터 120건 연동 가능'],
  },
  {
    id: 'spotify',
    name: '스포티파이 (Spotify)',
    iconName: 'Music',
    category: '음악 / OST',
    color: '#1DB954',
    connected: false,
    itemCount: 0,
    previewTitles: ['새벽 인디 & 감성 플레이리스트 연동'],
  },
  {
    id: 'cgv',
    name: 'CGV / 메가박스 / 롯데시네마',
    iconName: 'Ticket',
    category: '영화관 / 관람이력',
    color: '#FB4357',
    connected: false,
    itemCount: 0,
    previewTitles: ['티켓 영수증 및 실관람 이력'],
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
      'netflix': true,
      'naver-webtoon': true,
      'ridi': true,
      'watcha': false,
      'spotify': false,
      'cgv': false,
    },
  };

  saveStoredAppData(initialData);
  return initialData;
}

export function saveStoredAppData(data: StoredAppData): void {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data));
  } catch (err) {
    console.error('Failed to persist to localStorage', err);
  }

  // =========================================================================
  // TODO: [Firebase Firestore Integration Point]
  // =========================================================================
  // try {
  //   const userDocRef = doc(db, 'users', data.userIdentifier);
  //   await setDoc(userDocRef, {
  //     userId: data.userIdentifier,
  //     userType: {
  //       id: data.userType.id,
  //       name: data.userType.name,
  //       dnaScores: data.userType.dnaScores,
  //       primaryColor: data.userType.primaryColor,
  //       trendResistanceScore: data.userType.trendResistanceScore,
  //     },
  //     syncStatus: data.syncStatus,
  //     likedWorkIds: data.likedWorkIds,
  //     updatedAt: new Date().toISOString(),
  //   }, { merge: true });
  //   
  //   // TODO: [Firebase Firestore Subcollection] Sync watched works
  //   // for (const work of data.watchedWorks) {
  //   //   await setDoc(doc(db, `users/${data.userIdentifier}/watched_works`, work.id), work);
  //   // }
  //   
  //   // TODO: [Firebase Firestore Subcollection] Sync recommended works
  //   // for (const item of data.recommendedWorks) {
  //   //   await setDoc(doc(db, `users/${data.userIdentifier}/recommended_works`, item.id), item);
  //   // }
  // } catch (firebaseErr) {
  //   console.error('[Firebase Firestore] Error synchronizing user document:', firebaseErr);
  // }
  // =========================================================================
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

  // TODO: [Firebase Firestore] Add single document to subcollection
  // const workRef = doc(db, `users/${currentData.userIdentifier}/watched_works`, newWork.id);
  // await setDoc(workRef, newWork);

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

  // TODO: [Firebase Firestore] Update liked works array in user doc
  // const userDocRef = doc(db, 'users', currentData.userIdentifier);
  // await updateDoc(userDocRef, { likedWorkIds: updatedLiked });

  return updatedData;
}
