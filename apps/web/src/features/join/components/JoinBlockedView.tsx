import Link from 'next/link';
import { Button } from '@yummpi/ui';

// 입장 차단 공통 화면. 개인정보상 모임명은 노출하지 않고 사유만 안내한다.
export type BlockReason = 'INVALID' | 'EXPIRED' | 'COMPLETED';

const MESSAGES: Record<BlockReason, { title: string; desc: string }> = {
  INVALID: {
    title: '유효하지 않은 초대 링크예요',
    desc: '링크가 잘못되었거나 더 이상 사용할 수 없어요.',
  },
  EXPIRED: {
    title: '만료된 모임이에요',
    desc: '이 모임은 더 이상 입장할 수 없어요.',
  },
  COMPLETED: {
    title: '이미 종료된 모임이에요',
    desc: '모임이 끝나 입장할 수 없어요.',
  },
};

export function JoinBlockedView({ reason }: { reason: BlockReason }) {
  const { title, desc } = MESSAGES[reason];

  return (
    <main
      className="min-h-screen flex flex-col items-center justify-center gap-6 px-6 text-center"
      style={{ background: 'var(--bg-alternative)' }}
    >
      <div className="space-y-2">
        <h1
          className="text-2xl font-bold"
          style={{ color: 'var(--label-normal)' }}
        >
          {title}
        </h1>
        <p style={{ color: 'var(--label-alternative)' }}>{desc}</p>
      </div>
      <Link href="/" className="w-full max-w-xs">
        <Button className="w-full">홈으로</Button>
      </Link>
    </main>
  );
}
