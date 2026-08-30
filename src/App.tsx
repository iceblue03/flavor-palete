/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Header } from './components/Header';
import { TasteAnalysisView } from './components/TasteAnalysisView';
import { RecommendationsView } from './components/RecommendationsView';
import { CollaborativeFilteringView } from './components/CollaborativeFilteringView';
import { MyPaletteView } from './components/MyPaletteView';
import { PlatformSyncModal } from './components/PlatformSyncModal';
import { MediaDetailModal } from './components/MediaDetailModal';
import { AddWorkModal } from './components/AddWorkModal';
import { FirebaseInspectorModal } from './components/FirebaseInspectorModal';
import { OnboardingTestModal } from './components/OnboardingTestModal';
import { AccountLinkModal } from './components/AccountLinkModal';
import { TasteScorePanel } from './components/TasteScorePanel';
import {
  loadStoredAppData,
  saveStoredAppData,
  addWatchedWorkToStore,
  toggleLikeWorkInStore,
  updatePlatformConnectionsInStore,
  saveOnboardingResultToStore,
  dismissWelcomeInStore,
  INITIAL_PLATFORMS,
} from './services/firebaseStore';
import { ensureAnonymousSignIn, isFirebaseConfigured } from './services/firebaseClient';
import { computeTasteScore, computeTrendResistance } from './services/tasteScoring';
import {
  determineUserArchetype,
  runCollaborativeFiltering,
} from './utils/collaborativeFiltering';
import {
  ConsumedWork,
  MediaItem,
  OnboardingResult,
  PlatformActivityItem,
  PlatformConnection,
  StoredAppData,
  TasteArchetype,
  TasteDNAScores,
} from './types';
import { ALL_MEDIA_ITEMS } from './data/contentsData';
import {
  requestGoogleToken,
  getStoredGoogleToken,
  hasGrantedScope,
  revokeScope,
  fetchYoutubeActivity,
  fetchDriveActivity,
  parseYoutubeTakeoutFile,
  GoogleScopeKey,
} from './services/googleAuth';
import { DEMO_X_ITEMS, DEMO_X_ACCOUNT_LABEL } from './data/demoXData';
import { DEMO_PINTEREST_ITEMS, DEMO_PINTEREST_ACCOUNT_LABEL } from './data/demoPinterestData';

const DEMO_PLATFORM_DATA: Record<string, { items: PlatformActivityItem[]; label: string }> = {
  x: { items: DEMO_X_ITEMS, label: DEMO_X_ACCOUNT_LABEL },
  pinterest: { items: DEMO_PINTEREST_ITEMS, label: DEMO_PINTEREST_ACCOUNT_LABEL },
};

function nowLabel(): string {
  return new Date().toISOString().replace('T', ' ').slice(0, 16);
}

export default function App() {
  // 1. Initial State from Store
  const [storedData, setStoredData] = useState<StoredAppData>(() => loadStoredAppData());
  const [platforms, setPlatforms] = useState<PlatformConnection[]>(
    () => storedData.platformConnections ?? INITIAL_PLATFORMS
  );
  const [syncLoadingIds, setSyncLoadingIds] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<'analysis' | 'recommendations' | 'collaborative' | 'mypalette'>('analysis');

  // Modals state
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isFirebaseModalOpen, setIsFirebaseModalOpen] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState<MediaItem | null>(null);

  // 첫 방문이면 계정 연동 팝업을 띄움 (취향 테스트는 별도의 선택 기능)
  const [isWelcomeOpen, setIsWelcomeOpen] = useState(() => !storedData.welcomeDismissed);
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);
  const [firebaseUid, setFirebaseUid] = useState<string | null>(null);

  // 2. 성향 분석 점수: 테스트 응답 + 보관함 + 연동 플랫폼을 가중 합산
  const [customDnaScores, setCustomDnaScores] = useState<TasteDNAScores | null>(null);

  const scoreBreakdown = useMemo(() => {
    return computeTasteScore({
      onboarding: storedData.onboarding,
      watchedWorks: storedData.watchedWorks,
      platforms,
    });
  }, [storedData.onboarding, storedData.watchedWorks, platforms]);

  const currentDnaScores = useMemo<TasteDNAScores>(() => {
    if (customDnaScores) return customDnaScores;
    return scoreBreakdown.finalScores;
  }, [customDnaScores, scoreBreakdown]);

  const trendResistance = useMemo(
    () => computeTrendResistance(currentDnaScores),
    [currentDnaScores]
  );

  // 3. User Archetype dynamically determined from DNA
  const currentArchetype = useMemo<TasteArchetype>(() => {
    const base = determineUserArchetype(currentDnaScores);
    // 아키타입 고정값 대신 실제 분석 점수로 산출한 지수를 사용
    return { ...base, trendResistanceScore: trendResistance };
  }, [currentDnaScores, trendResistance]);

  // 4. Collaborative Filtering Recommendations
  const currentRecommendations = useMemo<MediaItem[]>(() => {
    return runCollaborativeFiltering(currentDnaScores, storedData.watchedWorks, ALL_MEDIA_ITEMS);
  }, [currentDnaScores, storedData.watchedWorks]);

  // Update stored data whenever archetype, recommendations or scores change.
  // Must go through setStoredData (not just saveStoredAppData) so scoreBreakdown
  // actually lands in React state — otherwise any later `prev => ({...prev, ...})`
  // update (toggling a platform, closing a modal, etc.) silently drops it again.
  useEffect(() => {
    setStoredData(prev => {
      const updated: StoredAppData = {
        ...prev,
        userType: currentArchetype,
        recommendedWorks: currentRecommendations,
        scoreBreakdown,
      };
      saveStoredAppData(updated);
      return updated;
    });
  }, [currentArchetype, currentRecommendations, scoreBreakdown]);

  // Firebase 익명 로그인 — 회원 식별자(uid)를 발급받아 저장에 사용
  useEffect(() => {
    if (!isFirebaseConfigured()) return;
    ensureAnonymousSignIn().then(user => setFirebaseUid(user?.uid ?? null));
  }, []);

  // Handlers
  const handleToggleLike = useCallback((mediaId: string) => {
    setStoredData(prev => toggleLikeWorkInStore(mediaId, prev));
  }, []);

  const handleAddWatchedWork = useCallback((media: MediaItem | Omit<ConsumedWork, 'id' | 'reviewedAt'>) => {
    if ('categoryLabel' in media) {
      // MediaItem passed
      const work: Omit<ConsumedWork, 'id' | 'reviewedAt'> = {
        mediaItemId: media.id,
        title: media.title,
        category: media.category,
        creator: media.creator,
        coverUrl: media.coverUrl,
        userRating: 5,
        sourcePlatform: '취향팔레트 추천',
        tags: media.tags,
        userNote: '취향팔레트 맞춤 추천으로 감상 완료한 작품',
      };
      setStoredData(prev => addWatchedWorkToStore(work, prev));
    } else {
      // Custom work form passed
      setStoredData(prev => addWatchedWorkToStore(media, prev));
    }
  }, []);

  const patchPlatform = useCallback((id: string, patch: Partial<PlatformConnection>) => {
    setPlatforms(prev => {
      const next = prev.map(p => (p.id === id ? { ...p, ...patch } : p));
      setStoredData(current => updatePlatformConnectionsInStore(next, current));
      return next;
    });
  }, []);

  const setSyncing = (id: string, loading: boolean) => {
    setSyncLoadingIds(prev => (loading ? [...new Set([...prev, id])] : prev.filter(x => x !== id)));
  };

  // YouTube와 Drive는 같은 Google 토큰을 공유하므로 동기화 경로도 하나로 묶습니다.
  const syncGoogleService = useCallback(async (scopeKey: GoogleScopeKey, accessToken: string) => {
    setSyncing(scopeKey, true);
    try {
      const result =
        scopeKey === 'youtube'
          ? await fetchYoutubeActivity(accessToken)
          : await fetchDriveActivity(accessToken);
      patchPlatform(scopeKey, {
        connected: true,
        accountLabel: result.accountLabel,
        itemCount: result.itemCount,
        previewItems: result.items,
        lastSyncedAt: nowLabel(),
        error: undefined,
      });
    } catch (err) {
      patchPlatform(scopeKey, { error: err instanceof Error ? err.message : '동기화에 실패했습니다.' });
    } finally {
      setSyncing(scopeKey, false);
    }
  }, [patchPlatform]);

  // Restore an already-authorized Google session so "실시간 동기화" survives a
  // page reload. Each service resyncs only if its scope was actually granted.
  useEffect(() => {
    const existing = getStoredGoogleToken();
    if (!existing) return;
    (['youtube', 'drive'] as GoogleScopeKey[]).forEach(scopeKey => {
      if (hasGrantedScope(scopeKey)) syncGoogleService(scopeKey, existing.accessToken);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleConnectGoogle = useCallback(async (scopeKey: GoogleScopeKey) => {
    setSyncing(scopeKey, true);
    try {
      // 이미 로그인돼 해당 권한까지 있으면 동의 창 없이 바로 재동기화
      const existing = getStoredGoogleToken();
      const auth = existing && hasGrantedScope(scopeKey) ? existing : await requestGoogleToken(scopeKey);
      await syncGoogleService(scopeKey, auth.accessToken);
    } catch (err) {
      patchPlatform(scopeKey, { error: err instanceof Error ? err.message : 'Google 로그인에 실패했습니다.' });
    } finally {
      setSyncing(scopeKey, false);
    }
  }, [syncGoogleService, patchPlatform]);

  // 첫 방문 팝업은 별도 흐름 없이 데이터 연동 센터와 동일한 토글들을 그대로 재사용하고,
  // "확인"을 누르면(연동 여부와 무관하게) 다시 뜨지 않도록 표시만 남깁니다.
  const handleCloseWelcome = useCallback(() => {
    setStoredData(prev => dismissWelcomeInStore(prev));
    setIsWelcomeOpen(false);
  }, []);

  const handleDisconnectPlatform = useCallback((platformId: string) => {
    if (platformId === 'youtube' || platformId === 'drive') {
      revokeScope(platformId);
    }
    patchPlatform(platformId, {
      connected: false,
      itemCount: 0,
      previewItems: [],
      accountLabel: undefined,
      lastSyncedAt: undefined,
      error: undefined,
    });
  }, [patchPlatform]);

  // X·Pinterest 등 '예시 데이터' 플랫폼 공용 토글. 켜면 미리 정의된 데이터를 채우고
  // 끄면 반영된 항목·건수·계정 라벨을 전부 원복합니다.
  const handleToggleDemoPlatform = useCallback((platformId: string) => {
    const demo = DEMO_PLATFORM_DATA[platformId];
    if (!demo) return;

    setPlatforms(prev => {
      const current = prev.find(p => p.id === platformId);
      const nextConnected = !current?.connected;
      const next = prev.map(p =>
        p.id === platformId
          ? {
              ...p,
              connected: nextConnected,
              itemCount: nextConnected ? demo.items.length : 0,
              previewItems: nextConnected ? demo.items : [],
              accountLabel: nextConnected ? demo.label : undefined,
              lastSyncedAt: nextConnected ? nowLabel() : undefined,
              error: undefined,
            }
          : p
      );
      setStoredData(current2 => updatePlatformConnectionsInStore(next, current2));
      return next;
    });
  }, []);

  const handleUploadTakeout = useCallback((file: File) => {
    setSyncing('youtube', true);
    parseYoutubeTakeoutFile(file)
      .then(items => {
        setPlatforms(prev => {
          const current = prev.find(p => p.id === 'youtube');
          const existingIds = new Set((current?.previewItems ?? []).map(i => i.id));
          const merged = [...(current?.previewItems ?? []), ...items.filter(i => !existingIds.has(i.id))];
          const next = prev.map(p =>
            p.id === 'youtube'
              ? {
                  ...p,
                  connected: true,
                  itemCount: merged.length,
                  previewItems: merged,
                  accountLabel: p.accountLabel ?? 'Google Takeout 가져오기',
                  lastSyncedAt: nowLabel(),
                  error: undefined,
                }
              : p
          );
          setStoredData(current2 => updatePlatformConnectionsInStore(next, current2));
          return next;
        });
      })
      .catch(err => {
        patchPlatform('youtube', { error: err instanceof Error ? err.message : 'Takeout 파일을 처리하지 못했습니다.' });
      })
      .finally(() => setSyncing('youtube', false));
  }, [patchPlatform]);

  const handleUpdateDnaScores = useCallback((newScores: TasteDNAScores) => {
    setCustomDnaScores(newScores);
  }, []);

  const handleCompleteOnboarding = useCallback((result: OnboardingResult) => {
    setCustomDnaScores(null); // 수동 조정값을 지우고 테스트 결과 기준으로 재분석
    setStoredData(prev => saveOnboardingResultToStore(result, prev));
    setIsOnboardingOpen(false);
  }, []);

  const handleSkipOnboarding = useCallback(() => {
    // 건너뛰어도 다시 묻지 않도록 완료 표시 (점수는 남기지 않음)
    setStoredData(prev =>
      saveOnboardingResultToStore({ completed: true, answers: {} }, prev)
    );
    setIsOnboardingOpen(false);
  }, []);

  const handleRetakeTest = useCallback(() => {
    setIsOnboardingOpen(true);
  }, []);

  return (
    <div className="min-h-screen bg-[#FCFAF7] text-[#4A4A4A] flex flex-col selection:bg-[#FF8B7E] selection:text-white">
      
      {/* Global Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        archetype={currentArchetype}
        platforms={platforms}
        onOpenSyncModal={() => setIsSyncModalOpen(true)}
        storedData={storedData}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8">
        
        {/* Tab 1: 취향 분석 & 유형 찾기 화면 */}
        {activeTab === 'analysis' && (
          <TasteAnalysisView
            archetype={currentArchetype}
            dnaScores={currentDnaScores}
            storedData={storedData}
            onNavigateToRecommendations={() => setActiveTab('recommendations')}
            onNavigateToCollaborative={() => setActiveTab('collaborative')}
            onOpenSyncModal={() => setIsSyncModalOpen(true)}
            onUpdateDnaScores={handleUpdateDnaScores}
            onSelectMedia={item => setSelectedMedia(item)}
          />
        )}

        {/* 성향 분석 점수 시스템 (분석 탭 하단) */}
        {activeTab === 'analysis' && (
          <div className="mt-8">
            <TasteScorePanel
              breakdown={scoreBreakdown}
              trendResistance={trendResistance}
              firebaseEnabled={isFirebaseConfigured()}
              firebaseUid={firebaseUid}
              onRetakeTest={handleRetakeTest}
            />
          </div>
        )}

        {/* Tab 2: 3대 미디어 맞춤 추천 (책, 영화, 웹툰) */}
        {activeTab === 'recommendations' && (
          <RecommendationsView
            items={currentRecommendations}
            archetype={currentArchetype}
            storedData={storedData}
            onToggleLike={handleToggleLike}
            onSelectMedia={item => setSelectedMedia(item)}
            onAddWatchedWork={handleAddWatchedWork}
          />
        )}

        {/* Tab 3: 협업 필터링 도플갱어 클러스터 */}
        {activeTab === 'collaborative' && (
          <CollaborativeFilteringView
            archetype={currentArchetype}
            dnaScores={currentDnaScores}
            storedData={storedData}
            onSelectMedia={item => setSelectedMedia(item)}
          />
        )}

        {/* Tab 4: 나의 팔레트 보관함 & 저장 데이터 */}
        {activeTab === 'mypalette' && (
          <MyPaletteView
            storedData={storedData}
            archetype={currentArchetype}
            onOpenAddModal={() => setIsAddModalOpen(true)}
            onToggleLike={handleToggleLike}
            onSelectMedia={item => setSelectedMedia(item)}
          />
        )}

      </main>

      {/* Footer */}
      <footer className="border-t border-[#EBE3D5] bg-white py-8 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#A89F91]">
          <div className="flex items-center space-x-2">
            <span className="font-bold text-[#333333] font-['Outfit',sans-serif]">취향팔레트 (Taste Palette)</span>
            <span>·</span>
            <span>데이터 분석을 통한 개인별 맞춤 취향 큐레이션</span>
          </div>

          <div className="flex items-center space-x-4">
            <button
              onClick={() => setIsFirebaseModalOpen(true)}
              className="text-[#7C7469] hover:text-[#333333] font-mono text-[11px] cursor-pointer"
            >
              // Firebase Firestore Architecture
            </button>
            <span>·</span>
            <span>책 📚 · 영화 🎬 · 웹툰 🎨</span>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <AccountLinkModal
        isOpen={isWelcomeOpen}
        platforms={platforms}
        loadingIds={syncLoadingIds}
        onConnectGoogle={handleConnectGoogle}
        onDisconnect={handleDisconnectPlatform}
        onToggleDemo={handleToggleDemoPlatform}
        onClose={handleCloseWelcome}
      />

      <OnboardingTestModal
        isOpen={isOnboardingOpen}
        onComplete={handleCompleteOnboarding}
        onSkip={handleSkipOnboarding}
      />

      <PlatformSyncModal
        isOpen={isSyncModalOpen}
        onClose={() => setIsSyncModalOpen(false)}
        platforms={platforms}
        loadingIds={syncLoadingIds}
        onConnectGoogle={handleConnectGoogle}
        onDisconnect={handleDisconnectPlatform}
        onToggleDemo={handleToggleDemoPlatform}
        onUploadTakeout={handleUploadTakeout}
      />

      <MediaDetailModal
        item={selectedMedia}
        isOpen={!!selectedMedia}
        onClose={() => setSelectedMedia(null)}
        storedData={storedData}
        onToggleLike={handleToggleLike}
        onAddWatchedWork={handleAddWatchedWork}
      />

      <AddWorkModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAddWork={handleAddWatchedWork}
      />

      <FirebaseInspectorModal
        isOpen={isFirebaseModalOpen}
        onClose={() => setIsFirebaseModalOpen(false)}
        storedData={storedData}
      />

    </div>
  );
}
