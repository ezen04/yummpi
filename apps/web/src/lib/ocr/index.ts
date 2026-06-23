import 'server-only';

import type { OcrToken } from '@yummpi/schemas';

import { callClovaGeneralOcr } from './clova';
import { OcrFailedError } from './errors';
import { ocrLimiter } from './limiter';
import { retryTransport } from './retry';

export async function callGeneralOcr(
  imageBase64: string,
  format: 'jpg' | 'png' | 'jpeg'
): Promise<OcrToken[]> {
  return ocrLimiter.enqueue(async () => {
    const result = await retryTransport(() =>
      callClovaGeneralOcr(imageBase64, format)
    );
    if (result.status === 'SUCCESS') return result.tokens;
    if (result.status === 'FAILURE') {
      throw new OcrFailedError(
        'INFER_FAILURE',
        result.message ?? 'CLOVA inferResult: FAILURE'
      );
    }
    throw new OcrFailedError(
      'INFER_ERROR',
      result.message ?? 'CLOVA inferResult: ERROR'
    );
  });
}

export { OcrFailedError } from './errors';
export type { OcrFailureKind, OcrInferResult } from './errors';
