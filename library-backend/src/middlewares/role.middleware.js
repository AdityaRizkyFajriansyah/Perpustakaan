const { errorResponse } = require("../utils/response");

const roleMiddleware = (roles) => {
  const allowedRoles = Array.isArray(roles) ? roles : [roles];
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return errorResponse(res, "Forbidden", 403);
    }
    next();
  };
};

module.exports = roleMiddleware;
