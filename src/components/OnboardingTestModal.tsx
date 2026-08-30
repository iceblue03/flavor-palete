import React, { useState } from 'react';
import { Sparkles, ArrowRight, ArrowLeft, X, Palette } from 'lucide-react';
import { OnboardingResult, TasteDNAScores } from '../types';
import { ONBOARDING_QUESTIONS, scoreOnboardingAnswers } from '../data/onboardingQuestions';

interface OnboardingTestModalProps {
  isOpen: boolean;
  onComplete: (result: OnboardingResult) => void;
  onSkip: () => void;
}

export const OnboardingTestModal: React.FC<OnboardingTestModalProps> = ({
  isOpen,
  onComplete,
  onSkip,
}) => {
  const [started, setStarted] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});

  if (!isOpen) return null;

  const total = ONBOARDING_QUESTIONS.length;
  const question = ONBOARDING_QUESTIONS[stepIndex];
  const progress = Math.round((stepIndex / total) * 100);

  const handleSelect = (optionId: string) => {
    const nextAnswers = { ...answers, [question.id]: optionId };
    setAnswers(nextAnswers);

    if (stepIndex < total - 1) {
      setStepIndex(stepIndex + 1);
      return;
    }

    const scores: TasteDNAScores = scoreOnboardingAnswers(nextAnswers);
    onComplete({
      completed: true,
      completedAt: new Date().toISOString(),
      answers: nextAnswers,
      scores,
    });
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-[#EBE3D5] max-h-[90vh] overflow-y-auto">

        {!started ? (
          /* ---------- 인트로 화면 ---------- */
          <div className="space-y-6 text-center">
            <div className="flex justify-center">
              <div
                className="w-16 h-16 rounded-3xl flex items-center justify-center shadow-xs"
                style={{ background: 'linear-gradient(135deg, #84A98C, #FF8B7E)' }}
              >
                <Palette className="w-8 h-8 text-white" />
              </div>
            </div>

            <div className="space-y-2">
              <span className="inline-block px-3 py-0.5 bg-[#E8F3EB] text-[#4A7C59] border border-[#84A98C]/30 rounded-full text-xs font-bold">
                처음 오셨네요 · 30초 취향 테스트
              </span>
              <h2 className="text-2xl sm:text-3xl font-bold text-[#333333] tracking-tight">
                당신의 취향 팔레트를<br />찾아드릴게요
              </h2>
              <p className="text-sm text-[#7C7469] leading-relaxed max-w-md mx-auto pt-1">
                {total}개의 질문에만 답하면 6축 취향 DNA를 분석해 유형을 알려드립니다.
                유행에 휩쓸리지 않는 <strong>나만의 숨은 명작</strong>은 여기서부터 시작돼요.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
              <button
                onClick={() => setStarted(true)}
                className="flex-1 py-3.5 px-6 bg-[#84A98C] hover:bg-[#4A7C59] text-white font-bold text-sm rounded-full shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-2"
              >
                <Sparkles className="w-4 h-4 text-[#FFD275]" />
                <span>테스트 시작하기</span>
              </button>
              <button
                onClick={onSkip}
                className="sm:flex-none px-6 py-3.5 bg-[#F5F1EB] hover:bg-[#EBE3D5] text-[#7C7469] font-bold text-sm rounded-full transition-colors cursor-pointer"
              >
                나중에 하기
              </button>
            </div>

            <p className="text-[11px] text-[#A89F91]">
              테스트 결과는 언제든 다시 조정할 수 있어요.
            </p>
          </div>
        ) : (
          /* ---------- 질문 화면 ---------- */
          <div className="space-y-5">
            {/* 진행 표시 */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-[#4A7C59] bg-[#E8F3EB] border border-[#84A98C]/30 px-2.5 py-0.5 rounded-full">
                  {stepIndex + 1} / {total}
                </span>
                <span className="text-xs text-[#A89F91]">취향 테스트</span>
              </div>
              <button
                onClick={onSkip}
                className="p-1.5 rounded-xl text-[#A89F91] hover:bg-[#F5F1EB] hover:text-[#7C7469] transition-colors cursor-pointer"
                title="건너뛰기"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="w-full h-1.5 bg-[#EBE3D5] rounded-full overflow-hidden">
              <div
                className="h-full bg-[#84A98C] rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>

            {/* 질문 */}
            <div className="pt-1">
              <div className="text-3xl mb-2">{question.emoji}</div>
              <h3 className="text-lg sm:text-xl font-bold text-[#333333] leading-snug">
                {question.question}
              </h3>
            </div>

            {/* 보기 */}
            <div className="space-y-2.5">
              {question.options.map(option => {
                const isSelected = answers[question.id] === option.id;
                return (
                  <button
                    key={option.id}
                    onClick={() => handleSelect(option.id)}
                    className={`w-full text-left p-4 rounded-2xl border transition-all cursor-pointer group ${
                      isSelected
                        ? 'bg-[#E8F3EB] border-[#84A98C]'
                        : 'bg-white border-[#EBE3D5] hover:border-[#84A98C] hover:bg-[#F5F1EB]/60'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <div className="text-sm font-bold text-[#333333]">{option.label}</div>
                        <div className="text-xs text-[#A89F91] mt-0.5">{option.hint}</div>
                      </div>
                      <ArrowRight className="w-4 h-4 text-[#EBE3D5] group-hover:text-[#84A98C] shrink-0 transition-colors" />
                    </div>
                  </button>
                );
              })}
            </div>

            {stepIndex > 0 && (
              <button
                onClick={() => setStepIndex(stepIndex - 1)}
                className="flex items-center gap-1.5 text-xs font-bold text-[#A89F91] hover:text-[#7C7469] transition-colors cursor-pointer pt-1"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>이전 질문</span>
              </button>
            )}
          </div>
        )}

      </div>
    </div>
  );
};
