// app/page.tsx
"use client";

import { FormEvent, useState } from "react";

export default function Home() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{ firstName?: string; lastName?: string }>({});

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setMessage(null);
    setError(null);

    const trimmedFirstName = firstName.trim();
    const trimmedLastName = lastName.trim();
    const errors: { firstName?: string; lastName?: string } = {};

    if (!trimmedFirstName) errors.firstName = "Le prénom est obligatoire.";
    if (!trimmedLastName) errors.lastName = "Le nom est obligatoire.";

    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setLoading(true);

    try {
      const res = await fetch("/api/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ firstName: trimmedFirstName, lastName: trimmedLastName }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        setError(data?.error || "Erreur serveur.");
        return;
      }

      setMessage("Client enregistré avec succès.");
      setFirstName("");
      setLastName("");
    } catch (err) {
      console.error(err);
      setError("Erreur réseau. Vérifie que le serveur tourne bien.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={{ padding: "2rem", maxWidth: 520, margin: "0 auto" }}>
      <h1 style={{ fontSize: 28, fontWeight: 700 }}>MotorSafe</h1>
      <p style={{ marginTop: 8, opacity: 0.8 }}>
        Création rapide d’un client (test MVP)
      </p>

      <div style={{ marginTop: 16 }}>
        <a href="/clients">← Voir la liste des clients</a>
      </div>

      <form
        onSubmit={handleSubmit}
        style={{ display: "grid", gap: "1rem", marginTop: "1.5rem" }}
      >
        <div>
          <label>
            Prénom<br />
            <input
              type="text"
              value={firstName}
              onChange={(e) => {
                setFirstName(e.target.value);
                setFieldErrors((prev) => ({ ...prev, firstName: undefined }));
              }}
              required
              minLength={2}
              maxLength={60}
              autoComplete="given-name"
              aria-invalid={Boolean(fieldErrors.firstName)}
              style={{ width: "100%", padding: 10 }}
            />
          </label>
          {fieldErrors.firstName && (
            <div style={{ marginTop: 4, color: "#b00", fontSize: 12 }}>
              {fieldErrors.firstName}
            </div>
          )}
        </div>

        <div>
          <label>
            Nom<br />
            <input
              type="text"
              value={lastName}
              onChange={(e) => {
                setLastName(e.target.value);
                setFieldErrors((prev) => ({ ...prev, lastName: undefined }));
              }}
              required
              minLength={2}
              maxLength={60}
              autoComplete="family-name"
              aria-invalid={Boolean(fieldErrors.lastName)}
              style={{ width: "100%", padding: 10 }}
            />
          </label>
          {fieldErrors.lastName && (
            <div style={{ marginTop: 4, color: "#b00", fontSize: 12 }}>
              {fieldErrors.lastName}
            </div>
          )}
        </div>

        <button
          type="submit"
          disabled={loading || !firstName.trim() || !lastName.trim()}
          style={{ padding: 12 }}
        >
          {loading ? "Enregistrement..." : "Enregistrer le client"}
        </button>
      </form>

      {message && <p style={{ color: "green", marginTop: 12 }}>{message}</p>}
      {error && <p style={{ color: "red", marginTop: 12 }}>{error}</p>}
    </main>
  );
}