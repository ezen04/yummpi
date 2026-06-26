-- CreateEnum
CREATE TYPE "notification_category" AS ENUM ('PAYMENT', 'SETTLEMENT', 'VOTE', 'MEETING');

-- CreateTable
CREATE TABLE "notifications" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "category" "notification_category" NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "url" TEXT,
    "meeting_id" UUID,
    "read_at" TIMESTAMP(3),
    "dedupe_key" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "notifications_dedupe_key_key" ON "notifications"("dedupe_key");

-- CreateIndex
CREATE INDEX "notifications_user_id_created_at_idx" ON "notifications"("user_id", "created_at");

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_meeting_id_fkey" FOREIGN KEY ("meeting_id") REFERENCES "meetings"("id") ON DELETE SET NULL ON UPDATE CASCADE;
