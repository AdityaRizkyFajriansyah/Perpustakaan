const fs = require("fs");
const path = require("path");
const {
  getBooksService,
  getBookByIdService,
  createBookService,
  createDigitalBookService,
  getDigitalPreviewService,
  deleteBookService,
  updateBookService,
} = require("../services/book.service");
const { successResponse } = require("../utils/response");

const MAX_COVER_BYTES = 5 * 1024 * 1024;
const MAX_DESCRIPTION_LENGTH = 2000;
const COVER_ROOT = path.resolve(process.cwd(), "uploads", "covers");

const cleanupFile = (file) => {
  if (!file?.path) return;
  try {
    if (fs.existsSync(file.path)) {
      fs.unlinkSync(file.path);
    }
  } catch {
    // Ignore cleanup failures.
  }
};

const cleanupFiles = (files) => {
  files.filter(Boolean).forEach(cleanupFile);
};

const buildCoverPayload = (file) => {
  if (!file) return null;
  return {
    coverPath: file.filename,
    coverName: file.originalname,
    coverSize: file.size,
    coverMimeType: file.mimetype,
  };
};

const isPdfSignature = (filePath) => {
  try {
    const fd = fs.openSync(filePath, "r");
    const buffer = Buffer.alloc(5);
    const bytesRead = fs.readSync(fd, buffer, 0, 5, 0);
    fs.closeSync(fd);
    if (bytesRead < 5) return false;
    return buffer.toString("utf8") === "%PDF-";
  } catch {
    return false;
  }
};

const isPathInside = (base, target) => {
  const normalizedBase = base.toLowerCase();
  const normalizedTarget = target.toLowerCase();
  const basePrefix = normalizedBase.endsWith(path.sep)
    ? normalizedBase
    : `${normalizedBase}${path.sep}`;
  return normalizedTarget.startsWith(basePrefix);
};

const deleteCoverPath = (coverPath) => {
  if (!coverPath) return;
  const absoluteCover = path.resolve(COVER_ROOT, coverPath);
  if (!isPathInside(COVER_ROOT, absoluteCover)) return;
  try {
    if (fs.existsSync(absoluteCover)) {
      fs.unlinkSync(absoluteCover);
    }
  } catch {
    // Ignore file deletion failures.
  }
};

const getBooks = async (req, res, next) => {
  try {
    const result = await getBooksService(req.query);
    return successResponse(res, "Berhasil mengambil data buku", result);
  } catch (err) {
    next(err);
  }
};

const getBookById = async (req, res, next) => {
  try {
    const bookId = Number(req.params.bookId);
    const book = await getBookByIdService(bookId);
    return successResponse(res, "Berhasil mengambil detail buku", book);
  } catch (err) {
    next(err);
  }
};

const createBook = async (req, res, next) => {
  const coverFile = req.file ?? null;
  try {
    const parsedYear = req.body.year ? Number(req.body.year) : null;
    if (parsedYear === null || Number.isNaN(parsedYear)) {
      const err = new Error("Year tidak valid");
      err.status = 400;
      throw err;
    }

    const categoryId = Number(req.body.categoryId);
    if (Number.isNaN(categoryId)) {
      const err = new Error("Category ID tidak valid");
      err.status = 400;
      throw err;
    }

    const parsedStock = req.body.stock !== undefined ? Number(req.body.stock) : NaN;
    if (Number.isNaN(parsedStock) || parsedStock < 0) {
      const err = new Error("Stock tidak valid");
      err.status = 400;
      throw err;
    }

    if (coverFile && coverFile.size > MAX_COVER_BYTES) {
      const err = new Error("Ukuran cover terlalu besar (maks 5MB)");
      err.status = 400;
      throw err;
    }

    const description = req.body.description?.trim() || null;
    if (description && description.length > MAX_DESCRIPTION_LENGTH) {
      const err = new Error("Deskripsi terlalu panjang");
      err.status = 400;
      throw err;
    }

    const book = await createBookService({
      title: req.body.title?.trim(),
      author: req.body.author?.trim(),
      isbn: req.body.isbn?.trim(),
      year: parsedYear,
      stock: parsedStock,
      categoryId,
      description,
      cover: buildCoverPayload(coverFile),
      userId: req.user.id,
    });
    return successResponse(res, "Buku berhasil ditambahkan", book, 201);
  } catch (err) {
    cleanupFiles([coverFile]);
    next(err);
  }
};

const createDigitalBook = async (req, res, next) => {
  const files = req.files || {};
  const pdfFile = Array.isArray(files.file) ? files.file[0] : null;
  const coverFile = Array.isArray(files.cover) ? files.cover[0] : null;

  try {
    const parsedYear = req.body.year ? Number(req.body.year) : null;
    if (parsedYear !== null && Number.isNaN(parsedYear)) {
      const err = new Error("Year tidak valid");
      err.status = 400;
      throw err;
    }

    const categoryId = Number(req.body.categoryId);
    if (Number.isNaN(categoryId)) {
      const err = new Error("Category ID tidak valid");
      err.status = 400;
      throw err;
    }

    if (coverFile && coverFile.size > MAX_COVER_BYTES) {
      const err = new Error("Ukuran cover terlalu besar (maks 5MB)");
      err.status = 400;
      throw err;
    }

    const description = req.body.description?.trim() || null;
    if (description && description.length > MAX_DESCRIPTION_LENGTH) {
      const err = new Error("Deskripsi terlalu panjang");
      err.status = 400;
      throw err;
    }

    if (pdfFile && !isPdfSignature(pdfFile.path)) {
      const err = new Error("File PDF tidak valid");
      err.status = 400;
      throw err;
    }

    const file = pdfFile
      ? {
          filePath: path.join("uploads", "ebooks", pdfFile.filename),
          originalname: pdfFile.originalname,
          size: pdfFile.size,
          mimetype: pdfFile.mimetype,
        }
      : null;

    const book = await createDigitalBookService({
      title: req.body.title?.trim(),
      author: req.body.author?.trim(),
      isbn: req.body.isbn?.trim(),
      year: parsedYear,
      categoryId,
      description,
      userId: req.user.id,
      file,
      cover: buildCoverPayload(coverFile),
    });

    return successResponse(res, "Buku digital berhasil ditambahkan", book, 201);
  } catch (err) {
    cleanupFiles([pdfFile, coverFile]);
    next(err);
  }
};

const previewDigitalBook = async (req, res, next) => {
  try {
    const bookId = Number(req.params.bookId);
    const result = await getDigitalPreviewService(req.user.id, bookId);
    const safeName = String(result.fileName || "ebook.pdf").replace(/[^a-zA-Z0-9._-]/g, "_");

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("Content-Disposition", `inline; filename="${safeName}"`);
    return res.sendFile(result.absolutePath);
  } catch (err) {
    next(err);
  }
};

const deleteBook = async (req, res, next) => {
  try {
    const bookId = Number(req.params.bookId);
    await deleteBookService(bookId, req.user.id);
    return successResponse(res, "Buku berhasil dihapus", null);
  } catch (err) {
    next(err);
  }
};

const updateBook = async (req, res, next) => {
  const coverFile = req.file ?? null;
  try {
    const bookId = Number(req.params.bookId);
    if (coverFile && coverFile.size > MAX_COVER_BYTES) {
      const err = new Error("Ukuran cover terlalu besar (maks 5MB)");
      err.status = 400;
      throw err;
    }

    const description = req.body.description?.trim();
    if (description && description.length > MAX_DESCRIPTION_LENGTH) {
      const err = new Error("Deskripsi terlalu panjang");
      err.status = 400;
      throw err;
    }

    const { updated, removeCoverPath } = await updateBookService(bookId, {
      title: req.body.title,
      author: req.body.author,
      isbn: req.body.isbn,
      year: req.body.year,
      stock: req.body.stock,
      categoryId: req.body.categoryId,
      description,
      cover: buildCoverPayload(coverFile),
      userId: req.user.id,
    });

    if (coverFile && removeCoverPath) {
      deleteCoverPath(removeCoverPath);
    }

    return successResponse(res, "Buku berhasil diperbarui", updated);
  } catch (err) {
    cleanupFiles([coverFile]);
    next(err);
  }
};

module.exports = {
  getBooks,
  getBookById,
  createBook,
  createDigitalBook,
  previewDigitalBook,
  deleteBook,
  updateBook,
};
