import React, { useState } from 'react';
import { X, Star, BookOpen, Film, Palette, Check } from 'lucide-react';
import { ConsumedWork, MediaType } from '../types';

interface AddWorkModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddWork: (work: Omit<ConsumedWork, 'id' | 'reviewedAt'>) => void;
}

export const AddWorkModal: React.FC<AddWorkModalProps> = ({
  isOpen,
  onClose,
  onAddWork,
}) => {
  const [title, setTitle] = useState('');
  const [creator, setCreator] = useState('');
  const [category, setCategory] = useState<MediaType>('movie');
  const [userRating, setUserRating] = useState<number>(5);
  const [sourcePlatform, setSourcePlatform] = useState('직접입력');
  const [userNote, setUserNote] = useState('');
  const [coverUrl, setCoverUrl] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const defaultCover =
      category === 'book'
        ? 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&w=600&q=80'
        : category === 'webtoon'
        ? 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=600&q=80'
        : 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=600&q=80';

    onAddWork({
      mediaItemId: 'custom_' + Date.now(),
      title: title.trim(),
      category,
      creator: creator.trim() || '작가/감독 미상',
      coverUrl: coverUrl.trim() || defaultCover,
      userRating,
      sourcePlatform,
      tags: ['#직접등록', '#' + (category === 'book' ? '도서' : category === 'webtoon' ? '웹툰' : '영화')],
      userNote: userNote.trim() || undefined,
    });

    // Reset
    setTitle('');
    setCreator('');
    setUserNote('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-[#EBE3D5] space-y-5 max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold text-[#333333]">
              시청/열람 작품 직접 등록
            </h3>
            <p className="text-xs text-[#888888] mt-0.5">
              내가 감상한 작품을 추가하면 취향 팔레트가 더 정교해집니다.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-2xl bg-[#F5F1EB] hover:bg-[#EBE3D5] text-[#7C7469] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Category Select */}
          <div>
            <label className="block text-xs font-bold text-[#4A4A4A] mb-1.5">카테고리</label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setCategory('book')}
                className={`py-2.5 rounded-full text-xs font-bold flex items-center justify-center space-x-1.5 transition-all cursor-pointer ${
                  category === 'book'
                    ? 'bg-[#4A7C59] text-white shadow-xs'
                    : 'bg-[#F5F1EB] text-[#7C7469] hover:bg-[#EBE3D5]'
                }`}
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>책 · 소설</span>
              </button>

              <button
                type="button"
                onClick={() => setCategory('movie')}
                className={`py-2.5 rounded-full text-xs font-bold flex items-center justify-center space-x-1.5 transition-all cursor-pointer ${
                  category === 'movie'
                    ? 'bg-[#5C6B73] text-white shadow-xs'
                    : 'bg-[#F5F1EB] text-[#7C7469] hover:bg-[#EBE3D5]'
                }`}
              >
                <Film className="w-3.5 h-3.5" />
                <span>영화 · 드라마</span>
              </button>

              <button
                type="button"
                onClick={() => setCategory('webtoon')}
                className={`py-2.5 rounded-full text-xs font-bold flex items-center justify-center space-x-1.5 transition-all cursor-pointer ${
                  category === 'webtoon'
                    ? 'bg-[#FF8B7E] text-white shadow-xs'
                    : 'bg-[#F5F1EB] text-[#7C7469] hover:bg-[#EBE3D5]'
                }`}
              >
                <Palette className="w-3.5 h-3.5" />
                <span>웹툰 · 만화</span>
              </button>
            </div>
          </div>

          {/* Title Input */}
          <div>
            <label className="block text-xs font-bold text-[#4A4A4A] mb-1">작품 제목 *</label>
            <input
              type="text"
              required
              placeholder="예: 지구 끝의 온실, 애프터썬, 숲속의 담..."
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-[#F5F1EB] border border-[#EBE3D5] rounded-xl text-xs sm:text-sm text-[#333333] focus:outline-none focus:border-[#84A98C] focus:bg-white placeholder-[#A89F91]"
            />
          </div>

          {/* Creator / Author Input */}
          <div>
            <label className="block text-xs font-bold text-[#4A4A4A] mb-1">작가 / 감독 / 크리에이터</label>
            <input
              type="text"
              placeholder="예: 김초엽, 샬롯 웰스, 다홍..."
              value={creator}
              onChange={e => setCreator(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-[#F5F1EB] border border-[#EBE3D5] rounded-xl text-xs sm:text-sm text-[#333333] focus:outline-none focus:border-[#84A98C] focus:bg-white placeholder-[#A89F91]"
            />
          </div>

          {/* Star Rating */}
          <div>
            <label className="block text-xs font-bold text-[#4A4A4A] mb-1.5">나의 평점</label>
            <div className="flex items-center space-x-2 bg-[#F5F1EB]/70 p-3 rounded-2xl border border-[#EBE3D5]">
              {[1, 2, 3, 4, 5].map(star => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setUserRating(star)}
                  className="p-1 text-[#EBE3D5] hover:scale-125 transition-transform cursor-pointer"
                >
                  <Star
                    className={`w-6 h-6 ${
                      star <= userRating ? 'text-[#FFD275] fill-[#FFD275]' : 'text-[#EBE3D5]'
                    }`}
                  />
                </button>
              ))}
              <span className="text-sm font-bold text-[#4A7C59] ml-2">{userRating}.0점 / 5.0</span>
            </div>
          </div>

          {/* Source Platform */}
          <div>
            <label className="block text-xs font-bold text-[#4A4A4A] mb-1">감상 플랫폼</label>
            <select
              value={sourcePlatform}
              onChange={e => setSourcePlatform(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-[#F5F1EB] border border-[#EBE3D5] rounded-xl text-xs sm:text-sm text-[#333333] focus:outline-none focus:border-[#84A98C]"
            >
              <option value="직접입력">직접 입력 / 오프라인</option>
              <option value="넷플릭스">넷플릭스 (Netflix)</option>
              <option value="네이버 웹툰">네이버 웹툰</option>
              <option value="리디북스">리디북스 (RIDI)</option>
              <option value="밀리의서재">밀리의서재</option>
              <option value="왓챠">왓챠 (Watcha)</option>
              <option value="극장관람">극장 실관람</option>
            </select>
          </div>

          {/* Personal Review Note */}
          <div>
            <label className="block text-xs font-bold text-[#4A4A4A] mb-1">한 줄 감상평 / 기억에 남는 문장</label>
            <textarea
              rows={3}
              placeholder="작품을 보고 느낀 감정이나 나만의 감상평을 기록해보세요."
              value={userNote}
              onChange={e => setUserNote(e.target.value)}
              className="w-full px-3.5 py-2 bg-[#F5F1EB] border border-[#EBE3D5] rounded-xl text-xs text-[#333333] focus:outline-none focus:border-[#84A98C] focus:bg-white resize-none placeholder-[#A89F91]"
            />
          </div>

          {/* Submit Button */}
          <div className="pt-2">
            <button
              type="submit"
              className="w-full py-3.5 bg-[#84A98C] hover:bg-[#4A7C59] text-white font-bold text-xs sm:text-sm rounded-full shadow-xs transition-colors cursor-pointer"
            >
              감상 기록 저장 및 취향 DNA 업데이트
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};
