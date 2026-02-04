import axios from "axios";

export const http = axios.create({
  baseURL: "/api",
  timeout: 15000,
  withCredentials: true,
});

export const getCookieValue = (name: string) => {
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : "";
};

export async function ensureCsrfToken() {
  if (getCookieValue("csrfToken")) return;
  try {
    await http.get("/auth/me");
  } catch {
    // Ignore; caller should handle auth errors.
  }
}

http.interceptors.request.use((config) => {
  const method = (config.method || "get").toLowerCase();
  if (!["get", "head", "options"].includes(method)) {
    const csrfToken = getCookieValue("csrfToken");
    if (csrfToken) {
      config.headers = config.headers ?? {};
      config.headers["X-CSRF-Token"] = csrfToken;
    }
  }
  return config;
});

http.interceptors.response.use(
  (res) => res,
  (err) => {
    const msg =
      err?.response?.data?.message ||
      err?.message ||
      "Terjadi kesalahan jaringan/server";
    return Promise.reject(new Error(msg));
  }
);
