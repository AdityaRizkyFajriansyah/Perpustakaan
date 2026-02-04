const express = require("express");
const { login, me, logout, setupTwoFactor, enableTwoFactor, disableTwoFactor } = require("../controllers/auth.controller");
const loginRateLimiter = require("../middlewares/loginRateLimit.middleware");
const ipBlock = require("../middlewares/ipBlock.middleware");
const auth = require("../middlewares/auth.middleware");

const router = express.Router();

router.post("/login", ipBlock, loginRateLimiter, login);
router.get("/me", auth, me);
router.post("/logout", auth, logout);
router.post("/2fa/setup", auth, setupTwoFactor);
router.post("/2fa/enable", auth, enableTwoFactor);
router.post("/2fa/disable", auth, disableTwoFactor);

module.exports = router;
