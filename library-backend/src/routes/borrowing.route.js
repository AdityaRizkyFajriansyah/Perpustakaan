const express = require("express");
const auth = require("../middlewares/auth.middleware");
const role = require("../middlewares/role.middleware");
const {
  borrowBook,
  getBorrowings,
  returnBook,
} = require("../controllers/borrowing.controller");

const router = express.Router();

router.post("/", auth, role("STUDENT"), borrowBook);
router.get("/", auth, getBorrowings);
router.patch("/:borrowingId/return", auth, role(["ADMIN", "STUDENT"]), returnBook);

module.exports = router;
