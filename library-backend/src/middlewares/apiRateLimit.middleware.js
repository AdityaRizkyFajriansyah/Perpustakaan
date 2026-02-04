const rateLimit = require("express-rate-limit");
const { errorResponse } = require("../utils/response");

const apiRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    return errorResponse(res, "Terlalu banyak request. Coba lagi nanti.", 429);
  },
});

module.exports = apiRateLimiter;
