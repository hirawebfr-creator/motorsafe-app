"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import {
  FileText,
  CheckCircle,
  AlertTriangle,
  Clock,
  Shield,
  Loader2,
  ExternalLink,
  Check,
  XCircle,
  Building2,
  Car,
  User,
  Scale,
  Info,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Link as LinkIcon,
  Download,
  RefreshCw,
} from "lucide-react";

type LegalReference = {
  label: string;
  articleRef?: string;
  sourceUrl?: string;
};

type LegalClause = {
  id: string;
  title: string;
  text: string;
  level: "info" | "important";
  references: LegalReference[];
};

type SignatureData = {
  id: string;
  documentType: string;
  documentTypeLabel: string;
  status: string;
  garageName: string;
  expiresAt: string;
  signerEmail: string | null;
  signedAt: string | null;
  signerNameDeclared: string | null;
  documentSummary: {
    vehiclePlate?: string;
    vehicleBrand?: string;
    vehicleModel?: string;
    clientName?: string;
    createdAt?: string;
    type?: string;
    tags?: string[];
  };
  pdfUrl: string;
  legalClauses?: LegalClause[];
  legalModules?: string[];
};

type StatusCfg = { gradient: string; bg: string; text: string; label: string };
const STATUS_CONFIG: Record<string, StatusCfg> = {
  SENT: { gradient: "linear-gradient(135deg, #4F46E5 0%, #6366F1 100%)", bg: "#EEF2FF", text: "#4F46E5", label: "En attente de signature" },
  VIEWED: { gradient: "linear-gradient(135deg, #F59E0B 0%, #D97706 100%)", bg: "#FEF3C7", text: "#D97706", label: "Document consulte" },
  SIGNED: { gradient: "linear-gradient(135deg, #10B981 0%, #059669 100%)", bg: "#D1FAE5", text: "#059669", label: "Signe avec succes" },
  DECLINED: { gradient: "linear-gradient(135deg, #EF4444 0%, #DC2626 100%)", bg: "#FEE2E2", text: "#DC2626", label: "Refuse" },
  EXPIRED: { gradient: "linear-gradient(135deg, #6B7280 0%, #4B5563 100%)", bg: "#F3F4F6", text: "#6B7280", label: "Lien expire" },
  VOID: { gradient: "linear-gradient(135deg, #EF4444 0%, #DC2626 100%)", bg: "#FEE2E2", text: "#DC2626", label: "Demande annulee" },
};

const ERROR_MESSAGES: Record<string, { title: string; description: string }> = {
  EXPIRED: {
    title: "Ce lien de signature a expire",
    description: "Le delai de signature est depasse. Veuillez contacter le garage pour qu'il vous renvoie un nouveau lien.",
  },
  VOID: {
    title: "Demande annulee",
    description: "Cette demande de signature a ete annulee par le garage. Veuillez le contacter pour plus d'informations.",
  },
  ALREADY_SIGNED: {
    title: "Document deja signe",
    description: "Ce document a deja ete signe. Vous pouvez fermer cette page.",
  },
  NOT_FOUND: {
    title: "Lien invalide",
    description: "Ce lien de signature n'existe pas ou n'est plus valide. Verifiez que vous avez utilise le bon lien.",
  },
  SUBSCRIPTION_INACTIVE: {
    title: "Service temporairement indisponible",
    description: "Le garage n'a pas d'abonnement actif. Veuillez le contacter pour qu'il active son abonnement.",
  },
};

export default function SignPage() {
  const params = useParams();
  const token = params?.token as string;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<SignatureData | null>(null);
  
  const [hasReadDoc, setHasReadDoc] = useState(false);
  const [hasAcceptedClauses, setHasAcceptedClauses] = useState(false);
  const [showReferences, setShowReferences] = useState(false);
  const [signerName, setSignerName] = useState("");
  const [signerEmail, setSignerEmail] = useState("");
  const [signing, setSigning] = useState(false);
  const [signed, setSigned] = useState(false);

  const fetchData = useCallback(async () => {
    if (!token) return;
    
    try {
      setLoading(true);
      setError(null);

      const res = await fetch(`/api/signatures/${token}`);
      const json = await res.json();

      if (!res.ok) {
        if (json.error?.code === "SUBSCRIPTION_INACTIVE") {
          setError("SUBSCRIPTION_INACTIVE");
        } else {
          setError(json.error?.message || "NOT_FOUND");
        }
        return;
      }

      setData(json.data);
      setSignerEmail(json.data.signerEmail || "");

      if (json.data.status === "SIGNED") {
        setSigned(true);
        setSignerName(json.data.signerNameDeclared || "");
      }

      if (json.data.status === "SENT") {
        await fetch(`/api/signatures/${token}/viewed`, { method: "POST" });
      }
    } catch {
      setError("NOT_FOUND");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSign = async () => {
    if (!hasReadDoc || !hasAcceptedClauses || !signerName.trim() || signerName.trim().length < 2) {
      return;
    }

    setSigning(true);
    try {
      const res = await fetch(`/api/signatures/${token}/sign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          signerName: signerName.trim(),
          signerEmail: signerEmail.trim() || null,
          accepted: true,
        }),
      });

      const json = await res.json();

      if (!res.ok) {
        if (json.error?.code === "SUBSCRIPTION_INACTIVE") {
          setError("SUBSCRIPTION_INACTIVE");
        } else {
          setError(json.error?.message || "Erreur lors de la signature");
        }
        return;
      }

      setSigned(true);
      await fetchData();
    } catch {
      setError("Erreur lors de la signature");
    } finally {
      setSigning(false);
    }
  };

  const spinKeyframes = `@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`;

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: "linear-gradient(135deg, #F8FAFC 0%, #E2E8F0 100%)", display: "flex", alignItems: "center", justifyContent: "center", padding: "24px" }}>
        <style>{spinKeyframes}</style>
        <div style={{ textAlign: "center" }}>
          <div style={{ width: "64px", height: "64px", margin: "0 auto", borderRadius: "50%", border: "4px solid #E0E7FF", borderTopColor: "#4F46E5", animation: "spin 1s linear infinite" }} />
          <p style={{ marginTop: "20px", color: "#64748B", fontSize: "16px", fontWeight: 500 }}>Chargement du document...</p>
        </div>
      </div>
    );
  }

  if (error && !data) {
    const errorType = error.includes("expire") ? "EXPIRED" 
      : error === "SUBSCRIPTION_INACTIVE" ? "SUBSCRIPTION_INACTIVE"
      : error.includes("annule") ? "VOID"
      : "NOT_FOUND";
    const errorConfig = ERROR_MESSAGES[errorType] || ERROR_MESSAGES.NOT_FOUND;
    
    return (
      <div style={{ minHeight: "100vh", background: "linear-gradient(135deg, #F8FAFC 0%, #E2E8F0 100%)", display: "flex", alignItems: "center", justifyContent: "center", padding: "24px" }}>
        <div style={{ background: "#fff", borderRadius: "24px", boxShadow: "0 25px 50px rgba(0,0,0,0.1)", padding: "48px 32px", maxWidth: "440px", width: "100%", textAlign: "center" }}>
          <div style={{ width: "80px", height: "80px", borderRadius: "50%", background: "linear-gradient(135deg, #FEE2E2 0%, #FECACA 100%)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 24px" }}>
            <AlertTriangle size={40} color="#DC2626" />
          </div>
          <h1 style={{ fontSize: "22px", fontWeight: 700, color: "#1E293B", margin: "0 0 12px" }}>{errorConfig.title}</h1>
          <p style={{ fontSize: "15px", color: "#64748B", margin: "0 0 32px", lineHeight: 1.6 }}>{errorConfig.description}</p>
          
          <button
            onClick={() => window.location.reload()}
            style={{ width: "100%", padding: "16px 24px", background: "linear-gradient(135deg, #F1F5F9 0%, #E2E8F0 100%)", border: "none", borderRadius: "14px", fontSize: "15px", fontWeight: 600, color: "#475569", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "10px" }}
          >
            <RefreshCw size={18} />
            Reessayer
          </button>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const statusConfig = STATUS_CONFIG[data.status] || STATUS_CONFIG.SENT;
  const isExpired = data.status === "EXPIRED";
  const isVoid = data.status === "VOID";
  const isSigned = data.status === "SIGNED" || signed;
  const canSign = !isExpired && !isVoid && !isSigned && data.status !== "DECLINED";

  const inputStyle: React.CSSProperties = { width: "100%", padding: "16px 18px", borderRadius: "14px", border: "2px solid #E2E8F0", background: "#F8FAFC", fontSize: "16px", outline: "none", transition: "all 0.2s" };
  const checkboxContainerStyle: React.CSSProperties = { display: "flex", alignItems: "flex-start", gap: "14px", padding: "16px", borderRadius: "14px", background: "#F8FAFC", border: "2px solid #E2E8F0", cursor: "pointer", marginBottom: "12px", transition: "all 0.2s" };

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg, #F8FAFC 0%, #E2E8F0 100%)", padding: "24px 16px" }}>
      <style>{spinKeyframes}</style>
      <div style={{ maxWidth: "540px", margin: "0 auto" }}>
        
        <div style={{ textAlign: "center", marginBottom: "24px" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", background: "linear-gradient(135deg, #4F46E5 0%, #6366F1 100%)", color: "#fff", padding: "10px 20px", borderRadius: "50px", fontSize: "13px", fontWeight: 600, boxShadow: "0 4px 12px rgba(79, 70, 229, 0.3)" }}>
            <Shield size={16} />
            Signature electronique securisee
          </div>
        </div>

        <div style={{ background: "#fff", borderRadius: "24px", boxShadow: "0 25px 50px rgba(0,0,0,0.08)", overflow: "hidden" }}>
          
          <div style={{ background: statusConfig.gradient, padding: "32px 24px", color: "#fff", position: "relative", overflow: "hidden" }}>
            <div style={{ position: "absolute", right: "-30px", top: "-30px", width: "120px", height: "120px", borderRadius: "50%", background: "rgba(255,255,255,0.1)" }} />
            <div style={{ position: "absolute", left: "-20px", bottom: "-20px", width: "80px", height: "80px", borderRadius: "50%", background: "rgba(255,255,255,0.1)" }} />
            
            <div style={{ position: "relative" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
                <div style={{ width: "48px", height: "48px", borderRadius: "14px", background: "rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(8px)" }}>
                  <FileText size={24} />
                </div>
                <div>
                  <h1 style={{ fontSize: "20px", fontWeight: 700, margin: 0 }}>{data.documentTypeLabel}</h1>
                  <p style={{ fontSize: "14px", opacity: 0.9, margin: "4px 0 0" }}>{data.garageName}</p>
                </div>
              </div>
              
              <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", background: "rgba(255,255,255,0.2)", padding: "8px 14px", borderRadius: "10px", fontSize: "13px", fontWeight: 500, backdropFilter: "blur(8px)" }}>
                {isSigned ? <CheckCircle size={16} /> : isExpired || isVoid ? <XCircle size={16} /> : <Clock size={16} />}
                {statusConfig.label}
              </div>
            </div>
          </div>

          <div style={{ padding: "24px", borderBottom: "1px solid #F1F5F9" }}>
            <h3 style={{ fontSize: "13px", fontWeight: 600, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.5px", margin: "0 0 16px" }}>Informations</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {data.documentSummary.clientName && (
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: "#EEF2FF", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <User size={18} color="#4F46E5" />
                  </div>
                  <div>
                    <p style={{ fontSize: "12px", color: "#94A3B8", margin: 0 }}>Client</p>
                    <p style={{ fontSize: "15px", fontWeight: 600, color: "#1E293B", margin: "2px 0 0" }}>{data.documentSummary.clientName}</p>
                  </div>
                </div>
              )}
              {data.documentSummary.vehiclePlate && (
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: "#F0FDF4", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Car size={18} color="#10B981" />
                  </div>
                  <div>
                    <p style={{ fontSize: "12px", color: "#94A3B8", margin: 0 }}>Vehicule</p>
                    <p style={{ fontSize: "15px", fontWeight: 600, color: "#1E293B", margin: "2px 0 0" }}>{data.documentSummary.vehiclePlate} - {data.documentSummary.vehicleBrand} {data.documentSummary.vehicleModel}</p>
                  </div>
                </div>
              )}
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: "#FEF3C7", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Building2 size={18} color="#D97706" />
                </div>
                <div>
                  <p style={{ fontSize: "12px", color: "#94A3B8", margin: 0 }}>Etablissement</p>
                  <p style={{ fontSize: "15px", fontWeight: 600, color: "#1E293B", margin: "2px 0 0" }}>{data.garageName}</p>
                </div>
              </div>
            </div>
          </div>

          <div style={{ padding: "24px", borderBottom: "1px solid #F1F5F9" }}>
            <a
              href={data.pdfUrl}
              target="_blank"
              rel="noreferrer"
              style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "12px", width: "100%", padding: "18px", background: "linear-gradient(135deg, #F1F5F9 0%, #E2E8F0 100%)", borderRadius: "14px", fontSize: "15px", fontWeight: 600, color: "#475569", textDecoration: "none", transition: "all 0.2s" }}
            >
              <Download size={20} />
              Consulter le document PDF
              <ExternalLink size={16} />
            </a>
          </div>

          {data.legalClauses && data.legalClauses.length > 0 && !isSigned && (
            <div style={{ padding: "24px", borderBottom: "1px solid #F1F5F9", background: "#FFFBEB" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
                <Scale size={20} color="#D97706" />
                <h3 style={{ fontSize: "15px", fontWeight: 600, color: "#92400E", margin: 0 }}>Clauses importantes</h3>
              </div>
              
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {data.legalClauses.map((clause) => (
                  <div 
                    key={clause.id}
                    style={{ padding: "16px", borderRadius: "12px", background: clause.level === "important" ? "#FEF3C7" : "#fff", border: `1px solid ${clause.level === "important" ? "#FCD34D" : "#E2E8F0"}` }}
                  >
                    <div style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}>
                      {clause.level === "important" ? (
                        <AlertCircle size={18} color="#D97706" style={{ flexShrink: 0, marginTop: "2px" }} />
                      ) : (
                        <Info size={18} color="#64748B" style={{ flexShrink: 0, marginTop: "2px" }} />
                      )}
                      <div>
                        <p style={{ fontSize: "14px", fontWeight: 600, color: clause.level === "important" ? "#92400E" : "#1E293B", margin: "0 0 6px" }}>{clause.title}</p>
                        <p style={{ fontSize: "13px", color: "#64748B", margin: 0, lineHeight: 1.5 }}>{clause.text}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <button
                onClick={() => setShowReferences(!showReferences)}
                style={{ marginTop: "16px", display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", color: "#64748B", background: "none", border: "none", cursor: "pointer", padding: 0 }}
              >
                <LinkIcon size={14} />
                Voir les references legales
                {showReferences ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>

              {showReferences && (
                <div style={{ marginTop: "12px", padding: "16px", background: "#fff", borderRadius: "12px", border: "1px solid #E2E8F0" }}>
                  <p style={{ fontSize: "11px", fontWeight: 600, color: "#94A3B8", textTransform: "uppercase", margin: "0 0 10px" }}>References</p>
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    {data.legalClauses
                      .flatMap(c => c.references)
                      .filter((ref, i, arr) => arr.findIndex(r => r.label === ref.label && r.articleRef === ref.articleRef) === i)
                      .map((ref, i) => (
                        <div key={i} style={{ fontSize: "13px" }}>
                          {ref.sourceUrl ? (
                            <a href={ref.sourceUrl} target="_blank" rel="noreferrer" style={{ color: "#4F46E5", textDecoration: "none", display: "flex", alignItems: "center", gap: "6px" }}>
                              {ref.label} {ref.articleRef && `(${ref.articleRef})`}
                              <ExternalLink size={12} />
                            </a>
                          ) : (
                            <span style={{ color: "#64748B" }}>{ref.label} {ref.articleRef && `(${ref.articleRef})`}</span>
                          )}
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {isSigned && (
            <div style={{ padding: "48px 24px", textAlign: "center", background: "linear-gradient(135deg, #F0FDF4 0%, #DCFCE7 100%)" }}>
              <div style={{ width: "80px", height: "80px", borderRadius: "50%", background: "linear-gradient(135deg, #10B981 0%, #059669 100%)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 24px", boxShadow: "0 10px 30px rgba(16, 185, 129, 0.3)" }}>
                <CheckCircle size={40} color="#fff" />
              </div>
              <h2 style={{ fontSize: "24px", fontWeight: 700, color: "#065F46", margin: "0 0 12px" }}>Document signe</h2>
              <p style={{ fontSize: "16px", color: "#047857", margin: "0 0 8px" }}>
                Signe par <strong>{data.signerNameDeclared || signerName}</strong>
              </p>
              {data.signedAt && (
                <p style={{ fontSize: "14px", color: "#059669", margin: 0 }}>
                  Le {new Date(data.signedAt).toLocaleString("fr-FR")}
                </p>
              )}
              <div style={{ marginTop: "32px", padding: "16px", background: "rgba(255,255,255,0.6)", borderRadius: "12px" }}>
                <p style={{ fontSize: "14px", color: "#047857", margin: 0 }}>
                  Vous pouvez fermer cette page en toute securite.
                </p>
              </div>
            </div>
          )}

          {(isExpired || isVoid) && !isSigned && (
            <div style={{ padding: "48px 24px", textAlign: "center", background: "#F8FAFC" }}>
              <div style={{ width: "80px", height: "80px", borderRadius: "50%", background: isVoid ? "linear-gradient(135deg, #FEE2E2 0%, #FECACA 100%)" : "linear-gradient(135deg, #F1F5F9 0%, #E2E8F0 100%)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 24px" }}>
                {isVoid ? <XCircle size={40} color="#DC2626" /> : <Clock size={40} color="#64748B" />}
              </div>
              <h2 style={{ fontSize: "22px", fontWeight: 700, color: "#1E293B", margin: "0 0 12px" }}>
                {isVoid ? "Demande annulee" : "Lien expire"}
              </h2>
              <p style={{ fontSize: "15px", color: "#64748B", margin: "0 0 24px", lineHeight: 1.6 }}>
                {isVoid 
                  ? "Cette demande de signature a ete annulee par le garage."
                  : "Le delai de signature est depasse."
                }
              </p>
              <p style={{ fontSize: "14px", color: "#94A3B8" }}>
                Veuillez contacter <strong style={{ color: "#475569" }}>{data.garageName}</strong> pour obtenir un nouveau lien.
              </p>
            </div>
          )}

          {canSign && (
            <div style={{ padding: "24px" }}>
              <h3 style={{ fontSize: "17px", fontWeight: 600, color: "#1E293B", margin: "0 0 20px" }}>Signer le document</h3>

              <label style={{ ...checkboxContainerStyle, borderColor: hasReadDoc ? "#4F46E5" : "#E2E8F0", background: hasReadDoc ? "#EEF2FF" : "#F8FAFC" }}>
                <input
                  type="checkbox"
                  checked={hasReadDoc}
                  onChange={(e) => setHasReadDoc(e.target.checked)}
                  style={{ width: "24px", height: "24px", accentColor: "#4F46E5", cursor: "pointer" }}
                />
                <span style={{ fontSize: "14px", color: "#475569", lineHeight: 1.5 }}>
                  J&apos;ai consulte le document PDF ci-dessus.
                </span>
              </label>

              <label style={{ ...checkboxContainerStyle, borderColor: hasAcceptedClauses ? "#4F46E5" : "#E2E8F0", background: hasAcceptedClauses ? "#EEF2FF" : "#F8FAFC" }}>
                <input
                  type="checkbox"
                  checked={hasAcceptedClauses}
                  onChange={(e) => setHasAcceptedClauses(e.target.checked)}
                  style={{ width: "24px", height: "24px", accentColor: "#4F46E5", cursor: "pointer" }}
                />
                <span style={{ fontSize: "14px", color: "#475569", lineHeight: 1.5 }}>
                  J&apos;accepte les clauses ci-dessus. Je comprends que cette signature electronique a valeur d&apos;engagement.
                </span>
              </label>

              <div style={{ marginTop: "20px", marginBottom: "16px" }}>
                <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#475569", marginBottom: "8px" }}>
                  Nom et prenom *
                </label>
                <input
                  type="text"
                  value={signerName}
                  onChange={(e) => setSignerName(e.target.value)}
                  placeholder="Jean Dupont"
                  autoComplete="name"
                  style={inputStyle}
                />
              </div>

              <div style={{ marginBottom: "24px" }}>
                <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#475569", marginBottom: "8px" }}>
                  Email (optionnel)
                </label>
                <input
                  type="email"
                  value={signerEmail}
                  onChange={(e) => setSignerEmail(e.target.value)}
                  placeholder="jean.dupont@email.com"
                  autoComplete="email"
                  style={inputStyle}
                />
              </div>

              {error && typeof error === "string" && !ERROR_MESSAGES[error] && (
                <div style={{ marginBottom: "20px", padding: "14px 16px", background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: "12px", display: "flex", alignItems: "center", gap: "10px" }}>
                  <AlertTriangle size={18} color="#DC2626" />
                  <span style={{ fontSize: "14px", color: "#DC2626" }}>{error}</span>
                </div>
              )}

              <button
                onClick={handleSign}
                disabled={!hasReadDoc || !hasAcceptedClauses || signerName.trim().length < 2 || signing}
                style={{ 
                  width: "100%", 
                  padding: "18px 24px", 
                  background: (!hasReadDoc || !hasAcceptedClauses || signerName.trim().length < 2) 
                    ? "linear-gradient(135deg, #CBD5E1 0%, #94A3B8 100%)" 
                    : "linear-gradient(135deg, #4F46E5 0%, #6366F1 100%)", 
                  border: "none", 
                  borderRadius: "14px", 
                  fontSize: "16px", 
                  fontWeight: 600, 
                  color: "#fff", 
                  cursor: (!hasReadDoc || !hasAcceptedClauses || signerName.trim().length < 2 || signing) ? "not-allowed" : "pointer",
                  display: "flex", 
                  alignItems: "center", 
                  justifyContent: "center", 
                  gap: "10px",
                  boxShadow: (!hasReadDoc || !hasAcceptedClauses || signerName.trim().length < 2) ? "none" : "0 8px 20px rgba(79, 70, 229, 0.35)",
                  transition: "all 0.2s"
                }}
              >
                {signing ? (
                  <>
                    <Loader2 size={20} style={{ animation: "spin 1s linear infinite" }} />
                    Signature en cours...
                  </>
                ) : (
                  <>
                    <Check size={20} />
                    Signer le document
                  </>
                )}
              </button>
              
              {(!hasReadDoc || !hasAcceptedClauses || signerName.trim().length < 2) && (
                <p style={{ textAlign: "center", fontSize: "13px", color: "#94A3B8", marginTop: "16px" }}>
                  {!hasReadDoc 
                    ? "Veuillez d'abord consulter le PDF et cocher la case correspondante"
                    : !hasAcceptedClauses 
                    ? "Veuillez accepter les clauses pour continuer"
                    : "Veuillez entrer votre nom complet"
                  }
                </p>
              )}
            </div>
          )}
        </div>

        <div style={{ textAlign: "center", marginTop: "32px", padding: "0 16px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", fontSize: "13px", color: "#64748B" }}>
            <Shield size={14} />
            Signature securisee via SafeMotor
          </div>
          {!isSigned && !isExpired && !isVoid && (
            <p style={{ fontSize: "12px", color: "#94A3B8", marginTop: "8px" }}>
              Expire le {new Date(data.expiresAt).toLocaleDateString("fr-FR")}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
