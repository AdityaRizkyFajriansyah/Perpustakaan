const express = require("express");
const auth = require("../middlewares/auth.middleware");
const role = require("../middlewares/role.middleware");
const {
  exportBooks,
  exportBorrowings,
  exportStudents,
  exportAuditLogs,
} = require("../controllers/export.controller");

const router = express.Router();

router.get("/books", auth, role("ADMIN"), exportBooks);
router.get("/borrowings", auth, role("ADMIN"), exportBorrowings);
router.get("/students", auth, role("ADMIN"), exportStudents);
router.get("/audit-logs", auth, role("ADMIN"), exportAuditLogs);

module.exports = router;
