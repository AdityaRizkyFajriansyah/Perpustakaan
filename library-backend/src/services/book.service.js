const fs = require("fs");
const path = require("path");
const prisma = require("../config/prisma");
const { createAuditLog } = require("./audit.service");

const MAX_DESCRIPTION_LENGTH = 2000;

const BOOK_SELECT = {
  id: true,
  title: true,
  author: true,
  isbn: true,
  year: true,
  description: true,
  stock: true,
  format: true,
  categoryId: true,
  category: true,
  coverPath: true,
  coverName: true,
  coverSize: true,
  coverMimeType: true,
  createdAt: true,
  updatedAt: true,
};

const getBooksService = async (query) => {
  let { page = 1, limit = 10, q, sort, categoryId } = query;

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

  if (q) {
    where.OR = [
      { title: { contains: q, mode: "insensitive" } },
      { author: { contains: q, mode: "insensitive" } },
    ];
  }

  if (categoryId !== undefined) {
    const parsed = Number(categoryId);
    if (Number.isNaN(parsed)) {
      const err = new Error("Category ID tidak valid");
      err.status = 400;
      throw err;
    }
    where.categoryId = parsed;
  }

  const orderBy = sort === "oldest" ? { createdAt: "asc" } : { createdAt: "desc" };

  const [data, total] = await Promise.all([
    prisma.book.findMany({
      where,
      select: BOOK_SELECT,
      skip: (page - 1) * limit,
      take: limit,
      orderBy,
    }),
    prisma.book.count({ where }),
  ]);

  return {
    data,
    meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
};

const validateDescription = (description) => {
  if (description && description.length > MAX_DESCRIPTION_LENGTH) {
    const err = new Error("Deskripsi terlalu panjang");
    err.status = 400;
    throw err;
  }
  return description || null;
};

const createBookService = async (payload) => {
  const { title, author, isbn, year, stock, categoryId, userId, description, cover } = payload;

  if (!title || !author || !isbn) {
    const err = new Error("Judul, penulis, dan ISBN wajib diisi");
    err.status = 400;
    throw err;
  }

  if (typeof year !== "number" || Number.isNaN(year)) {
    const err = new Error("Tahun terbit wajib diisi");
    err.status = 400;
    throw err;
  }

  const category = await prisma.category.findUnique({
    where: { id: categoryId },
  });

  if (!category) {
    const err = new Error("Kategori tidak ditemukan");
    err.status = 400;
    throw err;
  }

  if (typeof stock !== "number" || Number.isNaN(stock) || stock < 0) {
    const err = new Error("Stock tidak valid");
    err.status = 400;
    throw err;
  }

  const cleanedDescription = validateDescription(
    typeof description === "string" && description.trim() ? description.trim() : null
  );

  const data = {
    title,
    author,
    isbn,
    year,
    stock,
    categoryId,
    format: "PHYSICAL",
    description: cleanedDescription,
  };

  if (cover) {
    data.coverPath = cover.coverPath;
    data.coverName = cover.coverName;
    data.coverSize = cover.coverSize;
    data.coverMimeType = cover.coverMimeType;
  }

  const book = await prisma.book.create({ data });

  try {
    await createAuditLog({
      userId,
      action: "CREATE_BOOK",
      entity: "Book",
      entityId: book.id,
    });
  } catch (err) {
    console.error("AUDIT LOG ERROR:", err);
  }

  return book;
};

const UPLOAD_ROOT = path.resolve(process.cwd(), "uploads", "ebooks");
const COVER_ROOT = path.resolve(process.cwd(), "uploads", "covers");

const isPathInside = (base, target) => {
  const normalizedBase = base.toLowerCase();
  const normalizedTarget = target.toLowerCase();
  const basePrefix = normalizedBase.endsWith(path.sep)
    ? normalizedBase
    : `${normalizedBase}${path.sep}`;
  return normalizedTarget.startsWith(basePrefix);
};

const createDigitalBookService = async (payload) => {
  const { title, author, isbn, year, categoryId, userId, file, description, cover } = payload;

  if (!title || !author || !isbn) {
    const err = new Error("Judul, penulis, dan ISBN wajib diisi");
    err.status = 400;
    throw err;
  }

  if (!file) {
    const err = new Error("File PDF wajib diupload");
    err.status = 400;
    throw err;
  }

  if (typeof year !== "number" || Number.isNaN(year)) {
    const err = new Error("Tahun terbit wajib diisi");
    err.status = 400;
    throw err;
  }

  const category = await prisma.category.findUnique({
    where: { id: categoryId },
  });

  if (!category) {
    const err = new Error("Kategori tidak ditemukan");
    err.status = 400;
    throw err;
  }

  const cleanedDescription = validateDescription(
    typeof description === "string" && description.trim() ? description.trim() : null
  );

  const data = {
    title,
    author,
    isbn,
    year,
    stock: 0,
    categoryId,
    format: "DIGITAL",
    filePath: file.filePath,
    fileName: file.originalname,
    fileSize: file.size,
    mimeType: file.mimetype,
    description: cleanedDescription,
  };

  if (cover) {
    data.coverPath = cover.coverPath;
    data.coverName = cover.coverName;
    data.coverSize = cover.coverSize;
    data.coverMimeType = cover.coverMimeType;
  }

  const book = await prisma.book.create({ data });

  try {
    await createAuditLog({
      userId,
      action: "CREATE_DIGITAL_BOOK",
      entity: "Book",
      entityId: book.id,
    });
  } catch (err) {
    console.error("AUDIT LOG ERROR:", err);
  }

  return book;
};

const getDigitalPreviewService = async (userId, bookId) => {
  if (Number.isNaN(bookId)) {
    const err = new Error("Book ID tidak valid");
    err.status = 400;
    throw err;
  }

  const book = await prisma.book.findUnique({
    where: { id: bookId },
    select: {
      id: true,
      format: true,
      filePath: true,
      fileName: true,
      mimeType: true,
    },
  });

  if (!book || book.format !== "DIGITAL" || !book.filePath) {
    const err = new Error("Buku digital tidak ditemukan");
    err.status = 404;
    throw err;
  }

  const borrowing = await prisma.borrowing.findFirst({
    where: { userId, bookId, status: "DIPINJAM" },
    select: { id: true, dueDate: true },
  });

  if (!borrowing) {
    const err = new Error("Anda belum meminjam buku ini");
    err.status = 403;
    throw err;
  }

  if (borrowing.dueDate && borrowing.dueDate < new Date()) {
    const err = new Error("Masa pinjam buku digital sudah berakhir");
    err.status = 403;
    throw err;
  }

  const absolutePath = path.resolve(process.cwd(), book.filePath);
  if (!isPathInside(UPLOAD_ROOT, absolutePath)) {
    const err = new Error("Lokasi file tidak valid");
    err.status = 400;
    throw err;
  }

  if (!fs.existsSync(absolutePath)) {
    const err = new Error("File buku digital tidak ditemukan");
    err.status = 404;
    throw err;
  }

  return {
    absolutePath,
    fileName: book.fileName || `ebook-${book.id}.pdf`,
    mimeType: book.mimeType || "application/pdf",
  };
};

const getBookByIdService = async (bookId) => {
  if (Number.isNaN(bookId)) {
    const err = new Error("Book ID tidak valid");
    err.status = 400;
    throw err;
  }

  const book = await prisma.book.findUnique({
    where: { id: bookId },
    select: BOOK_SELECT,
  });
  if (!book) {
    const err = new Error("Buku tidak ditemukan");
    err.status = 404;
    throw err;
  }
  return book;
};

const deleteBookService = async (bookId, userId) => {
  if (Number.isNaN(bookId)) {
    const err = new Error("Book ID tidak valid");
    err.status = 400;
    throw err;
  }

  const book = await prisma.book.findUnique({
    where: { id: bookId },
    select: { id: true, format: true, filePath: true, coverPath: true },
  });

  if (!book) {
    const err = new Error("Buku tidak ditemukan");
    err.status = 404;
    throw err;
  }

  const activeBorrowCount = await prisma.borrowing.count({
    where: { bookId, status: "DIPINJAM" },
  });
  if (activeBorrowCount > 0) {
    const err = new Error("Buku sedang dipinjam. Kembalikan dulu sebelum dihapus");
    err.status = 400;
    throw err;
  }

  await prisma.$transaction(async (tx) => {
    await tx.borrowing.deleteMany({ where: { bookId } });
    await tx.reservation.deleteMany({ where: { bookId } });
    await tx.book.delete({ where: { id: bookId } });
  });

  if (book.format === "DIGITAL" && book.filePath) {
    const absolutePath = path.resolve(process.cwd(), book.filePath);

    if (!isPathInside(UPLOAD_ROOT, absolutePath)) {
      const err = new Error("Lokasi file tidak valid");
      err.status = 400;
      throw err;
    }

    try {
      if (fs.existsSync(absolutePath)) {
        fs.unlinkSync(absolutePath);
      }
    } catch {
      // Ignore file deletion failures; DB already cleaned up.
    }
  }

  if (book.coverPath) {
    const absoluteCover = path.resolve(COVER_ROOT, book.coverPath);

    if (!isPathInside(COVER_ROOT, absoluteCover)) {
      const err = new Error("Lokasi file tidak valid");
      err.status = 400;
      throw err;
    }

    try {
      if (fs.existsSync(absoluteCover)) {
        fs.unlinkSync(absoluteCover);
      }
    } catch {
      // Ignore file deletion failures; DB already cleaned up.
    }
  }

  try {
    await createAuditLog({
      userId,
      action: "DELETE_BOOK",
      entity: "Book",
      entityId: bookId,
    });
  } catch (err) {
    console.error("AUDIT LOG ERROR:", err);
  }

  return true;
};

const updateBookService = async (bookId, payload) => {
  if (Number.isNaN(bookId)) {
    const err = new Error("Book ID tidak valid");
    err.status = 400;
    throw err;
  }

  const existing = await prisma.book.findUnique({
    where: { id: bookId },
    select: { id: true, format: true, coverPath: true },
  });
  if (!existing) {
    const err = new Error("Buku tidak ditemukan");
    err.status = 404;
    throw err;
  }

  const {
    title,
    author,
    isbn,
    year,
    stock,
    categoryId,
    description,
    cover,
    userId,
  } = payload;

  const data = {};

  if (title !== undefined) {
    const trimmed = String(title).trim();
    if (!trimmed) {
      const err = new Error("Judul wajib diisi");
      err.status = 400;
      throw err;
    }
    data.title = trimmed;
  }

  if (author !== undefined) {
    const trimmed = String(author).trim();
    if (!trimmed) {
      const err = new Error("Penulis wajib diisi");
      err.status = 400;
      throw err;
    }
    data.author = trimmed;
  }

  if (isbn !== undefined) {
    const trimmed = String(isbn).trim();
    if (!trimmed) {
      const err = new Error("ISBN wajib diisi");
      err.status = 400;
      throw err;
    }
    data.isbn = trimmed;
  }

  if (year !== undefined) {
    const parsedYear = Number(year);
    if (Number.isNaN(parsedYear)) {
      const err = new Error("Tahun terbit tidak valid");
      err.status = 400;
      throw err;
    }
    data.year = parsedYear;
  }

  if (categoryId !== undefined) {
    const parsedCategoryId = Number(categoryId);
    if (Number.isNaN(parsedCategoryId)) {
      const err = new Error("Category ID tidak valid");
      err.status = 400;
      throw err;
    }
    const category = await prisma.category.findUnique({
      where: { id: parsedCategoryId },
    });
    if (!category) {
      const err = new Error("Kategori tidak ditemukan");
      err.status = 400;
      throw err;
    }
    data.categoryId = parsedCategoryId;
  }

  if (description !== undefined) {
    const cleanedDescription = validateDescription(
      typeof description === "string" && description.trim() ? description.trim() : null
    );
    data.description = cleanedDescription;
  }

  if (stock !== undefined) {
    if (existing.format === "DIGITAL") {
      const err = new Error("Stock tidak berlaku untuk buku digital");
      err.status = 400;
      throw err;
    }
    const parsedStock = Number(stock);
    if (Number.isNaN(parsedStock) || parsedStock < 0) {
      const err = new Error("Stock tidak valid");
      err.status = 400;
      throw err;
    }
    data.stock = parsedStock;
  }

  let removeCoverPath = null;
  if (cover) {
    data.coverPath = cover.coverPath;
    data.coverName = cover.coverName;
    data.coverSize = cover.coverSize;
    data.coverMimeType = cover.coverMimeType;
    removeCoverPath = existing.coverPath || null;
  }

  const updated = await prisma.book.update({
    where: { id: bookId },
    data,
  });

  try {
    await createAuditLog({
      userId,
      action: "UPDATE_BOOK",
      entity: "Book",
      entityId: bookId,
    });
  } catch (err) {
    console.error("AUDIT LOG ERROR:", err);
  }

  return { updated, removeCoverPath };
};

module.exports = {
  getBooksService,
  getBookByIdService,
  createBookService,
  createDigitalBookService,
  getDigitalPreviewService,
  deleteBookService,
  updateBookService,
  BOOK_SELECT,
};
