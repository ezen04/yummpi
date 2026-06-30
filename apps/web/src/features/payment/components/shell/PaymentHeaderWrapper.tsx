'use client';

import { useRouter } from 'next/navigation';
import { Header } from '@/components/common/Header';

type PaymentHeaderWrapperProps = {
  title?: string;
  /** 종착 화면(모임 완료 등)은 false로 뒤로가기 버튼을 숨긴다 — 백-트랩 방지 */
  showBack?: boolean;
};

export function PaymentHeaderWrapper({
  title = '송금 현황',
  showBack = true,
}: PaymentHeaderWrapperProps) {
  const router = useRouter();

  return (
    <Header title={title} onBack={showBack ? () => router.back() : undefined} />
  );
}
