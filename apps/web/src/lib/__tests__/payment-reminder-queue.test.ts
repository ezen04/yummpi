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

  it('jobId는 remind-{paymentId}-{sequence} 형식이다', async () => {
    await enqueuePaymentReminder({
      meetingId: 'meeting-1',
      paymentId: 'payment-abc',
      targetUserId: 'user-1',
      sequence: 1,
    });

    expect(mockAdd).toHaveBeenCalledWith(
      'remind',
      expect.objectContaining({ paymentId: 'payment-abc' }),
      expect.objectContaining({ jobId: 'remind-payment-abc-1' })
    );
  });

  it("jobId에 ':'가 포함되지 않는다 (BullMQ가 거부 → 독촉 500 회귀 방지)", async () => {
    await enqueuePaymentReminder({
      meetingId: 'meeting-1',
      paymentId: 'payment-abc',
      targetUserId: 'user-1',
      sequence: 1,
    });

    const jobId = mockAdd.mock.calls[0][2].jobId as string;
    expect(jobId).not.toContain(':');
  });

  it('회차(sequence)가 다르면 jobId가 달라 같은 날 재독촉이 BullMQ 중복 제거에 막히지 않는다', async () => {
    const base = {
      meetingId: 'meeting-1',
      paymentId: 'payment-abc',
      targetUserId: 'user-1',
    };

    await enqueuePaymentReminder({ ...base, sequence: 1 });
    await enqueuePaymentReminder({ ...base, sequence: 2 });

    expect(mockAdd).toHaveBeenCalledTimes(2);
    expect(mockAdd.mock.calls[0][2]).toMatchObject({
      jobId: 'remind-payment-abc-1',
    });
    expect(mockAdd.mock.calls[1][2]).toMatchObject({
      jobId: 'remind-payment-abc-2',
    });
  });

  it('job에 meetingId, paymentId, targetUserId, sequence가 모두 포함된다', async () => {
    await enqueuePaymentReminder({
      meetingId: 'meeting-xyz',
      paymentId: 'payment-xyz',
      targetUserId: 'user-xyz',
      sequence: 3,
    });

    expect(mockAdd).toHaveBeenCalledWith(
      'remind',
      {
        meetingId: 'meeting-xyz',
        paymentId: 'payment-xyz',
        targetUserId: 'user-xyz',
        sequence: 3,
      },
      expect.any(Object)
    );
  });
});
