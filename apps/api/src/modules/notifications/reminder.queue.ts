import { Injectable } from '@nestjs/common';
import { Queue } from 'bullmq';
import IORedis from 'ioredis';

// OWNER ⑤ — 송금 독촉 잡 등록 (D+1/D+3)
@Injectable()
export class ReminderQueue {
  private readonly connection = new IORedis(process.env.REDIS_URL!, {
    maxRetriesPerRequest: null,
  });
  readonly queue = new Queue('settlement-reminder', { connection: this.connection });

  async scheduleReminders(settlementId: string) {
    const day = 24 * 60 * 60 * 1000;
    await this.queue.add('d1', { settlementId }, { delay: day });
    await this.queue.add('d3', { settlementId }, { delay: 3 * day });
  }
}
