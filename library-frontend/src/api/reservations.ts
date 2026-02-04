import { ensureCsrfToken, http } from "./http";
import type { ApiResponse, Paged, Reservation } from "../types";

export async function createReservationApi(bookId: number) {
  await ensureCsrfToken();
  const res = await http.post<ApiResponse<Reservation>>("/reservations", { bookId });
  return res.data;
}

export async function getReservationsApi(params?: {
  page?: number;
  limit?: number;
  status?: string;
  q?: string;
}) {
  const res = await http.get<ApiResponse<Paged<Reservation>>>("/reservations", { params });
  return res.data;
}

export async function cancelReservationApi(reservationId: number) {
  await ensureCsrfToken();
  const res = await http.patch<ApiResponse<Reservation>>(`/reservations/${reservationId}/cancel`);
  return res.data;
}
