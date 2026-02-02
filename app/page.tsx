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
  Car,
  Camera,
  AlertTriangle,
  Award,
  HeartHandshake,
  Sparkles,
  Target,
  Timer,
  Wrench,
} from 'lucide-react'

// ============================================================================
// ANIMATION HOOKS
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

function useCountUp(end: number, duration: number = 2000, start: boolean = false) {
  const [count, setCount] = useState(0)

  useEffect(() => {
    if (!start) return

    let startTime: number | null = null
    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp
      const progress = Math.min((timestamp - startTime) / duration, 1)
      setCount(Math.floor(progress * end))
      if (progress < 1) requestAnimationFrame(animate)
    }
    requestAnimationFrame(animate)
  }, [end, duration, start])

  return count
}

// ============================================================================
// PARTICLE SYSTEM
// ============================================================================

function ParticleField() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let animationId: number
    const particles: { x: number; y: number; vx: number; vy: number; size: number; opacity: number }[] = []

    const resize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }

    const createParticle = () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.5,
      vy: (Math.random() - 0.5) * 0.5,
      size: Math.random() * 2 + 1,
      opacity: Math.random() * 0.5 + 0.1
    })

    resize()
    for (let i = 0; i < 50; i++) particles.push(createParticle())

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      particles.forEach((p, i) => {
        p.x += p.vx
        p.y += p.vy

        if (p.x < 0 || p.x > canvas.width) p.vx *= -1
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1

        ctx.beginPath()
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(99, 102, 241, ${p.opacity})`
        ctx.fill()

        // Connect nearby particles
        particles.slice(i + 1).forEach(p2 => {
          const dx = p.x - p2.x
          const dy = p.y - p2.y
          const dist = Math.sqrt(dx * dx + dy * dy)
          if (dist < 150) {
            ctx.beginPath()
            ctx.moveTo(p.x, p.y)
            ctx.lineTo(p2.x, p2.y)
            ctx.strokeStyle = `rgba(99, 102, 241, ${0.1 * (1 - dist / 150)})`
            ctx.stroke()
          }
        })
      })

      animationId = requestAnimationFrame(animate)
    }

    animate()
    window.addEventListener('resize', resize)

    return () => {
      cancelAnimationFrame(animationId)
      window.removeEventListener('resize', resize)
    }
  }, [])

  return <canvas ref={canvasRef} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', opacity: 0.6 }} />
}

// ============================================================================
// DATA
// ============================================================================

const STATS = [
  { value: 500, suffix: '+', label: 'Garages actifs', icon: Users },
  { value: 50000, suffix: '+', label: 'Documents signés', icon: FileText },
  { value: 99.9, suffix: '%', label: 'Disponibilité', icon: TrendingUp },
  { value: 5, suffix: ' min', label: 'Configuration', icon: Clock },
]

const FEATURES_DATA = [
  {
    icon: FileCheck,
    title: 'Traçabilité totale',
    description: 'Chaque intervention est horodatée, signée et conservée pendant 10 ans selon les obligations légales françaises.',
    color: '#6366F1',
    details: ['Horodatage certifié', 'Archivage sécurisé', 'Conformité Code du Commerce']
  },
  {
    icon: PenTool,
    title: 'Signatures électroniques',
    description: 'Signatures client et atelier avec valeur probante conforme au règlement européen eIDAS.',
    color: '#8B5CF6',
    details: ['Valeur juridique', 'Multi-signataires', 'Certificat inclus']
  },
  {
    icon: Shield,
    title: 'Preuves cryptographiques',
    description: 'Chaîne de preuves immuable avec hashes SHA-256. Impossibilité de falsification garantie.',
    color: '#10B981',
    details: ['Blockchain-ready', 'Hash SHA-256', 'Intégrité vérifiable']
  },
  {
    icon: Download,
    title: 'Export assurance',
    description: 'Export complet pour experts et assurances en un clic avec toutes les preuves nécessaires.',
    color: '#F59E0B',
    details: ['Format PDF/ZIP', 'Preuves incluses', 'Historique complet']
  },
  {
    icon: Zap,
    title: 'IA Copilot',
    description: 'Assistant intelligent pour rédiger vos devis et interventions en quelques secondes seulement.',
    color: '#EC4899',
    details: ['Suggestions automatiques', 'Alertes litiges', 'Rédaction assistée']
  },
  {
    icon: Lock,
    title: 'RGPD natif',
    description: 'Données hébergées en France, chiffrement AES-256, conformité totale avec le RGPD.',
    color: '#3B82F6',
    details: ['Hébergement français', 'Chiffrement AES-256', 'Droit à l\'oubli']
  },
]

const WORKFLOW_STEPS = [
  {
    icon: Car,
    title: 'Réception véhicule',
    description: 'Scan SIV automatique, photos entrée, état des lieux avec signature client.',
    color: '#6366F1'
  },
  {
    icon: Wrench,
    title: 'Intervention',
    description: 'Documentation temps réel, photos avant/après, pièces utilisées tracées.',
    color: '#8B5CF6'
  },
  {
    icon: Camera,
    title: 'Preuves',
    description: 'Photos horodatées, vidéos, documents joints avec métadonnées certifiées.',
    color: '#10B981'
  },
  {
    icon: PenTool,
    title: 'Signature',
    description: 'Signature électronique client sur tablette ou smartphone, juridiquement valide.',
    color: '#F59E0B'
  },
  {
    icon: Shield,
    title: 'Protection',
    description: 'Dossier complet archivé, prêt pour export en cas de litige ou contrôle.',
    color: '#EC4899'
  },
]

const STEPS = [
  {
    step: '01',
    title: 'Créez votre garage',
    description: 'Inscription en 2 minutes, pas de carte bancaire requise. Importez vos clients existants facilement.',
    icon: Target
  },
  {
    step: '02',
    title: 'Documentez vos interventions',
    description: 'Créez des devis, ordres de réparation et factures avec signature électronique intégrée.',
    icon: FileText
  },
  {
    step: '03',
    title: 'Protégez votre activité',
    description: 'En cas de litige, exportez toutes les preuves en un clic pour les assurances et experts.',
    icon: Shield
  },
]

const TESTIMONIALS = [
  {
    name: 'Jean-Pierre Martin',
    role: 'Gérant, Garage Martin & Fils',
    location: 'Lyon (69)',
    content: 'Depuis que j\'utilise SafeMotor, je dors tranquille. Un client a voulu contester une réparation, j\'ai sorti le dossier en 2 clics avec toutes les preuves signées. Affaire classée !',
    avatar: 'JP',
    rating: 5,
    saved: '8 500€',
    highlight: 'Litige évité'
  },
  {
    name: 'Sophie Durand',
    role: 'Directrice, Auto Service Pro',
    location: 'Marseille (13)',
    content: 'L\'interface est super intuitive. Mes mécaniciens ont pris en main l\'outil en une journée. Les signatures sur tablette, c\'est un vrai gain de temps au quotidien.',
    avatar: 'SD',
    rating: 5,
    saved: '2h/jour',
    highlight: 'Temps gagné'
  },
  {
    name: 'Marc Lefebvre',
    role: 'Propriétaire, Garage du Centre',
    location: 'Bordeaux (33)',
    content: 'Le retour sur investissement est immédiat. Plus de litiges perdus, plus de paperasse. Je recommande SafeMotor à tous les garagistes indépendants.',
    avatar: 'ML',
    rating: 5,
    saved: '15 000€/an',
    highlight: 'ROI positif'
  },
  {
    name: 'Claire Rousseau',
    role: 'Responsable, Garage Rousseau',
    location: 'Toulouse (31)',
    content: 'L\'IA Copilot m\'a fait gagner un temps fou sur la rédaction des devis. Et le SIV intégré, c\'est un must-have pour vérifier rapidement les véhicules.',
    avatar: 'CR',
    rating: 5,
    saved: '5h/semaine',
    highlight: 'Productivité'
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
  {
    question: 'Quelle est la valeur juridique des signatures ?',
    answer: 'Les signatures électroniques SafeMotor respectent le règlement eIDAS et ont une valeur juridique équivalente à une signature manuscrite. Elles sont horodatées et liées de manière unique au signataire grâce à un certificat numérique.'
  },
  {
    question: 'Combien de temps les données sont-elles conservées ?',
    answer: '10 ans minimum pour les documents juridiques, conformément au Code du Commerce français. Vous pouvez exporter vos données à tout moment en format PDF ou JSON. Après résiliation, vos données restent accessibles pendant 6 mois.'
  },
  {
    question: 'Puis-je exporter mes données ?',
    answer: 'Oui, export complet en JSON, PDF ou ZIP à tout moment. Vos données vous appartiennent et sont portables vers tout autre système. Aucun lock-in, aucune restriction.'
  },
  {
    question: 'Le SIV est-il inclus ?',
    answer: '50 recherches/mois en PRO, 150 en EXPERT, 300 en PREMIUM. Vous pouvez aussi acheter des packs SIV supplémentaires : 50 pour 15€, 100 pour 29€, ou 500 pour 129€.'
  },
  {
    question: 'Y a-t-il un engagement ?',
    answer: 'Aucun engagement, résiliation à tout moment en un clic. Économisez 2 mois en choisissant le paiement annuel. Satisfait ou remboursé pendant 30 jours.'
  },
  {
    question: 'Comment fonctionne SafeMotor Copilot ?',
    answer: 'L\'IA est assistive : elle suggère, alerte et vérifie vos dossiers. Niveau passif en PRO (rappels), juridique en EXPERT (alertes litiges), avancé en PREMIUM (analyse proactive et rédaction automatique).'
  },
  {
    question: 'Mes données sont-elles sécurisées ?',
    answer: 'Vos données sont hébergées en France (OVH), chiffrées en AES-256 au repos et en transit. Nous sommes conformes RGPD avec un DPO dédié. Audits de sécurité annuels par un cabinet indépendant.'
  },
  {
    question: 'Puis-je utiliser SafeMotor sur tablette ?',
    answer: 'Oui ! SafeMotor est 100% responsive et fonctionne parfaitement sur tablette et smartphone. Idéal pour faire signer les clients directement à l\'atelier.'
  },
]

const LEGAL_LINKS = [
  { label: 'CGU', href: '/cgu' },
  { label: 'CGV', href: '/cgv' },
  { label: 'Confidentialité', href: '/politique-confidentialite' },
  { label: 'Mentions légales', href: '/mentions-legales' },
]

const BENEFITS = [
  { icon: AlertTriangle, title: 'Litiges évités', value: '95%', description: 'des litiges résolus en faveur du garage' },
  { icon: Timer, title: 'Temps gagné', value: '2h', description: 'économisées par jour en moyenne' },
  { icon: Award, title: 'Satisfaction', value: '4.9/5', description: 'note moyenne de nos utilisateurs' },
  { icon: HeartHandshake, title: 'Confiance', value: '100%', description: 'de transparence avec vos clients' },
]

// ============================================================================
// COMPONENTS
// ============================================================================

function GlowingOrb({ color, size, top, left, delay = 0 }: { color: string; size: number; top: string; left: string; delay?: number }) {
  return (
    <div style={{
      position: 'absolute',
      top,
      left,
      width: size,
      height: size,
      borderRadius: '50%',
      background: `radial-gradient(circle, ${color}40 0%, transparent 70%)`,
      filter: 'blur(40px)',
      animation: `float 8s ease-in-out infinite ${delay}s`,
      pointerEvents: 'none',
    }} />
  )
}

function FeatureCard({ feature, isVisible }: { feature: typeof FEATURES_DATA[0]; isVisible: boolean }) {
  const [isHovered, setIsHovered] = useState(false)

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        padding: '32px',
        borderRadius: '24px',
        background: isHovered
          ? `linear-gradient(135deg, ${feature.color}15 0%, ${feature.color}05 100%)`
          : 'linear-gradient(135deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%)',
        border: `1px solid ${isHovered ? feature.color + '50' : 'rgba(255,255,255,0.08)'}`,
        transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
        cursor: 'default',
        opacity: isVisible ? 1 : 0,
        transform: isVisible
          ? (isHovered ? 'translateY(-8px) scale(1.02)' : 'translateY(0) scale(1)')
          : 'translateY(30px) scale(0.95)',
        boxShadow: isHovered ? `0 20px 40px ${feature.color}20, 0 0 60px ${feature.color}10` : 'none',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Glow effect on hover */}
      <div style={{
        position: 'absolute',
        top: '-50%',
        left: '-50%',
        width: '200%',
        height: '200%',
        background: `radial-gradient(circle at center, ${feature.color}10 0%, transparent 50%)`,
        opacity: isHovered ? 1 : 0,
        transition: 'opacity 0.4s ease',
        pointerEvents: 'none',
      }} />

      <div style={{
        width: '64px',
        height: '64px',
        borderRadius: '16px',
        background: `linear-gradient(135deg, ${feature.color}20 0%, ${feature.color}10 100%)`,
        border: `1px solid ${feature.color}30`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: '24px',
        position: 'relative',
        transition: 'all 0.3s ease',
        transform: isHovered ? 'scale(1.1) rotate(5deg)' : 'scale(1) rotate(0)',
      }}>
        <feature.icon size={32} style={{ color: feature.color }} />
      </div>

      <h3 style={{ fontSize: '22px', fontWeight: 700, color: '#fff', marginBottom: '12px' }}>
        {feature.title}
      </h3>
      <p style={{ fontSize: '15px', lineHeight: 1.7, color: 'rgba(255,255,255,0.6)', margin: '0 0 20px' }}>
        {feature.description}
      </p>

      {/* Detail tags */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
        {feature.details.map((detail, i) => (
          <span key={i} style={{
            fontSize: '12px',
            padding: '4px 10px',
            borderRadius: '20px',
            background: `${feature.color}15`,
            color: feature.color,
            border: `1px solid ${feature.color}30`,
          }}>
            {detail}
          </span>
        ))}
      </div>
    </div>
  )
}

function AnimatedCounter({ value, suffix, isVisible }: { value: number; suffix: string; isVisible: boolean }) {
  const count = useCountUp(value, 2000, isVisible)
  return <span>{count.toLocaleString('fr-FR')}{suffix}</span>
}

function FAQItemComponent({ question, answer, isOpen, onToggle }: { question: string; answer: string; isOpen: boolean; onToggle: () => void }) {
  return (
    <div style={{
      borderBottom: '1px solid rgba(255,255,255,0.1)',
      background: isOpen ? 'rgba(99, 102, 241, 0.05)' : 'transparent',
      marginBottom: '8px',
      borderRadius: isOpen ? '12px' : '0',
      transition: 'all 0.3s ease',
    }}>
      <button
        onClick={onToggle}
        style={{
          width: '100%',
          padding: '24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          textAlign: 'left'
        }}
      >
        <span style={{ fontSize: '16px', fontWeight: 600, color: isOpen ? '#A5B4FC' : '#fff' }}>{question}</span>
        <div style={{
          width: '32px',
          height: '32px',
          borderRadius: '8px',
          background: isOpen ? 'rgba(99, 102, 241, 0.2)' : 'rgba(255,255,255,0.05)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'all 0.3s ease',
        }}>
          <ChevronDown
            size={18}
            style={{
              color: isOpen ? '#6366F1' : 'rgba(255,255,255,0.5)',
              transition: 'transform 0.3s',
              transform: isOpen ? 'rotate(180deg)' : 'rotate(0)',
            }}
          />
        </div>
      </button>
      <div style={{
        overflow: 'hidden',
        maxHeight: isOpen ? '300px' : '0',
        transition: 'all 0.3s ease',
        paddingLeft: '24px',
        paddingRight: '24px',
        paddingBottom: isOpen ? '24px' : '0',
      }}>
        <p style={{ fontSize: '15px', lineHeight: 1.8, color: 'rgba(255,255,255,0.7)', margin: 0 }}>{answer}</p>
      </div>
    </div>
  )
}

function InteractiveDashboard() {
  const [activeTab, setActiveTab] = useState(0)
  const tabs = ['Tableau de bord', 'Interventions', 'Documents']

  return (
    <div style={{
      background: 'linear-gradient(135deg, rgba(15, 15, 25, 0.9) 0%, rgba(20, 20, 35, 0.9) 100%)',
      borderRadius: '24px',
      border: '1px solid rgba(255,255,255,0.1)',
      overflow: 'hidden',
      boxShadow: '0 25px 50px rgba(0,0,0,0.5), 0 0 100px rgba(99, 102, 241, 0.1)',
    }}>
      {/* Browser chrome */}
      <div style={{
        padding: '16px 20px',
        borderBottom: '1px solid rgba(255,255,255,0.1)',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
      }}>
        <div style={{ display: 'flex', gap: '8px' }}>
          <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#EF4444' }} />
          <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#F59E0B' }} />
          <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#10B981' }} />
        </div>
        <div style={{
          flex: 1,
          background: 'rgba(255,255,255,0.05)',
          borderRadius: '8px',
          padding: '8px 16px',
          fontSize: '13px',
          color: 'rgba(255,255,255,0.5)',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}>
          <Lock size={12} />
          app.safemotor.fr/dashboard
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
        {tabs.map((tab, i) => (
          <button
            key={tab}
            onClick={() => setActiveTab(i)}
            style={{
              flex: 1,
              padding: '14px',
              background: activeTab === i ? 'rgba(99, 102, 241, 0.1)' : 'transparent',
              border: 'none',
              borderBottom: activeTab === i ? '2px solid #6366F1' : '2px solid transparent',
              color: activeTab === i ? '#fff' : 'rgba(255,255,255,0.5)',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ padding: '24px' }}>
        {activeTab === 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
            {[
              { label: 'Interventions ce mois', value: '127', change: '+12%', color: '#6366F1' },
              { label: 'Documents signés', value: '89', change: '+8%', color: '#10B981' },
              { label: 'Chiffre d\'affaires', value: '24.5K€', change: '+15%', color: '#F59E0B' },
            ].map((stat, i) => (
              <div key={i} style={{
                background: 'rgba(255,255,255,0.03)',
                borderRadius: '12px',
                padding: '16px',
                border: '1px solid rgba(255,255,255,0.05)',
              }}>
                <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', margin: '0 0 8px' }}>{stat.label}</p>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                  <p style={{ fontSize: '28px', fontWeight: 700, color: stat.color, margin: 0 }}>{stat.value}</p>
                  <span style={{ fontSize: '12px', color: '#10B981' }}>{stat.change}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 1 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {[
              { id: 'INT-2024-127', client: 'Martin Jean', vehicle: 'Peugeot 308', status: 'En cours', color: '#F59E0B' },
              { id: 'INT-2024-126', client: 'Durand Marie', vehicle: 'Renault Clio', status: 'Signé', color: '#10B981' },
              { id: 'INT-2024-125', client: 'Petit Paul', vehicle: 'BMW X3', status: 'Facturé', color: '#6366F1' },
            ].map((item, i) => (
              <div key={i} style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '14px 16px',
                background: 'rgba(255,255,255,0.03)',
                borderRadius: '10px',
                border: '1px solid rgba(255,255,255,0.05)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)', fontFamily: 'monospace' }}>{item.id}</span>
                  <span style={{ fontSize: '14px', color: '#fff', fontWeight: 500 }}>{item.client}</span>
                  <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)' }}>{item.vehicle}</span>
                </div>
                <span style={{
                  fontSize: '12px',
                  padding: '4px 12px',
                  borderRadius: '20px',
                  background: item.color + '20',
                  color: item.color,
                }}>
                  {item.status}
                </span>
              </div>
            ))}
          </div>
        )}

        {activeTab === 2 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
            {[
              { name: 'Devis_2024-089.pdf', type: 'Devis', date: 'Aujourd\'hui', icon: FileText },
              { name: 'OR_2024-156.pdf', type: 'Ordre de réparation', date: 'Hier', icon: Wrench },
              { name: 'Facture_2024-067.pdf', type: 'Facture', date: '15 jan.', icon: FileCheck },
              { name: 'Photos_entrée.zip', type: 'Photos', date: '15 jan.', icon: Camera },
            ].map((doc, i) => (
              <div key={i} style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '14px',
                background: 'rgba(255,255,255,0.03)',
                borderRadius: '10px',
                border: '1px solid rgba(255,255,255,0.05)',
              }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '10px',
                  background: 'rgba(99, 102, 241, 0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  <doc.icon size={20} style={{ color: '#6366F1' }} />
                </div>
                <div>
                  <p style={{ fontSize: '13px', color: '#fff', margin: '0 0 2px', fontWeight: 500 }}>{doc.name}</p>
                  <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', margin: 0 }}>{doc.type} • {doc.date}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function WorkflowTimeline() {
  const [activeStep, setActiveStep] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveStep(prev => (prev + 1) % WORKFLOW_STEPS.length)
    }, 3000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div style={{ position: 'relative' }}>
      {/* Progress line */}
      <div style={{
        position: 'absolute',
        top: '32px',
        left: '50px',
        right: '50px',
        height: '4px',
        background: 'rgba(255,255,255,0.1)',
        borderRadius: '2px',
      }}>
        <div style={{
          width: `${(activeStep / (WORKFLOW_STEPS.length - 1)) * 100}%`,
          height: '100%',
          background: 'linear-gradient(90deg, #6366F1 0%, #8B5CF6 100%)',
          borderRadius: '2px',
          transition: 'width 0.5s ease',
        }} />
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', position: 'relative' }}>
        {WORKFLOW_STEPS.map((step, i) => (
          <div
            key={i}
            onClick={() => setActiveStep(i)}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              cursor: 'pointer',
              opacity: i <= activeStep ? 1 : 0.4,
              transition: 'all 0.3s ease',
            }}
          >
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: '16px',
              background: i === activeStep
                ? `linear-gradient(135deg, ${step.color} 0%, ${step.color}CC 100%)`
                : i < activeStep
                  ? `${step.color}40`
                  : 'rgba(255,255,255,0.05)',
              border: i === activeStep ? 'none' : `1px solid ${i < activeStep ? step.color + '50' : 'rgba(255,255,255,0.1)'}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '16px',
              transition: 'all 0.3s ease',
              transform: i === activeStep ? 'scale(1.15)' : 'scale(1)',
              boxShadow: i === activeStep ? `0 10px 30px ${step.color}40` : 'none',
            }}>
              <step.icon size={28} style={{ color: i <= activeStep ? '#fff' : 'rgba(255,255,255,0.3)' }} />
            </div>
            <h4 style={{
              fontSize: '14px',
              fontWeight: 600,
              color: i === activeStep ? '#fff' : 'rgba(255,255,255,0.5)',
              margin: '0 0 8px',
              textAlign: 'center',
              transition: 'color 0.3s ease',
            }}>
              {step.title}
            </h4>
            <p style={{
              fontSize: '12px',
              color: 'rgba(255,255,255,0.4)',
              margin: 0,
              textAlign: 'center',
              maxWidth: '140px',
              lineHeight: 1.5,
            }}>
              {step.description}
            </p>
          </div>
        ))}
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
  const workflowAnim = useInView()
  const stepsAnim = useInView()
  const testimonialsAnim = useInView()
  const pricingAnim = useInView()
  const benefitsAnim = useInView()

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#050508', color: '#fff', fontFamily: 'system-ui, -apple-system, sans-serif', overflow: 'hidden' }}>

      {/* GLOBAL STYLES */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes gradient { 0%, 100% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } }
        @keyframes float { 0%, 100% { transform: translateY(0) rotate(0deg); } 50% { transform: translateY(-20px) rotate(2deg); } }
        @keyframes pulse-glow { 0%, 100% { box-shadow: 0 0 20px rgba(99, 102, 241, 0.4); } 50% { box-shadow: 0 0 60px rgba(99, 102, 241, 0.8); } }
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
        @keyframes rotate { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
        @keyframes slideIn { from { opacity: 0; transform: translateX(-20px); } to { opacity: 1; transform: translateX(0); } }
        .animate-in { animation: fadeInUp 0.8s ease forwards; }
        .shimmer { background: linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent); background-size: 200% 100%; animation: shimmer 2s infinite; }
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
          .workflow-container { display: none !important; }
          .benefits-grid { grid-template-columns: repeat(2, 1fr) !important; }
        }
      ` }} />

      {/* NAVIGATION */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        backgroundColor: scrolled ? 'rgba(5, 5, 8, 0.85)' : 'transparent',
        backdropFilter: scrolled ? 'blur(20px) saturate(180%)' : 'none',
        borderBottom: scrolled ? '1px solid rgba(255,255,255,0.05)' : 'none',
        transition: 'all 0.3s ease',
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Link href="/" style={{ fontSize: '24px', fontWeight: 700, color: '#fff', display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 20px rgba(99, 102, 241, 0.4)',
            }}>
              <Shield size={22} color="#fff" />
            </div>
            SafeMotor
          </Link>

          <div className="desktop-nav" style={{ display: 'flex', gap: '32px', alignItems: 'center' }}>
            <div style={{ display: 'flex', gap: '28px' }}>
              {['Fonctionnalités', 'Tarifs', 'Témoignages', 'FAQ'].map((item) => (
                <a
                  key={item}
                  href={'#' + item.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')}
                  style={{ color: 'rgba(255,255,255,0.7)', textDecoration: 'none', fontSize: '14px', fontWeight: 500, transition: 'color 0.2s', position: 'relative' }}
                  onMouseEnter={(e) => e.currentTarget.style.color = '#fff'}
                  onMouseLeave={(e) => e.currentTarget.style.color = 'rgba(255,255,255,0.7)'}
                >
                  {item}
                </a>
              ))}
            </div>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <Link href="/auth/login" style={{ color: 'rgba(255,255,255,0.7)', textDecoration: 'none', fontSize: '14px', fontWeight: 500, padding: '8px 16px' }}>
                Connexion
              </Link>
              <Link href="/pro/inscription">
                <button style={{
                  padding: '12px 24px',
                  borderRadius: '12px',
                  border: 'none',
                  background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
                  fontSize: '14px',
                  fontWeight: 600,
                  color: '#fff',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  boxShadow: '0 4px 15px rgba(99, 102, 241, 0.4)',
                }}
                  onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 25px rgba(99, 102, 241, 0.5)' }}
                  onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 15px rgba(99, 102, 241, 0.4)' }}
                >
                  Essai gratuit
                </button>
              </Link>
            </div>
          </div>

          <button className="mobile-menu-btn" onClick={() => setMobileMenuOpen(!mobileMenuOpen)} style={{ display: 'none', background: 'none', border: 'none', padding: '8px', cursor: 'pointer', color: '#fff', alignItems: 'center', justifyContent: 'center' }}>
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {mobileMenuOpen && (
          <div style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            backgroundColor: 'rgba(5, 5, 8, 0.98)',
            backdropFilter: 'blur(20px)',
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            borderBottom: '1px solid rgba(255,255,255,0.05)',
          }}>
            {['Fonctionnalités', 'Tarifs', 'Témoignages', 'FAQ'].map((item) => (
              <a key={item} href={'#' + item.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')} onClick={() => setMobileMenuOpen(false)} style={{ color: '#fff', textDecoration: 'none', fontSize: '16px', fontWeight: 500, padding: '12px 0' }}>{item}</a>
            ))}
            <Link href="/auth/login" style={{ color: '#fff', textDecoration: 'none', fontSize: '16px', fontWeight: 500, padding: '12px 0' }}>Connexion</Link>
            <Link href="/pro/inscription" style={{ marginTop: '8px' }}>
              <button style={{ width: '100%', padding: '14px', borderRadius: '12px', border: 'none', background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)', fontSize: '16px', fontWeight: 600, color: '#fff', cursor: 'pointer' }}>Essai gratuit</button>
            </Link>
          </div>
        )}
      </nav>

      {/* HERO */}
      <section ref={heroAnim.ref} style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        padding: '140px 24px 100px',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Background effects */}
        <ParticleField />
        <GlowingOrb color="#6366F1" size={600} top="-20%" left="-10%" delay={0} />
        <GlowingOrb color="#8B5CF6" size={400} top="60%" left="70%" delay={2} />
        <GlowingOrb color="#EC4899" size={300} top="30%" left="80%" delay={4} />

        {/* Grid pattern */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)',
          backgroundSize: '50px 50px',
          pointerEvents: 'none',
        }} />

        <div className="hero-grid" style={{ maxWidth: '1200px', margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '80px', alignItems: 'center', position: 'relative', zIndex: 1 }}>
          <div style={{
            opacity: heroAnim.isVisible ? 1 : 0,
            transform: heroAnim.isVisible ? 'translateY(0)' : 'translateY(40px)',
            transition: 'all 1s cubic-bezier(0.4, 0, 0.2, 1)'
          }}>
            {/* Badge */}
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '10px',
              padding: '10px 18px',
              borderRadius: '50px',
              background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.15) 0%, rgba(139, 92, 246, 0.1) 100%)',
              border: '1px solid rgba(99, 102, 241, 0.3)',
              marginBottom: '28px',
              backdropFilter: 'blur(10px)',
            }}>
              <Sparkles size={16} style={{ color: '#A5B4FC' }} />
              <span style={{ fontSize: '14px', color: '#A5B4FC', fontWeight: 500 }}>Nouveau : IA Copilot disponible</span>
              <ArrowRight size={14} style={{ color: '#A5B4FC' }} />
            </div>

            <h1 className="hero-title" style={{
              fontSize: '64px',
              fontWeight: 800,
              lineHeight: 1.05,
              color: '#fff',
              marginBottom: '28px',
              letterSpacing: '-0.03em'
            }}>
              La protection
              <span style={{
                background: 'linear-gradient(135deg, #6366F1 0%, #A855F7 50%, #EC4899 100%)',
                backgroundSize: '200% 200%',
                animation: 'gradient 4s ease infinite',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                display: 'block'
              }}>
                juridique
              </span>
              de votre garage
            </h1>

            <p style={{
              fontSize: '20px',
              lineHeight: 1.7,
              color: 'rgba(255,255,255,0.7)',
              marginBottom: '40px',
              maxWidth: '520px'
            }}>
              Sécurisez vos interventions avec des <strong style={{ color: '#fff' }}>signatures électroniques</strong> et une <strong style={{ color: '#fff' }}>traçabilité complète</strong>. Protégez votre activité en cas de litige.
            </p>

            <div className="hero-buttons" style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
              <Link href="/pro/inscription">
                <button style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '18px 32px',
                  borderRadius: '14px',
                  border: 'none',
                  background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
                  fontSize: '17px',
                  fontWeight: 600,
                  color: '#fff',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  boxShadow: '0 8px 30px rgba(99, 102, 241, 0.4)',
                  animation: 'pulse-glow 3s ease-in-out infinite',
                }}
                  onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-3px) scale(1.02)'; e.currentTarget.style.boxShadow = '0 12px 40px rgba(99, 102, 241, 0.5)' }}
                  onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0) scale(1)'; e.currentTarget.style.boxShadow = '0 8px 30px rgba(99, 102, 241, 0.4)' }}
                >
                  Essai gratuit 30 jours
                  <ArrowRight size={20} />
                </button>
              </Link>
              <Link href="/demo">
                <button style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '18px 32px',
                  borderRadius: '14px',
                  border: '1px solid rgba(255,255,255,0.2)',
                  background: 'rgba(255,255,255,0.03)',
                  fontSize: '17px',
                  fontWeight: 600,
                  color: '#fff',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  backdropFilter: 'blur(10px)',
                }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.3)' }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)' }}
                >
                  <Play size={20} />
                  Voir la démo
                </button>
              </Link>
            </div>

            <div style={{ display: 'flex', gap: '32px', marginTop: '40px', flexWrap: 'wrap' }}>
              {[
                { icon: CheckCircle, text: 'Sans engagement' },
                { icon: CheckCircle, text: 'Sans carte bancaire' },
                { icon: CheckCircle, text: 'Configuration en 5 min' },
              ].map((item, i) => (
                <span key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '15px', color: 'rgba(255,255,255,0.6)' }}>
                  <item.icon size={18} style={{ color: '#10B981' }} />
                  {item.text}
                </span>
              ))}
            </div>
          </div>

          {/* Interactive Dashboard Preview */}
          <div className="hero-image" style={{
            opacity: heroAnim.isVisible ? 1 : 0,
            transform: heroAnim.isVisible ? 'translateX(0) rotateY(0)' : 'translateX(50px) rotateY(-5deg)',
            transition: 'all 1s cubic-bezier(0.4, 0, 0.2, 1) 0.2s',
            perspective: '1000px',
          }}>
            <InteractiveDashboard />
          </div>
        </div>

        {/* Scroll indicator */}
        <div style={{
          position: 'absolute',
          bottom: '40px',
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '8px',
          opacity: heroAnim.isVisible ? 1 : 0,
          transition: 'opacity 1s ease 1s',
        }}>
          <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Découvrir</span>
          <div style={{
            width: '24px',
            height: '40px',
            borderRadius: '12px',
            border: '2px solid rgba(255,255,255,0.2)',
            display: 'flex',
            justifyContent: 'center',
            paddingTop: '8px',
          }}>
            <div style={{
              width: '4px',
              height: '8px',
              borderRadius: '2px',
              background: '#6366F1',
              animation: 'float 2s ease-in-out infinite',
            }} />
          </div>
        </div>
      </section>

      {/* STATS */}
      <section ref={statsAnim.ref} style={{
        padding: '100px 24px',
        background: 'linear-gradient(to bottom, #050508 0%, #0A0A0F 100%)',
        borderTop: '1px solid rgba(255,255,255,0.03)',
        position: 'relative',
      }}>
        <div className="stats-grid" style={{ maxWidth: '1100px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '40px' }}>
          {STATS.map((stat, i) => (
            <div key={i} style={{
              textAlign: 'center',
              opacity: statsAnim.isVisible ? 1 : 0,
              transform: statsAnim.isVisible ? 'translateY(0) scale(1)' : 'translateY(30px) scale(0.9)',
              transition: `all 0.6s cubic-bezier(0.4, 0, 0.2, 1) ${i * 0.1}s`,
              padding: '32px',
              borderRadius: '20px',
              background: 'linear-gradient(135deg, rgba(255,255,255,0.02) 0%, rgba(255,255,255,0.01) 100%)',
              border: '1px solid rgba(255,255,255,0.05)',
            }}>
              <div style={{
                width: '56px',
                height: '56px',
                borderRadius: '14px',
                background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.15) 0%, rgba(139, 92, 246, 0.1) 100%)',
                border: '1px solid rgba(99, 102, 241, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 20px'
              }}>
                <stat.icon size={26} style={{ color: '#A5B4FC' }} />
              </div>
              <p style={{
                fontSize: '48px',
                fontWeight: 800,
                color: '#fff',
                margin: '0 0 8px',
                background: 'linear-gradient(135deg, #fff 0%, rgba(255,255,255,0.8) 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}>
                <AnimatedCounter value={stat.value} suffix={stat.suffix} isVisible={statsAnim.isVisible} />
              </p>
              <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.5)', margin: 0 }}>{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* BENEFITS */}
      <section ref={benefitsAnim.ref} style={{ padding: '100px 24px', background: '#0A0A0F' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{
            textAlign: 'center',
            marginBottom: '60px',
            opacity: benefitsAnim.isVisible ? 1 : 0,
            transform: benefitsAnim.isVisible ? 'translateY(0)' : 'translateY(30px)',
            transition: 'all 0.8s ease',
          }}>
            <p style={{ fontSize: '14px', fontWeight: 600, color: '#10B981', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '12px' }}>Résultats</p>
            <h2 style={{ fontSize: '42px', fontWeight: 800, color: '#fff', marginBottom: '16px' }}>Des bénéfices concrets</h2>
          </div>

          <div className="benefits-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '24px' }}>
            {BENEFITS.map((benefit, i) => (
              <div key={i} style={{
                padding: '32px',
                borderRadius: '20px',
                background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(16, 185, 129, 0.02) 100%)',
                border: '1px solid rgba(16, 185, 129, 0.15)',
                textAlign: 'center',
                opacity: benefitsAnim.isVisible ? 1 : 0,
                transform: benefitsAnim.isVisible ? 'translateY(0)' : 'translateY(30px)',
                transition: `all 0.6s ease ${i * 0.1}s`,
              }}>
                <div style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '14px',
                  background: 'rgba(16, 185, 129, 0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 20px',
                }}>
                  <benefit.icon size={28} style={{ color: '#10B981' }} />
                </div>
                <p style={{ fontSize: '36px', fontWeight: 800, color: '#10B981', margin: '0 0 8px' }}>{benefit.value}</p>
                <p style={{ fontSize: '16px', fontWeight: 600, color: '#fff', margin: '0 0 8px' }}>{benefit.title}</p>
                <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)', margin: 0 }}>{benefit.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* WORKFLOW */}
      <section ref={workflowAnim.ref} className="workflow-container" style={{
        padding: '120px 24px',
        background: 'linear-gradient(to bottom, #0A0A0F 0%, #0D0D12 100%)',
      }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <div style={{
            textAlign: 'center',
            marginBottom: '80px',
            opacity: workflowAnim.isVisible ? 1 : 0,
            transform: workflowAnim.isVisible ? 'translateY(0)' : 'translateY(30px)',
            transition: 'all 0.8s ease',
          }}>
            <p style={{ fontSize: '14px', fontWeight: 600, color: '#8B5CF6', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '12px' }}>Workflow</p>
            <h2 style={{ fontSize: '42px', fontWeight: 800, color: '#fff', marginBottom: '16px' }}>Un processus fluide</h2>
            <p style={{ fontSize: '18px', color: 'rgba(255,255,255,0.6)', maxWidth: '600px', margin: '0 auto' }}>
              De la réception du véhicule à la protection complète de votre dossier, chaque étape est documentée et sécurisée.
            </p>
          </div>

          <div style={{
            opacity: workflowAnim.isVisible ? 1 : 0,
            transform: workflowAnim.isVisible ? 'translateY(0)' : 'translateY(30px)',
            transition: 'all 0.8s ease 0.2s',
          }}>
            <WorkflowTimeline />
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section id="fonctionnalites" ref={featuresAnim.ref} style={{ padding: '120px 24px', background: '#0D0D12' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{
            textAlign: 'center',
            marginBottom: '80px',
            opacity: featuresAnim.isVisible ? 1 : 0,
            transform: featuresAnim.isVisible ? 'translateY(0)' : 'translateY(30px)',
            transition: 'all 0.8s ease'
          }}>
            <p style={{ fontSize: '14px', fontWeight: 600, color: '#6366F1', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '12px' }}>Fonctionnalités</p>
            <h2 style={{ fontSize: '42px', fontWeight: 800, color: '#fff', marginBottom: '16px' }}>Tout ce dont vous avez besoin</h2>
            <p style={{ fontSize: '18px', color: 'rgba(255,255,255,0.6)', maxWidth: '600px', margin: '0 auto' }}>
              Une solution complète pour protéger votre garage et vos clients en toute conformité légale.
            </p>
          </div>

          <div className="features-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px' }}>
            {FEATURES_DATA.map((feature, i) => (
              <FeatureCard key={i} feature={feature} isVisible={featuresAnim.isVisible} />
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section ref={stepsAnim.ref} style={{ padding: '120px 24px', background: 'linear-gradient(to bottom, #0D0D12 0%, #0A0A0F 100%)' }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
          <div style={{
            textAlign: 'center',
            marginBottom: '80px',
            opacity: stepsAnim.isVisible ? 1 : 0,
            transform: stepsAnim.isVisible ? 'translateY(0)' : 'translateY(30px)',
            transition: 'all 0.8s ease'
          }}>
            <p style={{ fontSize: '14px', fontWeight: 600, color: '#10B981', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '12px' }}>Simple</p>
            <h2 style={{ fontSize: '42px', fontWeight: 800, color: '#fff', marginBottom: '16px' }}>Démarrez en 3 étapes</h2>
            <p style={{ fontSize: '18px', color: 'rgba(255,255,255,0.6)', maxWidth: '500px', margin: '0 auto' }}>Configuration rapide, prise en main immédiate</p>
          </div>

          <div className="steps-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '48px' }}>
            {STEPS.map((step, i) => (
              <div key={i} style={{
                textAlign: 'center',
                position: 'relative',
                opacity: stepsAnim.isVisible ? 1 : 0,
                transform: stepsAnim.isVisible ? 'translateY(0)' : 'translateY(30px)',
                transition: `all 0.8s ease ${i * 0.15}s`
              }}>
                <div style={{
                  width: '88px',
                  height: '88px',
                  borderRadius: '24px',
                  background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 28px',
                  boxShadow: '0 15px 40px rgba(99, 102, 241, 0.3)',
                  position: 'relative',
                }}>
                  <span style={{ fontSize: '32px', fontWeight: 800, color: '#fff' }}>{step.step}</span>
                  <div style={{
                    position: 'absolute',
                    top: '-8px',
                    right: '-8px',
                    width: '32px',
                    height: '32px',
                    borderRadius: '10px',
                    background: '#0A0A0F',
                    border: '2px solid #6366F1',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                    <step.icon size={16} style={{ color: '#6366F1' }} />
                  </div>
                </div>
                <h3 style={{ fontSize: '22px', fontWeight: 700, color: '#fff', marginBottom: '14px' }}>{step.title}</h3>
                <p style={{ fontSize: '15px', lineHeight: 1.7, color: 'rgba(255,255,255,0.6)', margin: 0 }}>{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section id="temoignages" ref={testimonialsAnim.ref} style={{ padding: '120px 24px', background: '#0A0A0F' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{
            textAlign: 'center',
            marginBottom: '80px',
            opacity: testimonialsAnim.isVisible ? 1 : 0,
            transform: testimonialsAnim.isVisible ? 'translateY(0)' : 'translateY(30px)',
            transition: 'all 0.8s ease'
          }}>
            <p style={{ fontSize: '14px', fontWeight: 600, color: '#F59E0B', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '12px' }}>Témoignages</p>
            <h2 style={{ fontSize: '42px', fontWeight: 800, color: '#fff', marginBottom: '16px' }}>Ce que disent nos clients</h2>
            <p style={{ fontSize: '18px', color: 'rgba(255,255,255,0.6)' }}>Des garagistes comme vous, partout en France</p>
          </div>

          <div className="testimonials-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '24px' }}>
            {TESTIMONIALS.map((t, i) => (
              <div key={i} style={{
                padding: '36px',
                borderRadius: '24px',
                background: 'linear-gradient(135deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%)',
                border: '1px solid rgba(255,255,255,0.08)',
                opacity: testimonialsAnim.isVisible ? 1 : 0,
                transform: testimonialsAnim.isVisible ? 'translateY(0)' : 'translateY(30px)',
                transition: `all 0.8s ease ${i * 0.1}s`,
                position: 'relative',
              }}>
                {/* Highlight badge */}
                <div style={{
                  position: 'absolute',
                  top: '20px',
                  right: '20px',
                  padding: '6px 14px',
                  borderRadius: '20px',
                  background: 'rgba(16, 185, 129, 0.15)',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                }}>
                  <span style={{ fontSize: '12px', fontWeight: 600, color: '#10B981' }}>{t.highlight}: {t.saved}</span>
                </div>

                <div style={{ display: 'flex', gap: '4px', marginBottom: '24px' }}>
                  {Array(t.rating).fill(0).map((_, j) => <Star key={j} size={20} fill="#F59E0B" color="#F59E0B" />)}
                </div>

                <p style={{ fontSize: '16px', lineHeight: 1.8, color: 'rgba(255,255,255,0.85)', marginBottom: '28px', fontStyle: 'italic' }}>
                  « {t.content} »
                </p>

                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={{
                    width: '56px',
                    height: '56px',
                    borderRadius: '16px',
                    background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '18px',
                    fontWeight: 700,
                    color: '#fff'
                  }}>
                    {t.avatar}
                  </div>
                  <div>
                    <p style={{ fontSize: '16px', fontWeight: 600, color: '#fff', margin: '0 0 4px' }}>{t.name}</p>
                    <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.5)', margin: 0 }}>{t.role}</p>
                    <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)', margin: 0 }}>{t.location}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section id="tarifs" ref={pricingAnim.ref} style={{ padding: '120px 24px', background: 'linear-gradient(to bottom, #0A0A0F 0%, #0D0D12 100%)' }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
          <div style={{
            textAlign: 'center',
            marginBottom: '80px',
            opacity: pricingAnim.isVisible ? 1 : 0,
            transform: pricingAnim.isVisible ? 'translateY(0)' : 'translateY(30px)',
            transition: 'all 0.8s ease'
          }}>
            <p style={{ fontSize: '14px', fontWeight: 600, color: '#8B5CF6', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '12px' }}>Tarifs</p>
            <h2 style={{ fontSize: '42px', fontWeight: 800, color: '#fff', marginBottom: '16px' }}>Plans adaptés à votre activité</h2>
            <p style={{ fontSize: '18px', color: 'rgba(255,255,255,0.6)' }}>De la découverte au gros volume, choisissez votre formule</p>
          </div>

          <div className="pricing-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', alignItems: 'stretch' }}>
            {PLANS_DATA.map((plan, i) => (
              <div key={i} style={{
                padding: '36px 32px',
                borderRadius: '28px',
                background: plan.popular
                  ? 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)'
                  : 'linear-gradient(135deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%)',
                border: plan.popular ? 'none' : '1px solid rgba(255,255,255,0.08)',
                position: 'relative',
                transform: plan.popular ? 'scale(1.03)' : 'scale(1)',
                boxShadow: plan.popular ? '0 25px 50px rgba(99, 102, 241, 0.35)' : 'none',
                opacity: pricingAnim.isVisible ? 1 : 0,
                transition: `all 0.8s ease ${i * 0.1}s`,
                zIndex: plan.popular ? 1 : 0,
              }}>
                {plan.popular && (
                  <div style={{
                    position: 'absolute',
                    top: '-14px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    padding: '8px 18px',
                    borderRadius: '20px',
                    background: '#F59E0B',
                    fontSize: '13px',
                    fontWeight: 700,
                    color: '#000',
                    whiteSpace: 'nowrap',
                    boxShadow: '0 4px 15px rgba(245, 158, 11, 0.4)',
                  }}>
                    Le plus choisi
                  </div>
                )}

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                  <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: plan.color }} />
                  <h3 style={{ fontSize: '24px', fontWeight: 700, color: '#fff', margin: 0 }}>{plan.name}</h3>
                </div>

                <p style={{ fontSize: '14px', color: plan.popular ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.5)', marginBottom: '24px' }}>{plan.description}</p>

                <div style={{ marginBottom: '28px' }}>
                  {plan.price === 0 ? (
                    <span style={{ fontSize: '48px', fontWeight: 800, color: '#fff' }}>Gratuit</span>
                  ) : (
                    <>
                      <span style={{ fontSize: '48px', fontWeight: 800, color: '#fff' }}>{plan.price}€</span>
                      <span style={{ fontSize: '16px', color: plan.popular ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.5)' }}>{plan.period}</span>
                    </>
                  )}
                </div>

                <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 28px', minHeight: '220px' }}>
                  {plan.features.map((f, j) => (
                    <li key={j} style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', marginBottom: '12px', fontSize: '14px', color: plan.popular ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.7)' }}>
                      <Check size={18} style={{ color: plan.popular ? '#fff' : '#10B981', flexShrink: 0, marginTop: '2px' }} />
                      {f}
                    </li>
                  ))}
                  {plan.notIncluded && plan.notIncluded.map((f, j) => (
                    <li key={'no-' + j} style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', marginBottom: '12px', fontSize: '14px', color: 'rgba(255,255,255,0.35)' }}>
                      <X size={18} style={{ color: 'rgba(255,255,255,0.25)', flexShrink: 0, marginTop: '2px' }} />
                      {f}
                    </li>
                  ))}
                </ul>

                <Link href="/pro/inscription">
                  <button style={{
                    width: '100%',
                    padding: '14px',
                    borderRadius: '12px',
                    border: plan.popular ? 'none' : '1px solid rgba(255,255,255,0.2)',
                    background: plan.popular ? '#fff' : 'rgba(255,255,255,0.05)',
                    fontSize: '15px',
                    fontWeight: 600,
                    color: plan.popular ? '#6366F1' : '#fff',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                  }}
                    onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)' }}
                    onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)' }}
                  >
                    {plan.cta}
                  </button>
                </Link>
              </div>
            ))}
          </div>

          {/* PACKS SIV & STOCKAGE */}
          <div style={{ marginTop: '80px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px' }} className="packs-grid">
            {/* Packs SIV */}
            <div style={{
              padding: '36px',
              borderRadius: '24px',
              background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(139, 92, 246, 0.05) 100%)',
              border: '1px solid rgba(99, 102, 241, 0.2)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '24px' }}>
                <div style={{
                  width: '52px',
                  height: '52px',
                  borderRadius: '14px',
                  background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 8px 20px rgba(99, 102, 241, 0.3)',
                }}>
                  <FileText size={26} color="#fff" />
                </div>
                <div>
                  <h3 style={{ fontSize: '22px', fontWeight: 700, color: '#fff', margin: 0 }}>Packs SIV</h3>
                  <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.5)', margin: 0 }}>Crédits recherche plaque/VIN</p>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {[{ credits: 50, price: 15 }, { credits: 100, price: 29 }, { credits: 500, price: 129 }].map((pack, i) => (
                  <div key={i} style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '16px 20px',
                    borderRadius: '12px',
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    transition: 'all 0.2s ease',
                  }}>
                    <span style={{ fontSize: '16px', color: '#fff', fontWeight: 600 }}>{pack.credits} crédits</span>
                    <span style={{ fontSize: '16px', color: '#A5B4FC', fontWeight: 700 }}>{pack.price}€</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Packs Stockage */}
            <div style={{
              padding: '36px',
              borderRadius: '24px',
              background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(16, 185, 129, 0.05) 100%)',
              border: '1px solid rgba(16, 185, 129, 0.2)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '24px' }}>
                <div style={{
                  width: '52px',
                  height: '52px',
                  borderRadius: '14px',
                  background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 8px 20px rgba(16, 185, 129, 0.3)',
                }}>
                  <Download size={26} color="#fff" />
                </div>
                <div>
                  <h3 style={{ fontSize: '22px', fontWeight: 700, color: '#fff', margin: 0 }}>Packs Stockage</h3>
                  <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.5)', margin: 0 }}>Photos, PDF, preuves</p>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {[{ size: '+10 Go', name: 'S', price: 5 }, { size: '+50 Go', name: 'M', price: 19 }, { size: '+200 Go', name: 'L', price: 59 }].map((pack, i) => (
                  <div key={i} style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '16px 20px',
                    borderRadius: '12px',
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    transition: 'all 0.2s ease',
                  }}>
                    <span style={{ fontSize: '16px', color: '#fff', fontWeight: 600 }}>
                      Stockage {pack.name} <span style={{ color: 'rgba(255,255,255,0.5)', fontWeight: 400 }}>({pack.size})</span>
                    </span>
                    <span style={{ fontSize: '16px', color: '#6EE7B7', fontWeight: 700 }}>{pack.price}€</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Note annuel */}
          <div style={{
            marginTop: '40px',
            textAlign: 'center',
            padding: '24px',
            borderRadius: '16px',
            background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.1) 0%, rgba(245, 158, 11, 0.05) 100%)',
            border: '1px solid rgba(245, 158, 11, 0.2)'
          }}>
            <p style={{ fontSize: '16px', color: '#FBBF24', margin: 0 }}>
              💡 <strong>Économisez 2 mois</strong> avec le paiement annuel (PRO : 890€/an, EXPERT : 1 490€/an, PREMIUM : 2 490€/an)
            </p>
          </div>
        </div>
      </section>

      {/* COMPARAISON CONCURRENCE */}
      <section style={{ padding: '120px 24px', background: '#0D0D12' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '60px' }}>
            <p style={{ fontSize: '14px', fontWeight: 600, color: '#F59E0B', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '12px' }}>Comparaison</p>
            <h2 style={{ fontSize: '42px', fontWeight: 800, color: '#fff', marginBottom: '16px' }}>Pourquoi SafeMotor ?</h2>
            <p style={{ fontSize: '18px', color: 'rgba(255,255,255,0.6)', maxWidth: '600px', margin: '0 auto' }}>
              SafeMotor ne sert pas à mieux réparer une voiture.<br/>
              <strong style={{ color: '#fff' }}>Il sert à éviter que la réparation vous retombe dessus.</strong>
            </p>
          </div>

          {/* Tableau comparatif */}
          <div style={{ overflowX: 'auto', marginBottom: '60px' }}>
            <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0, fontSize: '14px' }}>
              <thead>
                <tr>
                  <th style={{ padding: '18px 20px', textAlign: 'left', color: 'rgba(255,255,255,0.5)', fontWeight: 600, borderBottom: '1px solid rgba(255,255,255,0.1)' }}>Critère clé</th>
                  <th style={{ padding: '18px 20px', textAlign: 'center', background: 'rgba(99, 102, 241, 0.15)', borderRadius: '14px 14px 0 0', border: '1px solid rgba(99, 102, 241, 0.3)', borderBottom: 'none' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                      <Shield size={20} color="#6366F1" />
                      <span style={{ color: '#6366F1', fontWeight: 700 }}>SafeMotor</span>
                    </div>
                  </th>
                  <th style={{ padding: '18px 20px', textAlign: 'center', color: 'rgba(255,255,255,0.5)', fontWeight: 600, borderBottom: '1px solid rgba(255,255,255,0.1)' }}>Logiciel garage classique</th>
                  <th style={{ padding: '18px 20px', textAlign: 'center', color: 'rgba(255,255,255,0.5)', fontWeight: 600, borderBottom: '1px solid rgba(255,255,255,0.1)' }}>Solution constructeur</th>
                  <th style={{ padding: '18px 20px', textAlign: 'center', color: 'rgba(255,255,255,0.5)', fontWeight: 600, borderBottom: '1px solid rgba(255,255,255,0.1)' }}>Outils séparés</th>
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
                    <td style={{ padding: '16px 20px', color: row.highlight ? '#fff' : 'rgba(255,255,255,0.7)', fontWeight: row.highlight ? 600 : 400, borderBottom: '1px solid rgba(255,255,255,0.05)' }}>{row.label}</td>
                    <td style={{ padding: '16px 20px', textAlign: 'center', background: 'rgba(99, 102, 241, 0.1)', borderLeft: '1px solid rgba(99, 102, 241, 0.3)', borderRight: '1px solid rgba(99, 102, 241, 0.3)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      {typeof row.sm === 'string' ? <span style={{ color: '#6366F1', fontWeight: 600 }}>{row.sm}</span> : row.sm ? <Check size={20} color="#10B981" /> : <X size={20} color="#EF4444" />}
                    </td>
                    <td style={{ padding: '16px 20px', textAlign: 'center', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      {typeof row.classic === 'string' ? (row.classic === 'partial' ? <span style={{ color: '#F59E0B' }}>⚠️</span> : <span style={{ color: 'rgba(255,255,255,0.5)' }}>{row.classic}</span>) : row.classic ? <Check size={20} color="#10B981" /> : <X size={20} color="#EF4444" />}
                    </td>
                    <td style={{ padding: '16px 20px', textAlign: 'center', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      {typeof row.constructor === 'string' ? (row.constructor === 'partial' ? <span style={{ color: '#F59E0B' }}>⚠️</span> : <span style={{ color: 'rgba(255,255,255,0.5)' }}>{row.constructor}</span>) : row.constructor ? <Check size={20} color="#10B981" /> : <X size={20} color="#EF4444" />}
                    </td>
                    <td style={{ padding: '16px 20px', textAlign: 'center', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      {typeof row.tools === 'string' ? (row.tools === 'partial' ? <span style={{ color: '#F59E0B' }}>⚠️</span> : <span style={{ color: 'rgba(255,255,255,0.5)' }}>{row.tools}</span>) : row.tools ? <Check size={20} color="#10B981" /> : <X size={20} color="#EF4444" />}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Cards concurrents */}
          <div className="comparison-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px' }}>
            {/* Logiciels classiques */}
            <div style={{ padding: '32px', borderRadius: '20px', background: 'rgba(234, 179, 8, 0.08)', border: '1px solid rgba(234, 179, 8, 0.2)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#EAB308' }}></div>
                <h3 style={{ fontSize: '20px', fontWeight: 700, color: '#fff', margin: 0 }}>Logiciels garage classiques</h3>
              </div>
              <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.5)', marginBottom: '20px' }}>MecaPlanning, Winysoft, AutoGest, Vulcain...</p>
              <p style={{ fontSize: '15px', color: 'rgba(255,255,255,0.7)', lineHeight: 1.7, marginBottom: '20px' }}>
                Ils gèrent l'atelier : planning, ordres de réparation, facturation.
                <strong style={{ color: '#EAB308' }}> Mais ils ne protègent pas le garage.</strong>
              </p>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: '14px', color: 'rgba(255,255,255,0.5)' }}>
                <li style={{ marginBottom: '8px' }}>❌ Pas de signature juridique</li>
                <li style={{ marginBottom: '8px' }}>❌ Pas de dossier preuve</li>
                <li>❌ SIV en option ou externe</li>
              </ul>
            </div>

            {/* Solutions constructeurs */}
            <div style={{ padding: '32px', borderRadius: '20px', background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#EF4444' }}></div>
                <h3 style={{ fontSize: '20px', fontWeight: 700, color: '#fff', margin: 0 }}>Solutions constructeurs</h3>
              </div>
              <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.5)', marginBottom: '20px' }}>150€ à 400€/mois • Imposés par la marque</p>
              <p style={{ fontSize: '15px', color: 'rgba(255,255,255,0.7)', lineHeight: 1.7, marginBottom: '20px' }}>
                Intégration réseau, données centralisées.
                <strong style={{ color: '#EF4444' }}> Outils de réseau, pas de protection.</strong>
              </p>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: '14px', color: 'rgba(255,255,255,0.5)' }}>
                <li style={{ marginBottom: '8px' }}>❌ Pas pensé pour indépendants</li>
                <li style={{ marginBottom: '8px' }}>❌ Peu personnalisable</li>
                <li>❌ IA inexistante ou gadget</li>
              </ul>
            </div>

            {/* Outils separes */}
            <div style={{ padding: '32px', borderRadius: '20px', background: 'rgba(34, 197, 94, 0.08)', border: '1px solid rgba(34, 197, 94, 0.2)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#22C55E' }}></div>
                <h3 style={{ fontSize: '20px', fontWeight: 700, color: '#fff', margin: 0 }}>Outils séparés</h3>
              </div>
              <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.5)', marginBottom: '20px' }}>Signature + Devis + Stockage = 40-80€ cumulés</p>
              <p style={{ fontSize: '15px', color: 'rgba(255,255,255,0.7)', lineHeight: 1.7, marginBottom: '20px' }}>
                Moins cher individuellement.
                <strong style={{ color: '#22C55E' }}> Mais inutilisable en cas de problème réel.</strong>
              </p>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: '14px', color: 'rgba(255,255,255,0.5)' }}>
                <li style={{ marginBottom: '8px' }}>❌ Données éclatées</li>
                <li style={{ marginBottom: '8px' }}>❌ Aucune vision garage</li>
                <li>❌ Pas de logique assurance/litige</li>
              </ul>
            </div>
          </div>

          {/* Argument massue */}
          <div style={{
            marginTop: '60px',
            padding: '40px',
            borderRadius: '20px',
            background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.15) 0%, rgba(139, 92, 246, 0.1) 100%)',
            border: '1px solid rgba(99, 102, 241, 0.3)',
            textAlign: 'center'
          }}>
            <p style={{ fontSize: '22px', color: '#fff', fontWeight: 600, margin: 0, lineHeight: 1.7 }}>
              💡 <span style={{ color: '#A5B4FC' }}>Un litige évité = des milliers d'euros économisés.</span><br/>
              <span style={{ fontSize: '17px', color: 'rgba(255,255,255,0.6)', fontWeight: 400 }}>Un dossier propre = une assurance qui suit. Une signature claire = moins de conflits clients.</span>
            </p>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" style={{ padding: '120px 24px', background: 'linear-gradient(to bottom, #0D0D12 0%, #0A0A0F 100%)' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '60px' }}>
            <p style={{ fontSize: '14px', fontWeight: 600, color: '#3B82F6', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '12px' }}>FAQ</p>
            <h2 style={{ fontSize: '42px', fontWeight: 800, color: '#fff' }}>Questions fréquentes</h2>
          </div>
          <div>
            {FAQ_DATA.map((item, i) => (
              <FAQItemComponent key={i} question={item.question} answer={item.answer} isOpen={openFAQ === i} onToggle={() => setOpenFAQ(openFAQ === i ? null : i)} />
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{
        padding: '140px 24px',
        background: 'radial-gradient(ellipse 80% 50% at 50% 120%, rgba(99, 102, 241, 0.3) 0%, transparent 50%), #050508',
        position: 'relative',
        overflow: 'hidden',
      }}>
        <GlowingOrb color="#6366F1" size={400} top="20%" left="10%" />
        <GlowingOrb color="#8B5CF6" size={300} top="30%" left="80%" delay={2} />

        <div style={{ maxWidth: '800px', margin: '0 auto', textAlign: 'center', position: 'relative', zIndex: 1 }}>
          <h2 style={{ fontSize: '48px', fontWeight: 800, color: '#fff', marginBottom: '20px', lineHeight: 1.2 }}>
            Prêt à protéger<br/>
            <span style={{
              background: 'linear-gradient(135deg, #6366F1 0%, #A855F7 50%, #EC4899 100%)',
              backgroundSize: '200% 200%',
              animation: 'gradient 4s ease infinite',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}>
              votre garage ?
            </span>
          </h2>
          <p style={{ fontSize: '20px', color: 'rgba(255,255,255,0.6)', marginBottom: '48px', maxWidth: '500px', margin: '0 auto 48px' }}>
            Rejoignez des centaines de garages qui sécurisent leurs interventions avec SafeMotor.
          </p>
          <div style={{ display: 'flex', gap: '20px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/pro/inscription">
              <button style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '20px 36px',
                borderRadius: '16px',
                border: 'none',
                background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
                fontSize: '18px',
                fontWeight: 600,
                color: '#fff',
                cursor: 'pointer',
                boxShadow: '0 8px 30px rgba(99, 102, 241, 0.4)',
                transition: 'all 0.3s ease',
              }}
                onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-3px) scale(1.02)'; e.currentTarget.style.boxShadow = '0 12px 40px rgba(99, 102, 241, 0.5)' }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0) scale(1)'; e.currentTarget.style.boxShadow = '0 8px 30px rgba(99, 102, 241, 0.4)' }}
              >
                Démarrer l'essai gratuit
                <ArrowRight size={22} />
              </button>
            </Link>
            <Link href="/contact">
              <button style={{
                padding: '20px 36px',
                borderRadius: '16px',
                border: '1px solid rgba(255,255,255,0.2)',
                background: 'rgba(255,255,255,0.03)',
                fontSize: '18px',
                fontWeight: 600,
                color: '#fff',
                cursor: 'pointer',
                backdropFilter: 'blur(10px)',
                transition: 'all 0.3s ease',
              }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.3)' }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)' }}
              >
                Nous contacter
              </button>
            </Link>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ padding: '80px 24px 40px', background: '#030305', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div className="footer-grid" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: '60px', marginBottom: '60px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                <div style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 4px 15px rgba(99, 102, 241, 0.3)',
                }}>
                  <Shield size={24} color="#fff" />
                </div>
                <span style={{ fontSize: '24px', fontWeight: 700, color: '#fff' }}>SafeMotor</span>
              </div>
              <p style={{ fontSize: '15px', color: 'rgba(255,255,255,0.5)', lineHeight: 1.8, maxWidth: '300px' }}>
                La protection juridique pour votre garage automobile. Traçabilité, signatures électroniques et conformité légale.
              </p>
            </div>
            <div>
              <h4 style={{ fontSize: '13px', fontWeight: 600, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '24px' }}>Produit</h4>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {[{ label: 'Fonctionnalités', href: '#fonctionnalites' }, { label: 'Tarifs', href: '#tarifs' }, { label: 'Démo', href: '/demo' }].map((l, i) => (
                  <li key={i} style={{ marginBottom: '14px' }}>
                    <Link href={l.href} style={{ color: 'rgba(255,255,255,0.6)', textDecoration: 'none', fontSize: '15px', transition: 'color 0.2s' }}
                      onMouseEnter={(e) => e.currentTarget.style.color = '#fff'}
                      onMouseLeave={(e) => e.currentTarget.style.color = 'rgba(255,255,255,0.6)'}
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 style={{ fontSize: '13px', fontWeight: 600, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '24px' }}>Légal</h4>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {LEGAL_LINKS.map((l, i) => (
                  <li key={i} style={{ marginBottom: '14px' }}>
                    <Link href={l.href} style={{ color: 'rgba(255,255,255,0.6)', textDecoration: 'none', fontSize: '15px', transition: 'color 0.2s' }}
                      onMouseEnter={(e) => e.currentTarget.style.color = '#fff'}
                      onMouseLeave={(e) => e.currentTarget.style.color = 'rgba(255,255,255,0.6)'}
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 style={{ fontSize: '13px', fontWeight: 600, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '24px' }}>Contact</h4>
              <p style={{ fontSize: '15px', color: 'rgba(255,255,255,0.6)', marginBottom: '10px' }}>support@safemotor.fr</p>
              <Link href="/contact" style={{ fontSize: '15px', color: '#6366F1', textDecoration: 'none' }}>Formulaire de contact</Link>
            </div>
          </div>
          <div style={{ paddingTop: '32px', borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
            <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.4)', margin: 0 }}>© 2026 SafeMotor. Tous droits réservés.</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '14px', color: 'rgba(255,255,255,0.4)' }}>Made with</span>
              <span style={{ color: '#EF4444' }}>❤️</span>
              <span style={{ fontSize: '14px', color: 'rgba(255,255,255,0.4)' }}>in France</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
