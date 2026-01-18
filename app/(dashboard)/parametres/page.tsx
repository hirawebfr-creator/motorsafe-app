import { prisma } from "@/lib/prisma";
import { getSessionUser, isApprovedGarage } from "@/lib/auth";
import { redirect } from "next/navigation";
import { ParametresClient } from "./ParametresClient";
import { hasFeature, FeatureKey, getPlanDisplayName } from "@/lib/entitlements";

export const runtime = "nodejs";

export default async function ParametresPage() {
  const user = await getSessionUser();
  if (!user) redirect("/auth/login");
  if (!isApprovedGarage(user)) redirect("/pro/en-attente");

  const garage = user.role === "ADMIN"
    ? null
    : await prisma.garage.findUnique({
        where: { id: user.garageId ?? -1 },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          address: true,
          siret: true,
          status: true,
          logoKey: true,
          plan: true,
        },
      });

  // WHITE-LABEL-PARTNERS-01: Check branding feature
  const hasBrandingFeature = user.garageId 
    ? await hasFeature(user.garageId, FeatureKey.BRANDING) 
    : false;
  const planName = garage?.plan ? getPlanDisplayName(garage.plan) : "Essai";

  return (
    <ParametresClient 
      role={user.role} 
      userEmail={user.email} 
      garage={garage}
      hasBrandingFeature={hasBrandingFeature}
      planName={planName}
    />
  );
}
