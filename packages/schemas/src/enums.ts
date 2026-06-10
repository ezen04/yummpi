import { z } from "zod";

export const gatheringStatusSchema = z.enum([
  "DRAFT",
  "OPEN",
  "CLOSED",
  "CANCELLED",
]);

export const reservationStatusSchema = z.enum([
  "PENDING",
  "CONFIRMED",
  "CANCELLED",
]);

export const voteTypeSchema = z.enum(["SINGLE", "MULTIPLE"]);

export const paymentStatusSchema = z.enum([
  "PENDING",
  "COMPLETED",
  "FAILED",
  "CANCELLED",
]);
