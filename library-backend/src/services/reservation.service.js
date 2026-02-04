const prisma = require("../config/prisma");
const { createAuditLog } = require("./audit.service");

const RESERVATION_HOLD_HOURS = Number(process.env.RESERVATION_HOLD_HOURS || 48);

const createReservationService = async (userId, bookId) => {
  const parsedBookId = Number(bookId);
  if (Number.isNaN(parsedBookId)) {
    const err = new Error("Book ID tidak valid");
    err.status = 400;
    throw err;
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { accountStatus: true },
  });
  if (!user || user.accountStatus === "INACTIVE") {
    const err = new Error("Akun sudah nonaktif");
    err.status = 403;
    throw err;
  }
  if (user.accountStatus === "RETURN_ONLY") {
    const err = new Error("Akun hanya boleh mengembalikan buku");
    err.status = 403;
    throw err;
  }

  const book = await prisma.book.findUnique({ where: { id: parsedBookId } });
  if (!book) {
    const err = new Error("Buku tidak ditemukan");
    err.status = 404;
    throw err;
  }
  if (book.format !== "PHYSICAL") {
    const err = new Error("Reservasi hanya untuk buku fisik");
    err.status = 400;
    throw err;
  }
  if (book.stock > 0) {
    const err = new Error("Buku masih tersedia, tidak perlu reservasi");
    err.status = 400;
    throw err;
  }

  const existing = await prisma.reservation.findFirst({
    where: {
      userId,
      bookId: parsedBookId,
      status: { in: ["ACTIVE", "READY"] },
    },
  });
  if (existing) {
    const err = new Error("Anda sudah memiliki reservasi untuk buku ini");
    err.status = 400;
    throw err;
  }

  const reservation = await prisma.reservation.create({
    data: { userId, bookId: parsedBookId },
  });

  await createAuditLog({
    userId,
    action: "CREATE_RESERVATION",
    entity: "Reservation",
    entityId: reservation.id,
  });

  return reservation;
};

const listReservationsService = async (user, query) => {
  let { page = 1, limit = 10, status, q } = query;

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
  if (user.role !== "ADMIN") where.userId = user.id;

  if (status) {
    const allowed = ["ACTIVE", "READY", "FULFILLED", "CANCELLED", "EXPIRED"];
    if (!allowed.includes(status)) {
      const err = new Error("Status tidak valid");
      err.status = 400;
      throw err;
    }
    where.status = status;
  }

  if (q) {
    where.OR = [
      { book: { title: { contains: q, mode: "insensitive" } } },
      { user: { name: { contains: q, mode: "insensitive" } } },
    ];
  }

  const [data, total] = await Promise.all([
    prisma.reservation.findMany({
      where,
      include: { book: true, user: user.role === "ADMIN" },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: "desc" },
    }),
    prisma.reservation.count({ where }),
  ]);

  return {
    data,
    meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
};

const cancelReservationService = async (reservationId, actor) => {
  const id = Number(reservationId);
  if (Number.isNaN(id)) {
    const err = new Error("Reservation ID tidak valid");
    err.status = 400;
    throw err;
  }

  const reservation = await prisma.reservation.findUnique({ where: { id } });
  if (!reservation) {
    const err = new Error("Reservasi tidak ditemukan");
    err.status = 404;
    throw err;
  }

  if (actor.role !== "ADMIN" && reservation.userId !== actor.id) {
    const err = new Error("Forbidden");
    err.status = 403;
    throw err;
  }

  if (["CANCELLED", "FULFILLED", "EXPIRED"].includes(reservation.status)) {
    return reservation;
  }

  const updated = await prisma.reservation.update({
    where: { id },
    data: { status: "CANCELLED", cancelledAt: new Date() },
  });

  await createAuditLog({
    userId: actor.id,
    action: "CANCEL_RESERVATION",
    entity: "Reservation",
    entityId: updated.id,
  });

  return updated;
};

const fulfillReservationIfFirst = async (userId, bookId) => {
  const reservation = await prisma.reservation.findFirst({
    where: { bookId, status: { in: ["ACTIVE", "READY"] } },
    orderBy: { createdAt: "asc" },
  });

  if (!reservation) return null;

  if (reservation.status === "READY" && reservation.expiresAt && reservation.expiresAt < new Date()) {
    await prisma.reservation.update({
      where: { id: reservation.id },
      data: { status: "EXPIRED" },
    });
    return null;
  }

  if (reservation.userId !== userId) {
    const err = new Error("Buku sedang diantri. Anda tidak berada di urutan pertama.");
    err.status = 400;
    throw err;
  }

  return prisma.reservation.update({
    where: { id: reservation.id },
    data: { status: "FULFILLED", fulfilledAt: new Date() },
  });
};

const promoteReservationToReady = async (bookId) => {
  const nextReservation = await prisma.reservation.findFirst({
    where: { bookId, status: "ACTIVE" },
    orderBy: { createdAt: "asc" },
  });

  if (!nextReservation) return null;

  const now = new Date();
  const expiresAt = new Date(now.getTime() + RESERVATION_HOLD_HOURS * 60 * 60 * 1000);

  return prisma.reservation.update({
    where: { id: nextReservation.id },
    data: { status: "READY", readyAt: now, expiresAt },
  });
};

const expireAndPromoteReservationsService = async () => {
  const now = new Date();
  const expired = await prisma.reservation.findMany({
    where: { status: "READY", expiresAt: { lt: now } },
  });

  for (const item of expired) {
    await prisma.reservation.update({
      where: { id: item.id },
      data: { status: "EXPIRED" },
    });
    await promoteReservationToReady(item.bookId);
  }

  return { expiredCount: expired.length };
};

module.exports = {
  createReservationService,
  listReservationsService,
  cancelReservationService,
  fulfillReservationIfFirst,
  promoteReservationToReady,
  expireAndPromoteReservationsService,
};
