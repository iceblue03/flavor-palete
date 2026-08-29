import React, { useState } from 'react';
import { Sparkles, ArrowRight, RefreshCw, Share2, Check, Flame, ShieldAlert, Heart, BookmarkCheck, SlidersHorizontal, BookOpen, Film, Palette } from 'lucide-react';
import { TasteArchetype, TasteDNAScores, StoredAppData, MediaItem } from '../types';
import { TasteRadarChart } from './TasteRadarChart';

interface TasteAnalysisViewProps {
  archetype: TasteArchetype;
  dnaScores: TasteDNAScores;
  storedData: StoredAppData;
  onNavigateToRecommendations: () => void;
  onNavigateToCollaborative: () => void;
  onOpenSyncModal: () => void;
  onUpdateDnaScores: (newScores: TasteDNAScores) => void;
  onSelectMedia: (item: MediaItem) => void;
}

export const TasteAnalysisView: React.FC<TasteAnalysisViewProps> = ({
  archetype,
  dnaScores,
  storedData,
  onNavigateToRecommendations,
  onNavigateToCollaborative,
  onOpenSyncModal,
  onUpdateDnaScores,
  onSelectMedia,
}) => {
  const [copied, setCopied] = useState(false);
  const [isAdjusting, setIsAdjusting] = useState(false);
  const [tempScores, setTempScores] = useState<TasteDNAScores>(dnaScores);

  const handleShare = () => {
    const shareText = `🎨 [취향팔레트] 나의 문화 취향 유형은 "${archetype.name}" (${archetype.badge}) 입니다! 유행 탈피 지수: ${archetype.trendResistanceScore}점. 나만의 숨은 인생작을 찾아보세요.`;
    navigator.clipboard.writeText(shareText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleScoreChange = (key: keyof TasteDNAScores, value: number) => {
    const updated = { ...tempScores, [key]: value };
    setTempScores(updated);
    onUpdateDnaScores(updated);
  };

  return (
    <div className="space-y-8 pb-12">
      
      {/* Top Banner: Problem Statement Solution Indicator */}
      <div className="bg-white/80 border border-[#EBE3D5] rounded-3xl p-5 sm:p-6 shadow-xs backdrop-blur-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-start space-x-3.5">
          <div className="p-3 bg-[#84A98C] text-white rounded-2xl shadow-xs">
            <Sparkles className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold uppercase tracking-wider text-[#4A7C59] bg-[#E8F3EB] px-2.5 py-0.5 rounded-full border border-[#84A98C]/30">
                1020 취향 해방구
              </span>
              <span className="text-xs text-[#888888]">
                연동 데이터 {storedData.watchedWorks.length}건 정밀 분석 완료
              </span>
            </div>
            <h1 className="text-lg sm:text-xl font-bold text-[#333333] mt-1">
              "알고리즘 유행에 휩쓸리지 않는 당신만의 고유한 팔레트 색채를 찾았습니다."
            </h1>
          </div>
        </div>

        <div className="flex items-center space-x-2 shrink-0">
          <button
            onClick={handleShare}
            className="flex items-center space-x-1.5 px-4 py-2.5 bg-white hover:bg-[#F5F1EB] border border-[#EBE3D5] text-[#4A4A4A] rounded-full text-xs font-bold shadow-xs transition-all cursor-pointer"
          >
            {copied ? <Check className="w-4 h-4 text-[#4A7C59]" /> : <Share2 className="w-4 h-4 text-[#7C7469]" />}
            <span>{copied ? '취향 카드 복사됨!' : '취향 카드 공유'}</span>
          </button>

          <button
            onClick={onOpenSyncModal}
            className="flex items-center space-x-1.5 px-4 py-2.5 bg-[#84A98C] hover:bg-[#4A7C59] text-white rounded-full text-xs font-bold shadow-xs transition-all cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
            <span>플랫폼 추가 동기화</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Left (Archetype Identity & Color Palette) + Right (Radar Chart & Anti-Trend Gauge) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Archetype Profile (7 cols) */}
        <div
          className="lg:col-span-7 bg-white rounded-3xl p-6 sm:p-8 border border-[#EBE3D5] shadow-xs relative overflow-hidden flex flex-col justify-between"
          style={{
            background: `linear-gradient(145deg, #ffffff 60%, ${archetype.primaryColor}14)`,
          }}
        >
          {/* Top subtle glow badge */}
          <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
            <span
              className="px-3.5 py-1 rounded-full text-xs font-bold text-white shadow-xs"
              style={{ backgroundColor: archetype.primaryColor }}
            >
              {archetype.badge}
            </span>
            <span className="text-xs font-semibold text-[#A89F91] font-mono">
              USER ID: {storedData.userIdentifier.slice(0, 16)}...
            </span>
          </div>

          {/* Archetype Main Name & Subtitle */}
          <div className="space-y-2">
            <p className="text-xs font-bold text-[#FF8B7E] tracking-wider uppercase font-['Outfit',sans-serif]">
              {archetype.subtitle}
            </p>
            <h2 className="text-2xl sm:text-4xl font-bold text-[#333333] tracking-tight leading-tight">
              {archetype.name}
            </h2>
            <p className="text-sm sm:text-base font-medium italic text-[#7C7469] border-l-4 pl-3.5 my-3 py-0.5" style={{ borderColor: archetype.primaryColor }}>
              {archetype.quote}
            </p>
            <p className="text-sm text-[#4A4A4A] leading-relaxed font-normal">
              {archetype.description}
            </p>
          </div>

          {/* Tags */}
          <div className="flex flex-wrap gap-2 my-5">
            {archetype.tags.map((tag, idx) => (
              <span
                key={idx}
                className="px-3 py-1 bg-[#F5F1EB] text-[#4A4A4A] text-xs font-medium rounded-full border border-[#EBE3D5]"
              >
                {tag}
              </span>
            ))}
          </div>

          {/* Dynamic Color Palette Swatch Bar */}
          <div className="p-4 bg-[#F5F1EB]/70 rounded-2xl border border-[#EBE3D5] mb-6">
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-xs font-bold text-[#4A4A4A] flex items-center gap-1.5">
                <Palette className="w-3.5 h-3.5 text-[#84A98C]" />
                나의 대표 취향 컬러 팔레트
              </span>
              <span className="text-[11px] font-mono text-[#A89F91]">NATURAL PALETTE</span>
            </div>
            <div className="grid grid-cols-3 gap-2.5">
              <div className="flex items-center space-x-2 p-2 bg-white rounded-xl border border-[#EBE3D5]">
                <div className="w-7 h-7 rounded-full shrink-0 shadow-xs" style={{ backgroundColor: archetype.primaryColor }} />
                <div>
                  <div className="text-[11px] font-bold text-[#333333]">메인 톤</div>
                  <div className="text-[10px] font-mono text-[#7C7469]">{archetype.primaryColor}</div>
                </div>
              </div>
              <div className="flex items-center space-x-2 p-2 bg-white rounded-xl border border-[#EBE3D5]">
                <div className="w-7 h-7 rounded-full shrink-0 shadow-xs" style={{ backgroundColor: archetype.secondaryColor }} />
                <div>
                  <div className="text-[11px] font-bold text-[#333333]">서브 톤</div>
                  <div className="text-[10px] font-mono text-[#7C7469]">{archetype.secondaryColor}</div>
                </div>
              </div>
              <div className="flex items-center space-x-2 p-2 bg-white rounded-xl border border-[#EBE3D5]">
                <div className="w-7 h-7 rounded-full shrink-0 shadow-xs" style={{ backgroundColor: archetype.accentColor }} />
                <div>
                  <div className="text-[11px] font-bold text-[#333333]">포인트 톤</div>
                  <div className="text-[10px] font-mono text-[#7C7469]">{archetype.accentColor}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Key Characteristics Checklist */}
          <div className="space-y-2 mb-6">
            <h3 className="text-xs font-bold text-[#A89F91] uppercase tracking-wider">
              📌 당신의 감상 패턴 특징
            </h3>
            {archetype.characteristics.map((char, cIdx) => (
              <div key={cIdx} className="flex items-start space-x-2 text-xs sm:text-sm text-[#4A4A4A]">
                <span className="text-[#84A98C] font-bold shrink-0 mt-0.5">✔</span>
                <span>{char}</span>
              </div>
            ))}
          </div>

          {/* Action to explore recommendations */}
          <div className="pt-2">
            <button
              onClick={onNavigateToRecommendations}
              className="w-full flex items-center justify-center space-x-2 py-4 px-6 rounded-full text-white font-bold text-sm shadow-md transition-all hover:scale-[1.01] cursor-pointer"
              style={{
                background: `linear-gradient(135deg, ${archetype.primaryColor}, ${archetype.secondaryColor})`,
              }}
            >
              <span>이 취향에 딱 맞는 책 · 영화 · 웹툰 보러가기</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Right Column: 6-Axis Radar Chart & Anti-Trend Resistance Gauge (5 cols) */}
        <div className="lg:col-span-5 flex flex-col space-y-6">
          
          {/* Radar Chart Card */}
          <div className="bg-white rounded-3xl p-6 border border-[#EBE3D5] shadow-xs flex flex-col items-center">
            <div className="w-full flex items-center justify-between mb-2">
              <div>
                <h3 className="text-sm sm:text-base font-bold text-[#333333]">
                  취향 DNA 6축 밸런스
                </h3>
                <p className="text-xs text-[#888888]">동기화된 시청/열람 데이터 기반 다차원 벡터</p>
              </div>
              <button
                onClick={() => setIsAdjusting(!isAdjusting)}
                className={`p-2 rounded-xl border text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer ${
                  isAdjusting ? 'bg-[#E8F3EB] border-[#84A98C] text-[#4A7C59]' : 'bg-[#F5F1EB] border-[#EBE3D5] text-[#7C7469]'
                }`}
                title="직접 슬라이더로 조절하기"
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{isAdjusting ? '완료' : '조정'}</span>
              </button>
            </div>

            {/* Radar Chart Graphic */}
            <div className="my-2">
              <TasteRadarChart
                scores={dnaScores}
                primaryColor={archetype.primaryColor}
                secondaryColor={archetype.secondaryColor}
                size={270}
              />
            </div>

            {/* Live Sliders if in adjusting mode */}
            {isAdjusting && (
              <div className="w-full mt-4 p-4 bg-[#F5F1EB] rounded-2xl border border-[#EBE3D5] space-y-3">
                <div className="text-xs font-bold text-[#333333] flex items-center justify-between">
                  <span>실시간 취향 성향 미세 조정</span>
                  <span className="text-[10px] text-[#84A98C]">변경 시 유형 및 추천 즉시 재산출</span>
                </div>
                {(
                  [
                    { key: 'emotional', label: '감성도' },
                    { key: 'stimulation', label: '도파민/자극' },
                    { key: 'depth', label: '철학/사유' },
                    { key: 'plotDensity', label: '서사 밀도' },
                    { key: 'indieGem', label: '숨은 명작 선호' },
                    { key: 'worldbuilding', label: '세계관 몰입' },
                  ] as const
                ).map(axis => (
                  <div key={axis.key} className="space-y-1">
                    <div className="flex justify-between text-xs font-semibold text-[#4A4A4A]">
                      <span>{axis.label}</span>
                      <span className="font-mono text-[#4A7C59]">{tempScores[axis.key]}점</span>
                    </div>
                    <input
                      type="range"
                      min="10"
                      max="100"
                      value={tempScores[axis.key]}
                      onChange={e => handleScoreChange(axis.key, parseInt(e.target.value))}
                      className="w-full accent-[#84A98C] h-1.5 bg-[#EBE3D5] rounded-lg cursor-pointer"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Anti-Trend Chasing Gauge Card (Core Problem Solution) */}
          <div className="bg-[#84A98C]/10 rounded-3xl p-6 border border-[#84A98C]/25 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Flame className="w-5 h-5 text-[#FF8B7E]" />
                <h3 className="text-sm sm:text-base font-bold text-[#333333]">
                  유행 탈피 & 독립 취향 지수
                </h3>
              </div>
              <span className="px-3 py-1 bg-[#84A98C] text-white font-bold text-xs rounded-full shadow-xs font-mono">
                {archetype.trendResistanceScore} / 100점
              </span>
            </div>

            {/* Gauge Progress Bars */}
            <div className="space-y-3 pt-1">
              <div>
                <div className="flex justify-between text-xs font-bold text-[#4A4A4A] mb-1">
                  <span>나의 숨은 명작 탐닉도</span>
                  <span className="text-[#4A7C59]">{archetype.trendResistanceScore}% (상위 14%)</span>
                </div>
                <div className="w-full h-2.5 bg-[#EBE3D5] rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-1000"
                    style={{
                      width: `${archetype.trendResistanceScore}%`,
                      backgroundColor: '#FF8B7E',
                    }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-semibold text-[#888888] mb-1">
                  <span>일반 1020 대중 유행 추종도</span>
                  <span>68%</span>
                </div>
                <div className="w-full h-2 bg-[#EBE3D5]/70 rounded-full overflow-hidden">
                  <div className="h-full bg-[#A89F91] rounded-full" style={{ width: '68%' }} />
                </div>
              </div>
            </div>

            <p className="text-xs text-[#4A4A4A] leading-relaxed bg-white/90 p-3.5 rounded-2xl border border-[#EBE3D5]">
              💡 <strong>분석 총평</strong>: 숏폼이나 실시간 검색어 순위에 휘둘리지 않고, 자신의 직관과 감성에 와닿는 <strong>‘진짜 이야기’</strong>를 선별하는 감각이 매우 뛰어납니다.
            </p>

            <button
              onClick={onNavigateToCollaborative}
              className="w-full py-3 px-4 bg-[#333333] hover:bg-[#222222] text-white rounded-full text-xs font-bold shadow-xs flex items-center justify-center space-x-2 transition-all cursor-pointer"
            >
              <span>나와 비슷한 취향 도플갱어 클러스터 보기</span>
              <ArrowRight className="w-3.5 h-3.5 text-white" />
            </button>
          </div>

        </div>
      </div>

      {/* Bottom Section: 3 Representative Matched Gems (Book, Movie, Webtoon) */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#EBE3D5] shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#EBE3D5] pb-4">
          <div>
            <h3 className="text-lg font-bold text-[#333333] flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-[#FF8B7E]" />
              <span>{archetype.name}을 위한 3대 미디어 대표 큐레이션</span>
            </h3>
            <p className="text-xs text-[#888888] mt-0.5">
              책 · 영화 · 웹툰 각 분야에서 취향 저격도가 가장 높은 1위 작품들
            </p>
          </div>
          <button
            onClick={onNavigateToRecommendations}
            className="text-xs font-bold text-[#4A7C59] hover:text-[#333333] flex items-center space-x-1 cursor-pointer"
          >
            <span>전체 40+ 추천작 보기</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {storedData.recommendedWorks.slice(0, 3).map((item, idx) => {
            return (
              <div
                key={item.id}
                onClick={() => onSelectMedia(item)}
                className="group p-4 bg-[#FCFAF7] hover:bg-white rounded-2xl border border-[#EBE3D5] hover:border-[#84A98C] hover:shadow-md transition-all duration-300 cursor-pointer flex flex-col justify-between"
              >
                <div>
                  {/* Category badge & Match rate */}
                  <div className="flex items-center justify-between mb-3">
                    <span className="px-2.5 py-1 bg-white text-[#4A4A4A] text-[11px] font-bold rounded-lg border border-[#EBE3D5] shadow-2xs flex items-center gap-1">
                      {item.category === 'book' && <BookOpen className="w-3 h-3 text-[#4A7C59]" />}
                      {item.category === 'movie' && <Film className="w-3 h-3 text-[#5C6B73]" />}
                      {item.category === 'webtoon' && <Palette className="w-3 h-3 text-[#FF8B7E]" />}
                      {item.categoryLabel}
                    </span>
                    <span className="text-xs font-bold text-[#4A7C59] font-mono">
                      취향 일치 {item.peerMatchRate}%
                    </span>
                  </div>

                  {/* Thumbnail and Title */}
                  <div className="flex space-x-3 mb-3">
                    <img
                      src={item.coverUrl}
                      alt={item.title}
                      className="w-16 h-20 sm:w-20 sm:h-24 rounded-xl object-cover shadow-xs group-hover:scale-105 transition-transform"
                      referrerPolicy="no-referrer"
                    />
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-bold text-[#333333] truncate group-hover:text-[#4A7C59] transition-colors">
                        {item.title}
                      </h4>
                      <p className="text-xs text-[#888888] mb-1">{item.creator} · {item.releaseYear}</p>
                      <p className="text-xs text-[#4A4A4A] line-clamp-2 leading-relaxed">
                        {item.summary}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Bottom Reason Pill */}
                <div className="pt-2 border-t border-[#EBE3D5] flex items-center justify-between text-[11px]">
                  <span className="text-[#888888] truncate max-w-[80%]">
                    💎 숨겨진 명작 지수 {item.hiddenGemScore}점
                  </span>
                  <span className="text-[#4A7C59] font-bold group-hover:translate-x-0.5 transition-transform">
                    상세보기 &rarr;
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
};
