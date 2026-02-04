import { http } from "./http";
import type { ApiResponse, Category } from "../types";

export async function getCategoriesApi() {
  const res = await http.get<ApiResponse<Category[]>>("/categories");
  return res.data;
}

export async function createCategoryApi(name: string) {
  const res = await http.post<ApiResponse<Category>>("/categories", { name });
  return res.data;
}

export async function deleteCategoryApi(categoryId: number) {
  const res = await http.delete<ApiResponse<Category>>(`/categories/${categoryId}`);
  return res.data;
}
