import type { Role } from "../types";

const ROLE_LABELS: Record<Role, string> = {
  ADMIN: "Admin",
  STUDENT: "Siswa",
};

export function formatRoleLabel(role?: Role | null) {
  if (!role) return "";
  return ROLE_LABELS[role] ?? role;
}
