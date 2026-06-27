import {
  OcrReceiptResponseSchema,
  ReceiptUploadResponseSchema,
} from '@yummpi/schemas';
import { useSettlementStore, type OcrItem } from '@/features/settlement/store';

export interface ReceiptUploadEntry {
  receiptId: string;
  file: File;
}

// presigned PUT URL 발급 + Receipt stub(PENDING) 생성
async function requestUploadUrl(
  meetingId: string,
  entry: ReceiptUploadEntry
): Promise<{ uploadUrl: string; objectKey: string }> {
  const res = await fetch(`/api/v1/meetings/${meetingId}/receipts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      receiptId: entry.receiptId,
      fileName: entry.file.name,
      contentType: entry.file.type,
      fileSize: entry.file.size,
    }),
  });
  const body = await res.json().catch(() => {
    throw new Error(`HTTP_${res.status}`);
  });
  if (!body.success) throw new Error(body.error?.code ?? 'UNKNOWN_ERROR');
  const data = ReceiptUploadResponseSchema.parse(body.data);
  return { uploadUrl: data.uploadUrl, objectKey: data.objectKey };
}

// FE → S3 직접 PUT
async function uploadToS3(uploadUrl: string, file: File): Promise<void> {
  const res = await fetch(uploadUrl, {
    method: 'PUT',
    headers: { 'Content-Type': file.type },
    body: file,
  });
  if (!res.ok) throw new Error(`S3_UPLOAD_FAILED_${res.status}`);
}

// OCR 분석 — CLOVA가 presigned GET URL로 S3 직접 fetch
async function triggerOcr(
  meetingId: string,
  receiptId: string
): Promise<{ items: OcrItem[]; unclassifiedLines: string[] }> {
  const res = await fetch(
    `/api/v1/meetings/${meetingId}/receipts/${receiptId}/ocr`,
    { method: 'POST' }
  );
  const body = await res.json().catch(() => {
    throw new Error(`HTTP_${res.status}`);
  });
  if (!body.success) throw new Error(body.error?.code ?? 'UNKNOWN_ERROR');
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

async function processOneReceipt(
  meetingId: string,
  entry: ReceiptUploadEntry
): Promise<{ items: OcrItem[]; unclassifiedLines: string[] }> {
  const { uploadUrl } = await requestUploadUrl(meetingId, entry);
  await uploadToS3(uploadUrl, entry.file);
  return triggerOcr(meetingId, entry.receiptId);
}

export const useOcrProcessor = (meetingId: string) => {
  const { setOcrProcessing, updateOcrResult } = useSettlementStore();

  const processReceipts = async (entries: ReceiptUploadEntry[]) => {
    entries.forEach((entry) => setOcrProcessing(entry.receiptId));

    const results = await Promise.allSettled(
      entries.map((entry) => processOneReceipt(meetingId, entry))
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
