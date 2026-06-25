import { useSettlementStore, type OcrItem } from '@/features/settlement/store';
import {
  MOCK_OCR_FAILED_RATE,
  MOCK_RECEIPT_SETS,
} from '@/features/settlement/constants';

export interface ReceiptUploadEntry {
  receiptId: string;
  file: File;
}

// fixture 하니스 — BE-2b(`POST .../receipts`, callGeneralOcr 실호출 + manual과
// 공통 영속 코어 연결)가 아직 없어 mock으로만 동작한다. BE-2b 도입 시 이 함수만
// 아래 fetch 호출로 교체하면 된다:
//
//   const base64 = await fileToBase64(entry.file);
//   const res = await fetch(`/api/v1/meetings/${meetingId}/receipts`, {
//     method: 'POST',
//     body: JSON.stringify({ receiptId: entry.receiptId, imageBase64: base64 }),
//   });
//   const body = await res.json();
//   if (!body.success) throw new Error(body.error.code);
//   return { items: body.data.items, unclassifiedLines: body.data.unclassifiedLines };
//
// (실 OcrToken 파싱은 서버 라우트 안에서 callGeneralOcr → parseReceipt로 끝낸다.
// 클라는 결과만 받으므로 parseReceipt를 여기서 호출하지 않는다.)
function mockOcrCall(
  index: number
): Promise<{ items: Omit<OcrItem, 'id'>[]; unclassifiedLines: string[] }> {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (Math.random() < MOCK_OCR_FAILED_RATE) {
        reject(new Error('MOCK_OCR_FAILED'));
        return;
      }
      const set = MOCK_RECEIPT_SETS[index % MOCK_RECEIPT_SETS.length];
      resolve(set);
    }, 600);
  });
}

export const useOcrProcessor = () => {
  const { setOcrProcessing, updateOcrResult } = useSettlementStore();

  const processReceipts = async (entries: ReceiptUploadEntry[]) => {
    // 스피너 노출(검수 화면 PROCESSING 분기)을 위해 일괄 호출 전 전부 PROCESSING으로 전환.
    entries.forEach((entry) => setOcrProcessing(entry.receiptId));

    // 1장 실패해도 나머지는 계속 진행 — 영수증별 독립 호출이므로 allSettled.
    const results = await Promise.allSettled(
      entries.map((entry, index) => mockOcrCall(index))
    );

    results.forEach((result, index) => {
      const { receiptId } = entries[index];

      if (result.status === 'fulfilled') {
        const items: OcrItem[] = result.value.items.map((item, i) => ({
          ...item,
          id: `${receiptId}-${i + 1}`,
        }));
        updateOcrResult(
          receiptId,
          items,
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
