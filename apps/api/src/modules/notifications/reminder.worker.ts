import { Injectable, OnModuleInit } from '@nestjs/common';
import { Worker } from 'bullmq';
import IORedis from 'ioredis';

// OWNER ⑤ — 독촉 처리: 미송금자에게 웹푸시 + 이메일 fallback
@Injectable()
export class ReminderWorker implements OnModuleInit {
  onModuleInit() {
    const connection = new IORedis(process.env.REDIS_URL!, { maxRetriesPerRequest: null });
    new Worker(
      'settlement-reminder',
      async (job) => {
        // TODO(⑤): 미송금 Share 조회 → 푸시 시도 → 실패/미설치 시 Nodemailer 메일
        void job;
      },
      { connection },
    );
  }
}
