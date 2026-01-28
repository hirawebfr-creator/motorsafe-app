"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useUser } from "@/components/user-context";
import { fetcher } from "@/lib/fetcher";
import {
  Users,
  Building2,
  Car,
  Search,
  RefreshCw,
  Mail,
  Phone,
  ChevronLeft,
  ChevronRight,
  Key,
  Shield,
  ArrowLeft,
} from "lucide-react";

// Responsive hook
function useResponsive() {
  const [screen, setScreen] = useState<"mobile" | "tablet" | "desktop">("desktop");
  useEffect(() => {
    const check = () => {
      const w = window.innerWidth;
      if (w < 640) setScreen("mobile");
      else if (w < 1024) setScreen("tablet");
      else setScreen("desktop");
    };
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);
  return { isMobile: screen === "mobile", isTablet: screen === "tablet", screen };
}

type ClientItem = {
  id: number;
  garageId: number;
  firstName: string;
  lastName: string;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  createdAt: string;
  vatProfile?: string | null;
  garage: { id: number; name: string };
  _count: { vehicles: number };
};

type ClientsResponse = {
  items: ClientItem[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

export default function AdminClientsPage() {
  const user = useUser();
  const { isMobile, isTablet } = useResponsive();

  const [clients, setClients] = useState<ClientItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [adminKey, setAdminKey] = useState("");
  const [keyReady, setKeyReady] = useState(false);
  const isAdmin = user?.role === "ADMIN";

  useEffect(() => {
    if (isAdmin) return;
    const stored = window.localStorage.getItem("ms_admin_key");
    if (stored) {
      setAdminKey(stored);
      setKeyReady(true);
    }
  }, [isAdmin]);

  const loadClients = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ page: String(page), pageSize: "30" });
      if (search) params.set("search", search);
      const data = await fetcher<ClientsResponse>(`/api/admin/clients?${params}`, {
        noStore: true,
        headers: !isAdmin && adminKey ? { "x-admin-key": adminKey } : undefined,
      });
      setClients(data?.items ?? []);
      setTotal(data?.total ?? 0);
      setTotalPages(data?.totalPages ?? 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur serveur.");
    } finally {
      setLoading(false);
    }
  }, [adminKey, isAdmin, page, search]);

  useEffect(() => {
    if (!user) return;
    if (isAdmin) {
      setKeyReady(true);
      loadClients();
      return;
    }
    if (keyReady) loadClients();
  }, [isAdmin, keyReady, loadClients, user]);

  const handleSearch = () => {
    setPage(1);
    setSearch(searchInput);
  };

  const formatDate = (dateStr: string) => {
    return new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(dateStr));
  };

  if (!user) return null;

  // Admin key prompt
  if (!keyReady && !isAdmin) {
    return (
      <div style={{ padding: isMobile ? "16px" : "32px", maxWidth: "500px", margin: "0 auto" }}>
        <div style={{ background: "#fff", borderRadius: "20px", border: "1px solid #E5E7EB", padding: isMobile ? "24px" : "32px", textAlign: "center" }}>
          <div style={{ width: "64px", height: "64px", borderRadius: "16px", background: "linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 24px" }}>
            <Key size={32} color="#fff" />
          </div>
          <h1 style={{ fontSize: "24px", fontWeight: 700, color: "#111827", margin: "0 0 8px" }}>Administration</h1>
          <p style={{ fontSize: "14px", color: "#6B7280", margin: "0 0 24px" }}>Entrez votre clé pour accéder au panneau admin</p>
          <input
            type="password"
            value={adminKey}
            onChange={(e) => setAdminKey(e.target.value)}
            placeholder="ADMIN_KEY"
            style={{ width: "100%", padding: "14px 16px", borderRadius: "12px", border: "1px solid #E5E7EB", fontSize: "14px", marginBottom: "16px", boxSizing: "border-box" }}
          />
          <button
            type="button"
            onClick={() => {
              if (!adminKey.trim()) return;
              window.localStorage.setItem("ms_admin_key", adminKey.trim());
              setKeyReady(true);
            }}
            style={{ width: "100%", padding: "14px 20px", borderRadius: "12px", border: "none", background: "linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)", fontSize: "14px", fontWeight: 600, color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}
          >
            <Shield size={18} />
            Déverrouiller
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: isMobile ? "16px" : isTablet ? "24px" : "32px", maxWidth: "1400px", margin: "0 auto" }}>
      {/* Header */}
      <div style={{ display: "flex", flexDirection: isMobile ? "column" : "row", justifyContent: "space-between", alignItems: isMobile ? "stretch" : "center", marginBottom: "24px", gap: "16px" }}>
        <div>
          <h1 style={{ fontSize: isMobile ? "24px" : "32px", fontWeight: 700, color: "#111827", margin: 0 }}>Tous les clients</h1>
          <p style={{ fontSize: "15px", color: "#6B7280", marginTop: "4px" }}>Liste complète des clients de tous les garages</p>
        </div>
        <div style={{ display: "flex", gap: "12px" }}>
          <Link href="/admin/dashboard" style={{ textDecoration: "none" }}>
            <button style={{ display: "flex", alignItems: "center", gap: "8px", padding: "12px 20px", borderRadius: "12px", border: "1px solid #E5E7EB", background: "#fff", fontSize: "14px", fontWeight: 600, color: "#374151", cursor: "pointer" }}>
              <ArrowLeft size={18} />
              Dashboard
            </button>
          </Link>
          <button
            type="button"
            onClick={() => void loadClients()}
            style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "12px", borderRadius: "12px", border: "1px solid #E5E7EB", background: "#fff", cursor: "pointer" }}
          >
            <RefreshCw size={18} color="#6B7280" />
          </button>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "repeat(2, 1fr)" : "repeat(3, 1fr)", gap: "16px", marginBottom: "24px" }}>
        <div style={{ padding: "20px", borderRadius: "16px", background: "#fff", border: "1px solid #E5E7EB" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
            <div style={{ width: "48px", height: "48px", borderRadius: "12px", background: "#FEF3C7", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Users size={24} color="#F59E0B" />
            </div>
            <div>
              <p style={{ fontSize: "13px", color: "#6B7280", margin: 0 }}>Total clients</p>
              <p style={{ fontSize: "28px", fontWeight: 700, color: "#111827", margin: 0 }}>{total}</p>
            </div>
          </div>
        </div>
        <div style={{ padding: "20px", borderRadius: "16px", background: "#fff", border: "1px solid #E5E7EB" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
            <div style={{ width: "48px", height: "48px", borderRadius: "12px", background: "#DBEAFE", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Car size={24} color="#3B82F6" />
            </div>
            <div>
              <p style={{ fontSize: "13px", color: "#6B7280", margin: 0 }}>Sur cette page</p>
              <p style={{ fontSize: "28px", fontWeight: 700, color: "#3B82F6", margin: 0 }}>{clients.length}</p>
            </div>
          </div>
        </div>
        <div style={{ padding: "20px", borderRadius: "16px", background: "#fff", border: "1px solid #E5E7EB", display: isMobile ? "none" : "block" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
            <div style={{ width: "48px", height: "48px", borderRadius: "12px", background: "#EEF2FF", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Building2 size={24} color="#6366F1" />
            </div>
            <div>
              <p style={{ fontSize: "13px", color: "#6B7280", margin: 0 }}>Pages</p>
              <p style={{ fontSize: "28px", fontWeight: 700, color: "#6366F1", margin: 0 }}>{totalPages}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search */}
      <div style={{ background: "#fff", borderRadius: "16px", border: "1px solid #E5E7EB", padding: "16px", marginBottom: "24px" }}>
        <div style={{ display: "flex", gap: "12px", flexDirection: isMobile ? "column" : "row" }}>
          <div style={{ position: "relative", flex: 1 }}>
            <Search size={20} color="#9CA3AF" style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)" }} />
            <input
              type="text"
              placeholder="Rechercher par nom, prénom ou email..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              style={{ width: "100%", padding: "14px 14px 14px 46px", borderRadius: "12px", border: "1px solid #E5E7EB", fontSize: "14px", boxSizing: "border-box" }}
            />
          </div>
          <button
            type="button"
            onClick={handleSearch}
            style={{ padding: "14px 24px", borderRadius: "12px", border: "none", background: "linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)", fontSize: "14px", fontWeight: 600, color: "#fff", cursor: "pointer", whiteSpace: "nowrap" }}
          >
            Rechercher
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div style={{ padding: "16px", borderRadius: "12px", background: "#FEF2F2", border: "1px solid #FECACA", marginBottom: "24px", color: "#DC2626", fontSize: "14px" }}>
          {error}
        </div>
      )}

      {/* Clients List */}
      <div style={{ background: "#fff", borderRadius: "16px", border: "1px solid #E5E7EB", overflow: "hidden" }}>
        {loading ? (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "64px" }}>
            <RefreshCw size={32} color="#6366F1" style={{ animation: "spin 1s linear infinite" }} />
          </div>
        ) : clients.length === 0 ? (
          <div style={{ padding: "64px", textAlign: "center" }}>
            <Users size={48} color="#D1D5DB" style={{ marginBottom: "16px" }} />
            <h3 style={{ fontSize: "16px", fontWeight: 600, color: "#111827", margin: "0 0 8px" }}>Aucun client</h3>
            <p style={{ fontSize: "14px", color: "#6B7280", margin: 0 }}>Les clients apparaîtront ici</p>
          </div>
        ) : isMobile ? (
          /* Mobile: Card view */
          <div style={{ display: "flex", flexDirection: "column" }}>
            {clients.map((client, index) => (
              <div
                key={client.id}
                style={{ padding: "16px", borderBottom: index < clients.length - 1 ? "1px solid #F3F4F6" : "none" }}
              >
                <div style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}>
                  <div style={{ width: "42px", height: "42px", borderRadius: "10px", background: "linear-gradient(135deg, #F97316 0%, #FB923C 100%)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <Users size={20} color="#fff" />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: "15px", fontWeight: 600, color: "#111827", margin: "0 0 4px" }}>{client.firstName} {client.lastName}</p>
                    {client.email && <p style={{ fontSize: "13px", color: "#6B7280", margin: "0 0 2px", display: "flex", alignItems: "center", gap: "4px" }}><Mail size={12} /> {client.email}</p>}
                    {client.phone && <p style={{ fontSize: "13px", color: "#6B7280", margin: 0, display: "flex", alignItems: "center", gap: "4px" }}><Phone size={12} /> {client.phone}</p>}
                    <div style={{ display: "flex", alignItems: "center", gap: "12px", marginTop: "8px", fontSize: "12px" }}>
                      <span style={{ display: "flex", alignItems: "center", gap: "4px", color: "#6366F1" }}><Building2 size={12} /> {client.garage?.name}</span>
                      <span style={{ display: "flex", alignItems: "center", gap: "4px", color: "#3B82F6" }}><Car size={12} /> {client._count?.vehicles || 0}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* Desktop/Tablet: Table view */
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#F9FAFB", borderBottom: "1px solid #E5E7EB" }}>
                <th style={{ padding: "14px 20px", textAlign: "left", fontSize: "12px", fontWeight: 600, color: "#6B7280", textTransform: "uppercase" }}>Client</th>
                <th style={{ padding: "14px 16px", textAlign: "left", fontSize: "12px", fontWeight: 600, color: "#6B7280", textTransform: "uppercase" }}>Contact</th>
                <th style={{ padding: "14px 16px", textAlign: "left", fontSize: "12px", fontWeight: 600, color: "#6B7280", textTransform: "uppercase" }}>Garage</th>
                <th style={{ padding: "14px 16px", textAlign: "center", fontSize: "12px", fontWeight: 600, color: "#6B7280", textTransform: "uppercase" }}>Véhicules</th>
                <th style={{ padding: "14px 20px", textAlign: "right", fontSize: "12px", fontWeight: 600, color: "#6B7280", textTransform: "uppercase" }}>Inscription</th>
              </tr>
            </thead>
            <tbody>
              {clients.map((client, index) => (
                <tr
                  key={client.id}
                  style={{ borderBottom: index < clients.length - 1 ? "1px solid #F3F4F6" : "none", transition: "background 0.15s" }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "#F9FAFB")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                >
                  <td style={{ padding: "16px 20px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                      <div style={{ width: "42px", height: "42px", borderRadius: "10px", background: "linear-gradient(135deg, #F97316 0%, #FB923C 100%)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <Users size={20} color="#fff" />
                      </div>
                      <div>
                        <p style={{ fontSize: "14px", fontWeight: 600, color: "#111827", margin: 0 }}>{client.firstName} {client.lastName}</p>
                        {client.vatProfile && <p style={{ fontSize: "12px", color: "#9CA3AF", margin: 0 }}>{client.vatProfile}</p>}
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: "16px" }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: "4px", fontSize: "13px" }}>
                      {client.email && <span style={{ display: "flex", alignItems: "center", gap: "6px", color: "#374151" }}><Mail size={14} color="#9CA3AF" /> {client.email}</span>}
                      {client.phone && <span style={{ display: "flex", alignItems: "center", gap: "6px", color: "#374151" }}><Phone size={14} color="#9CA3AF" /> {client.phone}</span>}
                      {!client.email && !client.phone && <span style={{ color: "#D1D5DB" }}>—</span>}
                    </div>
                  </td>
                  <td style={{ padding: "16px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px" }}>
                      <Building2 size={16} color="#6366F1" />
                      <span style={{ color: "#374151" }}>{client.garage?.name || "—"}</span>
                    </div>
                  </td>
                  <td style={{ padding: "16px", textAlign: "center" }}>
                    <div style={{ display: "inline-flex", alignItems: "center", gap: "4px", padding: "4px 12px", borderRadius: "8px", background: "#DBEAFE", fontSize: "13px", fontWeight: 600, color: "#2563EB" }}>
                      <Car size={14} /> {client._count?.vehicles || 0}
                    </div>
                  </td>
                  <td style={{ padding: "16px 20px", textAlign: "right", fontSize: "13px", color: "#6B7280" }}>
                    {formatDate(client.createdAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{ display: "flex", flexDirection: isMobile ? "column" : "row", alignItems: isMobile ? "stretch" : "center", justifyContent: "space-between", padding: "16px 20px", borderTop: "1px solid #E5E7EB", gap: "12px" }}>
            <p style={{ fontSize: "14px", color: "#6B7280", margin: 0, textAlign: isMobile ? "center" : "left" }}>
              Page {page} sur {totalPages} • {total} clients
            </p>
            <div style={{ display: "flex", gap: "8px" }}>
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                style={{ flex: isMobile ? 1 : "none", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", padding: "10px 16px", borderRadius: "10px", border: "1px solid #E5E7EB", background: page <= 1 ? "#F9FAFB" : "#fff", fontSize: "14px", fontWeight: 500, color: page <= 1 ? "#D1D5DB" : "#374151", cursor: page <= 1 ? "not-allowed" : "pointer" }}
              >
                <ChevronLeft size={16} /> Précédent
              </button>
              <button
                type="button"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                style={{ flex: isMobile ? 1 : "none", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", padding: "10px 16px", borderRadius: "10px", border: "1px solid #E5E7EB", background: page >= totalPages ? "#F9FAFB" : "#fff", fontSize: "14px", fontWeight: 500, color: page >= totalPages ? "#D1D5DB" : "#374151", cursor: page >= totalPages ? "not-allowed" : "pointer" }}
              >
                Suivant <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      <style dangerouslySetInnerHTML={{ __html: `@keyframes spin { to { transform: rotate(360deg); } }` }} />
    </div>
  );
}
