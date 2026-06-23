import { OcrFailedError } from './errors';

const BACKOFFS_MS = [100, 300] as const;

export async function retryTransport<T>(fn: () => Promise<T>): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt <= BACKOFFS_MS.length; attempt++) {
    try {
      return await fn();
    } catch (err) {
      if (err instanceof OcrFailedError) throw err;
      lastError = err;
      if (attempt < BACKOFFS_MS.length) {
        await new Promise((resolve) =>
          setTimeout(resolve, BACKOFFS_MS[attempt])
        );
      }
    }
  }
  throw new OcrFailedError(
    'TRANSPORT',
    'OCR transport failed after retries',
    lastError
  );
}
