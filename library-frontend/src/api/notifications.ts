import { ensureCsrfToken, http } from "./http";
import type { ApiResponse, Notification, Paged } from "../types";

export async function getNotificationsApi(params?: {
  page?: number;
  limit?: number;
  status?: "READ" | "UNREAD";
}) {
  const res = await http.get<ApiResponse<Paged<Notification>>>("/notifications", { params });
  return res.data;
}

export async function markNotificationReadApi(notificationId: number) {
  await ensureCsrfToken();
  const res = await http.patch<ApiResponse<Notification>>(`/notifications/${notificationId}/read`);
  return res.data;
}
