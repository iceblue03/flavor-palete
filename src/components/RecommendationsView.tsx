import React, { useState, useMemo } from 'react';
import { BookOpen, Film, Palette, Sparkles, Diamond, Star, Heart, Check, Filter, Search, ArrowUpDown, Info } from 'lucide-react';
import { MediaItem, MediaType, StoredAppData, TasteArchetype } from '../types';

interface RecommendationsViewProps {
  items: MediaItem[];
  archetype: TasteArchetype;
  storedData: StoredAppData;
  onToggleLike: (mediaId: string) => void;
  onSelectMedia: (item: MediaItem) => void;
  onAddWatchedWork: (item: MediaItem) => void;
}

export const RecommendationsView: React.FC<RecommendationsViewProps> = ({
  items,
  archetype,
  storedData,
  onToggleLike,
  onSelectMedia,
  onAddWatchedWork,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<'all' | MediaType | 'hidden_gem'>('all');
  const [sortBy, setSortBy] = useState<'cf' | 'gem' | 'rating' | 'year'>('cf');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredItems = useMemo(() => {
    return items.filter(item => {
      // Category filter
      if (selectedCategory === 'hidden_gem') {
        if (item.hiddenGemScore < 85) return false;
      } else if (selectedCategory !== 'all') {
        if (item.category !== selectedCategory) return false;
      }

      // Search filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchTitle = item.title.toLowerCase().includes(query);
        const matchCreator = item.creator.toLowerCase().includes(query);
        const matchTag = item.tags.some(t => t.toLowerCase().includes(query));
        if (!matchTitle && !matchCreator && !matchTag) return false;
      }

      return true;
    }).sort((a, b) => {
      if (sortBy === 'cf') return b.peerMatchRate - a.peerMatchRate;
      if (sortBy === 'gem') return b.hiddenGemScore - a.hiddenGemScore;
      if (sortBy === 'rating') return b.rating - a.rating;
      if (sortBy === 'year') return b.releaseYear - a.releaseYear;
      return 0;
    });
  }, [items, selectedCategory, sortBy, searchQuery]);

  const categoryCounts = useMemo(() => {
    return {
      all: items.length,
      book: items.filter(i => i.category === 'book').length,
      movie: items.filter(i => i.category === 'movie').length,
      webtoon: items.filter(i => i.category === 'webtoon').length,
      hidden_gem: items.filter(i => i.hiddenGemScore >= 85).length,
    };
  }, [items]);

  return (
    <div className="space-y-6 pb-12">
      
      {/* Header Banner */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#EBE3D5] shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <span
                className="px-3.5 py-1 rounded-full text-xs font-bold text-white shadow-xs"
                style={{ backgroundColor: archetype.primaryColor }}
              >
                {archetype.name} 맞춤형
              </span>
              <span className="text-xs font-bold text-[#4A7C59] bg-[#E8F3EB] px-2.5 py-0.5 rounded-full border border-[#84A98C]/30">
                협업 필터링 추천 엔진 가동 중
              </span>
            </div>
            <h2 className="text-xl sm:text-3xl font-bold text-[#333333] mt-2">
              취향 저격 책 · 영화 · 웹툰 큐레이션
            </h2>
            <p className="text-xs sm:text-sm text-[#7C7469] mt-1">
              단순 조회수나 랭킹이 아닌, 나와 취향 DNA가 90% 이상 일치하는 또래들이 보증한 숨은 명작들입니다.
            </p>
          </div>

          {/* Quick Stat Pill */}
          <div className="flex items-center space-x-3 bg-[#F5F1EB]/70 p-3 rounded-2xl border border-[#EBE3D5] shrink-0">
            <div className="text-center px-3 border-r border-[#EBE3D5]">
              <div className="text-xs text-[#888888] font-medium">총 추천작</div>
              <div className="text-lg font-bold text-[#333333]">{items.length}편</div>
            </div>
            <div className="text-center px-3 border-r border-[#EBE3D5]">
              <div className="text-xs text-[#888888] font-medium">숨은 명작</div>
              <div className="text-lg font-bold text-[#4A7C59]">{categoryCounts.hidden_gem}편</div>
            </div>
            <div className="text-center px-3">
              <div className="text-xs text-[#888888] font-medium">찜한 작품</div>
              <div className="text-lg font-bold text-[#FF8B7E]">{storedData.likedWorkIds.length}개</div>
            </div>
          </div>
        </div>

        {/* Filter Tabs & Search Bar */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mt-6 pt-6 border-t border-[#EBE3D5]">
          
          {/* Category Tabs */}
          <div className="flex items-center space-x-1.5 overflow-x-auto no-scrollbar pb-1 sm:pb-0">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`flex items-center space-x-1.5 px-4 py-2 rounded-full text-xs font-bold shrink-0 transition-all cursor-pointer ${
                selectedCategory === 'all'
                  ? 'bg-[#333333] text-white shadow-xs'
                  : 'bg-[#F5F1EB] text-[#7C7469] hover:bg-[#EBE3D5]'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-[#FFD275]" />
              <span>전체 ({categoryCounts.all})</span>
            </button>

            <button
              onClick={() => setSelectedCategory('book')}
              className={`flex items-center space-x-1.5 px-4 py-2 rounded-full text-xs font-bold shrink-0 transition-all cursor-pointer ${
                selectedCategory === 'book'
                  ? 'bg-[#4A7C59] text-white shadow-xs'
                  : 'bg-[#F5F1EB] text-[#7C7469] hover:bg-[#EBE3D5]'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>책 · 소설 ({categoryCounts.book})</span>
            </button>

            <button
              onClick={() => setSelectedCategory('movie')}
              className={`flex items-center space-x-1.5 px-4 py-2 rounded-full text-xs font-bold shrink-0 transition-all cursor-pointer ${
                selectedCategory === 'movie'
                  ? 'bg-[#5C6B73] text-white shadow-xs'
                  : 'bg-[#F5F1EB] text-[#7C7469] hover:bg-[#EBE3D5]'
              }`}
            >
              <Film className="w-3.5 h-3.5" />
              <span>영화 · 드라마 ({categoryCounts.movie})</span>
            </button>

            <button
              onClick={() => setSelectedCategory('webtoon')}
              className={`flex items-center space-x-1.5 px-4 py-2 rounded-full text-xs font-bold shrink-0 transition-all cursor-pointer ${
                selectedCategory === 'webtoon'
                  ? 'bg-[#FF8B7E] text-white shadow-xs'
                  : 'bg-[#F5F1EB] text-[#7C7469] hover:bg-[#EBE3D5]'
              }`}
            >
              <Palette className="w-3.5 h-3.5" />
              <span>웹툰 · 만화 ({categoryCounts.webtoon})</span>
            </button>

            <button
              onClick={() => setSelectedCategory('hidden_gem')}
              className={`flex items-center space-x-1.5 px-4 py-2 rounded-full text-xs font-bold shrink-0 transition-all cursor-pointer ${
                selectedCategory === 'hidden_gem'
                  ? 'bg-[#84A98C] text-white shadow-xs'
                  : 'bg-[#F5F1EB] text-[#4A7C59] border border-[#EBE3D5] hover:bg-[#EBE3D5]'
              }`}
            >
              <Diamond className="w-3.5 h-3.5 text-[#FFD275]" />
              <span>💎 숨은 명작만 ({categoryCounts.hidden_gem})</span>
            </button>
          </div>

          {/* Search & Sort controls */}
          <div className="flex items-center space-x-2">
            <div className="relative flex-1 sm:w-60">
              <Search className="w-3.5 h-3.5 text-[#A89F91] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="제목, 작가, 키워드 검색..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-2 bg-[#F5F1EB] border border-[#EBE3D5] rounded-xl text-xs text-[#333333] focus:outline-none focus:border-[#84A98C] focus:bg-white placeholder-[#A89F91]"
              />
            </div>

            <div className="relative shrink-0">
              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value as any)}
                className="px-3 py-2 bg-[#F5F1EB] border border-[#EBE3D5] rounded-xl text-xs font-bold text-[#4A4A4A] appearance-none pr-8 cursor-pointer focus:outline-none focus:border-[#84A98C]"
              >
                <option value="cf">🎯 협업 필터링 추천순</option>
                <option value="gem">💎 숨겨진 명작 순</option>
                <option value="rating">⭐ 평점 높은 순</option>
                <option value="year">📅 최신 공개 순</option>
              </select>
              <ArrowUpDown className="w-3 h-3 text-[#A89F91] absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

        </div>
      </div>

      {/* Grid of Recommended Works */}
      {filteredItems.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-[#EBE3D5]">
          <Info className="w-10 h-10 text-[#A89F91] mx-auto mb-3" />
          <h3 className="text-base font-bold text-[#333333]">일치하는 작품이 없습니다</h3>
          <p className="text-xs text-[#888888] mt-1">검색어나 카테고리 필터를 변경해 보세요.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredItems.map(item => {
            const isLiked = storedData.likedWorkIds.includes(item.id);
            const isWatched = storedData.watchedWorks.some(w => w.mediaItemId === item.id || w.title.includes(item.title));

            return (
              <div
                key={item.id}
                className="bg-white rounded-3xl border border-[#EBE3D5] hover:border-[#84A98C] shadow-xs hover:shadow-lg transition-all duration-300 flex flex-col justify-between overflow-hidden group"
              >
                <div>
                  {/* Card Cover & Badges */}
                  <div className="relative h-48 overflow-hidden bg-[#F5F1EB] cursor-pointer" onClick={() => onSelectMedia(item)}>
                    <img
                      src={item.coverUrl}
                      alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                    {/* Top Floating Badges */}
                    <div className="absolute top-3 left-3 flex items-center space-x-1.5">
                      <span className="px-2.5 py-1 bg-black/60 backdrop-blur-md text-white text-[10px] font-bold rounded-lg border border-white/20">
                        {item.categoryLabel}
                      </span>
                      {item.hiddenGemScore >= 85 && (
                        <span className="px-2.5 py-1 bg-[#84A98C]/90 backdrop-blur-md text-white text-[10px] font-bold rounded-lg shadow-xs flex items-center gap-1">
                          <Diamond className="w-2.5 h-2.5" />
                          히든 젬 {item.hiddenGemScore}점
                        </span>
                      )}
                    </div>

                    {/* Like button top right */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleLike(item.id);
                      }}
                      className={`absolute top-3 right-3 p-2 rounded-full backdrop-blur-md transition-transform active:scale-90 cursor-pointer ${
                        isLiked
                          ? 'bg-[#FF8B7E] text-white shadow-md'
                          : 'bg-black/50 text-white hover:bg-black/70'
                      }`}
                      title={isLiked ? '찜 해제' : '찜하기'}
                    >
                      <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
                    </button>

                    {/* Bottom overlay info: Title & Match Rate */}
                    <div className="absolute bottom-3 left-3 right-3 text-white">
                      <div className="flex items-end justify-between gap-2">
                        <div className="min-w-0">
                          <h3 className="text-lg font-bold tracking-tight leading-snug drop-shadow-md truncate">
                            {item.title}
                          </h3>
                          <p className="text-xs text-white/80 font-medium drop-shadow-xs">
                            {item.creator} · {item.releaseYear}년
                          </p>
                        </div>
                        <div className="shrink-0 text-right">
                          <div className="text-[10px] font-bold text-[#FFD275] uppercase">취향 일치도</div>
                          <div className="text-base font-bold text-[#FFD275] drop-shadow-md">
                            {item.peerMatchRate}%
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="p-5 space-y-3">
                    {/* Collaborative Filtering Reason */}
                    <div className="p-2.5 bg-[#E8F3EB] rounded-xl border border-[#84A98C]/30 text-xs text-[#4A7C59] flex items-start space-x-2">
                      <Sparkles className="w-4 h-4 text-[#84A98C] shrink-0 mt-0.5" />
                      <span className="font-semibold leading-relaxed">
                        {item.cfReason}
                      </span>
                    </div>

                    {/* Synopsis */}
                    <p className="text-xs text-[#4A4A4A] leading-relaxed line-clamp-2">
                      {item.summary}
                    </p>

                    {/* Tags */}
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {item.tags.slice(0, 3).map((tag, tIdx) => (
                        <span
                          key={tIdx}
                          className="px-2 py-0.5 bg-[#F5F1EB] text-[#7C7469] text-[11px] font-semibold rounded-md border border-[#EBE3D5]"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Card Footer: Action Buttons */}
                <div className="p-5 pt-0 border-t border-[#EBE3D5] mt-2 flex items-center justify-between gap-2">
                  <button
                    onClick={() => onSelectMedia(item)}
                    className="flex-1 py-2 px-3 bg-[#F5F1EB] hover:bg-[#EBE3D5] text-[#4A4A4A] rounded-xl text-xs font-bold text-center transition-colors cursor-pointer"
                  >
                    작품 상세 보기
                  </button>

                  <button
                    onClick={() => onAddWatchedWork(item)}
                    disabled={isWatched}
                    className={`py-2 px-3.5 rounded-xl text-xs font-bold flex items-center space-x-1 transition-all cursor-pointer ${
                      isWatched
                        ? 'bg-[#E8F3EB] text-[#4A7C59] border border-[#84A98C]/30 cursor-default'
                        : 'bg-[#84A98C] hover:bg-[#4A7C59] text-white shadow-xs'
                    }`}
                  >
                    {isWatched ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-[#4A7C59]" />
                        <span>본 작품</span>
                      </>
                    ) : (
                      <span>+ 감상 기록</span>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
};
