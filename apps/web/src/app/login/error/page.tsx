import Link from 'next/link';
import { Button } from '@yummpi/ui';
import { KakaoLoginButton } from '@/components/auth/KakaoLoginButton';

/**
 * 카카오 로그인 실패·취소 안내 (NextAuth `pages.error` 대상).
 * NextAuth가 `?error=` 코드를 붙여 리다이렉트한다.
 */

const MESSAGES: Record<string, { title: string; desc: string }> = {
  OAuthSignin: {
    title: '로그인을 시작하지 못했어요',
    desc: '카카오 연결에 문제가 있어요. 잠시 후 다시 시도해 주세요.',
  },
  OAuthCallback: {
    title: '로그인에 실패했어요',
    desc: '카카오 인증 처리 중 문제가 생겼어요. 다시 시도해 주세요.',
  },
  Callback: {
    title: '로그인에 실패했어요',
    desc: '인증 처리 중 문제가 생겼어요. 다시 시도해 주세요.',
  },
  AccessDenied: {
    title: '로그인이 취소되었어요',
    desc: '카카오 로그인 동의가 취소되었어요. 다시 시도할 수 있어요.',
  },
  Configuration: {
    title: '로그인 설정에 문제가 있어요',
    desc: '잠시 후 다시 시도하거나 관리자에게 문의해 주세요.',
  },
};

const FALLBACK = {
  title: '로그인에 실패했어요',
  desc: '잠시 후 다시 시도해 주세요.',
};

export default async function LoginErrorPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const { title, desc } = (error && MESSAGES[error]) || FALLBACK;

  return (
    <main
      className="min-h-screen flex flex-col items-center justify-center gap-8 px-6 text-center"
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

      <div className="flex w-full max-w-xs flex-col gap-3">
        <KakaoLoginButton callbackUrl="/" label="카카오로 다시 시도" />
        <Link href="/" className="w-full">
          <Button variant="outline" className="w-full">
            홈으로
          </Button>
        </Link>
      </div>
    </main>
  );
}
