const express = require("express");
const auth = require("../middlewares/auth.middleware");
const role = require("../middlewares/role.middleware");
const { getAuditLogs } = require("../controllers/audit.controller");

const router = express.Router();

router.get("/", auth, role("ADMIN"), getAuditLogs);

module.exports = router;
