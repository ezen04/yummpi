/**
 * dev-login.ts — 로컬 전용 멤버 로그인 헬퍼 (① auth).
 *
 * 우리 앱은 회원 = NextAuth DB 세션(PrismaAdapter)이라, `sessions` 행만 있으면
 * 카카오 OAuth 없이 그 회원으로 "로그인 상태"가 된다. seed.ts의 더미 멤버는
 * `accounts` 행이 없어 OAuth로는 못 들어가는데(= seed.ts 주석), 이 헬퍼가 그 구멍을 메운다.
 *
 * ⚠️ 로컬(http://localhost) 전용. Vercel(prod)에는 쓰지 말 것
 *    - prod DB(RDS) 오염 + https 쿠키명이 `__Secure-` 접두라 값이 달라짐.
 *    - Vercel 회원 검증은 실제 카카오 로그인(1단계)으로.
 *    - prod 가드: `DATABASE_URL`이 prisma://(Accelerate)이거나 localhost가 아니면 즉시 거부
 *      (의도적 우회는 `DEV_LOGIN_ALLOW=1`).
 * ⚠️ Credentials provider를 쓰지 않는다(CLAUDE.md 금지). PrismaAdapter가 이미 이해하는
 *    `sessions` 행만 삽입하므로 authOptions/코드 변경 0.
 * ℹ️ seed.ts와 같은 결의 커밋되는 dev 툴(공유용). 운영 코드 경로에는 포함되지 않는다.
 *
 * 실행 (apps/server 기준):
 *   pnpm --filter @yummpi/server exec tsx prisma/dev-login.ts <email|nickname|userId> [inviteCode]
 *
 * 예:
 *   tsx prisma/dev-login.ts 수아                                        # 회원 '수아' 세션 발급
 *   tsx prisma/dev-login.ts test@dev.local SEEDPAY1                     # 발급 + 모임 SEEDPAY1 회원 참여
 *   tsx prisma/dev-login.ts 22222222-2222-4222-8222-222222222222 SEEDPAY1
 *                                                                       # seed.ts 더미('수아')로 로그인
 */

import { PrismaClient } from '@prisma/client';
import { createHash, randomUUID } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

// bare `tsx` 실행은 .env를 자동 로드하지 않으므로(seed는 `prisma db seed`가 로드) 직접 읽는다.
loadEnv();

const prisma = new PrismaClient();

const SESSION_TTL_DAYS = 30;
const COOKIE_NAME = 'next-auth.session-token'; // 로컬 http 기준 (https는 __Secure- 접두)
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function main() {
  const identity = process.argv[2];
  const inviteCode = process.argv[3];

  if (!identity) {
    console.error(
      '사용법: tsx prisma/dev-login.ts <email|nickname|userId> [inviteCode]'
    );
    process.exit(1);
  }

  assertLocalDb();

  // 1) 회원 User 확정 (게스트 아님 → userId 정상 보유).
  let userId: string;
  let nickname: string;
  let email: string | null;

  if (UUID_RE.test(identity)) {
    // userId 직접 지정 → 기존 회원(예: seed 더미)으로 로그인. 생성하지 않음.
    const found = await prisma.user.findUnique({ where: { id: identity } });
    if (!found) {
      console.error(
        `❌ userId='${identity}' 회원 없음. seed 먼저 실행했는지 확인.`
      );
      process.exit(1);
    }
    userId = found.id;
    nickname = found.nickname ?? found.name ?? '회원';
    email = found.email;
  } else {
    // email이면 그대로, 닉네임이면 안정적 이메일 키로 합성(재실행 멱등).
    const isEmail = identity.includes('@');
    nickname = isEmail ? identity.split('@')[0] : identity;
    email = isEmail ? identity : `dev-${shortHash(identity)}@dev.local`;

    const user = await prisma.user.upsert({
      where: { email },
      update: { nickname },
      create: { email, nickname, name: nickname },
    });
    userId = user.id;
  }

  // 2) 기존 dev 세션 정리 후 새 Session 발급 (sessionToken = 그대로 쿠키 값).
  await prisma.session.deleteMany({ where: { userId } });
  const sessionToken = randomUUID();
  const expires = new Date(Date.now() + SESSION_TTL_DAYS * 864e5);
  await prisma.session.create({ data: { sessionToken, userId, expires } });

  // 3) inviteCode 주면 그 모임에 회원으로 참여(중복 방지 + 재입장 시 leftAt 해제).
  let meetingLine = '';
  if (inviteCode) {
    const meeting = await prisma.meeting.findUnique({
      where: { inviteCode },
      select: { id: true, title: true, status: true },
    });
    if (!meeting) {
      console.warn(
        `⚠️  inviteCode='${inviteCode}' 모임 없음 — 멤버 연결 생략.`
      );
    } else {
      const existing = await prisma.meetingMember.findFirst({
        where: { meetingId: meeting.id, userId },
        select: { id: true },
      });
      if (existing) {
        await prisma.meetingMember.update({
          where: { id: existing.id },
          data: { leftAt: null, nickname },
        });
      } else {
        await prisma.meetingMember.create({
          data: { meetingId: meeting.id, userId, nickname, role: 'MEMBER' },
        });
      }
      meetingLine =
        `\n  모임:      ${meeting.title} (${meeting.status})` +
        `\n  허브 URL:  http://localhost:3000/meetings/${meeting.id}`;
    }
  }

  console.log(`
✅ dev 로그인 세션 발급 완료 (로컬 전용)

  회원:      ${nickname}${email ? `  <${email}>` : ''}
  userId:    ${userId}${meetingLine}

  ── 브라우저에 쿠키 한 줄 심으면 그 회원으로 로그인 상태 ──
  1) http://localhost:3000 접속 → DevTools(F12) > Application > Cookies > http://localhost:3000
  2) 쿠키 추가:
       Name : ${COOKIE_NAME}
       Value: ${sessionToken}
       Path : /
  3) 새로고침 → /dashboard 진입되면 성공.

  · 여러 멤버 동시 검증: 시크릿창/다른 브라우저마다 다른 회원 토큰을 심으면 됨.
  · https·Vercel에는 쓰지 말 것(쿠키명 __Secure-${COOKIE_NAME} + prod DB 오염).
`);
}

function shortHash(s: string): string {
  return createHash('sha256').update(s).digest('hex').slice(0, 8);
}

/**
 * 루트 .env(.env.local 우선)를 직접 로드한다. CWD 무관하게 스크립트 위치 기준으로 찾고,
 * `${VAR}` 치환을 지원하며(.env.example의 DATABASE_URL 형식), 이미 설정된 env는 덮어쓰지 않는다.
 */
function loadEnv(): void {
  const here = dirname(fileURLToPath(import.meta.url)); // apps/server/prisma
  const root = resolve(here, '../../..'); // → 레포 루트
  for (const name of ['.env', '.env.local']) {
    const file = resolve(root, name);
    if (!existsSync(file)) continue;
    for (const raw of readFileSync(file, 'utf8').split('\n')) {
      const line = raw.trim();
      if (!line || line.startsWith('#')) continue;
      const eq = line.indexOf('=');
      if (eq === -1) continue;
      const key = line.slice(0, eq).trim();
      const val = line
        .slice(eq + 1)
        .trim()
        .replace(/^["']|["']$/g, '')
        .replace(/\$\{([^}]+)\}/g, (_, k) => process.env[k] ?? '');
      if (process.env[key] === undefined) process.env[key] = val;
    }
  }
}

/** prod 가드: 로그인 바이패스 스크립트이므로 운영/원격 DB 실행을 차단한다. */
function assertLocalDb(): void {
  const url = process.env.DATABASE_URL ?? '';
  const isProd = process.env.NODE_ENV === 'production';
  const isAccelerate = url.startsWith('prisma://') || url.startsWith('prisma+');
  const isLocalHost = /@(localhost|127\.0\.0\.1)[:/]/.test(url);

  if (isProd || isAccelerate || !isLocalHost) {
    console.error(
      `❌ dev-login은 로컬 전용입니다. 운영/원격 DB로 보입니다.\n` +
        `   DATABASE_URL=${maskUrl(url)}  NODE_ENV=${process.env.NODE_ENV ?? '(unset)'}\n` +
        `   localhost DB에서만 실행하세요. (의도적 우회는 DEV_LOGIN_ALLOW=1)`
    );
    if (process.env.DEV_LOGIN_ALLOW !== '1') process.exit(1);
  }
}

/** DATABASE_URL의 비밀번호를 가린다. */
function maskUrl(url: string): string {
  return url.replace(/(:\/\/[^:/@]+:)[^@]*(@)/, '$1***$2') || '(unset)';
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
