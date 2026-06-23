// 송금(payment) 페이지 테스트용 dev seed.
// 실행: pnpm --filter @yummpi/server exec npx prisma db seed
//
// ⚠️ dev 전용. SETTLING 모임 1개 + 멤버 4명 + CONFIRMED 정산 + 결제 4건을 만든다.
//    결제 status 4종(PENDING / TRANSFER_REPORTED / PAID / EXEMPT)을 모두 포함한다(⑤ 요청).
//    호스트 = 가장 최근에 가입한 User(= 카카오로 먼저 로그인한 계정). 그 계정으로 로그인해야
//    송금 페이지를 호스트 권한으로 볼 수 있다.
//    고정 inviteCode로 멱등(재실행 시 기존 seed 모임을 cascade 삭제 후 재생성).

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const SEED_INVITE_CODE = 'SEEDPAY1';

type MemberSpec = {
  nickname: string;
  userId: string | null;
  role: 'HOST' | 'MEMBER';
  finalAmount: number;
  paymentStatus: 'PENDING' | 'TRANSFER_REPORTED' | 'PAID' | 'EXEMPT';
};

async function main() {
  // 1) 호스트로 쓸 User (가장 최근 가입자). 없으면 안내 후 종료.
  const host = await prisma.user.findFirst({ orderBy: { createdAt: 'desc' } });
  if (!host) {
    throw new Error(
      'User가 없습니다. 먼저 카카오로 로그인해 계정을 만든 뒤 다시 실행하세요(그 계정이 호스트가 됩니다).'
    );
  }

  // 2) 멱등: 기존 seed 모임 제거(멤버·정산·정산멤버·결제까지 cascade).
  await prisma.meeting.deleteMany({ where: { inviteCode: SEED_INVITE_CODE } });

  // 3) 멤버/결제 구성 — 결제 status 4종 전부 포함.
  const hostNickname = host.nickname ?? host.name ?? '호스트';
  const memberSpecs: MemberSpec[] = [
    {
      nickname: hostNickname,
      userId: host.id,
      role: 'HOST',
      finalAmount: 12000,
      paymentStatus: 'PAID',
    },
    {
      nickname: '민지',
      userId: null,
      role: 'MEMBER',
      finalAmount: 18000,
      paymentStatus: 'PENDING',
    },
    {
      nickname: '지훈',
      userId: null,
      role: 'MEMBER',
      finalAmount: 15000,
      paymentStatus: 'TRANSFER_REPORTED',
    },
    {
      nickname: '수아',
      userId: null,
      role: 'MEMBER',
      finalAmount: 9000,
      paymentStatus: 'EXEMPT',
    },
  ];
  const totalAmount = memberSpecs.reduce((sum, m) => sum + m.finalAmount, 0);

  const now = new Date();
  const scheduledAt = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000); // +3일
  const expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // +30일

  const meetingId = await prisma.$transaction(async (tx) => {
    // 모임 (정산/송금 단계)
    const meeting = await tx.meeting.create({
      data: {
        title: '정산/송금 테스트 모임',
        description: 'seed로 생성된 송금 페이지 테스트용 모임입니다.',
        status: 'SETTLING',
        hostUserId: host.id,
        inviteCode: SEED_INVITE_CODE,
        scheduledAt,
        expiresAt,
        maxMembers: 6,
        budgetPerPerson: 20000,
        anonymousVoting: true,
      },
    });

    // 정산 (확정)
    const settlement = await tx.settlement.create({
      data: {
        meetingId: meeting.id,
        splitMethod: 'ITEM_BASED',
        status: 'CONFIRMED',
        totalAmount,
        allocatedAmount: totalAmount,
        confirmedAt: now,
      },
    });

    // 멤버 + 정산멤버 + 결제
    for (const spec of memberSpecs) {
      const member = await tx.meetingMember.create({
        data: {
          meetingId: meeting.id,
          userId: spec.userId,
          nickname: spec.nickname,
          role: spec.role,
          attendanceStatus: 'ATTENDING',
        },
      });

      const settlementMember = await tx.settlementMember.create({
        data: {
          settlementId: settlement.id,
          memberId: member.id,
          itemAmount: spec.finalAmount,
          finalAmount: spec.finalAmount,
        },
      });

      await tx.payment.create({
        data: {
          settlementMemberId: settlementMember.id,
          amount: spec.finalAmount,
          status: spec.paymentStatus,
          paidAt: spec.paymentStatus === 'PAID' ? now : null,
        },
      });
    }

    return meeting.id;
  });

  console.log('\n✅ 송금 테스트 seed 완료');
  console.log('  host       :', hostNickname, `(userId=${host.id})`);
  console.log('  meetingId  :', meetingId);
  console.log(
    '  결제 페이지 :',
    `http://localhost:3000/meetings/${meetingId}/payments`
  );
  console.log(
    '  결제 status: 호스트=PAID, 민지=PENDING, 지훈=TRANSFER_REPORTED, 수아=EXEMPT\n'
  );
}

main()
  .catch((e) => {
    console.error('❌ seed 실패:', e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
