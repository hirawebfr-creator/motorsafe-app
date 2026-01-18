import { redirect } from "next/navigation";
import { getSessionUser, isApprovedGarage } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasFeature, FeatureKey } from "@/lib/entitlements";
import { OnboardingWizard } from "./OnboardingWizard";

export default async function OnboardingPage() {
  const user = await getSessionUser();
  if (!user) redirect("/auth/login");
  if (!isApprovedGarage(user)) redirect("/pro/en-attente");
  
  const garageId = user.garageId;
  if (!garageId) redirect("/pro/en-attente");
  
  // Get garage with current onboarding status
  const garage = await prisma.garage.findUnique({
    where: { id: garageId },
  });
  
  if (!garage) redirect("/pro/en-attente");
  
  // Check features
  const hasBranding = await hasFeature(garageId, FeatureKey.BRANDING);
  const hasImport = await hasFeature(garageId, FeatureKey.IMPORT);
  
  // Get import stats if available
  const importBatches = await prisma.importBatch.findMany({
    where: {
      garageId,
      status: "IMPORTED",
    },
    select: {
      id: true,
      kind: true,
      statsJson: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
    take: 5,
  });
  
  // Get counts
  const [clientCount, vehicleCount] = await Promise.all([
    prisma.client.count({ where: { garageId, deletedAt: null } }),
    prisma.vehicle.count({ where: { garageId, deletedAt: null } }),
  ]);
  
  // Map garage to expected interface
  const garageData = {
    id: garage.id,
    name: garage.name,
    displayName: garage.displayName,
    city: garage.city,
    logoKey: garage.logoKey,
    brandColor: garage.brandColor,
    vatNumber: garage.vatNumber,
    defaultVatRate: garage.defaultVatRate,
    quotePrefix: garage.quotePrefix,
    invoicePrefix: garage.invoicePrefix,
    interventionPrefix: garage.interventionPrefix,
    onboardingStatus: garage.onboardingStatus,
  };
  
  return (
    <div className="ms-animate-slide-up">
      <div className="mb-6">
        <h1 className="ms-page-title">Configuration du garage</h1>
        <p className="ms-page-subtitle">
          Configurez votre garage en quelques étapes pour commencer à utiliser MotorSafe
        </p>
      </div>
      
      <OnboardingWizard
        garage={garageData}
        hasBranding={hasBranding}
        hasImport={hasImport}
        importBatches={importBatches.map((b) => ({
          id: b.id,
          kind: b.kind as "CLIENTS" | "VEHICULES",
          stats: JSON.parse(String(b.statsJson) || "{}"),
          createdAt: b.createdAt.toISOString(),
        }))}
        clientCount={clientCount}
        vehicleCount={vehicleCount}
      />
    </div>
  );
}
