const { borrowBookService, getBorrowingsService, returnBookService } = require("../services/borrowing.service");
const { successResponse } = require("../utils/response");

const borrowBook = async (req, res, next) => {
  try {
    const borrowing = await borrowBookService(req.user.id, req.body.bookId);
    return successResponse(res, "Buku berhasil dipinjam", borrowing, 201);
  } catch (err) {
    next(err);
  }
};

const getBorrowings = async (req, res, next) => {
  try {
    const result = await getBorrowingsService(req.user, req.query);
    return successResponse(res, "Berhasil mengambil data peminjaman", result);
  } catch (err) {
    next(err);
  }
};

const returnBook = async (req, res, next) => {
  try {
    await returnBookService(Number(req.params.borrowingId), req.user);
    return successResponse(res, "Buku berhasil dikembalikan", null);
  } catch (err) {
    next(err);
  }
};

module.exports = { borrowBook, getBorrowings, returnBook };
