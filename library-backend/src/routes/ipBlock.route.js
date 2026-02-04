const express = require("express");
const auth = require("../middlewares/auth.middleware");
const role = require("../middlewares/role.middleware");
const { listIpBlocks, clearIpBlock } = require("../controllers/ipBlock.controller");

const router = express.Router();

router.get("/", auth, role("ADMIN"), listIpBlocks);
router.delete("/", auth, role("ADMIN"), clearIpBlock);

module.exports = router;
