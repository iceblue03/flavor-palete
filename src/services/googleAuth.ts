import { PlatformActivityItem } from '../types';

/**
 * ============================================================================
 * [취향팔레트 - Google 계정 연동 (YouTube + Google Drive)]
 * ============================================================================
 * Google Identity Services의 "token model"(initTokenClient)을 사용합니다.
 * 백엔드가 없는 순수 브라우저 앱에서 Google이 공식 권장하는 방식이며,
 * client secret 없이 Client ID만으로 동작합니다.
 *
 * 한 번의 로그인으로 여러 권한(scope)을 부여할 수 있고, 나중에 다른 권한이
 * 필요하면 이미 승인된 권한을 함께 요청하는 "증분 승인(incremental
 * authorization)"으로 하나의 토큰이 YouTube와 Drive를 모두 커버합니다.
 *
 * YouTube·Drive API 모두 브라우저 CORS를 지원하므로 별도 서버가 필요 없습니다.
 * ============================================================================
 */

const AUTH_STORAGE_KEY = 'tp_google_auth';

export const GOOGLE_SCOPES = {
  youtube: 'https://www.googleapis.com/auth/youtube.readonly',
  drive: 'https://www.googleapis.com/auth/drive.metadata.readonly',
} as const;

const GOOGLE_IDENTITY_SCOPES = ['openid', 'email', 'profile'] as const;

export type GoogleScopeKey = keyof typeof GOOGLE_SCOPES;

interface StoredGoogleAuth {
  accessToken: string;
  expiresAt: number;
  grantedScopes: string[];
}

interface GoogleTokenClient {
  requestAccessToken: (opts?: { prompt?: string }) => void;
}

interface GoogleTokenResponse {
  access_token?: string;
  expires_in?: number;
  scope?: string;
  error?: string;
  error_description?: string;
}

declare global {
  interface Window {
    google?: {
      accounts: {
        oauth2: {
          initTokenClient: (config: {
            client_id: string;
            scope: string;
            callback: (resp: GoogleTokenResponse) => void;
            error_callback?: (err: { type?: string; message?: string }) => void;
          }) => GoogleTokenClient;
          revoke: (token: string, done?: () => void) => void;
        };
      };
    };
  }
}

export function getGoogleClientId(): string {
  return import.meta.env.VITE_GOOGLE_CLIENT_ID ?? '';
}

export function isGoogleConfigured(): boolean {
  return getGoogleClientId().trim().length > 0;
}

function waitForGis(timeoutMs = 8000): Promise<void> {
  return new Promise((resolve, reject) => {
    const start = Date.now();
    const check = () => {
      if (window.google?.accounts?.oauth2) {
        resolve();
        return;
      }
      if (Date.now() - start > timeoutMs) {
        reject(new Error('Google 로그인 스크립트를 불러오지 못했습니다. 새로고침 후 다시 시도해주세요.'));
        return;
      }
      setTimeout(check, 100);
    };
    check();
  });
}

export function getStoredGoogleToken(): StoredGoogleAuth | null {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return null;
    const parsed: StoredGoogleAuth = JSON.parse(raw);
    if (parsed.expiresAt < Date.now()) return null;
    if (!Array.isArray(parsed.grantedScopes)) return null;
    return parsed;
  } catch {
    return null;
  }
}

/** 저장된 토큰이 해당 서비스 권한을 실제로 포함하는지 확인 */
export function hasGrantedScope(scopeKey: GoogleScopeKey): boolean {
  const stored = getStoredGoogleToken();
  return !!stored?.grantedScopes.includes(GOOGLE_SCOPES[scopeKey]);
}

export function hasGoogleIdentityScopes(): boolean {
  const stored = getStoredGoogleToken();
  return !!stored && GOOGLE_IDENTITY_SCOPES.every(scope => stored.grantedScopes.includes(scope));
}

export function clearGoogleToken(): void {
  localStorage.removeItem(AUTH_STORAGE_KEY);
}

/**
 * 한 서비스만 연동 해제. 남은 권한이 있으면 토큰은 유지하고 해당 scope만 제거하며,
 * 마지막 권한이었다면 Google 측 승인까지 철회하고 토큰을 완전히 삭제합니다.
 */
export function revokeScope(scopeKey: GoogleScopeKey): void {
  const stored = getStoredGoogleToken();
  if (!stored) return;

  const remaining = stored.grantedScopes.filter(s => s !== GOOGLE_SCOPES[scopeKey]);
  const stillUsed = (Object.keys(GOOGLE_SCOPES) as GoogleScopeKey[]).some(key =>
    remaining.includes(GOOGLE_SCOPES[key])
  );

  if (stillUsed) {
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({ ...stored, grantedScopes: remaining }));
    return;
  }

  try {
    window.google?.accounts.oauth2.revoke(stored.accessToken);
  } catch {
    // 철회 실패해도 로컬 토큰은 삭제해 연동 해제를 보장
  }
  clearGoogleToken();
}

/**
 * 지정한 서비스 권한을 요청합니다 (하나 또는 여러 개를 한 번의 동의 화면으로
 * 요청 가능). 이미 승인된 다른 권한도 함께 요청해(증분 승인) 하나의 토큰이
 * YouTube·Drive를 모두 커버하도록 합니다. 사용자가 동의 화면에서 일부 권한만
 * 체크할 수 있으므로, 실제로 부여된 scope 목록을 응답에서 받아 저장하고
 * 요청한 권한을 전부 거부한 경우에만 실패로 처리합니다.
 */
export async function requestGoogleToken(
  scopeKeys: GoogleScopeKey | GoogleScopeKey[]
): Promise<StoredGoogleAuth> {
  const keys = Array.isArray(scopeKeys) ? scopeKeys : [scopeKeys];
  const clientId = getGoogleClientId();
  if (!clientId) throw new Error('VITE_GOOGLE_CLIENT_ID가 설정되지 않았습니다.');
  await waitForGis();

  const existing = getStoredGoogleToken();
  const requestedScopes = new Set<string>(existing?.grantedScopes ?? []);
  GOOGLE_IDENTITY_SCOPES.forEach(scope => requestedScopes.add(scope));
  keys.forEach(k => requestedScopes.add(GOOGLE_SCOPES[k]));

  return new Promise((resolve, reject) => {
    const client = window.google!.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope: [...requestedScopes].join(' '),
      callback: resp => {
        if (resp.error || !resp.access_token) {
          reject(new Error(resp.error_description || resp.error || 'Google 로그인이 취소되었습니다.'));
          return;
        }

        const grantedScopes = (resp.scope ?? '').split(' ').filter(Boolean);
        const allDenied = keys.every(k => !grantedScopes.includes(GOOGLE_SCOPES[k]));
        if (allDenied) {
          reject(new Error('필요한 권한이 승인되지 않았습니다. 동의 화면에서 해당 항목을 체크해주세요.'));
          return;
        }

        const auth: StoredGoogleAuth = {
          accessToken: resp.access_token,
          expiresAt: Date.now() + (resp.expires_in ?? 3600) * 1000,
          grantedScopes,
        };
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(auth));
        resolve(auth);
      },
      error_callback: err => {
        reject(new Error(err.message || 'Google 로그인 창이 닫혔거나 차단되었습니다.'));
      },
    });
    client.requestAccessToken();
  });
}

export interface GoogleActivityResult {
  accountLabel: string;
  itemCount: number;
  items: PlatformActivityItem[];
}

/** YouTube: 내 채널명 + 좋아요 표시한 동영상 목록 */
export async function fetchYoutubeActivity(accessToken: string): Promise<GoogleActivityResult> {
  const authHeader = { Authorization: `Bearer ${accessToken}` };

  const likedRes = await fetch(
    'https://www.googleapis.com/youtube/v3/videos?part=snippet&myRating=like&maxResults=25',
    { headers: authHeader }
  );
  if (!likedRes.ok) {
    throw new Error(
      likedRes.status === 401
        ? 'YouTube 인증이 만료되었습니다. 다시 로그인해주세요.'
        : `좋아요한 동영상을 불러오지 못했습니다 (${likedRes.status})`
    );
  }
  const likedData = await likedRes.json();

  const items: PlatformActivityItem[] = (likedData.items ?? []).map((v: any) => ({
    id: `like_${v.id}`,
    title: v.snippet.title,
    subtitle: v.snippet.channelTitle,
    url: `https://www.youtube.com/watch?v=${v.id}`,
  }));

  // 채널이 없는 계정(시청 전용)도 있으므로 실패해도 목록은 그대로 사용
  let accountLabel = 'Google 계정';
  try {
    const channelRes = await fetch('https://www.googleapis.com/youtube/v3/channels?part=snippet&mine=true', {
      headers: authHeader,
    });
    if (channelRes.ok) {
      const channelData = await channelRes.json();
      accountLabel = channelData.items?.[0]?.snippet?.title ?? accountLabel;
    }
  } catch {
    // 무시
  }

  return { accountLabel, itemCount: items.length, items };
}

const DRIVE_MIME_LABELS: Record<string, string> = {
  'application/pdf': 'PDF 문서',
  'application/epub+zip': '전자책 (EPUB)',
  'application/vnd.google-apps.document': 'Google 문서',
  'application/vnd.google-apps.spreadsheet': 'Google 스프레드시트',
  'application/vnd.google-apps.presentation': 'Google 프레젠테이션',
  'text/plain': '텍스트 메모',
};

function driveMimeLabel(mimeType: string): string {
  if (DRIVE_MIME_LABELS[mimeType]) return DRIVE_MIME_LABELS[mimeType];
  if (mimeType.startsWith('image/')) return '이미지';
  if (mimeType.startsWith('video/')) return '동영상';
  if (mimeType.startsWith('audio/')) return '오디오';
  return '파일';
}

/**
 * Google Drive: 최근 수정한 파일 목록 (메타데이터 전용 권한이라 파일 내용은
 * 읽지 않고 제목·형식만 취향 분석에 활용합니다).
 */
export async function fetchDriveActivity(accessToken: string): Promise<GoogleActivityResult> {
  const authHeader = { Authorization: `Bearer ${accessToken}` };

  const params = new URLSearchParams({
    pageSize: '25',
    orderBy: 'modifiedTime desc',
    q: "trashed = false and mimeType != 'application/vnd.google-apps.folder'",
    fields: 'files(id,name,mimeType,webViewLink)',
  });

  const filesRes = await fetch(`https://www.googleapis.com/drive/v3/files?${params.toString()}`, {
    headers: authHeader,
  });
  if (!filesRes.ok) {
    throw new Error(
      filesRes.status === 401
        ? 'Google Drive 인증이 만료되었습니다. 다시 로그인해주세요.'
        : `Drive 파일 목록을 불러오지 못했습니다 (${filesRes.status})`
    );
  }
  const filesData = await filesRes.json();

  const items: PlatformActivityItem[] = (filesData.files ?? []).map((f: any) => ({
    id: `drive_${f.id}`,
    title: f.name,
    subtitle: driveMimeLabel(f.mimeType ?? ''),
    url: f.webViewLink,
  }));

  let accountLabel = 'Google Drive';
  try {
    const aboutRes = await fetch('https://www.googleapis.com/drive/v3/about?fields=user(displayName)', {
      headers: authHeader,
    });
    if (aboutRes.ok) {
      const about = await aboutRes.json();
      accountLabel = about.user?.displayName ?? accountLabel;
    }
  } catch {
    // 무시
  }

  return { accountLabel, itemCount: items.length, items };
}

/**
 * Google Takeout "watch-history.json" 파싱
 * (Takeout > YouTube 및 YouTube Music > 기록 > watch-history.json)
 * 전체 시청기록은 API로 제공되지 않아 이 파일 가져오기가 유일한 방법이며,
 * 네트워크 전송 없이 브라우저에서만 처리됩니다.
 */
export async function parseYoutubeTakeoutFile(file: File): Promise<PlatformActivityItem[]> {
  const text = await file.text();
  let raw: any;
  try {
    raw = JSON.parse(text);
  } catch {
    throw new Error('올바른 JSON 파일이 아닙니다. Google Takeout의 watch-history.json 파일을 업로드해주세요.');
  }
  if (!Array.isArray(raw)) {
    throw new Error('예상한 형식이 아닙니다. Google Takeout의 watch-history.json 파일을 업로드해주세요.');
  }

  return raw
    .filter((entry: any) => typeof entry?.title === 'string')
    .slice(0, 300)
    .map((entry: any, idx: number) => ({
      id: `takeout_${entry.time ?? idx}_${idx}`,
      title: String(entry.title).replace(/^Watched\s+/, ''),
      subtitle: entry.subtitles?.[0]?.name,
      url: entry.titleUrl,
    }));
}
