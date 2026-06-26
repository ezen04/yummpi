import { vi, describe, it, expect, beforeEach } from 'vitest';

const mockAdd = vi.fn().mockResolvedValue({ id: 'job-1' });

vi.mock('bullmq', () => ({
  Queue: class {
    add(...args: any[]) {
      return mockAdd(...args);
    }
  },
}));
vi.mock('ioredis', () => ({
  Redis: class {},
}));

import { enqueuePaymentReminder } from '../payment-reminder-queue';

describe('enqueuePaymentReminder — jobId 패턴', () => {
  beforeEach(() => {
    mockAdd.mockClear();
  });

  it('jobId는 remind-{paymentId} 형식이다', async () => {
    await enqueuePaymentReminder({
      meetingId: 'meeting-1',
      paymentId: 'payment-abc',
      targetUserId: 'user-1',
    });

    expect(mockAdd).toHaveBeenCalledWith(
      'remind',
      expect.objectContaining({ paymentId: 'payment-abc' }),
      expect.objectContaining({ jobId: 'remind-payment-abc' })
    );
  });

  it("jobId에 ':'가 포함되지 않는다 (BullMQ가 거부 → 독촉 500 회귀 방지)", async () => {
    await enqueuePaymentReminder({
      meetingId: 'meeting-1',
      paymentId: 'payment-abc',
      targetUserId: 'user-1',
    });

    const jobId = mockAdd.mock.calls[0][2].jobId as string;
    expect(jobId).not.toContain(':');
  });

  it('같은 paymentId로 두 번 호출해도 jobId가 동일하다 (BullMQ 레벨 중복 방지 보장)', async () => {
    const data = {
      meetingId: 'meeting-1',
      paymentId: 'payment-abc',
      targetUserId: 'user-1',
    };

    await enqueuePaymentReminder(data);
    await enqueuePaymentReminder(data);

    expect(mockAdd).toHaveBeenCalledTimes(2);
    expect(mockAdd.mock.calls[0][2]).toMatchObject({
      jobId: 'remind-payment-abc',
    });
    expect(mockAdd.mock.calls[1][2]).toMatchObject({
      jobId: 'remind-payment-abc',
    });
  });

  it('job에 meetingId, paymentId, targetUserId가 모두 포함된다', async () => {
    await enqueuePaymentReminder({
      meetingId: 'meeting-xyz',
      paymentId: 'payment-xyz',
      targetUserId: 'user-xyz',
    });

    expect(mockAdd).toHaveBeenCalledWith(
      'remind',
      {
        meetingId: 'meeting-xyz',
        paymentId: 'payment-xyz',
        targetUserId: 'user-xyz',
      },
      expect.any(Object)
    );
  });
});
