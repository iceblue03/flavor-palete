import {
  ConsumedWork,
  OnboardingResult,
  PlatformActivityItem,
  PlatformConnection,
  TasteDNAScores,
  TasteScoreBreakdown,
  TasteScoreSource,
} from '../types';
import { ALL_MEDIA_ITEMS } from '../data/contentsData';
import { ONBOARDING_QUESTIONS } from '../data/onboardingQuestions';
import {
  bootstrapCI,
  splitHalfReliability,
  statisticalConfidence,
  WeightedTasteSample,
} from './analysis/statistics';
import { SemanticAnalysisByPlatform } from './analysis/semanticTaste';

/**
 * ============================================================================
 * [취향팔레트 - 성향 분석 점수 시스템]
 * ============================================================================
 * 여러 출처(온보딩 테스트 / 내 보관함 / YouTube / Drive / X)에서 모은 정보를
 * 6축 취향 DNA 점수로 환산하고, 가중 평균해 최종 점수를 냅니다.
 *
 * ★ 개인정보 설계 원칙 ★
 * Firestore에는 이 파일이 만들어낸 TasteScoreBreakdown(숫자)만 저장됩니다.
 * 의미 분석이 활성화되면 원본 제목은 semanticTaste.ts를 통해 OpenRouter에서
 * 임베딩으로 변환되며, 앱 서버와 Firestore에는 원문을 저장하지 않습니다.
 * ============================================================================
 */

const NEUTRAL: TasteDNAScores = {
  emotional: 50,
  stimulation: 50,
  depth: 50,
  plotDensity: 50,
  indieGem: 50,
  worldbuilding: 50,
};

/** 제목에서 취향 신호를 잡아내는 키워드 규칙 */
interface KeywordRule {
  axis: keyof TasteDNAScores;
  /** 매칭 시 해당 축에 더할 점수 (음수면 감점) */
  delta: number;
  words: string[];
}

const KEYWORD_RULES: KeywordRule[] = [
  {
    axis: 'emotional',
    delta: 22,
    words: ['감성', '눈물', '위로', '힐링', '따뜻', '먹먹', '여운', '새벽', '잔잔', '슬픈', '설렘',
      '로맨스', '멜로', '사랑', 'ost', '발라드', 'emotional', 'healing', 'romance', 'sad'],
  },
  {
    axis: 'stimulation',
    delta: 22,
    words: ['도파민', '자극', '스릴', '공포', '호러', '액션', '전투', '레전드', '충격', '역대급',
      '사이다', 'highlight', '하이라이트', '숏폼', 'shorts', '핵인싸', 'action', 'thriller', 'horror'],
  },
  {
    axis: 'depth',
    delta: 22,
    words: ['철학', '사유', '인문', '고전', '에세이', '심리', '분석', '리뷰', '해석', '다큐',
      '강의', '독서', '논문', '사색', 'essay', 'documentary', 'philosophy', 'lecture', 'analysis'],
  },
  {
    axis: 'plotDensity',
    delta: 22,
    words: ['반전', '추리', '미스터리', '떡밥', '복선', '스포', '결말', '떡밥회수', '서스펜스',
      '범죄', '수사', 'mystery', 'plot', 'twist', 'ending', 'detective'],
  },
  {
    axis: 'indieGem',
    delta: 22,
    words: ['인디', '독립영화', '숨은', '명작', '비주류', '단편', '예술', '실험', '무명', '재발견',
      'indie', 'underrated', 'hidden', 'gem', 'arthouse', 'obscure'],
  },
  {
    axis: 'worldbuilding',
    delta: 22,
    words: ['세계관', 'sf', '판타지', '우주', '디스토피아', '설정', '연대기', '이세계', '마법',
      '사이버펑크', 'fantasy', 'sci-fi', 'worldbuilding', 'universe', 'lore'],
  },
  // 대중적 유행 신호는 '숨은 명작 선호도'를 낮추는 방향으로 작용
  {
    axis: 'indieGem',
    delta: -14,
    words: ['인기', '유행', '트렌드', '급상승', '화제', '실시간', '1위', 'top10', '챌린지',
      'trending', 'viral', 'popular', 'challenge'],
  },
];

/** Drive 파일 형식에서 얻는 신호 (제목 키워드와 별개) */
const MIME_HINTS: { match: string; axis: keyof TasteDNAScores; delta: number }[] = [
  { match: '전자책', axis: 'depth', delta: 18 },
  { match: 'PDF', axis: 'depth', delta: 12 },
  { match: 'Google 문서', axis: 'depth', delta: 8 },
  { match: '텍스트', axis: 'depth', delta: 8 },
];

function clamp(n: number): number {
  return Math.max(0, Math.min(100, Math.round(n)));
}

function clampScores(s: TasteDNAScores): TasteDNAScores {
  return {
    emotional: clamp(s.emotional),
    stimulation: clamp(s.stimulation),
    depth: clamp(s.depth),
    plotDensity: clamp(s.plotDensity),
    indieGem: clamp(s.indieGem),
    worldbuilding: clamp(s.worldbuilding),
  };
}

/**
 * 원본 제목 목록 -> 6축 점수 + 매칭 건수로 환산.
 * 반환값에 원본 문자열은 포함되지 않습니다.
 */
export function extractScoresFromItems(
  items: PlatformActivityItem[]
): { scores: TasteDNAScores; matchedCount: number } {
  const acc: TasteDNAScores = { ...NEUTRAL };
  let matchedCount = 0;

  for (const item of items) {
    const haystack = `${item.title} ${item.subtitle ?? ''}`.toLowerCase();
    let matchedThisItem = false;

    for (const rule of KEYWORD_RULES) {
      if (rule.words.some(w => haystack.includes(w))) {
        // 항목이 늘어날수록 한 건의 영향력은 줄어들도록 완만하게 누적
        acc[rule.axis] += rule.delta / Math.sqrt(items.length || 1);
        matchedThisItem = true;
      }
    }

    for (const hint of MIME_HINTS) {
      if ((item.subtitle ?? '').includes(hint.match)) {
        acc[hint.axis] += hint.delta / Math.sqrt(items.length || 1);
        matchedThisItem = true;
      }
    }

    if (matchedThisItem) matchedCount += 1;
  }

  return { scores: clampScores(acc), matchedCount };
}

/** 보관함의 감상 작품 -> 6축 점수 (별점 가중) */
export function extractScoresFromWatchedWorks(
  works: ConsumedWork[]
): { scores: TasteDNAScores; matchedCount: number } {
  if (works.length === 0) return { scores: { ...NEUTRAL }, matchedCount: 0 };

  const sum: TasteDNAScores = {
    emotional: 0, stimulation: 0, depth: 0, plotDensity: 0, indieGem: 0, worldbuilding: 0,
  };
  let totalWeight = 0;
  let matchedCount = 0;

  for (const work of works) {
    const media = ALL_MEDIA_ITEMS.find(m => m.id === work.mediaItemId || m.title.includes(work.title));
    if (media) matchedCount += 1;

    const dna: TasteDNAScores = media
      ? media.dnaScores
      : {
          emotional: work.category === 'movie' ? 75 : 65,
          stimulation: work.category === 'webtoon' ? 70 : 50,
          depth: work.category === 'book' ? 80 : 62,
          plotDensity: 65,
          indieGem: 70,
          worldbuilding: 65,
        };

    const weight = Math.max(1, work.userRating);
    (Object.keys(sum) as (keyof TasteDNAScores)[]).forEach(k => {
      sum[k] += dna[k] * weight;
    });
    totalWeight += weight;
  }

  const scores = {} as TasteDNAScores;
  (Object.keys(sum) as (keyof TasteDNAScores)[]).forEach(k => {
    scores[k] = clamp(sum[k] / totalWeight);
  });

  return { scores, matchedCount };
}

/** 각 출처의 기본 가중치 — 직접 답한 테스트와 내 보관함을 가장 신뢰 */
const SOURCE_WEIGHTS: Record<TasteScoreSource['id'], number> = {
  onboarding: 3,
  watched: 3,
  youtube: 2,
  drive: 1.5,
  x: 0.5, // 예시 데이터이므로 최소 반영
  pinterest: 0.5, // 예시 데이터이므로 최소 반영
};

const SOURCE_LABELS: Record<TasteScoreSource['id'], string> = {
  onboarding: '취향 테스트 응답',
  watched: '내 보관함 감상 기록',
  youtube: 'YouTube 좋아요',
  drive: 'Google Drive 문서',
  x: 'X 예시 데이터',
  pinterest: 'Pinterest 예시 데이터',
};

/**
 * 모든 출처를 모아 최종 성향 점수를 산출합니다.
 * 반환되는 TasteScoreBreakdown이 Firestore에 저장 가능한 '추출 데이터'입니다.
 */
export function computeTasteScore(input: {
  onboarding: OnboardingResult;
  watchedWorks: ConsumedWork[];
  platforms: PlatformConnection[];
  semanticByPlatform?: SemanticAnalysisByPlatform;
}): TasteScoreBreakdown {
  const sources: TasteScoreSource[] = [];
  const statisticalSamples: WeightedTasteSample[] = [];

  if (input.onboarding.completed && input.onboarding.scores) {
    const answerCount = Object.keys(input.onboarding.answers).length;
    sources.push({
      id: 'onboarding',
      label: SOURCE_LABELS.onboarding,
      weight: SOURCE_WEIGHTS.onboarding,
      analyzedCount: answerCount,
      matchedCount: answerCount,
      scores: input.onboarding.scores,
    });
    for (const [questionId, optionId] of Object.entries(input.onboarding.answers)) {
      const option = ONBOARDING_QUESTIONS
        .find(question => question.id === questionId)
        ?.options.find(candidate => candidate.id === optionId);
      if (!option) continue;
      const answerScores = { ...NEUTRAL };
      for (const axis of Object.keys(option.effects) as (keyof TasteDNAScores)[]) {
        // 온보딩 점수는 선택 효과의 합이므로 평균 시 원 산식이 복원되도록 N배합니다.
        answerScores[axis] += (option.effects[axis] ?? 0) * answerCount;
      }
      statisticalSamples.push({
        scores: answerScores,
        weight: SOURCE_WEIGHTS.onboarding / Math.max(1, answerCount),
        group: 'onboarding',
      });
    }
  }

  if (input.watchedWorks.length > 0) {
    const { scores, matchedCount } = extractScoresFromWatchedWorks(input.watchedWorks);
    sources.push({
      id: 'watched',
      label: SOURCE_LABELS.watched,
      weight: SOURCE_WEIGHTS.watched,
      analyzedCount: input.watchedWorks.length,
      matchedCount,
      scores,
    });
    const watchedSignalRatio = 0.5 + 0.5 * (matchedCount / input.watchedWorks.length);
    const ratingTotal = input.watchedWorks.reduce((sum, work) => sum + Math.max(1, work.userRating), 0);
    for (const work of input.watchedWorks) {
      const itemResult = extractScoresFromWatchedWorks([work]);
      statisticalSamples.push({
        scores: itemResult.scores,
        weight: SOURCE_WEIGHTS.watched * watchedSignalRatio * Math.max(1, work.userRating) / ratingTotal,
        group: 'watched',
      });
    }
  }

  for (const platform of input.platforms) {
    if (!platform.connected || platform.previewItems.length === 0) continue;
    const id = platform.id as TasteScoreSource['id'];
    if (!(id in SOURCE_WEIGHTS)) continue;

    const ruleResult = extractScoresFromItems(platform.previewItems);
    const semantic = input.semanticByPlatform?.[platform.id];
    const scores = semantic ? blendScores(semantic.scores, ruleResult.scores) : ruleResult.scores;
    const matchedCount = semantic ? platform.previewItems.length : ruleResult.matchedCount;
    sources.push({
      id,
      label: SOURCE_LABELS[id],
      weight: SOURCE_WEIGHTS[id],
      analyzedCount: platform.previewItems.length,
      matchedCount,
      scores,
    });
    const platformSignalRatio = semantic ? 1 : 0.5 + 0.5 * (matchedCount / platform.previewItems.length);
    const contributionScale = Math.sqrt(platform.previewItems.length);
    for (const item of platform.previewItems) {
      const itemResult = extractScoresFromItems([item]);
      let contributionScores: TasteDNAScores;
      const semanticItemScore = semantic?.itemScores[item.id];
      if (semanticItemScore) {
        contributionScores = blendScores(semanticItemScore, itemResult.scores);
      } else {
        contributionScores = { ...NEUTRAL };
        for (const axis of Object.keys(contributionScores) as (keyof TasteDNAScores)[]) {
          contributionScores[axis] = NEUTRAL[axis] + (itemResult.scores[axis] - NEUTRAL[axis]) * contributionScale;
        }
      }
      statisticalSamples.push({
        scores: contributionScores,
        weight: SOURCE_WEIGHTS[id] * platformSignalRatio / platform.previewItems.length,
        group: id,
      });
    }
  }

  // 데이터가 하나도 없으면 중립값
  if (sources.length === 0) {
    return { finalScores: { ...NEUTRAL }, sources: [], totalAnalyzed: 0, confidence: 0 };
  }

  // 신호가 잡힌 비율이 높은 출처일수록 실제 반영 가중치를 키움
  const weighted = { ...NEUTRAL };
  (Object.keys(weighted) as (keyof TasteDNAScores)[]).forEach(k => { weighted[k] = 0; });
  let weightSum = 0;

  for (const source of sources) {
    const signalRatio = source.analyzedCount > 0
      ? 0.5 + 0.5 * (source.matchedCount / source.analyzedCount)
      : 0.5;
    const effectiveWeight = source.weight * signalRatio;
    (Object.keys(weighted) as (keyof TasteDNAScores)[]).forEach(k => {
      weighted[k] += source.scores[k] * effectiveWeight;
    });
    weightSum += effectiveWeight;
  }

  const finalScores = {} as TasteDNAScores;
  (Object.keys(weighted) as (keyof TasteDNAScores)[]).forEach(k => {
    finalScores[k] = clamp(weighted[k] / weightSum);
  });

  const totalAnalyzed = sources.reduce((acc, s) => acc + s.analyzedCount, 0);
  const confidenceIntervals = bootstrapCI(statisticalSamples, 200);
  const reliability = splitHalfReliability(statisticalSamples);
  const confidence = statisticalConfidence(reliability, confidenceIntervals, totalAnalyzed);

  return {
    finalScores,
    sources,
    totalAnalyzed,
    confidence,
    confidenceIntervals,
    splitHalfReliability: Math.round(reliability * 100) / 100,
    analysisEngine: Object.keys(input.semanticByPlatform ?? {}).length > 0
      ? 'semantic-embedding'
      : 'keyword-fallback',
    semanticModel: Object.values(input.semanticByPlatform ?? {})[0]?.model,
  };
}

function blendScores(
  semantic: TasteDNAScores,
  rules: TasteDNAScores,
  semanticWeight = 0.85,
): TasteDNAScores {
  const blended = {} as TasteDNAScores;
  for (const axis of Object.keys(semantic) as (keyof TasteDNAScores)[]) {
    blended[axis] = clamp(semantic[axis] * semanticWeight + rules[axis] * (1 - semanticWeight));
  }
  return blended;
}

/** 6축 점수로부터 '유행 탈피 & 독립 취향 지수' 산출 */
export function computeTrendResistance(scores: TasteDNAScores): number {
  const raw = scores.indieGem * 0.5 + scores.depth * 0.3 + (100 - scores.stimulation) * 0.2;
  return clamp(raw);
}
