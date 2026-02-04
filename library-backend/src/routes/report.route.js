const express = require("express");
const auth = require("../middlewares/auth.middleware");
const role = require("../middlewares/role.middleware");
const { getOverviewReport } = require("../controllers/report.controller");

const router = express.Router();

router.get("/overview", auth, role("ADMIN"), getOverviewReport);

module.exports = router;
