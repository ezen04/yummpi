import {
  describe,
  it,
  expect,
  vi,
  beforeEach,
  afterEach,
  type Mock,
} from 'vitest';

vi.mock('axios', () => ({
  default: { post: vi.fn() },
}));

import axios from 'axios';

import { callClovaGeneralOcr } from '../clova';
import { OcrFailedError } from '../errors';

const RECT = [
  { x: 0, y: 0 },
  { x: 10, y: 0 },
  { x: 10, y: 5 },
  { x: 0, y: 5 },
];

const SAMPLE_SUCCESS_BODY = {
  images: [
    {
      inferResult: 'SUCCESS',
      fields: [
        {
          inferText: '삼겹살',
          inferConfidence: 0.99,
          boundingPoly: { vertices: RECT },
          lineBreak: false,
        },
      ],
    },
  ],
};

describe('callClovaGeneralOcr', () => {
  const ORIGINAL_ENV = process.env;
  const mockedPost = axios.post as unknown as Mock;

  beforeEach(() => {
    process.env = {
      ...ORIGINAL_ENV,
      CLOVA_OCR_INVOKE_URL: 'https://example.invalid/ocr',
      CLOVA_OCR_SECRET: 'secret-x',
    };
    mockedPost.mockReset();
  });

  afterEach(() => {
    process.env = ORIGINAL_ENV;
  });

  it('env 미설정 시 OcrFailedError(CONFIG) throw', async () => {
    delete process.env.CLOVA_OCR_INVOKE_URL;

    await expect(callClovaGeneralOcr('base64', 'jpg')).rejects.toMatchObject({
      name: 'OcrFailedError',
      kind: 'CONFIG',
    });
    expect(mockedPost).not.toHaveBeenCalled();
  });

  it('inferResult SUCCESS → status SUCCESS + normalized tokens', async () => {
    mockedPost.mockResolvedValueOnce({ data: SAMPLE_SUCCESS_BODY });

    const result = await callClovaGeneralOcr('base64', 'jpg');

    expect(result.status).toBe('SUCCESS');
    if (result.status === 'SUCCESS') {
      expect(result.tokens).toHaveLength(1);
      expect(result.tokens[0]).toMatchObject({
        text: '삼겹살',
        confidence: 0.99,
        lineBreak: false,
      });
    }
  });

  it('inferResult FAILURE → status FAILURE + message', async () => {
    mockedPost.mockResolvedValueOnce({
      data: {
        images: [{ inferResult: 'FAILURE', message: 'blurry image' }],
      },
    });

    const result = await callClovaGeneralOcr('base64', 'jpg');

    expect(result).toEqual({ status: 'FAILURE', message: 'blurry image' });
  });

  it('inferResult ERROR → status ERROR + message', async () => {
    mockedPost.mockResolvedValueOnce({
      data: {
        images: [{ inferResult: 'ERROR', message: 'internal' }],
      },
    });

    const result = await callClovaGeneralOcr('base64', 'jpg');

    expect(result).toEqual({ status: 'ERROR', message: 'internal' });
  });

  it('images[] 누락 시 MALFORMED_RESPONSE throw', async () => {
    mockedPost.mockResolvedValueOnce({ data: {} });

    await expect(callClovaGeneralOcr('base64', 'jpg')).rejects.toMatchObject({
      name: 'OcrFailedError',
      kind: 'MALFORMED_RESPONSE',
    });
  });

  it('알 수 없는 inferResult → MALFORMED_RESPONSE throw', async () => {
    mockedPost.mockResolvedValueOnce({
      data: { images: [{ inferResult: 'UNKNOWN' }] },
    });

    await expect(callClovaGeneralOcr('base64', 'jpg')).rejects.toMatchObject({
      name: 'OcrFailedError',
      kind: 'MALFORMED_RESPONSE',
    });
  });

  it('axios 호출 시 timeout 3000ms·X-OCR-SECRET 헤더·V2 body 전달', async () => {
    mockedPost.mockResolvedValueOnce({ data: SAMPLE_SUCCESS_BODY });

    await callClovaGeneralOcr('base64-data', 'png');

    expect(mockedPost).toHaveBeenCalledTimes(1);
    const [url, body, config] = mockedPost.mock.calls[0];
    expect(url).toBe('https://example.invalid/ocr');
    expect(body).toMatchObject({
      version: 'V2',
      images: [{ format: 'png', data: 'base64-data' }],
    });
    expect(config).toMatchObject({
      headers: { 'X-OCR-SECRET': 'secret-x' },
      timeout: 3000,
    });
  });

  it('axios 전송 실패는 OcrFailedError로 감싸지 않고 그대로 throw (retry layer가 잡음)', async () => {
    const axiosError = new Error('ECONNABORTED');
    mockedPost.mockRejectedValueOnce(axiosError);

    await expect(callClovaGeneralOcr('base64', 'jpg')).rejects.toBe(axiosError);
    await expect(
      callClovaGeneralOcr('base64', 'jpg').catch((e: unknown) => e)
    ).resolves.not.toBeInstanceOf(OcrFailedError);
  });
});
