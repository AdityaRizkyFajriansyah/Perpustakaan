import { http } from "./http";
import type { ApiResponse, Borrowing, BorrowingStatus, Paged } from "../types";

export async function borrowBookApi(bookId: number) {
  const res = await http.post<ApiResponse<Borrowing>>("/borrowings", { bookId });
  return res.data;
}

export async function getBorrowingsApi(params?: {
  page?: number;
  limit?: number;
  status?: BorrowingStatus;
  from?: string; // YYYY-MM-DD
  to?: string;   // YYYY-MM-DD
}) {
  const res = await http.get<ApiResponse<Paged<Borrowing>>>("/borrowings", { params });
  return res.data;
}

export async function returnBookApi(borrowingId: number) {
  const res = await http.patch<ApiResponse<null>>(`/borrowings/${borrowingId}/return`);
  return res.data;
}
