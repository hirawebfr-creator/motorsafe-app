import type { SessionUser } from "@/lib/auth";

export function hasAdminAccess(user: SessionUser | null, req?: Request) {
  if (user?.role === "ADMIN") return true;
  const adminKey = req?.headers.get("x-admin-key");
  if (!adminKey || !process.env.ADMIN_KEY) return false;
  return adminKey === process.env.ADMIN_KEY;
}
