export const paymentKeys = {
  all: ['payments'] as const,
  list: (meetingId: string) => [...paymentKeys.all, meetingId] as const,
};
