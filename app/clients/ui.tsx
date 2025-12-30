"use client";

import { useState } from "react";

type Client = {
  id: string;
  firstName: string;
  lastName: string;
  createdAt: string | Date;
};

export default function ClientsList({ initialClients }: { initialClients: Client[] }) {
  const [clients, setClients] = useState<Client[]>(initialClients);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const [editId, setEditId] = useState<string | null>(null);
  const [editFirstName, setEditFirstName] = useState("");
  const [editLastName, setEditLastName] = useState("");

  async function refresh() {
    const res = await fetch("/api/clients", { cache: "no-store" });
    const json = await res.json().catch(() => null);
    if (json && json.ok && Array.isArray(json.data)) {
      setClients(json.data);
    } else if (Array.isArray(json)) {
      setClients(json);
    }
  }

  async function removeClient(id: string) {
    if (!confirm("Supprimer ce client ?")) return;
    setLoadingId(id);
    try {
      const res = await fetch(`/api/clients/${id}`, { method: "DELETE" });
      const json = await res.json().catch(() => null);
      if (!res.ok || (json && json.ok === false)) throw new Error(json?.error || "Delete failed");
      await refresh();
    } finally {
      setLoadingId(null);
    }
  }

  function startEdit(c: Client) {
    setEditId(c.id);
    setEditFirstName(c.firstName);
    setEditLastName(c.lastName);
  }

  async function saveEdit() {
    if (!editId) return;
    setLoadingId(editId);
    try {
      const res = await fetch(`/api/clients/${editId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ firstName: editFirstName, lastName: editLastName }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || (data && data.ok === false)) alert(data?.error ?? "Erreur");
      setEditId(null);
      await refresh();
    } finally {
      setLoadingId(null);
    }
  }

  return (
    <section style={{ marginTop: 24 }}>
      <h2>Liste</h2>

      {clients.length === 0 ? (
        <p>Aucun client.</p>
      ) : (
        <ul style={{ marginTop: 12 }}>
          {clients.map((c) => (
            <li key={c.id} style={{ marginBottom: 10 }}>
              <strong>{c.firstName}</strong> {c.lastName}{" "}
              <button
                onClick={() => startEdit(c)}
                style={{ marginLeft: 8 }}
              >
                Modifier
              </button>
              <button
                onClick={() => removeClient(c.id)}
                disabled={loadingId === c.id}
                style={{ marginLeft: 8 }}
              >
                {loadingId === c.id ? "..." : "Supprimer"}
              </button>
            </li>
          ))}
        </ul>
      )}

      {editId && (
        <div style={{ marginTop: 20, padding: 12, border: "1px solid #ddd" }}>
          <h3>Modifier</h3>
          <div style={{ display: "grid", gap: 8, maxWidth: 320 }}>
            <input
              value={editFirstName}
              onChange={(e) => setEditFirstName(e.target.value)}
              placeholder="Prénom"
            />
            <input
              value={editLastName}
              onChange={(e) => setEditLastName(e.target.value)}
              placeholder="Nom"
            />
            <div>
              <button onClick={saveEdit} disabled={loadingId === editId}>
                {loadingId === editId ? "..." : "Enregistrer"}
              </button>
              <button onClick={() => setEditId(null)} style={{ marginLeft: 8 }}>
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
