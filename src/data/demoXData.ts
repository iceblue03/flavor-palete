import { PlatformActivityItem } from '../types';

/**
 * X(트위터)는 2023년 API 정책 변경 이후 무료 티어로는 좋아요/타임라인 등
 * 읽기 API를 전혀 제공하지 않습니다 (읽기 가능한 최저 유료 플랜: Basic, 월 $200~).
 * 그래서 실제 로그인 연동 대신, 사용자가 명시적으로 요청한 "예시 데이터" 토글로 제공합니다.
 * 실제 사용자 데이터가 아니며, 연동 해제 시 아래 데이터는 전부 반영 취소됩니다.
 */

export const DEMO_X_ACCOUNT_LABEL = '@my_taste_archive (예시 계정)';

export const DEMO_X_ITEMS: PlatformActivityItem[] = [
  { id: 'x_demo_1', title: '애프터썬 엔딩 크레딧에서 또 울었다는 글에 좋아요', subtitle: '#영화 #인디무비' },
  { id: 'x_demo_2', title: '이번 주 웹툰 추천 스레드 정주행 완료 글에 좋아요', subtitle: '#웹툰' },
  { id: 'x_demo_3', title: '김초엽 신작 소설 예약구매 인증 글에 좋아요', subtitle: '#도서 #SF소설' },
  { id: 'x_demo_4', title: '새벽 감성 인디 플레이리스트 공유 글에 좋아요', subtitle: '#플레이리스트' },
  { id: 'x_demo_5', title: '숨겨진 명작 영화 추천 스레드에 좋아요', subtitle: '#인디영화' },
];
