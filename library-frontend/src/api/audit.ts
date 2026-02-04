import { http } from "./http";
import type { ApiResponse, AuditLog, Paged } from "../types";

export async function getAuditLogsApi(params?: {
  page?: number;
  limit?: number;
  action?: string;
  entity?: string;
  userId?: number;
}) {
  const res = await http.get<ApiResponse<Paged<AuditLog>>>("/audit-logs", { params });
  return res.data;
}
