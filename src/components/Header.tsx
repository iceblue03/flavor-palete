import React from 'react';
import { Palette, Sparkles, RefreshCw, Layers, Database, BookMarked, UserCheck } from 'lucide-react';
import { PlatformConnection, StoredAppData, TasteArchetype } from '../types';

interface HeaderProps {
  activeTab: 'analysis' | 'recommendations' | 'collaborative' | 'mypalette';
  setActiveTab: (tab: 'analysis' | 'recommendations' | 'collaborative' | 'mypalette') => void;
  archetype: TasteArchetype;
  platforms: PlatformConnection[];
  onOpenSyncModal: () => void;
  onOpenFirebaseModal: () => void;
  storedData: StoredAppData;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  archetype,
  platforms,
  onOpenSyncModal,
  onOpenFirebaseModal,
  storedData,
}) => {
  const connectedCount = platforms.filter(p => p.connected).length;
  const watchedCount = storedData.watchedWorks.length;

  return (
    <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-[#EBE3D5] shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          
          {/* Logo & Service Branding */}
          <div className="flex items-center space-x-2 sm:space-x-3 cursor-pointer min-w-0 shrink" onClick={() => setActiveTab('analysis')}>
            <div
              className="w-9 h-9 sm:w-10 sm:h-10 lg:w-11 lg:h-11 rounded-full flex items-center justify-center shadow-xs transition-transform hover:scale-105 shrink-0"
              style={{
                background: `linear-gradient(135deg, ${archetype.primaryColor}, ${archetype.secondaryColor})`,
              }}
            >
              <Palette className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center space-x-2">
                <span className="text-base sm:text-xl lg:text-2xl font-bold tracking-tight text-[#333333] font-['Outfit',sans-serif] truncate">
                  취향팔레트
                </span>
                <span className="hidden sm:inline-block shrink-0 px-2.5 py-0.5 text-[10px] font-bold rounded-full bg-[#E8F3EB] text-[#4A7C59] border border-[#84A98C]/30">
                  1020 컬처 DNA
                </span>
              </div>
              <p className="text-xs text-[#888888] hidden lg:block font-medium">
                유행에 휩쓸리지 않는 나만의 책 · 영화 · 웹툰 숨은 명작 발견기
              </p>
            </div>
          </div>

          {/* Center Navigation Tabs */}
          <nav className="hidden xl:flex items-center space-x-1 bg-[#F5F1EB] p-1.5 rounded-2xl border border-[#EBE3D5] shrink-0">
            <button
              onClick={() => setActiveTab('analysis')}
              className={`flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                activeTab === 'analysis'
                  ? 'bg-white text-[#333333] shadow-xs'
                  : 'text-[#7C7469] hover:text-[#333333] hover:bg-white/50'
              }`}
            >
              <Sparkles className="w-4 h-4 text-[#FF8B7E]" />
              <span>취향 분석 & 유형</span>
            </button>

            <button
              onClick={() => setActiveTab('recommendations')}
              className={`flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                activeTab === 'recommendations'
                  ? 'bg-white text-[#333333] shadow-xs'
                  : 'text-[#7C7469] hover:text-[#333333] hover:bg-white/50'
              }`}
            >
              <Layers className="w-4 h-4 text-[#84A98C]" />
              <span>3대 미디어 맞춤 추천</span>
            </button>

            <button
              onClick={() => setActiveTab('collaborative')}
              className={`flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                activeTab === 'collaborative'
                  ? 'bg-white text-[#333333] shadow-xs'
                  : 'text-[#7C7469] hover:text-[#333333] hover:bg-white/50'
              }`}
            >
              <UserCheck className="w-4 h-4 text-[#FF8B7E]" />
              <span>협업 필터링 도플갱어</span>
            </button>

            <button
              onClick={() => setActiveTab('mypalette')}
              className={`flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                activeTab === 'mypalette'
                  ? 'bg-white text-[#333333] shadow-xs'
                  : 'text-[#7C7469] hover:text-[#333333] hover:bg-white/50'
              }`}
            >
              <BookMarked className="w-4 h-4 text-[#4A7C59]" />
              <span>나의 보관함</span>
              <span className="ml-1 px-1.5 py-0.5 bg-[#EBE3D5] text-[#7C7469] rounded-full text-[11px] font-bold">
                {watchedCount}
              </span>
            </button>
          </nav>

          {/* Right Actions: Platform Sync Pill & Firebase Status Button */}
          <div className="flex items-center space-x-2 sm:space-x-3 shrink-0">
            {/* Live Sync Status Indicator */}
            <div className="hidden xl:flex items-center gap-2 text-xs font-medium text-[#888888] px-3 py-1.5 bg-[#F5F1EB]/80 rounded-full border border-[#EBE3D5]">
              <span
                className={`w-2 h-2 rounded-full ${connectedCount > 0 ? 'bg-[#84A98C] animate-pulse' : 'bg-[#D8D0C2]'}`}
              ></span>
              <span>{connectedCount > 0 ? '실시간 동기화 활성' : '연동된 플랫폼 없음'}</span>
            </div>

            {/* Platform Sync Pill Button */}
            <button
              onClick={onOpenSyncModal}
              className="flex items-center space-x-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 bg-white hover:bg-[#F5F1EB] border border-[#EBE3D5] text-[#4A7C59] rounded-xl text-xs font-bold transition-all shadow-xs group cursor-pointer"
              title="OTT, 웹툰, 전자책 플랫폼 데이터 동기화 관리"
            >
              <RefreshCw className="w-3.5 h-3.5 text-[#84A98C] group-hover:rotate-180 transition-transform duration-500" />
              <span className="hidden sm:inline">플랫폼 데이터 연동</span>
              <span className="sm:hidden">연동</span>
              <span className="px-1.5 py-0.5 bg-[#84A98C] text-white rounded-md text-[10px]">
                {connectedCount}개
              </span>
            </button>

            {/* Firebase Store Inspector Button */}
            <button
              onClick={onOpenFirebaseModal}
              className="flex items-center space-x-1 px-2.5 py-1.5 bg-[#F5F1EB] hover:bg-[#EBE3D5] border border-[#EBE3D5] text-[#7C7469] rounded-xl text-xs font-semibold transition-colors cursor-pointer"
              title="PRD 저장 데이터 & Firebase Firestore 연동 상태 확인"
            >
              <Database className="w-3.5 h-3.5 text-[#E07A5F]" />
              <span className="hidden lg:inline text-[11px] font-mono">Firebase DB</span>
            </button>
          </div>
        </div>

        {/* Compact Navigation Row (shown on mobile & tablet, until the full desktop nav fits at xl) */}
        <div className="flex xl:hidden overflow-x-auto py-2 space-x-1 border-t border-[#EBE3D5] no-scrollbar">
          <button
            onClick={() => setActiveTab('analysis')}
            className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-bold ${
              activeTab === 'analysis' ? 'bg-[#333333] text-white' : 'bg-[#F5F1EB] text-[#7C7469]'
            }`}
          >
            취향 분석
          </button>
          <button
            onClick={() => setActiveTab('recommendations')}
            className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-bold ${
              activeTab === 'recommendations' ? 'bg-[#333333] text-white' : 'bg-[#F5F1EB] text-[#7C7469]'
            }`}
          >
            책·영화·웹툰 추천
          </button>
          <button
            onClick={() => setActiveTab('collaborative')}
            className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-bold ${
              activeTab === 'collaborative' ? 'bg-[#333333] text-white' : 'bg-[#F5F1EB] text-[#7C7469]'
            }`}
          >
            협업 필터링
          </button>
          <button
            onClick={() => setActiveTab('mypalette')}
            className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-bold ${
              activeTab === 'mypalette' ? 'bg-[#333333] text-white' : 'bg-[#F5F1EB] text-[#7C7469]'
            }`}
          >
            보관함 ({watchedCount})
          </button>
        </div>
      </div>
    </header>
  );
};
