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

      <div className="flex-1 flex flex-col items-center justify-center gap-5 px-5 text-center">
        <div className="w-16 h-16 rounded-full bg-[var(--bg-alternative)] flex items-center justify-center">
          <Icon name="users" size={28} color="var(--label-assistive)" />
        </div>

        <div className="space-y-2">
          <p className="text-base font-semibold text-[var(--label-strong)]">
            모임 참여 확인이 필요해요
          </p>
          <p className="text-sm text-[var(--label-alternative)] leading-5">
            이 모임은 초대 링크로 입장한 멤버만 볼 수 있어요.
          </p>
          <p className="text-sm text-[var(--label-assistive)] leading-5">
            회원이면 카카오 계정으로 로그인하고, 게스트라면 기존에 받은 초대
            링크로 다시 입장해 주세요.
          </p>
        </div>

        <div className="mt-2 flex flex-col items-center gap-2">
          <Button
            variant="basic"
            size="lg"
            onClick={handleSignIn}
            className="w-auto px-6 text-sm"
          >
            카카오로 로그인
          </Button>
          <Button
            variant="outline"
            size="lg"
            onClick={() => router.push('/')}
            className="w-auto px-6 text-sm"
          >
            홈으로 가기
          </Button>
        </div>
      </div>
    </div>
  );
}
