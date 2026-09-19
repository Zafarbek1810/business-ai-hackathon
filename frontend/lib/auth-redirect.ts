import type { Role } from "@/types/api";

export function homePathForRole(role: Role | string | null | undefined): "/admin" | "/dashboard" {
  return role === "ADMIN" ? "/admin" : "/dashboard";
}
