import { PlatformActivityItem } from '../types';

/**
 * Pinterest는 API가 CORS를 지원하지 않아 백엔드 서버가 필요하고, 신규 앱은
 * "Trial access"로 시작해 앱 개발자 본인 계정만 연동됩니다 — 다른 사용자가
 * 로그인해도 데이터를 가져올 수 없고, 일반 공개하려면 Pinterest 심사(영상
 * 제출 등)를 통과해야 합니다. 그래서 X와 동일하게 "예시 데이터" 토글로 제공합니다.
 * 실제 사용자 데이터가 아니며, 연동 해제 시 아래 데이터는 전부 반영 취소됩니다.
 */

export const DEMO_PINTEREST_ACCOUNT_LABEL = '@my_taste_board (예시 계정)';

export const DEMO_PINTEREST_ITEMS: PlatformActivityItem[] = [
  { id: 'pin_demo_1', title: '새벽 감성 무드보드 컬렉션', subtitle: '보드: 감성' },
  { id: 'pin_demo_2', title: '인디 영화 포스터 아카이브', subtitle: '보드: 인디영화' },
  { id: 'pin_demo_3', title: 'SF 세계관 컨셉아트 모음', subtitle: '보드: SF' },
  { id: 'pin_demo_4', title: '숨은 명작 웹툰 컷 저장', subtitle: '보드: 웹툰' },
  { id: 'pin_demo_5', title: '잔잔한 북 커버 디자인 모음', subtitle: '보드: 도서' },
];
