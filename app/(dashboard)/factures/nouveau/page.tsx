"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Receipt, User, Car, Plus, ChevronDown } from "lucide-react";
import { useToast } from "@/components/shared/use-toast";

type ClientOption = { id: number; firstName: string; lastName: string };
type VehicleOption = { id: string; brand: string; model: string; plate: string; clientId: number };

function isRecord(x: unknown): x is Record<string, unknown> {
  return typeof x === "object" && x !== null && !Array.isArray(x);
}
function unwrapOk(json: unknown): unknown {
  if (isRecord(json) && json.ok === true && "data" in json) return json.data;
  return json;
}
function pickArray(json: unknown): unknown[] {
  const data = unwrapOk(json);
  if (Array.isArray(data)) return data;
  if (isRecord(data) && Array.isArray(data.items)) return data.items;
  if (isRecord(data) && Array.isArray(data.data)) return data.data;
  return [];
}

export default function NouvelleFacturePage() {
  const router = useRouter();
  const toast = useToast();

  const [clients, setClients] = useState<ClientOption[]>([]);
  const [vehicles, setVehicles] = useState<VehicleOption[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [selectedClientId, setSelectedClientId] = useState<number | null>(null);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      setLoadingData(true);
      setError(null);
      const [clientsRes, vehiclesRes] = await Promise.all([
        fetch("/api/clients?pageSize=100", { cache: "no-store" }),
        fetch("/api/vehicules?pageSize=100", { cache: "no-store" }),
      ]);
      const clientsJson = await clientsRes.json().catch(() => null);
      const vehiclesJson = await vehiclesRes.json().catch(() => null);
      if (!clientsRes.ok) throw new Error(clientsJson?.error?.message || "Erreur clients");
      if (!vehiclesRes.ok) throw new Error(vehiclesJson?.error?.message || "Erreur vehicules");
      const clientsList = pickArray(clientsJson) as ClientOption[];
      const vehiclesList = pickArray(vehiclesJson) as VehicleOption[];
      setClients(clientsList);
      setVehicles(vehiclesList);
      if (clientsList.length > 0) setSelectedClientId(clientsList[0].id);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setLoadingData(false);
    }
  }, []);

  useEffect(() => { void loadData(); }, [loadData]);

  const filteredVehicles = vehicles.filter((v) => v.clientId === selectedClientId);

  const handleCreate = async () => {
    if (!selectedClientId) { setError("Veuillez selectionner un client"); return; }
    try {
      setCreating(true);
      setError(null);
      const body: Record<string, unknown> = {
        clientId: selectedClientId,
        lines: [{ description: "Prestation", qty: 1, unitPriceExcl: 0 }],
      };
      if (selectedVehicleId) body.vehicleId = selectedVehicleId;
      const res = await fetch("/api/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.ok) throw new Error(json?.error?.message || "Erreur creation");
      const invoiceId = json.data?.id;
      if (invoiceId) {
        toast.success("Facture creee avec succes");
        router.push(`/factures/${invoiceId}`);
      } else throw new Error("ID non retourne");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
      toast.error(e instanceof Error ? e.message : "Erreur");
      setCreating(false);
    }
  };

  if (loadingData) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "60vh" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ width: "64px", height: "64px", margin: "0 auto", borderRadius: "50%", border: "4px solid #E0E7FF", borderTopColor: "#6366F1", animation: "spin 1s linear infinite" }} />
          <p style={{ marginTop: "16px", color: "#6B7280", fontSize: "14px" }}>Chargement...</p>
        </div>
        <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div style={{ padding: "24px", maxWidth: "900px", margin: "0 auto" }}>
      {/* Back link */}
      <Link href="/factures" style={{ display: "inline-flex", alignItems: "center", gap: "8px", fontSize: "14px", fontWeight: "500", color: "#6B7280", textDecoration: "none", marginBottom: "24px" }}>
        <ArrowLeft size={16} />
        Retour aux factures
      </Link>

      {/* Header */}
      <div style={{ marginBottom: "32px" }}>
        <h1 style={{ fontSize: "28px", fontWeight: "700", color: "#111827", margin: 0 }}>Nouvelle facture</h1>
        <p style={{ fontSize: "14px", color: "#6B7280", marginTop: "4px" }}>Selectionnez un client pour creer un brouillon</p>
      </div>

      {/* Error */}
      {error && (
        <div style={{ padding: "16px", borderRadius: "12px", background: "#FEF2F2", border: "1px solid #FECACA", color: "#DC2626", marginBottom: "24px" }}>
          <strong>Erreur:</strong> {error}
        </div>
      )}

      {/* No clients */}
      {clients.length === 0 ? (
        <div style={{ textAlign: "center", padding: "64px 24px", borderRadius: "20px", background: "#fff", border: "1px solid #E5E7EB" }}>
          <div style={{ width: "80px", height: "80px", margin: "0 auto", borderRadius: "50%", background: "linear-gradient(135deg, #EEF2FF 0%, #E0E7FF 100%)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <User size={40} color="#6366F1" />
          </div>
          <h3 style={{ fontSize: "20px", fontWeight: "600", color: "#111827", margin: "24px 0 8px" }}>Aucun client</h3>
          <p style={{ fontSize: "14px", color: "#6B7280", margin: "0 0 24px" }}>Creez un client avant de pouvoir faire une facture</p>
          <Link href="/clients" style={{ textDecoration: "none" }}>
            <button style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "12px 24px", borderRadius: "12px", border: "none", background: "linear-gradient(135deg, #4F46E5 0%, #6366F1 100%)", fontSize: "14px", fontWeight: "600", color: "#fff", cursor: "pointer" }}>
              <Plus size={18} />
              Creer un client
            </button>
          </Link>
        </div>
      ) : (
        <>
          {/* Selection cards */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "24px", marginBottom: "32px" }}>
            {/* Client */}
            <div style={{ padding: "24px", borderRadius: "20px", background: "#fff", border: "1px solid #E5E7EB", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "20px" }}>
                <div style={{ width: "48px", height: "48px", borderRadius: "12px", background: "linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 12px rgba(59, 130, 246, 0.3)" }}>
                  <User size={24} color="#fff" />
                </div>
                <div>
                  <h3 style={{ fontSize: "16px", fontWeight: "600", color: "#111827", margin: 0 }}>Client</h3>
                  <p style={{ fontSize: "12px", color: "#6B7280", margin: 0 }}>Obligatoire</p>
                </div>
              </div>
              <div style={{ position: "relative" }}>
                <select
                  value={selectedClientId?.toString() || ""}
                  onChange={(e) => { setSelectedClientId(Number(e.target.value) || null); setSelectedVehicleId(""); }}
                  style={{ width: "100%", padding: "14px 40px 14px 16px", borderRadius: "12px", border: "1px solid #E5E7EB", background: "#F9FAFB", fontSize: "14px", color: "#111827", appearance: "none", cursor: "pointer", outline: "none" }}
                >
                  <option value="">Selectionner un client...</option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>{c.firstName} {c.lastName}</option>
                  ))}
                </select>
                <ChevronDown size={20} style={{ position: "absolute", right: "14px", top: "50%", transform: "translateY(-50%)", color: "#9CA3AF", pointerEvents: "none" }} />
              </div>
            </div>

            {/* Vehicle */}
            <div style={{ padding: "24px", borderRadius: "20px", background: "#fff", border: "1px solid #E5E7EB", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "20px" }}>
                <div style={{ width: "48px", height: "48px", borderRadius: "12px", background: "linear-gradient(135deg, #F59E0B 0%, #D97706 100%)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 12px rgba(245, 158, 11, 0.3)" }}>
                  <Car size={24} color="#fff" />
                </div>
                <div>
                  <h3 style={{ fontSize: "16px", fontWeight: "600", color: "#111827", margin: 0 }}>Vehicule</h3>
                  <p style={{ fontSize: "12px", color: "#6B7280", margin: 0 }}>Optionnel</p>
                </div>
              </div>
              <div style={{ position: "relative" }}>
                <select
                  value={selectedVehicleId}
                  onChange={(e) => setSelectedVehicleId(e.target.value)}
                  disabled={!selectedClientId || filteredVehicles.length === 0}
                  style={{ width: "100%", padding: "14px 40px 14px 16px", borderRadius: "12px", border: "1px solid #E5E7EB", background: !selectedClientId || filteredVehicles.length === 0 ? "#F3F4F6" : "#F9FAFB", fontSize: "14px", color: "#111827", appearance: "none", cursor: !selectedClientId || filteredVehicles.length === 0 ? "not-allowed" : "pointer", outline: "none", opacity: !selectedClientId || filteredVehicles.length === 0 ? 0.6 : 1 }}
                >
                  <option value="">{filteredVehicles.length === 0 ? "Aucun vehicule" : "Aucun (optionnel)"}</option>
                  {filteredVehicles.map((v) => (
                    <option key={v.id} value={v.id}>{v.brand} {v.model} - {v.plate}</option>
                  ))}
                </select>
                <ChevronDown size={20} style={{ position: "absolute", right: "14px", top: "50%", transform: "translateY(-50%)", color: "#9CA3AF", pointerEvents: "none" }} />
              </div>
              {selectedClientId && filteredVehicles.length === 0 && (
                <p style={{ fontSize: "13px", color: "#9CA3AF", marginTop: "12px" }}>
                  Ce client n'a pas de vehicule enregistre
                </p>
              )}
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px" }}>
            <Link href="/factures" style={{ textDecoration: "none" }}>
              <button style={{ padding: "12px 24px", borderRadius: "12px", border: "1px solid #E5E7EB", background: "#fff", fontSize: "14px", fontWeight: "500", color: "#374151", cursor: "pointer" }}>
                Annuler
              </button>
            </Link>
            <button
              onClick={handleCreate}
              disabled={creating || !selectedClientId}
              style={{
                display: "flex", alignItems: "center", gap: "8px",
                padding: "12px 24px", borderRadius: "12px",
                border: "none", background: creating || !selectedClientId ? "#9CA3AF" : "linear-gradient(135deg, #4F46E5 0%, #6366F1 100%)",
                fontSize: "14px", fontWeight: "600", color: "#fff",
                cursor: creating || !selectedClientId ? "not-allowed" : "pointer",
                boxShadow: creating || !selectedClientId ? "none" : "0 4px 14px rgba(79, 70, 229, 0.4)",
              }}
            >
              {creating ? (
                <>
                  <div style={{ width: "18px", height: "18px", border: "2px solid #fff", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 1s linear infinite" }} />
                  Creation...
                </>
              ) : (
                <>
                  <Receipt size={18} />
                  Creer le brouillon
                </>
              )}
            </button>
          </div>
        </>
      )}

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
