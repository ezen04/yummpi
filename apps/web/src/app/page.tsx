import { Button } from '@yummpi/ui';
// import { KakaoLoginButton } from '@yummpi/ui'
import { Check, Plus } from '@yummpi/ui';
import Link from 'next/link';

export default function Home() {
  return (
    <main
      className="min-h-screen flex flex-col items-center justify-center gap-8 px-4"
      style={{ background: 'var(--bg-alternative)' }}
    >
      <div className="text-center space-y-2">
        <h1 className="text-4xl font-bold" style={{ color: 'var(--primary)' }}>
          yummpi
        </h1>
        <p style={{ color: 'var(--label-alternative)' }}>
          모임 장소 추천 · 투표 · 정산
        </p>
      </div>

      <div className="flex flex-col gap-3 w-full max-w-xs">
        {/* <KakaoLoginButton /> */}
        <Button variant="outline" className="w-full">
          게스트로 입장하기
        </Button>
      </div>

      <div className="flex gap-2">
        <Button size="sm" leftIcon={<Check />}>
          완료
        </Button>
        <Button size="sm" variant="outline" leftIcon={<Plus />}>
          추가
        </Button>
        <Button size="sm" variant="link">
          더보기
        </Button>
        <Button size="sm" disabled>
          비활성
        </Button>
      </div>

      <Link
        href="/dev"
        className="text-sm"
        style={{ color: 'var(--label-assistive)' }}
      >
        → 디자인 시스템 전체 보기
      </Link>
    </main>
  );
}
