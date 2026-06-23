import { describe, it, expect } from 'vitest';

import { QueueLimiter } from '../limiter';

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

describe('QueueLimiter', () => {
  it('concurrency 이하로만 동시에 실행한다', async () => {
    const limiter = new QueueLimiter(2);
    let runningPeak = 0;
    let running = 0;

    const tasks = Array.from({ length: 5 }, (_, i) =>
      limiter.enqueue(async () => {
        running += 1;
        runningPeak = Math.max(runningPeak, running);
        await new Promise((resolve) => setTimeout(resolve, 10));
        running -= 1;
        return i;
      })
    );

    await Promise.all(tasks);

    expect(runningPeak).toBe(2);
  });

  it('한도 초과 task는 큐에 대기 후 순차 실행', async () => {
    const limiter = new QueueLimiter(1);
    const order: number[] = [];
    const d1 = deferred<void>();
    const d2 = deferred<void>();

    const p1 = limiter.enqueue(async () => {
      order.push(1);
      await d1.promise;
      order.push(11);
    });
    const p2 = limiter.enqueue(async () => {
      order.push(2);
      await d2.promise;
      order.push(22);
    });

    // 처음에는 1번만 시작
    await Promise.resolve();
    expect(order).toEqual([1]);

    d1.resolve();
    await p1;
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(order).toEqual([1, 11, 2]);

    d2.resolve();
    await p2;
    expect(order).toEqual([1, 11, 2, 22]);
  });

  it('task가 throw하면 enqueue caller에게 reject 전파, 다음 task는 계속', async () => {
    const limiter = new QueueLimiter(1);

    const p1 = limiter.enqueue(async () => {
      throw new Error('boom');
    });
    const p2 = limiter.enqueue(async () => 'ok');

    await expect(p1).rejects.toThrow('boom');
    await expect(p2).resolves.toBe('ok');
  });

  it('동기 throw하는 task도 running 카운터를 복구하고 다음 task 계속', async () => {
    const limiter = new QueueLimiter(1);

    // async 키워드 없이 동기 throw — 타입 시스템은 막지만 런타임에선 가능
    const p1 = limiter.enqueue((() => {
      throw new Error('sync boom');
    }) as () => Promise<never>);
    const p2 = limiter.enqueue(async () => 'recovered');

    await expect(p1).rejects.toThrow('sync boom');
    await expect(p2).resolves.toBe('recovered');
  });

  it('maxQueueSize 초과 시 OcrFailedError(QUEUE_OVERFLOW)로 즉시 reject', async () => {
    const limiter = new QueueLimiter(1, 2);
    const d1 = deferred<void>();

    const p1 = limiter.enqueue(async () => {
      await d1.promise;
    });
    const p2 = limiter.enqueue(async () => 'two');
    const p3 = limiter.enqueue(async () => 'three');
    // queue=[p2, p3] → length=2 == maxQueueSize. 4번째는 reject.
    const p4 = limiter.enqueue(async () => 'four');

    await expect(p4).rejects.toMatchObject({
      name: 'OcrFailedError',
      kind: 'QUEUE_OVERFLOW',
    });

    // 정상 흐름 복구 — p1·p2·p3는 영향 없이 진행
    d1.resolve();
    await expect(p1).resolves.toBeUndefined();
    await expect(p2).resolves.toBe('two');
    await expect(p3).resolves.toBe('three');
  });

  it('overflow 후 큐가 비면 다시 enqueue 가능 (transient backpressure)', async () => {
    const limiter = new QueueLimiter(1, 1);
    const d1 = deferred<void>();

    const p1 = limiter.enqueue(async () => {
      await d1.promise;
    });
    const p2 = limiter.enqueue(async () => 'two'); // 큐에 들어감
    const p3 = limiter.enqueue(async () => 'three'); // overflow

    await expect(p3).rejects.toMatchObject({ kind: 'QUEUE_OVERFLOW' });

    d1.resolve();
    await p1;
    await p2;

    const p4 = limiter.enqueue(async () => 'four');
    await expect(p4).resolves.toBe('four');
  });

  it('maxQueueSize 미지정 시 무제한 (기존 동작 유지)', async () => {
    const limiter = new QueueLimiter(1);
    const d1 = deferred<void>();

    const blocker = limiter.enqueue(async () => {
      await d1.promise;
    });
    // 50개 enqueue — 모두 큐에 쌓이고 reject 안 됨
    const tasks = Array.from({ length: 50 }, (_, i) =>
      limiter.enqueue(async () => i)
    );

    // 동기 단계에서 reject 발생 여부 점검 — 0ms 대기 후 어떤 promise도 settled-reject 상태가 아님
    await new Promise((resolve) => setTimeout(resolve, 0));
    const settled = await Promise.race([
      Promise.allSettled(tasks).then(() => 'all-settled'),
      new Promise((resolve) => setTimeout(() => resolve('still-pending'), 5)),
    ]);
    expect(settled).toBe('still-pending');

    d1.resolve();
    await blocker;
    const results = await Promise.all(tasks);
    expect(results).toHaveLength(50);
  });
});
