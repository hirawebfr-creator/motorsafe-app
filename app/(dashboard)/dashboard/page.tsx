'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { 
  Wrench, 
  Euro, 
  Users, 
  Car,
  Plus,
  UserPlus,
  Search,
  CheckCircle,
  Clock,
  XCircle,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  Calendar,
  RefreshCw,
  AlertCircle,
  LucideIcon
} from 'lucide-react'

// ============================================================================
// DASHBOARD PAGE - SafeMotor
// Données réelles uniquement - pas de mock data
// ============================================================================

interface KpiData {
  clientsCount: number
  vehiclesCount: number
  interventionsCount: number
  revenueTotalCents: number
  clientsVariation: number
  vehiclesVariation: number
  interventionsVariation: number
  revenueVariation: number
}

interface AnalyticsData {
  done: number
  inProgress: number
  cancelled: number
}

interface RecentIntervention {
  id: string
  ref: string
  vehicleLabel: string
  priceCents: number
  status: string
  totalCents: number
}

// Formater les centimes en euros
const formatCurrency = (cents: number): string => {
  return new Intl.NumberFormat('fr-FR', { 
    style: 'currency', 
    currency: 'EUR',
    maximumFractionDigits: 0 
  }).format(cents / 100)
}

// Format status label
const getStatusLabel = (status: string): string => {
  const map: Record<string, string> = {
    DONE: 'Terminée',
    OPEN: 'En cours',
    DRAFT: 'Brouillon',
    CANCELED: 'Annulée',
    SIGNED: 'Signée',
  }
  return map[status] || status
}

// Format status style
const getStatusStyle = (status: string): { bg: string; color: string } => {
  const map: Record<string, { bg: string; color: string }> = {
    DONE: { bg: '#ECFDF5', color: '#10B981' },
    SIGNED: { bg: '#ECFDF5', color: '#10B981' },
    OPEN: { bg: '#EFF6FF', color: '#3B82F6' },
    DRAFT: { bg: '#F3F4F6', color: '#6B7280' },
    CANCELED: { bg: '#FEF2F2', color: '#EF4444' },
  }
  return map[status] || { bg: '#F3F4F6', color: '#6B7280' }
}

export default function DashboardPage() {
  const [period, setPeriod] = useState<'month' | '30days' | 'year'>('month')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [kpis, setKpis] = useState<KpiData | null>(null)
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [recentInterventions, setRecentInterventions] = useState<RecentIntervention[]>([])
  
  // Charger données réelles depuis les APIs
  const loadDashboardData = async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      // Charger KPIs, Analytics et interventions récentes en parallèle
      const [kpisRes, analyticsRes, recentRes] = await Promise.all([
        fetch(`/api/dashboard/kpis?period=${period}`),
        fetch(`/api/dashboard/analytics?period=${period}`),
        fetch('/api/dashboard/recent-interventions?limit=6'),
      ])

      const kpisData = await kpisRes.json()
      const analyticsData = await analyticsRes.json()
      const recentData = await recentRes.json()

      if (!kpisRes.ok || !kpisData.ok) {
        throw new Error(kpisData.error || 'Erreur lors du chargement des KPIs')
      }

      setKpis(kpisData)
      setAnalytics(analyticsData.ok ? analyticsData : { done: 0, inProgress: 0, cancelled: 0 })
      setRecentInterventions(recentData.ok ? (recentData.data || []) : [])
      
    } catch (err) {
      console.error('Dashboard error:', err)
      setError(err instanceof Error ? err.message : 'Erreur de chargement')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadDashboardData()
  }, [period])
  
  return (
    <div style={{ padding: '32px', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: '32px',
        flexWrap: 'wrap',
        gap: '16px',
      }}>
        <div>
          <h1 style={{
            fontSize: '28px',
            fontWeight: 700,
            color: '#111827',
            margin: 0,
            marginBottom: '4px',
          }}>
            Tableau de bord
          </h1>
          <p style={{
            fontSize: '15px',
            color: '#6B7280',
            margin: 0
          }}>
            Vue d'ensemble de votre activité
          </p>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* Refresh button */}
          <button
            onClick={loadDashboardData}
            disabled={isLoading}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              border: '1px solid #E5E7EB',
              background: '#fff',
              cursor: isLoading ? 'wait' : 'pointer',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = '#F9FAFB'}
            onMouseLeave={(e) => e.currentTarget.style.background = '#fff'}
          >
            <RefreshCw 
              size={18} 
              color="#6B7280" 
              style={{ 
                animation: isLoading ? 'spin 1s linear infinite' : 'none' 
              }} 
            />
          </button>

          {/* Period selector */}
          <div style={{
            display: 'flex',
            gap: '4px',
            backgroundColor: '#F3F4F6',
            padding: '4px',
            borderRadius: '10px',
          }}>
            {[
              { value: 'month', label: 'Ce mois' },
              { value: '30days', label: '30 jours' },
              { value: 'year', label: 'Cette année' }
            ].map((option) => (
              <button
                key={option.value}
                onClick={() => setPeriod(option.value as typeof period)}
                style={{
                  padding: '10px 18px',
                  fontSize: '14px',
                  fontWeight: 500,
                  color: period === option.value ? '#FFFFFF' : '#6B7280',
                  background: period === option.value ? 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)' : 'transparent',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  boxShadow: period === option.value ? '0 2px 8px rgba(99, 102, 241, 0.3)' : 'none',
                }}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '16px 20px',
            borderRadius: '12px',
            background: '#FEF2F2',
            border: '1px solid #FECACA',
            marginBottom: '24px',
          }}
        >
          <AlertCircle size={20} color="#EF4444" />
          <span style={{ fontSize: '14px', color: '#DC2626' }}>{error}</span>
          <button
            onClick={loadDashboardData}
            style={{
              marginLeft: 'auto',
              padding: '8px 16px',
              borderRadius: '8px',
              border: 'none',
              background: '#EF4444',
              color: '#fff',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Réessayer
          </button>
        </div>
      )}
      
      {/* KPI Cards Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: '20px',
        marginBottom: '32px',
      }}>
        {/* Interventions */}
        <KpiCard
          title="Interventions"
          value={kpis?.interventionsCount ?? 0}
          variation={kpis?.interventionsVariation ?? 0}
          icon={Wrench}
          color="#6366F1"
          bgColor="#EEF2FF"
          isLoading={isLoading}
        />
        {/* CA */}
        <KpiCard
          title="Chiffre d'affaires"
          value={formatCurrency(kpis?.revenueTotalCents ?? 0)}
          variation={kpis?.revenueVariation ?? 0}
          icon={Euro}
          color="#10B981"
          bgColor="#ECFDF5"
          isLoading={isLoading}
        />
        {/* Clients */}
        <KpiCard
          title="Nouveaux clients"
          value={kpis?.clientsCount ?? 0}
          variation={kpis?.clientsVariation ?? 0}
          icon={Users}
          color="#F59E0B"
          bgColor="#FFFBEB"
          isLoading={isLoading}
        />
        {/* Véhicules */}
        <KpiCard
          title="Véhicules ajoutés"
          value={kpis?.vehiclesCount ?? 0}
          variation={kpis?.vehiclesVariation ?? 0}
          icon={Car}
          color="#8B5CF6"
          bgColor="#F5F3FF"
          isLoading={isLoading}
        />
      </div>

      {/* Main Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '24px',
        marginBottom: '32px',
      }}>
        {/* Interventions par statut */}
        <div
          style={{
            background: '#fff',
            borderRadius: '16px',
            border: '1px solid #E5E7EB',
            padding: '24px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#111827', margin: 0 }}>
              Répartition des interventions
            </h3>
            <Link
              href="/interventions"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '13px',
                fontWeight: 500,
                color: '#6366F1',
                textDecoration: 'none',
              }}
            >
              Voir tout <ArrowRight size={14} />
            </Link>
          </div>

          {isLoading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {[1, 2, 3].map((i) => (
                <div key={i} style={{ height: '56px', background: '#F3F4F6', borderRadius: '12px' }} />
              ))}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {/* Terminées */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '16px',
                  borderRadius: '12px',
                  background: '#ECFDF5',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <CheckCircle size={20} color="#10B981" />
                  <span style={{ fontSize: '14px', fontWeight: 500, color: '#111827' }}>Terminées</span>
                </div>
                <span style={{ fontSize: '24px', fontWeight: 700, color: '#10B981' }}>
                  {analytics?.done ?? 0}
                </span>
              </div>
              {/* En cours */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '16px',
                  borderRadius: '12px',
                  background: '#EFF6FF',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <Clock size={20} color="#3B82F6" />
                  <span style={{ fontSize: '14px', fontWeight: 500, color: '#111827' }}>En cours</span>
                </div>
                <span style={{ fontSize: '24px', fontWeight: 700, color: '#3B82F6' }}>
                  {analytics?.inProgress ?? 0}
                </span>
              </div>
              {/* Annulées */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '16px',
                  borderRadius: '12px',
                  background: '#FEF2F2',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <XCircle size={20} color="#EF4444" />
                  <span style={{ fontSize: '14px', fontWeight: 500, color: '#111827' }}>Annulées</span>
                </div>
                <span style={{ fontSize: '24px', fontWeight: 700, color: '#EF4444' }}>
                  {analytics?.cancelled ?? 0}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Interventions récentes */}
        <div
          style={{
            background: '#fff',
            borderRadius: '16px',
            border: '1px solid #E5E7EB',
            padding: '24px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Calendar size={18} color="#6366F1" />
              <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#111827', margin: 0 }}>
                Dernières interventions
              </h3>
            </div>
          </div>

          {isLoading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {[1, 2, 3, 4].map((i) => (
                <div key={i} style={{ height: '48px', background: '#F3F4F6', borderRadius: '10px' }} />
              ))}
            </div>
          ) : recentInterventions.length === 0 ? (
            <div
              style={{
                textAlign: 'center',
                padding: '40px 20px',
                color: '#6B7280',
              }}
            >
              <Wrench size={32} color="#D1D5DB" style={{ marginBottom: '12px' }} />
              <p style={{ margin: 0, fontSize: '14px' }}>Aucune intervention récente</p>
              <Link
                href="/interventions/new"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  marginTop: '12px',
                  fontSize: '14px',
                  fontWeight: 600,
                  color: '#6366F1',
                  textDecoration: 'none',
                }}
              >
                <Plus size={16} /> Créer une intervention
              </Link>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {recentInterventions.slice(0, 5).map((intervention) => {
                const statusStyle = getStatusStyle(intervention.status)
                return (
                  <Link
                    key={intervention.id}
                    href={`/interventions/${intervention.id}`}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '12px 14px',
                      borderRadius: '10px',
                      textDecoration: 'none',
                      transition: 'background 0.15s ease',
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = '#F9FAFB'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div
                        style={{
                          width: '36px',
                          height: '36px',
                          borderRadius: '10px',
                          background: '#F3F4F6',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Wrench size={16} color="#6B7280" />
                      </div>
                      <div>
                        <p style={{ fontSize: '14px', fontWeight: 500, color: '#111827', margin: 0 }}>
                          {intervention.vehicleLabel || 'Véhicule'}
                        </p>
                        <p style={{ fontSize: '12px', color: '#9CA3AF', margin: 0 }}>
                          {intervention.ref}
                        </p>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span
                        style={{
                          padding: '4px 10px',
                          borderRadius: '6px',
                          fontSize: '12px',
                          fontWeight: 600,
                          background: statusStyle.bg,
                          color: statusStyle.color,
                        }}
                      >
                        {getStatusLabel(intervention.status)}
                      </span>
                      <span style={{ fontSize: '14px', fontWeight: 600, color: '#111827' }}>
                        {formatCurrency(intervention.totalCents)}
                      </span>
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </div>
      </div>
      
      {/* Quick Actions - Floating */}
      <div style={{
        position: 'fixed',
        bottom: '32px',
        right: '32px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        alignItems: 'flex-end',
        zIndex: 40
      }}>
        <Link
          href="/interventions/new"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '14px 24px',
            borderRadius: '14px',
            background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
            color: '#fff',
            fontSize: '15px',
            fontWeight: 600,
            textDecoration: 'none',
            boxShadow: '0 10px 25px -5px rgba(99, 102, 241, 0.4)',
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
        >
          <Plus size={20} />
          Nouvelle intervention
        </Link>
        
        <div style={{ display: 'flex', gap: '10px' }}>
          <Link
            href="/clients/new"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '12px 18px',
              borderRadius: '12px',
              background: '#fff',
              border: '1px solid #E5E7EB',
              color: '#374151',
              fontSize: '14px',
              fontWeight: 600,
              textDecoration: 'none',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = '#D1D5DB'
              e.currentTarget.style.background = '#F9FAFB'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = '#E5E7EB'
              e.currentTarget.style.background = '#fff'
            }}
          >
            <UserPlus size={18} />
            Nouveau client
          </Link>
          
          <Link
            href="/vehicules/search"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '12px 18px',
              borderRadius: '12px',
              background: '#fff',
              border: '1px solid #E5E7EB',
              color: '#374151',
              fontSize: '14px',
              fontWeight: 600,
              textDecoration: 'none',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = '#D1D5DB'
              e.currentTarget.style.background = '#F9FAFB'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = '#E5E7EB'
              e.currentTarget.style.background = '#fff'
            }}
          >
            <Search size={18} />
            Recherche SIV
          </Link>
        </div>
      </div>

      {/* CSS Animation */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}} />
    </div>
  )
}

// KPI Card Component
interface KpiCardProps {
  title: string
  value: string | number
  variation: number
  icon: LucideIcon
  color: string
  bgColor: string
  isLoading: boolean
}

function KpiCard({ title, value, variation, icon: Icon, color, bgColor, isLoading }: KpiCardProps) {
  if (isLoading) {
    return (
      <div
        style={{
          padding: '24px',
          borderRadius: '16px',
          background: '#fff',
          border: '1px solid #E5E7EB',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div style={{ width: '100px', height: '14px', background: '#F3F4F6', borderRadius: '4px' }} />
          <div style={{ width: '40px', height: '40px', background: '#F3F4F6', borderRadius: '10px' }} />
        </div>
        <div style={{ width: '80px', height: '28px', background: '#F3F4F6', borderRadius: '6px' }} />
      </div>
    )
  }

  const isPositive = variation > 0
  const isNegative = variation < 0

  return (
    <div
      style={{
        padding: '24px',
        borderRadius: '16px',
        background: '#fff',
        border: '1px solid #E5E7EB',
        transition: 'all 0.2s ease',
        cursor: 'default',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = '0 10px 25px -5px rgba(0, 0, 0, 0.1)'
        e.currentTarget.style.transform = 'translateY(-2px)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = 'none'
        e.currentTarget.style.transform = 'translateY(0)'
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
        <p style={{ fontSize: '13px', fontWeight: 500, color: '#6B7280', margin: 0 }}>
          {title}
        </p>
        <div
          style={{
            width: '40px',
            height: '40px',
            borderRadius: '10px',
            background: bgColor,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Icon size={20} color={color} />
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px' }}>
        <span style={{ fontSize: '28px', fontWeight: 700, color: '#111827' }}>
          {value}
        </span>
        {variation !== 0 && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '3px',
              padding: '3px 8px',
              borderRadius: '6px',
              background: isPositive ? '#ECFDF5' : isNegative ? '#FEF2F2' : '#F9FAFB',
            }}
          >
            {isPositive ? (
              <TrendingUp size={12} color="#10B981" />
            ) : isNegative ? (
              <TrendingDown size={12} color="#EF4444" />
            ) : null}
            <span
              style={{
                fontSize: '12px',
                fontWeight: 600,
                color: isPositive ? '#10B981' : isNegative ? '#EF4444' : '#6B7280',
              }}
            >
              {isPositive ? '+' : ''}{variation}%
            </span>
          </div>
        )}
      </div>
    </div>
  )
}
