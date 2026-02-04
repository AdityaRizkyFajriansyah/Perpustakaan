const prisma = require("../config/prisma");
const { createAuditLog } = require("./audit.service");

const getCategoriesService = async () => {
  return prisma.category.findMany();
};

const createCategoryService = async (payload) => {
  const { name, userId } = payload;

  if (!name || typeof name !== "string") {
    const err = new Error("Nama kategori wajib diisi");
    err.status = 400;
    throw err;
  }

  const exists = await prisma.category.findFirst({
    where: { name: { equals: name, mode: "insensitive" } },
  });

  if (exists) {
    const err = new Error("Kategori sudah ada");
    err.status = 400;
    throw err;
  }

  const category = await prisma.category.create({ data: { name } });

  await createAuditLog({
    userId,
    action: "CREATE_CATEGORY",
    entity: "Category",
    entityId: category.id,
  });

  return category;
};

const deleteCategoryService = async (categoryId, userId) => {
  const id = Number(categoryId);
  if (Number.isNaN(id)) {
    const err = new Error("Category ID tidak valid");
    err.status = 400;
    throw err;
  }

  const category = await prisma.category.findUnique({ where: { id } });
  if (!category) {
    const err = new Error("Kategori tidak ditemukan");
    err.status = 404;
    throw err;
  }

  const usedCount = await prisma.book.count({ where: { categoryId: id } });
  if (usedCount > 0) {
    const err = new Error("Kategori masih digunakan oleh buku");
    err.status = 400;
    throw err;
  }

  await prisma.category.delete({ where: { id } });

  await createAuditLog({
    userId,
    action: "DELETE_CATEGORY",
    entity: "Category",
    entityId: id,
  });

  return category;
};

module.exports = { getCategoriesService, createCategoryService, deleteCategoryService };
