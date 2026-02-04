const { errorResponse } = require("../utils/response");

const errorHandler = (err, req, res, next) => {
  console.error("GLOBAL ERROR:", err);

  if (err && err.status && err.message) {
    return errorResponse(res, err.message, err.status, err.errors || null);
  }

  if (err && err.name === "MulterError") {
    if (err.code === "LIMIT_FILE_SIZE") {
      return errorResponse(res, "Ukuran file terlalu besar", 400);
    }
    return errorResponse(res, "Upload file gagal", 400);
  }

  // Prisma known errors
  if (err && err.code && typeof err.code === "string" && err.code.startsWith("P")) {
    return errorResponse(res, "Terjadi kesalahan pada database", 500);
  }

  return errorResponse(res, "Internal server error", 500);
};

module.exports = errorHandler;
