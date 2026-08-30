import React from 'react';
import { Palette, ShieldCheck } from 'lucide-react';
import { PlatformConnection } from '../types';
import { GoogleScopeKey } from '../services/googleAuth';
import { PlatformToggleRow } from './PlatformToggleRow';

interface AccountLinkModalProps {
  isOpen: boolean;
  platforms: PlatformConnection[];
  loadingIds: string[];
  onConnectGoogle: (scopeKey: GoogleScopeKey) => void;
  onDisconnect: (platformId: string) => void;
  onToggleDemo: (platformId: string) => void;
  onClose: () => void;
}

export const AccountLinkModal: React.FC<AccountLinkModalProps> = ({
  isOpen,
  platforms,
  loadingIds,
  onConnectGoogle,
  onDisconnect,
  onToggleDemo,
  onClose,
}) => {
  if (!isOpen) return null;

  const connectedCount = platforms.filter(p => p.connected).length;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-[#EBE3D5] max-h-[90vh] overflow-y-auto space-y-6">

        <div className="text-center space-y-2">
          <div className="flex justify-center">
            <div
              className="w-14 h-14 rounded-3xl flex items-center justify-center shadow-xs"
              style={{ background: 'linear-gradient(135deg, #84A98C, #FF8B7E)' }}
            >
              <Palette className="w-7 h-7 text-white" />
            </div>
          </div>

          <span className="inline-block px-3 py-0.5 bg-[#E8F3EB] text-[#4A7C59] border border-[#84A98C]/30 rounded-full text-xs font-bold">
            처음 오셨네요 · 계정 연동
          </span>
          <h2 className="text-xl sm:text-2xl font-bold text-[#333333] tracking-tight">
            플랫폼을 연동하고<br />진짜 취향 분석을 시작하세요
          </h2>
          <p className="text-sm text-[#7C7469] leading-relaxed max-w-sm mx-auto pt-1">
            토글을 켜면 바로 연동됩니다. YouTube·Drive는 실제 계정 로그인, X·Pinterest는
            예시 데이터예요. 지금 안 하셔도 언제든 헤더의 <strong>플랫폼 데이터 연동</strong>에서
            다시 켤 수 있습니다.
          </p>
        </div>

        <div className="space-y-3">
          {platforms.map(platform => (
            <PlatformToggleRow
              key={platform.id}
              platform={platform}
              loading={loadingIds.includes(platform.id)}
              onToggleOn={() =>
                platform.kind === 'oauth'
                  ? onConnectGoogle(platform.id as GoogleScopeKey)
                  : onToggleDemo(platform.id)
              }
              onToggleOff={() =>
                platform.kind === 'oauth' ? onDisconnect(platform.id) : onToggleDemo(platform.id)
              }
              onResync={
                platform.kind === 'oauth' ? () => onConnectGoogle(platform.id as GoogleScopeKey) : undefined
              }
            />
          ))}
        </div>

        <div className="p-4 bg-[#F5F1EB] rounded-2xl border border-[#EBE3D5] flex items-start space-x-3 text-xs text-[#4A4A4A]">
          <ShieldCheck className="w-5 h-5 text-[#4A7C59] shrink-0 mt-0.5" />
          <p>
            비밀번호는 요청하지 않으며 읽기 전용 권한만 사용합니다. 아무것도 연동하지 않아도
            계속 이용할 수 있어요.
          </p>
        </div>

        <div className="flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-[#333333] hover:bg-[#222222] text-white font-bold text-xs rounded-full shadow-xs transition-colors cursor-pointer"
          >
            {connectedCount > 0 ? `연동 완료 (${connectedCount}개) · 시작하기` : '나중에 하기'}
          </button>
        </div>

      </div>
    </div>
  );
};
