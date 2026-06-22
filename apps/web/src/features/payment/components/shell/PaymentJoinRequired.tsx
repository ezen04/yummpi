'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/common/Button';
import { Icon } from '@/components/common/Icon';
import { PaymentHeaderWrapper } from './PaymentHeaderWrapper';

type Props = {
  meetingId?: string;
};

export function PaymentJoinRequired({ meetingId }: Props) {
  const router = useRouter();

  const handleSignIn = () => {
    const callbackUrl = meetingId ? `/meetings/${meetingId}/payments` : '/';
    router.push(
      `/api/auth/signin?callbackUrl=${encodeURIComponent(callbackUrl)}`
    );
  };

  return (
    <div className="flex flex-col h-full overflow-hidden bg-[var(--bg-normal)]">
      <PaymentHeaderWrapper />

      <div className="flex-1 flex flex-col items-center justify-start pt-16 gap-8 px-5 text-center">
        <div className="w-16 h-16 rounded-full bg-[var(--bg-alternative)] flex items-center justify-center">
          <Icon name="users" size={28} color="var(--label-assistive)" />
        </div>

        <div className="space-y-1">
          <p className="text-base font-semibold text-[var(--label-strong)]">
            모임 참여 확인이 필요해요
          </p>
          <p className="text-sm text-[var(--label-alternative)] leading-5">
            이 모임은 초대 링크로 입장한 멤버만 볼 수 있어요.
          </p>
        </div>

        <div className="w-full flex flex-col gap-8">
          <div className="space-y-2">
            <p className="text-sm text-[var(--label-assistive)] leading-5">
              회원이신가요? 카카오 계정으로 로그인해 주세요.
            </p>
            <Button
              variant="basic"
              size="lg"
              onClick={handleSignIn}
              className="w-full text-sm"
            >
              카카오로 로그인
            </Button>
          </div>

          <div className="space-y-2">
            <p className="text-sm text-[var(--label-assistive)] leading-5">
              게스트라면 호스트에게 초대 링크를 다시 요청해 주세요.
            </p>
            <Button
              variant="outline"
              size="lg"
              onClick={() => router.push('/')}
              className="w-full text-sm"
            >
              홈으로 가기
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
