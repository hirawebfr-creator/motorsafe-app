'use client'

import { Button } from '@/components/shared/button'
import { Badge } from '@/components/shared/badge'
import Link from 'next/link'
import { useState } from 'react'
import {
  FileCheck,
  PenTool,
  Shield,
  Download,
  Check,
  ChevronDown,
  ArrowRight,
  Menu,
  X
} from 'lucide-react'

// ============================================================================
// FAQ DATA
// ============================================================================

const FAQ_ITEMS = [
  {
    question: 'Quelle est la valeur juridique des signatures ?',
    answer:
      'Les signatures électroniques MotorSafe respectent le règlement eIDAS et ont une valeur juridique équivalente à une signature manuscrite. Elles sont horodatées et liées de manière unique au signataire.',
  },
  {
    question: 'Combien de temps les données sont conservées ?',
    answer:
      '10 ans minimum pour les documents juridiques, conformément au Code du commerce. Vous pouvez exporter vos données à tout moment en format PDF ou JSON.',
  },
  {
    question: 'Puis-je exporter mes données ?',
    answer:
      'Oui, export complet en JSON, PDF ou ZIP à tout moment. Vos données vous appartiennent et sont portables vers tout autre système.',
  },
  {
    question: 'Le SIV est-il inclus ?',
    answer:
      '100 recherches/mois en plan PRO, illimité en PREMIUM. Le SIV permet de récupérer automatiquement les informations véhicule depuis la carte grise.',
  },
  {
    question: 'Y a-t-il un engagement ?',
    answer:
      'Aucun engagement, résiliation à tout moment avec préavis de 30 jours. Vos données restent exportables après résiliation.',
  },
  {
    question: "Comment fonctionne l'essai gratuit ?",
    answer:
      '30 jours complets sans CB requise, avec toutes les fonctionnalités PRO. À la fin de l\'essai, vous choisissez votre plan ou vos données sont conservées 30 jours supplémentaires.',
  },
]

// ============================================================================
// FEATURES DATA
// ============================================================================

const FEATURES = [
  {
    icon: <FileCheck size={32} />,
    title: 'Traçabilité totale',
    description:
      'Chaque intervention est horodatée, signée et conservée 10 ans selon les obligations légales.',
  },
  {
    icon: <PenTool size={32} />,
    title: 'Signatures électroniques',
    description:
      'Signatures client et atelier avec valeur probante conforme au règlement eIDAS.',
  },
  {
    icon: <Shield size={32} />,
    title: 'Preuves cryptographiques',
    description:
      'Chaîne de preuves immuable avec hashes SHA256. Impossibilité de falsification.',
  },
  {
    icon: <Download size={32} />,
    title: 'Export assurance',
    description:
      'Export complet pour experts et assurances en 1 clic avec toutes les preuves.',
  },
]

// ============================================================================
// PRICING DATA
// ============================================================================

const PLANS = [
  {
    name: 'Starter',
    price: 19,
    features: [
      '50 interventions/mois',
      'Signatures électroniques',
      'Documents illimités',
      'Support email',
    ],
    cta: 'Essai gratuit',
    popular: false,
  },
  {
    name: 'Pro',
    price: 49,
    features: [
      'Interventions illimitées',
      'Recherche SIV (100/mois)',
      'Export assurance',
      'Support prioritaire',
    ],
    cta: 'Commencer',
    popular: true,
  },
  {
    name: 'Premium',
    price: 99,
    features: [
      'Tout PRO inclus',
      'IA Copilot',
      'SIV illimité',
      'Support téléphone',
      'API access',
    ],
    cta: 'Contacter',
    popular: false,
  },
]

// ============================================================================
// FOOTER LINKS
// ============================================================================

const LEGAL_LINKS = [
  { label: 'CGU', href: '/cgu' },
  { label: 'CGV', href: '/cgv' },
  { label: 'Politique de confidentialité', href: '/politique-confidentialite' },
  { label: 'Mentions légales', href: '/mentions-legales' },
]

// ============================================================================
// FAQ ACCORDION COMPONENT
// ============================================================================

function FAQItem({
  question,
  answer,
  isOpen,
  onToggle,
}: {
  question: string
  answer: string
  isOpen: boolean
  onToggle: () => void
}) {
  return (
    <div
      style={{
        borderBottom: '1px solid #E5E7EB',
      }}
    >
      <button
        onClick={onToggle}
        style={{
          width: '100%',
          padding: '24px 0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          textAlign: 'left',
        }}
      >
        <span
          style={{
            fontSize: '16px',
            fontWeight: 600,
            color: '#111827',
          }}
        >
          {question}
        </span>
        <ChevronDown
          size={20}
          style={{
            color: '#6B7280',
            transition: 'transform 0.2s ease',
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0)',
            flexShrink: 0,
            marginLeft: '16px',
          }}
        />
      </button>
      <div
        style={{
          overflow: 'hidden',
          maxHeight: isOpen ? '200px' : '0',
          transition: 'max-height 0.3s ease, padding 0.3s ease',
          paddingBottom: isOpen ? '24px' : '0',
        }}
      >
        <p
          style={{
            fontSize: '15px',
            lineHeight: 1.7,
            color: '#6B7280',
            margin: 0,
          }}
        >
          {answer}
        </p>
      </div>
    </div>
  )
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function LandingPage() {
  const [openFAQ, setOpenFAQ] = useState<number | null>(null)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#FFFFFF' }}>
      {/* ================================================================== */}
      {/* NAVIGATION */}
      {/* ================================================================== */}
      <nav
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 50,
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(8px)',
          borderBottom: '1px solid #E5E7EB',
        }}
      >
        <div
          style={{
            maxWidth: '1200px',
            margin: '0 auto',
            padding: '16px 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          {/* Logo */}
          <Link
            href="/"
            style={{
              fontSize: '24px',
              fontWeight: 700,
              color: '#0A1628',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              textDecoration: 'none',
            }}
          >
            <Shield size={28} />
            MotorSafe
          </Link>

          {/* Desktop Nav */}
          <div
            style={{
              display: 'flex',
              gap: '32px',
              alignItems: 'center',
            }}
          >
            <div
              style={{
                display: 'flex',
                gap: '24px',
              }}
              className="desktop-nav"
            >
              <a
                href="#features"
                style={{
                  color: '#6B7280',
                  textDecoration: 'none',
                  fontSize: '15px',
                  fontWeight: 500,
                }}
              >
                Fonctionnalités
              </a>
              <a
                href="#pricing"
                style={{
                  color: '#6B7280',
                  textDecoration: 'none',
                  fontSize: '15px',
                  fontWeight: 500,
                }}
              >
                Tarifs
              </a>
              <a
                href="#faq"
                style={{
                  color: '#6B7280',
                  textDecoration: 'none',
                  fontSize: '15px',
                  fontWeight: 500,
                }}
              >
                FAQ
              </a>
            </div>

            <div
              style={{ display: 'flex', gap: '12px', alignItems: 'center' }}
            >
              <Link
                href="/auth/login"
                style={{
                  color: '#6B7280',
                  textDecoration: 'none',
                  fontSize: '15px',
                  fontWeight: 500,
                  padding: '8px 16px',
                }}
              >
                Connexion
              </Link>
              <Link href="/pro/inscription">
                <Button variant="primary" size="md">
                  Essai gratuit
                </Button>
              </Link>
            </div>

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              style={{
                display: 'none',
                background: 'none',
                border: 'none',
                padding: '8px',
                cursor: 'pointer',
                color: '#0A1628',
              }}
              className="mobile-menu-btn"
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div
            style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              right: 0,
              backgroundColor: '#FFFFFF',
              borderBottom: '1px solid #E5E7EB',
              padding: '16px 24px',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
            }}
          >
            <a
              href="#features"
              onClick={() => setMobileMenuOpen(false)}
              style={{
                color: '#111827',
                textDecoration: 'none',
                fontSize: '16px',
                fontWeight: 500,
                padding: '8px 0',
              }}
            >
              Fonctionnalités
            </a>
            <a
              href="#pricing"
              onClick={() => setMobileMenuOpen(false)}
              style={{
                color: '#111827',
                textDecoration: 'none',
                fontSize: '16px',
                fontWeight: 500,
                padding: '8px 0',
              }}
            >
              Tarifs
            </a>
            <a
              href="#faq"
              onClick={() => setMobileMenuOpen(false)}
              style={{
                color: '#111827',
                textDecoration: 'none',
                fontSize: '16px',
                fontWeight: 500,
                padding: '8px 0',
              }}
            >
              FAQ
            </a>
            <Link
              href="/auth/login"
              style={{
                color: '#111827',
                textDecoration: 'none',
                fontSize: '16px',
                fontWeight: 500,
                padding: '8px 0',
              }}
            >
              Connexion
            </Link>
            <Link href="/pro/inscription" style={{ marginTop: '8px' }}>
              <Button variant="primary" size="md" fullWidth>
                Essai gratuit
              </Button>
            </Link>
          </div>
        )}
      </nav>

      {/* Responsive styles */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
            @media (max-width: 768px) {
              .desktop-nav { display: none !important; }
              .mobile-menu-btn { display: block !important; }
              .hero-grid { grid-template-columns: 1fr !important; }
              .hero-title { font-size: 36px !important; }
              .hero-image { display: none !important; }
              .pricing-grid { grid-template-columns: 1fr !important; }
              .pricing-popular { transform: none !important; }
            }
            @media (min-width: 769px) {
              .mobile-menu-btn { display: none !important; }
            }
          `,
        }}
      />

      {/* ================================================================== */}
      {/* HERO SECTION */}
      {/* ================================================================== */}
      <section
        style={{
          marginTop: '64px',
          padding: '100px 24px 80px',
          background:
            'linear-gradient(135deg, #0A1628 0%, #1a2638 60%, #2d3a4f 100%)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Background decorations */}
        <div
          style={{
            position: 'absolute',
            top: '10%',
            right: '10%',
            width: '400px',
            height: '400px',
            background:
              'radial-gradient(circle, rgba(255,127,0,0.1) 0%, transparent 70%)',
            borderRadius: '50%',
            pointerEvents: 'none',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: '-10%',
            left: '-5%',
            width: '300px',
            height: '300px',
            background:
              'radial-gradient(circle, rgba(59,130,246,0.1) 0%, transparent 70%)',
            borderRadius: '50%',
            pointerEvents: 'none',
          }}
        />

        <div
          className="hero-grid"
          style={{
            maxWidth: '1200px',
            margin: '0 auto',
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '60px',
            alignItems: 'center',
            position: 'relative',
            zIndex: 1,
          }}
        >
          {/* Left side */}
          <div>
            <Badge variant="info" size="md">
              ✨ Nouveau : IA Copilot disponible
            </Badge>

            <h1
              className="hero-title"
              style={{
                fontSize: '52px',
                fontWeight: 700,
                lineHeight: 1.1,
                color: '#FFFFFF',
                marginTop: '24px',
                marginBottom: '24px',
              }}
            >
              La protection juridique pour votre garage
            </h1>

            <p
              style={{
                fontSize: '18px',
                lineHeight: 1.7,
                color: 'rgba(255, 255, 255, 0.85)',
                marginBottom: '40px',
                maxWidth: '500px',
              }}
            >
              Sécurisez vos interventions avec des signatures électroniques et
              une traçabilité complète. Protégez votre activité en cas de
              litige.
            </p>

            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
              <Link href="/pro/inscription">
                <Button variant="primary" size="lg" rightIcon={<ArrowRight size={20} />}>
                  Essai gratuit 30 jours
                </Button>
              </Link>
              <Link href="/demo">
                <Button variant="secondary" size="lg">
                  Voir la démo
                </Button>
              </Link>
            </div>

            <p
              style={{
                fontSize: '14px',
                color: 'rgba(255, 255, 255, 0.6)',
                marginTop: '24px',
                display: 'flex',
                gap: '16px',
                flexWrap: 'wrap',
              }}
            >
              <span>✓ Sans engagement</span>
              <span>✓ Sans CB</span>
              <span>✓ Configuration en 5 min</span>
            </p>
          </div>

          {/* Right side - Screenshot placeholder */}
          <div
            className="hero-image"
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.08)',
              borderRadius: '16px',
              padding: '32px',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              aspectRatio: '16/10',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backdropFilter: 'blur(10px)',
            }}
          >
            <div
              style={{
                textAlign: 'center',
                color: 'rgba(255, 255, 255, 0.5)',
              }}
            >
              <Shield size={64} style={{ marginBottom: '16px', opacity: 0.5 }} />
              <p style={{ fontSize: '14px' }}>Screenshot Dashboard MotorSafe</p>
            </div>
          </div>
        </div>
      </section>

      {/* ================================================================== */}
      {/* FEATURES SECTION */}
      {/* ================================================================== */}
      <section
        id="features"
        style={{
          padding: '100px 24px',
          backgroundColor: '#FFFFFF',
        }}
      >
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '64px' }}>
            <h2
              style={{
                fontSize: '36px',
                fontWeight: 700,
                color: '#111827',
                marginBottom: '16px',
              }}
            >
              Pourquoi MotorSafe ?
            </h2>
            <p
              style={{
                fontSize: '18px',
                color: '#6B7280',
                maxWidth: '600px',
                margin: '0 auto',
                lineHeight: 1.6,
              }}
            >
              La solution complète pour protéger votre garage et vos clients en
              toute conformité légale.
            </p>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '32px',
            }}
          >
            {FEATURES.map((feature, index) => (
              <div
                key={index}
                style={{
                  padding: '32px',
                  backgroundColor: '#F9FAFB',
                  borderRadius: '16px',
                  border: '1px solid #E5E7EB',
                  transition: 'all 0.2s ease',
                  cursor: 'default',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px)'
                  e.currentTarget.style.boxShadow =
                    '0 12px 24px rgba(0,0,0,0.08)'
                  e.currentTarget.style.borderColor = '#0A1628'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)'
                  e.currentTarget.style.boxShadow = 'none'
                  e.currentTarget.style.borderColor = '#E5E7EB'
                }}
              >
                <div
                  style={{
                    width: '56px',
                    height: '56px',
                    backgroundColor: '#0A1628',
                    borderRadius: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#FFFFFF',
                    marginBottom: '20px',
                  }}
                >
                  {feature.icon}
                </div>
                <h3
                  style={{
                    fontSize: '20px',
                    fontWeight: 600,
                    color: '#111827',
                    marginBottom: '12px',
                  }}
                >
                  {feature.title}
                </h3>
                <p
                  style={{
                    fontSize: '15px',
                    lineHeight: 1.7,
                    color: '#6B7280',
                    margin: 0,
                  }}
                >
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================================================================== */}
      {/* PRICING SECTION */}
      {/* ================================================================== */}
      <section
        id="pricing"
        style={{
          padding: '100px 24px',
          backgroundColor: '#F9FAFB',
        }}
      >
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '64px' }}>
            <h2
              style={{
                fontSize: '36px',
                fontWeight: 700,
                color: '#111827',
                marginBottom: '16px',
              }}
            >
              Plans adaptés à votre activité
            </h2>
            <p
              style={{
                fontSize: '18px',
                color: '#6B7280',
              }}
            >
              Choisissez le plan qui correspond à vos besoins
            </p>
          </div>

          <div
            className="pricing-grid"
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
              gap: '24px',
              alignItems: 'center',
            }}
          >
            {PLANS.map((plan, index) => (
              <div
                key={index}
                className={plan.popular ? 'pricing-popular' : ''}
                style={{
                  padding: '40px',
                  backgroundColor: plan.popular ? '#0A1628' : '#FFFFFF',
                  borderRadius: '16px',
                  border: plan.popular
                    ? '2px solid #0A1628'
                    : '2px solid #E5E7EB',
                  position: 'relative',
                  transform: plan.popular ? 'scale(1.05)' : 'none',
                  boxShadow: plan.popular
                    ? '0 20px 40px rgba(10,22,40,0.2)'
                    : 'none',
                }}
              >
                {plan.popular && (
                  <div
                    style={{
                      position: 'absolute',
                      top: '-12px',
                      right: '24px',
                    }}
                  >
                    <Badge variant="warning" size="md">
                      ⭐ Populaire
                    </Badge>
                  </div>
                )}

                <h3
                  style={{
                    fontSize: '24px',
                    fontWeight: 600,
                    color: plan.popular ? '#FFFFFF' : '#111827',
                    marginBottom: '8px',
                  }}
                >
                  {plan.name}
                </h3>

                <div style={{ marginBottom: '24px' }}>
                  <span
                    style={{
                      fontSize: '48px',
                      fontWeight: 700,
                      color: plan.popular ? '#FFFFFF' : '#0A1628',
                    }}
                  >
                    {plan.price}€
                  </span>
                  <span
                    style={{
                      fontSize: '16px',
                      color: plan.popular
                        ? 'rgba(255,255,255,0.7)'
                        : '#6B7280',
                    }}
                  >
                    /mois
                  </span>
                </div>

                <ul
                  style={{
                    listStyle: 'none',
                    padding: 0,
                    margin: '0 0 32px 0',
                  }}
                >
                  {plan.features.map((feature, i) => (
                    <li
                      key={i}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        marginBottom: '14px',
                        fontSize: '15px',
                        color: plan.popular
                          ? 'rgba(255,255,255,0.9)'
                          : '#6B7280',
                      }}
                    >
                      <Check
                        size={18}
                        style={{
                          color: '#16A34A',
                          flexShrink: 0,
                        }}
                      />
                      {feature}
                    </li>
                  ))}
                </ul>

                <Link href="/pro/inscription">
                  <Button
                    variant={plan.popular ? 'secondary' : 'primary'}
                    size="lg"
                    fullWidth
                  >
                    {plan.cta}
                  </Button>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================================================================== */}
      {/* FAQ SECTION */}
      {/* ================================================================== */}
      <section
        id="faq"
        style={{
          padding: '100px 24px',
          backgroundColor: '#FFFFFF',
        }}
      >
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <h2
            style={{
              fontSize: '36px',
              fontWeight: 700,
              color: '#111827',
              marginBottom: '48px',
              textAlign: 'center',
            }}
          >
            Questions fréquentes
          </h2>

          <div
            style={{
              borderTop: '1px solid #E5E7EB',
            }}
          >
            {FAQ_ITEMS.map((item, index) => (
              <FAQItem
                key={index}
                question={item.question}
                answer={item.answer}
                isOpen={openFAQ === index}
                onToggle={() => setOpenFAQ(openFAQ === index ? null : index)}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ================================================================== */}
      {/* CTA SECTION */}
      {/* ================================================================== */}
      <section
        style={{
          padding: '80px 24px',
          background: 'linear-gradient(135deg, #0A1628 0%, #1a2638 100%)',
        }}
      >
        <div
          style={{
            maxWidth: '800px',
            margin: '0 auto',
            textAlign: 'center',
          }}
        >
          <h2
            style={{
              fontSize: '32px',
              fontWeight: 700,
              color: '#FFFFFF',
              marginBottom: '16px',
            }}
          >
            Prêt à protéger votre garage ?
          </h2>
          <p
            style={{
              fontSize: '18px',
              color: 'rgba(255,255,255,0.8)',
              marginBottom: '32px',
            }}
          >
            Rejoignez des centaines de garages qui sécurisent leurs
            interventions avec MotorSafe.
          </p>
          <div
            style={{
              display: 'flex',
              gap: '16px',
              justifyContent: 'center',
              flexWrap: 'wrap',
            }}
          >
            <Link href="/pro/inscription">
              <Button variant="primary" size="lg" rightIcon={<ArrowRight size={20} />}>
                Démarrer l'essai gratuit
              </Button>
            </Link>
            <Link href="/contact">
              <Button variant="secondary" size="lg">
                Nous contacter
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ================================================================== */}
      {/* FOOTER */}
      {/* ================================================================== */}
      <footer
        style={{
          padding: '60px 24px 40px',
          backgroundColor: '#0A1628',
          color: '#FFFFFF',
        }}
      >
        <div
          style={{
            maxWidth: '1200px',
            margin: '0 auto',
          }}
        >
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '40px',
              marginBottom: '40px',
            }}
          >
            {/* Logo + Tagline */}
            <div>
              <div
                style={{
                  fontSize: '24px',
                  fontWeight: 700,
                  marginBottom: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <Shield size={24} />
                MotorSafe
              </div>
              <p
                style={{
                  fontSize: '14px',
                  color: 'rgba(255,255,255,0.7)',
                  lineHeight: 1.7,
                  maxWidth: '250px',
                }}
              >
                La protection juridique pour votre garage automobile. Traçabilité,
                signatures électroniques et conformité.
              </p>
            </div>

            {/* Legal Links */}
            <div>
              <h4
                style={{
                  fontSize: '14px',
                  fontWeight: 600,
                  marginBottom: '16px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}
              >
                Légal
              </h4>
              <ul
                style={{
                  listStyle: 'none',
                  padding: 0,
                  margin: 0,
                }}
              >
                {LEGAL_LINKS.map((link, i) => (
                  <li key={i} style={{ marginBottom: '10px' }}>
                    <Link
                      href={link.href}
                      style={{
                        color: 'rgba(255,255,255,0.7)',
                        textDecoration: 'none',
                        fontSize: '14px',
                        transition: 'color 0.2s',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.color = '#FFFFFF'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.color = 'rgba(255,255,255,0.7)'
                      }}
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Product Links */}
            <div>
              <h4
                style={{
                  fontSize: '14px',
                  fontWeight: 600,
                  marginBottom: '16px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}
              >
                Produit
              </h4>
              <ul
                style={{
                  listStyle: 'none',
                  padding: 0,
                  margin: 0,
                }}
              >
                {[
                  { label: 'Fonctionnalités', href: '#features' },
                  { label: 'Tarifs', href: '#pricing' },
                  { label: 'FAQ', href: '#faq' },
                  { label: 'Démo', href: '/demo' },
                ].map((link, i) => (
                  <li key={i} style={{ marginBottom: '10px' }}>
                    <Link
                      href={link.href}
                      style={{
                        color: 'rgba(255,255,255,0.7)',
                        textDecoration: 'none',
                        fontSize: '14px',
                        transition: 'color 0.2s',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.color = '#FFFFFF'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.color = 'rgba(255,255,255,0.7)'
                      }}
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h4
                style={{
                  fontSize: '14px',
                  fontWeight: 600,
                  marginBottom: '16px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}
              >
                Contact
              </h4>
              <p
                style={{
                  fontSize: '14px',
                  color: 'rgba(255,255,255,0.7)',
                  marginBottom: '8px',
                }}
              >
                support@motorsafe.fr
              </p>
              <Link
                href="/contact"
                style={{
                  color: 'rgba(255,255,255,0.7)',
                  textDecoration: 'none',
                  fontSize: '14px',
                  transition: 'color 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = '#FFFFFF'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = 'rgba(255,255,255,0.7)'
                }}
              >
                Formulaire de contact →
              </Link>
            </div>
          </div>

          {/* Bottom bar */}
          <div
            style={{
              paddingTop: '32px',
              borderTop: '1px solid rgba(255,255,255,0.1)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '16px',
            }}
          >
            <p
              style={{
                fontSize: '14px',
                color: 'rgba(255,255,255,0.6)',
                margin: 0,
              }}
            >
              © 2026 MotorSafe. Tous droits réservés.
            </p>
            <div
              style={{
                display: 'flex',
                gap: '16px',
              }}
            >
              <span
                style={{
                  fontSize: '12px',
                  color: 'rgba(255,255,255,0.5)',
                }}
              >
                🇫🇷 Made in France
              </span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
