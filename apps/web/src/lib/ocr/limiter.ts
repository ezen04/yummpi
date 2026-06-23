// 이 limiter는 모듈 싱글톤 — Node.js 프로세스 단위로만 동시성을 제한한다.
// Vercel/serverless에서는 함수 인스턴스마다 새 limiter가 생성되므로
// 실제 동시 호출은 (concurrency × 활성 인스턴스 수)까지 가능하다.
// V2에서 글로벌 한도가 필요하면 Redis 기반(ioredis SETNX/INCR 또는 BullMQ RateLimiter)으로 교체.

import { OcrFailedError } from './errors';

const DEFAULT_CONCURRENCY = 3;
const DEFAULT_MAX_QUEUE = 50;

type Task<T> = () => Promise<T>;

interface QueueEntry {
  task: Task<unknown>;
  resolve: (value: unknown) => void;
  reject: (reason: unknown) => void;
}

export class QueueLimiter {
  private running = 0;
  private readonly queue: QueueEntry[] = [];

  constructor(
    private readonly concurrency: number,
    private readonly maxQueueSize?: number
  ) {}

  enqueue<T>(task: Task<T>): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      if (
        this.maxQueueSize !== undefined &&
        this.queue.length >= this.maxQueueSize
      ) {
        reject(
          new OcrFailedError(
            'QUEUE_OVERFLOW',
            `OCR queue is full (max ${this.maxQueueSize})`
          )
        );
        return;
      }
      this.queue.push({
        task: task as Task<unknown>,
        resolve: resolve as (value: unknown) => void,
        reject,
      });
      this.pump();
    });
  }

  private pump(): void {
    while (this.running < this.concurrency && this.queue.length > 0) {
      const entry = this.queue.shift();
      if (!entry) return;
      this.running += 1;
      // task가 동기 throw해도 finally까지 진입하도록 Promise.resolve로 감싼다.
      // 직접 entry.task()를 호출하면 sync throw 시 running 카운터가 감소되지 않아
      // limiter slot이 영구 소실됨.
      Promise.resolve()
        .then(() => entry.task())
        .then((value) => entry.resolve(value))
        .catch((err: unknown) => entry.reject(err))
        .finally(() => {
          this.running -= 1;
          this.pump();
        });
    }
  }
}

export const ocrLimiter = new QueueLimiter(
  DEFAULT_CONCURRENCY,
  DEFAULT_MAX_QUEUE
);
