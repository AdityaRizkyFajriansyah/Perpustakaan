const prisma = require("../config/prisma");
const { errorResponse } = require("../utils/response");

const STRIKE_RESET_MS = 24 * 60 * 60 * 1000;

const shouldResetStrike = (record, now) => {
  if (record.blockedUntil && record.blockedUntil <= now) return true;
  if (record.lastHitAt && now.getTime() - record.lastHitAt.getTime() > STRIKE_RESET_MS) return true;
  return false;
};

const ipBlockMiddleware = async (req, res, next) => {
  const ip = req.ip;
  if (!ip) return next();

  try {
    const record = await prisma.loginRateLimitBlock.findUnique({ where: { ip } });
    if (!record) return next();

    const now = new Date();
    if (record.blockedUntil && record.blockedUntil > now) {
      return errorResponse(res, "IP diblokir sementara. Coba lagi nanti.", 429);
    }

    if (record.strikeCount > 0 && shouldResetStrike(record, now)) {
      await prisma.loginRateLimitBlock.update({
        where: { ip },
        data: { strikeCount: 0, blockedUntil: null },
      });
    }

    return next();
  } catch (err) {
    return next(err);
  }
};

module.exports = ipBlockMiddleware;
