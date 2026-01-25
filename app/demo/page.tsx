"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Shield,
  ArrowRight,
  Play,
  Check,
  User,
  Car,
  Wrench,
  FileText,
  Smartphone,
  FolderOpen,
  Download,
  Lock,
  Eye,
  Clock,
  FileCheck,
  Hash,
  Scale,
  AlertTriangle,
  MessageSquare,
  Zap,
  ChevronDown,
  ChevronUp,
  Star,
  CheckCircle,
  Target,
} from "lucide-react";

// ============================================================================
// PAGE DÉMO SAFEMOTOR
// Design moderne avec toutes les informations sur le produit
// ============================================================================

const STEPS = [
  {
    num: 1,
    title: "Créez votre fiche client",
    desc: "Ajoutez un nouveau client avec ses coordonnées. Rattachez un ou plusieurs véhicules (plaque, VIN, marque, modèle). La recherche SIV pré-remplit automatiquement les infos du véhicule.",
    icon: User,
    color: "#6366F1",
    details: [
      "Import CSV de votre base clients existante",
      "Historique complet par client",
      "Recherche SIV automatique",
      "Multi-véhicules par client",
    ],
  },
  {
    num: 2,
    title: "Documentez l'intervention",
    desc: "Créez l'intervention : type (E85, reprogrammation, diagnostic, entretien, réparation...), notes techniques, photos avant/après, tags pour classification.",
    icon: Wrench,
    color: "#10B981",
    details: [
      "15+ types d'intervention pré-configurés",
      "Photos avec horodatage automatique",
      "Notes techniques libres",
      "Tags et catégorisation",
    ],
  },
  {
    num: 3,
    title: "Générez l'Ordre de Réparation",
    desc: "Le système génère un document légal avec les clauses adaptées au type d'intervention : assurance, homologation, garantie, risques, conditions générales.",
    icon: FileText,
    color: "#F59E0B",
    details: [
      "Clauses juridiques pré-rédigées",
      "Adaptation automatique au type",
      "Conformité Code de la consommation",
      "Personnalisation possible",
    ],
  },
  {
    num: 4,
    title: "Signature mobile (QR Code)",
    desc: "Le client scanne un QR code avec son téléphone, lit les conditions, et signe directement. Vous recevez le document signé avec horodatage et preuve d'acceptation.",
    icon: Smartphone,
    color: "#EC4899",
    details: [
      "Signature sur téléphone du client",
      "Preuve d'acceptation des clauses",
      "Horodatage certifié",
      "Conforme eIDAS",
    ],
  },
  {
    num: 5,
    title: "Constituez le dossier complet",
    desc: "Tout est rassemblé : OR signé, PV de réception, PV de restitution, photos, notes, historique. En cas de problème, ouvrez un dossier incident.",
    icon: FolderOpen,
    color: "#8B5CF6",
    details: [
      "Timeline complète de l'intervention",
      "Documents signés centralisés",
      "Photos horodatées",
      "Dossier incident si litige",
    ],
  },
  {
    num: 6,
    title: "Exportez pour assurance/justice",
    desc: "Générez un ZIP contenant toutes les preuves : documents signés, hash SHA256, audit trail, historique complet. Prêt à envoyer à l'assurance ou à l'avocat.",
    icon: Download,
    color: "#3B82F6",
    details: [
      "Export ZIP complet en 1 clic",
      "Hash d'intégrité vérifiable",
      "Audit trail inclus",
      "Format accepté par assureurs",
    ],
  },
];

const FEATURES = [
  {
    icon: Hash,
    title: "Hash SHA256",
    desc: "Chaque document signé est hashé cryptographiquement. Toute modification est détectable instantanément.",
    color: "#6366F1",
  },
  {
    icon: Eye,
    title: "Audit Trail complet",
    desc: "Chaque action est tracée : date, heure, adresse IP, appareil utilisé. Historique immutable.",
    color: "#10B981",
  },
  {
    icon: Lock,
    title: "Chaîne de preuves",
    desc: "Evidence Chain immutable qui lie tous les éléments du dossier. Incontestable devant un tribunal.",
    color: "#F59E0B",
  },
  {
    icon: Clock,
    title: "Rétention légale",
    desc: "Documents conservés 10 ans (obligation légale). Preuves accessibles à tout moment.",
    color: "#EC4899",
  },
  {
    icon: FileCheck,
    title: "Conformité eIDAS",
    desc: "Signatures électroniques conformes au règlement européen. Valeur juridique équivalente au manuscrit.",
    color: "#8B5CF6",
  },
  {
    icon: Scale,
    title: "Prêt pour le tribunal",
    desc: "Dossiers constitués selon les standards attendus par les assureurs et la justice.",
    color: "#3B82F6",
  },
];

const USE_CASES = [
  {
    icon: Zap,
    title: "Conversion E85 / Reprogrammation",
    problem: "Client conteste la conversion, dit que le moteur a des problèmes depuis.",
    solution: "OR signé avec clause de décharge + photos avant/après + signature acceptation risques = dossier béton.",
    color: "#10B981",
  },
  {
    icon: Car,
    title: "Réparation mécanique",
    problem: "Client dit que la panne n'est pas résolue ou qu'il y a un nouveau problème.",
    solution: "PV de réception détaillé + devis signé + PV de restitution avec signature = responsabilités claires.",
    color: "#6366F1",
  },
  {
    icon: AlertTriangle,
    title: "Véhicule accidenté après intervention",
    problem: "L'assurance ou le client met en cause votre intervention.",
    solution: "Export complet avec hash + audit trail + photos horodatées = preuves irréfutables.",
    color: "#F59E0B",
  },
  {
    icon: MessageSquare,
    title: "Litige sur le montant",
    problem: "Client conteste le montant facturé ou dit ne pas avoir accepté.",
    solution: "Devis signé numériquement + preuve d'acceptation + facture liée = dossier solide.",
    color: "#EC4899",
  },
];

const PRICING_PREVIEW = [
  { name: "Gratuit", price: "0€", desc: "Découverte", features: ["1 utilisateur", "10 clients", "10 interventions"] },
  { name: "PRO", price: "89€/mois", desc: "Garage indépendant", features: ["3 utilisateurs", "Illimité", "50 SIV/mois"], popular: true },
  { name: "EXPERT", price: "149€/mois", desc: "Protection maximale", features: ["5 utilisateurs", "Export litige", "150 SIV/mois"] },
];

const TESTIMONIALS = [
  {
    name: "Jean-Pierre M.",
    role: "Gérant, Garage Martin & Fils",
    content: "Un client a voulu me poursuivre pour une reprog E85. J'ai sorti le dossier SafeMotor avec toutes les preuves signées. L'assurance a classé l'affaire en 48h.",
    rating: 5,
  },
  {
    name: "Sophie D.",
    role: "Directrice, Auto Service Pro",
    content: "Mes mécaniciens ont adopté l'outil en une journée. Les signatures sur téléphone, c'est un vrai gain de temps et les clients adorent le côté pro.",
    rating: 5,
  },
  {
    name: "Marc L.",
    role: "Propriétaire, Garage du Centre",
    content: "Avant SafeMotor, j'avais perdu 2 litiges faute de preuves. Maintenant je dors tranquille. Le ROI est immédiat.",
    rating: 5,
  },
];

const FAQ = [
  {
    q: "Est-ce vraiment utile si je n'ai jamais eu de litige ?",
    a: "Oui ! La prévention coûte moins cher que la résolution. Un seul litige perdu peut coûter plusieurs milliers d'euros. SafeMotor est une assurance professionnelle pour votre réputation et vos finances.",
  },
  {
    q: "Mes clients vont-ils accepter de signer sur téléphone ?",
    a: "Absolument. C'est même un argument de professionnalisme. Les clients apprécient la transparence et le sérieux de la démarche. C'est simple : ils scannent, lisent, signent. 30 secondes.",
  },
  {
    q: "Les signatures ont-elles une valeur juridique ?",
    a: "Oui. Nos signatures sont conformes au règlement eIDAS et ont la même valeur qu'une signature manuscrite. Elles sont horodatées et liées de manière unique au signataire.",
  },
  {
    q: "Puis-je importer mes clients existants ?",
    a: "Oui. Import CSV en quelques clics. Vous gardez tout votre historique et pouvez commencer à documenter dès aujourd'hui.",
  },
  {
    q: "Combien de temps sont conservées les preuves ?",
    a: "10 ans minimum, conformément au Code du commerce. Vous pouvez exporter vos données à tout moment.",
  },
];

export default function DemoPage() {
  const [openFAQ, setOpenFAQ] = useState<number | null>(null);
  const [activeStep, setActiveStep] = useState<number | null>(null);

  return (
    <main style={{ minHeight: "100vh", background: "#0A0A0F", color: "#fff" }}>
      {/* Header */}
      <header style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 50, background: "rgba(10, 10, 15, 0.9)", backdropFilter: "blur(20px)", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "16px 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Link href="/" style={{ display: "flex", alignItems: "center", gap: "12px", textDecoration: "none" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "40px", height: "40px", borderRadius: "12px", background: "linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)" }}>
              <Shield size={20} color="#fff" />
            </div>
            <span style={{ fontSize: "20px", fontWeight: 700, color: "#fff" }}>SafeMotor</span>
          </Link>
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <Link href="/auth/login" style={{ fontSize: "14px", color: "rgba(255,255,255,0.7)", textDecoration: "none" }}>Connexion</Link>
            <Link href="/pro/inscription">
              <button style={{ padding: "10px 20px", borderRadius: "10px", border: "none", background: "linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)", fontSize: "14px", fontWeight: 600, color: "#fff", cursor: "pointer" }}>
                Essai gratuit
              </button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section style={{ paddingTop: "140px", paddingBottom: "80px", background: "radial-gradient(ellipse 80% 50% at 50% -20%, rgba(99, 102, 241, 0.2) 0%, transparent 50%)" }}>
        <div style={{ maxWidth: "900px", margin: "0 auto", padding: "0 24px", textAlign: "center" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "8px 16px", borderRadius: "100px", background: "rgba(99, 102, 241, 0.15)", border: "1px solid rgba(99, 102, 241, 0.3)", marginBottom: "24px" }}>
            <Play size={14} color="#A5B4FC" />
            <span style={{ fontSize: "13px", color: "#A5B4FC", fontWeight: 500 }}>Démonstration complète</span>
          </div>
          
          <h1 style={{ fontSize: "48px", fontWeight: 800, lineHeight: 1.1, marginBottom: "20px" }}>
            Protégez votre garage<br />
            <span style={{ background: "linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>en 6 étapes simples</span>
          </h1>
          
          <p style={{ fontSize: "18px", color: "rgba(255,255,255,0.6)", lineHeight: 1.7, marginBottom: "40px", maxWidth: "600px", margin: "0 auto 40px" }}>
            Découvrez comment SafeMotor vous aide à documenter chaque intervention, 
            obtenir des signatures légales et constituer des dossiers de preuves inattaquables.
          </p>

          <div style={{ display: "flex", gap: "16px", justifyContent: "center", flexWrap: "wrap" }}>
            <Link href="/pro/inscription">
              <button style={{ display: "flex", alignItems: "center", gap: "10px", padding: "16px 28px", borderRadius: "12px", border: "none", background: "linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)", fontSize: "16px", fontWeight: 600, color: "#fff", cursor: "pointer", boxShadow: "0 8px 30px rgba(99, 102, 241, 0.4)" }}>
                Démarrer l'essai gratuit
                <ArrowRight size={18} />
              </button>
            </Link>
            <Link href="/#tarifs">
              <button style={{ display: "flex", alignItems: "center", gap: "10px", padding: "16px 28px", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.2)", background: "rgba(255,255,255,0.05)", fontSize: "16px", fontWeight: 600, color: "#fff", cursor: "pointer" }}>
                Voir les tarifs
              </button>
            </Link>
          </div>
        </div>
      </section>

      {/* 6 Steps - Parcours détaillé */}
      <section style={{ padding: "80px 24px", background: "#0A0A0F" }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: "60px" }}>
            <p style={{ fontSize: "14px", fontWeight: 600, color: "#6366F1", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "12px" }}>Le parcours</p>
            <h2 style={{ fontSize: "36px", fontWeight: 800, marginBottom: "16px" }}>De la réception à la preuve légale</h2>
            <p style={{ fontSize: "18px", color: "rgba(255,255,255,0.6)", maxWidth: "600px", margin: "0 auto" }}>
              Chaque étape est conçue pour maximiser votre protection juridique
            </p>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            {STEPS.map((step) => {
              const Icon = step.icon;
              const isActive = activeStep === step.num;
              return (
                <div
                  key={step.num}
                  onClick={() => setActiveStep(isActive ? null : step.num)}
                  style={{
                    padding: "28px",
                    borderRadius: "20px",
                    background: isActive ? "linear-gradient(135deg, rgba(99, 102, 241, 0.15) 0%, rgba(139, 92, 246, 0.1) 100%)" : "rgba(255,255,255,0.02)",
                    border: isActive ? "1px solid rgba(99, 102, 241, 0.4)" : "1px solid rgba(255,255,255,0.06)",
                    cursor: "pointer",
                    transition: "all 0.3s ease",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "flex-start", gap: "20px" }}>
                    <div style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      width: "56px",
                      height: "56px",
                      borderRadius: "16px",
                      background: `linear-gradient(135deg, ${step.color}20 0%, ${step.color}10 100%)`,
                      border: `1px solid ${step.color}40`,
                      flexShrink: 0,
                    }}>
                      <Icon size={26} color={step.color} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "8px" }}>
                        <span style={{ fontSize: "12px", fontWeight: 600, color: step.color, textTransform: "uppercase" }}>Étape {step.num}</span>
                        <h3 style={{ fontSize: "20px", fontWeight: 700, margin: 0 }}>{step.title}</h3>
                      </div>
                      <p style={{ fontSize: "15px", color: "rgba(255,255,255,0.6)", lineHeight: 1.6, margin: 0 }}>{step.desc}</p>
                      
                      {isActive && (
                        <div style={{ marginTop: "20px", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "12px" }}>
                          {step.details.map((detail, i) => (
                            <div key={i} style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                              <Check size={16} color="#10B981" />
                              <span style={{ fontSize: "14px", color: "rgba(255,255,255,0.8)" }}>{detail}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    <div style={{ color: "rgba(255,255,255,0.4)" }}>
                      {isActive ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Ce qui fait la différence */}
      <section style={{ padding: "80px 24px", background: "linear-gradient(to bottom, #0A0A0F 0%, #0D0D12 100%)" }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: "60px" }}>
            <p style={{ fontSize: "14px", fontWeight: 600, color: "#10B981", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "12px" }}>Technologie</p>
            <h2 style={{ fontSize: "36px", fontWeight: 800, marginBottom: "16px" }}>Ce qui fait la différence</h2>
            <p style={{ fontSize: "18px", color: "rgba(255,255,255,0.6)" }}>Des preuves numériques incontestables</p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "24px" }}>
            {FEATURES.map((feature, i) => {
              const Icon = feature.icon;
              return (
                <div key={i} style={{
                  padding: "28px",
                  borderRadius: "20px",
                  background: "rgba(255,255,255,0.02)",
                  border: "1px solid rgba(255,255,255,0.06)",
                }}>
                  <div style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: "48px",
                    height: "48px",
                    borderRadius: "14px",
                    background: `${feature.color}15`,
                    marginBottom: "20px",
                  }}>
                    <Icon size={24} color={feature.color} />
                  </div>
                  <h3 style={{ fontSize: "18px", fontWeight: 700, marginBottom: "8px" }}>{feature.title}</h3>
                  <p style={{ fontSize: "14px", color: "rgba(255,255,255,0.6)", lineHeight: 1.6, margin: 0 }}>{feature.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Cas d'usage concrets */}
      <section style={{ padding: "80px 24px", background: "#0A0A0F" }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: "60px" }}>
            <p style={{ fontSize: "14px", fontWeight: 600, color: "#F59E0B", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "12px" }}>Cas concrets</p>
            <h2 style={{ fontSize: "36px", fontWeight: 800, marginBottom: "16px" }}>Quand SafeMotor vous sauve</h2>
            <p style={{ fontSize: "18px", color: "rgba(255,255,255,0.6)" }}>Exemples réels de situations où les preuves font la différence</p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "24px" }}>
            {USE_CASES.map((useCase, i) => {
              const Icon = useCase.icon;
              return (
                <div key={i} style={{
                  padding: "28px",
                  borderRadius: "20px",
                  background: "rgba(255,255,255,0.02)",
                  border: "1px solid rgba(255,255,255,0.06)",
                }}>
                  <div style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: "48px",
                    height: "48px",
                    borderRadius: "14px",
                    background: `${useCase.color}15`,
                    marginBottom: "20px",
                  }}>
                    <Icon size={24} color={useCase.color} />
                  </div>
                  <h3 style={{ fontSize: "18px", fontWeight: 700, marginBottom: "16px" }}>{useCase.title}</h3>
                  
                  <div style={{ marginBottom: "16px" }}>
                    <p style={{ fontSize: "12px", fontWeight: 600, color: "#EF4444", textTransform: "uppercase", marginBottom: "6px" }}>⚠️ Le problème</p>
                    <p style={{ fontSize: "14px", color: "rgba(255,255,255,0.6)", lineHeight: 1.5, margin: 0 }}>{useCase.problem}</p>
                  </div>
                  
                  <div>
                    <p style={{ fontSize: "12px", fontWeight: 600, color: "#10B981", textTransform: "uppercase", marginBottom: "6px" }}>✅ La solution SafeMotor</p>
                    <p style={{ fontSize: "14px", color: "rgba(255,255,255,0.8)", lineHeight: 1.5, margin: 0 }}>{useCase.solution}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Témoignages */}
      <section style={{ padding: "80px 24px", background: "linear-gradient(to bottom, #0D0D12 0%, #0A0A0F 100%)" }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: "60px" }}>
            <p style={{ fontSize: "14px", fontWeight: 600, color: "#EC4899", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "12px" }}>Témoignages</p>
            <h2 style={{ fontSize: "36px", fontWeight: 800, marginBottom: "16px" }}>Ils utilisent SafeMotor</h2>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "24px" }}>
            {TESTIMONIALS.map((t, i) => (
              <div key={i} style={{
                padding: "28px",
                borderRadius: "20px",
                background: "rgba(255,255,255,0.02)",
                border: "1px solid rgba(255,255,255,0.06)",
              }}>
                <div style={{ display: "flex", gap: "4px", marginBottom: "16px" }}>
                  {[...Array(t.rating)].map((_, j) => (
                    <Star key={j} size={16} color="#F59E0B" fill="#F59E0B" />
                  ))}
                </div>
                <p style={{ fontSize: "15px", color: "rgba(255,255,255,0.8)", lineHeight: 1.7, marginBottom: "20px", fontStyle: "italic" }}>
                  &quot;{t.content}&quot;
                </p>
                <div>
                  <p style={{ fontSize: "15px", fontWeight: 600, color: "#fff", margin: 0 }}>{t.name}</p>
                  <p style={{ fontSize: "13px", color: "rgba(255,255,255,0.5)", margin: 0 }}>{t.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Tarifs aperçu */}
      <section style={{ padding: "80px 24px", background: "#0A0A0F" }}>
        <div style={{ maxWidth: "1000px", margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: "60px" }}>
            <p style={{ fontSize: "14px", fontWeight: 600, color: "#8B5CF6", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "12px" }}>Tarifs</p>
            <h2 style={{ fontSize: "36px", fontWeight: 800, marginBottom: "16px" }}>Simple et transparent</h2>
          </div>

          <div className="pricing-demo-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "20px" }}>
            {PRICING_PREVIEW.map((plan, i) => (
              <div key={i} style={{
                padding: "28px",
                borderRadius: "20px",
                background: plan.popular ? "linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)" : "rgba(255,255,255,0.02)",
                border: plan.popular ? "none" : "1px solid rgba(255,255,255,0.06)",
                transform: plan.popular ? "scale(1.05)" : "scale(1)",
                boxShadow: plan.popular ? "0 20px 40px rgba(99, 102, 241, 0.3)" : "none",
              }}>
                {plan.popular && (
                  <div style={{ display: "inline-block", padding: "4px 12px", borderRadius: "100px", background: "rgba(255,255,255,0.2)", fontSize: "11px", fontWeight: 600, marginBottom: "16px" }}>
                    Le plus choisi
                  </div>
                )}
                <h3 style={{ fontSize: "20px", fontWeight: 700, marginBottom: "4px" }}>{plan.name}</h3>
                <p style={{ fontSize: "13px", color: plan.popular ? "rgba(255,255,255,0.8)" : "rgba(255,255,255,0.5)", marginBottom: "16px" }}>{plan.desc}</p>
                <p style={{ fontSize: "32px", fontWeight: 800, marginBottom: "20px" }}>{plan.price}</p>
                <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                  {plan.features.map((f, j) => (
                    <li key={j} style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px", fontSize: "14px", color: plan.popular ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.7)" }}>
                      <CheckCircle size={16} color={plan.popular ? "#fff" : "#10B981"} />
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div style={{ textAlign: "center", marginTop: "40px" }}>
            <Link href="/#tarifs">
              <button style={{ padding: "14px 28px", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.2)", background: "transparent", fontSize: "15px", fontWeight: 600, color: "#fff", cursor: "pointer" }}>
                Voir tous les détails des tarifs
              </button>
            </Link>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section style={{ padding: "80px 24px", background: "linear-gradient(to bottom, #0A0A0F 0%, #0D0D12 100%)" }}>
        <div style={{ maxWidth: "800px", margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: "60px" }}>
            <p style={{ fontSize: "14px", fontWeight: 600, color: "#3B82F6", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "12px" }}>FAQ</p>
            <h2 style={{ fontSize: "36px", fontWeight: 800 }}>Questions fréquentes</h2>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {FAQ.map((item, i) => (
              <div
                key={i}
                style={{
                  borderRadius: "16px",
                  background: "rgba(255,255,255,0.02)",
                  border: "1px solid rgba(255,255,255,0.06)",
                  overflow: "hidden",
                }}
              >
                <button
                  onClick={() => setOpenFAQ(openFAQ === i ? null : i)}
                  style={{
                    width: "100%",
                    padding: "20px 24px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    background: "transparent",
                    border: "none",
                    cursor: "pointer",
                    textAlign: "left",
                  }}
                >
                  <span style={{ fontSize: "16px", fontWeight: 600, color: "#fff" }}>{item.q}</span>
                  {openFAQ === i ? <ChevronUp size={20} color="rgba(255,255,255,0.5)" /> : <ChevronDown size={20} color="rgba(255,255,255,0.5)" />}
                </button>
                {openFAQ === i && (
                  <div style={{ padding: "0 24px 20px" }}>
                    <p style={{ fontSize: "15px", color: "rgba(255,255,255,0.7)", lineHeight: 1.7, margin: 0 }}>{item.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section style={{ padding: "100px 24px", background: "radial-gradient(ellipse 80% 50% at 50% 120%, rgba(99, 102, 241, 0.3) 0%, transparent 50%), #0A0A0F" }}>
        <div style={{ maxWidth: "700px", margin: "0 auto", textAlign: "center" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "8px 16px", borderRadius: "100px", background: "rgba(16, 185, 129, 0.15)", border: "1px solid rgba(16, 185, 129, 0.3)", marginBottom: "24px" }}>
            <Target size={14} color="#10B981" />
            <span style={{ fontSize: "13px", color: "#10B981", fontWeight: 500 }}>+500 garages protégés</span>
          </div>
          
          <h2 style={{ fontSize: "42px", fontWeight: 800, marginBottom: "16px" }}>Prêt à protéger votre garage ?</h2>
          <p style={{ fontSize: "18px", color: "rgba(255,255,255,0.6)", marginBottom: "40px", lineHeight: 1.6 }}>
            Essai gratuit de 14 jours, sans engagement, sans carte bancaire.<br />
            Configuration en 5 minutes.
          </p>

          <div style={{ display: "flex", gap: "16px", justifyContent: "center", flexWrap: "wrap" }}>
            <Link href="/pro/inscription">
              <button style={{ display: "flex", alignItems: "center", gap: "10px", padding: "18px 32px", borderRadius: "14px", border: "none", background: "linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)", fontSize: "17px", fontWeight: 600, color: "#fff", cursor: "pointer", boxShadow: "0 8px 30px rgba(99, 102, 241, 0.4)" }}>
                Démarrer l'essai gratuit
                <ArrowRight size={20} />
              </button>
            </Link>
            <Link href="/objections">
              <button style={{ display: "flex", alignItems: "center", gap: "10px", padding: "18px 32px", borderRadius: "14px", border: "1px solid rgba(255,255,255,0.2)", background: "rgba(255,255,255,0.05)", fontSize: "17px", fontWeight: 600, color: "#fff", cursor: "pointer" }}>
                Encore des questions ?
              </button>
            </Link>
          </div>

          <div style={{ display: "flex", gap: "32px", justifyContent: "center", marginTop: "40px", flexWrap: "wrap" }}>
            {["Sans engagement", "Sans CB", "Support inclus"].map((item) => (
              <span key={item} style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "14px", color: "rgba(255,255,255,0.6)" }}>
                <Check size={16} color="#10B981" />
                {item}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ borderTop: "1px solid rgba(255,255,255,0.05)", padding: "40px 24px", background: "#0A0A0F" }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "20px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "32px", height: "32px", borderRadius: "8px", background: "linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)" }}>
              <Shield size={16} color="#fff" />
            </div>
            <span style={{ fontSize: "16px", fontWeight: 600, color: "#fff" }}>SafeMotor</span>
          </div>
          <div style={{ display: "flex", gap: "24px", flexWrap: "wrap" }}>
            {[
              { label: "Accueil", href: "/" },
              { label: "Tarifs", href: "/#tarifs" },
              { label: "CGU", href: "/cgu" },
              { label: "Mentions légales", href: "/mentions-legales" },
            ].map((link) => (
              <Link key={link.href} href={link.href} style={{ fontSize: "14px", color: "rgba(255,255,255,0.5)", textDecoration: "none" }}>
                {link.label}
              </Link>
            ))}
          </div>
          <p style={{ fontSize: "13px", color: "rgba(255,255,255,0.4)" }}>© 2026 SafeMotor · Tous droits réservés</p>
        </div>
      </footer>

      {/* CSS pour responsivité */}
      <style jsx>{`
        @media (max-width: 768px) {
          .pricing-demo-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </main>
  );
}
