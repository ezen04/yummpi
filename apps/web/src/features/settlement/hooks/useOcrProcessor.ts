import { OcrReceiptResponseSchema } from '@yummpi/schemas';
import { useSettlementStore, type OcrItem } from '@/features/settlement/store';

export interface ReceiptUploadEntry {
  receiptId: string;
  file: File;
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // data:image/jpeg;base64,xxxx 형식 → CLOVA는 순수 base64 본문만 받는다.
      resolve(result.slice(result.indexOf(',') + 1));
    };
    reader.onerror = () =>
      reject(reader.error ?? new Error('FILE_READ_FAILED'));
    reader.readAsDataURL(file);
  });
}

function toOcrFormat(file: File): 'jpg' | 'jpeg' | 'png' {
  return file.type === 'image/png' ? 'png' : 'jpeg';
}

// BE-2b(`POST .../receipts`) 실호출 — 영수증별 독립 호출이라 1장이 실패해도
// throw로 알리기만 하면 호출부(processReceipts)의 allSettled가 나머지를 계속
// 진행한다. receiptId는 호출부가 이미 crypto.randomUUID()로 만들어 둔 값을
// 그대로 서버 PK로 보낸다(별도 id 발급 단계 없음 — page.tsx 참조).
async function callOcrRoute(
  meetingId: string,
  entry: ReceiptUploadEntry
): Promise<{ items: OcrItem[]; unclassifiedLines: string[] }> {
  const imageBase64 = await fileToBase64(entry.file);
  const res = await fetch(`/api/v1/meetings/${meetingId}/receipts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      receiptId: entry.receiptId,
      imageBase64,
      format: toOcrFormat(entry.file),
    }),
  });
  // 504 등 HTML 에러 페이지가 오면 res.json()이 throw — 에러 종류를 명확히 하기
  // 위해 파싱 실패 시 HTTP 상태코드를 담은 에러로 변환한다.
  const body = await res.json().catch(() => {
    throw new Error(`HTTP_${res.status}`);
  });
  if (!body.success) throw new Error(body.error?.code ?? 'UNKNOWN_ERROR');

  // 공유 스키마로 런타임 검증 — BE 응답 shape 변경 시 컴파일·런타임 양쪽에서 잡힌다.
  const data = OcrReceiptResponseSchema.parse(body.data);
  const items: OcrItem[] = data.items.map((item) => ({
    id: item.receiptItemId,
    name: item.name,
    quantity: item.quantity,
    unitPrice: item.unitPrice,
    totalPrice: item.totalPrice,
  }));
  return { items, unclassifiedLines: data.unclassifiedLines };
}

export const useOcrProcessor = (meetingId: string) => {
  const { setOcrProcessing, updateOcrResult } = useSettlementStore();

  const processReceipts = async (entries: ReceiptUploadEntry[]) => {
    // 스피너 노출(검수 화면 PROCESSING 분기)을 위해 일괄 호출 전 전부 PROCESSING으로 전환.
    entries.forEach((entry) => setOcrProcessing(entry.receiptId));

    // 1장 실패해도 나머지는 계속 진행 — 영수증별 독립 호출이므로 allSettled.
    const results = await Promise.allSettled(
      entries.map((entry) => callOcrRoute(meetingId, entry))
    );

    results.forEach((result, index) => {
      const { receiptId } = entries[index];

      if (result.status === 'fulfilled') {
        updateOcrResult(
          receiptId,
          result.value.items,
          'SUCCEEDED',
          result.value.unclassifiedLines
        );
      } else {
        updateOcrResult(receiptId, [], 'FAILED');
      }
    });
  };

  return { processReceipts };
};
