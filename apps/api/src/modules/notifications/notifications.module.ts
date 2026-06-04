import { Module } from '@nestjs/common';
import { ReminderQueue } from './reminder.queue';
import { ReminderWorker } from './reminder.worker';

// OWNER ⑤ — BullMQ 송금 독촉(D+1/D+3)·투표 마감·메일. iOS 푸시 제약 → 이메일 fallback.
@Module({ providers: [ReminderQueue, ReminderWorker], exports: [ReminderQueue] })
export class NotificationsModule {}
