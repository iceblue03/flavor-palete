export type MediaType = 'book' | 'movie' | 'webtoon';

export interface TasteDNAScores {
  emotional: number;      // 감성도 (0-100)
  stimulation: number;    // 도파민/자극도 (0-100)
  depth: number;          // 철학/사유 깊이 (0-100)
  plotDensity: number;    // 서사 밀도/반전 (0-100)
  indieGem: number;       // 인디/숨겨진 명작 선호도 (0-100)
  worldbuilding: number;  // 세계관/몰입도 (0-100)
}

export interface TasteAxisInterval {
  lower: number;
  upper: number;
}

export type TasteConfidenceIntervals = Record<keyof TasteDNAScores, TasteAxisInterval>;

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

export type PlatformAuthKind = 'oauth' | 'demo';

export interface PlatformActivityItem {
  id: string;
  title: string;
  subtitle?: string; // e.g. YouTube 채널명, Drive 파일 형식
  url?: string;
}

export interface PlatformConnection {
  id: string;
  name: string;
  iconName: string;
  category: string;
  color: string;
  kind: PlatformAuthKind; // 'oauth' = real login-based sync, 'demo' = predefined placeholder data
  connected: boolean;
  itemCount: number;
  lastSyncedAt?: string;
  accountLabel?: string; // e.g. u/username, Google 채널명
  previewItems: PlatformActivityItem[];
  error?: string;
  /** 미연동 상태일 때 보여주는 한 줄 설명 */
  description: string;
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

/** 성향 분석 점수 산출에 기여한 데이터 출처 하나 */
export interface TasteScoreSource {
  id: 'onboarding' | 'watched' | 'youtube' | 'drive' | 'x' | 'pinterest';
  label: string;
  weight: number;         // 최종 점수 반영 가중치
  analyzedCount: number;  // 분석한 항목 수
  matchedCount: number;   // 취향 신호가 실제로 잡힌 항목 수
  scores: TasteDNAScores; // 이 출처가 산출한 6축 점수
}

/** 성향 분석 결과 (원본 제목이 아닌 '추출된 수치'만 담습니다) */
export interface TasteScoreBreakdown {
  finalScores: TasteDNAScores;
  sources: TasteScoreSource[];
  totalAnalyzed: number;
  /** 분할 반분 신뢰도, 신뢰구간 폭, 표본 수로 산출한 분석 신뢰도 (0-100) */
  confidence: number;
  /** 항목 복원추출 200회의 축별 95% 신뢰구간 */
  confidenceIntervals?: TasteConfidenceIntervals;
  /** 50/50 무작위 분할에서 얻은 두 점수 벡터의 피어슨 상관 (-1~1) */
  splitHalfReliability?: number;
  analysisEngine?: 'semantic-embedding' | 'keyword-fallback';
  semanticModel?: string;
}

/** 온보딩 취향 테스트 결과 (선택한 보기 ID만 저장) */
export interface OnboardingResult {
  completed: boolean;
  completedAt?: string;
  answers: Record<string, string>; // questionId -> optionId
  scores?: TasteDNAScores;
}

export interface StoredAppData {
  // PRD 명시 저장 데이터: 사용자 유형, 식별자, 시청 작품, 추천 작품
  userIdentifier: string;
  userType: TasteArchetype;
  watchedWorks: ConsumedWork[];
  recommendedWorks: MediaItem[];
  likedWorkIds: string[];
  syncStatus: Record<string, boolean>;
  platformConnections: PlatformConnection[];
  onboarding: OnboardingResult;
  scoreBreakdown?: TasteScoreBreakdown;
  /** 첫 방문 시 뜨는 '계정 연동' 팝업을 봤는지 (연동 완료 또는 건너뛰기) */
  welcomeDismissed: boolean;
}
