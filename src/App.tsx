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
import {
  loadStoredAppData,
  saveStoredAppData,
  addWatchedWorkToStore,
  toggleLikeWorkInStore,
  INITIAL_PLATFORMS,
} from './services/firebaseStore';
import {
  deriveUserTasteDNA,
  determineUserArchetype,
  runCollaborativeFiltering,
} from './utils/collaborativeFiltering';
import { ConsumedWork, MediaItem, PlatformConnection, StoredAppData, TasteArchetype, TasteDNAScores } from './types';
import { ALL_MEDIA_ITEMS } from './data/contentsData';

export default function App() {
  // 1. Initial State from Store
  const [storedData, setStoredData] = useState<StoredAppData>(() => loadStoredAppData());
  const [platforms, setPlatforms] = useState<PlatformConnection[]>(INITIAL_PLATFORMS);
  const [activeTab, setActiveTab] = useState<'analysis' | 'recommendations' | 'collaborative' | 'mypalette'>('analysis');

  // Modals state
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isFirebaseModalOpen, setIsFirebaseModalOpen] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState<MediaItem | null>(null);

  // 2. Dynamic Taste Vector (DNA) derived from watched works
  const [customDnaScores, setCustomDnaScores] = useState<TasteDNAScores | null>(null);

  const currentDnaScores = useMemo<TasteDNAScores>(() => {
    if (customDnaScores) return customDnaScores;
    return deriveUserTasteDNA(storedData.watchedWorks);
  }, [customDnaScores, storedData.watchedWorks]);

  // 3. User Archetype dynamically determined from DNA
  const currentArchetype = useMemo<TasteArchetype>(() => {
    return determineUserArchetype(currentDnaScores);
  }, [currentDnaScores]);

  // 4. Collaborative Filtering Recommendations
  const currentRecommendations = useMemo<MediaItem[]>(() => {
    return runCollaborativeFiltering(currentDnaScores, storedData.watchedWorks, ALL_MEDIA_ITEMS);
  }, [currentDnaScores, storedData.watchedWorks]);

  // Update stored data whenever archetype or recommendations change
  useEffect(() => {
    setStoredData(prev => {
      const updated: StoredAppData = {
        ...prev,
        userType: currentArchetype,
        recommendedWorks: currentRecommendations,
      };
      saveStoredAppData(updated);
      return updated;
    });
  }, [currentArchetype, currentRecommendations]);

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

  const handleTogglePlatform = useCallback((platformId: string) => {
    setPlatforms(prev =>
      prev.map(p => {
        if (p.id === platformId) {
          const nextConnected = !p.connected;
          return {
            ...p,
            connected: nextConnected,
            itemCount: nextConnected ? (p.itemCount > 0 ? p.itemCount : 35) : 0,
            lastSyncedAt: nextConnected ? new Date().toISOString().replace('T', ' ').slice(0, 16) : undefined,
          };
        }
        return p;
      })
    );
  }, []);

  const handleUpdateDnaScores = useCallback((newScores: TasteDNAScores) => {
    setCustomDnaScores(newScores);
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
        onOpenFirebaseModal={() => setIsFirebaseModalOpen(true)}
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
      <PlatformSyncModal
        isOpen={isSyncModalOpen}
        onClose={() => setIsSyncModalOpen(false)}
        platforms={platforms}
        onTogglePlatform={handleTogglePlatform}
        onTriggerFullSync={() => {}}
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
