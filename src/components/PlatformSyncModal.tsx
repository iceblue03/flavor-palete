import React, { useRef } from 'react';
import { X, ShieldCheck, Upload } from 'lucide-react';
import { PlatformConnection } from '../types';
import { GoogleScopeKey } from '../services/googleAuth';
import { PlatformToggleRow } from './PlatformToggleRow';

interface PlatformSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  platforms: PlatformConnection[];
  loadingIds: string[];
  onConnectGoogle: (scopeKey: GoogleScopeKey) => void;
  onDisconnect: (platformId: string) => void;
  onToggleDemo: (platformId: string) => void;
  onUploadTakeout: (file: File) => void;
}

export const PlatformSyncModal: React.FC<PlatformSyncModalProps> = ({
  isOpen,
  onClose,
  platforms,
  loadingIds,
  onConnectGoogle,
  onDisconnect,
  onToggleDemo,
  onUploadTakeout,
}) => {
  const takeoutInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const totalConnected = platforms.filter(p => p.connected).length;
  const totalItems = platforms.reduce((acc, p) => acc + (p.connected ? p.itemCount : 0), 0);

  const handleTakeoutPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    onUploadTakeout(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-[#EBE3D5] space-y-6 max-h-[90vh] overflow-y-auto">

        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center space-x-2 flex-wrap gap-y-1">
              <span className="px-3 py-0.5 bg-[#E8F3EB] text-[#4A7C59] border border-[#84A98C]/30 rounded-full text-xs font-bold">
                데이터 연동 센터
              </span>
              <span className="text-xs text-[#888888]">
                현재 {totalConnected}개 플랫폼 ({totalItems}건) 연동 중
              </span>
            </div>
            <h3 className="text-xl sm:text-2xl font-bold text-[#333333] mt-1">
              계정 로그인 & 예시 데이터 연동
            </h3>
            <p className="text-xs sm:text-sm text-[#7C7469] mt-1">
              YouTube·Google Drive는 같은 Google 로그인으로 실제 데이터를 가져옵니다. X·Pinterest는
              무료 API로 일반 사용자 데이터를 읽을 수 없어 <strong>예시 데이터 토글</strong>로 제공합니다.
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-2xl bg-[#F5F1EB] hover:bg-[#EBE3D5] text-[#7C7469] transition-colors cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Platform List */}
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
              extra={
                platform.id === 'youtube' ? (
                  <>
                    <button
                      onClick={() => takeoutInputRef.current?.click()}
                      className="flex items-center gap-1.5 text-[11px] font-bold text-[#7C7469] hover:text-[#333333] cursor-pointer text-left"
                    >
                      <Upload className="w-3.5 h-3.5 shrink-0" />
                      <span>전체 시청기록은 Google Takeout 파일로 가져오기 (watch-history.json)</span>
                    </button>
                    <input
                      ref={takeoutInputRef}
                      type="file"
                      accept="application/json"
                      onChange={handleTakeoutPick}
                      className="hidden"
                    />
                  </>
                ) : undefined
              }
            />
          ))}
        </div>

        {/* Security & Privacy Notice */}
        <div className="p-4 bg-[#F5F1EB] rounded-2xl border border-[#EBE3D5] flex items-start space-x-3 text-xs text-[#4A4A4A]">
          <ShieldCheck className="w-5 h-5 text-[#4A7C59] shrink-0 mt-0.5" />
          <p>
            비밀번호는 저장하지 않습니다. Google 로그인 후 발급되는 <strong>읽기 전용 토큰</strong>만 브라우저에
            보관하며, Drive는 파일 <strong>제목·형식 메타데이터만</strong> 조회하고 내용은 열지 않습니다. 언제든
            토글을 꺼서 즉시 연동을 해제할 수 있습니다.
          </p>
        </div>

        {/* Bottom Actions */}
        <div className="flex items-center justify-end space-x-3 pt-2">
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-[#333333] hover:bg-[#222222] text-white font-bold text-xs rounded-full shadow-xs transition-colors cursor-pointer"
          >
            확인
          </button>
        </div>

      </div>
    </div>
  );
};
