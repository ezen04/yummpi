import type { Prisma } from '@prisma/client';

// 순수 함수만 — DB(Prisma client)를 import하지 않는다. manual/_utils.test.ts처럼
// docker(DATABASE_URL) 없이도 도는 단위테스트가 이 모듈을 갖다 쓴다.
// DB에 직접 쿼리하는 가드는 `./_receipt-guards.ts`로 분리.

export interface ReceiptItemInput {
  name: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  ocrConfidence?: number | null;
}

export interface BuildReceiptCreateInputParams {
  // OCR 경로는 FE가 crypto.randomUUID()로 미리 발급한 id를 그대로 PK로 넘긴다
  // (서버 재발급 시 FE store 임시 키 리매핑이 필요해져 처음부터 같은 값을 쓰는
  // 쪽이 단순함). manual은 생략 → Prisma 기본값(@default(uuid())) 사용.
  id?: string;
  meetingId: string;
  uploadedByMemberId: string;
  ocrStatus: 'SUCCEEDED' | 'FAILED';
  objectKey: string | null;
  imageUrl: string | null;
  // Json? 컬럼은 명시 null을 넣으면 Prisma JsonNull 처리가 따로 필요해 번거롭다.
  // 값이 없으면 키 자체를 생략해 컬럼 기본(NULL)을 그대로 쓴다(manual 라우트 기존
  // 관례와 동일).
  rawOcrJson: Prisma.InputJsonValue | null;
  // 호출부가 직접 계산해서 넘긴다 — manual은 요청값을 그대로, OCR은 Σ items로
  // 계산(검수 UI #3 폐기 결정과 정합: store가 항상 items 합으로 표시 총액을
  // 재계산하므로 DB도 동일 출처만 신뢰). 이 함수는 출처를 모르고 받은 값만 쓴다.
  totalAmount: number | null;
  items: ReceiptItemInput[];
}

export function buildReceiptCreateInput(
  params: BuildReceiptCreateInputParams
): Prisma.ReceiptCreateInput {
  return {
    ...(params.id ? { id: params.id } : {}),
    meeting: { connect: { id: params.meetingId } },
    uploadedBy: { connect: { id: params.uploadedByMemberId } },
    objectKey: params.objectKey,
    imageUrl: params.imageUrl,
    ocrStatus: params.ocrStatus,
    ...(params.rawOcrJson !== null ? { rawOcrJson: params.rawOcrJson } : {}),
    totalAmount: params.totalAmount,
    items: {
      create: params.items.map((item, idx) => ({
        name: item.name,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalPrice: item.totalPrice,
        ocrConfidence: item.ocrConfidence ?? null,
        sortOrder: idx,
      })),
    },
  };
}
