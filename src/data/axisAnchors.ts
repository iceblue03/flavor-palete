import { TasteDNAScores } from '../types';

export interface TasteAxisAnchor {
  axis: keyof TasteDNAScores;
  positive: string;
  negative: string;
}

/**
 * 각 축의 양 끝을 설명하는 의미 앵커입니다. 항목 임베딩이 어느 설명에 더
 * 가까운지 비교하므로, 특정 키워드가 없어도 문장 전체의 의미를 반영합니다.
 */
export const TASTE_AXIS_ANCHORS: TasteAxisAnchor[] = [
  {
    axis: 'emotional',
    positive: '감정의 여운, 사랑, 위로, 관계와 내면을 섬세하게 느끼는 감성적인 콘텐츠',
    negative: '감정 표현보다 사실, 기능, 정보와 객관적 설명에 집중하는 건조한 콘텐츠',
  },
  {
    axis: 'stimulation',
    positive: '빠른 전개, 강한 액션, 공포, 경쟁과 짜릿한 자극을 주는 콘텐츠',
    negative: '느리고 평온하며 긴장과 자극이 적은 차분한 콘텐츠',
  },
  {
    axis: 'depth',
    positive: '철학, 인문학, 과학적 탐구, 비평과 해석처럼 깊은 사고를 요구하는 콘텐츠',
    negative: '가볍게 소비하는 일상 재미와 단순한 오락 중심의 콘텐츠',
  },
  {
    axis: 'plotDensity',
    positive: '복선, 반전, 미스터리와 복잡한 인과관계가 촘촘한 서사 중심 콘텐츠',
    negative: '이야기 구조나 반전보다 분위기, 정보, 순간적 재미가 중심인 콘텐츠',
  },
  {
    axis: 'indieGem',
    positive: '독립 창작, 실험 예술, 서브컬처와 잘 알려지지 않은 독창적인 작품',
    negative: '대중 순위, 유행, 바이럴과 널리 알려진 주류 인기 콘텐츠',
  },
  {
    axis: 'worldbuilding',
    positive: 'SF, 판타지, 신화, 역사와 독창적인 규칙을 지닌 방대한 세계관 콘텐츠',
    negative: '현실의 평범한 일상과 실용적인 생활을 그대로 다루는 콘텐츠',
  },
];
