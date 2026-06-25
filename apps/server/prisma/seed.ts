// 송금(payment) 페이지 검증용 dev seed.
// 실행: pnpm --filter @yummpi/server exec npx prisma db seed
//
// ⚠️ dev 전용. ⑤ 송금 도메인 화면 분기 매트릭스를 데이터로 커버하기 위해 모임 6개를 깐다.
//
//   [A] SEEDPAY1  SETTLING  · 정산 CONFIRMED · 혼합 멤버 6명(회원 PENDING/TR/PAID + 게스트 PENDING/EXEMPT)
//                 → 호스트 시점 독촉/완료확인/게스트 가드 + (민지 PENDING에서 독촉 1클릭 → 쿨다운 연속 검증)
//   [B] SEEDPAY2  SETTLING  · 정산 CONFIRMED · SettlementMember N · Payment 0
//                 → PaymentNotInitializedState("송금 시작" 버튼이 SettlementMember로 Payment 생성)
//   [C] SEEDPAY3  SETTLING  · 정산 없음
//                 → GET /payments = SETTLEMENT_NOT_FOUND (미확정 화면)
//   [D] SEEDPAY4  SETTLING  · 정산 DRAFT · SettlementMember N · Payment 0
//                 → 송금 시작(initialize) = INVALID_SETTLEMENT_STATUS (미확정, C와 코드 분리)
//   [E] SEEDPAY5  COMPLETED · 정산 COMPLETED · 전원 PAID/EXEMPT
//                 → /payments/complete 화면, /payments 진입 시 redirect
//   [F] SEEDPAY6  CANCELLED(cancelled_at)
//                 → meeting layout에서 notFound (payments 내부 상태 아님)
//
//   호스트 = 가장 최근에 가입한 User(= 카카오로 먼저 로그인한 계정). 6개 모임 전부 동일 호스트라
//   그 계정 하나로 호스트 시점 전부 검증 가능. 회원 본인 시점(#5·6 redirect/stayHere)은
//   카카오 부계정으로 실 로그인해야 닿는다(더미 User는 로그인 불가).
//
//   멱등: 더미 회원 User는 고정 uuid + upsert, 모임은 inviteCode 기준 deleteMany 후 재생성.

import { PrismaClient } from '@prisma/client';
import type {
  MeetingStatus,
  PaymentStatus,
  SettlementStatus,
} from '@prisma/client';

const prisma = new PrismaClient();

// ── 더미 회원 User (회원 멤버는 userId 필요: isGuest = userId === null) ──
// 카카오 로그인 불가. 호스트 시점 검증 전용. 고정 uuid로 멱등 upsert.
const DUMMY_USERS = [
  { id: '11111111-1111-4111-8111-111111111111', nickname: '민지' },
  { id: '22222222-2222-4222-8222-222222222222', nickname: '수아' },
  { id: '33333333-3333-4333-8333-333333333333', nickname: '도윤' },
] as const;

const U_MINJI = DUMMY_USERS[0].id;
const U_SUA = DUMMY_USERS[1].id;
const U_DOYUN = DUMMY_USERS[2].id;

type MemberSpec = {
  nickname: string;
  userId: string | null; // 호스트 id / 더미 회원 id / null(게스트)
  role: 'HOST' | 'MEMBER';
  finalAmount: number;
  paymentStatus?: PaymentStatus; // createPayments일 때만 Payment 생성
};

type MeetingSpec = {
  code: string;
  title: string;
  status: MeetingStatus;
  cancelled?: boolean;
  settlement: SettlementStatus | 'NONE';
  createPayments: boolean; // false면 SettlementMember만, Payment 0
  members: MemberSpec[];
  note: string; // 콘솔 안내
};

function buildSpecs(hostId: string, hostNickname: string): MeetingSpec[] {
  const host: MemberSpec = {
    nickname: hostNickname,
    userId: hostId,
    role: 'HOST',
    finalAmount: 12000,
    paymentStatus: 'PAID',
  };

  return [
    {
      code: 'SEEDPAY1',
      title: '정산/송금 테스트 — 독촉·혼합 멤버',
      status: 'SETTLING',
      settlement: 'CONFIRMED',
      createPayments: true,
      note: '호스트 시점: 회원 독촉/완료확인/게스트 가드. 민지 독촉 1클릭→쿨다운 검증',
      members: [
        host,
        {
          nickname: '민지',
          userId: U_MINJI,
          role: 'MEMBER',
          finalAmount: 18000,
          paymentStatus: 'PENDING',
        },
        {
          nickname: '수아',
          userId: U_SUA,
          role: 'MEMBER',
          finalAmount: 15000,
          paymentStatus: 'TRANSFER_REPORTED',
        },
        {
          nickname: '도윤',
          userId: U_DOYUN,
          role: 'MEMBER',
          finalAmount: 11000,
          paymentStatus: 'PAID',
        },
        {
          nickname: '하린(게스트)',
          userId: null,
          role: 'MEMBER',
          finalAmount: 9000,
          paymentStatus: 'PENDING',
        },
        {
          nickname: '유준(게스트)',
          userId: null,
          role: 'MEMBER',
          finalAmount: 8000,
          paymentStatus: 'EXEMPT',
        },
      ],
    },
    {
      code: 'SEEDPAY2',
      title: '정산/송금 테스트 — 송금 미초기화',
      status: 'SETTLING',
      settlement: 'CONFIRMED',
      createPayments: false,
      note: 'PaymentNotInitializedState — 호스트 "송금 시작" 버튼이 SettlementMember로 Payment 생성',
      members: [
        host,
        {
          nickname: '민지',
          userId: U_MINJI,
          role: 'MEMBER',
          finalAmount: 18000,
        },
        {
          nickname: '하린(게스트)',
          userId: null,
          role: 'MEMBER',
          finalAmount: 9000,
        },
      ],
    },
    {
      code: 'SEEDPAY3',
      title: '정산/송금 테스트 — 정산 없음',
      status: 'SETTLING',
      settlement: 'NONE',
      createPayments: false,
      note: 'GET /payments = SETTLEMENT_NOT_FOUND (정산 미확정 화면)',
      members: [
        host,
        {
          nickname: '민지',
          userId: U_MINJI,
          role: 'MEMBER',
          finalAmount: 18000,
        },
      ],
    },
    {
      code: 'SEEDPAY4',
      title: '정산/송금 테스트 — 정산 DRAFT',
      status: 'SETTLING',
      settlement: 'DRAFT',
      createPayments: false,
      note: '송금 시작(initialize) = INVALID_SETTLEMENT_STATUS (C와 코드 분리)',
      members: [
        host,
        {
          nickname: '민지',
          userId: U_MINJI,
          role: 'MEMBER',
          finalAmount: 18000,
        },
        {
          nickname: '하린(게스트)',
          userId: null,
          role: 'MEMBER',
          finalAmount: 9000,
        },
      ],
    },
    {
      code: 'SEEDPAY5',
      title: '정산/송금 테스트 — 모임 종료',
      status: 'COMPLETED',
      settlement: 'COMPLETED',
      createPayments: true,
      note: '/payments/complete 화면. /payments 진입 시 redirect',
      members: [
        host,
        {
          nickname: '민지',
          userId: U_MINJI,
          role: 'MEMBER',
          finalAmount: 18000,
          paymentStatus: 'PAID',
        },
        {
          nickname: '하린(게스트)',
          userId: null,
          role: 'MEMBER',
          finalAmount: 9000,
          paymentStatus: 'EXEMPT',
        },
      ],
    },
    {
      code: 'SEEDPAY6',
      title: '정산/송금 테스트 — 취소된 모임',
      status: 'CANCELLED',
      cancelled: true,
      settlement: 'NONE',
      createPayments: false,
      note: 'meeting layout에서 notFound (cancelled_at)',
      members: [
        host,
        {
          nickname: '민지',
          userId: U_MINJI,
          role: 'MEMBER',
          finalAmount: 18000,
        },
      ],
    },
  ];
}

async function main() {
  // 1) 호스트로 쓸 User (가장 최근 가입한 "실제" 카카오 계정). 없으면 안내 후 종료.
  //    더미 회원 User(아래 DUMMY_USERS)는 createdAt이 최신이라 제외하지 않으면
  //    호스트로 잡혀 한 모임에 같은 userId가 중복된다((meeting_id,user_id) 유니크 위반).
  const host = await prisma.user.findFirst({
    where: { id: { notIn: DUMMY_USERS.map((u) => u.id) } },
    orderBy: { createdAt: 'desc' },
  });
  if (!host) {
    throw new Error(
      'User가 없습니다. 먼저 카카오로 로그인해 계정을 만든 뒤 다시 실행하세요(그 계정이 호스트가 됩니다).'
    );
  }
  const hostNickname = host.nickname ?? host.name ?? '호스트';

  // 2) 더미 회원 User 멱등 upsert (모임 cascade 대상 아님 → 고정 uuid로 재사용).
  for (const u of DUMMY_USERS) {
    await prisma.user.upsert({
      where: { id: u.id },
      update: { nickname: u.nickname },
      create: { id: u.id, name: u.nickname, nickname: u.nickname },
    });
  }

  const specs = buildSpecs(host.id, hostNickname);

  // 3) 멱등: 기존 seed 모임 제거.
  //    settlement_members.member_id FK가 RESTRICT라 Meeting cascade만으로는
  //    MeetingMember 삭제가 막힌다(SettlementMember가 참조 중) → FK-안전 순서로 제거.
  const seedCodes = specs.map((s) => s.code);
  const seedMeetings = await prisma.meeting.findMany({
    where: { inviteCode: { in: seedCodes } },
    select: { id: true },
  });
  const seedMeetingIds = seedMeetings.map((m) => m.id);
  if (seedMeetingIds.length > 0) {
    // SettlementMember 먼저 삭제(Payment는 cascade로 함께 제거).
    await prisma.settlementMember.deleteMany({
      where: { settlement: { meetingId: { in: seedMeetingIds } } },
    });
    // 이제 Meeting 삭제 시 MeetingMember·Settlement가 cascade로 정리된다.
    await prisma.meeting.deleteMany({ where: { id: { in: seedMeetingIds } } });
  }

  const now = new Date();
  const scheduledAt = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000); // +3일
  const expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // +30일

  const results: { code: string; meetingId: string; note: string }[] = [];

  for (const spec of specs) {
    const meetingId = await prisma.$transaction(async (tx) => {
      const meeting = await tx.meeting.create({
        data: {
          title: spec.title,
          description: `seed: ${spec.title}`,
          status: spec.status,
          hostUserId: host.id,
          inviteCode: spec.code,
          scheduledAt,
          expiresAt,
          cancelledAt: spec.cancelled ? now : null,
          maxMembers: 8,
          budgetPerPerson: 20000,
          anonymousVoting: true,
        },
      });

      let settlementId: string | null = null;
      if (spec.settlement !== 'NONE') {
        const total = spec.members.reduce((s, m) => s + m.finalAmount, 0);
        const isConfirmedish =
          spec.settlement === 'CONFIRMED' || spec.settlement === 'COMPLETED';
        const settlement = await tx.settlement.create({
          data: {
            meetingId: meeting.id,
            splitMethod: 'ITEM_BASED',
            status: spec.settlement,
            totalAmount: total,
            allocatedAmount: total,
            confirmedAt: isConfirmedish ? now : null,
            completedAt: spec.settlement === 'COMPLETED' ? now : null,
          },
        });
        settlementId = settlement.id;
      }

      for (const m of spec.members) {
        const member = await tx.meetingMember.create({
          data: {
            meetingId: meeting.id,
            userId: m.userId,
            guestTokenHash:
              m.userId === null
                ? `seed-guest-${spec.code}-${m.nickname}`
                : null,
            nickname: m.nickname,
            role: m.role,
            attendanceStatus: 'ATTENDING',
          },
        });

        if (settlementId) {
          const settlementMember = await tx.settlementMember.create({
            data: {
              settlementId,
              memberId: member.id,
              itemAmount: m.finalAmount,
              finalAmount: m.finalAmount,
            },
          });

          if (spec.createPayments && m.paymentStatus) {
            await tx.payment.create({
              data: {
                settlementMemberId: settlementMember.id,
                amount: m.finalAmount,
                status: m.paymentStatus,
                paidAt: m.paymentStatus === 'PAID' ? now : null,
              },
            });
          }
        }
      }

      return meeting.id;
    });

    results.push({ code: spec.code, meetingId, note: spec.note });
  }

  console.log('\n✅ 송금 시나리오 seed 완료 (모임 6개)');
  console.log('  host :', hostNickname, `(userId=${host.id})`);
  console.log(
    '  ※ 회원 본인 시점(redirect/stayHere)은 카카오 부계정 실 로그인 필요(더미 User는 로그인 불가)\n'
  );
  for (const r of results) {
    console.log(`  [${r.code}] ${r.note}`);
    console.log(`     meetingId : ${r.meetingId}`);
    console.log(
      `     payments  : http://localhost:3000/meetings/${r.meetingId}/payments\n`
    );
  }
}

main()
  .catch((e) => {
    console.error('❌ seed 실패:', e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
