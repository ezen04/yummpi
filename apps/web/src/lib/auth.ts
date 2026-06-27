import { PrismaAdapter } from '@auth/prisma-adapter';
import type { NextAuthOptions } from 'next-auth';
import KakaoProvider from 'next-auth/providers/kakao';
import { prisma } from '@/lib/prisma';

// 게스트는 NextAuth를 사용하지 않는다(ERD v2.2 b안).
// 모임 범위 서명 토큰 → 쿠키, 해시는 meeting_members.guest_token_hash.
// CredentialsProvider는 DB 세션 전략과 호환 불가하여 제거.

// 서브도메인(ws.yummpi.com) 소켓 핸드셰이크가 세션 쿠키를 읽으려면
// prod에서 쿠키를 상위 도메인(.yummpi.com)으로 발급해야 한다(aws-vercel.md §3.3/§16.3).
// COOKIE_DOMAIN은 Vercel Production에만 '.yummpi.com'으로 설정 — 로컬/Preview는 비운다(host-only).
// session-token만 오버라이드한다(csrf 등 __Host- 쿠키는 Domain 속성 금지 → 기본값 유지,
// 소켓 인증엔 session-token만 필요).
const cookieDomain = process.env.COOKIE_DOMAIN;
const sessionCookieOverride: NextAuthOptions['cookies'] = cookieDomain
  ? {
      sessionToken: {
        name: '__Secure-next-auth.session-token',
        options: {
          httpOnly: true,
          sameSite: 'lax',
          path: '/',
          secure: true,
          domain: cookieDomain,
        },
      },
    }
  : undefined;

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: 'database',
  },
  ...(sessionCookieOverride ? { cookies: sessionCookieOverride } : {}),
  pages: {
    // OAuth 실패·취소 시 NextAuth 기본 화면 대신 커스텀 안내로.
    error: '/login/error',
  },
  providers: [
    KakaoProvider({
      clientId: process.env.KAKAO_CLIENT_ID!,
      clientSecret: process.env.KAKAO_CLIENT_SECRET!,
      // 카카오 닉네임 수집(정책: 닉네임만, 이메일 제외). 콘솔 동의항목 ON 필요.
      authorization: { params: { scope: 'profile_nickname' } },
    }),
  ],
  callbacks: {
    async session({ session, user }) {
      if (session.user && user) {
        session.user.id = user.id;
        // 편집용 닉네임(adapter name과 분리). 미설정 시 카카오 name으로 노출.
        const nickname = (user as { nickname?: string | null }).nickname;
        session.user.nickname = nickname ?? user.name ?? null;
      }
      return session;
    },
  },
  events: {
    // 최초 가입 시 편집용 닉네임을 카카오 이름으로 초기화.
    async createUser({ user }) {
      if (!user.name) return;
      await prisma.user.update({
        where: { id: user.id },
        data: { nickname: user.name },
      });
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};
