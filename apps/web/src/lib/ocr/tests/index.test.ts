import { describe, it, expect } from 'vitest';

import { callGeneralOcr } from '../index';

describe('callGeneralOcr — input guards', () => {
  it('imageBase64 6MB 초과 시 CONFIG throw (limiter·네트워크 진입 전 fail-fast)', async () => {
    const oversized = 'a'.repeat(6 * 1024 * 1024 + 1);

    await expect(callGeneralOcr(oversized, 'jpg')).rejects.toMatchObject({
      name: 'OcrFailedError',
      kind: 'CONFIG',
    });
    await expect(callGeneralOcr(oversized, 'jpg')).rejects.toThrow(
      /exceeds CLOVA OCR limit/
    );
  });
});
