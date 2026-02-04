const express = require("express");
const multer = require("multer");
const auth = require("../middlewares/auth.middleware");
const role = require("../middlewares/role.middleware");
const { importStudents, listStudents, deactivateStudent } = require("../controllers/student.controller");

const router = express.Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
});

router.post("/import", auth, role("ADMIN"), upload.single("file"), importStudents);
router.get("/", auth, role("ADMIN"), listStudents);
router.patch("/:studentId/deactivate", auth, role("ADMIN"), deactivateStudent);

module.exports = router;
