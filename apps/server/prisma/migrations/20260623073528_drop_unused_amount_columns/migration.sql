/*
  Warnings:

  - You are about to drop the column `discount_amount` on the `receipts` table. All the data in the column will be lost.
  - You are about to drop the column `service_charge_amount` on the `receipts` table. All the data in the column will be lost.
  - You are about to drop the column `subtotal_amount` on the `receipts` table. All the data in the column will be lost.
  - You are about to drop the column `tax_amount` on the `receipts` table. All the data in the column will be lost.
  - You are about to drop the column `discount_amount` on the `settlement_members` table. All the data in the column will be lost.
  - You are about to drop the column `service_charge_amount` on the `settlement_members` table. All the data in the column will be lost.
  - You are about to drop the column `tax_amount` on the `settlement_members` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "receipts" DROP COLUMN "discount_amount",
DROP COLUMN "service_charge_amount",
DROP COLUMN "subtotal_amount",
DROP COLUMN "tax_amount";

-- AlterTable
ALTER TABLE "settlement_members" DROP COLUMN "discount_amount",
DROP COLUMN "service_charge_amount",
DROP COLUMN "tax_amount";
