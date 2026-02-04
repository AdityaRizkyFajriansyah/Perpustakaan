const rateLimit = require("express-rate-limit");
const prisma = require("../config/prisma");
const { errorResponse } = require("../utils/response");
const { createAuditLog } = require("../services/audit.service");

const RATE_LIMIT_STRIKES = 3;
const BLOCK_DURATION_MS = 24 * 60 * 60 * 1000;
const STRIKE_RESET_MS = 24 * 60 * 60 * 1000;

const shouldResetStrike = (record, now) => {
  if (record.blockedUntil && record.blockedUntil <= now) return true;
  if (record.lastHitAt && now.getTime() - record.lastHitAt.getTime() > STRIKE_RESET_MS) return true;
  return false;
};

const recordRateLimitStrike = async (ip) => {
  if (!ip) return;
  const now = new Date();

  const existing = await prisma.loginRateLimitBlock.findUnique({ where: { ip } });
  if (!existing) {
    await prisma.loginRateLimitBlock.create({
      data: {
        ip,
        strikeCount: 1,
        lastHitAt: now,
      },
    });
    return { blocked: false };
  }

  let strikeCount = existing.strikeCount || 0;
  if (shouldResetStrike(existing, now)) {
    strikeCount = 0;
  }
  strikeCount += 1;

  const blockedUntil = strikeCount >= RATE_LIMIT_STRIKES
    ? new Date(now.getTime() + BLOCK_DURATION_MS)
    : null;

  const updated = await prisma.loginRateLimitBlock.update({
    where: { ip },
    data: {
      strikeCount,
      blockedUntil,
      lastHitAt: now,
    },
  });
  return { blocked: Boolean(blockedUntil), recordId: updated.id };
};

const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  handler: async (req, res) => {
    try {
      const result = await recordRateLimitStrike(req.ip);
      if (result?.blocked) {
        await createAuditLog({
          userId: null,
          action: "IP_RATE_LIMIT_BLOCK",
          entity: "LoginRateLimitBlock",
          entityId: result.recordId ?? null,
          ipAddress: req.ip,
        });
      }
    } catch (err) {
      console.error("RATE LIMIT STRIKE ERROR:", err);
    }
    return errorResponse(
      res,
      "Terlalu banyak percobaan login. Coba lagi 15 menit.",
      429
    );
  },
});

module.exports = loginRateLimiter;
