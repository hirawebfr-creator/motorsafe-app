"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Shield,
  Mail,
  Lock,
  Building2,
  Phone,
  MapPin,
  FileText,
  User,
  ArrowRight,
  Sparkles,
  Check,
  AlertCircle,
} from "lucide-react";

// ============================================================================
// INSCRIPTION PAGE - SafeMotor
// Design moderne avec gradient et animations
// ============================================================================

// PARTNER-PROGRAM-01: Cookie utilities for ref tracking
const REF_COOKIE_NAME = "sm_ref";
const REF_COOKIE_DAYS = 30;

function setRefCookie(refCode: string) {
  const expires = new Date();
  expires.setDate(expires.getDate() + REF_COOKIE_DAYS);
  document.cookie = `${REF_COOKIE_NAME}=${encodeURIComponent(refCode)};expires=${expires.toUTCString()};path=/;SameSite=Lax`;
  try {
    localStorage.setItem(REF_COOKIE_NAME, refCode);
  } catch {
    // Ignore localStorage errors
  }
}

function getRefCode(): string | null {
  const match = document.cookie.match(new RegExp(`${REF_COOKIE_NAME}=([^;]+)`));
  if (match) return decodeURIComponent(match[1]);
  try {
    return localStorage.getItem(REF_COOKIE_NAME);
  } catch {
    return null;
  }
}

// Google Icon SVG
function GoogleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  );
}

// Input field component with icon
interface FormInputProps {
  label: string;
  type?: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  icon: React.ReactNode;
  error?: string;
  required?: boolean;
  disabled?: boolean;
}

function FormInput({
  label,
  type = "text",
  placeholder,
  value,
  onChange,
  icon,
  error,
  required,
  disabled,
}: FormInputProps) {
  return (
    <div style={{ marginBottom: "16px" }}>
      <label
        style={{
          display: "block",
          fontSize: "14px",
          fontWeight: 500,
          color: "#374151",
          marginBottom: "6px",
        }}
      >
        {label}
        {required && <span style={{ color: "#EF4444", marginLeft: "2px" }}>*</span>}
      </label>
      <div style={{ position: "relative" }}>
        <div
          style={{
            position: "absolute",
            left: "14px",
            top: "50%",
            transform: "translateY(-50%)",
            color: "#9CA3AF",
          }}
        >
          {icon}
        </div>
        <input
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          required={required}
          style={{
            width: "100%",
            height: "48px",
            paddingLeft: "44px",
            paddingRight: "16px",
            borderRadius: "12px",
            border: error ? "1px solid #EF4444" : "1px solid #E5E7EB",
            fontSize: "15px",
            color: "#111827",
            outline: "none",
            transition: "border-color 0.15s ease",
            background: disabled ? "#F9FAFB" : "#fff",
          }}
          onFocus={(e) => {
            if (!disabled) e.currentTarget.style.borderColor = "#6366F1";
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = error ? "#EF4444" : "#E5E7EB";
          }}
        />
      </div>
      {error && (
        <p style={{ fontSize: "13px", color: "#EF4444", marginTop: "6px" }}>{error}</p>
      )}
    </div>
  );
}

function InscriptionContent() {
  const searchParams = useSearchParams();
  const [formData, setFormData] = useState({
    garageName: "",
    garageEmail: "",
    phone: "",
    address: "",
    siret: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [partnerRef, setPartnerRef] = useState<string | null>(null);
  const [step, setStep] = useState(1); // 1: garage info, 2: account info

  // PARTNER-PROGRAM-01: Capture ref from URL
  useEffect(() => {
    const refFromUrl = searchParams.get("ref");
    if (refFromUrl) {
      setRefCookie(refFromUrl.toUpperCase());
      setPartnerRef(refFromUrl.toUpperCase());
    } else {
      const storedRef = getRefCode();
      if (storedRef) {
        setPartnerRef(storedRef);
      }
    }
  }, [searchParams]);

  const validateStep1 = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!formData.garageName.trim()) {
      newErrors.garageName = "Le nom du garage est requis";
    }
    if (!formData.garageEmail.trim()) {
      newErrors.garageEmail = "L'email du garage est requis";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.garageEmail)) {
      newErrors.garageEmail = "Format d'email invalide";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!formData.email.trim()) {
      newErrors.email = "L'email est requis";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Format d'email invalide";
    }
    if (!formData.password) {
      newErrors.password = "Le mot de passe est requis";
    } else if (formData.password.length < 8) {
      newErrors.password = "Minimum 8 caractères";
    }
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Les mots de passe ne correspondent pas";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep1()) {
      setStep(2);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateStep2()) return;

    setIsLoading(true);
    setErrors({});
    setGlobalError(null);

    try {
      const res = await fetch("/api/auth/register-pro", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          garageName: formData.garageName,
          garageEmail: formData.garageEmail,
          phone: formData.phone,
          address: formData.address,
          siret: formData.siret,
          email: formData.email,
          password: formData.password,
          partnerRef: partnerRef || undefined,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        const message =
          typeof json?.error === "string"
            ? json.error
            : json?.error?.message || "Erreur serveur.";
        throw new Error(message);
      }
      window.location.href = "/pro/en-attente";
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erreur serveur.";
      setGlobalError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignup = () => {
    setIsGoogleLoading(true);
    setGlobalError(null);
    window.location.href = "/api/auth/google?mode=signup";
  };

  const features = [
    "Signature électronique légale",
    "Dossiers prêts pour assurance",
    "IA d'aide juridique",
    "14 jours d'essai gratuit",
  ];

  const steps = [
    { num: 1, label: "Informations garage" },
    { num: 2, label: "Compte responsable" },
  ];

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        background: "#0A0A0F",
      }}
    >
      {/* Left Panel - Branding */}
      <div
        style={{
          display: "none",
          width: "45%",
          background: "linear-gradient(135deg, #0A0A0F 0%, #1A1A2E 100%)",
          padding: "48px",
          position: "relative",
          overflow: "hidden",
        }}
        className="lg:flex lg:flex-col lg:justify-between"
      >
        {/* Decorative gradient orbs */}
        <div
          style={{
            position: "absolute",
            top: "-100px",
            right: "-100px",
            width: "400px",
            height: "400px",
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(99, 102, 241, 0.3) 0%, transparent 70%)",
            filter: "blur(60px)",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: "-50px",
            left: "-50px",
            width: "300px",
            height: "300px",
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(139, 92, 246, 0.2) 0%, transparent 70%)",
            filter: "blur(40px)",
          }}
        />

        {/* Logo */}
        <div style={{ position: "relative", zIndex: 1 }}>
          <Link href="/" style={{ display: "inline-flex", alignItems: "center", gap: "12px", textDecoration: "none" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: "48px",
                height: "48px",
                borderRadius: "14px",
                background: "linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)",
                boxShadow: "0 8px 24px rgba(99, 102, 241, 0.4)",
              }}
            >
              <Shield size={24} color="#fff" />
            </div>
            <span style={{ fontSize: "24px", fontWeight: 700, color: "#fff" }}>SafeMotor</span>
          </Link>
        </div>

        {/* Center content */}
        <div style={{ position: "relative", zIndex: 1 }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              padding: "8px 16px",
              borderRadius: "100px",
              background: "rgba(99, 102, 241, 0.15)",
              border: "1px solid rgba(99, 102, 241, 0.3)",
              marginBottom: "24px",
            }}
          >
            <Sparkles size={16} color="#A5B4FC" />
            <span style={{ fontSize: "13px", color: "#A5B4FC", fontWeight: 500 }}>
              Rejoignez +500 garages
            </span>
          </div>

          <h1
            style={{
              fontSize: "40px",
              fontWeight: 800,
              color: "#fff",
              lineHeight: 1.2,
              marginBottom: "16px",
            }}
          >
            Commencez à protéger votre garage dès aujourd'hui
          </h1>

          <p
            style={{
              fontSize: "17px",
              color: "rgba(255, 255, 255, 0.6)",
              lineHeight: 1.6,
              marginBottom: "40px",
              maxWidth: "440px",
            }}
          >
            Inscription gratuite, sans engagement. Votre essai de 14 jours commence après validation.
          </p>

          {/* Features list */}
          <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            {features.map((feature, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: "26px",
                    height: "26px",
                    borderRadius: "8px",
                    background: "rgba(16, 185, 129, 0.15)",
                    border: "1px solid rgba(16, 185, 129, 0.3)",
                  }}
                >
                  <Check size={13} color="#10B981" />
                </div>
                <span style={{ fontSize: "15px", color: "rgba(255, 255, 255, 0.8)" }}>{feature}</span>
              </div>
            ))}
          </div>

          {/* Partner badge */}
          {partnerRef && (
            <div
              style={{
                marginTop: "32px",
                padding: "12px 16px",
                borderRadius: "12px",
                background: "rgba(16, 185, 129, 0.1)",
                border: "1px solid rgba(16, 185, 129, 0.3)",
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <Check size={16} color="#10B981" />
              <span style={{ fontSize: "14px", color: "#10B981", fontWeight: 500 }}>
                Parrainage actif : {partnerRef}
              </span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ position: "relative", zIndex: 1 }}>
          <p style={{ fontSize: "13px", color: "rgba(255, 255, 255, 0.4)" }}>
            © 2026 SafeMotor · Tous droits réservés
          </p>
        </div>
      </div>

      {/* Right Panel - Registration Form */}
      <div
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "24px",
          background: "#fff",
          overflowY: "auto",
        }}
        className="lg:w-[55%]"
      >
        <div style={{ width: "100%", maxWidth: "480px", paddingTop: "24px", paddingBottom: "24px" }}>
          {/* Mobile Logo */}
          <div style={{ textAlign: "center", marginBottom: "24px" }} className="lg:hidden">
            <Link href="/" style={{ display: "inline-flex", alignItems: "center", gap: "10px", textDecoration: "none" }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: "44px",
                  height: "44px",
                  borderRadius: "12px",
                  background: "linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)",
                }}
              >
                <Shield size={22} color="#fff" />
              </div>
              <span style={{ fontSize: "22px", fontWeight: 700, color: "#111827" }}>SafeMotor</span>
            </Link>
          </div>

          {/* Header */}
          <div style={{ textAlign: "center", marginBottom: "24px" }}>
            <h1 style={{ fontSize: "26px", fontWeight: 700, color: "#111827", marginBottom: "8px" }}>
              Créer un compte pro
            </h1>
            <p style={{ fontSize: "15px", color: "#6B7280" }}>
              Remplissez le formulaire pour demander votre accès
            </p>
          </div>

          {/* Step indicator */}
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              gap: "8px",
              marginBottom: "24px",
            }}
          >
            {steps.map((s) => (
              <div
                key={s.num}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                <div
                  style={{
                    width: "28px",
                    height: "28px",
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "13px",
                    fontWeight: 600,
                    background: step >= s.num ? "linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)" : "#E5E7EB",
                    color: step >= s.num ? "#fff" : "#9CA3AF",
                    transition: "all 0.2s ease",
                  }}
                >
                  {step > s.num ? <Check size={14} /> : s.num}
                </div>
                <span
                  style={{
                    fontSize: "13px",
                    fontWeight: 500,
                    color: step >= s.num ? "#374151" : "#9CA3AF",
                  }}
                >
                  {s.label}
                </span>
                {s.num < steps.length && (
                  <div
                    style={{
                      width: "24px",
                      height: "2px",
                      background: step > s.num ? "#6366F1" : "#E5E7EB",
                      borderRadius: "1px",
                      marginLeft: "8px",
                    }}
                  />
                )}
              </div>
            ))}
          </div>

          {/* Global Error */}
          {globalError && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                padding: "12px 16px",
                borderRadius: "10px",
                background: "#FEF2F2",
                border: "1px solid #FECACA",
                marginBottom: "20px",
              }}
            >
              <AlertCircle size={18} color="#EF4444" />
              <span style={{ fontSize: "14px", color: "#DC2626" }}>{globalError}</span>
            </div>
          )}

          {step === 1 && (
            <>
              {/* Google Signup */}
              <button
                type="button"
                onClick={handleGoogleSignup}
                disabled={isGoogleLoading}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "12px",
                  width: "100%",
                  height: "48px",
                  borderRadius: "12px",
                  border: "1px solid #E5E7EB",
                  background: "#fff",
                  fontSize: "15px",
                  fontWeight: 600,
                  color: "#374151",
                  cursor: isGoogleLoading ? "wait" : "pointer",
                  opacity: isGoogleLoading ? 0.7 : 1,
                  transition: "all 0.15s ease",
                }}
                onMouseEnter={(e) => {
                  if (!isGoogleLoading) {
                    e.currentTarget.style.background = "#F9FAFB";
                    e.currentTarget.style.borderColor = "#D1D5DB";
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "#fff";
                  e.currentTarget.style.borderColor = "#E5E7EB";
                }}
              >
                {isGoogleLoading ? (
                  <div
                    style={{
                      width: "20px",
                      height: "20px",
                      border: "2px solid #E5E7EB",
                      borderTopColor: "#6366F1",
                      borderRadius: "50%",
                      animation: "spin 0.8s linear infinite",
                    }}
                  />
                ) : (
                  <GoogleIcon />
                )}
                {isGoogleLoading ? "Connexion..." : "S'inscrire avec Google"}
              </button>

              {/* Divider */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "16px",
                  margin: "20px 0",
                }}
              >
                <div style={{ flex: 1, height: "1px", background: "#E5E7EB" }} />
                <span style={{ fontSize: "13px", color: "#9CA3AF", fontWeight: 500 }}>ou</span>
                <div style={{ flex: 1, height: "1px", background: "#E5E7EB" }} />
              </div>
            </>
          )}

          <form onSubmit={step === 1 ? (e) => { e.preventDefault(); handleNext(); } : handleSubmit}>
            {step === 1 && (
              <>
                <FormInput
                  label="Nom du garage"
                  placeholder="Garage Horizon"
                  value={formData.garageName}
                  onChange={(v) => setFormData({ ...formData, garageName: v })}
                  icon={<Building2 size={18} />}
                  error={errors.garageName}
                  required
                />
                <FormInput
                  label="Email du garage"
                  type="email"
                  placeholder="contact@garagehorizon.fr"
                  value={formData.garageEmail}
                  onChange={(v) => setFormData({ ...formData, garageEmail: v })}
                  icon={<Mail size={18} />}
                  error={errors.garageEmail}
                  required
                />
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                  <FormInput
                    label="Téléphone"
                    placeholder="+33 6 00 00 00 00"
                    value={formData.phone}
                    onChange={(v) => setFormData({ ...formData, phone: v })}
                    icon={<Phone size={18} />}
                  />
                  <FormInput
                    label="SIRET"
                    placeholder="123 456 789 00010"
                    value={formData.siret}
                    onChange={(v) => setFormData({ ...formData, siret: v })}
                    icon={<FileText size={18} />}
                  />
                </div>
                <FormInput
                  label="Adresse"
                  placeholder="12 rue des Ateliers, 69000 Lyon"
                  value={formData.address}
                  onChange={(v) => setFormData({ ...formData, address: v })}
                  icon={<MapPin size={18} />}
                />
              </>
            )}

            {step === 2 && (
              <>
                <FormInput
                  label="Email responsable"
                  type="email"
                  placeholder="responsable@garage.fr"
                  value={formData.email}
                  onChange={(v) => setFormData({ ...formData, email: v })}
                  icon={<User size={18} />}
                  error={errors.email}
                  required
                />
                <FormInput
                  label="Mot de passe"
                  type="password"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(v) => setFormData({ ...formData, password: v })}
                  icon={<Lock size={18} />}
                  error={errors.password}
                  required
                />
                <FormInput
                  label="Confirmer le mot de passe"
                  type="password"
                  placeholder="••••••••"
                  value={formData.confirmPassword}
                  onChange={(v) => setFormData({ ...formData, confirmPassword: v })}
                  icon={<Lock size={18} />}
                  error={errors.confirmPassword}
                  required
                />
              </>
            )}

            {/* Action buttons */}
            <div
              style={{
                display: "flex",
                gap: "12px",
                marginTop: "8px",
              }}
            >
              {step === 2 && (
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  style={{
                    flex: 1,
                    height: "48px",
                    borderRadius: "12px",
                    border: "1px solid #E5E7EB",
                    background: "#fff",
                    fontSize: "15px",
                    fontWeight: 600,
                    color: "#374151",
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "#F9FAFB";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "#fff";
                  }}
                >
                  Retour
                </button>
              )}
              <button
                type="submit"
                disabled={isLoading}
                style={{
                  flex: step === 2 ? 2 : 1,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  height: "48px",
                  borderRadius: "12px",
                  border: "none",
                  background: "linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)",
                  fontSize: "15px",
                  fontWeight: 600,
                  color: "#fff",
                  cursor: isLoading ? "wait" : "pointer",
                  boxShadow: "0 4px 14px rgba(99, 102, 241, 0.4)",
                  opacity: isLoading ? 0.8 : 1,
                  transition: "all 0.15s ease",
                }}
                onMouseEnter={(e) => {
                  if (!isLoading) e.currentTarget.style.transform = "translateY(-1px)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                }}
              >
                {isLoading ? (
                  <div
                    style={{
                      width: "20px",
                      height: "20px",
                      border: "2px solid rgba(255,255,255,0.3)",
                      borderTopColor: "#fff",
                      borderRadius: "50%",
                      animation: "spin 0.8s linear infinite",
                    }}
                  />
                ) : (
                  <>
                    {step === 1 ? "Continuer" : "Envoyer la demande"}
                    <ArrowRight size={18} />
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Login link */}
          <div
            style={{
              marginTop: "28px",
              paddingTop: "20px",
              borderTop: "1px solid #E5E7EB",
              textAlign: "center",
            }}
          >
            <p style={{ fontSize: "14px", color: "#6B7280" }}>
              Déjà un compte ?{" "}
              <Link
                href="/auth/login"
                style={{
                  color: "#6366F1",
                  textDecoration: "none",
                  fontWeight: 600,
                }}
              >
                Se connecter
              </Link>
            </p>
          </div>

          {/* Footer links */}
          <div
            style={{
              marginTop: "20px",
              display: "flex",
              justifyContent: "center",
              gap: "24px",
            }}
          >
            {[
              { label: "CGU", href: "/cgu" },
              { label: "Confidentialité", href: "/politique-confidentialite" },
              { label: "Contact", href: "/contact" },
            ].map((link, i) => (
              <Link
                key={i}
                href={link.href}
                style={{ fontSize: "13px", color: "#9CA3AF", textDecoration: "none" }}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Spin animation */}
          <style dangerouslySetInnerHTML={{ __html: `
            @keyframes spin {
              to { transform: rotate(360deg); }
            }
          `}} />
        </div>
      </div>
    </div>
  );
}

export default function ProInscriptionPage() {
  return (
    <Suspense
      fallback={
        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "#fff",
          }}
        >
          <div
            style={{
              width: "32px",
              height: "32px",
              border: "3px solid #E5E7EB",
              borderTopColor: "#6366F1",
              borderRadius: "50%",
              animation: "spin 0.8s linear infinite",
            }}
          />
          <style dangerouslySetInnerHTML={{ __html: `
            @keyframes spin { to { transform: rotate(360deg); } }
          `}} />
        </div>
      }
    >
      <InscriptionContent />
    </Suspense>
  );
}
