import React, { useState } from 'react';
import { BookMarked, Plus, Star, Trash2, Edit3, Share2, Check, User, Sparkles, Heart, BookOpen, Film, Palette, ExternalLink } from 'lucide-react';
import { ConsumedWork, MediaItem, StoredAppData, TasteArchetype } from '../types';

interface MyPaletteViewProps {
  storedData: StoredAppData;
  archetype: TasteArchetype;
  onOpenAddModal: () => void;
  onToggleLike: (mediaId: string) => void;
  onSelectMedia: (item: MediaItem) => void;
}

export const MyPaletteView: React.FC<MyPaletteViewProps> = ({
  storedData,
  archetype,
  onOpenAddModal,
  onToggleLike,
  onSelectMedia,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'watched' | 'liked' | 'raw_data'>('watched');
  const [copiedId, setCopiedId] = useState(false);

  const handleCopyId = () => {
    navigator.clipboard.writeText(storedData.userIdentifier);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  const likedMediaItems = storedData.recommendedWorks.filter(item =>
    storedData.likedWorkIds.includes(item.id)
  );

  return (
    <div className="space-y-8 pb-12">
      
      {/* Top User Identifier & Archetype Summary Card (PRD Saved Data View) */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#EBE3D5] shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start space-x-4">
            <div
              className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center text-white text-2xl font-bold shadow-xs shrink-0"
              style={{
                background: `linear-gradient(135deg, ${archetype.primaryColor}, ${archetype.secondaryColor})`,
              }}
            >
              🎨
            </div>

            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className="px-3.5 py-0.5 rounded-full text-xs font-bold text-white shadow-xs"
                  style={{ backgroundColor: archetype.primaryColor }}
                >
                  {archetype.badge}
                </span>
                <span className="text-xs text-[#888888] font-medium">취향 프로필 저장소</span>
              </div>

              <h2 className="text-xl sm:text-2xl font-bold text-[#333333]">
                {archetype.name}의 취향 보관함
              </h2>

              {/* User Identifier (PRD 필수 데이터) */}
              <div className="flex items-center space-x-2 pt-1">
                <span className="text-xs font-mono text-[#7C7469] bg-[#F5F1EB] px-2.5 py-1 rounded-lg border border-[#EBE3D5]">
                  식별자: {storedData.userIdentifier}
                </span>
                <button
                  onClick={handleCopyId}
                  className="text-xs text-[#4A7C59] hover:text-[#386145] font-bold flex items-center gap-1 cursor-pointer"
                >
                  {copiedId ? <Check className="w-3.5 h-3.5 text-[#4A7C59]" /> : null}
                  <span>{copiedId ? '복사완료' : 'ID 복사'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Quick Stats Pill */}
          <div className="grid grid-cols-3 gap-3 bg-[#F5F1EB]/70 p-4 rounded-2xl border border-[#EBE3D5] shrink-0 text-center">
            <div>
              <div className="text-[11px] text-[#888888] font-semibold">시청·열람 작품</div>
              <div className="text-lg font-bold text-[#333333]">{storedData.watchedWorks.length}편</div>
            </div>
            <div className="border-x border-[#EBE3D5] px-3">
              <div className="text-[11px] text-[#888888] font-semibold">보관(찜)한 작품</div>
              <div className="text-lg font-bold text-[#FF8B7E]">{storedData.likedWorkIds.length}편</div>
            </div>
            <div>
              <div className="text-[11px] text-[#888888] font-semibold">유행 탈피율</div>
              <div className="text-lg font-bold text-[#4A7C59]">{archetype.trendResistanceScore}%</div>
            </div>
          </div>
        </div>

        {/* Sub Navigation Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-[#EBE3D5] mt-6 pt-4">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setActiveSubTab('watched')}
              className={`px-4 py-2 rounded-full text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                activeSubTab === 'watched'
                  ? 'bg-[#84A98C] text-white shadow-xs'
                  : 'bg-[#F5F1EB] text-[#7C7469] hover:bg-[#EBE3D5]'
              }`}
            >
              시청/열람한 작품 ({storedData.watchedWorks.length})
            </button>

            <button
              onClick={() => setActiveSubTab('liked')}
              className={`px-4 py-2 rounded-full text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                activeSubTab === 'liked'
                  ? 'bg-[#FF8B7E] text-white shadow-xs'
                  : 'bg-[#F5F1EB] text-[#7C7469] hover:bg-[#EBE3D5]'
              }`}
            >
              찜한 추천 작품 ({likedMediaItems.length})
            </button>

            <button
              onClick={() => setActiveSubTab('raw_data')}
              className={`px-4 py-2 rounded-full text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                activeSubTab === 'raw_data'
                  ? 'bg-[#333333] text-white shadow-xs'
                  : 'bg-[#F5F1EB] text-[#7C7469] hover:bg-[#EBE3D5]'
              }`}
            >
              저장 데이터 원본
            </button>
          </div>

          <button
            onClick={onOpenAddModal}
            className="flex items-center justify-center space-x-1.5 px-4 py-2 bg-[#333333] hover:bg-[#222222] text-white rounded-full text-xs font-bold shadow-xs transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>작품 직접 등록</span>
          </button>
        </div>
      </div>

      {/* SubTab 1: Watched / Consumed Works */}
      {activeSubTab === 'watched' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-[#333333]">
              내 감상 아카이브 ({storedData.watchedWorks.length}편)
            </h3>
            <p className="text-xs text-[#888888]">
              이 데이터가 쌓일수록 협업 필터링 추천 정확도가 올라갑니다.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {storedData.watchedWorks.map(work => (
              <div
                key={work.id}
                className="p-5 bg-white rounded-3xl border border-[#EBE3D5] shadow-xs flex space-x-4 items-start hover:border-[#84A98C] transition-all"
              >
                <img
                  src={work.coverUrl}
                  alt={work.title}
                  className="w-20 h-28 rounded-2xl object-cover shadow-xs shrink-0"
                  referrerPolicy="no-referrer"
                />

                <div className="flex-1 min-w-0 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 bg-[#F5F1EB] text-[#7C7469] text-[10px] font-bold rounded-md border border-[#EBE3D5] flex items-center gap-1">
                      {work.category === 'book' && <BookOpen className="w-2.5 h-2.5 text-[#4A7C59]" />}
                      {work.category === 'movie' && <Film className="w-2.5 h-2.5 text-[#5C6B73]" />}
                      {work.category === 'webtoon' && <Palette className="w-2.5 h-2.5 text-[#FF8B7E]" />}
                      {work.sourcePlatform || '직접등록'}
                    </span>
                    <span className="text-[10px] text-[#A89F91] font-mono">{work.reviewedAt}</span>
                  </div>

                  <h4 className="text-sm font-bold text-[#333333] truncate">
                    {work.title}
                  </h4>
                  <p className="text-xs text-[#888888]">{work.creator}</p>

                  {/* Star Rating */}
                  <div className="flex items-center space-x-1 pt-0.5">
                    {[1, 2, 3, 4, 5].map(star => (
                      <Star
                        key={star}
                        className={`w-3.5 h-3.5 ${
                          star <= work.userRating
                            ? 'text-[#FFD275] fill-[#FFD275]'
                            : 'text-[#EBE3D5]'
                        }`}
                      />
                    ))}
                    <span className="text-xs font-bold text-[#4A7C59] ml-1">
                      {work.userRating}.0
                    </span>
                  </div>

                  {/* User Note */}
                  {work.userNote && (
                    <p className="text-xs text-[#4A7C59] italic bg-[#E8F3EB] p-2.5 rounded-xl border border-[#84A98C]/30 mt-1 line-clamp-2">
                      “{work.userNote}”
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SubTab 2: Liked / Bookmarked Recommendations */}
      {activeSubTab === 'liked' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-[#333333]">
              내가 찜한 맞춤 추천작 ({likedMediaItems.length}편)
            </h3>
            <p className="text-xs text-[#888888]">나중에 꼭 감상하고 싶은 위시리스트</p>
          </div>

          {likedMediaItems.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-[#EBE3D5]">
              <Heart className="w-8 h-8 text-[#FF8B7E] mx-auto mb-2" />
              <p className="text-sm font-bold text-[#333333]">아직 찜한 작품이 없습니다</p>
              <p className="text-xs text-[#888888] mt-1">
                추천 목록에서 마음에 드는 작품의 하트를 눌러보세요!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {likedMediaItems.map(item => (
                <div
                  key={item.id}
                  onClick={() => onSelectMedia(item)}
                  className="bg-white rounded-3xl p-4 border border-[#EBE3D5] hover:border-[#84A98C] shadow-xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
                >
                  <div className="flex space-x-3 mb-3">
                    <img
                      src={item.coverUrl}
                      alt={item.title}
                      className="w-16 h-22 rounded-xl object-cover shadow-xs shrink-0"
                      referrerPolicy="no-referrer"
                    />
                    <div className="min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-[10px] font-bold text-[#4A7C59] bg-[#E8F3EB] px-2 py-0.5 rounded-md border border-[#84A98C]/30">
                          {item.categoryLabel}
                        </span>
                        <span className="text-xs font-bold text-[#4A7C59]">
                          {item.peerMatchRate}% 일치
                        </span>
                      </div>
                      <h4 className="text-sm font-bold text-[#333333] truncate mt-1">
                        {item.title}
                      </h4>
                      <p className="text-xs text-[#888888]">{item.creator}</p>
                      <p className="text-xs text-[#4A4A4A] line-clamp-2 mt-1">
                        {item.summary}
                      </p>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-[#EBE3D5] flex items-center justify-between text-xs">
                    <span className="text-[#888888]">💎 숨은 명작 {item.hiddenGemScore}점</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleLike(item.id);
                      }}
                      className="text-[#FF8B7E] hover:text-[#e06d5f] font-bold cursor-pointer"
                    >
                      찜 해제
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* SubTab 3: Raw PRD Stored Data Inspector */}
      {activeSubTab === 'raw_data' && (
        <div className="bg-[#2A2723] text-[#FCFAF7] rounded-3xl p-6 sm:p-8 font-mono text-xs space-y-4 shadow-sm border border-[#3E3932]">
          <div className="flex items-center justify-between border-b border-[#3E3932] pb-3">
            <span className="text-[#FFD275] font-bold">
              // PRD 데이터 모델 상태 (사용자 유형, 식별자, 시청 작품, 추천 작품)
            </span>
            <span className="text-[#A89F91]">JSON Schema Validated</span>
          </div>

          <pre className="overflow-x-auto p-4 bg-[#1F1D1A] rounded-2xl text-[#EBE3D5] max-h-96 leading-relaxed border border-[#3E3932]">
            {JSON.stringify(
              {
                // PRD 요구사항 1: 식별자
                userIdentifier: storedData.userIdentifier,
                // PRD 요구사항 2: 사용자 유형
                userType: {
                  id: storedData.userType.id,
                  name: storedData.userType.name,
                  badge: storedData.userType.badge,
                  dnaScores: storedData.userType.dnaScores,
                  trendResistanceScore: storedData.userType.trendResistanceScore,
                  primaryColor: storedData.userType.primaryColor,
                },
                // PRD 요구사항 3: 시청 작품 (Watched Works)
                watchedWorksCount: storedData.watchedWorks.length,
                watchedWorks: storedData.watchedWorks,
                // PRD 요구사항 4: 추천 작품 (Recommended Works)
                recommendedWorksCount: storedData.recommendedWorks.length,
                likedWorkIds: storedData.likedWorkIds,
                syncStatus: storedData.syncStatus,
              },
              null,
              2
            )}
          </pre>
        </div>
      )}

    </div>
  );
};
