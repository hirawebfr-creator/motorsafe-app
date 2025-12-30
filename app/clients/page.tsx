"use client";

import { useEffect, useState } from "react";
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

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

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

  return (
    <main style={{ padding: 24, maxWidth: 900, margin: "0 auto" }}>
      <h1 style={{ fontSize: 24, fontWeight: 700 }}>Clients</h1>

      <div style={{ marginTop: 10, display: "flex", gap: 12, alignItems: "center" }}>
        <Link href="/">← Retour</Link>
        <button onClick={loadClients} style={{ padding: "6px 10px" }}>
          Rafraîchir
        </button>
        <Link href="/vehicules">→ Véhicules</Link>
        <Link href="/interventions">→ Interventions</Link>
      </div>

      {loading ? (
        <p style={{ marginTop: 16 }}>Chargement…</p>
      ) : err ? (
        <p style={{ marginTop: 16, color: "red" }}>{err}</p>
      ) : clients.length === 0 ? (
        <p style={{ marginTop: 16 }}>Aucun client pour le moment.</p>
      ) : (
        <ul style={{ marginTop: 16, display: "grid", gap: 8 }}>
          {clients.map((c) => (
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
      )}
    </main>
  );
}
