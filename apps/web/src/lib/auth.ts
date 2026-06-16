import { PrismaAdapter } from "@auth/prisma-adapter";
import type { NextAuthOptions } from "next-auth";
import KakaoProvider from "next-auth/providers/kakao";
import { prisma } from "@/lib/prisma";

// 게스트는 NextAuth를 사용하지 않는다(ERD v2.2 b안).
// 모임 범위 서명 토큰 → 쿠키, 해시는 meeting_members.guest_token_hash.
// CredentialsProvider는 DB 세션 전략과 호환 불가하여 제거.
export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: "database",
  },
  providers: [
    KakaoProvider({
      clientId: process.env.KAKAO_CLIENT_ID!,
      clientSecret: process.env.KAKAO_CLIENT_SECRET!,
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
