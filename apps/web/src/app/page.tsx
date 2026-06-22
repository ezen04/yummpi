import { Button } from '@yummpi/ui';
import { KakaoLoginButton } from '@/components/auth/KakaoLoginButton';

export default function Home() {
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
        <KakaoLoginButton callbackUrl="/" />
        {/*
          "초대 링크로 입장하기"는 결정#2(딥링크 전용 vs 코드 직접 입력)
          확정 전까지 보류. 결정 후 활성화한다.
          (docs/온보딩-화면-체크리스트.md 결정 대기 2번)
        */}
        <Button variant="outline" className="w-full" disabled>
          초대 링크로 입장하기 (준비 중)
        </Button>
      </div>
    </main>
  );
}
