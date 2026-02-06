"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import {
  Shield,
  FileText,
  Lock,
  Scale,
  ArrowRight,
  ChevronDown,
  Database,
  Globe,
  Mail,
  Building2,
} from "lucide-react";

// ============================================================================
// RESPONSIVE HOOK
// ============================================================================

function useResponsive() {
  const [screen, setScreen] = useState<"mobile" | "tablet" | "desktop">("desktop");
  useEffect(() => {
    const check = () => {
      const w = window.innerWidth;
      if (w < 640) setScreen("mobile");
      else if (w < 1024) setScreen("tablet");
      else setScreen("desktop");
    };
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);
  return { isMobile: screen === "mobile", isTablet: screen === "tablet" };
}

// ============================================================================
// LEGAL DOCUMENTS DATA
// ============================================================================

const LEGAL_DOCS = [
  {
    title: "Conditions Generales d'Utilisation",
    shortTitle: "CGU",
    description: "Regles d'utilisation de la plateforme SafeMotor",
    href: "/cgu",
    icon: FileText,
    color: "#6366F1",
    bgColor: "rgba(99, 102, 241, 0.1)",
    version: "2.0",
    lastUpdate: "15 janvier 2025",
  },
  {
    title: "Conditions Generales de Vente",
    shortTitle: "CGV",
    description: "Conditions commerciales et tarifaires",
    href: "/cgv",
    icon: Scale,
    color: "#10B981",
    bgColor: "rgba(16, 185, 129, 0.1)",
    version: "2.0",
    lastUpdate: "15 janvier 2025",
  },
  {
    title: "Politique de Confidentialite",
    shortTitle: "RGPD",
    description: "Protection de vos donnees personnelles",
    href: "/politique-confidentialite",
    icon: Lock,
    color: "#F59E0B",
    bgColor: "rgba(245, 158, 11, 0.1)",
    version: "2.0",
    lastUpdate: "15 janvier 2025",
  },
  {
    title: "Mentions Legales",
    shortTitle: "Legales",
    description: "Informations legales obligatoires",
    href: "/mentions-legales",
    icon: Building2,
    color: "#8B5CF6",
    bgColor: "rgba(139, 92, 246, 0.1)",
    version: "1.0",
    lastUpdate: "15 janvier 2025",
  },
];

const GDPR_RIGHTS = [
  {
    name: "Droit d'acces",
    article: "Art. 15",
    description: "Obtenir une copie de vos donnees",
    icon: Database,
  },
  {
    name: "Droit de rectification",
    article: "Art. 16",
    description: "Corriger vos donnees inexactes",
    icon: FileText,
  },
  {
    name: "Droit a l'effacement",
    article: "Art. 17",
    description: "Demander la suppression",
    icon: Lock,
  },
  {
    name: "Droit a la portabilite",
    article: "Art. 20",
    description: "Recuperer vos donnees",
    icon: Globe,
  },
];

const SUBPROCESSORS = [
  { name: "Vercel Inc.", purpose: "Hebergement", region: "USA/EU" },
  { name: "Stripe Inc.", purpose: "Paiements", region: "USA/EU" },
  { name: "Resend", purpose: "Emails", region: "USA" },
  { name: "Sentry", purpose: "Monitoring", region: "USA" },
];

// ============================================================================
// COMPONENT
// ============================================================================

export default function LegalHubPage() {
  const { isMobile, isTablet } = useResponsive();
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const FAQ = [
    {
      question: "Comment exercer mes droits RGPD ?",
      answer: "Vous pouvez exercer vos droits en contactant directement le garage qui detient vos donnees, ou en nous ecrivant a dpo@safemotor.fr. Nous repondons sous 30 jours maximum.",
    },
    {
      question: "Combien de temps conservez-vous mes donnees ?",
      answer: "Les donnees clients sont conservees 10 ans apres la derniere intervention (obligation legale comptable). Les donnees de session sont supprimees apres 30 jours d'inactivite.",
    },
    {
      question: "Mes donnees sont-elles securisees ?",
      answer: "Oui. Nous utilisons le chiffrement AES-256 pour les donnees au repos, TLS 1.3 pour les transferts, et l'authentification forte (bcrypt, JWT). Toutes les actions sont tracees.",
    },
    {
      question: "Y a-t-il des transferts hors UE ?",
      answer: "Oui, certains de nos sous-traitants sont bases aux USA. Ces transferts sont encadres par les Clauses Contractuelles Types de la Commission Europeenne.",
    },
  ];

  return (
    <main style={{
      minHeight: "100vh",
      background: "linear-gradient(to bottom, #F9FAFB 0%, #fff 100%)",
      fontFamily: "system-ui, -apple-system, sans-serif",
    }}>
      {/* Header */}
      <header style={{
        background: "#fff",
        borderBottom: "1px solid #E5E7EB",
        padding: isMobile ? "16px" : "20px 24px",
        position: "sticky",
        top: 0,
        zIndex: 50,
      }}>
        <div style={{
          maxWidth: "1200px",
          margin: "0 auto",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}>
          <Link href="/" style={{ display: "flex", alignItems: "center", gap: "10px", textDecoration: "none" }}>
            <div style={{
              width: "36px",
              height: "36px",
              borderRadius: "10px",
              background: "linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}>
              <Shield size={18} color="#fff" />
            </div>
            <span style={{ fontSize: "18px", fontWeight: 700, color: "#111827" }}>SafeMotor</span>
          </Link>
          <Link href="/" style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            fontSize: "14px",
            fontWeight: 500,
            color: "#6B7280",
            textDecoration: "none",
          }}>
            Retour au site
            <ArrowRight size={14} />
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section style={{
        padding: isMobile ? "48px 16px" : "80px 24px",
        textAlign: "center",
        background: "radial-gradient(ellipse 80% 50% at 50% 0%, rgba(99, 102, 241, 0.08) 0%, transparent 50%)",
      }}>
        <div style={{ maxWidth: "800px", margin: "0 auto" }}>
          <div style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            padding: "6px 14px",
            borderRadius: "100px",
            background: "rgba(99, 102, 241, 0.1)",
            border: "1px solid rgba(99, 102, 241, 0.2)",
            marginBottom: "20px",
          }}>
            <Scale size={14} color="#6366F1" />
            <span style={{ fontSize: "13px", color: "#6366F1", fontWeight: 500 }}>Centre juridique</span>
          </div>
          <h1 style={{
            fontSize: isMobile ? "28px" : "42px",
            fontWeight: 800,
            color: "#111827",
            marginBottom: "16px",
            lineHeight: 1.2,
          }}>
            Informations Legales
          </h1>
          <p style={{
            fontSize: isMobile ? "15px" : "18px",
            color: "#6B7280",
            lineHeight: 1.6,
            maxWidth: "600px",
            margin: "0 auto",
          }}>
            Transparence, conformite RGPD et protection de vos donnees.
            Consultez nos documents juridiques et exercez vos droits.
          </p>
        </div>
      </section>

      {/* Legal Documents Grid */}
      <section style={{ padding: isMobile ? "0 16px 48px" : "0 24px 80px" }}>
        <div style={{ maxWidth: "1000px", margin: "0 auto" }}>
          <div style={{
            display: "grid",
            gridTemplateColumns: isMobile ? "1fr" : isTablet ? "repeat(2, 1fr)" : "repeat(2, 1fr)",
            gap: isMobile ? "12px" : "20px",
          }}>
            {LEGAL_DOCS.map((doc) => (
              <Link
                key={doc.href}
                href={doc.href}
                style={{
                  display: "block",
                  textDecoration: "none",
                  background: "#fff",
                  borderRadius: "16px",
                  border: "1px solid #E5E7EB",
                  padding: isMobile ? "20px" : "28px",
                  transition: "all 0.2s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = "0 10px 40px -10px rgba(0,0,0,0.1)";
                  e.currentTarget.style.transform = "translateY(-2px)";
                  e.currentTarget.style.borderColor = doc.color;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = "none";
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.borderColor = "#E5E7EB";
                }}
              >
                <div style={{ display: "flex", alignItems: "flex-start", gap: "16px" }}>
                  <div style={{
                    width: "48px",
                    height: "48px",
                    borderRadius: "12px",
                    background: doc.bgColor,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}>
                    <doc.icon size={24} color={doc.color} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      marginBottom: "8px",
                    }}>
                      <h3 style={{
                        fontSize: isMobile ? "16px" : "18px",
                        fontWeight: 600,
                        color: "#111827",
                        margin: 0,
                      }}>
                        {doc.title}
                      </h3>
                      <span style={{
                        fontSize: "11px",
                        fontWeight: 600,
                        color: doc.color,
                        background: doc.bgColor,
                        padding: "3px 8px",
                        borderRadius: "6px",
                      }}>
                        v{doc.version}
                      </span>
                    </div>
                    <p style={{
                      fontSize: "14px",
                      color: "#6B7280",
                      margin: "0 0 12px 0",
                      lineHeight: 1.5,
                    }}>
                      {doc.description}
                    </p>
                    <div style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}>
                      <span style={{ fontSize: "12px", color: "#9CA3AF" }}>
                        Mis a jour le {doc.lastUpdate}
                      </span>
                      <ArrowRight size={16} color={doc.color} />
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* GDPR Rights Section */}
      <section style={{
        padding: isMobile ? "48px 16px" : "80px 24px",
        background: "#fff",
        borderTop: "1px solid #E5E7EB",
        borderBottom: "1px solid #E5E7EB",
      }}>
        <div style={{ maxWidth: "1000px", margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: isMobile ? "32px" : "48px" }}>
            <div style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              padding: "6px 14px",
              borderRadius: "100px",
              background: "rgba(16, 185, 129, 0.1)",
              border: "1px solid rgba(16, 185, 129, 0.2)",
              marginBottom: "16px",
            }}>
              <Lock size={14} color="#10B981" />
              <span style={{ fontSize: "13px", color: "#10B981", fontWeight: 500 }}>RGPD</span>
            </div>
            <h2 style={{
              fontSize: isMobile ? "24px" : "32px",
              fontWeight: 700,
              color: "#111827",
              marginBottom: "12px",
            }}>
              Vos droits sur vos donnees
            </h2>
            <p style={{
              fontSize: isMobile ? "14px" : "16px",
              color: "#6B7280",
              maxWidth: "600px",
              margin: "0 auto",
            }}>
              Conformement au RGPD, vous disposez de droits sur vos donnees personnelles
            </p>
          </div>

          <div style={{
            display: "grid",
            gridTemplateColumns: isMobile ? "1fr" : isTablet ? "repeat(2, 1fr)" : "repeat(4, 1fr)",
            gap: isMobile ? "12px" : "16px",
          }}>
            {GDPR_RIGHTS.map((right) => (
              <div
                key={right.name}
                style={{
                  background: "#F9FAFB",
                  borderRadius: "14px",
                  padding: isMobile ? "20px" : "24px",
                  textAlign: "center",
                }}
              >
                <div style={{
                  width: "48px",
                  height: "48px",
                  borderRadius: "12px",
                  background: "#fff",
                  border: "1px solid #E5E7EB",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 16px",
                }}>
                  <right.icon size={22} color="#6366F1" />
                </div>
                <h3 style={{
                  fontSize: "15px",
                  fontWeight: 600,
                  color: "#111827",
                  marginBottom: "4px",
                }}>
                  {right.name}
                </h3>
                <span style={{
                  fontSize: "11px",
                  fontWeight: 500,
                  color: "#6366F1",
                  display: "block",
                  marginBottom: "8px",
                }}>
                  {right.article} RGPD
                </span>
                <p style={{
                  fontSize: "13px",
                  color: "#6B7280",
                  margin: 0,
                  lineHeight: 1.5,
                }}>
                  {right.description}
                </p>
              </div>
            ))}
          </div>

          <div style={{
            marginTop: "32px",
            padding: isMobile ? "20px" : "24px",
            background: "linear-gradient(135deg, rgba(99, 102, 241, 0.05) 0%, rgba(139, 92, 246, 0.05) 100%)",
            borderRadius: "14px",
            border: "1px solid rgba(99, 102, 241, 0.1)",
            textAlign: "center",
          }}>
            <p style={{
              fontSize: "14px",
              color: "#374151",
              marginBottom: "16px",
            }}>
              Pour exercer vos droits, contactez notre DPO :
            </p>
            <a
              href="mailto:dpo@safemotor.fr"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                padding: "12px 24px",
                borderRadius: "10px",
                background: "linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)",
                color: "#fff",
                fontSize: "14px",
                fontWeight: 600,
                textDecoration: "none",
              }}
            >
              <Mail size={16} />
              dpo@safemotor.fr
            </a>
          </div>
        </div>
      </section>

      {/* Subprocessors */}
      <section style={{ padding: isMobile ? "48px 16px" : "80px 24px" }}>
        <div style={{ maxWidth: "800px", margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: isMobile ? "32px" : "48px" }}>
            <h2 style={{
              fontSize: isMobile ? "24px" : "32px",
              fontWeight: 700,
              color: "#111827",
              marginBottom: "12px",
            }}>
              Sous-traitants autorises
            </h2>
            <p style={{
              fontSize: isMobile ? "14px" : "16px",
              color: "#6B7280",
            }}>
              Liste des prestataires qui traitent vos donnees pour notre compte
            </p>
          </div>

          <div style={{
            background: "#fff",
            borderRadius: "16px",
            border: "1px solid #E5E7EB",
            overflow: "hidden",
          }}>
            <div style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr 100px",
              padding: "16px 20px",
              background: "#F9FAFB",
              borderBottom: "1px solid #E5E7EB",
              fontSize: "12px",
              fontWeight: 600,
              color: "#6B7280",
              textTransform: "uppercase",
              letterSpacing: "0.5px",
            }}>
              <span>Prestataire</span>
              <span>Finalite</span>
              <span>Region</span>
            </div>
            {SUBPROCESSORS.map((sp, i) => (
              <div
                key={sp.name}
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr 100px",
                  padding: "16px 20px",
                  borderBottom: i < SUBPROCESSORS.length - 1 ? "1px solid #E5E7EB" : "none",
                  fontSize: "14px",
                }}
              >
                <span style={{ fontWeight: 500, color: "#111827" }}>{sp.name}</span>
                <span style={{ color: "#6B7280" }}>{sp.purpose}</span>
                <span style={{
                  fontSize: "12px",
                  fontWeight: 500,
                  color: sp.region.includes("EU") ? "#10B981" : "#F59E0B",
                  background: sp.region.includes("EU") ? "rgba(16, 185, 129, 0.1)" : "rgba(245, 158, 11, 0.1)",
                  padding: "4px 8px",
                  borderRadius: "6px",
                  display: "inline-block",
                  width: "fit-content",
                }}>
                  {sp.region}
                </span>
              </div>
            ))}
          </div>
          <p style={{
            fontSize: "12px",
            color: "#9CA3AF",
            marginTop: "12px",
            textAlign: "center",
          }}>
            Les transferts hors UE sont encadres par les Clauses Contractuelles Types (CCT)
          </p>
        </div>
      </section>

      {/* FAQ */}
      <section style={{
        padding: isMobile ? "48px 16px" : "80px 24px",
        background: "#fff",
        borderTop: "1px solid #E5E7EB",
      }}>
        <div style={{ maxWidth: "700px", margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: isMobile ? "32px" : "48px" }}>
            <h2 style={{
              fontSize: isMobile ? "24px" : "32px",
              fontWeight: 700,
              color: "#111827",
              marginBottom: "12px",
            }}>
              Questions frequentes
            </h2>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {FAQ.map((item, i) => (
              <div
                key={i}
                style={{
                  background: "#F9FAFB",
                  borderRadius: "12px",
                  overflow: "hidden",
                  border: openFaq === i ? "1px solid #6366F1" : "1px solid transparent",
                }}
              >
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  style={{
                    width: "100%",
                    padding: "18px 20px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    background: "transparent",
                    border: "none",
                    cursor: "pointer",
                    textAlign: "left",
                  }}
                >
                  <span style={{
                    fontSize: "15px",
                    fontWeight: 600,
                    color: "#111827",
                  }}>
                    {item.question}
                  </span>
                  <ChevronDown
                    size={18}
                    color="#6B7280"
                    style={{
                      transform: openFaq === i ? "rotate(180deg)" : "rotate(0)",
                      transition: "transform 0.2s ease",
                      flexShrink: 0,
                      marginLeft: "12px",
                    }}
                  />
                </button>
                {openFaq === i && (
                  <div style={{
                    padding: "0 20px 18px",
                  }}>
                    <p style={{
                      fontSize: "14px",
                      color: "#6B7280",
                      lineHeight: 1.7,
                      margin: 0,
                    }}>
                      {item.answer}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{
        padding: isMobile ? "32px 16px" : "48px 24px",
        background: "#111827",
        color: "#fff",
      }}>
        <div style={{
          maxWidth: "1000px",
          margin: "0 auto",
          display: "flex",
          flexDirection: isMobile ? "column" : "row",
          alignItems: isMobile ? "center" : "flex-start",
          justifyContent: "space-between",
          gap: "32px",
          textAlign: isMobile ? "center" : "left",
        }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", justifyContent: isMobile ? "center" : "flex-start" }}>
              <div style={{
                width: "32px",
                height: "32px",
                borderRadius: "8px",
                background: "linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}>
                <Shield size={16} color="#fff" />
              </div>
              <span style={{ fontSize: "16px", fontWeight: 600 }}>SafeMotor</span>
            </div>
            <p style={{ fontSize: "13px", color: "rgba(255,255,255,0.5)", marginTop: "8px" }}>
              Protection juridique pour garages automobiles
            </p>
          </div>
          <div style={{
            display: "flex",
            gap: isMobile ? "16px" : "32px",
            flexWrap: "wrap",
            justifyContent: "center",
          }}>
            <Link href="/cgu" style={{ fontSize: "13px", color: "rgba(255,255,255,0.6)", textDecoration: "none" }}>CGU</Link>
            <Link href="/cgv" style={{ fontSize: "13px", color: "rgba(255,255,255,0.6)", textDecoration: "none" }}>CGV</Link>
            <Link href="/politique-confidentialite" style={{ fontSize: "13px", color: "rgba(255,255,255,0.6)", textDecoration: "none" }}>Confidentialite</Link>
            <Link href="/mentions-legales" style={{ fontSize: "13px", color: "rgba(255,255,255,0.6)", textDecoration: "none" }}>Mentions legales</Link>
          </div>
          <p style={{ fontSize: "12px", color: "rgba(255,255,255,0.4)" }}>
            &copy; 2025 SafeMotor. Tous droits reserves.
          </p>
        </div>
      </footer>
    </main>
  );
}
