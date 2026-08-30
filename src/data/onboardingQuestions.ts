import { TasteDNAScores } from '../types';

export interface OnboardingOption {
  id: string;
  label: string;
  hint: string;
  /** 이 보기를 고르면 각 축에 더해지는 점수 */
  effects: Partial<TasteDNAScores>;
}

export interface OnboardingQuestion {
  id: string;
  emoji: string;
  question: string;
  options: OnboardingOption[];
}

/**
 * 첫 방문 시 30초 안에 끝나는 취향 테스트.
 * 보기마다 6축 DNA에 주는 영향이 명시돼 있어 점수 산출이 투명합니다.
 */
export const ONBOARDING_QUESTIONS: OnboardingQuestion[] = [
  {
    id: 'q1',
    emoji: '🌙',
    question: '금요일 밤, 혼자만의 시간이 생겼습니다. 무엇을 고르시겠어요?',
    options: [
      {
        id: 'a',
        label: '잔잔한 독립영화 한 편',
        hint: '여운이 오래 남는 이야기',
        effects: { emotional: 30, indieGem: 25, stimulation: -15 },
      },
      {
        id: 'b',
        label: '스릴러 시리즈 정주행',
        hint: '다음 화를 안 누를 수 없는',
        effects: { stimulation: 30, plotDensity: 28, emotional: -10 },
      },
      {
        id: 'c',
        label: '두꺼운 SF 소설',
        hint: '낯선 세계로 완전히 이동',
        effects: { worldbuilding: 32, depth: 22 },
      },
      {
        id: 'd',
        label: '따뜻한 일상 웹툰',
        hint: '마음이 편해지는 시간',
        effects: { emotional: 25, stimulation: -20, depth: -5 },
      },
    ],
  },
  {
    id: 'q2',
    emoji: '🎬',
    question: '작품이 끝났습니다. 어떤 결말이 더 좋으세요?',
    options: [
      {
        id: 'a',
        label: '해석의 여지를 남기는 열린 결말',
        hint: '며칠씩 곱씹게 되는',
        effects: { depth: 30, emotional: 20, indieGem: 18 },
      },
      {
        id: 'b',
        label: '모든 떡밥이 회수되는 반전 결말',
        hint: '"그래서 그거였구나!"',
        effects: { plotDensity: 32, stimulation: 20 },
      },
      {
        id: 'c',
        label: '모두가 행복해지는 따뜻한 결말',
        hint: '보고 나면 기분 좋아지는',
        effects: { emotional: 28, stimulation: -12 },
      },
    ],
  },
  {
    id: 'q3',
    emoji: '🔥',
    question: '모두가 보는 화제작이 있습니다. 당신의 반응은?',
    options: [
      {
        id: 'a',
        label: '유행이라 오히려 미루게 된다',
        hint: '남들 다 볼 때는 안 봄',
        effects: { indieGem: 35, depth: 12 },
      },
      {
        id: 'b',
        label: '화제일 때 같이 봐야 재밌다',
        hint: '실시간 반응이 중요',
        effects: { indieGem: -25, stimulation: 22 },
      },
      {
        id: 'c',
        label: '평이 좋으면 유행과 상관없이 본다',
        hint: '작품성 우선',
        effects: { depth: 20, indieGem: 10 },
      },
    ],
  },
  {
    id: 'q4',
    emoji: '💬',
    question: '작품에서 가장 중요한 요소를 하나만 고른다면?',
    options: [
      {
        id: 'a',
        label: '인물의 섬세한 감정선',
        hint: '표정 하나, 대사 한 줄',
        effects: { emotional: 32, depth: 18, stimulation: -10 },
      },
      {
        id: 'b',
        label: '촘촘하게 짜인 플롯',
        hint: '빈틈없는 구성',
        effects: { plotDensity: 32, depth: 15 },
      },
      {
        id: 'c',
        label: '압도적인 세계관과 설정',
        hint: '그 세계에 살고 싶은',
        effects: { worldbuilding: 35, stimulation: 10 },
      },
      {
        id: 'd',
        label: '지루할 틈 없는 전개 속도',
        hint: '한순간도 늘어지지 않는',
        effects: { stimulation: 32, plotDensity: 15, depth: -12 },
      },
    ],
  },
  {
    id: 'q5',
    emoji: '📚',
    question: '작품을 다 본 뒤 주로 무엇을 하나요?',
    options: [
      {
        id: 'a',
        label: '해석 글이나 리뷰를 찾아 읽는다',
        hint: '놓친 의미를 파고들기',
        effects: { depth: 32, plotDensity: 15 },
      },
      {
        id: 'b',
        label: 'OST를 반복해서 듣는다',
        hint: '그 감정에 더 머무르기',
        effects: { emotional: 30, worldbuilding: 10 },
      },
      {
        id: 'c',
        label: '비슷한 숨은 작품을 찾아 나선다',
        hint: '다음 보석 발굴',
        effects: { indieGem: 32, depth: 12 },
      },
      {
        id: 'd',
        label: '바로 다음 작품을 튼다',
        hint: '멈출 수 없는 정주행',
        effects: { stimulation: 28, plotDensity: 12 },
      },
    ],
  },
];

/** 테스트 응답을 6축 점수로 환산 (중립 50에서 시작해 보기 효과를 누적) */
export function scoreOnboardingAnswers(answers: Record<string, string>): TasteDNAScores {
  const scores: TasteDNAScores = {
    emotional: 50, stimulation: 50, depth: 50, plotDensity: 50, indieGem: 50, worldbuilding: 50,
  };

  for (const question of ONBOARDING_QUESTIONS) {
    const optionId = answers[question.id];
    if (!optionId) continue;
    const option = question.options.find(o => o.id === optionId);
    if (!option) continue;

    (Object.keys(option.effects) as (keyof TasteDNAScores)[]).forEach(axis => {
      scores[axis] += option.effects[axis] ?? 0;
    });
  }

  (Object.keys(scores) as (keyof TasteDNAScores)[]).forEach(axis => {
    scores[axis] = Math.max(0, Math.min(100, Math.round(scores[axis])));
  });

  return scores;
}
