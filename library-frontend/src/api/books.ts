import { ensureCsrfToken, http } from "./http";
import type { ApiResponse, Book, Paged } from "../types";

export async function getBooksApi(params?: {
  page?: number;
  limit?: number;
  q?: string;
  sort?: "newest" | "oldest";
  categoryId?: number;
}) {
  const res = await http.get<ApiResponse<Paged<Book>>>("/books", { params });
  return res.data;
}

export async function getBookApi(bookId: number) {
  const res = await http.get<ApiResponse<Book>>(`/books/${bookId}`);
  return res.data;
}

export async function createBookApi(payload: {
  title: string;
  author: string;
  isbn: string;
  year?: number | null;
  stock: number;
  categoryId: number;
  description?: string | null;
  cover?: File | null;
}) {
  await ensureCsrfToken();
  const form = new FormData();
  form.append("title", payload.title);
  form.append("author", payload.author);
  form.append("isbn", payload.isbn);
  if (payload.year !== undefined && payload.year !== null) {
    form.append("year", String(payload.year));
  }
  form.append("stock", String(payload.stock));
  form.append("categoryId", String(payload.categoryId));
  const description = payload.description?.trim();
  if (description) {
    form.append("description", description);
  }
  if (payload.cover) {
    form.append("cover", payload.cover);
  }
  const res = await http.post<ApiResponse<Book>>("/books", form);
  return res.data;
}

export async function createDigitalBookApi(payload: {
  title: string;
  author: string;
  isbn: string;
  year?: number | null;
  categoryId: number;
  file: File;
  description?: string | null;
  cover?: File | null;
}) {
  await ensureCsrfToken();
  const form = new FormData();
  form.append("title", payload.title);
  form.append("author", payload.author);
  form.append("isbn", payload.isbn);
  if (payload.year !== undefined && payload.year !== null) {
    form.append("year", String(payload.year));
  }
  form.append("categoryId", String(payload.categoryId));
  const description = payload.description?.trim();
  if (description) {
    form.append("description", description);
  }
  if (payload.cover) {
    form.append("cover", payload.cover);
  }
  form.append("file", payload.file);
  const res = await http.post<ApiResponse<Book>>("/books/digital", form);
  return res.data;
}

export async function deleteBookApi(bookId: number) {
  await ensureCsrfToken();
  const res = await http.delete<ApiResponse<null>>(`/books/${bookId}`);
  return res.data;
}

export async function updateBookApi(bookId: number, payload: {
  title?: string;
  author?: string;
  isbn?: string;
  year?: number;
  stock?: number;
  categoryId?: number;
  description?: string | null;
  cover?: File | null;
}) {
  await ensureCsrfToken();
  const form = new FormData();
  if (payload.title !== undefined) form.append("title", payload.title);
  if (payload.author !== undefined) form.append("author", payload.author);
  if (payload.isbn !== undefined) form.append("isbn", payload.isbn);
  if (payload.year !== undefined) form.append("year", String(payload.year));
  if (payload.stock !== undefined) form.append("stock", String(payload.stock));
  if (payload.categoryId !== undefined) form.append("categoryId", String(payload.categoryId));
  if (payload.description !== undefined) {
    if (payload.description) {
      form.append("description", payload.description);
    } else {
      form.append("description", "");
    }
  }
  if (payload.cover) {
    form.append("cover", payload.cover);
  }
  const res = await http.patch<ApiResponse<Book>>(`/books/${bookId}`, form);
  return res.data;
}
