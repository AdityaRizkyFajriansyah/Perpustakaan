const prisma = require("../config/prisma");

const createAuditLog = async ({
  userId = null,
  action,
  entity,
  entityId = null,
  ipAddress = null,
}) => {
  return prisma.auditLog.create({
    data: { userId, action, entity, entityId, ipAddress },
  });
};

const getAuditLogsService = async (query) => {
  let { page = 1, limit = 10, action, entity, userId } = query;

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
  if (action) where.action = action;
  if (entity) where.entity = entity;
  if (userId) where.userId = Number(userId);

  const [data, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      include: {
        user: { select: { id: true, name: true, email: true, role: true } },
      },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: "desc" },
    }),
    prisma.auditLog.count({ where }),
  ]);

  return {
    data,
    meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
};

module.exports = { createAuditLog, getAuditLogsService };
