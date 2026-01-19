"use client";

import { useState } from "react";
import Link from "next/link";
import {
  MessageSquare,
  Mail,
  Phone,
  Send,
  CheckCircle,
  Loader2,
  ArrowLeft,
  ExternalLink,
} from "lucide-react";

// ============================================
// Constants
// ============================================

const WHATSAPP_URL = "https://wa.me/33626045731";
const SUPPORT_EMAIL = "contact@safemotor.fr";
const SUPPORT_PHONE = "+33 6 26 04 57 31";

const CATEGORIES = [
  { value: "BUG", label: "Signaler un problème" },
  { value: "BILLING", label: "Question facturation" },
  { value: "FEATURE", label: "Suggestion de fonctionnalité" },
  { value: "LEGAL", label: "Question juridique / RGPD" },
  { value: "OTHER", label: "Autre demande" },
];

// ============================================
// Component
// ============================================

export default function ContactPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [category, setCategory] = useState("OTHER");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [consent, setConsent] = useState(false);

  // Honeypot field (invisible to humans)
  const [website, setWebsite] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!consent) {
      setError("Veuillez accepter le traitement de vos données.");
      return;
    }

    if (!name.trim() || !email.trim() || !subject.trim() || !message.trim()) {
      setError("Veuillez remplir tous les champs obligatoires.");
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      const res = await fetch("/api/public/support", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          phone: phone || undefined,
          category,
          subject,
          message,
          website, // honeypot
          consent,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Erreur lors de l'envoi");
      }

      setSuccess(true);
      // Reset form
      setName("");
      setEmail("");
      setPhone("");
      setCategory("OTHER");
      setSubject("");
      setMessage("");
      setConsent(false);
    } catch (err) {
      console.error("Failed to submit contact form:", err);
      setError(err instanceof Error ? err.message : "Erreur lors de l'envoi");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[var(--ms-bg)] to-white">
      {/* Header */}
      <header className="border-b border-[var(--ms-border)] bg-white">
        <div className="mx-auto max-w-6xl px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2 text-[var(--ms-primary)] hover:opacity-80">
              <ArrowLeft size={20} />
              <span className="font-semibold">SafeMotor</span>
            </Link>
            <Link href="/auth/sign-in" className="ms-btn ms-btn-primary">
              Connexion
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-12">
        {/* Title */}
        <div className="mb-12 text-center">
          <h1 className="mb-4 text-4xl font-bold text-[var(--ms-text)]">Contactez-nous</h1>
          <p className="text-lg text-[var(--ms-text-muted)]">
            Notre équipe est à votre écoute pour toute question ou demande.
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Contact Methods */}
          <div className="space-y-4">
            {/* WhatsApp */}
            <a
              href={WHATSAPP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="ms-card block transition-transform hover:scale-[1.02]"
            >
              <div className="ms-card-body">
                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-green-100">
                  <MessageSquare size={24} className="text-green-600" />
                </div>
                <h3 className="mb-1 text-lg font-semibold text-[var(--ms-text)]">WhatsApp</h3>
                <p className="mb-2 text-sm text-[var(--ms-text-muted)]">
                  Réponse rapide en semaine
                </p>
                <div className="flex items-center gap-1 text-sm text-green-600">
                  Ouvrir WhatsApp
                  <ExternalLink size={14} />
                </div>
              </div>
            </a>

            {/* Email */}
            <a
              href={`mailto:${SUPPORT_EMAIL}`}
              className="ms-card block transition-transform hover:scale-[1.02]"
            >
              <div className="ms-card-body">
                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100">
                  <Mail size={24} className="text-blue-600" />
                </div>
                <h3 className="mb-1 text-lg font-semibold text-[var(--ms-text)]">Email</h3>
                <p className="mb-2 text-sm text-[var(--ms-text-muted)]">
                  {SUPPORT_EMAIL}
                </p>
                <div className="flex items-center gap-1 text-sm text-blue-600">
                  Envoyer un email
                </div>
              </div>
            </a>

            {/* Phone */}
            <a
              href={`tel:${SUPPORT_PHONE.replace(/\s/g, "")}`}
              className="ms-card block transition-transform hover:scale-[1.02]"
            >
              <div className="ms-card-body">
                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-purple-100">
                  <Phone size={24} className="text-purple-600" />
                </div>
                <h3 className="mb-1 text-lg font-semibold text-[var(--ms-text)]">Téléphone</h3>
                <p className="mb-2 text-sm text-[var(--ms-text-muted)]">
                  {SUPPORT_PHONE}
                </p>
                <div className="flex items-center gap-1 text-sm text-purple-600">
                  Appeler
                </div>
              </div>
            </a>

            {/* Hours */}
            <div className="ms-card">
              <div className="ms-card-body">
                <h3 className="mb-2 text-lg font-semibold text-[var(--ms-text)]">Horaires</h3>
                <ul className="space-y-1 text-sm text-[var(--ms-text-muted)]">
                  <li>Lun - Ven: 9h - 18h</li>
                  <li>Samedi: 10h - 16h</li>
                  <li>Dimanche: Fermé</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Contact Form */}
          <div className="lg:col-span-2">
            <div className="ms-card">
              <div className="ms-card-body">
                {success ? (
                  <div className="py-8 text-center">
                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                      <CheckCircle size={32} className="text-green-600" />
                    </div>
                    <h2 className="mb-2 text-xl font-semibold text-[var(--ms-text)]">
                      Message envoyé !
                    </h2>
                    <p className="mb-4 text-[var(--ms-text-muted)]">
                      Nous avons bien reçu votre message et vous répondrons dans les plus brefs délais.
                    </p>
                    <button
                      type="button"
                      onClick={() => setSuccess(false)}
                      className="ms-btn ms-btn-secondary"
                    >
                      Envoyer un autre message
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <h2 className="mb-4 text-xl font-semibold text-[var(--ms-text)]">
                      Envoyez-nous un message
                    </h2>

                    {error && (
                      <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600">
                        {error}
                      </div>
                    )}

                    {/* Honeypot field - hidden from humans */}
                    <input
                      type="text"
                      name="website"
                      value={website}
                      onChange={(e) => setWebsite(e.target.value)}
                      tabIndex={-1}
                      autoComplete="off"
                      style={{ position: "absolute", left: "-9999px", opacity: 0 }}
                      aria-hidden="true"
                    />

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <label className="mb-1 block text-sm font-medium text-[var(--ms-text)]">
                          Nom complet *
                        </label>
                        <input
                          type="text"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="Jean Dupont"
                          className="ms-input w-full"
                          required
                          maxLength={100}
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-sm font-medium text-[var(--ms-text)]">
                          Email *
                        </label>
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="jean@example.com"
                          className="ms-input w-full"
                          required
                          maxLength={254}
                        />
                      </div>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <label className="mb-1 block text-sm font-medium text-[var(--ms-text)]">
                          Téléphone
                        </label>
                        <input
                          type="tel"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          placeholder="+33 6 12 34 56 78"
                          className="ms-input w-full"
                          maxLength={20}
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-sm font-medium text-[var(--ms-text)]">
                          Catégorie
                        </label>
                        <select
                          value={category}
                          onChange={(e) => setCategory(e.target.value)}
                          className="ms-input w-full"
                        >
                          {CATEGORIES.map((c) => (
                            <option key={c.value} value={c.value}>{c.label}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="mb-1 block text-sm font-medium text-[var(--ms-text)]">
                        Sujet *
                      </label>
                      <input
                        type="text"
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                        placeholder="En quoi pouvons-nous vous aider ?"
                        className="ms-input w-full"
                        required
                        minLength={3}
                        maxLength={200}
                      />
                    </div>

                    <div>
                      <label className="mb-1 block text-sm font-medium text-[var(--ms-text)]">
                        Message *
                      </label>
                      <textarea
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="Décrivez votre demande en détail..."
                        className="ms-input w-full"
                        rows={5}
                        required
                        minLength={10}
                        maxLength={5000}
                      />
                    </div>

                    <div className="flex items-start gap-2">
                      <input
                        type="checkbox"
                        id="consent"
                        checked={consent}
                        onChange={(e) => setConsent(e.target.checked)}
                        className="mt-1"
                        required
                      />
                      <label htmlFor="consent" className="text-sm text-[var(--ms-text-muted)]">
                        J&apos;accepte que mes données soient traitées par SafeMotor pour répondre à ma demande.
                        Consultez notre{" "}
                        <Link href="/legal/privacy" className="text-[var(--ms-primary)] hover:underline">
                          politique de confidentialité
                        </Link>.
                      </label>
                    </div>

                    <button
                      type="submit"
                      disabled={submitting}
                      className="ms-btn ms-btn-primary w-full"
                    >
                      {submitting ? (
                        <>
                          <Loader2 size={16} className="animate-spin" />
                          Envoi en cours...
                        </>
                      ) : (
                        <>
                          <Send size={16} />
                          Envoyer le message
                        </>
                      )}
                    </button>
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-[var(--ms-border)] bg-white py-8">
        <div className="mx-auto max-w-6xl px-4 text-center text-sm text-[var(--ms-text-muted)]">
          <p>© {new Date().getFullYear()} SafeMotor. Tous droits réservés.</p>
          <div className="mt-2 flex justify-center gap-4">
            <Link href="/legal/privacy" className="hover:text-[var(--ms-primary)]">
              Confidentialité
            </Link>
            <Link href="/legal/terms" className="hover:text-[var(--ms-primary)]">
              CGU
            </Link>
            <Link href="/legal/mentions" className="hover:text-[var(--ms-primary)]">
              Mentions légales
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
