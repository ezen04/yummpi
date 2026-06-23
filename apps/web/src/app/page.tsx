import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Button } from '@yummpi/ui';
import { KakaoLoginButton } from '@/components/auth/KakaoLoginButton';
import { getCurrentUser } from '@/lib/current-member';

// 로그인 회원은 대시보드로 보낸다(결정: /dashboard 생기면 자동 리다이렉트 연결).
export default async function Home() {
  const user = await getCurrentUser();
  if (user) redirect('/dashboard');

  return (
    <main
      className="min-h-screen flex flex-col items-center justify-between px-6 py-16"
      style={{ background: 'var(--bg-alternative)' }}
    >
      {/* 로고 · 태그라인 */}
      <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center">
        <h1 className="text-5xl font-bold" style={{ color: 'var(--primary)' }}>
          yummpi
        </h1>
        <p className="text-base" style={{ color: 'var(--label-alternative)' }}>
          모임 장소 추천부터 투표 · 예약 · 정산까지
        </p>
      </div>

      {/* 진입 CTA */}
      <div className="flex w-full max-w-xs flex-col gap-3">
        <KakaoLoginButton callbackUrl="/dashboard" />
        {/* 결정#2: 딥링크 + 코드 직접 입력 둘 다 허용 → /join 코드 입력 화면으로 */}
        <Link href="/join" className="w-full">
          <Button variant="outline" className="w-full">
            초대 링크로 입장하기
          </Button>
        </Link>
      </div>
    </main>
  );
}
