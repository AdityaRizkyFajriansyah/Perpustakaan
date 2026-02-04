const prisma = require("../config/prisma");
const { createAuditLog } = require("./audit.service");

const STRIKE_RESET_MS = 24 * 60 * 60 * 1000;

const listIpBlocksService = async (query) => {
  let { page = 1, limit = 10, status = "blocked", q } = query;

  page = Number(page);
  limit = Number(limit);

  if (Number.isNaN(page) || page < 1) {
    const err = new Error("Page tidak valid");
    err.status = 400;
    throw err;
  }
  if (Number.isNaN(limit) || limit < 1 || limit > 50) {
    const err = new Error("Limit tidak valid (1-50)");
    err.status = 400;
    throw err;
  }

  const where = {};
  const now = new Date();

  if (status && status !== "all") {
    if (status !== "blocked") {
      const err = new Error("Status tidak valid");
      err.status = 400;
      throw err;
    }
    where.blockedUntil = { gt: now };
  }

  if (q) {
    where.ip = { contains: String(q).trim(), mode: "insensitive" };
  }

  const [data, total] = await Promise.all([
    prisma.loginRateLimitBlock.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { lastHitAt: "desc" },
    }),
    prisma.loginRateLimitBlock.count({ where }),
  ]);

  return {
    data,
    meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
};

const clearIpBlockService = async (ip, actorId) => {
  const existing = await prisma.loginRateLimitBlock.findUnique({ where: { ip } });
  if (!existing) {
    const err = new Error("IP tidak ditemukan");
    err.status = 404;
    throw err;
  }

  await prisma.loginRateLimitBlock.delete({ where: { ip } });

  try {
    await createAuditLog({
      userId: actorId,
      action: "CLEAR_IP_BLOCK",
      entity: "LoginRateLimitBlock",
      entityId: existing.id,
      ipAddress: ip,
    });
  } catch (err) {
    console.error("AUDIT LOG ERROR:", err);
  }

  return existing;
};

const cleanupIpBlocksService = async (now = new Date()) => {
  const staleStrikeDate = new Date(now.getTime() - STRIKE_RESET_MS);

  const [expiredBlocks, staleStrikes] = await Promise.all([
    prisma.loginRateLimitBlock.deleteMany({
      where: { blockedUntil: { lte: now } },
    }),
    prisma.loginRateLimitBlock.deleteMany({
      where: {
        blockedUntil: null,
        lastHitAt: { lte: staleStrikeDate },
      },
    }),
  ]);

  return { deletedExpiredBlocks: expiredBlocks.count, deletedStaleStrikes: staleStrikes.count };
};

module.exports = { listIpBlocksService, clearIpBlockService, cleanupIpBlocksService };
