const { verifyToken } = require("../utils/jwt");
const { errorResponse } = require("../utils/response");

const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;
  const cookieToken = req.cookies?.token;

  let token = null;
  if (authHeader) {
    const parts = authHeader.split(" ");
    if (parts.length !== 2 || parts[0] !== "Bearer") {
      return errorResponse(res, "Invalid authorization format", 401);
    }
    token = parts[1];
  } else if (cookieToken) {
    token = cookieToken;
  }

  if (!token) return errorResponse(res, "Unauthorized", 401);

  const decoded = verifyToken(token);
  if (!decoded) return errorResponse(res, "Invalid or expired token", 401);

  req.user = decoded;
  next();
};

module.exports = authMiddleware;
