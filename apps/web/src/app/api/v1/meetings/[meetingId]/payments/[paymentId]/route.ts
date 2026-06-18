import { type NextRequest } from 'next/server';
import { z } from 'zod';
import { UpdatePaymentRequestSchema } from '@yummpi/schemas';
import { handleRoute, apiSuccess, ApiError } from '@/lib/api-response';
import { requireMember } from '@/lib/current-member';
import { prisma } from '@/lib/prisma';
import { buildPaymentListItem, buildSummary } from '../_utils';
import type { PaymentStatus } from '@prisma/client';

const paramsSchema = z.object({
  meetingId: z.string().uuid(),
  paymentId: z.string().uuid(),
});

export const PATCH = handleRoute(
  async (
    req: NextRequest,
    { params }: { params: Promise<{ meetingId: string; paymentId: string }> }
  ) => {
    const { meetingId, paymentId } = paramsSchema.parse(await params);

    const body = UpdatePaymentRequestSchema.parse(await req.json());
    const { action } = body;

    const currentMember = await requireMember(meetingId);

    // Payment를 SettlementMember → Settlement → MeetingMember 경로로 조회
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: {
        settlementMember: {
          include: {
            settlement: true,
            member: true,
          },
        },
      },
    });

    if (!payment) {
      throw new ApiError('PAYMENT_NOT_FOUND', '결제 정보를 찾을 수 없습니다.');
    }

    // 해당 meeting에 속하는지 확인
    if (payment.settlementMember.settlement.meetingId !== meetingId) {
      throw new ApiError('PAYMENT_NOT_FOUND', '결제 정보를 찾을 수 없습니다.');
    }

    const isHost = currentMember.role === 'HOST';
    const isOwner = currentMember.id === payment.settlementMember.memberId;

    // action별 권한 검증
    if (action === 'REPORT_TRANSFER') {
      if (!isOwner) {
        throw new ApiError('FORBIDDEN', '본인 송금만 신고할 수 있습니다.');
      }
      if (payment.status !== 'PENDING') {
        throw new ApiError(
          'INVALID_PAYMENT_STATUS',
          'PENDING 상태에서만 송금 신고가 가능합니다.'
        );
      }
    } else {
      // MARK_PAID / MARK_PENDING / MARK_EXEMPT
      if (!isHost) {
        throw new ApiError('FORBIDDEN', '주최자만 수행할 수 있습니다.');
      }
    }

    // 상태 전이 결정
    const statusMap: Record<typeof action, PaymentStatus> = {
      REPORT_TRANSFER: 'TRANSFER_REPORTED',
      MARK_PAID: 'PAID',
      MARK_PENDING: 'PENDING',
      MARK_EXEMPT: 'EXEMPT',
    };
    const nextStatus: PaymentStatus = statusMap[action];

    // 이미 같은 상태이면 DB 업데이트 없이 현재 값을 그대로 반환
    if (payment.status === nextStatus) {
      const allPayments = await prisma.payment.findMany({
        where: { settlementMember: { settlement: { meetingId } } },
      });
      const item = buildPaymentListItem(
        { ...payment.settlementMember, payment },
        currentMember
      );
      return apiSuccess({ payment: item, summary: buildSummary(allPayments) });
    }

    // PAID 전환 시에만 paidAt 기록, 그 외 상태 전환 시 초기화
    const paidAt = nextStatus === 'PAID' ? new Date() : null;

    const updated = await prisma.payment.update({
      where: { id: paymentId },
      data: { status: nextStatus, paidAt },
    });

    // summary를 위해 해당 모임 전체 Payment 조회
    const allPayments = await prisma.payment.findMany({
      where: {
        settlementMember: { settlement: { meetingId } },
      },
    });

    const item = buildPaymentListItem(
      { ...payment.settlementMember, payment: updated },
      currentMember
    );

    return apiSuccess({
      payment: item,
      summary: buildSummary(allPayments),
    });
  }
);
