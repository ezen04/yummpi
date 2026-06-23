import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import { OcrFailedError } from '../errors';
import { retryTransport } from '../retry';

describe('retryTransport', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('첫 시도 성공 시 그대로 반환한다', async () => {
    const fn = vi.fn().mockResolvedValue('ok');

    const result = await retryTransport(fn);

    expect(result).toBe('ok');
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('전송 실패 시 100ms·300ms backoff로 총 3회 시도한다', async () => {
    const fn = vi
      .fn()
      .mockRejectedValueOnce(new Error('net 1'))
      .mockRejectedValueOnce(new Error('net 2'))
      .mockResolvedValueOnce('ok');

    const promise = retryTransport(fn);

    await vi.advanceTimersByTimeAsync(100);
    await vi.advanceTimersByTimeAsync(300);

    await expect(promise).resolves.toBe('ok');
    expect(fn).toHaveBeenCalledTimes(3);
  });

  it('3회 모두 전송 실패 시 OcrFailedError(TRANSPORT) throw + cause 보존', async () => {
    const lastError = new Error('final net');
    const fn = vi
      .fn()
      .mockRejectedValueOnce(new Error('net 1'))
      .mockRejectedValueOnce(new Error('net 2'))
      .mockRejectedValueOnce(lastError);

    const captured = retryTransport(fn).catch((e: unknown) => e);

    await vi.advanceTimersByTimeAsync(100);
    await vi.advanceTimersByTimeAsync(300);

    const error = await captured;
    expect(fn).toHaveBeenCalledTimes(3);
    expect(error).toBeInstanceOf(OcrFailedError);
    expect((error as OcrFailedError).kind).toBe('TRANSPORT');
    expect((error as OcrFailedError).cause).toBe(lastError);
  });

  it('OcrFailedError(CONFIG)는 재시도 없이 즉시 re-throw', async () => {
    const configError = new OcrFailedError('CONFIG', 'env missing');
    const fn = vi.fn().mockRejectedValue(configError);

    await expect(retryTransport(fn)).rejects.toBe(configError);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('OcrFailedError(MALFORMED_RESPONSE)도 재시도 없이 즉시 re-throw', async () => {
    const malformedError = new OcrFailedError(
      'MALFORMED_RESPONSE',
      'missing images'
    );
    const fn = vi.fn().mockRejectedValue(malformedError);

    await expect(retryTransport(fn)).rejects.toBe(malformedError);
    expect(fn).toHaveBeenCalledTimes(1);
  });
});
