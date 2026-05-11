/*
  Warnings:

  - The `variant` column on the `Event` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Changed the type of `variant` on the `ExperimentAssignment` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "ExperimentVariant" AS ENUM ('A', 'B');

-- AlterTable
ALTER TABLE "Event" DROP COLUMN "variant",
ADD COLUMN     "variant" "ExperimentVariant";

-- AlterTable
ALTER TABLE "ExperimentAssignment" DROP COLUMN "variant",
ADD COLUMN     "variant" "ExperimentVariant" NOT NULL;

-- CreateIndex
CREATE INDEX "ExperimentAssignment_variant_idx" ON "ExperimentAssignment"("variant");
