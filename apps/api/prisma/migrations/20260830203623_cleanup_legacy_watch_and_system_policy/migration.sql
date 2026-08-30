/*
  Warnings:

  - You are about to drop the column `intersectionTerms` on the `Watch` table. All the data in the column will be lost.
  - You are about to drop the column `matchMode` on the `Watch` table. All the data in the column will be lost.
  - You are about to drop the `PolicySnapshot` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `SystemAlert` table. If the table is not empty, all the data it contains will be lost.

*/
-- AlterTable
ALTER TABLE "Watch" DROP COLUMN "intersectionTerms",
DROP COLUMN "matchMode";

-- DropTable
DROP TABLE "PolicySnapshot";

-- DropTable
DROP TABLE "SystemAlert";
