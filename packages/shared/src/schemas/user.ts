import { z } from 'zod';

/** 게스트 닉네임 = NextAuth Credentials provider */
export const userRole = z.enum(['HOST', 'GUEST']);
export type UserRole = z.infer<typeof userRole>;

export const userSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email().nullable(),
  nickname: z.string().min(1).max(20),
  role: userRole,
  createdAt: z.string().datetime(),
});
export type User = z.infer<typeof userSchema>;

export const signInSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export const guestJoinSchema = z.object({
  meetingId: z.string().uuid(),
  nickname: z.string().min(1).max(20),
});
export type GuestJoinInput = z.infer<typeof guestJoinSchema>;
