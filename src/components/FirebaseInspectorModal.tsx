import React from 'react';
import { X, Database, CheckCircle2, Copy, FileCode, Server } from 'lucide-react';
import { StoredAppData } from '../types';

interface FirebaseInspectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  storedData: StoredAppData;
}

export const FirebaseInspectorModal: React.FC<FirebaseInspectorModalProps> = ({
  isOpen,
  onClose,
  storedData,
}) => {
  if (!isOpen) return null;

  const firestoreSchemaSnippet = `// =========================================================================
// [취향팔레트 - Firebase Firestore & Auth 스키마 및 TODO 연동 인터페이스]
// =========================================================================

// 1. Firebase Auth 초기화
// TODO: [Firebase Auth] 익명 로그인 또는 이메일/SNS 토큰 연동
// import { getAuth, signInAnonymously } from 'firebase/auth';

// 2. Cloud Firestore 스키마 구조
// collection('users')
//   └── doc('\${userId}')
//         ├── userIdentifier: "${storedData.userIdentifier}"
//         ├── userType: {
//         │     id: "${storedData.userType.id}",
//         │     name: "${storedData.userType.name}",
//         │     trendResistanceScore: ${storedData.userType.trendResistanceScore}
//         │   }
//         ├── syncStatus: ${JSON.stringify(storedData.syncStatus)}
//         ├── likedWorkIds: [${storedData.likedWorkIds.map(id => `"${id}"`).join(', ')}]
//         │
//         ├── subcollection('watched_works') // 시청/열람 작품 (\${storedData.watchedWorks.length}건)
//         │     └── doc('\${workId}')
//         │           ├── title: "..."
//         │           ├── category: "book" | "movie" | "webtoon"
//         │           ├── userRating: 5
//         │           └── reviewedAt: "2026-08-29"
//         │
//         └── subcollection('palette_recommendations') // 추천 작품 (\${storedData.recommendedWorks.length}건)
//               └── doc('\${mediaId}')
//                     ├── peerMatchRate: 98
//                     └── cfReason: "..."

// TODO: [Firebase Firestore] Cloud Functions를 통한 실시간 협업 필터링 집계
// collection('taste_clusters') -> doc('cluster_402') -> 1020 코호트 유사도 매트릭스 동기화`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-stone-900 text-stone-100 rounded-3xl max-w-3xl w-full p-6 sm:p-8 shadow-2xl border border-stone-700 space-y-6 max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-start justify-between border-b border-stone-800 pb-4">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-amber-500/20 text-amber-400 rounded-2xl border border-amber-500/30">
              <Database className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-lg font-black text-white">Firebase Firestore 스키마 & 상태</h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  TODO Interface Ready
                </span>
              </div>
              <p className="text-xs text-stone-400 mt-0.5">
                PRD 저장 데이터 요구사항 (사용자 유형, 식별자, 시청 작품, 추천 작품) 매핑 현황
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-2xl bg-stone-800 hover:bg-stone-700 text-stone-400 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 4 Required Data Entities Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3 bg-stone-800/80 rounded-2xl border border-stone-700">
            <div className="text-[10px] text-stone-400 uppercase font-mono">1. 식별자 (ID)</div>
            <div className="text-xs font-bold text-amber-400 truncate mt-1">
              {storedData.userIdentifier.slice(0, 14)}...
            </div>
          </div>

          <div className="p-3 bg-stone-800/80 rounded-2xl border border-stone-700">
            <div className="text-[10px] text-stone-400 uppercase font-mono">2. 사용자 유형</div>
            <div className="text-xs font-bold text-rose-400 truncate mt-1">
              {storedData.userType.name}
            </div>
          </div>

          <div className="p-3 bg-stone-800/80 rounded-2xl border border-stone-700">
            <div className="text-[10px] text-stone-400 uppercase font-mono">3. 시청 작품</div>
            <div className="text-xs font-bold text-emerald-400 mt-1">
              {storedData.watchedWorks.length}편 동기화됨
            </div>
          </div>

          <div className="p-3 bg-stone-800/80 rounded-2xl border border-stone-700">
            <div className="text-[10px] text-stone-400 uppercase font-mono">4. 추천 작품</div>
            <div className="text-xs font-bold text-indigo-400 mt-1">
              {storedData.recommendedWorks.length}편 생성됨
            </div>
          </div>
        </div>

        {/* Code Snippet Box */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-stone-400">
            <span className="flex items-center gap-1.5 font-mono">
              <FileCode className="w-3.5 h-3.5 text-amber-400" />
              src/services/firebaseStore.ts
            </span>
          </div>

          <pre className="p-4 bg-stone-950 rounded-2xl border border-stone-800 text-stone-300 font-mono text-xs overflow-x-auto leading-relaxed max-h-72">
            {firestoreSchemaSnippet}
          </pre>
        </div>

        {/* Footer */}
        <div className="flex justify-end pt-2 border-t border-stone-800">
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-stone-950 font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            닫기
          </button>
        </div>

      </div>
    </div>
  );
};
