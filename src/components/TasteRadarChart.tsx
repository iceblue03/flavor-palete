import React from 'react';
import { TasteConfidenceIntervals, TasteDNAScores } from '../types';

interface TasteRadarChartProps {
  scores: TasteDNAScores;
  primaryColor?: string;
  secondaryColor?: string;
  size?: number;
  confidenceIntervals?: TasteConfidenceIntervals;
}

export const TasteRadarChart: React.FC<TasteRadarChartProps> = ({
  scores,
  primaryColor = '#6366F1',
  secondaryColor = '#FB7185',
  size = 280,
  confidenceIntervals,
}) => {
  const center = size / 2;
  const radius = size * 0.38;

  const axes = [
    { key: 'emotional', label: '감성·여운', value: scores.emotional },
    { key: 'stimulation', label: '도파민·스릴', value: scores.stimulation },
    { key: 'depth', label: '철학·사유', value: scores.depth },
    { key: 'plotDensity', label: '서사·반전', value: scores.plotDensity },
    { key: 'indieGem', label: '숨은명작', value: scores.indieGem },
    { key: 'worldbuilding', label: '세계관몰입', value: scores.worldbuilding },
  ];

  const totalAxes = axes.length;
  const angleSlice = (Math.PI * 2) / totalAxes;

  // 축 레벨 (20, 40, 60, 80, 100)
  const levels = [0.2, 0.4, 0.6, 0.8, 1.0];

  // 각 축의 좌표 계산
  const getCoordinates = (value: number, index: number, maxVal = 100) => {
    const angle = index * angleSlice - Math.PI / 2;
    const r = (value / maxVal) * radius;
    const x = center + r * Math.cos(angle);
    const y = center + r * Math.sin(angle);
    return { x, y };
  };

  // 다각형 포인트 생성
  const polygonPoints = axes
    .map((axis, i) => {
      const { x, y } = getCoordinates(axis.value, i);
      return `${x},${y}`;
    })
    .join(' ');
  const intervalPoints = (bound: 'lower' | 'upper') => axes
    .map((axis, i) => {
      const interval = confidenceIntervals?.[axis.key as keyof TasteDNAScores];
      const { x, y } = getCoordinates(interval?.[bound] ?? axis.value, i);
      return `${x},${y}`;
    })
    .join(' ');

  return (
    <div className="relative flex flex-col items-center justify-center">
      <svg
        width={size}
        height={size}
        className="overflow-visible transition-all duration-700 select-none"
        viewBox={`0 0 ${size} ${size}`}
      >
        <defs>
          <linearGradient id="radarGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={primaryColor} stopOpacity="0.55" />
            <stop offset="100%" stopColor={secondaryColor} stopOpacity="0.4" />
          </linearGradient>
          <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* 배경 동심원 레벨 가이드 */}
        {levels.map((level, lvlIdx) => {
          const levelRadius = radius * level;
          const levelPoints = axes
            .map((_, i) => {
              const angle = i * angleSlice - Math.PI / 2;
              const x = center + levelRadius * Math.cos(angle);
              const y = center + levelRadius * Math.sin(angle);
              return `${x},${y}`;
            })
            .join(' ');

          return (
            <polygon
              key={lvlIdx}
              points={levelPoints}
              fill={lvlIdx === levels.length - 1 ? '#FBF9F5' : 'transparent'}
              stroke="#EBE3D5"
              strokeWidth={lvlIdx === levels.length - 1 ? '1.5' : '1'}
              strokeDasharray={lvlIdx < levels.length - 1 ? '3 3' : undefined}
            />
          );
        })}

        {/* 축 선 (방사선) */}
        {axes.map((_, i) => {
          const { x, y } = getCoordinates(100, i);
          return (
            <line
              key={i}
              x1={center}
              y1={center}
              x2={x}
              y2={y}
              stroke="#EBE3D5"
              strokeWidth="1"
            />
          );
        })}

        {/* 메인 데이터 다각형 (Filled Polygon) */}
        {confidenceIntervals && (
          <>
            <polygon
              points={intervalPoints('upper')}
              fill={primaryColor}
              fillOpacity="0.13"
              stroke={primaryColor}
              strokeOpacity="0.35"
              strokeWidth="1"
              strokeDasharray="4 3"
            />
            <polygon
              points={intervalPoints('lower')}
              fill="#FBF9F5"
              fillOpacity="0.7"
              stroke={primaryColor}
              strokeOpacity="0.25"
              strokeWidth="1"
              strokeDasharray="4 3"
            />
          </>
        )}
        <polygon
          points={polygonPoints}
          fill="url(#radarGradient)"
          stroke={primaryColor}
          strokeWidth="2.5"
          filter="url(#glow)"
          className="transition-all duration-700 ease-out"
        />

        {/* 각 축 꼭짓점 데이터 포인트 원 */}
        {axes.map((axis, i) => {
          const { x, y } = getCoordinates(axis.value, i);
          return (
            <g key={i} className="group cursor-pointer">
              <circle
                cx={x}
                cy={y}
                r="5"
                fill={primaryColor}
                stroke="#ffffff"
                strokeWidth="2"
                className="transition-transform duration-300 hover:scale-150"
              />
            </g>
          );
        })}

        {/* 축 레이블 텍스트 */}
        {axes.map((axis, i) => {
          const angle = i * angleSlice - Math.PI / 2;
          const labelRadius = radius + 22;
          const x = center + labelRadius * Math.cos(angle);
          const y = center + labelRadius * Math.sin(angle);

          return (
            <g key={`label-${i}`}>
              <text
                x={x}
                y={y}
                textAnchor="middle"
                dominantBaseline="central"
                className="text-[11px] font-bold fill-[#333333] tracking-tight select-none"
              >
                {axis.label}
              </text>
              <text
                x={x}
                y={y + 11}
                textAnchor="middle"
                dominantBaseline="central"
                className="text-[10px] font-semibold fill-[#4A7C59] select-none"
              >
                {axis.value}점{confidenceIntervals
                  ? ` ±${Math.round((confidenceIntervals[axis.key as keyof TasteDNAScores].upper - confidenceIntervals[axis.key as keyof TasteDNAScores].lower) / 2)}`
                  : ''}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
};
