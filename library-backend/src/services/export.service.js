const prisma = require("../config/prisma");

const getBooksExport = async () => {
  const books = await prisma.book.findMany({
    include: { category: true },
    orderBy: { createdAt: "desc" },
  });

  return books.map((book) => ({
    id: book.id,
    title: book.title,
    author: book.author,
    isbn: book.isbn,
    year: book.year,
    description: book.description || "",
    format: book.format,
    stock: book.stock,
    category: book.category?.name || "",
    createdAt: book.createdAt,
  }));
};

const parseDate = (value, label) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    const err = new Error(`${label} tidak valid`);
    err.status = 400;
    throw err;
  }
  return date;
};

const getBorrowingsExport = async (query) => {
  const { from, to } = query;
  const where = {};

  if (from || to) {
    where.borrowDate = {};
    if (from) where.borrowDate.gte = parseDate(from, "Tanggal awal");
    if (to) where.borrowDate.lte = parseDate(to, "Tanggal akhir");
  }

  const borrowings = await prisma.borrowing.findMany({
    where,
    include: { book: true, user: true },
    orderBy: { borrowDate: "desc" },
  });

  return borrowings.map((b) => ({
    id: b.id,
    bookTitle: b.book?.title || "",
    userName: b.user?.name || "",
    userEmail: b.user?.email || "",
    status: b.status,
    borrowDate: b.borrowDate,
    dueDate: b.dueDate,
    returnDate: b.returnDate,
    lateDays: b.lateDays,
    lateFee: b.lateFee,
  }));
};

const getStudentsExport = async () => {
  const students = await prisma.user.findMany({
    where: { role: "STUDENT" },
    orderBy: { createdAt: "desc" },
  });

  return students.map((s) => ({
    id: s.id,
    name: s.name,
    email: s.email,
    nisn: s.nisn || "",
    kelas: s.kelas || "",
    accountStatus: s.accountStatus,
    statusReason: s.statusReason || "",
    createdAt: s.createdAt,
  }));
};

const getAuditLogsExport = async () => {
  const logs = await prisma.auditLog.findMany({
    include: { user: true },
    orderBy: { createdAt: "desc" },
  });

  return logs.map((l) => ({
    id: l.id,
    action: l.action,
    entity: l.entity,
    entityId: l.entityId ?? "",
    userId: l.userId ?? "",
    userName: l.user?.name || "",
    userEmail: l.user?.email || "",
    ipAddress: l.ipAddress || "",
    createdAt: l.createdAt,
  }));
};

module.exports = {
  getBooksExport,
  getBorrowingsExport,
  getStudentsExport,
  getAuditLogsExport,
};
