import { http } from "./http";
import type { ApiResponse, User } from "../types";

export async function loginApi(identifier: string, password: string, otp?: string) {
  const res = await http.post<ApiResponse<{ user: User }>>("/auth/login", { identifier, password, otp });
  return res.data;
}

export async function meApi() {
  const res = await http.get<ApiResponse<{ user: User }>>("/auth/me");
  return res.data;
}

export async function logoutApi() {
  const res = await http.post<ApiResponse<null>>("/auth/logout");
  return res.data;
}

export async function setupTwoFactorApi() {
  const res = await http.post<ApiResponse<{ otpauthUrl: string; secret: string }>>("/auth/2fa/setup");
  return res.data;
}

export async function enableTwoFactorApi(otp: string) {
  const res = await http.post<ApiResponse<null>>("/auth/2fa/enable", { otp });
  return res.data;
}

export async function disableTwoFactorApi(otp: string) {
  const res = await http.post<ApiResponse<null>>("/auth/2fa/disable", { otp });
  return res.data;
}
