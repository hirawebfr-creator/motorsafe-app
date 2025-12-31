"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

type Client = { id: number | string; firstName: string; lastName: string };

function extractArray<T>(payload: any, fallbackKey?: string): T[] {
  // cas 1: API renvoie directement un tableau
  if (Array.isArray(payload)) return payload as T[];

  // cas 2: API renvoie { ok:true, data:[...] }
  if (payload && payload.ok && Array.isArray(payload.data)) return payload.data as T[];

  // cas 3: API renvoie { ok:true, clients:[...] } (ou vehicles/interventions)
  if (payload && fallbackKey && Array.isArray(payload[fallbackKey])) return payload[fallbackKey] as T[];

  return [];
}

const PAGE_SIZE = 10;

type SortKey = "recent" | "name";

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SortKey>("recent");
  const [page, setPage] = useState(1);

  async function loadClients() {
    setErr(null);
    setLoading(true);

    try {
      const res = await fetch("/api/clients", { cache: "no-store" });
      const json = await res.json().catch(() => null);

      if (!res.ok) {
        setErr(json?.error || "Erreur serveur.");
        setClients([]);
        return;
      }

      const list = extractArray<Client>(json, "clients");
      setClients(list);
    } catch {
      setErr("Erreur réseau. Vérifie que le serveur tourne.");
      setClients([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadClients();
  }, []);

  useEffect(() => {
    setPage(1);
  }, [search, sort]);

  const filteredClients = useMemo(() => {
    const query = search.trim().toLowerCase();
    let list = [...clients];

    if (query) {
      list = list.filter((c) => {
        const idText = String(c.id).toLowerCase();
        const name = `${c.firstName} ${c.lastName}`.toLowerCase();
        return name.includes(query) || idText.includes(query);
      });
    }

    list.sort((a, b) => {
      if (sort === "name") {
        const aName = `${a.lastName} ${a.firstName}`.toLowerCase();
        const bName = `${b.lastName} ${b.firstName}`.toLowerCase();
        return aName.localeCompare(bName);
      }

      const aId = Number(a.id);
      const bId = Number(b.id);
      if (Number.isFinite(aId) && Number.isFinite(bId)) return bId - aId;
      return String(b.id).localeCompare(String(a.id));
    });

    return list;
  }, [clients, search, sort]);

  const pageCount = Math.max(1, Math.ceil(filteredClients.length / PAGE_SIZE));
  const pageStart = (page - 1) * PAGE_SIZE;
  const pagedClients = filteredClients.slice(pageStart, pageStart + PAGE_SIZE);

  useEffect(() => {
    if (page > pageCount) setPage(pageCount);
  }, [page, pageCount]);

  return (
    <main style={{ padding: 24, maxWidth: 900, margin: "0 auto" }}>
      <h1 style={{ fontSize: 24, fontWeight: 700 }}>Clients</h1>

      <div style={{ marginTop: 10, display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
        <Link href="/">← Retour</Link>
        <button onClick={loadClients} style={{ padding: "6px 10px" }}>
          Rafraîchir
        </button>
        <Link href="/vehicules">→ Véhicules</Link>
        <Link href="/interventions">→ Interventions</Link>
      </div>

      <div style={{ marginTop: 16, display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher par nom ou ID"
          style={{ minWidth: 240, padding: 8 }}
        />
        <select value={sort} onChange={(e) => setSort(e.target.value as SortKey)} style={{ padding: 8 }}>
          <option value="recent">Tri : plus récents</option>
          <option value="name">Tri : nom A → Z</option>
        </select>
        <span style={{ fontSize: 12, opacity: 0.7 }}>
          {filteredClients.length} résultat{filteredClients.length > 1 ? "s" : ""}
        </span>
      </div>

      {loading ? (
        <p style={{ marginTop: 16 }}>Chargement...</p>
      ) : err ? (
        <p style={{ marginTop: 16, color: "red" }}>{err}</p>
      ) : filteredClients.length === 0 ? (
        <p style={{ marginTop: 16 }}>Aucun client pour le moment.</p>
      ) : (
        <>
          <ul style={{ marginTop: 16, display: "grid", gap: 8 }}>
            {pagedClients.map((c) => (
              <li
                key={String(c.id)}
                style={{ padding: 12, border: "1px solid #eee", borderRadius: 10 }}
              >
                <b>
                  {c.firstName} {c.lastName}
                </b>
                <div style={{ fontSize: 12, opacity: 0.7 }}>ID: {String(c.id)}</div>
              </li>
            ))}
          </ul>

          <div style={{ marginTop: 16, display: "flex", alignItems: "center", gap: 8 }}>
            <button disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
              Précédent
            </button>
            <span style={{ fontSize: 12 }}>
              Page {page} / {pageCount}
            </span>
            <button disabled={page >= pageCount} onClick={() => setPage((p) => Math.min(pageCount, p + 1))}>
              Suivant
            </button>
          </div>
        </>
      )}
    </main>
  );
}