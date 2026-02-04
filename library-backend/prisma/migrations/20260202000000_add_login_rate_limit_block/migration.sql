-- CreateTable
CREATE TABLE "LoginRateLimitBlock" (
    "id" SERIAL NOT NULL,
    "ip" TEXT NOT NULL,
    "strikeCount" INTEGER NOT NULL DEFAULT 0,
    "blockedUntil" TIMESTAMP(3),
    "lastHitAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LoginRateLimitBlock_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "LoginRateLimitBlock_ip_key" ON "LoginRateLimitBlock"("ip");

-- CreateIndex
CREATE INDEX "LoginRateLimitBlock_blockedUntil_idx" ON "LoginRateLimitBlock"("blockedUntil");
