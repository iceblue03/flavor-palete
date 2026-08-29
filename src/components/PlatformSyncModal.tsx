import React, { useState } from 'react';
import { X, RefreshCw, Check, Film, Palette, BookOpen, Star, Music, Ticket, Sparkles, ShieldCheck } from 'lucide-react';
import { PlatformConnection } from '../types';

interface PlatformSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  platforms: PlatformConnection[];
  onTogglePlatform: (platformId: string) => void;
  onTriggerFullSync: () => void;
}

export const PlatformSyncModal: React.FC<PlatformSyncModalProps> = ({
  isOpen,
  onClose,
  platforms,
  onTogglePlatform,
  onTriggerFullSync,
}) => {
  const [syncingId, setSyncingId] = useState<string | null>(null);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSyncSingle = (id: string, name: string) => {
    setSyncingId(id);
    setTimeout(() => {
      onTogglePlatform(id);
      setSyncingId(null);
      setSyncMessage(`${name} 데이터가 성공적으로 동기화되었습니다!`);
      setTimeout(() => setSyncMessage(null), 3000);
    }, 900);
  };

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'Film': return <Film className="w-5 h-5" />;
      case 'Palette': return <Palette className="w-5 h-5" />;
      case 'BookOpen': return <BookOpen className="w-5 h-5" />;
      case 'Star': return <Star className="w-5 h-5" />;
      case 'Music': return <Music className="w-5 h-5" />;
      case 'Ticket': return <Ticket className="w-5 h-5" />;
      default: return <Film className="w-5 h-5" />;
    }
  };

  const totalConnected = platforms.filter(p => p.connected).length;
  const totalItems = platforms.reduce((acc, p) => acc + (p.connected ? p.itemCount : 0), 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-[#EBE3D5] space-y-6 max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center space-x-2">
              <span className="px-3 py-0.5 bg-[#E8F3EB] text-[#4A7C59] border border-[#84A98C]/30 rounded-full text-xs font-bold">
                데이터 연동 센터
              </span>
              <span className="text-xs text-[#888888]">
                현재 {totalConnected}개 플랫폼 ({totalItems}건) 연동 중
              </span>
            </div>
            <h3 className="text-xl sm:text-2xl font-bold text-[#333333] mt-1">
              플랫폼 이용 데이터 실시간 동기화
            </h3>
            <p className="text-xs sm:text-sm text-[#7C7469] mt-1">
              자주 이용하는 OTT, 웹툰, 전자책 플랫폼을 연결하여 <strong>나만의 숨은 취향 DNA</strong>를 더 정교하게 분석하세요.
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-2xl bg-[#F5F1EB] hover:bg-[#EBE3D5] text-[#7C7469] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {syncMessage && (
          <div className="p-3 bg-[#E8F3EB] text-[#4A7C59] border border-[#84A98C]/30 rounded-2xl text-xs font-bold flex items-center gap-2 animate-in slide-in-from-top-2">
            <Check className="w-4 h-4 text-[#4A7C59] shrink-0" />
            <span>{syncMessage}</span>
          </div>
        )}

        {/* Platform List */}
        <div className="space-y-3">
          {platforms.map(platform => {
            const isSyncing = syncingId === platform.id;

            return (
              <div
                key={platform.id}
                className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                  platform.connected
                    ? 'bg-[#F5F1EB]/80 border-[#EBE3D5]'
                    : 'bg-white border-[#EBE3D5] opacity-85 hover:opacity-100'
                }`}
              >
                <div className="flex items-center space-x-3.5">
                  <div
                    className="w-11 h-11 rounded-2xl flex items-center justify-center text-white shadow-xs shrink-0"
                    style={{ backgroundColor: platform.color }}
                  >
                    {getIcon(platform.iconName)}
                  </div>

                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-bold text-[#333333]">{platform.name}</span>
                      <span className="text-[10px] font-bold text-[#7C7469] bg-[#F5F1EB] border border-[#EBE3D5] px-2 py-0.5 rounded-md">
                        {platform.category}
                      </span>
                    </div>

                    <div className="text-xs text-[#888888] mt-0.5">
                      {platform.connected ? (
                        <span className="text-[#4A7C59] font-semibold flex items-center gap-1">
                          <Check className="w-3 h-3 text-[#4A7C59]" />
                          {platform.itemCount}건 연동 완료 ({platform.lastSyncedAt || '최근 동기화'})
                        </span>
                      ) : (
                        <span className="text-[#A89F91]">미연동 상태 (클릭하여 1초 연결)</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2 shrink-0">
                  <button
                    onClick={() => handleSyncSingle(platform.id, platform.name)}
                    disabled={isSyncing}
                    className={`px-4 py-2 rounded-full text-xs font-bold transition-all cursor-pointer flex items-center space-x-1.5 ${
                      platform.connected
                        ? 'bg-white hover:bg-[#F5F1EB] text-[#4A4A4A] border border-[#EBE3D5]'
                        : 'bg-[#84A98C] hover:bg-[#4A7C59] text-white shadow-xs'
                    }`}
                  >
                    {isSyncing ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>동기화 중...</span>
                      </>
                    ) : platform.connected ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 text-[#7C7469]" />
                        <span>재동기화</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3.5 h-3.5 text-[#FFD275]" />
                        <span>연결하기</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Security & Privacy Notice */}
        <div className="p-4 bg-[#F5F1EB] rounded-2xl border border-[#EBE3D5] flex items-start space-x-3 text-xs text-[#4A4A4A]">
          <ShieldCheck className="w-5 h-5 text-[#4A7C59] shrink-0 mt-0.5" />
          <p>
            취향팔레트는 비밀번호를 저장하지 않으며, <strong>콘텐츠 시청/열람 이력 및 별점 데이터만 암호화되어 취향 분석에 활용</strong>됩니다.
          </p>
        </div>

        {/* Bottom Actions */}
        <div className="flex items-center justify-end space-x-3 pt-2">
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-[#333333] hover:bg-[#222222] text-white font-bold text-xs rounded-full shadow-xs transition-colors cursor-pointer"
          >
            확인 및 취향 다시 분석
          </button>
        </div>

      </div>
    </div>
  );
};
