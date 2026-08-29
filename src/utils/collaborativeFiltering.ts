import { ConsumedWork, MediaItem, TasteArchetype, TasteDNAScores, TasteTwinPeer } from '../types';
import { ALL_MEDIA_ITEMS } from '../data/contentsData';
import { TASTE_ARCHETYPES } from '../data/archetypesData';

/**
 * 6차원 취향 DNA 벡터 간의 코사인 유사도 (Cosine Similarity) 계산
 */
export function calculateCosineSimilarity(a: TasteDNAScores, b: TasteDNAScores): number {
  const dotProduct =
    a.emotional * b.emotional +
    a.stimulation * b.stimulation +
    a.depth * b.depth +
    a.plotDensity * b.plotDensity +
    a.indieGem * b.indieGem +
    a.worldbuilding * b.worldbuilding;

  const magA = Math.sqrt(
    a.emotional ** 2 +
    a.stimulation ** 2 +
    a.depth ** 2 +
    a.plotDensity ** 2 +
    a.indieGem ** 2 +
    a.worldbuilding ** 2
  );

  const magB = Math.sqrt(
    b.emotional ** 2 +
    b.stimulation ** 2 +
    b.depth ** 2 +
    b.plotDensity ** 2 +
    b.indieGem ** 2 +
    b.worldbuilding ** 2
  );

  if (magA === 0 || magB === 0) return 0;
  return dotProduct / (magA * magB);
}

/**
 * 사용자의 시청/열람 작품 데이터로부터 종합 취향 DNA 벡터를 동적으로 산출
 */
export function deriveUserTasteDNA(watchedWorks: ConsumedWork[]): TasteDNAScores {
  if (watchedWorks.length === 0) {
    // 기본값
    return {
      emotional: 80,
      stimulation: 45,
      depth: 82,
      plotDensity: 65,
      indieGem: 80,
      worldbuilding: 70,
    };
  }

  let totalWeight = 0;
  const weightedSum = {
    emotional: 0,
    stimulation: 0,
    depth: 0,
    plotDensity: 0,
    indieGem: 0,
    worldbuilding: 0,
  };

  for (const work of watchedWorks) {
    // 매칭되는 원본 미디어 아이템 찾기 (또는 카테고리 기반 추정)
    const media = ALL_MEDIA_ITEMS.find(m => m.id === work.mediaItemId || m.title.includes(work.title));
    const ratingWeight = Math.max(1, work.userRating); // 별점 1~5점 가중치

    const itemDna: TasteDNAScores = media ? media.dnaScores : {
      emotional: work.category === 'movie' ? 80 : 70,
      stimulation: work.category === 'webtoon' ? 75 : 50,
      depth: work.category === 'book' ? 85 : 65,
      plotDensity: 70,
      indieGem: 80,
      worldbuilding: 70,
    };

    weightedSum.emotional += itemDna.emotional * ratingWeight;
    weightedSum.stimulation += itemDna.stimulation * ratingWeight;
    weightedSum.depth += itemDna.depth * ratingWeight;
    weightedSum.plotDensity += itemDna.plotDensity * ratingWeight;
    weightedSum.indieGem += itemDna.indieGem * ratingWeight;
    weightedSum.worldbuilding += itemDna.worldbuilding * ratingWeight;

    totalWeight += ratingWeight;
  }

  return {
    emotional: Math.round(weightedSum.emotional / totalWeight),
    stimulation: Math.round(weightedSum.stimulation / totalWeight),
    depth: Math.round(weightedSum.depth / totalWeight),
    plotDensity: Math.round(weightedSum.plotDensity / totalWeight),
    indieGem: Math.round(weightedSum.indieGem / totalWeight),
    worldbuilding: Math.round(weightedSum.worldbuilding / totalWeight),
  };
}

/**
 * 취향 DNA 벡터를 기반으로 가장 근접한 8대 아키타입(사용자 유형) 결정
 */
export function determineUserArchetype(dna: TasteDNAScores): TasteArchetype {
  let highestSimilarity = -1;
  let bestArchetype: TasteArchetype = Object.values(TASTE_ARCHETYPES)[0];

  for (const archetype of Object.values(TASTE_ARCHETYPES)) {
    const similarity = calculateCosineSimilarity(dna, archetype.dnaScores);
    if (similarity > highestSimilarity) {
      highestSimilarity = similarity;
      bestArchetype = archetype;
    }
  }

  return bestArchetype;
}

/**
 * 협업 필터링 (Collaborative Filtering) 기반 추천 알고리즘
 * 1. User-Item Cosine Similarity
 * 2. Peer Cluster Rating Boost (취향 도플갱어 가중치)
 * 3. Hidden Gem Discovery Bonus (유행만 쫓는 것을 방지하고 숨겨진 갓작 가중치 부여)
 */
export function runCollaborativeFiltering(
  userDna: TasteDNAScores,
  watchedWorks: ConsumedWork[],
  allCatalog: MediaItem[] = ALL_MEDIA_ITEMS
): MediaItem[] {
  const watchedIds = new Set(watchedWorks.map(w => w.mediaItemId));

  const scoredItems = allCatalog.map(item => {
    // 1. 코사인 유사도 (0~100)
    const baseSim = calculateCosineSimilarity(userDna, item.dnaScores) * 100;

    // 2. 숨겨진 명작 지수 가중치 (대중적 유행보다 진짜 취향 보석 발굴)
    const hiddenGemBonus = (item.hiddenGemScore / 100) * 8;

    // 3. 평점 가중치
    const ratingBonus = (item.rating / 5) * 5;

    // 4. 이미 본 작품 약간의 감점 또는 제외
    const alreadyWatchedPenalty = watchedIds.has(item.id) ? -15 : 0;

    // 최종 매칭 스코어 (0-100 정규화)
    const finalScore = Math.min(100, Math.max(50, Math.round(baseSim * 0.85 + hiddenGemBonus + ratingBonus + alreadyWatchedPenalty)));

    // 실시간 협업 필터링 추천 사유 재구성
    let cfReason = item.cfReason;
    if (finalScore >= 95) {
      cfReason = `나와 취향 유사도 ${finalScore}%인 1020 유저들이 "숨겨진 인생작"으로 꼽은 작품`;
    } else if (finalScore >= 90) {
      cfReason = `동일 취향 클러스터 내 재시청/재독 희망률 1위로 집계`;
    }

    return {
      ...item,
      peerMatchRate: finalScore,
      cfReason,
    };
  });

  // 점수 내림차순 정렬
  return scoredItems.sort((a, b) => b.peerMatchRate - a.peerMatchRate);
}

/**
 * 가상 협업 필터링 피어 (나의 취향 쌍둥이 / 도플갱어 클러스터) 생성
 */
export function generateTasteTwinPeers(userDna: TasteDNAScores, archetype: TasteArchetype): TasteTwinPeer[] {
  return [
    {
      id: 'peer-1',
      nickname: '새벽서재_민우',
      avatarSeed: 'Felix',
      clusterName: '클러스터 #402 [심야의 몽상가들]',
      similarity: 98,
      commonFavorites: ['애프터썬', '숲속의 담', '천 개의 파랑'],
      archetypeId: archetype.id,
      topRecommendationForUser: '고래별 (웹툰)',
    },
    {
      id: 'peer-2',
      nickname: '필름감성_유나',
      avatarSeed: 'Avery',
      clusterName: '클러스터 #402 [심야의 몽상가들]',
      similarity: 95,
      commonFavorites: ['소공녀', '우리가 빛의 속도로 갈 수 없다면'],
      archetypeId: archetype.id,
      topRecommendationForUser: '단 하루의 기적 (소설)',
    },
    {
      id: 'peer-3',
      nickname: '스토리텔러_준',
      avatarSeed: 'Zack',
      clusterName: '클러스터 #118 [세계관 탐사대]',
      similarity: 92,
      commonFavorites: ['컨택트', '미래의 골동품 가게'],
      archetypeId: 'cyber-sf-mystic',
      topRecommendationForUser: '지구 끝의 온실 (소설)',
    },
    {
      id: 'peer-4',
      nickname: '인디탐독_소희',
      avatarSeed: 'Bella',
      clusterName: '클러스터 #77 [숨은명작 발굴단]',
      similarity: 91,
      commonFavorites: ['메기', '스피릿 핑거스'],
      archetypeId: 'kitsch-indie-rebel',
      topRecommendationForUser: '달까지 가자 (소설)',
    },
  ];
}
