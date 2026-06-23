const DEFAULT_CONCURRENCY = 3;

type Task<T> = () => Promise<T>;

interface QueueEntry {
  task: Task<unknown>;
  resolve: (value: unknown) => void;
  reject: (reason: unknown) => void;
}

class QueueLimiter {
  private running = 0;
  private readonly queue: QueueEntry[] = [];

  constructor(private readonly concurrency: number) {}

  enqueue<T>(task: Task<T>): Promise<T> {
    return new Promise<T>((resolve, reject) => {
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
      entry
        .task()
        .then((value) => entry.resolve(value))
        .catch((err: unknown) => entry.reject(err))
        .finally(() => {
          this.running -= 1;
          this.pump();
        });
    }
  }
}

export const ocrLimiter = new QueueLimiter(DEFAULT_CONCURRENCY);
