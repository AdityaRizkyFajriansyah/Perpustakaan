const express = require("express");
const auth = require("../middlewares/auth.middleware");
const role = require("../middlewares/role.middleware");
const { createCategory, getCategories, deleteCategory } = require("../controllers/category.controller");

const router = express.Router();

router.post("/", auth, role("ADMIN"), createCategory);
router.get("/", auth, getCategories);
router.delete("/:categoryId", auth, role("ADMIN"), deleteCategory);

module.exports = router;
