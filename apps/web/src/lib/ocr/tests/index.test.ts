import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';

vi.mock('../clova', () => ({
  callClovaGeneralOcr: vi.fn(),
}));

import { callClovaGeneralOcr } from '../clova';
import { callGeneralOcr } from '../index';

const IMAGE_URL = 'https://s3.example.com/meetings/abc/receipts/xyz.jpg';
const TOKEN = {
  text: '치킨',
  confidence: 0.99,
  cx: 0,
  cy: 0,
  width: 10,
  height: 10,
  lineBreak: false,
};

describe('callGeneralOcr', () => {
  const mockedClova = callClovaGeneralOcr as unknown as Mock;

  beforeEach(() => {
    mockedClova.mockReset();
  });

  it('imageUrl·format을 callClovaGeneralOcr에 그대로 전달한다', async () => {
    mockedClova.mockResolvedValueOnce({ status: 'SUCCESS', tokens: [TOKEN] });

    await callGeneralOcr(IMAGE_URL, 'jpg');

    expect(mockedClova).toHaveBeenCalledWith(IMAGE_URL, 'jpg');
  });

  it('SUCCESS → tokens 배열 반환', async () => {
    mockedClova.mockResolvedValueOnce({ status: 'SUCCESS', tokens: [TOKEN] });

    const result = await callGeneralOcr(IMAGE_URL, 'jpg');

    expect(result).toEqual([TOKEN]);
  });

  it('FAILURE → OcrFailedError(INFER_FAILURE) throw', async () => {
    mockedClova.mockResolvedValueOnce({
      status: 'FAILURE',
      message: '이미지 흐림',
    });

    await expect(callGeneralOcr(IMAGE_URL, 'jpg')).rejects.toMatchObject({
      name: 'OcrFailedError',
      kind: 'INFER_FAILURE',
    });
  });

  it('ERROR → OcrFailedError(INFER_ERROR) throw', async () => {
    mockedClova.mockResolvedValueOnce({ status: 'ERROR', message: 'internal' });

    await expect(callGeneralOcr(IMAGE_URL, 'jpg')).rejects.toMatchObject({
      name: 'OcrFailedError',
      kind: 'INFER_ERROR',
    });
  });
});
