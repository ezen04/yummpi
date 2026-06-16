/*
  Warnings:

  - You are about to drop the `Account` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Session` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `User` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `VerificationToken` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "meeting_status" AS ENUM ('DRAFT', 'RECRUITING', 'VOTING', 'PLACE_CONFIRMED', 'IN_PROGRESS', 'SETTLING', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "member_role" AS ENUM ('HOST', 'MEMBER');

-- CreateEnum
CREATE TYPE "attendance_status" AS ENUM ('PENDING', 'ATTENDING', 'ABSENT');

-- CreateEnum
CREATE TYPE "candidate_status" AS ENUM ('ACTIVE', 'REJECTED');

-- CreateEnum
CREATE TYPE "reservation_status" AS ENUM ('NONE', 'PENDING', 'DONE');

-- CreateEnum
CREATE TYPE "ocr_status" AS ENUM ('PENDING', 'PROCESSING', 'SUCCEEDED', 'FAILED');

-- CreateEnum
CREATE TYPE "settlement_status" AS ENUM ('DRAFT', 'CONFIRMED', 'COMPLETED');

-- CreateEnum
CREATE TYPE "split_method" AS ENUM ('ITEM_BASED', 'EQUAL');

-- CreateEnum
CREATE TYPE "payment_status" AS ENUM ('PENDING', 'PAID', 'EXEMPT');

-- DropForeignKey
ALTER TABLE "Account" DROP CONSTRAINT "Account_userId_fkey";

-- DropForeignKey
ALTER TABLE "Session" DROP CONSTRAINT "Session_userId_fkey";

-- DropTable
DROP TABLE "Account";

-- DropTable
DROP TABLE "Session";

-- DropTable
DROP TABLE "User";

-- DropTable
DROP TABLE "VerificationToken";

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "name" TEXT,
    "nickname" TEXT,
    "email" TEXT,
    "email_verified" TIMESTAMP(3),
    "image" TEXT,
    "push_enabled" BOOLEAN NOT NULL DEFAULT true,
    "payment_reminder_enabled" BOOLEAN NOT NULL DEFAULT true,
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "accounts" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "provider_account_id" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" UUID NOT NULL,
    "session_token" TEXT NOT NULL,
    "user_id" UUID NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "verification_tokens" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "push_subscriptions" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "endpoint" TEXT NOT NULL,
    "p256dh_key" TEXT NOT NULL,
    "auth_key" TEXT NOT NULL,
    "user_agent" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "push_subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "meetings" (
    "id" UUID NOT NULL,
    "host_user_id" UUID NOT NULL,
    "confirmed_candidate_id" UUID,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" "meeting_status" NOT NULL DEFAULT 'DRAFT',
    "scheduled_at" TIMESTAMP(3),
    "voting_closes_at" TIMESTAMP(3),
    "max_members" INTEGER,
    "budget_per_person" INTEGER,
    "food_types" TEXT[],
    "need_parking" BOOLEAN NOT NULL DEFAULT false,
    "need_room" BOOLEAN NOT NULL DEFAULT false,
    "anonymous_voting" BOOLEAN NOT NULL DEFAULT false,
    "place_search_radius_m" INTEGER,
    "invite_code" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "cancelled_at" TIMESTAMP(3),

    CONSTRAINT "meetings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "meeting_members" (
    "id" UUID NOT NULL,
    "meeting_id" UUID NOT NULL,
    "user_id" UUID,
    "guest_token_hash" TEXT,
    "nickname" TEXT NOT NULL,
    "role" "member_role" NOT NULL DEFAULT 'MEMBER',
    "attendance_status" "attendance_status" NOT NULL DEFAULT 'PENDING',
    "start_address" TEXT,
    "start_station" TEXT,
    "start_latitude" DECIMAL(10,7),
    "start_longitude" DECIMAL(10,7),
    "checked_in" BOOLEAN NOT NULL DEFAULT false,
    "checked_in_at" TIMESTAMP(3),
    "joined_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "left_at" TIMESTAMP(3),

    CONSTRAINT "meeting_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "place_candidates" (
    "id" UUID NOT NULL,
    "meeting_id" UUID NOT NULL,
    "created_by_member_id" UUID,
    "external_place_id" TEXT,
    "name" TEXT NOT NULL,
    "category_name" TEXT,
    "address" TEXT,
    "road_address" TEXT,
    "phone" TEXT,
    "latitude" DECIMAL(10,7),
    "longitude" DECIMAL(10,7),
    "place_url" TEXT,
    "status" "candidate_status" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "place_candidates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "votes" (
    "id" UUID NOT NULL,
    "meeting_id" UUID NOT NULL,
    "member_id" UUID NOT NULL,
    "candidate_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "votes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reservations" (
    "id" UUID NOT NULL,
    "meeting_id" UUID NOT NULL,
    "place_candidate_id" UUID NOT NULL,
    "status" "reservation_status" NOT NULL DEFAULT 'NONE',
    "reservation_name" TEXT,
    "reservation_at" TIMESTAMP(3),
    "party_size" INTEGER,
    "confirmation_number" TEXT,
    "memo" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reservations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "receipts" (
    "id" UUID NOT NULL,
    "meeting_id" UUID NOT NULL,
    "uploaded_by_member_id" UUID,
    "object_key" TEXT NOT NULL,
    "image_url" TEXT,
    "ocr_status" "ocr_status" NOT NULL DEFAULT 'PENDING',
    "raw_ocr_json" JSONB,
    "merchant_name" TEXT,
    "purchased_at" TIMESTAMP(3),
    "subtotal_amount" INTEGER,
    "tax_amount" INTEGER,
    "service_charge_amount" INTEGER,
    "discount_amount" INTEGER,
    "total_amount" INTEGER,
    "currency" TEXT NOT NULL DEFAULT 'KRW',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "receipts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "receipt_items" (
    "id" UUID NOT NULL,
    "receipt_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "unit_price" INTEGER NOT NULL,
    "total_price" INTEGER NOT NULL,
    "ocr_confidence" DECIMAL(5,4),
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "receipt_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "settlements" (
    "id" UUID NOT NULL,
    "meeting_id" UUID NOT NULL,
    "split_method" "split_method" NOT NULL DEFAULT 'ITEM_BASED',
    "status" "settlement_status" NOT NULL DEFAULT 'DRAFT',
    "total_amount" INTEGER NOT NULL DEFAULT 0,
    "allocated_amount" INTEGER NOT NULL DEFAULT 0,
    "confirmed_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "settlements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "item_assignments" (
    "id" UUID NOT NULL,
    "settlement_id" UUID NOT NULL,
    "receipt_item_id" UUID NOT NULL,
    "member_id" UUID NOT NULL,
    "share_numerator" INTEGER NOT NULL,
    "share_denominator" INTEGER NOT NULL,
    "assigned_amount" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "item_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "settlement_members" (
    "id" UUID NOT NULL,
    "settlement_id" UUID NOT NULL,
    "member_id" UUID NOT NULL,
    "item_amount" INTEGER NOT NULL DEFAULT 0,
    "tax_amount" INTEGER NOT NULL DEFAULT 0,
    "service_charge_amount" INTEGER NOT NULL DEFAULT 0,
    "discount_amount" INTEGER NOT NULL DEFAULT 0,
    "adjustment_amount" INTEGER NOT NULL DEFAULT 0,
    "final_amount" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "settlement_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payments" (
    "id" UUID NOT NULL,
    "settlement_member_id" UUID NOT NULL,
    "status" "payment_status" NOT NULL DEFAULT 'PENDING',
    "amount" INTEGER NOT NULL,
    "paid_at" TIMESTAMP(3),
    "memo" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "accounts_provider_provider_account_id_key" ON "accounts"("provider", "provider_account_id");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_session_token_key" ON "sessions"("session_token");

-- CreateIndex
CREATE UNIQUE INDEX "verification_tokens_token_key" ON "verification_tokens"("token");

-- CreateIndex
CREATE UNIQUE INDEX "verification_tokens_identifier_token_key" ON "verification_tokens"("identifier", "token");

-- CreateIndex
CREATE UNIQUE INDEX "push_subscriptions_endpoint_key" ON "push_subscriptions"("endpoint");

-- CreateIndex
CREATE UNIQUE INDEX "meetings_confirmed_candidate_id_key" ON "meetings"("confirmed_candidate_id");

-- CreateIndex
CREATE UNIQUE INDEX "meetings_invite_code_key" ON "meetings"("invite_code");

-- CreateIndex
CREATE INDEX "meeting_members_meeting_id_idx" ON "meeting_members"("meeting_id");

-- CreateIndex
CREATE UNIQUE INDEX "place_candidates_meeting_id_external_place_id_key" ON "place_candidates"("meeting_id", "external_place_id");

-- CreateIndex
CREATE UNIQUE INDEX "votes_meeting_id_member_id_key" ON "votes"("meeting_id", "member_id");

-- CreateIndex
CREATE UNIQUE INDEX "reservations_meeting_id_key" ON "reservations"("meeting_id");

-- CreateIndex
CREATE UNIQUE INDEX "reservations_place_candidate_id_key" ON "reservations"("place_candidate_id");

-- CreateIndex
CREATE UNIQUE INDEX "receipts_object_key_key" ON "receipts"("object_key");

-- CreateIndex
CREATE UNIQUE INDEX "settlements_meeting_id_key" ON "settlements"("meeting_id");

-- CreateIndex
CREATE UNIQUE INDEX "item_assignments_settlement_id_receipt_item_id_member_id_key" ON "item_assignments"("settlement_id", "receipt_item_id", "member_id");

-- CreateIndex
CREATE UNIQUE INDEX "settlement_members_settlement_id_member_id_key" ON "settlement_members"("settlement_id", "member_id");

-- CreateIndex
CREATE UNIQUE INDEX "payments_settlement_member_id_key" ON "payments"("settlement_member_id");

-- AddForeignKey
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "push_subscriptions" ADD CONSTRAINT "push_subscriptions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meetings" ADD CONSTRAINT "meetings_host_user_id_fkey" FOREIGN KEY ("host_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meetings" ADD CONSTRAINT "meetings_confirmed_candidate_id_fkey" FOREIGN KEY ("confirmed_candidate_id") REFERENCES "place_candidates"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meeting_members" ADD CONSTRAINT "meeting_members_meeting_id_fkey" FOREIGN KEY ("meeting_id") REFERENCES "meetings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meeting_members" ADD CONSTRAINT "meeting_members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "place_candidates" ADD CONSTRAINT "place_candidates_meeting_id_fkey" FOREIGN KEY ("meeting_id") REFERENCES "meetings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "place_candidates" ADD CONSTRAINT "place_candidates_created_by_member_id_fkey" FOREIGN KEY ("created_by_member_id") REFERENCES "meeting_members"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "votes" ADD CONSTRAINT "votes_meeting_id_fkey" FOREIGN KEY ("meeting_id") REFERENCES "meetings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "votes" ADD CONSTRAINT "votes_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "meeting_members"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "votes" ADD CONSTRAINT "votes_candidate_id_fkey" FOREIGN KEY ("candidate_id") REFERENCES "place_candidates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reservations" ADD CONSTRAINT "reservations_meeting_id_fkey" FOREIGN KEY ("meeting_id") REFERENCES "meetings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reservations" ADD CONSTRAINT "reservations_place_candidate_id_fkey" FOREIGN KEY ("place_candidate_id") REFERENCES "place_candidates"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "receipts" ADD CONSTRAINT "receipts_meeting_id_fkey" FOREIGN KEY ("meeting_id") REFERENCES "meetings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "receipts" ADD CONSTRAINT "receipts_uploaded_by_member_id_fkey" FOREIGN KEY ("uploaded_by_member_id") REFERENCES "meeting_members"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "receipt_items" ADD CONSTRAINT "receipt_items_receipt_id_fkey" FOREIGN KEY ("receipt_id") REFERENCES "receipts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "settlements" ADD CONSTRAINT "settlements_meeting_id_fkey" FOREIGN KEY ("meeting_id") REFERENCES "meetings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "item_assignments" ADD CONSTRAINT "item_assignments_settlement_id_fkey" FOREIGN KEY ("settlement_id") REFERENCES "settlements"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "item_assignments" ADD CONSTRAINT "item_assignments_receipt_item_id_fkey" FOREIGN KEY ("receipt_item_id") REFERENCES "receipt_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "item_assignments" ADD CONSTRAINT "item_assignments_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "meeting_members"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "settlement_members" ADD CONSTRAINT "settlement_members_settlement_id_fkey" FOREIGN KEY ("settlement_id") REFERENCES "settlements"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "settlement_members" ADD CONSTRAINT "settlement_members_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "meeting_members"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_settlement_member_id_fkey" FOREIGN KEY ("settlement_member_id") REFERENCES "settlement_members"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE UNIQUE INDEX "meeting_members_meeting_id_user_id_key"
  ON "meeting_members" ("meeting_id", "user_id")
  WHERE "user_id" IS NOT NULL;
