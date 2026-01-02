import { prisma } from "@/lib/prisma";
import { getSessionUser, isApprovedGarage } from "@/lib/auth";
import { redirect } from "next/navigation";
import { ParametresClient } from "./ParametresClient";

export const runtime = "nodejs";

export default async function ParametresPage() {
  const user = await getSessionUser();
  if (!user) redirect("/auth/login");
  if (!isApprovedGarage(user)) redirect("/pro/en-attente");

  const garage = user.role === "ADMIN"
    ? null
    : await prisma.garage.findUnique({ where: { id: user.garageId ?? -1 } });

  return <ParametresClient role={user.role} userEmail={user.email} garage={garage} />;
}
