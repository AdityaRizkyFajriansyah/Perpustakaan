const { errorResponse } = require("../utils/response");

const SAFE_METHODS = ["GET", "HEAD", "OPTIONS"];

const csrfMiddleware = (req, res, next) => {
  if (SAFE_METHODS.includes(req.method)) return next();
  if (req.path === "/auth/login") return next();
  if (req.headers.authorization) return next();

  const csrfCookie = req.cookies?.csrfToken;
  const csrfHeader = req.headers["x-csrf-token"];
  if (!csrfCookie || !csrfHeader || csrfCookie !== csrfHeader) {
    return errorResponse(res, "Invalid CSRF token", 403);
  }

  return next();
};

module.exports = csrfMiddleware;
