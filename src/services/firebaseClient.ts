import type { FirebaseApp } from 'firebase/app';
import type { Auth, User } from 'firebase/auth';
import type { Firestore } from 'firebase/firestore';

/**
 * ============================================================================
 * [취향팔레트 - Firebase 초기화 & 익명 로그인]
 * ============================================================================
 * 회원가입 없이 익명 인증(signInAnonymously)으로 사용자 식별자(uid)를 발급받아
 * 회원 정보를 Firestore에 저장합니다. 비밀번호를 받지 않으므로 로그인 마찰이
 * 없고, 같은 브라우저에서는 동일한 uid가 유지됩니다.
 *
 * Firebase SDK는 용량이 크고 이 앱에서는 '선택 기능'이므로 정적 import 대신
 * 동적 import로 분리합니다. 환경변수가 없으면 SDK를 아예 내려받지 않고
 * localStorage만으로 정상 동작합니다.
 * ============================================================================
 */

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY ?? '',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN ?? '',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID ?? '',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET ?? '',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID ?? '',
  appId: import.meta.env.VITE_FIREBASE_APP_ID ?? '',
};

export function isFirebaseConfigured(): boolean {
  return !!(firebaseConfig.apiKey && firebaseConfig.projectId && firebaseConfig.appId);
}

interface FirebaseHandles {
  app: FirebaseApp;
  auth: Auth;
  db: Firestore;
}

let handlesPromise: Promise<FirebaseHandles | null> | null = null;
let handles: FirebaseHandles | null = null;

/** Firebase SDK를 필요할 때 한 번만 내려받아 초기화 */
function loadFirebase(): Promise<FirebaseHandles | null> {
  if (handlesPromise) return handlesPromise;
  if (!isFirebaseConfigured()) return Promise.resolve(null);

  handlesPromise = (async () => {
    try {
      const [{ initializeApp }, { getAuth }, { getFirestore }] = await Promise.all([
        import('firebase/app'),
        import('firebase/auth'),
        import('firebase/firestore'),
      ]);

      const app = initializeApp(firebaseConfig);
      handles = { app, auth: getAuth(app), db: getFirestore(app) };
      return handles;
    } catch (err) {
      console.error('[Firebase] 초기화에 실패했습니다. localStorage 전용 모드로 동작합니다.', err);
      return null;
    }
  })();

  return handlesPromise;
}

let signInPromise: Promise<User | null> | null = null;

/**
 * 익명 로그인 보장. 이미 세션이 있으면 그대로 재사용하고,
 * 여러 번 호출해도 로그인 요청은 한 번만 나갑니다.
 */
export function ensureAnonymousSignIn(): Promise<User | null> {
  if (signInPromise) return signInPromise;

  signInPromise = (async () => {
    const loaded = await loadFirebase();
    if (!loaded) return null;

    const { onAuthStateChanged, signInAnonymously } = await import('firebase/auth');
    const auth = loaded.auth;

    return new Promise<User | null>(resolve => {
      let settled = false;
      const finish = (user: User | null) => {
        if (settled) return;
        settled = true;
        resolve(user);
      };

      const unsubscribe = onAuthStateChanged(auth, user => {
        if (user) {
          unsubscribe();
          finish(user);
        }
      });

      signInAnonymously(auth).catch(err => {
        console.error('[Firebase Auth] 익명 로그인에 실패했습니다.', err);
        unsubscribe();
        finish(null);
      });

      // 네트워크가 막혀 있어도 앱이 멈추지 않도록 타임아웃
      setTimeout(() => {
        unsubscribe();
        finish(auth.currentUser);
      }, 8000);
    });
  })();

  return signInPromise;
}

export function getCurrentUid(): string | null {
  return handles?.auth.currentUser?.uid ?? null;
}

/**
 * 사용자 문서를 Firestore에 병합 저장합니다.
 * payload는 firebaseStore.buildFirestorePayload()가 화이트리스트로 만든 값이어야 합니다.
 */
export async function writeUserDoc(uid: string, payload: Record<string, unknown>): Promise<void> {
  const loaded = await loadFirebase();
  if (!loaded) return;

  const { doc, setDoc, serverTimestamp } = await import('firebase/firestore');
  await setDoc(
    doc(loaded.db, 'users', uid),
    { ...payload, updatedAt: serverTimestamp() },
    { merge: true }
  );
}
