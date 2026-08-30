import React from 'react';
import { RefreshCw, Check, AlertCircle, Settings, Youtube, HardDrive, Twitter, Image as ImageIcon } from 'lucide-react';
import { PlatformConnection } from '../types';
import { isGoogleConfigured } from '../services/googleAuth';

interface PlatformToggleRowProps {
  platform: PlatformConnection;
  loading: boolean;
  onToggleOn: () => void;
  onToggleOff: () => void;
  /** oauth 종류에서 연결된 상태일 때만 표시되는 별도 재동기화 버튼 */
  onResync?: () => void;
  /** YouTube의 Google Takeout 업로드 링크 등 카드 하단 추가 UI */
  extra?: React.ReactNode;
}

const getIcon = (iconName: string) => {
  switch (iconName) {
    case 'Youtube': return <Youtube className="w-5 h-5" />;
    case 'HardDrive': return <HardDrive className="w-5 h-5" />;
    case 'Twitter': return <Twitter className="w-5 h-5" />;
    case 'Image': return <ImageIcon className="w-5 h-5" />;
    default: return <ImageIcon className="w-5 h-5" />;
  }
};

/**
 * 모든 플랫폼 카드(YouTube·Drive의 실제 OAuth 연동, X·Pinterest의 예시 데이터)를
 * 하나의 토글 스위치 UI로 통일해서 보여줍니다. 첫 방문 계정 연동 팝업과
 * 데이터 연동 센터 양쪽에서 재사용됩니다.
 */
export const PlatformToggleRow: React.FC<PlatformToggleRowProps> = ({
  platform,
  loading,
  onToggleOn,
  onToggleOff,
  onResync,
  extra,
}) => {
  const needsSetup = platform.kind === 'oauth' && !isGoogleConfigured() && !platform.connected;

  const handleToggleClick = () => {
    if (loading || needsSetup) return;
    if (platform.connected) onToggleOff();
    else onToggleOn();
  };

  return (
    <div
      className={`p-4 rounded-2xl border transition-all ${
        platform.connected
          ? 'bg-[#F5F1EB]/80 border-[#EBE3D5]'
          : 'bg-white border-[#EBE3D5] opacity-90 hover:opacity-100'
      }`}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center space-x-3.5 min-w-0">
          <div
            className="w-11 h-11 rounded-2xl flex items-center justify-center text-white shadow-xs shrink-0"
            style={{ backgroundColor: platform.color }}
          >
            {getIcon(platform.iconName)}
          </div>

          <div className="min-w-0">
            <div className="flex items-center space-x-2 flex-wrap gap-y-1">
              <span className="text-sm font-bold text-[#333333]">{platform.name}</span>
              <span className="text-[10px] font-bold text-[#7C7469] bg-[#F5F1EB] border border-[#EBE3D5] px-2 py-0.5 rounded-md">
                {platform.category}
              </span>
              {platform.kind === 'demo' && (
                <span className="text-[10px] font-bold text-[#E07A5F] bg-[#FBE9E4] border border-[#E07A5F]/30 px-1.5 py-0.5 rounded-md">
                  데모
                </span>
              )}
            </div>

            <div className="text-xs mt-0.5 truncate">
              {platform.connected ? (
                <span className="text-[#4A7C59] font-semibold">
                  <Check className="w-3 h-3 inline mr-1 -mt-0.5" />
                  {platform.accountLabel ? `${platform.accountLabel} · ` : ''}
                  {platform.itemCount}건 {platform.lastSyncedAt ? `(${platform.lastSyncedAt})` : ''}
                </span>
              ) : needsSetup ? (
                <span className="text-[#A89F91] inline-flex items-center gap-1">
                  <Settings className="w-3 h-3" />
                  Client ID 설정 필요 (.env.local)
                </span>
              ) : (
                <span className="text-[#A89F91]">{platform.description}</span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {platform.kind === 'oauth' && platform.connected && onResync && (
            <button
              onClick={onResync}
              disabled={loading}
              title="재동기화"
              className="p-2 rounded-full bg-white hover:bg-[#F5F1EB] border border-[#EBE3D5] text-[#7C7469] cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          )}

          <button
            onClick={handleToggleClick}
            disabled={loading || needsSetup}
            aria-pressed={platform.connected}
            title={platform.connected ? '연동 해제' : '연동하기'}
            className={`w-11 h-6 rounded-full p-0.5 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
              platform.connected ? 'bg-[#84A98C]' : 'bg-[#EBE3D5]'
            }`}
          >
            <span
              className={`flex items-center justify-center w-5 h-5 rounded-full bg-white shadow-xs transition-transform ${
                platform.connected ? 'translate-x-5' : 'translate-x-0'
              }`}
            >
              {loading && <RefreshCw className="w-3 h-3 text-[#84A98C] animate-spin" />}
            </span>
          </button>
        </div>
      </div>

      {platform.error && (
        <div className="mt-3 flex items-start gap-1.5 text-[11px] text-red-500 bg-red-50 border border-red-200 rounded-xl px-3 py-2">
          <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
          <span>{platform.error}</span>
        </div>
      )}

      {platform.connected && platform.previewItems.length > 0 && (
        <div className="mt-3 sm:pl-[3.4rem] space-y-1">
          {platform.previewItems.slice(0, 3).map(item => (
            <div key={item.id} className="text-[11px] text-[#7C7469] truncate">
              <span className="text-[#4A4A4A]">{item.title}</span>
              {item.subtitle && <span className="text-[#A89F91]"> · {item.subtitle}</span>}
            </div>
          ))}
        </div>
      )}

      {extra && <div className="mt-3 sm:pl-[3.4rem]">{extra}</div>}
    </div>
  );
};
