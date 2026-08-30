import React from 'react';
import { Gauge, ShieldCheck, CloudOff, Cloud, RotateCcw } from 'lucide-react';
import { TasteScoreBreakdown } from '../types';

interface TasteScorePanelProps {
  breakdown: TasteScoreBreakdown;
  trendResistance: number;
  firebaseEnabled: boolean;
  firebaseUid: string | null;
  onRetakeTest: () => void;
}

const SOURCE_COLORS: Record<string, string> = {
  onboarding: '#84A98C',
  watched: '#4A7C59',
  youtube: '#FF0000',
  drive: '#1A73E8',
  x: '#333333',
  pinterest: '#E60023',
};

export const TasteScorePanel: React.FC<TasteScorePanelProps> = ({
  breakdown,
  trendResistance,
  firebaseEnabled,
  firebaseUid,
  onRetakeTest,
}) => {
  const { sources, confidence, totalAnalyzed } = breakdown;

  const confidenceLabel =
    confidence >= 75 ? '매우 높음' : confidence >= 50 ? '보통' : confidence >= 25 ? '낮음' : '데이터 부족';

  // 각 출처가 최종 점수에 실제로 기여한 비중
  const effectiveWeights = sources.map(s => {
    const signalRatio = s.analyzedCount > 0 ? 0.5 + 0.5 * (s.matchedCount / s.analyzedCount) : 0.5;
    return s.weight * signalRatio;
  });
  const weightTotal = effectiveWeights.reduce((a, b) => a + b, 0) || 1;

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#EBE3D5] shadow-xs space-y-5">

      {/* 헤더 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#EBE3D5] pb-4">
        <div className="flex items-center space-x-2.5">
          <div className="p-2.5 bg-[#84A98C]/15 text-[#4A7C59] rounded-2xl border border-[#84A98C]/25">
            <Gauge className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-bold text-[#333333]">성향 분석 점수 시스템</h3>
            <p className="text-xs text-[#888888] mt-0.5">
              총 {totalAnalyzed}건의 데이터를 {sources.length}개 출처에서 분석했습니다
            </p>
          </div>
        </div>

        <button
          onClick={onRetakeTest}
          className="flex items-center gap-1.5 px-4 py-2 bg-[#F5F1EB] hover:bg-[#EBE3D5] text-[#4A4A4A] rounded-full text-xs font-bold transition-colors cursor-pointer shrink-0 self-start"
        >
          <RotateCcw className="w-3.5 h-3.5 text-[#7C7469]" />
          <span>취향 테스트 다시하기</span>
        </button>
      </div>

      {/* 상단 지표 2개 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="p-4 bg-[#84A98C]/10 rounded-2xl border border-[#84A98C]/25">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-[#4A4A4A]">유행 탈피 & 독립 취향 지수</span>
            <span className="text-sm font-bold text-[#4A7C59] font-mono">{trendResistance}점</span>
          </div>
          <div className="w-full h-2.5 bg-white rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-1000"
              style={{ width: `${trendResistance}%`, backgroundColor: '#FF8B7E' }}
            />
          </div>
          <p className="text-[11px] text-[#7C7469] mt-2">
            숨은 명작 선호 50% + 사유 깊이 30% + 저자극 선호 20%로 산출
          </p>
        </div>

        <div className="p-4 bg-[#F5F1EB] rounded-2xl border border-[#EBE3D5]">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-[#4A4A4A]">분석 신뢰도</span>
            <span className="text-sm font-bold text-[#4A7C59] font-mono">
              {confidence}점 · {confidenceLabel}
            </span>
          </div>
          <div className="w-full h-2.5 bg-white rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-1000"
              style={{ width: `${confidence}%`, backgroundColor: '#84A98C' }}
            />
          </div>
          <p className="text-[11px] text-[#7C7469] mt-2">
            분석량(60) + 출처 다양성(20) + 신호 적중률(20)
          </p>
        </div>
      </div>

      {/* 출처별 기여도 */}
      <div className="space-y-2.5">
        <h4 className="text-xs font-bold text-[#4A4A4A]">출처별 점수 기여도</h4>

        {sources.length === 0 ? (
          <div className="p-4 bg-[#F5F1EB] rounded-2xl border border-[#EBE3D5] text-xs text-[#7C7469] text-center">
            아직 분석할 데이터가 없습니다. 취향 테스트를 하거나 플랫폼을 연동해보세요.
          </div>
        ) : (
          sources.map((source, idx) => {
            const share = Math.round((effectiveWeights[idx] / weightTotal) * 100);
            return (
              <div key={source.id} className="p-3.5 bg-[#F5F1EB]/70 rounded-2xl border border-[#EBE3D5]">
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: SOURCE_COLORS[source.id] ?? '#84A98C' }}
                    />
                    <span className="text-xs font-bold text-[#333333] truncate">{source.label}</span>
                  </div>
                  <span className="text-xs font-bold text-[#4A7C59] font-mono shrink-0">{share}%</span>
                </div>

                <div className="w-full h-1.5 bg-white rounded-full overflow-hidden mb-1.5">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${share}%`, backgroundColor: SOURCE_COLORS[source.id] ?? '#84A98C' }}
                  />
                </div>

                <p className="text-[11px] text-[#A89F91]">
                  {source.analyzedCount}건 분석 · 취향 신호 {source.matchedCount}건 포착
                </p>
              </div>
            );
          })
        )}
      </div>

      {/* 저장 정책 안내 */}
      <div className="p-4 bg-[#F5F1EB] rounded-2xl border border-[#EBE3D5] space-y-2.5">
        <div className="flex items-center gap-2">
          {firebaseEnabled ? (
            <Cloud className="w-4 h-4 text-[#4A7C59] shrink-0" />
          ) : (
            <CloudOff className="w-4 h-4 text-[#A89F91] shrink-0" />
          )}
          <span className="text-xs font-bold text-[#333333]">
            {firebaseEnabled ? 'Firebase 저장 활성' : 'Firebase 미설정 — 이 기기에만 저장 중'}
          </span>
          {firebaseEnabled && firebaseUid && (
            <span className="text-[10px] font-mono text-[#A89F91] truncate">uid: {firebaseUid.slice(0, 10)}…</span>
          )}
        </div>

        <div className="flex items-start gap-2 text-[11px] text-[#4A4A4A] leading-relaxed">
          <ShieldCheck className="w-4 h-4 text-[#4A7C59] shrink-0 mt-0.5" />
          <p>
            서버에는 <strong>회원 정보와 위 분석 점수(숫자)만</strong> 저장됩니다. YouTube 영상 제목,
            Drive 파일명 같은 <strong>API 원본 데이터와 액세스 토큰은 저장하지 않습니다</strong> —
            브라우저에서 점수로 환산된 뒤 그 수치만 전송됩니다.
          </p>
        </div>
      </div>

    </div>
  );
};
