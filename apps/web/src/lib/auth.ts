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
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};
