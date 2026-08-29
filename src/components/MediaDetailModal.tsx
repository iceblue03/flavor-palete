import React from 'react';
import { X, Star, Heart, Check, BookOpen, Film, Palette, Diamond, Sparkles, Share2, Users } from 'lucide-react';
import { MediaItem, StoredAppData } from '../types';

interface MediaDetailModalProps {
  item: MediaItem | null;
  isOpen: boolean;
  onClose: () => void;
  storedData: StoredAppData;
  onToggleLike: (mediaId: string) => void;
  onAddWatchedWork: (item: MediaItem) => void;
}

export const MediaDetailModal: React.FC<MediaDetailModalProps> = ({
  item,
  isOpen,
  onClose,
  storedData,
  onToggleLike,
  onAddWatchedWork,
}) => {
  if (!isOpen || !item) return null;

  const isLiked = storedData.likedWorkIds.includes(item.id);
  const isWatched = storedData.watchedWorks.some(w => w.mediaItemId === item.id || w.title.includes(item.title));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-[#EBE3D5] space-y-6 max-h-[90vh] overflow-y-auto">
        
        {/* Header with Close */}
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-2">
            <span className="px-3 py-1 bg-[#F5F1EB] text-[#4A4A4A] text-xs font-bold rounded-lg border border-[#EBE3D5] flex items-center gap-1.5">
              {item.category === 'book' && <BookOpen className="w-3.5 h-3.5 text-[#4A7C59]" />}
              {item.category === 'movie' && <Film className="w-3.5 h-3.5 text-[#5C6B73]" />}
              {item.category === 'webtoon' && <Palette className="w-3.5 h-3.5 text-[#FF8B7E]" />}
              {item.categoryLabel}
            </span>
            {item.hiddenGemScore >= 85 && (
              <span className="px-3 py-1 bg-[#84A98C] text-white text-xs font-bold rounded-lg shadow-xs flex items-center gap-1">
                <Diamond className="w-3 h-3 text-[#FFD275]" />
                숨겨진 명작 ({item.hiddenGemScore}점)
              </span>
            )}
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-2xl bg-[#F5F1EB] hover:bg-[#EBE3D5] text-[#7C7469] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Media Top Overview */}
        <div className="flex flex-col sm:flex-row gap-5">
          <img
            src={item.coverUrl}
            alt={item.title}
            className="w-full sm:w-44 h-60 rounded-2xl object-cover shadow-md shrink-0"
            referrerPolicy="no-referrer"
          />

          <div className="space-y-3 flex-1">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-[#333333] leading-tight">
                {item.title}
              </h2>
              {item.originalTitle && (
                <p className="text-xs text-[#888888] font-mono mt-0.5">{item.originalTitle}</p>
              )}
              <p className="text-xs sm:text-sm text-[#7C7469] font-semibold mt-1">
                {item.creator} · {item.releaseYear}년
              </p>
            </div>

            {/* Match & Rating Scores */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              <div className="p-3 bg-[#E8F3EB] rounded-xl border border-[#84A98C]/30 text-center">
                <div className="text-[10px] font-bold text-[#4A7C59] uppercase">내 취향 일치도</div>
                <div className="text-xl font-bold text-[#4A7C59]">{item.peerMatchRate}%</div>
              </div>
              <div className="p-3 bg-[#F5F1EB] rounded-xl border border-[#EBE3D5] text-center">
                <div className="text-[10px] font-bold text-[#888888] uppercase">전문가·관객 평점</div>
                <div className="text-xl font-bold text-[#333333]">⭐ {item.rating} / 5.0</div>
              </div>
            </div>

            {/* Tags */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              {item.tags.map((tag, tIdx) => (
                <span
                  key={tIdx}
                  className="px-2.5 py-1 bg-[#F5F1EB] text-[#7C7469] text-xs font-semibold rounded-lg border border-[#EBE3D5]"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Why Recommended Section */}
        <div className="p-4 bg-[#84A98C]/10 rounded-2xl border border-[#84A98C]/30 space-y-1.5">
          <div className="text-xs font-bold text-[#4A7C59] flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-[#84A98C]" />
            <span>취향팔레트 에디터 추천 코멘트</span>
          </div>
          <p className="text-xs sm:text-sm text-[#333333] leading-relaxed font-medium">
            {item.recommendedReason}
          </p>
        </div>

        {/* Collaborative Filtering Insight */}
        <div className="p-4 bg-[#F5F1EB] rounded-2xl border border-[#EBE3D5] space-y-1.5">
          <div className="text-xs font-bold text-[#333333] flex items-center gap-1.5">
            <Users className="w-4 h-4 text-[#84A98C]" />
            <span>협업 필터링(CF) 피어 데이터</span>
          </div>
          <p className="text-xs text-[#7C7469] leading-relaxed">
            {item.cfReason}
          </p>
        </div>

        {/* Synopsis */}
        <div className="space-y-1.5">
          <h4 className="text-xs font-bold text-[#4A4A4A] uppercase tracking-wider">
            작품 줄거리 & 세계관
          </h4>
          <p className="text-xs sm:text-sm text-[#4A4A4A] leading-relaxed bg-[#F5F1EB]/60 p-4 rounded-2xl border border-[#EBE3D5]">
            {item.summary}
          </p>
        </div>

        {/* Bottom Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-[#EBE3D5]">
          <button
            onClick={() => onToggleLike(item.id)}
            className={`w-full sm:w-auto flex items-center justify-center space-x-2 px-5 py-3 rounded-full text-xs font-bold transition-all cursor-pointer ${
              isLiked
                ? 'bg-[#FF8B7E] text-white shadow-xs'
                : 'bg-[#F5F1EB] hover:bg-[#EBE3D5] text-[#4A4A4A]'
            }`}
          >
            <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
            <span>{isLiked ? '찜 완료 (보관됨)' : '나만의 팔레트에 찜하기'}</span>
          </button>

          <button
            onClick={() => {
              onAddWatchedWork(item);
              onClose();
            }}
            disabled={isWatched}
            className={`w-full sm:w-auto flex items-center justify-center space-x-2 px-6 py-3 rounded-full text-xs font-bold transition-all cursor-pointer ${
              isWatched
                ? 'bg-[#E8F3EB] text-[#4A7C59] border border-[#84A98C]/30 cursor-default'
                : 'bg-[#333333] hover:bg-[#222222] text-white shadow-xs'
            }`}
          >
            {isWatched ? (
              <>
                <Check className="w-4 h-4 text-[#4A7C59]" />
                <span>이미 감상 완료한 작품</span>
              </>
            ) : (
              <span>+ 본 작품으로 등록 & 평가</span>
            )}
          </button>
        </div>

      </div>
    </div>
  );
};
