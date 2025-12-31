"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

type Client = { id: number; firstName: string; lastName: string; createdAt?: string };
type Vehicle = { id: string; plate: string; brand: string; model: string; clientId: number };

export default function ClientPage() {
  const params = useParams();
  const id = params?.id as string | undefined;
  const router = useRouter();

  const [client, setClient] = useState<Client | null>(null);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  async function load() {
    if (!id) return;
    setLoading(true);
    setErr(null);

    try {
      const cRes = await fetch(`/api/clients/${id}`, { cache: "no-store" });
      const cJson = await cRes.json().catch(() => null);
      if (!cRes.ok || (cJson && cJson.ok === false)) {
        setErr(cJson?.error || "Client introuvable");
        setClient(null);
      } else {
        setClient(cJson?.ok ? cJson.data : cJson);
      }

      const vRes = await fetch(`/api/vehicules`, { cache: "no-store" });
      const vJson = await vRes.json().catch(() => null);
      const allVehicles: Vehicle[] = vJson && vJson.ok && Array.isArray(vJson.data)
        ? vJson.data
        : Array.isArray(vJson)
        ? vJson
        : [];
      setVehicles(allVehicles.filter((v) => String(v.clientId) === String(id)));
    } catch (e) {
      setErr("Erreur réseau. Vérifie que le serveur tourne.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [id]);

  if (!id) return <div>Identifiant client manquant.</div>;

  return (
    <main style={{ padding: 24, maxWidth: 900, margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1 style={{ fontSize: 24, fontWeight: 800 }}>Dossier client</h1>
        <div>
          <Link href="/clients">← Retour</Link>
        </div>
      </div>

      {loading ? (
        <p>Chargement...</p>
      ) : err ? (
        <p style={{ color: "red" }}>{err}</p>
      ) : !client ? (
        <p>Client introuvable.</p>
      ) : (
        <>
          <section style={{ marginTop: 16, padding: 16, border: "1px solid #eee", borderRadius: 12 }}>
            <div style={{ fontSize: 18, fontWeight: 800 }}>{client.firstName} {client.lastName}</div>
            <div style={{ marginTop: 6, fontSize: 13, opacity: 0.9 }}>
              Créé le : {client.createdAt ? new Date(client.createdAt).toLocaleString() : "-"}
            </div>

            <div style={{ marginTop: 12 }}>
              <button onClick={() => window.print()} style={{ padding: 8 }}>Imprimer le dossier</button>
            </div>
          </section>

          <h2 style={{ marginTop: 24, fontSize: 18, fontWeight: 800 }}>Véhicules</h2>

          {vehicles.length === 0 ? (
            <p>Aucun véhicule pour ce client.</p>
          ) : (
            <ul style={{ marginTop: 12 }}>
              {vehicles.map((v) => (
                <li key={v.id} style={{ marginBottom: 12 }}>
                  <div style={{ fontWeight: 700 }}>{v.plate} — {v.brand} {v.model}</div>
                  <div style={{ marginTop: 6 }}>
                    <Link href={`/vehicules/${v.id}`}>Ouvrir le dossier véhicule</Link>
                  </div>
                </li>
              ))}
            </ul>
          )}

          <h2 style={{ marginTop: 24, fontSize: 18, fontWeight: 800 }}>Historique interventions</h2>

          {/* consolidated interventions per vehicle */}
          <div style={{ marginTop: 12 }}>
            {vehicles.length === 0 ? (
              <p>Aucun historique — enregistrez des véhicules d'abord.</p>
            ) : (
              vehicles.map((v) => (
                <div key={v.id} style={{ marginBottom: 18, padding: 12, border: "1px solid #f0f0f0", borderRadius: 8 }}>
                  <div style={{ fontWeight: 800 }}>{v.plate} — {v.brand} {v.model}</div>
                  <div style={{ marginTop: 8 }}>
                    <a
                      href={`/vehicules/${v.id}`}
                      onClick={(e) => {
                        e.preventDefault();
                        router.push(`/vehicules/${v.id}`);
                      }}
                    >
                      Voir interventions &gt;
                    </a>
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      )}
    </main>
  );
}