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
    switch (result.status) {
      case 'SUCCESS':
        return result.tokens;
      case 'FAILURE':
        throw new OcrFailedError(
          'INFER_FAILURE',
          result.message ?? 'CLOVA inferResult: FAILURE'
        );
      case 'ERROR':
        throw new OcrFailedError(
          'INFER_ERROR',
          result.message ?? 'CLOVA inferResult: ERROR'
        );
      default:
        result satisfies never;
        throw new OcrFailedError(
          'MALFORMED_RESPONSE',
          'unexpected CLOVA inferResult status'
        );
    }
  });
}

export { OcrFailedError } from './errors';
export type { OcrFailureKind, OcrInferResult } from './errors';
