import 'server-only';

import axios from 'axios';

import type { OcrToken } from '@yummpi/schemas';

import { OcrFailedError } from './errors';
import { normalizeFields, type ClovaField } from './normalize';

const TIMEOUT_MS = 3000;

type ClovaImageResult = {
  inferResult: string;
  message?: string;
  fields?: ClovaField[];
};

type ClovaResponse = {
  images?: ClovaImageResult[];
};

export type CallClovaResult =
  | { status: 'SUCCESS'; tokens: OcrToken[] }
  | { status: 'FAILURE'; message?: string }
  | { status: 'ERROR'; message?: string };

export async function callClovaGeneralOcr(
  imageUrl: string,
  format: 'jpg' | 'png' | 'jpeg'
): Promise<CallClovaResult> {
  const url = process.env.CLOVA_OCR_INVOKE_URL;
  const secret = process.env.CLOVA_OCR_SECRET;
  if (!url || !secret) {
    throw new OcrFailedError('CONFIG', 'CLOVA OCR env not configured');
  }

  const response = await axios.post<ClovaResponse>(
    url,
    {
      version: 'V2',
      // NCloud OCR 공식 문서상 requestId는 단순 추적용 UUID이며 멱등성·중복
      // 제거 정책이 명시돼 있지 않다. retry layer에서 호출이 반복되면 매번
      // 새 UUID가 발급된다 → CLOVA 측 dedup이 있더라도 의존하지 않는 안전
      // 기본값. ④이 CLOVA 콘솔에서 quota 영향을 관찰한 뒤 stable id로
      // 바꿀지 결정한다.
      requestId: crypto.randomUUID(),
      timestamp: Date.now(),
      images: [{ format, name: 'receipt', url: imageUrl }],
    },
    {
      headers: { 'X-OCR-SECRET': secret },
      timeout: TIMEOUT_MS,
    }
  );

  const image = response.data.images?.[0];
  if (!image) {
    throw new OcrFailedError(
      'MALFORMED_RESPONSE',
      'CLOVA response missing images[]'
    );
  }

  if (image.inferResult === 'SUCCESS') {
    return { status: 'SUCCESS', tokens: normalizeFields(image.fields ?? []) };
  }
  if (image.inferResult === 'FAILURE') {
    return { status: 'FAILURE', message: image.message };
  }
  if (image.inferResult === 'ERROR') {
    return { status: 'ERROR', message: image.message };
  }
  throw new OcrFailedError(
    'MALFORMED_RESPONSE',
    `unexpected inferResult: ${image.inferResult}`
  );
}
