/*
  Warnings:

  - You are about to alter the column `postVisitSummary` on the `appointment` table. The data in that column could be lost. The data in that column will be cast from `Text` to `Json`.

*/
-- AlterTable
ALTER TABLE `appointment` MODIFY `postVisitSummary` JSON NULL;
