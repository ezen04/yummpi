import { type NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { z } from 'zod';
import {
  ReceiptPatchRequestSchema,
  ReceiptPatchResponseSchema,
} from '@yummpi/schemas';
import { handleRoute, apiSuccess, ApiError } from '@/lib/api-response';
import { assertHost } from '@/lib/current-member';
import { prisma } from '@/lib/prisma';
import { deleteS3Object } from '@/lib/s3';
import {
  assertReceiptEditable,
  assertReceiptDeletable,
} from '../_receipt-guards';

const paramsSchema = z.object({
  meetingId: z.string().uuid(),
  receiptId: z.string().uuid(),
});

// `PATCH /api/v1/meetings/:meetingId/receipts/:receiptId` — OCR 결과 검수·수정 (호스트, api-spec §9)
// items 전체 교체: 기존 items deleteMany → 새 items createMany.
// assertReceiptEditable을 트랜잭션 안으로 넣어 settlement 동시 생성 TOCTOU를 차단.
export const PATCH = handleRoute(
  async (
    req: NextRequest,
    { params }: { params: Promise<{ meetingId: string; receiptId: string }> }
  ) => {
    const paramsParsed = paramsSchema.safeParse(await params);
    if (!paramsParsed.success) {
      throw new ApiError(
        'VALIDATION_ERROR',
        '잘못된 식별자 형식입니다.',
        paramsParsed.error.flatten()
      );
    }
    const { meetingId, receiptId } = paramsParsed.data;

    const meeting = await prisma.meeting.findUnique({
      where: { id: meetingId, cancelledAt: null },
      select: { id: true },
    });
    if (!meeting) {
      throw new ApiError('MEETING_NOT_FOUND', '모임을 찾을 수 없습니다.');
    }

    await assertHost(meetingId);

    // receipt 존재 확인을 body parse·lock check보다 먼저 — 없는 id에 대한 오류가
    // RECEIPT_LOCKED/VALIDATION_ERROR보다 앞서야 한다(manual 라우트 주석 동일 근거).
    const receipt = await prisma.receipt.findUnique({
      where: { id: receiptId },
      select: { id: true, meetingId: true, objectKey: true },
    });
    if (!receipt || receipt.meetingId !== meetingId) {
      throw new ApiError('RECEIPT_NOT_FOUND', '영수증을 찾을 수 없습니다.');
    }

    const rawBody = await req.json().catch(() => null);
    const parsed = ReceiptPatchRequestSchema.safeParse(rawBody);
    if (!parsed.success) {
      throw new ApiError(
        'VALIDATION_ERROR',
        '요청 형식이 올바르지 않습니다.',
        parsed.error.flatten()
      );
    }
    const { items } = parsed.data;

    const totalAmount = items.reduce((sum, item) => sum + item.totalPrice, 0);

    // assertReceiptEditable을 트랜잭션 안에서 호출 — settlement 동시 생성 TOCTOU 방어.
    // deleteMany + nested create는 같은 tx에서 원자적 실행 보장.
    const updated = await prisma.$transaction(async (tx) => {
      await assertReceiptEditable(meetingId, tx);
      await tx.receiptItem.deleteMany({ where: { receiptId } });
      return tx.receipt
        .update({
          where: { id: receiptId },
          data: {
            totalAmount,
            ocrStatus: 'SUCCEEDED',
            items: {
              create: items.map((item, i) => ({
                name: item.name,
                quantity: item.quantity,
                unitPrice: item.unitPrice,
                totalPrice: item.totalPrice,
                sortOrder: i,
              })),
            },
          },
          include: { items: { orderBy: { sortOrder: 'asc' } } },
        })
        .catch((err: unknown) => {
          if (
            err instanceof Prisma.PrismaClientKnownRequestError &&
            err.code === 'P2025'
          ) {
            throw new ApiError(
              'RECEIPT_NOT_FOUND',
              '영수증을 찾을 수 없습니다.'
            );
          }
          throw err;
        });
    });

    const response = ReceiptPatchResponseSchema.parse({
      receiptId: updated.id,
      objectKey: updated.objectKey,
      ocrStatus: updated.ocrStatus,
      totalAmount: updated.totalAmount,
      items: updated.items.map((item) => ({
        receiptItemId: item.id,
        name: item.name,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalPrice: item.totalPrice,
      })),
    });
    return apiSuccess(response);
  }
);

// `DELETE /api/v1/meetings/:meetingId/receipts/:receiptId` — 영수증 삭제 (호스트, api-spec §9)
// settlement CONFIRMED|COMPLETED → 403. settlement DRAFT 존재 → 409 RECEIPT_LOCKED.
// DB 먼저 삭제 후 S3 정리 — S3 삭제 후 DB 실패 시 objectKey 고아 레코드 방지.
export const DELETE = handleRoute(
  async (
    _req: NextRequest,
    { params }: { params: Promise<{ meetingId: string; receiptId: string }> }
  ) => {
    const paramsParsed = paramsSchema.safeParse(await params);
    if (!paramsParsed.success) {
      throw new ApiError(
        'VALIDATION_ERROR',
        '잘못된 식별자 형식입니다.',
        paramsParsed.error.flatten()
      );
    }
    const { meetingId, receiptId } = paramsParsed.data;

    const meeting = await prisma.meeting.findUnique({
      where: { id: meetingId, cancelledAt: null },
      select: { id: true },
    });
    if (!meeting) {
      throw new ApiError('MEETING_NOT_FOUND', '모임을 찾을 수 없습니다.');
    }

    await assertHost(meetingId);

    // receipt 존재 확인을 lock check보다 먼저 — 없는 id에 RECEIPT_LOCKED/FORBIDDEN 반환 방지.
    const receipt = await prisma.receipt.findUnique({
      where: { id: receiptId },
      select: { id: true, meetingId: true, objectKey: true },
    });
    if (!receipt || receipt.meetingId !== meetingId) {
      throw new ApiError('RECEIPT_NOT_FOUND', '영수증을 찾을 수 없습니다.');
    }

    // assertReceiptDeletable + receipt.delete를 같은 tx로 묶어 settlement 동시 생성 TOCTOU 방어.
    await prisma.$transaction(async (tx) => {
      await assertReceiptDeletable(meetingId, tx);
      await tx.receipt
        .delete({ where: { id: receiptId } })
        .catch((err: unknown) => {
          if (
            err instanceof Prisma.PrismaClientKnownRequestError &&
            err.code === 'P2025'
          ) {
            throw new ApiError(
              'RECEIPT_NOT_FOUND',
              '영수증을 찾을 수 없습니다.'
            );
          }
          throw err;
        });
    });

    // DB 삭제 성공 후 S3 정리. S3 실패는 로그만 — 사용자 관점 완료.
    if (receipt.objectKey) {
      try {
        await deleteS3Object(receipt.objectKey);
      } catch (err) {
        console.error('[DELETE receipt] S3 삭제 실패 — DB 삭제는 완료', err);
      }
    }

    return new NextResponse(null, { status: 204 });
  }
);
