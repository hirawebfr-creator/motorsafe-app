"use client";

import { useState } from "react";
import { Toggle } from "@/components/ui/Toggle";

type ComplianceTogglesProps = {
  initialHash?: boolean;
  initialHistory?: boolean;
  initialAlerts?: boolean;
};

export function ComplianceToggles({
  initialHash = true,
  initialHistory = true,
  initialAlerts = true,
}: ComplianceTogglesProps) {
  const [hashEnabled, setHashEnabled] = useState(initialHash);
  const [historyEnabled, setHistoryEnabled] = useState(initialHistory);
  const [alertsEnabled, setAlertsEnabled] = useState(initialAlerts);

  return (
    <div className="grid gap-3 text-sm text-[color:var(--textMuted)]">
      <Toggle checked={hashEnabled} onChange={setHashEnabled} label="Activer le hash de preuve" />
      <Toggle checked={historyEnabled} onChange={setHistoryEnabled} label="Historique des révisions obligatoire" />
      <Toggle checked={alertsEnabled} onChange={setAlertsEnabled} label="Alertes email sur dossier critique" />
    </div>
  );
}
