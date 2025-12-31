import { redirect } from "next/navigation";
import { getSessionUser, isApprovedGarage } from "@/lib/auth";
import DashboardShell from "@/components/dashboard-shell";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getSessionUser();
  if (!user) redirect("/auth/login");
  if (!isApprovedGarage(user)) redirect("/pro/pending");

  return <DashboardShell user={user}>{children}</DashboardShell>;
}
