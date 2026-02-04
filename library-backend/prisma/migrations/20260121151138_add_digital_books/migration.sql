-- CreateEnum
CREATE TYPE "BookFormat" AS ENUM ('PHYSICAL', 'DIGITAL');

-- AlterTable
ALTER TABLE "Book" ADD COLUMN     "fileName" TEXT,
ADD COLUMN     "filePath" TEXT,
ADD COLUMN     "fileSize" INTEGER,
ADD COLUMN     "format" "BookFormat" NOT NULL DEFAULT 'PHYSICAL',
ADD COLUMN     "mimeType" TEXT;

-- CreateIndex
CREATE INDEX "Book_format_idx" ON "Book"("format");
