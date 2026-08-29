export type MediaType = 'book' | 'movie' | 'webtoon';

export interface TasteDNAScores {
  emotional: number;      // 감성도 (0-100)
  stimulation: number;    // 도파민/자극도 (0-100)
  depth: number;          // 철학/사유 깊이 (0-100)
  plotDensity: number;    // 서사 밀도/반전 (0-100)
  indieGem: number;       // 인디/숨겨진 명작 선호도 (0-100)
  worldbuilding: number;  // 세계관/몰입도 (0-100)
}

export interface TasteArchetype {
  id: string;
  name: string;
  subtitle: string;
  badge: string;
  description: string;
  quote: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  bgGradient: string;
  tags: string[];
  dnaScores: TasteDNAScores;
  characteristics: string[];
  bestMatches: {
    category: string;
    itemTitle: string;
    reason: string;
  }[];
  trendResistanceScore: number; // 유행 저항/독자적 취향 지수 (10-100)
}

export interface MediaItem {
  id: string;
  title: string;
  originalTitle?: string;
  creator: string; // 작가, 감독 등
  category: MediaType;
  categoryLabel: string;
  genre: string[];
  coverUrl: string;
  rating: number; // 1.0 - 5.0
  releaseYear: number;
  summary: string;
  tags: string[];
  hiddenGemScore: number; // 1-100 (숨겨진 명작 지수: 높을수록 대중성은 낮지만 취향 만족도 높음)
  popularityScore: number; // 1-100 (대중적 유행도)
  dnaScores: TasteDNAScores;
  recommendedReason: string; // 왜 추천하는가
  cfReason: string; // 협업 필터링 추천 사유 (예: "나와 취향 96% 일치하는 840명이 호평")
  peerMatchRate: number; // 나와의 유사도 퍼센트
}

export interface ConsumedWork {
  id: string;
  mediaItemId: string;
  title: string;
  category: MediaType;
  creator: string;
  coverUrl: string;
  userRating: number; // 1-5
  reviewedAt: string;
  sourcePlatform?: string; // e.g. "넷플릭스", "네이버웹툰", "리디", "직접입력"
  tags: string[];
  userNote?: string;
}

export interface PlatformConnection {
  id: string;
  name: string;
  iconName: string;
  category: string;
  color: string;
  connected: boolean;
  itemCount: number;
  lastSyncedAt?: string;
  previewTitles: string[];
}

export interface TasteTwinPeer {
  id: string;
  nickname: string;
  avatarSeed: string;
  clusterName: string;
  similarity: number; // 0-100%
  commonFavorites: string[];
  archetypeId: string;
  topRecommendationForUser: string;
}

export interface UserProfileData {
  userId: string; // 고유 식별자 (UUID)
  nickname: string;
  createdAt: string;
  syncedPlatforms: string[];
  archetype: TasteArchetype;
  dnaScores: TasteDNAScores;
  trendIndependenceScore: number; // 10-100 (유행 탈피율)
  totalConsumedCount: number;
}

export interface StoredAppData {
  // PRD 명시 저장 데이터: 사용자 유형, 식별자, 시청 작품, 추천 작품
  userIdentifier: string;
  userType: TasteArchetype;
  watchedWorks: ConsumedWork[];
  recommendedWorks: MediaItem[];
  likedWorkIds: string[];
  syncStatus: Record<string, boolean>;
}
