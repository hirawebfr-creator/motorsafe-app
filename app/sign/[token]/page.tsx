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
  Smartphone,
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

const STATUS_CONFIG: Record<string, { bg: string; text: string; label: string; icon: React.ReactNode }> = {
  SENT: { bg: "#EEF2FF", text: "#4F46E5", label: "En attente de signature", icon: <Clock size={18} /> },
  VIEWED: { bg: "#FEF3C7", text: "#D97706", label: "Document consulté", icon: <FileText size={18} /> },
  SIGNED: { bg: "#D1FAE5", text: "#059669", label: "Signé avec succès", icon: <CheckCircle size={18} /> },
  DECLINED: { bg: "#FEE2E2", text: "#DC2626", label: "Refusé", icon: <XCircle size={18} /> },
  EXPIRED: { bg: "#F3F4F6", text: "#6B7280", label: "Lien expiré", icon: <AlertTriangle size={18} /> },
  VOID: { bg: "#FEE2E2", text: "#DC2626", label: "Demande annulée", icon: <XCircle size={18} /> },
};

// MOBILE-UX-01: Error messages with clear instructions
const ERROR_MESSAGES: Record<string, { title: string; description: string; actionLabel?: string; actionType?: string }> = {
  EXPIRED: {
    title: "Ce lien de signature a expiré",
    description: "Le délai de signature est dépassé. Veuillez contacter le garage pour qu'il vous renvoie un nouveau lien.",
    actionLabel: "Contacter le garage",
    actionType: "contact",
  },
  VOID: {
    title: "Demande annulée",
    description: "Cette demande de signature a été annulée par le garage. Veuillez le contacter pour plus d'informations.",
    actionLabel: "Contacter le garage",
    actionType: "contact",
  },
  ALREADY_SIGNED: {
    title: "Document déjà signé",
    description: "Ce document a déjà été signé. Vous pouvez fermer cette page.",
    actionLabel: "Fermer",
    actionType: "close",
  },
  NOT_FOUND: {
    title: "Lien invalide",
    description: "Ce lien de signature n'existe pas ou n'est plus valide. Vérifiez que vous avez utilisé le bon lien.",
    actionLabel: "Vérifier le lien",
    actionType: "retry",
  },
  SUBSCRIPTION_INACTIVE: {
    title: "Service temporairement indisponible",
    description: "Le garage n'a pas d'abonnement actif. Veuillez le contacter pour qu'il active son abonnement.",
    actionLabel: "Contacter le garage",
    actionType: "contact",
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
        // BILLING-GUARD-01: Better message for subscription inactive
        if (json.error?.code === "SUBSCRIPTION_INACTIVE") {
          setError("Le garage n'a pas d'abonnement actif. Veuillez contacter le garage pour qu'il active son abonnement.");
        } else {
          setError(json.error?.message || "Lien invalide ou expiré");
        }
        return;
      }

      setData(json.data);
      setSignerEmail(json.data.signerEmail || "");

      if (json.data.status === "SIGNED") {
        setSigned(true);
        setSignerName(json.data.signerNameDeclared || "");
      }

      // Mark as viewed
      if (json.data.status === "SENT") {
        await fetch(`/api/signatures/${token}/viewed`, { method: "POST" });
      }
    } catch {
      setError("Erreur de chargement");
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
        // BILLING-GUARD-01: Better message for subscription inactive
        if (json.error?.code === "SUBSCRIPTION_INACTIVE") {
          setError("Le garage n'a pas d'abonnement actif. Veuillez contacter le garage.");
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
        <div className="text-center">
          <Loader2 size={48} className="animate-spin text-indigo-600 mx-auto mb-4" />
          <p className="text-slate-600">Chargement...</p>
        </div>
      </div>
    );
  }

  if (error && !data) {
    // MOBILE-UX-01: Enhanced error display with clear messages
    const errorType = error.includes("expiré") ? "EXPIRED" 
      : error.includes("abonnement") ? "SUBSCRIPTION_INACTIVE"
      : error.includes("annulé") ? "VOID"
      : "NOT_FOUND";
    const errorConfig = ERROR_MESSAGES[errorType] || ERROR_MESSAGES.NOT_FOUND;
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4 safe-area-inset">
        <div className="bg-white rounded-2xl shadow-xl p-6 sm:p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
            <AlertTriangle size={32} className="text-red-500 sm:hidden" />
            <AlertTriangle size={40} className="text-red-500 hidden sm:block" />
          </div>
          <h1 className="text-lg sm:text-xl font-bold text-slate-800 mb-2">{errorConfig.title}</h1>
          <p className="text-sm sm:text-base text-slate-600 mb-6">{errorConfig.description}</p>
          
          {/* Mobile-friendly action button */}
          <button
            onClick={() => window.location.reload()}
            className="w-full py-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-xl transition-colors flex items-center justify-center gap-2 touch-manipulation"
          >
            <RefreshCw size={18} />
            Réessayer
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-6 sm:py-8 px-4 safe-area-inset">
      <div className="max-w-2xl mx-auto">
        {/* Header - Mobile optimized */}
        <div className="text-center mb-6 sm:mb-8">
          <div className="inline-flex items-center gap-2 bg-indigo-600 text-white px-3 sm:px-4 py-2 rounded-full text-xs sm:text-sm font-medium mb-3 sm:mb-4">
            <Shield size={14} className="sm:hidden" />
            <Shield size={16} className="hidden sm:block" />
            Signature sécurisée
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-800 mb-2">
            {data.documentTypeLabel}
          </h1>
          <p className="text-sm sm:text-base text-slate-600">
            Demande de {data.garageName}
          </p>
          {/* Mobile trust indicator */}
          <div className="flex items-center justify-center gap-2 mt-3 text-xs text-slate-500 sm:hidden">
            <Smartphone size={14} />
            <span>Optimisé pour mobile</span>
          </div>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Status Banner - Touch optimized */}
          <div 
            className="px-4 sm:px-6 py-3 sm:py-4 flex items-center gap-3"
            style={{ backgroundColor: statusConfig.bg, color: statusConfig.text }}
          >
            {statusConfig.icon}
            <span className="font-medium text-sm sm:text-base">{statusConfig.label}</span>
            {isSigned && data.signedAt && (
              <span className="ml-auto text-sm opacity-80">
                {new Date(data.signedAt).toLocaleString("fr-FR")}
              </span>
            )}
          </div>

          {/* Document Summary - Mobile optimized */}
          <div className="p-4 sm:p-6 border-b border-slate-100">
            <h2 className="font-semibold text-slate-800 mb-3 sm:mb-4 text-sm sm:text-base">Informations du document</h2>
            <div className="grid gap-2 sm:gap-3">
              {data.documentSummary.clientName && (
                <div className="flex items-center gap-2 sm:gap-3 text-xs sm:text-sm">
                  <User size={16} className="text-slate-400 flex-shrink-0 sm:hidden" />
                  <User size={18} className="text-slate-400 flex-shrink-0 hidden sm:block" />
                  <span className="text-slate-600">Client:</span>
                  <span className="font-medium text-slate-800 truncate">{data.documentSummary.clientName}</span>
                </div>
              )}
              {data.documentSummary.vehiclePlate && (
                <div className="flex items-center gap-2 sm:gap-3 text-xs sm:text-sm">
                  <Car size={16} className="text-slate-400 flex-shrink-0 sm:hidden" />
                  <Car size={18} className="text-slate-400 flex-shrink-0 hidden sm:block" />
                  <span className="text-slate-600">Véhicule:</span>
                  <span className="font-medium text-slate-800 truncate">
                    {data.documentSummary.vehiclePlate} — {data.documentSummary.vehicleBrand} {data.documentSummary.vehicleModel}
                  </span>
                </div>
              )}
              <div className="flex items-center gap-2 sm:gap-3 text-xs sm:text-sm">
                <Building2 size={16} className="text-slate-400 flex-shrink-0 sm:hidden" />
                <Building2 size={18} className="text-slate-400 flex-shrink-0 hidden sm:block" />
                <span className="text-slate-600">Établissement:</span>
                <span className="font-medium text-slate-800 truncate">{data.garageName}</span>
              </div>
            </div>
          </div>

          {/* PDF Preview Link - Touch optimized */}
          <div className="p-4 sm:p-6 border-b border-slate-100">
            <a
              href={data.pdfUrl}
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-center gap-2 w-full py-4 sm:py-3 px-4 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 rounded-xl text-slate-700 font-medium transition-colors touch-manipulation"
            >
              <FileText size={18} className="sm:hidden" />
              <FileText size={20} className="hidden sm:block" />
              <span className="text-sm sm:text-base">Consulter le document PDF</span>
              <ExternalLink size={14} className="sm:hidden" />
              <ExternalLink size={16} className="hidden sm:block" />
            </a>
          </div>

          {/* Legal Clauses Section - Mobile optimized */}
          {data.legalClauses && data.legalClauses.length > 0 && !isSigned && (
            <div className="p-4 sm:p-6 border-b border-slate-100 bg-amber-50/50">
              <div className="flex items-center gap-2 mb-3 sm:mb-4">
                <Scale size={18} className="text-amber-600 sm:hidden" />
                <Scale size={20} className="text-amber-600 hidden sm:block" />
                <h2 className="font-semibold text-slate-800 text-sm sm:text-base">Clauses & informations importantes</h2>
              </div>
              
              <div className="space-y-2 sm:space-y-3">
                {data.legalClauses.map((clause) => (
                  <div 
                    key={clause.id}
                    className={`p-3 sm:p-4 rounded-xl border ${
                      clause.level === "important" 
                        ? "bg-amber-50 border-amber-200" 
                        : "bg-white border-slate-200"
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      {clause.level === "important" ? (
                        <AlertCircle size={18} className="text-amber-600 mt-0.5 flex-shrink-0" />
                      ) : (
                        <Info size={18} className="text-slate-400 mt-0.5 flex-shrink-0" />
                      )}
                      <div>
                        <p className={`font-medium text-sm ${
                          clause.level === "important" ? "text-amber-800" : "text-slate-700"
                        }`}>
                          {clause.title}
                        </p>
                        <p className="text-sm text-slate-600 mt-1">
                          {clause.text}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* References toggle */}
              <button
                onClick={() => setShowReferences(!showReferences)}
                className="mt-4 flex items-center gap-2 text-sm text-slate-600 hover:text-slate-800"
              >
                <LinkIcon size={14} />
                Voir les références légales
                {showReferences ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>

              {showReferences && (
                <div className="mt-3 p-4 bg-white rounded-xl border border-slate-200">
                  <p className="text-xs font-medium text-slate-500 mb-2">Références:</p>
                  <div className="space-y-2">
                    {data.legalClauses
                      .flatMap(c => c.references)
                      .filter((ref, i, arr) => arr.findIndex(r => r.label === ref.label && r.articleRef === ref.articleRef) === i)
                      .map((ref, i) => (
                        <div key={i} className="text-sm">
                          {ref.sourceUrl ? (
                            <a 
                              href={ref.sourceUrl} 
                              target="_blank" 
                              rel="noreferrer"
                              className="text-indigo-600 hover:underline flex items-center gap-1"
                            >
                              {ref.label} {ref.articleRef && `(${ref.articleRef})`}
                              <ExternalLink size={12} />
                            </a>
                          ) : (
                            <span className="text-slate-600">
                              {ref.label} {ref.articleRef && `(${ref.articleRef})`}
                            </span>
                          )}
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Signature Form or Success - Mobile optimized */}
          {isSigned ? (
            <div className="p-6 sm:p-8 text-center bg-green-50">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                <CheckCircle size={32} className="text-green-500 sm:hidden" />
                <CheckCircle size={48} className="text-green-500 hidden sm:block" />
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-green-800 mb-2">Document signé ✓</h2>
              <p className="text-green-700 mb-2 text-sm sm:text-base">
                Signé par: <strong>{data.signerNameDeclared || signerName}</strong>
              </p>
              {data.signedAt && (
                <p className="text-xs sm:text-sm text-green-600">
                  Le {new Date(data.signedAt).toLocaleString("fr-FR")}
                </p>
              )}
              <p className="text-xs sm:text-sm text-green-600 mt-4">
                Vous pouvez fermer cette page en toute sécurité.
              </p>
            </div>
          ) : isExpired || isVoid ? (
            /* MOBILE-UX-01: Clear expired/void state */
            <div className="p-6 sm:p-8 text-center bg-slate-50">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-slate-200 flex items-center justify-center mx-auto mb-4">
                {isVoid ? (
                  <>
                    <XCircle size={32} className="text-red-500 sm:hidden" />
                    <XCircle size={48} className="text-red-500 hidden sm:block" />
                  </>
                ) : (
                  <>
                    <Clock size={32} className="text-slate-400 sm:hidden" />
                    <Clock size={48} className="text-slate-400 hidden sm:block" />
                  </>
                )}
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-slate-800 mb-2">
                {isVoid ? "Demande annulée" : "Lien expiré"}
              </h2>
              <p className="text-sm sm:text-base text-slate-600 mb-4">
                {isVoid 
                  ? "Cette demande de signature a été annulée par le garage."
                  : "Le délai de signature est dépassé."
                }
              </p>
              <p className="text-xs sm:text-sm text-slate-500">
                Veuillez contacter <strong>{data.garageName}</strong> pour obtenir un nouveau lien.
              </p>
            </div>
          ) : canSign ? (
            <div className="p-4 sm:p-6">
              <h2 className="font-semibold text-slate-800 mb-4 text-sm sm:text-base">Signer le document</h2>

              {/* Checkbox - Read document - Touch optimized */}
              <label className="flex items-start gap-3 mb-3 cursor-pointer touch-manipulation p-2 -mx-2 rounded-lg hover:bg-slate-50 active:bg-slate-100 transition-colors">
                <input
                  type="checkbox"
                  checked={hasReadDoc}
                  onChange={(e) => setHasReadDoc(e.target.checked)}
                  className="mt-0.5 w-6 h-6 sm:w-5 sm:h-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-xs sm:text-sm text-slate-600">
                  J&apos;ai consulté le document PDF ci-dessus.
                </span>
              </label>

              {/* Checkbox - Accept clauses - Touch optimized */}
              <label className="flex items-start gap-3 mb-4 cursor-pointer touch-manipulation p-2 -mx-2 rounded-lg hover:bg-slate-50 active:bg-slate-100 transition-colors">
                <input
                  type="checkbox"
                  checked={hasAcceptedClauses}
                  onChange={(e) => setHasAcceptedClauses(e.target.checked)}
                  className="mt-0.5 w-6 h-6 sm:w-5 sm:h-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-xs sm:text-sm text-slate-600">
                  J&apos;ai lu et j&apos;accepte les clauses ci-dessus. Je comprends que cette signature électronique a valeur d&apos;engagement.
                </span>
              </label>

              {/* Name - Touch optimized */}
              <div className="mb-4">
                <label className="block text-xs sm:text-sm font-medium text-slate-700 mb-1">
                  Nom et prénom *
                </label>
                <input
                  type="text"
                  value={signerName}
                  onChange={(e) => setSignerName(e.target.value)}
                  placeholder="Jean Dupont"
                  autoComplete="name"
                  autoCapitalize="words"
                  className="w-full px-4 py-4 sm:py-3 text-base sm:text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none touch-manipulation"
                />
              </div>

              {/* Email - Touch optimized */}
              <div className="mb-6">
                <label className="block text-xs sm:text-sm font-medium text-slate-700 mb-1">
                  Email (optionnel)
                </label>
                <input
                  type="email"
                  value={signerEmail}
                  onChange={(e) => setSignerEmail(e.target.value)}
                  placeholder="jean.dupont@email.com"
                  autoComplete="email"
                  inputMode="email"
                  className="w-full px-4 py-4 sm:py-3 text-base sm:text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none touch-manipulation"
                />
              </div>

              {error && (
                <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-xs sm:text-sm flex items-center gap-2">
                  <AlertTriangle size={16} />
                  {error}
                </div>
              )}

              {/* Sign Button - Touch optimized with larger touch target */}
              <button
                onClick={handleSign}
                disabled={!hasReadDoc || !hasAcceptedClauses || signerName.trim().length < 2 || signing}
                className="w-full py-5 sm:py-4 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2 touch-manipulation text-base sm:text-sm"
              >
                {signing ? (
                  <>
                    <Loader2 size={20} className="animate-spin" />
                    <span>Signature en cours...</span>
                  </>
                ) : (
                  <>
                    <Check size={20} />
                    <span>Signer le document</span>
                  </>
                )}
              </button>
              
              {/* Mobile helper text */}
              {!hasReadDoc || !hasAcceptedClauses || signerName.trim().length < 2 ? (
                <p className="text-center text-xs text-slate-400 mt-3">
                  {!hasReadDoc 
                    ? "Veuillez d'abord consulter le PDF et cocher la case correspondante"
                    : !hasAcceptedClauses 
                    ? "Veuillez accepter les clauses pour continuer"
                    : "Veuillez entrer votre nom complet"
                  }
                </p>
              ) : null}
            </div>
          ) : null}
        </div>

        {/* Footer - Mobile optimized */}
        <div className="text-center mt-6 sm:mt-8 text-xs sm:text-sm text-slate-500 px-4">
          <p className="flex items-center justify-center gap-2">
            <Shield size={12} className="sm:hidden" />
            <Shield size={14} className="hidden sm:block" />
            Signature sécurisée via MotorSafe
          </p>
          {!isSigned && !isExpired && !isVoid && (
            <p className="mt-1">
              Expire le {new Date(data.expiresAt).toLocaleDateString("fr-FR")}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
