"use client";

import { useState, useEffect, useRef } from "react";
import { Building2, Upload, Trash2, Loader2, Save, CheckCircle, Copy, Gift } from "lucide-react";

// ============================================================
// Types
// ============================================================

type GarageProfile = {
  id: number;
  name: string;
  displayName: string | null;
  legalName: string | null;
  siret: string | null;
  email: string;
  phone: string | null;
  addressLine1: string | null;
  addressLine2: string | null;
  postalCode: string | null;
  city: string | null;
  country: string;
  logoKey: string | null;
  logoUrl: string | null;
  partnerBadgeEnabled: boolean;
  partnerBadgeAdminOverride: string;
  partnerBadgeEffective: boolean;
  publicProfileEnabled: boolean;
  publicPhone: string | null;
  publicWebsite: string | null;
  referralCode: string | null;
  referralRewardMonths: number;
};

// ============================================================
// Component
// ============================================================

export default function GarageProfilePage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Form fields
  const [displayName, setDisplayName] = useState("");
  const [legalName, setLegalName] = useState("");
  const [siret, setSiret] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [addressLine1, setAddressLine1] = useState("");
  const [addressLine2, setAddressLine2] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [city, setCity] = useState("");
  const [country, setCountry] = useState("France");
  const [logoKey, setLogoKey] = useState<string | null>(null);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [partnerBadgeEnabled, setPartnerBadgeEnabled] = useState(false);
  const [partnerBadgeAdminOverride, setPartnerBadgeAdminOverride] = useState("NONE");
  const [partnerBadgeEffective, setPartnerBadgeEffective] = useState(false);
  const [publicProfileEnabled, setPublicProfileEnabled] = useState(false);
  const [publicPhone, setPublicPhone] = useState("");
  const [publicWebsite, setPublicWebsite] = useState("");
  const [referralCode, setReferralCode] = useState<string | null>(null);
  const [referralRewardMonths, setReferralRewardMonths] = useState(0);
  const [copied, setCopied] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // ============================================================
  // Load profile on mount
  // ============================================================
  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile() {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/garages/profile");
      const json = await res.json().catch(() => null);

      if (!res.ok || !json?.ok) {
        throw new Error(json?.error?.message || "Erreur chargement profil");
      }

      const p = json.data as GarageProfile;
      setDisplayName(p.displayName || "");
      setLegalName(p.legalName || "");
      setSiret(p.siret || "");
      setEmail(p.email || "");
      setPhone(p.phone || "");
      setAddressLine1(p.addressLine1 || "");
      setAddressLine2(p.addressLine2 || "");
      setPostalCode(p.postalCode || "");
      setCity(p.city || "");
      setCountry(p.country || "France");
      setLogoKey(p.logoKey);
      setLogoUrl(p.logoUrl);
      setPartnerBadgeEnabled(p.partnerBadgeEnabled ?? false);
      setPartnerBadgeAdminOverride(p.partnerBadgeAdminOverride ?? "NONE");
      setPartnerBadgeEffective(p.partnerBadgeEffective ?? false);
      setPublicProfileEnabled(p.publicProfileEnabled ?? false);
      setPublicPhone(p.publicPhone || "");
      setPublicWebsite(p.publicWebsite || "");
      setReferralCode(p.referralCode);
      setReferralRewardMonths(p.referralRewardMonths ?? 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setLoading(false);
    }
  }

  // ============================================================
  // Save profile
  // ============================================================
  async function handleSave() {
    try {
      setSaving(true);
      setError(null);
      setSuccess(false);

      const payload = {
        displayName: displayName.trim() || null,
        legalName: legalName.trim() || null,
        siret: siret.trim() || null,
        email: email.trim(),
        phone: phone.trim() || null,
        addressLine1: addressLine1.trim() || null,
        addressLine2: addressLine2.trim() || null,
        postalCode: postalCode.trim() || null,
        city: city.trim() || null,
        country: country.trim() || "France",
        logoKey,
        partnerBadgeEnabled,
        publicProfileEnabled,
        publicPhone: publicPhone.trim() || null,
        publicWebsite: publicWebsite.trim() || null,
      };

      const res = await fetch("/api/garages/profile", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.ok) {
        const msg = json?.error?.message || "Erreur sauvegarde";
        throw new Error(msg);
      }

      // Update logoUrl from response
      if (json.data?.logoUrl) {
        setLogoUrl(json.data.logoUrl);
      }
      if (json.data?.partnerBadgeEffective !== undefined) {
        setPartnerBadgeEffective(json.data.partnerBadgeEffective);
      }

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setSaving(false);
    }
  }

  // ============================================================
  // Upload logo
  // ============================================================
  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file
    const maxSize = 2 * 1024 * 1024; // 2MB
    const allowedTypes = ["image/png", "image/jpeg", "image/jpg", "image/webp", "image/svg+xml"];

    if (file.size > maxSize) {
      setError("Le fichier est trop volumineux (max 2 Mo)");
      return;
    }
    if (!allowedTypes.includes(file.type)) {
      setError("Format non supporté. Utilisez PNG, JPG, WebP ou SVG.");
      return;
    }

    try {
      setUploading(true);
      setError(null);

      // 1. Get presign info
      const presignRes = await fetch("/api/uploads/presign", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          fileName: `logo-${Date.now()}.${file.name.split(".").pop()}`,
          mime: file.type,
          size: file.size,
        }),
      });

      const presignJson = await presignRes.json().catch(() => null);
      if (!presignRes.ok || !presignJson?.ok) {
        throw new Error(presignJson?.error?.message || "Erreur upload");
      }

      const { strategy, url, key, mime } = presignJson.data;

      // 2. Upload file
      if (strategy === "s3") {
        // Direct upload to S3
        const uploadRes = await fetch(url, {
          method: "PUT",
          headers: { "Content-Type": file.type },
          body: file,
        });
        if (!uploadRes.ok) {
          throw new Error("Erreur upload S3");
        }
      } else {
        // Local upload via base64
        const base64 = await fileToBase64(file);
        const localRes = await fetch("/api/uploads/local", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            key,
            mime,
            contentBase64: base64,
          }),
        });
        const localJson = await localRes.json().catch(() => null);
        if (!localRes.ok || !localJson?.ok) {
          throw new Error(localJson?.error?.message || "Erreur upload local");
        }
      }

      // 3. Update state with new key
      setLogoKey(key);
      setLogoUrl(`/api/uploads/file/${key}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur upload");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  function fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        // Remove data:...;base64, prefix
        resolve(result.split(",")[1] || result);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  function handleRemoveLogo() {
    setLogoKey(null);
    setLogoUrl(null);
  }

  // ============================================================
  // Render
  // ============================================================
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 size={32} className="animate-spin text-[var(--ms-primary)]" />
      </div>
    );
  }

  return (
    <div className="ms-animate-slide-up">
      {/* Page Header */}
      <div className="ms-page-header">
        <div>
          <h1 className="ms-page-title">Profil du garage</h1>
          <p className="ms-page-subtitle">
            Informations affichées sur vos documents (PDF, emails)
          </p>
        </div>
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="ms-btn ms-btn-primary"
        >
          {saving ? (
            <Loader2 size={16} className="animate-spin mr-2" />
          ) : success ? (
            <CheckCircle size={16} className="mr-2" />
          ) : (
            <Save size={16} className="mr-2" />
          )}
          {saving ? "Enregistrement…" : success ? "Enregistré !" : "Enregistrer"}
        </button>
      </div>

      {/* Error / Success */}
      {error && (
        <div className="ms-alert ms-alert-error mb-6">
          <span>{error}</span>
        </div>
      )}

      {/* Logo Section */}
      <div className="ms-card p-6 mb-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--ms-primary-light)]">
            <Building2 size={20} className="text-[var(--ms-primary)]" />
          </div>
          <div>
            <h3 className="text-lg font-semibold">Logo</h3>
            <p className="text-xs text-muted2">
              Affiché sur vos PDFs et emails (max 2 Mo, PNG/JPG/WebP/SVG)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-6">
          {/* Logo preview */}
          <div className="w-32 h-32 border-2 border-dashed border-[var(--ms-border)] rounded-xl flex items-center justify-center bg-[var(--ms-bg-subtle)] overflow-hidden">
            {logoUrl ? (
              <img
                src={logoUrl}
                alt="Logo garage"
                className="max-w-full max-h-full object-contain"
                onError={() => setLogoUrl(null)}
              />
            ) : (
              <Building2 size={40} className="text-[var(--ms-text-muted)]" />
            )}
          </div>

          <div className="flex flex-col gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/jpg,image/webp,image/svg+xml"
              onChange={handleLogoUpload}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="ms-btn ms-btn-secondary"
            >
              {uploading ? (
                <Loader2 size={16} className="animate-spin mr-2" />
              ) : (
                <Upload size={16} className="mr-2" />
              )}
              {uploading ? "Upload…" : "Uploader un logo"}
            </button>
            {logoUrl && (
              <button
                type="button"
                onClick={handleRemoveLogo}
                className="ms-btn ms-btn-ghost text-[var(--ms-error)]"
              >
                <Trash2 size={16} className="mr-2" />
                Supprimer
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Identity Section */}
      <div className="ms-card p-6 mb-6">
        <h3 className="text-lg font-semibold mb-4">Identité</h3>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="block text-sm font-medium mb-2">
              Nom commercial (affiché)
            </label>
            <input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Ex: Garage Martin"
              className="ms-input w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">
              Raison sociale (optionnel)
            </label>
            <input
              value={legalName}
              onChange={(e) => setLegalName(e.target.value)}
              placeholder="Ex: SARL Martin Auto"
              className="ms-input w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">
              SIRET (14 chiffres)
            </label>
            <input
              value={siret}
              onChange={(e) => setSiret(e.target.value.replace(/\D/g, "").slice(0, 14))}
              placeholder="12345678901234"
              inputMode="numeric"
              className="ms-input w-full"
            />
          </div>
        </div>
      </div>

      {/* Contact Section */}
      <div className="ms-card p-6 mb-6">
        <h3 className="text-lg font-semibold mb-4">Contact</h3>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="block text-sm font-medium mb-2">Email *</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="contact@garage.fr"
              className="ms-input w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Téléphone</label>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="01 23 45 67 89"
              className="ms-input w-full"
            />
          </div>
        </div>
      </div>

      {/* Partner Badge Section */}
      <div className="ms-card p-6 mb-6">
        <h3 className="text-lg font-semibold mb-4">Badge Partenaire</h3>
        <div className="flex items-start gap-6">
          {/* Badge preview */}
          <div className="w-32 h-10 flex items-center justify-center">
            {partnerBadgeEffective ? (
              <img
                src="/brand/partner-badge.svg"
                alt="Badge Partenaire SafeMotor"
                className="h-8"
              />
            ) : (
              <span className="text-xs text-muted2 italic">Désactivé</span>
            )}
          </div>
          <div className="flex-1">
            {partnerBadgeAdminOverride !== "NONE" ? (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-800">
                <span className="font-medium">Géré par l&apos;administrateur</span>
                <p className="text-xs mt-1">
                  {partnerBadgeAdminOverride === "FORCE_ON"
                    ? "Le badge partenaire est activé par l'administration."
                    : "Le badge partenaire est désactivé par l'administration."}
                </p>
              </div>
            ) : (
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={partnerBadgeEnabled}
                  onChange={(e) => setPartnerBadgeEnabled(e.target.checked)}
                  className="w-5 h-5 rounded border-2 border-[var(--ms-border)] accent-[var(--ms-primary)]"
                />
                <div>
                  <span className="font-medium">Afficher le badge &quot;Partenaire SafeMotor&quot;</span>
                  <p className="text-xs text-muted2 mt-0.5">
                    Apparaît sur vos PDFs (ordre de réparation, devis, factures, etc.)
                  </p>
                </div>
              </label>
            )}
          </div>
        </div>
      </div>

      {/* Referral Section */}
      <div className="ms-card p-6 mb-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--ms-primary-light)]">
            <Gift size={20} className="text-[var(--ms-primary)]" />
          </div>
          <div>
            <h3 className="text-lg font-semibold">Parrainage</h3>
            <p className="text-xs text-muted2">
              Parrainez d&apos;autres garages et gagnez des mois gratuits
            </p>
          </div>
        </div>

        {/* Referral Code */}
        {referralCode && (
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Votre code parrainage</label>
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-[var(--ms-bg-subtle)] border border-[var(--ms-border)] rounded-lg px-4 py-3 font-mono text-lg font-bold tracking-wider">
                {referralCode}
              </div>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(referralCode);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                }}
                className="ms-btn ms-btn-secondary"
              >
                {copied ? (
                  <>
                    <CheckCircle size={16} className="mr-2 text-green-600" />
                    Copié !
                  </>
                ) : (
                  <>
                    <Copy size={16} className="mr-2" />
                    Copier
                  </>
                )}
              </button>
            </div>
            <p className="text-xs text-muted2 mt-2">
              Partagez ce code avec d&apos;autres garages. Quand ils souscrivent un abonnement, vous gagnez 1 mois gratuit !
            </p>
          </div>
        )}

        {/* Reward Display */}
        {referralRewardMonths > 0 && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center gap-2">
              <Gift size={20} className="text-green-600" />
              <span className="font-semibold text-green-800">
                {referralRewardMonths} mois offert{referralRewardMonths > 1 ? "s" : ""}
              </span>
            </div>
            <p className="text-xs text-green-700 mt-1">
              Récompense de parrainage cumulée. Ces mois seront appliqués à votre prochain renouvellement.
            </p>
          </div>
        )}

        {referralRewardMonths === 0 && (
          <p className="text-sm text-muted2">
            Vous n&apos;avez pas encore de récompenses. Partagez votre code pour commencer à parrainer !
          </p>
        )}
      </div>

      {/* Public Profile Section */}
      <div className="ms-card p-6 mb-6">
        <h3 className="text-lg font-semibold mb-4">Profil Public</h3>
        <div className="mb-4">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={publicProfileEnabled}
              onChange={(e) => setPublicProfileEnabled(e.target.checked)}
              disabled={!partnerBadgeEffective}
              className="w-5 h-5 rounded border-2 border-[var(--ms-border)] accent-[var(--ms-primary)] disabled:opacity-50"
            />
            <div>
              <span className="font-medium">Afficher mon garage sur la page &quot;Garages partenaires&quot;</span>
              <p className="text-xs text-muted2 mt-0.5">
                Votre garage sera visible publiquement avec les informations ci-dessous
              </p>
            </div>
          </label>
          {!partnerBadgeEffective && (
            <p className="text-xs text-amber-600 mt-2 ml-8">
              Le badge partenaire doit être actif pour apparaître sur la page publique.
            </p>
          )}
        </div>

        {publicProfileEnabled && partnerBadgeEffective && (
          <div className="border-t border-[var(--ms-border)] pt-4 mt-4">
            <p className="text-xs text-muted2 mb-4">
              🔒 Vous contrôlez les informations affichées publiquement. Seuls les champs remplis ci-dessous seront visibles.
            </p>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Téléphone public (optionnel)
                </label>
                <input
                  value={publicPhone}
                  onChange={(e) => setPublicPhone(e.target.value)}
                  placeholder="01 23 45 67 89"
                  className="ms-input w-full"
                />
                <p className="text-xs text-muted2 mt-1">Laissez vide pour ne pas afficher</p>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">
                  Site web (optionnel)
                </label>
                <input
                  value={publicWebsite}
                  onChange={(e) => setPublicWebsite(e.target.value)}
                  placeholder="https://www.mongarage.fr"
                  className="ms-input w-full"
                />
              </div>
            </div>
            <div className="mt-4 p-3 bg-[var(--ms-bg-subtle)] rounded-lg text-xs text-muted2">
              <strong>Informations affichées publiquement :</strong>
              <ul className="mt-1 list-disc list-inside">
                <li>Nom commercial : {displayName || "(non défini)"}</li>
                <li>Ville : {city || "(non définie)"} {postalCode ? `(${postalCode})` : ""}</li>
                {publicPhone && <li>Téléphone : {publicPhone}</li>}
                {publicWebsite && <li>Site web : {publicWebsite}</li>}
                {logoUrl && <li>Logo : affiché</li>}
              </ul>
            </div>
          </div>
        )}
      </div>

      {/* Address Section */}
      <div className="ms-card p-6">
        <h3 className="text-lg font-semibold mb-4">Adresse</h3>
        <div className="grid gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Adresse ligne 1</label>
            <input
              value={addressLine1}
              onChange={(e) => setAddressLine1(e.target.value)}
              placeholder="123 rue de la Mécanique"
              className="ms-input w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">
              Adresse ligne 2 (optionnel)
            </label>
            <input
              value={addressLine2}
              onChange={(e) => setAddressLine2(e.target.value)}
              placeholder="Bâtiment B, Zone industrielle"
              className="ms-input w-full"
            />
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <label className="block text-sm font-medium mb-2">Code postal</label>
              <input
                value={postalCode}
                onChange={(e) => setPostalCode(e.target.value)}
                placeholder="75001"
                className="ms-input w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Ville</label>
              <input
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Paris"
                className="ms-input w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Pays</label>
              <input
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                placeholder="France"
                className="ms-input w-full"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
