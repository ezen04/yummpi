'use client';

import { signIn } from 'next-auth/react';

/**
 * 카카오 로그인 시작 버튼 (임시 구현).
 *
 * ⚠️ ②의 공식 `@yummpi/ui` KakaoLoginButton이 나오면 교체한다.
 * 색상은 디자인 토큰(`--brand-kakao`/`--static-black`) 사용.
 *
 * 로그인 성공 후 callbackUrl로 이동. 기본은 랜딩('/').
 * label로 문구 교체(예: 에러 페이지의 "다시 시도").
 * (로그인 회원 자동 리다이렉트는 /dashboard 라우트 작업 시 연결 예정)
 */
export function KakaoLoginButton({
  callbackUrl = '/',
  label = '카카오로 시작하기',
}: {
  callbackUrl?: string;
  label?: string;
}) {
  return (
    <button
      type="button"
      onClick={() => signIn('kakao', { callbackUrl })}
      className="flex h-12 w-full items-center justify-center gap-2 rounded-xl text-base font-semibold transition-[filter] duration-100 active:[filter:brightness(0.95)] bg-[var(--brand-kakao)] text-[var(--static-black)]"
    >
      {label}
    </button>
  );
}
