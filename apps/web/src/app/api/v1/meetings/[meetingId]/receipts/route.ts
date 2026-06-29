import { type NextRequest } from 'next/server';
import { Prisma } from '@prisma/client';
import { z } from 'zod';
import {
  ReceiptUploadRequestSchema,
  ReceiptUploadResponseSchema,
  ReceiptListResponseSchema,
} from '@yummpi/schemas';
import { handleRoute, apiSuccess, ApiError } from '@/lib/api-response';
import { assertHost, requireMember } from '@/lib/current-member';
import { prisma } from '@/lib/prisma';
import { getPresignedPutUrl } from '@/lib/s3';
import { assertReceiptAddable } from './_receipt-guards';

const paramsSchema = z.object({ meetingId: z.string().uuid() });

// `GET /api/v1/meetings/:meetingId/receipts` — 영수증 목록 (멤버 전원, api-spec §9)
export const GET = handleRoute(
  async (
    _req: NextRequest,
    { params }: { params: Promise<{ meetingId: string }> }
  ) => {
    const paramsParsed = paramsSchema.safeParse(await params);
    if (!paramsParsed.success) {
      throw new ApiError(
        'VALIDATION_ERROR',
        '잘못된 모임 식별자 형식입니다.',
        paramsParsed.error.flatten()
      );
    }
    const { meetingId } = paramsParsed.data;

    const meeting = await prisma.meeting.findUnique({
      where: { id: meetingId, cancelledAt: null },
      select: { id: true },
    });
    if (!meeting) {
      throw new ApiError('MEETING_NOT_FOUND', '모임을 찾을 수 없습니다.');
    }

    await requireMember(meetingId);

    const receipts = await prisma.receipt.findMany({
      where: { meetingId },
      include: { _count: { select: { items: true } } },
      orderBy: { createdAt: 'asc' },
    });

    const response = ReceiptListResponseSchema.parse({
      receipts: receipts.map((r) => ({
        receiptId: r.id,
        objectKey: r.objectKey,
        ocrStatus: r.ocrStatus,
        totalAmount: r.totalAmount,
        itemCount: r._count.items,
        createdAt: r.createdAt.toISOString(),
      })),
    });
    return apiSuccess(response);
  }
);

// `POST /api/v1/meetings/:meetingId/receipts` — presigned PUT URL 발급 + Receipt stub(PENDING) 생성
// api-spec §9 ★ v2.2. FE가 파일마다 독립 호출 → S3 PUT → POST .../ocr 순으로 진행.
export const POST = handleRoute(
  async (
    req: NextRequest,
    { params }: { params: Promise<{ meetingId: string }> }
  ) => {
    const paramsParsed = paramsSchema.safeParse(await params);
    if (!paramsParsed.success) {
      throw new ApiError(
        'VALIDATION_ERROR',
        '잘못된 모임 식별자 형식입니다.',
        paramsParsed.error.flatten()
      );
    }
    const { meetingId } = paramsParsed.data;

    const meeting = await prisma.meeting.findUnique({
      where: { id: meetingId, cancelledAt: null },
      select: { id: true },
    });
    if (!meeting) {
      throw new ApiError('MEETING_NOT_FOUND', '모임을 찾을 수 없습니다.');
    }

    const currentMember = await assertHost(meetingId);

    const rawBody = await req.json().catch(() => null);
    const parsed = ReceiptUploadRequestSchema.safeParse(rawBody);
    if (!parsed.success) {
      throw new ApiError(
        'VALIDATION_ERROR',
        '요청 형식이 올바르지 않습니다.',
        parsed.error.flatten()
      );
    }
    const { receiptId, contentType, fileSize: _fileSize } = parsed.data;

    // contentType에서 확장자 파생 — fileName 사용자 입력 의존 배제
    const ext = contentType === 'image/png' ? 'png' : 'jpg';
    const objectKey = `meetings/${meetingId}/receipts/${receiptId}.${ext}`;

    // assertReceiptAddable + create를 동일 트랜잭션으로 묶어 병렬 업로드 TOCTOU 경합 차단
    const created = await prisma.$transaction(async (tx) => {
      await assertReceiptAddable(meetingId, tx);
      return tx.receipt
        .create({
          data: {
            id: receiptId,
            meeting: { connect: { id: meetingId } },
            uploadedBy: { connect: { id: currentMember.id } },
            objectKey,
            ocrStatus: 'PENDING',
          },
          select: { id: true, objectKey: true },
        })
        .catch((err: unknown) => {
          if (
            err instanceof Prisma.PrismaClientKnownRequestError &&
            err.code === 'P2002'
          ) {
            throw new ApiError(
              'RECEIPT_ALREADY_EXISTS',
              '이미 등록된 영수증 ID입니다.'
            );
          }
          throw err;
        });
    });

    const uploadUrl = await getPresignedPutUrl(objectKey, contentType);

    const response = ReceiptUploadResponseSchema.parse({
      receiptId: created.id,
      objectKey: created.objectKey,
      uploadUrl,
      expiresIn: 300,
    });
    return apiSuccess(response, undefined, 201);
  }
);
