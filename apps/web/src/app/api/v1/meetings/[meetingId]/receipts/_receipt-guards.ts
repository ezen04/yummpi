import { Prisma } from '@prisma/client';
import { ApiError } from '@/lib/api-response';
import { prisma } from '@/lib/prisma';

// DB를 직접 쿼리하는 가드 — `./_receipt-input.ts`(순수 빌더)와 분리해 두는
// 이유: 순수 함수 단위테스트(manual/_utils.test.ts 등)가 이 파일을 거치지
// 않게 해서 Prisma client 모듈 로드(=DATABASE_URL 필요)를 타지 않게 한다.

const RECEIPT_LIMIT = 4;

// PATCH 가드: settlement 상태별 분기 (api-spec §9 잠금 규칙 + DELETE와 동일 정책).
// CONFIRMED/COMPLETED → 403, DRAFT 존재 → 409 RECEIPT_LOCKED, 없음 → 통과.
// tx를 넘기면 PATCH 트랜잭션 안에서 실행 — assertReceiptAddable과 동일 TOCTOU 방어 패턴.
export async function assertReceiptEditable(
  meetingId: string,
  tx?: Prisma.TransactionClient
): Promise<void> {
  const db = tx ?? prisma;
  const settlement = await db.settlement.findUnique({
    where: { meetingId },
    select: { status: true },
  });
  if (!settlement) return;
  if (settlement.status === 'CONFIRMED' || settlement.status === 'COMPLETED') {
    throw new ApiError(
      'FORBIDDEN',
      '정산이 확정되어 영수증을 수정할 수 없습니다.'
    );
  }
  if (settlement.status === 'DRAFT') {
    throw new ApiError(
      'RECEIPT_LOCKED',
      '정산이 시작되어 영수증을 수정할 수 없습니다.'
    );
  }
}

// DELETE 가드: CONFIRMED/COMPLETED → 403, DRAFT 존재 → 409 (api-spec §9 DELETE).
// tx를 넘기면 DELETE 트랜잭션 안에서 실행 — receipt.delete와 같은 tx로 TOCTOU 방어.
export async function assertReceiptDeletable(
  meetingId: string,
  tx?: Prisma.TransactionClient
): Promise<void> {
  const db = tx ?? prisma;
  const settlement = await db.settlement.findUnique({
    where: { meetingId },
    select: { status: true },
  });
  if (!settlement) return;
  if (settlement.status === 'CONFIRMED' || settlement.status === 'COMPLETED') {
    throw new ApiError(
      'FORBIDDEN',
      '정산이 확정되어 영수증을 삭제할 수 없습니다.'
    );
  }
  if (settlement.status === 'DRAFT') {
    throw new ApiError(
      'RECEIPT_LOCKED',
      '정산이 시작되어 영수증을 삭제할 수 없습니다.'
    );
  }
}

// 잠금 + 장수 제한 가드 — manual·OCR 라우트 공용 (api-spec §9 L259·L270).
// LOCK: settlements 행 존재 시 영수증 추가 금지. LIMIT: 모임당 4장, 5장째는 422.
// tx를 넘기면 트랜잭션 안에서 실행 — OCR 라우트는 count-check와 receipt.create를
// 같은 tx로 묶어 TOCTOU 경합을 막는다.
export async function assertReceiptAddable(
  meetingId: string,
  tx?: Prisma.TransactionClient
): Promise<void> {
  const db = tx ?? prisma;

  const settlement = await db.settlement.findUnique({
    where: { meetingId },
    select: { id: true },
  });
  if (settlement) {
    throw new ApiError(
      'RECEIPT_LOCKED',
      '정산이 시작되어 영수증을 추가할 수 없습니다.'
    );
  }

  const receiptCount = await db.receipt.count({ where: { meetingId } });
  if (receiptCount >= RECEIPT_LIMIT) {
    throw new ApiError(
      'RECEIPT_LIMIT_EXCEEDED',
      `영수증은 모임당 최대 ${RECEIPT_LIMIT}장까지 등록할 수 있습니다.`
    );
  }
}
