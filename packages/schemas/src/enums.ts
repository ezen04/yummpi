import { z } from 'zod';

// 모임 상태 머신 (Prisma MeetingStatus 일치)
export const meetingStatusSchema = z.enum([
  'DRAFT',
  'RECRUITING',
  'VOTING',
  'PLACE_CONFIRMED',
  'IN_PROGRESS',
  'SETTLING',
  'COMPLETED',
  'CANCELLED',
]);

export const memberRoleSchema = z.enum(['HOST', 'MEMBER']);

export const attendanceStatusSchema = z.enum([
  'PENDING',
  'ATTENDING',
  'ABSENT',
]);

export const candidateStatusSchema = z.enum(['ACTIVE', 'REJECTED']);

export const reservationStatusSchema = z.enum(['NONE', 'PENDING', 'DONE']);

export const ocrStatusSchema = z.enum([
  'PENDING',
  'PROCESSING',
  'SUCCEEDED',
  'FAILED',
]);

export const settlementStatusSchema = z.enum([
  'DRAFT',
  'CONFIRMED',
  'COMPLETED',
]);

export const splitMethodSchema = z.enum(['ITEM_BASED', 'EQUAL']);

export const paymentStatusSchema = z.enum([
  'PENDING',
  'TRANSFER_REPORTED', // Prisma enum 선반영 (① migration PR 머지 전)
  'PAID',
  'EXEMPT',
]);
