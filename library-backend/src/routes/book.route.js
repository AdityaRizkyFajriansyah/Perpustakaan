const crypto = require("crypto");
const express = require("express");
const fs = require("fs");
const multer = require("multer");
const path = require("path");
const auth = require("../middlewares/auth.middleware");
const role = require("../middlewares/role.middleware");
const {
  getBooks,
  createBook,
  createDigitalBook,
  previewDigitalBook,
  deleteBook,
  updateBook,
  getBookById,
} = require("../controllers/book.controller");

const router = express.Router();

const EBOOK_DIR = path.join(process.cwd(), "uploads", "ebooks");
const COVER_DIR = path.join(process.cwd(), "uploads", "covers");
if (!fs.existsSync(EBOOK_DIR)) {
  fs.mkdirSync(EBOOK_DIR, { recursive: true });
}
if (!fs.existsSync(COVER_DIR)) {
  fs.mkdirSync(COVER_DIR, { recursive: true });
}

const IMAGE_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const IMAGE_EXTS = new Set([".jpg", ".jpeg", ".png", ".webp"]);

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (file.fieldname === "file") return cb(null, EBOOK_DIR);
    if (file.fieldname === "cover") return cb(null, COVER_DIR);
    const err = new Error("Field upload tidak dikenal");
    err.status = 400;
    return cb(err);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname || "").toLowerCase() || ".bin";
    const name = `${Date.now()}-${crypto.randomBytes(8).toString("hex")}${ext}`;
    cb(null, name);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname || "").toLowerCase();
    if (file.fieldname === "file") {
      if (file.mimetype !== "application/pdf" || ext !== ".pdf") {
        const err = new Error("Format file harus PDF");
        err.status = 400;
        return cb(err);
      }
      return cb(null, true);
    }
    if (file.fieldname === "cover") {
      if (!IMAGE_MIME_TYPES.has(file.mimetype) || !IMAGE_EXTS.has(ext)) {
        const err = new Error("Format cover harus JPG, PNG, atau WEBP");
        err.status = 400;
        return cb(err);
      }
      return cb(null, true);
    }
    const err = new Error("Field upload tidak dikenal");
    err.status = 400;
    return cb(err);
  },
});

router.get("/", auth, getBooks);
router.post("/", auth, role("ADMIN"), upload.single("cover"), createBook);
router.patch("/:bookId", auth, role("ADMIN"), upload.single("cover"), updateBook);
router.post(
  "/digital",
  auth,
  role("ADMIN"),
  upload.fields([
    { name: "file", maxCount: 1 },
    { name: "cover", maxCount: 1 },
  ]),
  createDigitalBook
);
router.get("/:bookId/preview", auth, role("STUDENT"), previewDigitalBook);
router.get("/:bookId", auth, getBookById);
router.delete("/:bookId", auth, role("ADMIN"), deleteBook);

module.exports = router;
