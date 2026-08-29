import React from 'react';
import { UserCheck, Sparkles, Users, Layers, ShieldCheck, Heart, ArrowRight, BookOpen, Film, Palette, Zap } from 'lucide-react';
import { MediaItem, StoredAppData, TasteArchetype, TasteDNAScores, TasteTwinPeer } from '../types';
import { generateTasteTwinPeers } from '../utils/collaborativeFiltering';

interface CollaborativeFilteringViewProps {
  archetype: TasteArchetype;
  dnaScores: TasteDNAScores;
  storedData: StoredAppData;
  onSelectMedia: (item: MediaItem) => void;
}

export const CollaborativeFilteringView: React.FC<CollaborativeFilteringViewProps> = ({
  archetype,
  dnaScores,
  storedData,
  onSelectMedia,
}) => {
  const peers = generateTasteTwinPeers(dnaScores, archetype);

  return (
    <div className="space-y-8 pb-12">
      
      {/* Header Banner */}
      <div className="bg-white/80 rounded-3xl p-6 sm:p-8 border border-[#EBE3D5] shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="px-3 py-1 bg-[#84A98C] text-white rounded-full text-xs font-bold shadow-xs">
                CF 엔진 3.0
              </span>
              <span className="text-xs font-bold text-[#4A7C59] bg-[#E8F3EB] px-2.5 py-0.5 rounded-full border border-[#84A98C]/30">
                1020 유저 8,420명 데이터 풀 매칭
              </span>
            </div>
            <h2 className="text-xl sm:text-3xl font-bold text-[#333333] mt-2">
              나의 취향 도플갱어 클러스터
            </h2>
            <p className="text-xs sm:text-sm text-[#7C7469] mt-1">
              단순히 나이/성별이 아니라, <strong>실제 시청·열람한 작품의 별점 패턴과 6축 DNA</strong>가 쌍둥이처럼 닮은 유저들을 찾아냈습니다.
            </p>
          </div>

          <div className="p-4 bg-[#F5F1EB]/80 rounded-2xl border border-[#EBE3D5] shadow-xs flex items-center space-x-3 shrink-0">
            <Users className="w-8 h-8 text-[#84A98C]" />
            <div>
              <div className="text-xs text-[#888888] font-bold">배정된 취향 클러스터</div>
              <div className="text-sm font-bold text-[#333333]">클러스터 #402 [심야의 몽상가들]</div>
              <div className="text-[11px] text-[#4A7C59] font-semibold">● 실시간 2,410명 활동 중</div>
            </div>
          </div>
        </div>
      </div>

      {/* 2-Column: Left (Top 4 Taste Twins) + Right (CF Engine Logic Breakdown) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Taste Twin Peer Cards (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
            <h3 className="text-base font-bold text-[#333333] flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-[#84A98C] shrink-0" />
              <span>나와 취향 90% 이상 일치하는 또래 피어들</span>
            </h3>
            <span className="text-xs text-[#888888]">실시간 코사인 유사도 기준</span>
          </div>

          <div className="space-y-4">
            {peers.map((peer, idx) => (
              <div
                key={peer.id}
                className="p-5 bg-white rounded-3xl border border-[#EBE3D5] hover:border-[#84A98C] shadow-xs hover:shadow-md transition-all space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div
                      className="w-11 h-11 rounded-full flex items-center justify-center font-bold text-white text-base shadow-xs"
                      style={{
                        background: `linear-gradient(135deg, ${idx % 2 === 0 ? '#84A98C' : '#FF8B7E'}, #FFD275)`,
                      }}
                    >
                      {peer.nickname[0]}
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-bold text-[#333333]">{peer.nickname}</span>
                        <span className="text-[11px] font-bold text-[#4A7C59] bg-[#E8F3EB] px-2 py-0.5 rounded-full border border-[#84A98C]/30">
                          취향 일치 {peer.similarity}%
                        </span>
                      </div>
                      <span className="text-xs text-[#888888]">{peer.clusterName}</span>
                    </div>
                  </div>

                  <span className="text-xs font-mono font-bold text-[#A89F91]">#0{idx + 1}</span>
                </div>

                {/* Common Favorites */}
                <div className="text-xs text-[#4A4A4A] bg-[#F5F1EB]/70 p-3 rounded-2xl border border-[#EBE3D5]">
                  <div className="text-[#888888] font-bold mb-1.5 flex items-center gap-1">
                    <Heart className="w-3.5 h-3.5 text-[#FF8B7E]" />
                    <span>나와 함께 5점 만점을 준 공통 인생작</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {peer.commonFavorites.map((fav, fIdx) => (
                      <span key={fIdx} className="px-2.5 py-1 bg-white font-semibold text-[#333333] rounded-lg text-xs border border-[#EBE3D5]">
                        {fav}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Peer's Top Recommendation For You */}
                <div className="flex items-center justify-between text-xs pt-1">
                  <span className="text-[#7C7469]">
                    💡 이 피어가 당신에게 강력 추천하는 작품: <strong className="text-[#4A7C59]">{peer.topRecommendationForUser}</strong>
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: How Collaborative Filtering Overcomes Trends (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Algorithm Explanation Box */}
          <div className="bg-white rounded-3xl p-6 border border-[#EBE3D5] shadow-xs space-y-4">
            <h3 className="text-sm sm:text-base font-bold text-[#333333] flex items-center gap-2">
              <Zap className="w-4 h-4 text-[#84A98C]" />
              <span>유행만 쫓지 않는 협업 필터링 원리</span>
            </h3>

            <div className="space-y-3 text-xs text-[#4A4A4A] leading-relaxed">
              <div className="p-3.5 bg-[#F5F1EB] rounded-2xl border border-[#EBE3D5] space-y-1">
                <div className="font-bold text-[#333333]">1. 대중적 유행 거품 제거 (Anti-Bandwagon)</div>
                <p className="text-[#7C7469]">
                  단순 조회수가 높은 메이저 상위권 작품 대신, 나와 취향 DNA가 90% 이상 겹치는 소수 정예 그룹의 별점 가중치를 극대화합니다.
                </p>
              </div>

              <div className="p-3.5 bg-[#F5F1EB] rounded-2xl border border-[#EBE3D5] space-y-1">
                <div className="font-bold text-[#333333]">2. 크로스 미디어 잠재 요인 분석 (Cross-Media Matrix)</div>
                <p className="text-[#7C7469]">
                  웹툰을 좋아하는 유저가 감동할 만한 SF 소설, 독립영화를 즐기는 유저가 빠져들 만한 판타지 웹툰을 교차 매핑합니다.
                </p>
              </div>

              <div className="p-3.5 bg-[#F5F1EB] rounded-2xl border border-[#EBE3D5] space-y-1">
                <div className="font-bold text-[#333333]">3. 숨은 명작 발굴 보너스 (Hidden Gem Bonus)</div>
                <p className="text-[#7C7469]">
                  대중성(유행도) 지수는 낮지만 실제 관람자 평점이 4.8 이상인 작품에 특별 발굴 가중치를 부여합니다.
                </p>
              </div>
            </div>
          </div>

          {/* Peer Cluster Hidden Gems List */}
          <div className="bg-[#84A98C]/10 rounded-3xl p-6 border border-[#84A98C]/25 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-[#333333] flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-[#FF8B7E]" />
                <span>내 피어들이 숨겨두고 보는 갓작 TOP 3</span>
              </h3>
              <span className="text-[11px] font-bold text-[#4A7C59]">만족도 99%</span>
            </div>

            <div className="space-y-2.5">
              {storedData.recommendedWorks.filter(i => i.hiddenGemScore >= 90).slice(0, 3).map((item, idx) => (
                <div
                  key={item.id}
                  onClick={() => onSelectMedia(item)}
                  className="p-3 bg-white/90 hover:bg-white rounded-2xl border border-[#EBE3D5] hover:border-[#84A98C] flex items-center justify-between gap-2 transition-all cursor-pointer group"
                >
                  <div className="flex items-center space-x-3 min-w-0">
                    <span className="w-6 h-6 rounded-full bg-[#84A98C] text-white font-bold text-xs flex items-center justify-center shrink-0">
                      {idx + 1}
                    </span>
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-[#333333] truncate group-hover:text-[#4A7C59]">
                        {item.title}
                      </div>
                      <div className="text-[10px] text-[#888888]">
                        {item.categoryLabel} · 💎 히든 지수 {item.hiddenGemScore}점
                      </div>
                    </div>
                  </div>

                  <ArrowRight className="w-4 h-4 text-[#A89F91] group-hover:text-[#4A7C59] group-hover:translate-x-0.5 transition-transform shrink-0" />
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>

    </div>
  );
};
