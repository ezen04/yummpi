'use client';

import { useRouter } from 'next/navigation';
import { Header } from '@/components/common/Header';

type PaymentHeaderWrapperProps = {
  title?: string;
};

export function PaymentHeaderWrapper({
  title = '송금 현황',
}: PaymentHeaderWrapperProps) {
  const router = useRouter();

  return <Header title={title} onBack={() => router.back()} />;
}
