import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';

// ① 모임·인증 리드: NextAuth(Auth.js v5). 게스트 닉네임 = Credentials provider.
// AUTH_SECRET 은 NestJS JWT_SECRET 과 동일 값으로 공유해야 브릿지 동작.
export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      name: 'guest',
      credentials: { nickname: {}, meetingId: {} },
      async authorize() {
        // TODO(①): NestJS /auth/guest 호출 → JWT 발급 → user 반환
        return null;
      },
    }),
  ],
  session: { strategy: 'jwt' },
});
