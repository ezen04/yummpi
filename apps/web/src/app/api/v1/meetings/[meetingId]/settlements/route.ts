import { type NextRequest } from 'next/server';
import { Prisma } from '@prisma/client';
import { z } from 'zod';
import {
  SettlementCreateRequestSchema,
  SettlementCreateResponseSchema,
} from '@yummpi/schemas';
import { handleRoute, apiSuccess, ApiError } from '@/lib/api-response';
import { assertHost } from '@/lib/current-member';
import { prisma } from '@/lib/prisma';
import { transitionMeetingStatus } from '@/lib/meeting-status';
import { runSettlementEngine } from '@/lib/settlement-engine';
import type { SettlementMemberOutput } from '@/lib/settlement-engine';
import {
  assertEngineTotal,
  buildCreationResponse,
  buildEqualEngineInput,
  buildSettlementMemberRows,
  resolveTotalAmount,
} from './_utils';

// POST /api/v1/meetings/:meetingId/settlements (정산 생성, api-spec v2.2 §10)
//
// 호스트 전용. 모임당 정산 1건(settlements.meeting_id UNIQUE) → 이미 있으면 409.
// total_amount 산출·검증, EQUAL 즉시 분배, IN_PROGRESS→SETTLING 전이는 모두 _utils
// 순수함수 + 헬퍼에 위임하고 여기서는 prisma·authz·트랜잭션 조립만 담당.
//
// 분기:
// - EQUAL  : 생성 시점에 즉시 분배 → Settlement(DRAFT) + SettlementMember N행을 한 트랜잭션에.
// - ITEM_BASED: 멤버별 항목 선택(PUT /assignments)이 끝나야 계산 가능 → 여기선 Settlement만
//   생성(멤버 행 없음). 계산은 후속 단계에서 채운다. (status는 두 분기 모두 DRAFT)
//
// 순서: 모임 존재(404) → assertHost(403) 전에 확인. 뒤집으면 모임 미존재 시 호스트 가드가
//       FORBIDDEN(403)으로 빠져 MEETING_NOT_FOUND(404)에 도달 못 한다(GET 라우트와 동일).

const paramsSchema = z.object({ meetingId: z.string().uuid() });

export const POST = handleRoute(
  async (
    req: NextRequest,
    { params }: { params: Promise<{ meetingId: string }> }
  ) => {
    // handleRoute는 ApiError만 envelope으로 변환 → parse() 직접 호출은 500이 된다.
    // params·body 모두 safeParse + 명시 VALIDATION_ERROR(400)로 정합 유지.
    const paramsParsed = paramsSchema.safeParse(await params);
    if (!paramsParsed.success) {
      throw new ApiError(
        'VALIDATION_ERROR',
        '잘못된 모임 식별자 형식입니다.',
        paramsParsed.error.flatten()
      );
    }
    const { meetingId } = paramsParsed.data;

    const rawBody = await req.json().catch(() => null);
    const bodyParsed = SettlementCreateRequestSchema.safeParse(rawBody);
    if (!bodyParsed.success) {
      throw new ApiError(
        'VALIDATION_ERROR',
        '정산 생성 요청 형식이 올바르지 않습니다.',
        bodyParsed.error.flatten()
      );
    }
    const { splitMethod, totalAmount: requestedTotalAmount } = bodyParsed.data;

    const meeting = await prisma.meeting.findUnique({
      where: { id: meetingId },
      select: { id: true, status: true },
    });
    if (!meeting) {
      throw new ApiError('MEETING_NOT_FOUND', '모임을 찾을 수 없습니다.');
    }

    await assertHost(meetingId);

    // 모임당 정산 1건(UNIQUE) — 선조회로 흔한 경우 409를 명시 반환(트랜잭션·엔진 진입 회피).
    // 선조회와 트랜잭션 사이의 레이스(호스트 더블클릭 등)는 아래 $transaction의 P2002 catch가
    // 동일한 409로 최종 방어 → "이미 존재"가 경로에 따라 409/500으로 갈리지 않게 한다.
    const existing = await prisma.settlement.findUnique({
      where: { meetingId },
      select: { id: true },
    });
    if (existing) {
      throw new ApiError(
        'SETTLEMENT_ALREADY_EXISTS',
        '이미 정산이 생성된 모임입니다.'
      );
    }

    // total_amount 산출: receipt≥1이면 SUM(서버 단일 출처), receipt=0이면 EQUAL+요청값만 허용.
    // Receipt.totalAmount는 nullable(OCR 실패 fallback) → resolveTotalAmount가 0/null 거부.
    const receipts = await prisma.receipt.findMany({
      where: { meetingId },
      select: { totalAmount: true },
    });
    const total = resolveTotalAmount({
      receipts,
      splitMethod,
      requestedTotalAmount,
    });

    // EQUAL은 생성 즉시 분배 → 트랜잭션 밖에서 엔진(순수) 실행 후 결과만 영속화.
    let engineMembers: SettlementMemberOutput[] | null = null;
    if (splitMethod === 'EQUAL') {
      const attending = await prisma.meetingMember.findMany({
        where: { meetingId, attendanceStatus: 'ATTENDING', leftAt: null },
        select: { id: true, role: true },
      });
      const input = buildEqualEngineInput(total, attending);
      const output = runSettlementEngine(input);
      assertEngineTotal(total, output.members); // Σ finalAmount == total 불변식 가드
      engineMembers = output.members;
    }

    // Settlement 생성 + (EQUAL이면) 멤버 행 + 모임 상태 전이를 원자적으로.
    // 상태: IN_PROGRESS → SETTLING 전이. 이미 SETTLING이면 no-op, 그 외 상태는
    // transitionMeetingStatus의 상태머신 가드가 409로 차단(부적절한 시점의 정산 생성 방지).
    const runCreateTx = () =>
      prisma.$transaction(async (tx) => {
        const settlement = await tx.settlement.create({
          data: { meetingId, splitMethod, totalAmount: total, status: 'DRAFT' },
          select: {
            id: true,
            splitMethod: true,
            status: true,
            totalAmount: true,
          },
        });

        if (engineMembers) {
          await tx.settlementMember.createMany({
            data: buildSettlementMemberRows(settlement.id, engineMembers),
          });
        }

        let meetingStatus = meeting.status;
        if (meeting.status !== 'SETTLING') {
          const transitioned = await transitionMeetingStatus(
            meetingId,
            'SETTLING',
            { tx, reason: 'settlement created' }
          );
          meetingStatus = transitioned.status;
        }

        return { settlement, meetingStatus };
      });

    let created: Awaited<ReturnType<typeof runCreateTx>>;
    try {
      created = await runCreateTx();
    } catch (e) {
      // 선조회 통과 후 트랜잭션에서 UNIQUE(meeting_id) 위반 시 선조회 경로와 동일하게 409.
      // (트랜잭션 내부의 ApiError(상태머신 409 등)는 삼키지 않고 P2002만 재매핑)
      if (
        e instanceof Prisma.PrismaClientKnownRequestError &&
        e.code === 'P2002'
      ) {
        throw new ApiError(
          'SETTLEMENT_ALREADY_EXISTS',
          '이미 정산이 생성된 모임입니다.'
        );
      }
      throw e;
    }

    const data = buildCreationResponse(created.settlement, created.meetingStatus);
    // 응답 직전 inner schema parse — Prisma 결과 ↔ 계약 drift 차단.
    const parsed = SettlementCreateResponseSchema.parse(data);
    return apiSuccess(parsed, '정산이 생성되었습니다.', 201);
  }
);
