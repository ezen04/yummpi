-- AlterTable
ALTER TABLE "meetings" ADD COLUMN     "series_id" UUID;

-- AddForeignKey
ALTER TABLE "meetings" ADD CONSTRAINT "meetings_series_id_fkey" FOREIGN KEY ("series_id") REFERENCES "meetings"("id") ON DELETE SET NULL ON UPDATE CASCADE;
