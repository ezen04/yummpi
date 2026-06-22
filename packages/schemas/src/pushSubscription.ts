import { z } from 'zod';

export const CreatePushSubscriptionSchema = z.object({
  endpoint: z.string().url(),
  p256dh: z.string().min(1),
  auth: z.string().min(1),
  userAgent: z.string().optional(),
});

export const DeletePushSubscriptionSchema = z.object({
  endpoint: z.string().url(),
});

export type CreatePushSubscriptionInput = z.infer<
  typeof CreatePushSubscriptionSchema
>;
export type DeletePushSubscriptionInput = z.infer<
  typeof DeletePushSubscriptionSchema
>;
