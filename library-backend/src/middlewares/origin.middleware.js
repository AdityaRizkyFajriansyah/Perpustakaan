const { errorResponse } = require("../utils/response");

const SAFE_METHODS = ["GET", "HEAD", "OPTIONS"];

const getAllowedOrigins = () => {
  const raw = process.env.ALLOWED_ORIGINS;
  if (raw) {
    return raw
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }
  return ["http://localhost:3000", "http://localhost:5173"];
};

const extractOrigin = (req) => {
  const origin = req.headers.origin;
  if (origin) return origin;
  const referer = req.headers.referer;
  if (!referer) return "";
  try {
    return new URL(referer).origin;
  } catch {
    return "";
  }
};

const originMiddleware = (req, res, next) => {
  if (SAFE_METHODS.includes(req.method)) return next();

  const origin = extractOrigin(req);
  const allowed = getAllowedOrigins();
  if (!origin || !allowed.includes(origin)) {
    return errorResponse(res, "Origin tidak diizinkan", 403);
  }

  return next();
};

module.exports = originMiddleware;
