const {
  getCategoriesService,
  createCategoryService,
  deleteCategoryService,
} = require("../services/category.service");
const { successResponse } = require("../utils/response");

const getCategories = async (req, res, next) => {
  try {
    const categories = await getCategoriesService();
    return successResponse(res, "Berhasil mengambil data kategori", categories);
  } catch (err) {
    next(err);
  }
};

const createCategory = async (req, res, next) => {
  try {
    const category = await createCategoryService({
      ...req.body,
      userId: req.user.id,
    });
    return successResponse(res, "Kategori berhasil dibuat", category, 201);
  } catch (err) {
    next(err);
  }
};

const deleteCategory = async (req, res, next) => {
  try {
    const category = await deleteCategoryService(req.params.categoryId, req.user.id);
    return successResponse(res, "Kategori berhasil dihapus", category);
  } catch (err) {
    next(err);
  }
};

module.exports = { getCategories, createCategory, deleteCategory };
