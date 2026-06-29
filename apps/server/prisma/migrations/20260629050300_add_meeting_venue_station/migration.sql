-- AlterTable
ALTER TABLE "meetings" ADD COLUMN     "meeting_lat" DECIMAL(10,7),
ADD COLUMN     "meeting_lng" DECIMAL(10,7),
ADD COLUMN     "meeting_station_name" TEXT;
