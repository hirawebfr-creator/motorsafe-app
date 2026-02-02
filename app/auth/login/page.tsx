"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Shield, Mail, Lock, ArrowRight, Sparkles, Check, AlertCircle, Eye, EyeOff } from "lucide-react";

// ============================================================================
// LOGIN PAGE - SafeMotor
// Design moderne avec gradient et animations
// ============================================================================

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

// Error messages mapping
const ERROR_MESSAGES: Record<string, string> = {
  google_access_denied: "Vous avez annulé la connexion Google.",
  invalid_state: "Session expirée. Veuillez réessayer.",
  no_code: "Erreur de connexion Google. Veuillez réessayer.",
  token_exchange_failed: "Erreur de connexion Google. Veuillez réessayer.",
  user_info_failed: "Impossible de récupérer vos informations Google.",
  email_not_verified: "Votre email Google n'est pas vérifié.",
  account_rejected: "Votre compte a été refusé.",
  server_error: "Erreur serveur. Veuillez réessayer.",
};

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  // Check for OAuth errors in URL
  useEffect(() => {
    const error = searchParams.get("error");
    if (error) {
      setGlobalError(ERROR_MESSAGES[error] || "Erreur de connexion");
    }
  }, [searchParams]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!formData.email) {
      newErrors.email = "L'email est requis";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Format d'email invalide";
    }
    if (!formData.password) {
      newErrors.password = "Le mot de passe est requis";
    } else if (formData.password.length < 8) {
      newErrors.password = "Minimum 8 caractères";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);
    setErrors({});
    setGlobalError(null);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, rememberMe }),
      });

      const data = await response.json();

      if (response.status === 403) {
        window.location.href = "/pro/en-attente";
        return;
      }

      if (data.ok) {
        router.push("/dashboard");
      } else {
        const errorMsg =
          typeof data.error === "string"
            ? data.error
            : data.error?.message || "Email ou mot de passe incorrect";
        setGlobalError(errorMsg);
      }
    } catch {
      setGlobalError("Impossible de se connecter au serveur");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    setIsGoogleLoading(true);
    setGlobalError(null);
    window.location.href = "/api/auth/google";
  };

  const features = [
    "Signature électronique légale",
    "Dossiers prêts pour assurance",
    "IA d'aide juridique",
    "Traçabilité complète",
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
          width: "50%",
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
              Protection juridique pour garages
            </span>
          </div>

          <h1
            style={{
              fontSize: "42px",
              fontWeight: 800,
              color: "#fff",
              lineHeight: 1.2,
              marginBottom: "16px",
            }}
          >
            Protégez votre garage contre les litiges
          </h1>

          <p
            style={{
              fontSize: "18px",
              color: "rgba(255, 255, 255, 0.6)",
              lineHeight: 1.6,
              marginBottom: "40px",
              maxWidth: "480px",
            }}
          >
            SafeMotor ne sert pas à mieux réparer une voiture. Il sert à éviter que la réparation vous retombe dessus.
          </p>

          {/* Features list */}
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {features.map((feature, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: "28px",
                    height: "28px",
                    borderRadius: "8px",
                    background: "rgba(16, 185, 129, 0.15)",
                    border: "1px solid rgba(16, 185, 129, 0.3)",
                  }}
                >
                  <Check size={14} color="#10B981" />
                </div>
                <span style={{ fontSize: "15px", color: "rgba(255, 255, 255, 0.8)" }}>{feature}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div style={{ position: "relative", zIndex: 1 }}>
          <p style={{ fontSize: "13px", color: "rgba(255, 255, 255, 0.4)" }}>
            © 2026 SafeMotor · Tous droits réservés
          </p>
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "24px",
          background: "#fff",
        }}
        className="lg:w-1/2"
      >
        <div style={{ width: "100%", maxWidth: "400px" }}>
          {/* Mobile Logo */}
          <div style={{ textAlign: "center", marginBottom: "32px" }} className="lg:hidden">
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
          <div style={{ textAlign: "center", marginBottom: "32px" }}>
            <h1 style={{ fontSize: "28px", fontWeight: 700, color: "#111827", marginBottom: "8px" }}>
              Connexion
            </h1>
            <p style={{ fontSize: "15px", color: "#6B7280" }}>
              Accédez à votre espace SafeMotor
            </p>
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
                marginBottom: "24px",
              }}
            >
              <AlertCircle size={18} color="#EF4444" />
              <span style={{ fontSize: "14px", color: "#DC2626" }}>{globalError}</span>
            </div>
          )}

          {/* Google Login Button */}
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={isGoogleLoading || isLoading}
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
            {isGoogleLoading ? "Connexion..." : "Continuer avec Google"}
          </button>

          {/* Divider */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "16px",
              margin: "24px 0",
            }}
          >
            <div style={{ flex: 1, height: "1px", background: "#E5E7EB" }} />
            <span style={{ fontSize: "13px", color: "#9CA3AF", fontWeight: 500 }}>ou</span>
            <div style={{ flex: 1, height: "1px", background: "#E5E7EB" }} />
          </div>

          {/* Email/Password Form */}
          <form onSubmit={handleSubmit}>
            {/* Email */}
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
                Email
              </label>
              <div style={{ position: "relative" }}>
                <Mail
                  size={18}
                  color="#9CA3AF"
                  style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)" }}
                />
                <input
                  type="email"
                  placeholder="vous@garage.fr"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  disabled={isLoading}
                  style={{
                    width: "100%",
                    height: "48px",
                    paddingLeft: "44px",
                    paddingRight: "16px",
                    borderRadius: "12px",
                    border: errors.email ? "1px solid #EF4444" : "1px solid #E5E7EB",
                    fontSize: "15px",
                    color: "#111827",
                    outline: "none",
                    transition: "border-color 0.15s ease",
                  }}
                  onFocus={(e) => (e.currentTarget.style.borderColor = "#6366F1")}
                  onBlur={(e) => (e.currentTarget.style.borderColor = errors.email ? "#EF4444" : "#E5E7EB")}
                />
              </div>
              {errors.email && (
                <p style={{ fontSize: "13px", color: "#EF4444", marginTop: "6px" }}>{errors.email}</p>
              )}
            </div>

            {/* Password */}
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
                Mot de passe
              </label>
              <div style={{ position: "relative" }}>
                <Lock
                  size={18}
                  color="#9CA3AF"
                  style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)" }}
                />
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  disabled={isLoading}
                  style={{
                    width: "100%",
                    height: "48px",
                    paddingLeft: "44px",
                    paddingRight: "48px",
                    borderRadius: "12px",
                    border: errors.password ? "1px solid #EF4444" : "1px solid #E5E7EB",
                    fontSize: "15px",
                    color: "#111827",
                    outline: "none",
                    transition: "border-color 0.15s ease",
                  }}
                  onFocus={(e) => (e.currentTarget.style.borderColor = "#6366F1")}
                  onBlur={(e) => (e.currentTarget.style.borderColor = errors.password ? "#EF4444" : "#E5E7EB")}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: "absolute",
                    right: "12px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    padding: "4px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeOff size={18} color="#9CA3AF" />
                  ) : (
                    <Eye size={18} color="#9CA3AF" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p style={{ fontSize: "13px", color: "#EF4444", marginTop: "6px" }}>{errors.password}</p>
              )}
            </div>

            {/* Remember me + Forgot password */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  cursor: "pointer",
                  userSelect: "none",
                }}
              >
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  style={{
                    width: "18px",
                    height: "18px",
                    borderRadius: "4px",
                    cursor: "pointer",
                    accentColor: "#6366F1",
                  }}
                />
                <span style={{ fontSize: "14px", color: "#374151" }}>Rester connecté</span>
              </label>
              <Link
                href="/auth/forgot-password"
                style={{
                  fontSize: "14px",
                  color: "#6366F1",
                  textDecoration: "none",
                  fontWeight: 500,
                }}
              >
                Mot de passe oublié ?
              </Link>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                width: "100%",
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
                  Se connecter
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>

          {/* Sign up link */}
          <div
            style={{
              marginTop: "32px",
              paddingTop: "24px",
              borderTop: "1px solid #E5E7EB",
              textAlign: "center",
            }}
          >
            <p style={{ fontSize: "14px", color: "#6B7280" }}>
              Pas encore de compte ?{" "}
              <Link
                href="/pro/inscription"
                style={{
                  color: "#6366F1",
                  textDecoration: "none",
                  fontWeight: 600,
                }}
              >
                Créer un compte
              </Link>
            </p>
          </div>

          {/* Footer links */}
          <div
            style={{
              marginTop: "24px",
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

export default function LoginPage() {
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
      <LoginContent />
    </Suspense>
  );
}
