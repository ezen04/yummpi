'use client';

import { useState } from 'react';
import { BottomSheet } from '@/components/common/BottomSheet';
import { Button } from '@/components/common/Button';
import { Icon } from '@/components/common/Icon';
import { IconButton } from '@/components/common/IconButton';
import { Input } from '@/components/common/Input';
import '../payment-montage.css';

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
  onSubmit: (data: {
    bank: string;
    accountNumber: string;
    accountHolder: string;
  }) => void;
};

export function RegisterAccountBottomSheet({
  isOpen,
  onClose,
  onSubmit,
}: Props) {
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

  return (
    <BottomSheet
      open={isOpen}
      onClose={onClose}
      className="mx-auto w-full max-w-[390px] px-5 pt-3"
    >
      <div className="relative">
        {/* 닫기 버튼 */}
        <div className="absolute -top-1 right-0">
          <IconButton
            onClick={onClose}
            size={32}
            icon={<Icon name="x" size={20} color="var(--label-alternative)" />}
          />
        </div>

        {/* 타이틀 */}
        <p className="mtg-headline1 is-bold text-[var(--label-strong)] text-center mb-6">
          입금 받을 계좌 추가
        </p>

        <div className="flex flex-col gap-5">
          {/* 은행 선택 */}
          <div className="flex flex-col gap-1.5">
            <label className="mtg-label1 is-bold text-[var(--label-normal)] flex items-center gap-1.5">
              은행 선택
              <span className="w-1 h-1 rounded-full bg-[var(--primary)] inline-block" />
            </label>
            <div className="relative flex items-center h-[50px] rounded-[var(--radius-12)] border border-[var(--line-neutral)] bg-[var(--bg-normal)] focus-within:border-[var(--primary-border)] transition-[border-color]">
              <select
                value={bank}
                onChange={(e) => setBank(e.target.value)}
                className="w-full h-full px-[14px] appearance-none border-none outline-none bg-transparent text-[16px] cursor-pointer text-[var(--label-strong)] [&:invalid]:text-[var(--label-assistive)]"
              >
                <option value="" disabled>
                  선택해주세요
                </option>
                {BANKS.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute right-[14px]">
                <Icon
                  name="chevron-down"
                  size={20}
                  color="var(--label-assistive)"
                />
              </div>
            </div>
          </div>

          {/* 계좌번호 */}
          <Input
            label="계좌번호"
            required
            type="text"
            inputMode="numeric"
            value={accountNumber}
            onChange={(e) =>
              setAccountNumber(e.target.value.replace(/[^0-9]/g, ''))
            }
            placeholder="숫자만 입력해주세요"
          />

          {/* 예금주 */}
          <Input
            label="예금주"
            required
            type="text"
            value={accountHolder}
            onChange={(e) => setAccountHolder(e.target.value)}
            placeholder="예금주명을 입력해주세요"
          />

          {/* 안내 팁박스 */}
          <div className="rounded-[var(--radius-12)] bg-[var(--status-cautionary)]/10 px-4 py-3 flex items-center gap-2">
            <Icon name="check" size={16} color="var(--status-cautionary)" />
            <p className="text-xs text-[var(--status-cautionary)] leading-relaxed">
              정확한 계좌 정보를 입력해야 입금이 원활하게 진행됩니다.
            </p>
          </div>

          {/* 등록하기 버튼 */}
          <Button
            variant="basic"
            size="lg"
            onClick={handleSubmit}
            disabled={!isValid}
            className="w-full h-[56px] rounded-[14px]"
          >
            등록하기
          </Button>
        </div>
      </div>
    </BottomSheet>
  );
}
