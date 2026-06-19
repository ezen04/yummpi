'use client';

import { useState } from 'react';
import { Icon } from '@/components/common/Icon';

const BANKS = [
  'KB국민은행',
  '신한은행',
  '우리은행',
  '하나은행',
  'IBK기업은행',
  'NH농협은행',
  '카카오뱅크',
  '토스뱅크',
  'SC제일은행',
  '씨티은행',
  '케이뱅크',
  '새마을금고',
  '신협',
  '우체국',
  '수협은행',
  'BNK부산은행',
  'DGB대구은행',
  '광주은행',
  '전북은행',
  '제주은행',
];

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { bank: string; accountNumber: string; accountHolder: string }) => void;
};

export function RegisterAccountBottomSheet({ isOpen, onClose, onSubmit }: Props) {
  const [bank, setBank] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountHolder, setAccountHolder] = useState('');

  function handleSubmit() {
    if (!bank || !accountNumber || !accountHolder) return;
    onSubmit({ bank, accountNumber, accountHolder });
    setBank('');
    setAccountNumber('');
    setAccountHolder('');
  }

  const isValid = bank !== '' && accountNumber !== '' && accountHolder !== '';

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      {/* 딤 배경 */}
      <div
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
      />

      {/* 바텀시트 */}
      <div className="relative bg-[var(--bg-normal)] rounded-t-[20px] px-5 pt-3 pb-[max(32px,env(safe-area-inset-bottom))]">
        {/* 드래그 핸들 */}
        <div className="w-9 h-1 bg-[var(--line-normal)] rounded-full mx-auto mb-5" />

        {/* 닫기 버튼 */}
        <button
          onClick={onClose}
          className="absolute top-4 right-5 p-1 cursor-pointer"
        >
          <Icon name="x" size={20} color="var(--label-alternative)" />
        </button>

        {/* 타이틀 */}
        <p className="text-[17px] font-bold text-[var(--label-strong)] text-center mb-6">
          입금 받을 계좌 추가
        </p>

        <div className="flex flex-col gap-5">
          {/* 은행 선택 */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-[var(--label-normal)] flex items-center gap-1">
              은행 선택
              <span className="text-[var(--status-negative)] text-xs">●</span>
            </label>
            <div className="relative">
              <select
                value={bank}
                onChange={(e) => setBank(e.target.value)}
                className="w-full h-[52px] px-4 rounded-[var(--radius-12)] border border-[var(--line-normal)] bg-[var(--bg-normal)] text-sm text-[var(--label-strong)] appearance-none cursor-pointer focus:outline-none focus:border-[var(--primary)]"
              >
                <option value="" disabled>선택해주세요</option>
                {BANKS.map((b) => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
              <div className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2">
                <Icon name="chevron-down" size={16} color="var(--label-alternative)" />
              </div>
            </div>
          </div>

          {/* 계좌번호 */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-[var(--label-normal)] flex items-center gap-1">
              계좌번호
              <span className="text-[var(--status-negative)] text-xs">●</span>
            </label>
            <input
              type="text"
              inputMode="numeric"
              value={accountNumber}
              onChange={(e) => setAccountNumber(e.target.value.replace(/[^0-9]/g, ''))}
              placeholder="숫자만 입력해주세요"
              className="h-[52px] px-4 rounded-[var(--radius-12)] border border-[var(--line-normal)] bg-[var(--bg-normal)] text-sm text-[var(--label-strong)] placeholder:text-[var(--label-assistive)] focus:outline-none focus:border-[var(--primary)]"
            />
          </div>

          {/* 예금주 */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-[var(--label-normal)] flex items-center gap-1">
              예금주
              <span className="text-[var(--status-negative)] text-xs">●</span>
            </label>
            <input
              type="text"
              value={accountHolder}
              onChange={(e) => setAccountHolder(e.target.value)}
              placeholder="예금주명을 입력해주세요"
              className="h-[52px] px-4 rounded-[var(--radius-12)] border border-[var(--line-normal)] bg-[var(--bg-normal)] text-sm text-[var(--label-strong)] placeholder:text-[var(--label-assistive)] focus:outline-none focus:border-[var(--primary)]"
            />
          </div>

          {/* 안내 팁박스 */}
          <div className="rounded-[var(--radius-12)] bg-[var(--status-cautionary)]/10 px-4 py-3 flex items-center gap-2">
            <Icon name="check" size={16} color="var(--status-cautionary)" />
            <p className="text-xs text-[var(--status-cautionary)] leading-relaxed">
              정확한 계좌 정보를 입력해야 입금이 원활하게 진행됩니다.
            </p>
          </div>

          {/* 등록하기 버튼 */}
          <button
            onClick={handleSubmit}
            disabled={!isValid}
            className="w-full h-[52px] rounded-[var(--radius-12)] text-[16px] font-semibold bg-[var(--primary)] text-[var(--static-white)] disabled:bg-[var(--fill-disable)] disabled:text-[var(--label-disable)] cursor-pointer disabled:cursor-default transition-colors"
          >
            등록하기
          </button>
        </div>
      </div>
    </div>
  );
}
