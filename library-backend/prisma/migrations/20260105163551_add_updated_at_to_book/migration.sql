/*
  Warnings:

  - The values [TERLAMBAT] on the enum `BorrowStatus` will be removed. If these variants are still used in the database, this will fail.
  - Added the required column `updatedAt` to the `Book` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "BorrowStatus_new" AS ENUM ('DIPINJAM', 'DIKEMBALIKAN');
ALTER TABLE "Borrowing" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "Borrowing" ALTER COLUMN "status" TYPE "BorrowStatus_new" USING ("status"::text::"BorrowStatus_new");
ALTER TYPE "BorrowStatus" RENAME TO "BorrowStatus_old";
ALTER TYPE "BorrowStatus_new" RENAME TO "BorrowStatus";
DROP TYPE "BorrowStatus_old";
ALTER TABLE "Borrowing" ALTER COLUMN "status" SET DEFAULT 'DIPINJAM';
COMMIT;

-- AlterTable
ALTER TABLE "Book" ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT NOW(),
ALTER COLUMN "stock" SET DEFAULT 0;

-- CreateIndex
CREATE INDEX "AuditLog_action_idx" ON "AuditLog"("action");

-- CreateIndex
CREATE INDEX "AuditLog_entity_idx" ON "AuditLog"("entity");

-- CreateIndex
CREATE INDEX "AuditLog_userId_idx" ON "AuditLog"("userId");

-- CreateIndex
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");

-- CreateIndex
CREATE INDEX "Book_title_idx" ON "Book"("title");

-- CreateIndex
CREATE INDEX "Book_author_idx" ON "Book"("author");

-- CreateIndex
CREATE INDEX "Book_categoryId_idx" ON "Book"("categoryId");

-- CreateIndex
CREATE INDEX "Borrowing_userId_idx" ON "Borrowing"("userId");

-- CreateIndex
CREATE INDEX "Borrowing_bookId_idx" ON "Borrowing"("bookId");

-- CreateIndex
CREATE INDEX "Borrowing_status_idx" ON "Borrowing"("status");

-- CreateIndex
CREATE INDEX "Borrowing_borrowDate_idx" ON "Borrowing"("borrowDate");

-- CreateIndex
CREATE INDEX "User_role_idx" ON "User"("role");
