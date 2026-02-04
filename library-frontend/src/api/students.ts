import { ensureCsrfToken, http } from "./http";
import type { ApiResponse, Paged, User } from "../types";

export interface ImportStudentsResult {
  created: number;
  skipped: number;
  errors: string[];
}

export async function importStudentsApi(file: File) {
  await ensureCsrfToken();
  const form = new FormData();
  form.append("file", file);
  const res = await http.post<ApiResponse<ImportStudentsResult>>("/students/import", form);
  return res.data;
}

export async function getStudentsApi(params?: {
  page?: number;
  limit?: number;
  q?: string;
  status?: "active" | "inactive" | "return_only";
}) {
  const res = await http.get<ApiResponse<Paged<User>>>("/students", { params });
  return res.data;
}

export async function deactivateStudentApi(studentId: number, reason = "TRANSFERRED") {
  const res = await http.patch<ApiResponse<User>>(`/students/${studentId}/deactivate`, { reason });
  return res.data;
}
