'use client'

import Link from 'next/link'
import { useState, useEffect, useRef } from 'react'
import {
  FileCheck,
  PenTool,
  Shield,
  Download,
  Check,
  ChevronDown,
  ArrowRight,
  Menu,
  X,
  Star,
  Users,
  FileText,
  Clock,
  Zap,
  Lock,
  TrendingUp,
  CheckCircle,
  Play,
} from 'lucide-react'

// ============================================================================
// ANIMATION HOOK
// ============================================================================

function useInView(threshold = 0.1) {
  const ref = useRef<HTMLDivElement>(null)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setIsVisible(true) },
      { threshold }
    )
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [threshold])

  return { ref, isVisible }
}

// ============================================================================
// DATA
// ============================================================================

const STATS = [
  { value: '500+', label: 'Garages actifs', icon: Users },
  { value: '50K+', label: 'Documents signes', icon: FileText },
  { value: '99.9%', label: 'Uptime', icon: TrendingUp },
  { value: '<5min', label: 'Configuration', icon: Clock },
]

const FEATURES_DATA = [
  {
    icon: FileCheck,
    title: 'Tracabilite totale',
    description: 'Chaque intervention est horodatee, signee et conservee 10 ans selon les obligations legales.',
    color: '#6366F1',
  },
  {
    icon: PenTool,
    title: 'Signatures electroniques',
    description: 'Signatures client et atelier avec valeur probante conforme au reglement eIDAS.',
    color: '#8B5CF6',
  },
  {
    icon: Shield,
    title: 'Preuves cryptographiques',
    description: 'Chaine de preuves immuable avec hashes SHA256. Impossibilite de falsification.',
    color: '#10B981',
  },
  {
    icon: Download,
    title: 'Export assurance',
    description: 'Export complet pour experts et assurances en 1 clic avec toutes les preuves.',
    color: '#F59E0B',
  },
  {
    icon: Zap,
    title: 'IA Copilot',
    description: 'Assistant intelligent pour rédiger vos devis et interventions en quelques secondes.',
    color: '#EC4899',
  },
  {
    icon: Lock,
    title: 'RGPD natif',
    description: 'Données hébergées en France, chiffrement AES-256, conformité totale.',
    color: '#3B82F6',
  },
]

const STEPS = [
  {
    step: '01',
    title: 'Créez votre garage',
    description: 'Inscription en 2 minutes, pas de carte bancaire requise. Importez vos clients existants.',
  },
  {
    step: '02',
    title: 'Documentez vos interventions',
    description: 'Créez des devis, ordres de réparation et factures avec signature électronique.',
  },
  {
    step: '03',
    title: 'Protégez votre activité',
    description: 'En cas de litige, exportez toutes les preuves en 1 clic pour les assurances.',
  },
]

const TESTIMONIALS = [
  {
    name: 'Jean-Pierre Martin',
    role: 'Gérant, Garage Martin & Fils',
    content: 'Depuis que j\'utilise SafeMotor, je dors tranquille. Un client a voulu contester une réparation, j\'ai sorti le dossier en 2 clics avec toutes les preuves signées.',
    avatar: 'JP',
    rating: 5,
  },
  {
    name: 'Sophie Durand',
    role: 'Directrice, Auto Service Pro',
    content: 'L\'interface est super intuitive. Mes mécaniciens ont pris en main l\'outil en une journée. Les signatures sur tablette, c\'est un vrai gain de temps.',
    avatar: 'SD',
    rating: 5,
  },
  {
    name: 'Marc Lefebvre',
    role: 'Propriétaire, Garage du Centre',
    content: 'Le retour sur investissement est immédiat. Plus de litiges perdus, plus de paperasse. Je recommande à tous les garagistes.',
    avatar: 'ML',
    rating: 5,
  },
]

const PLANS_DATA = [
  {
    name: 'Gratuit',
    price: 0,
    period: '',
    description: 'Découverte',
features: ['1 utilisateur', '10 clients / véhicules', '10 interventions', '1 Go stockage', 'Signature basique'],
    notIncluded: ['SIV', 'SafeMotor Copilot'],
    cta: 'Tester gratuitement',
    popular: false,
    color: '#64748B',
  },
  {
    name: 'PRO',
    price: 89,
    period: '/mois',
    description: 'Garage indépendant',
    features: ['3 utilisateurs', 'Clients illimités', 'Devis + factures illimités', 'Signature + preuves', '50 SIV/mois inclus', '10 Go stockage', 'Copilot passif'],
    notIncluded: [],
    cta: 'Commencer',
    popular: true,
    color: '#6366F1',
  },
  {
    name: 'EXPERT',
    price: 149,
    period: '/mois',
    description: 'Protection maximale',
    features: ['5 utilisateurs', 'Tout PRO inclus', 'Exports assurance/litige', 'Checklists conformité', '150 SIV/mois inclus', '50 Go stockage', 'Copilot juridique'],
    notIncluded: [],
    cta: 'Choisir Expert',
    popular: false,
    color: '#F59E0B',
  },
  {
    name: 'PREMIUM',
    price: 249,
    period: '/mois',
    description: 'Gros volume',
    features: ['10 utilisateurs', 'Tout EXPERT inclus', 'Multi-sites possible', 'Audit complet', '300 SIV/mois inclus', '200 Go stockage', 'Copilot avancé'],
    notIncluded: [],
    cta: 'Contacter',
    popular: false,
    color: '#EF4444',
  },
]

const FAQ_DATA = [
  { question: 'Quelle est la valeur juridique des signatures ?', answer: 'Les signatures électroniques SafeMotor respectent le règlement eIDAS et ont une valeur juridique équivalente à une signature manuscrite. Elles sont horodatées et liées de manière unique au signataire.' },
  { question: 'Combien de temps les données sont conservées ?', answer: '10 ans minimum pour les documents juridiques, conformément au Code du commerce. Vous pouvez exporter vos données à tout moment en format PDF ou JSON.' },
  { question: 'Puis-je exporter mes données ?', answer: 'Oui, export complet en JSON, PDF ou ZIP à tout moment. Vos données vous appartiennent et sont portables vers tout autre système.' },
  { question: 'Le SIV est-il inclus ?', answer: '50 recherches/mois en PRO, 150 en EXPERT, 300 en PREMIUM. Vous pouvez aussi acheter des packs SIV supplémentaires (50 pour 15€, 100 pour 29€, 500 pour 129€).' },
  { question: 'Y a-t-il un engagement ?', answer: 'Aucun engagement, résiliation à tout moment. Économisez 2 mois en choisissant le paiement annuel.' },
  { question: 'Comment fonctionne SafeMotor Copilot ?', answer: 'L\'IA est assistive : elle suggère, alerte et vérifie vos dossiers. Niveau passif en PRO (rappels), juridique en EXPERT (alertes litiges), avancé en PREMIUM (analyse proactive).' },
]

const LEGAL_LINKS = [
  { label: 'CGU', href: '/cgu' },
  { label: 'CGV', href: '/cgv' },
  { label: 'Confidentialité', href: '/politique-confidentialite' },
  { label: 'Mentions légales', href: '/mentions-legales' },
]

// ============================================================================
// COMPONENTS
// ============================================================================

function FAQItemComponent({ question, answer, isOpen, onToggle }: { question: string; answer: string; isOpen: boolean; onToggle: () => void }) {
  return (
    <div style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
      <button onClick={onToggle} style={{ width: '100%', padding: '24px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}>
        <span style={{ fontSize: '16px', fontWeight: 600, color: '#fff' }}>{question}</span>
        <ChevronDown size={20} style={{ color: 'rgba(255,255,255,0.5)', transition: 'transform 0.3s', transform: isOpen ? 'rotate(180deg)' : 'rotate(0)', flexShrink: 0, marginLeft: '16px' }} />
      </button>
      <div style={{ overflow: 'hidden', maxHeight: isOpen ? '200px' : '0', transition: 'max-height 0.3s ease, padding 0.3s ease', paddingBottom: isOpen ? '24px' : '0' }}>
        <p style={{ fontSize: '15px', lineHeight: 1.7, color: 'rgba(255,255,255,0.7)', margin: 0 }}>{answer}</p>
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
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const heroAnim = useInView()
  const statsAnim = useInView()
  const featuresAnim = useInView()
  const stepsAnim = useInView()
  const testimonialsAnim = useInView()
  const pricingAnim = useInView()

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#0A0A0F', color: '#fff', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      
      {/* GLOBAL STYLES */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes gradient { 0%, 100% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } }
        @keyframes float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-20px); } }
        @keyframes pulse-glow { 0%, 100% { box-shadow: 0 0 20px rgba(99, 102, 241, 0.4); } 50% { box-shadow: 0 0 40px rgba(99, 102, 241, 0.8); } }
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
        .animate-in { animation: fadeInUp 0.8s ease forwards; }
        @media (max-width: 1024px) {
          .pricing-grid { grid-template-columns: repeat(2, 1fr) !important; }
          .comparison-grid { grid-template-columns: 1fr !important; }
        }
        @media (max-width: 768px) {
          .desktop-nav { display: none !important; }
          .mobile-menu-btn { display: flex !important; }
          .hero-grid { grid-template-columns: 1fr !important; text-align: center; }
          .hero-title { font-size: 36px !important; }
          .hero-buttons { justify-content: center !important; }
          .hero-image { display: none !important; }
          .stats-grid { grid-template-columns: repeat(2, 1fr) !important; }
          .features-grid { grid-template-columns: 1fr !important; }
          .steps-grid { grid-template-columns: 1fr !important; }
          .testimonials-grid { grid-template-columns: 1fr !important; }
          .pricing-grid { grid-template-columns: 1fr !important; }
          .packs-grid { grid-template-columns: 1fr !important; }
          .comparison-grid { grid-template-columns: 1fr !important; }
          .footer-grid { grid-template-columns: 1fr !important; text-align: center; }
        }
      ` }} />

      {/* NAVIGATION */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        backgroundColor: scrolled ? 'rgba(10, 10, 15, 0.95)' : 'transparent',
        backdropFilter: scrolled ? 'blur(20px)' : 'none',
        borderBottom: scrolled ? '1px solid rgba(255,255,255,0.1)' : 'none',
        transition: 'all 0.3s ease',
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Link href="/" style={{ fontSize: '24px', fontWeight: 700, color: '#fff', display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Shield size={20} color="#fff" />
            </div>
            SafeMotor
          </Link>

          <div className="desktop-nav" style={{ display: 'flex', gap: '32px', alignItems: 'center' }}>
            <div style={{ display: 'flex', gap: '28px' }}>
              {['Fonctionnalites', 'Tarifs', 'Temoignages', 'FAQ'].map((item) => (
                <a key={item} href={'#' + item.toLowerCase()} style={{ color: 'rgba(255,255,255,0.7)', textDecoration: 'none', fontSize: '14px', fontWeight: 500, transition: 'color 0.2s' }}
                  onMouseEnter={(e) => e.currentTarget.style.color = '#fff'}
                  onMouseLeave={(e) => e.currentTarget.style.color = 'rgba(255,255,255,0.7)'}
                >{item}</a>
              ))}
            </div>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <Link href="/auth/login" style={{ color: 'rgba(255,255,255,0.7)', textDecoration: 'none', fontSize: '14px', fontWeight: 500, padding: '8px 16px' }}>Connexion</Link>
              <Link href="/pro/inscription">
                <button style={{ padding: '10px 20px', borderRadius: '10px', border: 'none', background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)', fontSize: '14px', fontWeight: 600, color: '#fff', cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 4px 15px rgba(99, 102, 241, 0.4)' }}
                  onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                  onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                >Essai gratuit</button>
              </Link>
            </div>
          </div>

          <button className="mobile-menu-btn" onClick={() => setMobileMenuOpen(!mobileMenuOpen)} style={{ display: 'none', background: 'none', border: 'none', padding: '8px', cursor: 'pointer', color: '#fff', alignItems: 'center', justifyContent: 'center' }}>
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {mobileMenuOpen && (
          <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, backgroundColor: 'rgba(10, 10, 15, 0.98)', backdropFilter: 'blur(20px)', padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {['Fonctionnalites', 'Tarifs', 'Temoignages', 'FAQ'].map((item) => (
              <a key={item} href={'#' + item.toLowerCase()} onClick={() => setMobileMenuOpen(false)} style={{ color: '#fff', textDecoration: 'none', fontSize: '16px', fontWeight: 500, padding: '12px 0' }}>{item}</a>
            ))}
            <Link href="/auth/login" style={{ color: '#fff', textDecoration: 'none', fontSize: '16px', fontWeight: 500, padding: '12px 0' }}>Connexion</Link>
            <Link href="/pro/inscription" style={{ marginTop: '8px' }}>
              <button style={{ width: '100%', padding: '14px', borderRadius: '10px', border: 'none', background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)', fontSize: '16px', fontWeight: 600, color: '#fff', cursor: 'pointer' }}>Essai gratuit</button>
            </Link>
          </div>
        )}
      </nav>

      {/* HERO */}
      <section ref={heroAnim.ref} style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center',
        padding: '120px 24px 80px',
        background: 'radial-gradient(ellipse 80% 50% at 50% -20%, rgba(99, 102, 241, 0.3) 0%, transparent 50%), linear-gradient(to bottom, #0A0A0F 0%, #12121A 100%)',
        position: 'relative', overflow: 'hidden',
      }}>
        {/* Animated bg elements */}
        <div style={{ position: 'absolute', top: '20%', left: '10%', width: '300px', height: '300px', background: 'radial-gradient(circle, rgba(99, 102, 241, 0.15) 0%, transparent 70%)', borderRadius: '50%', animation: 'float 6s ease-in-out infinite', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: '10%', right: '15%', width: '200px', height: '200px', background: 'radial-gradient(circle, rgba(139, 92, 246, 0.15) 0%, transparent 70%)', borderRadius: '50%', animation: 'float 8s ease-in-out infinite 1s', pointerEvents: 'none' }} />

        <div className="hero-grid" style={{ maxWidth: '1200px', margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '80px', alignItems: 'center', position: 'relative', zIndex: 1 }}>
          <div style={{ opacity: heroAnim.isVisible ? 1 : 0, transform: heroAnim.isVisible ? 'translateY(0)' : 'translateY(30px)', transition: 'all 0.8s ease' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '8px 16px', borderRadius: '50px', background: 'rgba(99, 102, 241, 0.15)', border: '1px solid rgba(99, 102, 241, 0.3)', marginBottom: '24px' }}>
              <Zap size={14} style={{ color: '#A5B4FC' }} />
              <span style={{ fontSize: '13px', color: '#A5B4FC', fontWeight: 500 }}>Nouveau : IA Copilot disponible</span>
            </div>

            <h1 className="hero-title" style={{ fontSize: '56px', fontWeight: 800, lineHeight: 1.1, color: '#fff', marginBottom: '24px', letterSpacing: '-0.02em' }}>
              La protection
              <span style={{ background: 'linear-gradient(135deg, #6366F1 0%, #A855F7 50%, #EC4899 100%)', backgroundSize: '200% 200%', animation: 'gradient 3s ease infinite', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', display: 'block' }}>
                juridique
              </span>
              de votre garage
            </h1>

            <p style={{ fontSize: '18px', lineHeight: 1.7, color: 'rgba(255,255,255,0.7)', marginBottom: '40px', maxWidth: '500px' }}>
              Sécurisez vos interventions avec des signatures électroniques et une traçabilité complète. Protégez votre activité en cas de litige.
            </p>

            <div className="hero-buttons" style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
              <Link href="/pro/inscription">
                <button style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '16px 28px', borderRadius: '12px', border: 'none', background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)', fontSize: '16px', fontWeight: 600, color: '#fff', cursor: 'pointer', transition: 'all 0.3s', boxShadow: '0 8px 30px rgba(99, 102, 241, 0.4)', animation: 'pulse-glow 2s ease-in-out infinite' }}
                  onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 12px 40px rgba(99, 102, 241, 0.5)' }}
                  onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 8px 30px rgba(99, 102, 241, 0.4)' }}
                >
                  Essai gratuit 30 jours
                  <ArrowRight size={18} />
                </button>
              </Link>
              <Link href="/demo">
                <button style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '16px 28px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.05)', fontSize: '16px', fontWeight: 600, color: '#fff', cursor: 'pointer', transition: 'all 0.3s', backdropFilter: 'blur(10px)' }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.3)' }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)' }}
                >
                  <Play size={18} />
                  Voir la démo
                </button>
              </Link>
            </div>

            <div style={{ display: 'flex', gap: '24px', marginTop: '32px', flexWrap: 'wrap' }}>
              {['Sans engagement', 'Sans CB', 'Config en 5 min'].map((item) => (
                <span key={item} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', color: 'rgba(255,255,255,0.6)' }}>
                  <CheckCircle size={16} style={{ color: '#10B981' }} />
                  {item}
                </span>
              ))}
            </div>
          </div>

          {/* Dashboard Preview */}
          <div className="hero-image" style={{ opacity: heroAnim.isVisible ? 1 : 0, transform: heroAnim.isVisible ? 'translateX(0)' : 'translateX(50px)', transition: 'all 0.8s ease 0.2s' }}>
            <div style={{ position: 'relative', borderRadius: '20px', overflow: 'hidden', background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(139, 92, 246, 0.1) 100%)', border: '1px solid rgba(255,255,255,0.1)', padding: '24px', backdropFilter: 'blur(20px)' }}>
              {/* Mock dashboard */}
              <div style={{ background: '#12121A', borderRadius: '12px', padding: '16px', marginBottom: '16px' }}>
                <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                  <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#EF4444' }} />
                  <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#F59E0B' }} />
                  <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#10B981' }} />
                </div>
                <div style={{ display: 'flex', gap: '16px' }}>
                  {[{ label: 'Interventions', value: '127', color: '#6366F1' }, { label: 'Signatures', value: '89', color: '#10B981' }, { label: 'CA', value: '24.5K', color: '#F59E0B' }].map((stat) => (
                    <div key={stat.label} style={{ flex: 1, background: 'rgba(255,255,255,0.05)', borderRadius: '10px', padding: '16px' }}>
                      <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', margin: '0 0 4px' }}>{stat.label}</p>
                      <p style={{ fontSize: '24px', fontWeight: 700, color: stat.color, margin: 0 }}>{stat.value}</p>
                    </div>
                  ))}
                </div>
              </div>
              {/* Mock list */}
              <div style={{ background: '#12121A', borderRadius: '12px', padding: '16px' }}>
                {[{ name: 'Devis #2024-127', status: 'Signe', color: '#10B981' }, { name: 'Facture #2024-089', status: 'Payee', color: '#6366F1' }, { name: 'OR #2024-156', status: 'En cours', color: '#F59E0B' }].map((item, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: i < 2 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}>
                    <span style={{ fontSize: '14px', color: '#fff' }}>{item.name}</span>
                    <span style={{ fontSize: '12px', padding: '4px 10px', borderRadius: '20px', background: item.color + '20', color: item.color }}>{item.status}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* STATS */}
      <section ref={statsAnim.ref} style={{ padding: '80px 24px', background: '#0D0D12', borderTop: '1px solid rgba(255,255,255,0.05)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <div className="stats-grid" style={{ maxWidth: '1000px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '32px' }}>
          {STATS.map((stat, i) => (
            <div key={i} style={{ textAlign: 'center', opacity: statsAnim.isVisible ? 1 : 0, transform: statsAnim.isVisible ? 'translateY(0)' : 'translateY(20px)', transition: 'all 0.6s ease ' + (i * 0.1) + 's' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.2) 0%, rgba(139, 92, 246, 0.2) 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                <stat.icon size={24} style={{ color: '#A5B4FC' }} />
              </div>
              <p style={{ fontSize: '36px', fontWeight: 800, color: '#fff', margin: '0 0 4px', background: 'linear-gradient(135deg, #fff 0%, rgba(255,255,255,0.8) 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{stat.value}</p>
              <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.5)', margin: 0 }}>{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* FEATURES */}
      <section id="fonctionnalites" ref={featuresAnim.ref} style={{ padding: '120px 24px', background: 'linear-gradient(to bottom, #0D0D12 0%, #0A0A0F 100%)' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '80px', opacity: featuresAnim.isVisible ? 1 : 0, transform: featuresAnim.isVisible ? 'translateY(0)' : 'translateY(30px)', transition: 'all 0.8s ease' }}>
            <p style={{ fontSize: '14px', fontWeight: 600, color: '#6366F1', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '12px' }}>Fonctionnalités</p>
            <h2 style={{ fontSize: '42px', fontWeight: 800, color: '#fff', marginBottom: '16px' }}>Tout ce dont vous avez besoin</h2>
            <p style={{ fontSize: '18px', color: 'rgba(255,255,255,0.6)', maxWidth: '600px', margin: '0 auto' }}>Une solution complète pour protéger votre garage et vos clients en toute conformité légale.</p>
          </div>

          <div className="features-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px' }}>
            {FEATURES_DATA.map((feature, i) => (
              <div key={i} style={{
                padding: '32px', borderRadius: '20px',
                background: 'linear-gradient(135deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%)',
                border: '1px solid rgba(255,255,255,0.08)',
                transition: 'all 0.3s ease', cursor: 'default',
                opacity: featuresAnim.isVisible ? 1 : 0,
                transform: featuresAnim.isVisible ? 'translateY(0)' : 'translateY(30px)',
              }}
                onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-8px)'; e.currentTarget.style.borderColor = feature.color; e.currentTarget.style.boxShadow = '0 20px 40px ' + feature.color + '15' }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; e.currentTarget.style.boxShadow = 'none' }}
              >
                <div style={{ width: '56px', height: '56px', borderRadius: '14px', background: feature.color + '15', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px' }}>
                  <feature.icon size={28} style={{ color: feature.color }} />
                </div>
                <h3 style={{ fontSize: '20px', fontWeight: 700, color: '#fff', marginBottom: '12px' }}>{feature.title}</h3>
                <p style={{ fontSize: '15px', lineHeight: 1.7, color: 'rgba(255,255,255,0.6)', margin: 0 }}>{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section ref={stepsAnim.ref} style={{ padding: '120px 24px', background: '#0A0A0F' }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '80px', opacity: stepsAnim.isVisible ? 1 : 0, transform: stepsAnim.isVisible ? 'translateY(0)' : 'translateY(30px)', transition: 'all 0.8s ease' }}>
            <p style={{ fontSize: '14px', fontWeight: 600, color: '#10B981', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '12px' }}>Simple</p>
            <h2 style={{ fontSize: '42px', fontWeight: 800, color: '#fff', marginBottom: '16px' }}>Comment ça marche ?</h2>
            <p style={{ fontSize: '18px', color: 'rgba(255,255,255,0.6)', maxWidth: '500px', margin: '0 auto' }}>Démarrez en 3 étapes simples</p>
          </div>

          <div className="steps-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '48px' }}>
            {STEPS.map((step, i) => (
              <div key={i} style={{ textAlign: 'center', position: 'relative', opacity: stepsAnim.isVisible ? 1 : 0, transform: stepsAnim.isVisible ? 'translateY(0)' : 'translateY(30px)', transition: 'all 0.8s ease ' + (i * 0.15) + 's' }}>
                <div style={{ width: '80px', height: '80px', borderRadius: '20px', background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', fontSize: '28px', fontWeight: 800, color: '#fff' }}>{step.step}</div>
                <h3 style={{ fontSize: '20px', fontWeight: 700, color: '#fff', marginBottom: '12px' }}>{step.title}</h3>
                <p style={{ fontSize: '15px', lineHeight: 1.7, color: 'rgba(255,255,255,0.6)', margin: 0 }}>{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section id="temoignages" ref={testimonialsAnim.ref} style={{ padding: '120px 24px', background: 'linear-gradient(to bottom, #0A0A0F 0%, #0D0D12 100%)' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '80px', opacity: testimonialsAnim.isVisible ? 1 : 0, transform: testimonialsAnim.isVisible ? 'translateY(0)' : 'translateY(30px)', transition: 'all 0.8s ease' }}>
            <p style={{ fontSize: '14px', fontWeight: 600, color: '#F59E0B', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '12px' }}>Temoignages</p>
            <h2 style={{ fontSize: '42px', fontWeight: 800, color: '#fff', marginBottom: '16px' }}>Ce que disent nos clients</h2>
          </div>

          <div className="testimonials-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px' }}>
            {TESTIMONIALS.map((t, i) => (
              <div key={i} style={{
                padding: '32px', borderRadius: '20px',
                background: 'linear-gradient(135deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%)',
                border: '1px solid rgba(255,255,255,0.08)',
                opacity: testimonialsAnim.isVisible ? 1 : 0,
                transform: testimonialsAnim.isVisible ? 'translateY(0)' : 'translateY(30px)',
                transition: 'all 0.8s ease ' + (i * 0.1) + 's',
              }}>
                <div style={{ display: 'flex', gap: '4px', marginBottom: '20px' }}>
                  {Array(t.rating).fill(0).map((_, j) => <Star key={j} size={18} fill="#F59E0B" color="#F59E0B" />)}
                </div>
                <p style={{ fontSize: '15px', lineHeight: 1.8, color: 'rgba(255,255,255,0.8)', marginBottom: '24px', fontStyle: 'italic' }}>{'"' + t.content + '"'}</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', fontWeight: 700, color: '#fff' }}>{t.avatar}</div>
                  <div>
                    <p style={{ fontSize: '15px', fontWeight: 600, color: '#fff', margin: 0 }}>{t.name}</p>
                    <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)', margin: 0 }}>{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section id="tarifs" ref={pricingAnim.ref} style={{ padding: '120px 24px', background: '#0A0A0F' }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '80px', opacity: pricingAnim.isVisible ? 1 : 0, transform: pricingAnim.isVisible ? 'translateY(0)' : 'translateY(30px)', transition: 'all 0.8s ease' }}>
            <p style={{ fontSize: '14px', fontWeight: 600, color: '#8B5CF6', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '12px' }}>Tarifs</p>
            <h2 style={{ fontSize: '42px', fontWeight: 800, color: '#fff', marginBottom: '16px' }}>Plans adaptés à votre activité</h2>
            <p style={{ fontSize: '18px', color: 'rgba(255,255,255,0.6)' }}>De la découverte au gros volume, choisissez votre formule</p>
          </div>

          <div className="pricing-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', alignItems: 'stretch' }}>
            {PLANS_DATA.map((plan, i) => (
              <div key={i} style={{
                padding: '32px', borderRadius: '24px',
                background: plan.popular ? 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)' : 'linear-gradient(135deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%)',
                border: plan.popular ? 'none' : '1px solid rgba(255,255,255,0.08)',
                position: 'relative',
                transform: plan.popular ? 'scale(1.02)' : 'scale(1)',
                boxShadow: plan.popular ? '0 25px 50px rgba(99, 102, 241, 0.3)' : 'none',
                opacity: pricingAnim.isVisible ? 1 : 0,
                transition: 'all 0.8s ease ' + (i * 0.1) + 's',
              }}>
                {plan.popular && (
                  <div style={{ position: 'absolute', top: '-12px', left: '50%', transform: 'translateX(-50%)', padding: '6px 14px', borderRadius: '20px', background: '#F59E0B', fontSize: '12px', fontWeight: 700, color: '#000', whiteSpace: 'nowrap' }}>Le plus choisi</div>
                )}
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                  <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: plan.color }} />
                  <h3 style={{ fontSize: '22px', fontWeight: 700, color: '#fff', margin: 0 }}>{plan.name}</h3>
                </div>
                <p style={{ fontSize: '13px', color: plan.popular ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.5)', marginBottom: '20px' }}>{plan.description}</p>
                <div style={{ marginBottom: '24px' }}>
                  {plan.price === 0 ? (
                    <span style={{ fontSize: '42px', fontWeight: 800, color: '#fff' }}>Gratuit</span>
                  ) : (
                    <>
                      <span style={{ fontSize: '42px', fontWeight: 800, color: '#fff' }}>{plan.price}€</span>
                      <span style={{ fontSize: '14px', color: plan.popular ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.5)' }}>{plan.period}</span>
                    </>
                  )}
                </div>
                <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 24px', minHeight: '220px' }}>
                  {plan.features.map((f, j) => (
                    <li key={j} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', marginBottom: '10px', fontSize: '13px', color: plan.popular ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.7)' }}>
                      <Check size={16} style={{ color: plan.popular ? '#fff' : '#10B981', flexShrink: 0, marginTop: '2px' }} />
                      {f}
                    </li>
                  ))}
                  {plan.notIncluded && plan.notIncluded.map((f, j) => (
                    <li key={'no-' + j} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', marginBottom: '10px', fontSize: '13px', color: 'rgba(255,255,255,0.35)' }}>
                      <X size={16} style={{ color: 'rgba(255,255,255,0.3)', flexShrink: 0, marginTop: '2px' }} />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link href="/pro/inscription">
                  <button style={{
                    width: '100%', padding: '12px', borderRadius: '10px',
                    border: plan.popular ? 'none' : '1px solid rgba(255,255,255,0.2)',
                    background: plan.popular ? '#fff' : 'rgba(255,255,255,0.05)',
                    fontSize: '14px', fontWeight: 600,
                    color: plan.popular ? '#6366F1' : '#fff',
                    cursor: 'pointer', transition: 'all 0.3s',
                  }}
                    onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)' }}
                    onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)' }}
                  >{plan.cta}</button>
                </Link>
              </div>
            ))}
          </div>

          {/* PACKS SIV & STOCKAGE */}
          <div style={{ marginTop: '80px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px' }} className="packs-grid">
            {/* Packs SIV */}
            <div style={{ padding: '32px', borderRadius: '20px', background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(139, 92, 246, 0.05) 100%)', border: '1px solid rgba(99, 102, 241, 0.2)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <FileText size={22} color="#fff" />
                </div>
                <div>
                  <h3 style={{ fontSize: '20px', fontWeight: 700, color: '#fff', margin: 0 }}>Packs SIV</h3>
                  <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)', margin: 0 }}>Credits recherche plaque/VIN</p>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {[{ credits: 50, price: 15 }, { credits: 100, price: 29 }, { credits: 500, price: 129 }].map((pack, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 16px', borderRadius: '10px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
                    <span style={{ fontSize: '15px', color: '#fff', fontWeight: 600 }}>{pack.credits} credits</span>
                    <span style={{ fontSize: '15px', color: '#A5B4FC', fontWeight: 700 }}>{pack.price}€</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Packs Stockage */}
            <div style={{ padding: '32px', borderRadius: '20px', background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(16, 185, 129, 0.05) 100%)', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Download size={22} color="#fff" />
                </div>
                <div>
                  <h3 style={{ fontSize: '20px', fontWeight: 700, color: '#fff', margin: 0 }}>Packs Stockage</h3>
                  <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)', margin: 0 }}>Photos, PDF, preuves</p>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {[{ size: '+10 Go', name: 'S', price: 5 }, { size: '+50 Go', name: 'M', price: 19 }, { size: '+200 Go', name: 'L', price: 59 }].map((pack, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 16px', borderRadius: '10px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
                    <span style={{ fontSize: '15px', color: '#fff', fontWeight: 600 }}>Storage {pack.name} <span style={{ color: 'rgba(255,255,255,0.5)', fontWeight: 400 }}>({pack.size})</span></span>
                    <span style={{ fontSize: '15px', color: '#6EE7B7', fontWeight: 700 }}>{pack.price}€</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Note annuel */}
          <div style={{ marginTop: '40px', textAlign: 'center', padding: '20px', borderRadius: '12px', background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.2)' }}>
            <p style={{ fontSize: '15px', color: '#FBBF24', margin: 0 }}>💡 <strong>Economisez 2 mois</strong> avec le paiement annuel (PRO: 890€/an, EXPERT: 1490€/an, PREMIUM: 2490€/an)</p>
          </div>
        </div>
      </section>

      {/* COMPARAISON CONCURRENCE */}
      <section style={{ padding: '120px 24px', background: 'linear-gradient(to bottom, #0D0D12 0%, #0A0A0F 100%)' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '60px' }}>
            <p style={{ fontSize: '14px', fontWeight: 600, color: '#F59E0B', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '12px' }}>Comparaison</p>
            <h2 style={{ fontSize: '42px', fontWeight: 800, color: '#fff', marginBottom: '16px' }}>Pourquoi SafeMotor ?</h2>
            <p style={{ fontSize: '18px', color: 'rgba(255,255,255,0.6)', maxWidth: '600px', margin: '0 auto' }}>
              SafeMotor ne sert pas a mieux reparer une voiture.<br/>
              <strong style={{ color: '#fff' }}>Il sert a eviter que la reparation vous retombe dessus.</strong>
            </p>
          </div>

          {/* Tableau comparatif */}
          <div style={{ overflowX: 'auto', marginBottom: '60px' }}>
            <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0, fontSize: '14px' }}>
              <thead>
                <tr>
                  <th style={{ padding: '16px 20px', textAlign: 'left', color: 'rgba(255,255,255,0.5)', fontWeight: 600, borderBottom: '1px solid rgba(255,255,255,0.1)' }}>Critere cle</th>
                  <th style={{ padding: '16px 20px', textAlign: 'center', background: 'rgba(99, 102, 241, 0.15)', borderRadius: '12px 12px 0 0', border: '1px solid rgba(99, 102, 241, 0.3)', borderBottom: 'none' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                      <Shield size={18} color="#6366F1" />
                      <span style={{ color: '#6366F1', fontWeight: 700 }}>SafeMotor</span>
                    </div>
                  </th>
                  <th style={{ padding: '16px 20px', textAlign: 'center', color: 'rgba(255,255,255,0.5)', fontWeight: 600, borderBottom: '1px solid rgba(255,255,255,0.1)' }}>Logiciel garage classique</th>
                  <th style={{ padding: '16px 20px', textAlign: 'center', color: 'rgba(255,255,255,0.5)', fontWeight: 600, borderBottom: '1px solid rgba(255,255,255,0.1)' }}>Solution constructeur</th>
                  <th style={{ padding: '16px 20px', textAlign: 'center', color: 'rgba(255,255,255,0.5)', fontWeight: 600, borderBottom: '1px solid rgba(255,255,255,0.1)' }}>Outils séparés</th>
                </tr>
              </thead>
              <tbody>
                {([
                  { label: 'Devis / Factures', sm: true, classic: true, constructor: true, tools: true },
                  { label: 'Signature client juridique', sm: true, classic: false, constructor: false, tools: 'partial' },
                  { label: 'Dossier litige prêt', sm: true, classic: false, constructor: false, tools: false, highlight: true },
                  { label: 'IA aide juridique', sm: true, classic: false, constructor: false, tools: false, highlight: true },
                  { label: 'SIV intégré', sm: true, classic: 'partial', constructor: 'partial', tools: false },
                  { label: 'Archivage preuves', sm: true, classic: 'partial', constructor: 'partial', tools: false },
                  { label: 'Pensé pour indépendants', sm: true, classic: 'partial', constructor: false, tools: false },
                  { label: 'Prix moyen / mois', sm: '89-249€', classic: '60-120€', constructor: '150-400€', tools: '40-80€ cumulés' },
                ] as { label: string; sm: boolean | string; classic: boolean | string; constructor: boolean | string; tools: boolean | string; highlight?: boolean }[]).map((row, i) => (
                  <tr key={i} style={{ background: row.highlight ? 'rgba(99, 102, 241, 0.05)' : 'transparent' }}>
                    <td style={{ padding: '14px 20px', color: row.highlight ? '#fff' : 'rgba(255,255,255,0.7)', fontWeight: row.highlight ? 600 : 400, borderBottom: '1px solid rgba(255,255,255,0.05)' }}>{row.label}</td>
                    <td style={{ padding: '14px 20px', textAlign: 'center', background: 'rgba(99, 102, 241, 0.1)', borderLeft: '1px solid rgba(99, 102, 241, 0.3)', borderRight: '1px solid rgba(99, 102, 241, 0.3)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      {typeof row.sm === 'string' ? <span style={{ color: '#6366F1', fontWeight: 600 }}>{row.sm}</span> : row.sm ? <Check size={18} color="#10B981" /> : <X size={18} color="#EF4444" />}
                    </td>
                    <td style={{ padding: '14px 20px', textAlign: 'center', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      {typeof row.classic === 'string' ? (row.classic === 'partial' ? <span style={{ color: '#F59E0B' }}>⚠️</span> : <span style={{ color: 'rgba(255,255,255,0.5)' }}>{row.classic}</span>) : row.classic ? <Check size={18} color="#10B981" /> : <X size={18} color="#EF4444" />}
                    </td>
                    <td style={{ padding: '14px 20px', textAlign: 'center', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      {typeof row.constructor === 'string' ? (row.constructor === 'partial' ? <span style={{ color: '#F59E0B' }}>⚠️</span> : <span style={{ color: 'rgba(255,255,255,0.5)' }}>{row.constructor}</span>) : row.constructor ? <Check size={18} color="#10B981" /> : <X size={18} color="#EF4444" />}
                    </td>
                    <td style={{ padding: '14px 20px', textAlign: 'center', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      {typeof row.tools === 'string' ? (row.tools === 'partial' ? <span style={{ color: '#F59E0B' }}>⚠️</span> : <span style={{ color: 'rgba(255,255,255,0.5)' }}>{row.tools}</span>) : row.tools ? <Check size={18} color="#10B981" /> : <X size={18} color="#EF4444" />}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Cards concurrents */}
          <div className="comparison-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px' }}>
            {/* Logiciels classiques */}
            <div style={{ padding: '28px', borderRadius: '16px', background: 'rgba(234, 179, 8, 0.08)', border: '1px solid rgba(234, 179, 8, 0.2)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#EAB308' }}></div>
                <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#fff', margin: 0 }}>Logiciels garage classiques</h3>
              </div>
              <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.5)', marginBottom: '16px' }}>MecaPlanning, Winysoft, AutoGest, Vulcain...</p>
              <p style={{ fontSize: '15px', color: 'rgba(255,255,255,0.7)', lineHeight: 1.6, marginBottom: '16px' }}>
                Ils gèrent l'atelier : planning, ordres de réparation, facturation. 
                <strong style={{ color: '#EAB308' }}> Mais ils ne protègent pas le garage.</strong>
              </p>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: '13px', color: 'rgba(255,255,255,0.5)' }}>
                <li style={{ marginBottom: '6px' }}>❌ Pas de signature juridique</li>
                <li style={{ marginBottom: '6px' }}>❌ Pas de dossier preuve</li>
                <li>❌ SIV en option ou externe</li>
              </ul>
            </div>

            {/* Solutions constructeurs */}
            <div style={{ padding: '28px', borderRadius: '16px', background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#EF4444' }}></div>
                <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#fff', margin: 0 }}>Solutions constructeurs</h3>
              </div>
              <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.5)', marginBottom: '16px' }}>150€ à 400€/mois • Imposés par la marque</p>
              <p style={{ fontSize: '15px', color: 'rgba(255,255,255,0.7)', lineHeight: 1.6, marginBottom: '16px' }}>
                Intégration réseau, données centralisées. 
                <strong style={{ color: '#EF4444' }}> Outils de réseau, pas de protection.</strong>
              </p>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: '13px', color: 'rgba(255,255,255,0.5)' }}>
                <li style={{ marginBottom: '6px' }}>❌ Pas pensé pour indépendants</li>
                <li style={{ marginBottom: '6px' }}>❌ Peu personnalisable</li>
                <li>❌ IA inexistante ou gadget</li>
              </ul>
            </div>

            {/* Outils separes */}
            <div style={{ padding: '28px', borderRadius: '16px', background: 'rgba(34, 197, 94, 0.08)', border: '1px solid rgba(34, 197, 94, 0.2)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#22C55E' }}></div>
                <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#fff', margin: 0 }}>Outils séparés</h3>
              </div>
              <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.5)', marginBottom: '16px' }}>Signature + Devis + Stockage = 40-80€ cumulés</p>
              <p style={{ fontSize: '15px', color: 'rgba(255,255,255,0.7)', lineHeight: 1.6, marginBottom: '16px' }}>
                Moins cher individuellement. 
                <strong style={{ color: '#22C55E' }}> Mais inutilisable en cas de problème réel.</strong>
              </p>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: '13px', color: 'rgba(255,255,255,0.5)' }}>
                <li style={{ marginBottom: '6px' }}>❌ Données éclatées</li>
                <li style={{ marginBottom: '6px' }}>❌ Aucune vision garage</li>
                <li>❌ Pas de logique assurance/litige</li>
              </ul>
            </div>
          </div>

          {/* Argument massue */}
          <div style={{ marginTop: '60px', padding: '32px 40px', borderRadius: '16px', background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.15) 0%, rgba(139, 92, 246, 0.1) 100%)', border: '1px solid rgba(99, 102, 241, 0.3)', textAlign: 'center' }}>
            <p style={{ fontSize: '20px', color: '#fff', fontWeight: 600, margin: 0, lineHeight: 1.6 }}>
              💡 <span style={{ color: '#A5B4FC' }}>Un litige évité = des milliers d'euros.</span><br/>
              <span style={{ fontSize: '16px', color: 'rgba(255,255,255,0.6)', fontWeight: 400 }}>Un dossier propre = une assurance qui suit. Une signature claire = moins de conflits clients.</span>
            </p>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" style={{ padding: '120px 24px', background: 'linear-gradient(to bottom, #0A0A0F 0%, #0D0D12 100%)' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '60px' }}>
            <p style={{ fontSize: '14px', fontWeight: 600, color: '#3B82F6', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '12px' }}>FAQ</p>
            <h2 style={{ fontSize: '42px', fontWeight: 800, color: '#fff' }}>Questions fréquentes</h2>
          </div>
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)' }}>
            {FAQ_DATA.map((item, i) => (
              <FAQItemComponent key={i} question={item.question} answer={item.answer} isOpen={openFAQ === i} onToggle={() => setOpenFAQ(openFAQ === i ? null : i)} />
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding: '120px 24px', background: 'radial-gradient(ellipse 80% 50% at 50% 120%, rgba(99, 102, 241, 0.3) 0%, transparent 50%), #0A0A0F' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{ fontSize: '42px', fontWeight: 800, color: '#fff', marginBottom: '16px' }}>Prêt à protéger votre garage ?</h2>
          <p style={{ fontSize: '18px', color: 'rgba(255,255,255,0.6)', marginBottom: '40px' }}>Rejoignez des centaines de garages qui sécurisent leurs interventions avec SafeMotor.</p>
          <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/pro/inscription">
              <button style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '18px 32px', borderRadius: '14px', border: 'none', background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)', fontSize: '17px', fontWeight: 600, color: '#fff', cursor: 'pointer', boxShadow: '0 8px 30px rgba(99, 102, 241, 0.4)' }}>
                Démarrer l'essai gratuit
                <ArrowRight size={20} />
              </button>
            </Link>
            <Link href="/contact">
              <button style={{ padding: '18px 32px', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.2)', background: 'transparent', fontSize: '17px', fontWeight: 600, color: '#fff', cursor: 'pointer' }}>Nous contacter</button>
            </Link>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ padding: '80px 24px 40px', background: '#07070A', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div className="footer-grid" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: '60px', marginBottom: '60px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Shield size={20} color="#fff" />
                </div>
                <span style={{ fontSize: '22px', fontWeight: 700, color: '#fff' }}>SafeMotor</span>
              </div>
              <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.5)', lineHeight: 1.7, maxWidth: '280px' }}>La protection juridique pour votre garage automobile. Traçabilité, signatures électroniques et conformité.</p>
            </div>
            <div>
              <h4 style={{ fontSize: '13px', fontWeight: 600, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '20px' }}>Produit</h4>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {[{ label: 'Fonctionnalités', href: '#fonctionnalites' }, { label: 'Tarifs', href: '#tarifs' }, { label: 'Démo', href: '/demo' }].map((l, i) => (
                  <li key={i} style={{ marginBottom: '12px' }}><Link href={l.href} style={{ color: 'rgba(255,255,255,0.6)', textDecoration: 'none', fontSize: '14px', transition: 'color 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.color = '#fff'} onMouseLeave={(e) => e.currentTarget.style.color = 'rgba(255,255,255,0.6)'}>{l.label}</Link></li>
                ))}
              </ul>
            </div>
            <div>
              <h4 style={{ fontSize: '13px', fontWeight: 600, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '20px' }}>Legal</h4>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {LEGAL_LINKS.map((l, i) => (
                  <li key={i} style={{ marginBottom: '12px' }}><Link href={l.href} style={{ color: 'rgba(255,255,255,0.6)', textDecoration: 'none', fontSize: '14px', transition: 'color 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.color = '#fff'} onMouseLeave={(e) => e.currentTarget.style.color = 'rgba(255,255,255,0.6)'}>{l.label}</Link></li>
                ))}
              </ul>
            </div>
            <div>
              <h4 style={{ fontSize: '13px', fontWeight: 600, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '20px' }}>Contact</h4>
              <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.6)', marginBottom: '8px' }}>support@SafeMotor.fr</p>
              <Link href="/contact" style={{ fontSize: '14px', color: '#6366F1', textDecoration: 'none' }}>Formulaire de contact</Link>
            </div>
          </div>
          <div style={{ paddingTop: '32px', borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
            <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)', margin: 0 }}>2026 SafeMotor. Tous droits reserves.</p>
            <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)' }}>Made in France</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
