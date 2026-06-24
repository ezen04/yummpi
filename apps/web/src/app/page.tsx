import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Button } from '@yummpi/ui';
import { KakaoLoginButton } from '@/components/auth/KakaoLoginButton';
import { GuestMemberCompare } from '@/components/auth/GuestMemberCompare';
import { getCurrentUser } from '@/lib/current-member';

// 로그인 회원은 대시보드로 보낸다(결정: /dashboard 생기면 자동 리다이렉트 연결).
export default async function Home() {
  const user = await getCurrentUser();
  if (user) redirect('/dashboard');

  return (
    <main
      className="min-h-screen flex flex-col items-center justify-between px-6 py-12"
      style={{ background: 'var(--bg-alternative)' }}
    >
      <div className="flex w-full max-w-sm flex-1 flex-col items-center justify-center gap-6 py-4">
        {/* 로고 · 안내 */}
        <div className="flex flex-col items-center gap-2 text-center">
          <h1
            className="text-4xl font-bold"
            style={{ color: 'var(--primary)' }}
          >
            yummpi
          </h1>
          <p className="text-sm" style={{ color: 'var(--label-alternative)' }}>
            모임을 만들려면 카카오 로그인이 필요해요
          </p>
        </div>

        {/* 게스트/회원 기능 비교 (#5) */}
        <GuestMemberCompare />
        <p
          className="px-2 text-center text-[12px] leading-5"
          style={{ color: 'var(--label-assistive)' }}
        >
          게스트는 링크를 통해 투표 · 소비 선택 · 송금 완료 알림을 쓸 수 있어요
        </p>
      </div>

      {/* 진입 CTA */}
      <div className="flex w-full max-w-sm flex-col gap-3 pt-2">
        <KakaoLoginButton callbackUrl="/dashboard" />
        {/* 결정#2: 딥링크 + 코드 직접 입력 둘 다 허용 → /join 코드 입력 화면으로 */}
        <Link href="/join" className="w-full">
          <Button variant="outline" className="w-full">
            게스트로 입장하기
          </Button>
        </Link>
      </div>
    </main>
  );
}
