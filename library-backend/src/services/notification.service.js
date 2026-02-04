const prisma = require("../config/prisma");

const DUE_SOON_DAYS = Number(process.env.DUE_SOON_DAYS || 2);

const createNotification = async ({
  userId,
  title,
  message,
  type,
  entity,
  entityId,
  skipIfExists = true,
}) => {
  if (skipIfExists && entity && entityId) {
    const existing = await prisma.notification.findFirst({
      where: { userId, type, entity, entityId },
    });
    if (existing) return existing;
  }

  return prisma.notification.create({
    data: { userId, title, message, type, entity, entityId },
  });
};

const listNotificationsService = async (user, query) => {
  let { page = 1, limit = 10, status, userId } = query;

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
  if (user.role === "ADMIN" && userId) {
    where.userId = Number(userId);
  } else {
    where.userId = user.id;
  }

  if (status) {
    if (!["READ", "UNREAD"].includes(status)) {
      const err = new Error("Status tidak valid");
      err.status = 400;
      throw err;
    }
    where.status = status;
  }

  const [data, total] = await Promise.all([
    prisma.notification.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.notification.count({ where }),
  ]);

  return {
    data,
    meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
};

const markNotificationReadService = async (notificationId, actor) => {
  const id = Number(notificationId);
  if (Number.isNaN(id)) {
    const err = new Error("Notification ID tidak valid");
    err.status = 400;
    throw err;
  }

  const notification = await prisma.notification.findUnique({ where: { id } });
  if (!notification) {
    const err = new Error("Notifikasi tidak ditemukan");
    err.status = 404;
    throw err;
  }

  if (actor.role !== "ADMIN" && notification.userId !== actor.id) {
    const err = new Error("Forbidden");
    err.status = 403;
    throw err;
  }

  if (notification.status === "READ") return notification;

  return prisma.notification.update({
    where: { id },
    data: { status: "READ", readAt: new Date() },
  });
};

const createDueSoonNotificationsService = async () => {
  const now = new Date();
  const dueSoon = new Date(now.getTime() + DUE_SOON_DAYS * 24 * 60 * 60 * 1000);

  const borrowings = await prisma.borrowing.findMany({
    where: {
      status: "DIPINJAM",
      dueDate: { gte: now, lte: dueSoon },
    },
    select: { id: true, userId: true, dueDate: true },
  });

  for (const b of borrowings) {
    await createNotification({
      userId: b.userId,
      title: "Batas pengembalian mendekat",
      message: `Buku yang kamu pinjam jatuh tempo pada ${b.dueDate.toLocaleDateString()}.`,
      type: "DUE_SOON",
      entity: "Borrowing",
      entityId: b.id,
    });
  }
};

const createOverdueNotificationsService = async () => {
  const now = new Date();
  const borrowings = await prisma.borrowing.findMany({
    where: {
      status: "DIPINJAM",
      dueDate: { lt: now },
    },
    select: { id: true, userId: true, dueDate: true },
  });

  for (const b of borrowings) {
    await createNotification({
      userId: b.userId,
      title: "Buku terlambat dikembalikan",
      message: `Pengembalian sudah lewat dari ${b.dueDate.toLocaleDateString()}.`,
      type: "OVERDUE",
      entity: "Borrowing",
      entityId: b.id,
    });
  }
};

const notifyReservationReady = async (reservation) => {
  if (!reservation) return null;
  return createNotification({
    userId: reservation.userId,
    title: "Reservasi tersedia",
    message: "Buku yang kamu reservasi sudah tersedia. Segera pinjam sebelum batas waktu berakhir.",
    type: "RESERVATION_READY",
    entity: "Reservation",
    entityId: reservation.id,
  });
};

module.exports = {
  createNotification,
  listNotificationsService,
  markNotificationReadService,
  createDueSoonNotificationsService,
  createOverdueNotificationsService,
  notifyReservationReady,
};
