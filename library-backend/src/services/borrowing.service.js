const prisma = require("../config/prisma");
const { createAuditLog } = require("./audit.service");
const { BOOK_SELECT } = require("./book.service");
const { promoteReservationToReady } = require("./reservation.service");
const { notifyReservationReady } = require("./notification.service");

const MAX_ACTIVE_BORROW = 2;
const LATE_FEE_PER_DAY = Number(process.env.LATE_FEE_PER_DAY || 1000);

const borrowBookService = async (userId, bookId) => {
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

  if (book.format !== "DIGITAL" && book.stock < 1) {
    const err = new Error("Buku tidak tersedia");
    err.status = 400;
    throw err;
  }

  if (book.format === "DIGITAL" && !book.filePath) {
    const err = new Error("File buku digital tidak ditemukan");
    err.status = 400;
    throw err;
  }

  const existing = await prisma.borrowing.findFirst({
    where: { userId, bookId: parsedBookId, status: "DIPINJAM" },
  });

  if (existing) {
    const err = new Error("Anda sudah meminjam buku ini");
    err.status = 400;
    throw err;
  }

  const activeCount = await prisma.borrowing.count({
    where: { userId, status: "DIPINJAM" },
  });

  if (activeCount >= MAX_ACTIVE_BORROW) {
    const err = new Error("Maksimal meminjam 2 buku dalam waktu yang sama");
    err.status = 400;
    throw err;
  }

  let reservationToFulfill = null;
  if (book.format === "PHYSICAL") {
    const reservation = await prisma.reservation.findFirst({
      where: { bookId: parsedBookId, status: { in: ["ACTIVE", "READY"] } },
      orderBy: { createdAt: "asc" },
    });

    if (reservation) {
      if (reservation.status === "READY" && reservation.expiresAt && reservation.expiresAt < new Date()) {
        await prisma.reservation.update({
          where: { id: reservation.id },
          data: { status: "EXPIRED" },
        });
      } else if (reservation.userId !== userId) {
        const err = new Error("Buku sedang diantri. Anda tidak berada di urutan pertama.");
        err.status = 400;
        throw err;
      } else {
        reservationToFulfill = reservation;
      }
    }
  }

  const borrowing = await prisma.$transaction(async (tx) => {
    const result = await tx.borrowing.create({
      data: {
        userId,
        bookId: parsedBookId,
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    if (book.format !== "DIGITAL") {
      await tx.book.update({
        where: { id: parsedBookId },
        data: { stock: { decrement: 1 } },
      });
    }

    if (reservationToFulfill) {
      await tx.reservation.update({
        where: { id: reservationToFulfill.id },
        data: { status: "FULFILLED", fulfilledAt: new Date() },
      });
    }

    return result;
  });

  await createAuditLog({
    userId,
    action: "BORROW_BOOK",
    entity: "Book",
    entityId: parsedBookId,
  });

  return borrowing;
};

const parseDateValue = (value, label) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    const err = new Error(`${label} tidak valid`);
    err.status = 400;
    throw err;
  }
  return date;
};

const getBorrowingsService = async (user, query) => {
  let { page = 1, limit = 10, status, from, to } = query;

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
    if (!["DIPINJAM", "DIKEMBALIKAN"].includes(status)) {
      const err = new Error("Status tidak valid");
      err.status = 400;
      throw err;
    }
    where.status = status;
  }

  if (from || to) {
    where.borrowDate = {};
    if (from) where.borrowDate.gte = parseDateValue(from, "Tanggal awal");
    if (to) where.borrowDate.lte = parseDateValue(to, "Tanggal akhir");
  }

  const [data, total] = await Promise.all([
    prisma.borrowing.findMany({
      where,
      include: user.role === "ADMIN"
        ? { book: { select: BOOK_SELECT }, user: true }
        : { book: { select: BOOK_SELECT } },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { borrowDate: "desc" },
    }),
    prisma.borrowing.count({ where }),
  ]);

  return {
    data,
    meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
};

const returnBookService = async (borrowingId, actor) => {
  if (Number.isNaN(borrowingId)) {
    const err = new Error("Borrowing ID tidak valid");
    err.status = 400;
    throw err;
  }

  if (actor && actor.role === "STUDENT") {
    const user = await prisma.user.findUnique({
      where: { id: actor.id },
      select: { id: true },
    });

    if (!user) {
      const err = new Error("Akun tidak ditemukan");
      err.status = 404;
      throw err;
    }
  }

  const borrowing = await prisma.borrowing.findUnique({
    where: { id: borrowingId },
    include: { book: { select: { format: true } } },
  });
  if (!borrowing) {
    const err = new Error("Data peminjaman tidak ditemukan");
    err.status = 404;
    throw err;
  }

  if (actor && actor.role !== "ADMIN" && borrowing.userId !== actor.id) {
    const err = new Error("Forbidden");
    err.status = 403;
    throw err;
  }

  if (borrowing.status === "DIKEMBALIKAN") {
    const err = new Error("Buku sudah dikembalikan");
    err.status = 400;
    throw err;
  }

  const returnAt = new Date();
  const lateMs = Math.max(0, returnAt.getTime() - borrowing.dueDate.getTime());
  const lateDays = lateMs > 0 ? Math.ceil(lateMs / (24 * 60 * 60 * 1000)) : 0;
  const lateFee = lateDays * LATE_FEE_PER_DAY;

  await prisma.$transaction(async (tx) => {
    await tx.borrowing.update({
      where: { id: borrowing.id },
      data: { status: "DIKEMBALIKAN", returnDate: returnAt, lateDays, lateFee },
    });

    if (borrowing.book?.format !== "DIGITAL") {
      await tx.book.update({
        where: { id: borrowing.bookId },
        data: { stock: { increment: 1 } },
      });
    }
  });

  const auditUserId = actor?.id ?? borrowing.userId;
  await createAuditLog({
    userId: auditUserId,
    action: "RETURN_BOOK",
    entity: "Book",
    entityId: borrowing.bookId,
  });

  if (borrowing.book?.format !== "DIGITAL") {
    const readyReservation = await promoteReservationToReady(borrowing.bookId);
    await notifyReservationReady(readyReservation);
  }

  return true;
};

module.exports = { borrowBookService, getBorrowingsService, returnBookService };
