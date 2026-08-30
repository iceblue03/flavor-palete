<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/b35c74e0-7cf9-4b59-93bb-4471ae8caa36

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## 플랫폼 연동 설정 (Google 계정 하나로 YouTube + Drive)

YouTube와 Google Drive는 **같은 Google 계정 로그인 한 번**으로 연동됩니다. Client ID 하나만
발급받아 `.env.local`에 넣으면 되고, client secret은 필요 없습니다. 백엔드 서버도 없습니다 —
Google API는 브라우저에서 직접 호출할 수 있습니다.

**설정 방법**
1. https://console.cloud.google.com/apis/credentials 접속
2. "API 및 서비스" → 라이브러리에서 **YouTube Data API v3** 와 **Google Drive API** 둘 다 활성화
3. "사용자 인증 정보 만들기" → OAuth 클라이언트 ID → 타입: **웹 애플리케이션**
4. "승인된 자바스크립트 원본"에 앱 주소를 정확히 등록 (예: `http://localhost:3000`,
   배포 시 `https://your-app.vercel.app`) — **경로나 끝 슬래시(`/`) 없이 origin만** 입력해야
   합니다. `https://your-app.vercel.app/`처럼 슬래시로 끝나면 "올바르지 않은 출처" 오류가 납니다.
5. OAuth 동의 화면 → 범위(scope)에 아래 두 개 추가:
   - `.../auth/youtube.readonly`
   - `.../auth/drive.metadata.readonly`
6. 동의 화면이 "테스트" 상태인 동안에는 **테스트 사용자**에 본인 Google 계정을 추가해야 로그인됩니다
7. 발급된 client ID를 `.env.local`의 `VITE_GOOGLE_CLIENT_ID`에 입력

Client ID를 등록하지 않아도 앱은 정상 실행되며, 연동 센터에 "Client ID 설정 필요" 안내만 표시됩니다.

**가져오는 데이터**
- **YouTube**: 좋아요 표시한 동영상 (`myRating=like`) — 로그인 즉시 조회됩니다.
- **Google Drive**: 최근 수정한 파일의 **제목·형식 메타데이터만** (`drive.metadata.readonly`).
  파일 내용은 읽지 않습니다.

한쪽을 먼저 연동한 뒤 다른 쪽을 켜면, 이미 승인된 권한을 함께 요청하는 증분 승인으로 하나의
토큰이 두 서비스를 모두 커버합니다. "연동 해제"는 해당 권한만 제거하고, 마지막 하나였다면
Google 측 승인까지 철회합니다.

> 참고: `drive.metadata.readonly`는 Google이 "제한된(restricted)" 범위로 분류하는 권한입니다.
> 개인용·테스트 용도로는 테스트 사용자 등록만으로 충분하지만, 외부에 정식 공개하려면
> Google의 앱 인증(OAuth verification) 절차가 필요합니다.

YouTube 시청기록 전체(좋아요가 아닌 진짜 시청기록)는 API로 제공되지 않아, Google Takeout
(takeout.google.com → YouTube 및 YouTube Music → 기록 → `watch-history.json`)에서 내려받은
파일을 연동 센터에서 직접 업로드해 가져옵니다. 파일 자체는 브라우저에서만 파싱됩니다. AI 의미
분석이 활성화된 경우 파일에서 추출된 영상 제목·채널명은 임베딩 생성을 위해 OpenRouter로
전송될 수 있습니다.

**X(트위터)**와 **Pinterest**는 실제 로그인 연동 대신 예시 데이터 토글로 제공합니다. 첫 방문 계정
연동 팝업과 데이터 연동 센터 양쪽에서 다른 플랫폼과 동일한 토글 UI로 켜고 끌 수 있고, "데모" 배지로
실제 연동이 아님을 표시합니다.
- **X**: 2023년 API 정책 변경 이후 무료 플랜으로는 좋아요/타임라인 읽기가 불가능합니다
  (읽기 가능한 최저 유료 플랜: Basic, 월 $200~).
- **Pinterest**: API가 CORS를 지원하지 않아 브라우저에서 직접 호출할 수 없어 별도 백엔드가
  필요하고, 신규 앱은 "Trial access"로 시작해 **앱 개발자 본인 계정에만** 연동됩니다. 다른
  사용자가 로그인해도 데이터를 가져올 수 없고, 일반 사용자에게 열려면 Pinterest 심사(OAuth
  플로우를 시연하는 영상 제출 등)를 통과해 "Standard access"로 승급해야 합니다.

## Firebase 설정 (회원 정보 + 분석 점수 저장)

처음에는 **익명 인증**으로 uid를 발급하고, 사용자가 Google 플랫폼을 연결하면 같은 계정을
Firebase Google 계정으로 승격합니다. 이후 다른 기기에서 같은 Google 계정을 연결하면
Firestore의 유형·분석 결과·보관함·찜 목록을 복원합니다. 설정하지 않아도 앱은 localStorage
전용 모드로 정상 동작합니다.

1. https://console.firebase.google.com 에서 프로젝트 생성
2. 프로젝트 설정 → 내 앱 → 웹(`</>`) 앱 등록 → `firebaseConfig` 값을 `.env.local`에 복사
3. 빌드 → Authentication → 로그인 방법 → **익명**과 **Google** 사용 설정
4. 빌드 → Firestore Database → 데이터베이스 만들기
5. Authentication → Settings → 승인된 도메인에 Vercel 배포 도메인 추가

Google Cloud OAuth에는 `openid`, `email`, `profile`이 API 권한과 함께 요청됩니다. OAuth 액세스
토큰은 Firebase 자격증명 교환에만 사용하고 Firestore에는 저장하지 않습니다.

### 저장 정책 — 원본은 Firebase에 저장하지 않고 추출 데이터만 저장

| 저장함 (Firestore `users/{uid}`) | 저장하지 않음 |
| --- | --- |
| 회원 식별자(uid), 사용자 유형·아키타입 | YouTube 영상 제목·채널명 |
| 성향 분석 점수(6축), 신뢰도, 출처별 건수 | Drive 파일명·파일 URL |
| 온보딩 테스트 응답(보기 ID) | Google 계정 표시 이름 |
| 직접 등록한 감상 기록, 찜 목록 | OAuth 액세스 토큰 |
| 플랫폼 연동 여부·건수 | 플랫폼 원본 항목(`previewItems`) |

AI 의미 분석이 켜져 있으면 제목·채널명은 같은 출처의 의미를 비교하기 위해 `/api/embed`를 거쳐
OpenRouter 임베딩 API로 전송됩니다. 원문은 앱 서버나 Firestore에 저장하지 않으며, Firestore에는
`buildFirestorePayload()`가 허용한 점수·개수만 저장합니다. OpenRouter 제공자의 데이터 처리 정책은
선택한 모델에 따라 적용됩니다. API가 없거나 실패하면 기존 키워드 규칙으로 자동 폴백합니다.

## OpenRouter 의미 분석 설정 (Vercel)

Vercel 프로젝트 → Settings → Environment Variables에 아래 값을 추가한 뒤 재배포합니다.

```env
OPENROUTER_API_KEY=발급받은_키
OPENROUTER_EMBED_MODEL=liquid/lfm-2.5-embedding-350m:free
```

키에는 `VITE_` 접두사를 붙이지 않습니다. 브라우저는 같은 도메인의 `/api/embed`만 호출하고,
OpenRouter 키는 Vercel 서버 함수에서만 읽습니다.

권장 Firestore 보안 규칙 — 본인 문서만 읽고 쓸 수 있게 제한하세요:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{uid} {
      allow read, write: if request.auth != null && request.auth.uid == uid;
    }
  }
}
```

같은 내용의 `firestore.rules` 파일도 저장소에 포함되어 있습니다. Firebase CLI를 사용하는 경우
이 규칙을 배포하고, 그렇지 않으면 Firebase Console 규칙 편집기에 붙여넣어 게시하세요.

## 성향 분석 점수 시스템

첫 방문 시 뜨는 **계정 연동 팝업**에서 켠 플랫폼과, 분석 탭 하단 "취향 테스트 다시하기"로 선택
응시하는 **5문항 테스트**를 포함해 여러 출처를 가중 합산해 6축 취향 DNA를 산출합니다.

| 출처 | 가중치 | 설명 |
| --- | --- | --- |
| 취향 테스트 응답 | 3.0 | 보기마다 6축에 주는 영향이 명시돼 있음 (선택 기능) |
| 내 보관함 감상 기록 | 3.0 | 별점 가중 평균 |
| YouTube 좋아요 | 2.0 | 제목 키워드 매칭 |
| Google Drive 문서 | 1.5 | 제목 + 파일 형식 매칭 |
| X 예시 데이터 | 0.5 | 데모이므로 최소 반영 |
| Pinterest 예시 데이터 | 0.5 | 데모이므로 최소 반영 |

- 각 출처의 실제 반영률은 **신호 적중률**(취향 키워드가 잡힌 비율)에 따라 조정됩니다.
- **분석 신뢰도** = 분석량(60) + 출처 다양성(20) + 신호 적중률(20)
- **유행 탈피 지수** = 숨은 명작 선호 50% + 사유 깊이 30% + 저자극 선호 20%

산출 근거는 앱의 "취향 분석" 탭 하단 **성향 분석 점수 시스템** 패널에서 출처별 기여도로 확인할 수 있습니다.
