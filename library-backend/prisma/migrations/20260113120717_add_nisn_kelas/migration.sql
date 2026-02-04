/*
  Warnings:

  - A unique constraint covering the columns `[nisn]` on the table `User` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "User" ADD COLUMN     "kelas" TEXT,
ADD COLUMN     "nisn" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "User_nisn_key" ON "User"("nisn");

-- CreateIndex
CREATE INDEX "User_nisn_idx" ON "User"("nisn");
