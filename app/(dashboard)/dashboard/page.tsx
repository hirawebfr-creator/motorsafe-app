'use client'

import { useState, useEffect } from 'react'
import { KpiCard } from '@/components/shared/kpi-card'
import { Button } from '@/components/shared/button'
import { useToast } from '@/components/shared/use-toast'
import { 
  Wrench, 
  Euro, 
  Users, 
  FileSignature,
  Plus,
  UserPlus,
  Search,
  CheckCircle,
  LucideIcon
} from 'lucide-react'

interface KPI {
  title: string
  value: string | number
  variation: number
  icon: LucideIcon
}

interface Activity {
  id: string
  type: 'intervention' | 'signature' | 'export' | 'client'
  message: string
  timestamp: Date
  user: string
}

export default function DashboardPage() {
  const toast = useToast()
  const [period, setPeriod] = useState<'month' | '30days' | 'year'>('month')
  const [isLoading, setIsLoading] = useState(true)
  const [kpis, setKpis] = useState<KPI[]>([])
  const [activities, setActivities] = useState<Activity[]>([])
  
  // Charger données depuis les APIs
  useEffect(() => {
    const loadDashboardData = async () => {
      setIsLoading(true)
      
      try {
        // Charger KPIs
        const kpisResponse = await fetch(`/api/dashboard/kpis?period=${period}`)
        const kpisData = await kpisResponse.json()
        
        // Traiter les KPIs - transformer le format API en format UI
        if (kpisData.ok) {
          const formattedKpis: KPI[] = [
            {
              title: 'Interventions',
              value: kpisData.interventionsCount ?? 0,
              variation: kpisData.interventionsVariation ?? 0,
              icon: Wrench
            },
            {
              title: 'Chiffre d\'affaires',
              value: formatCurrency(kpisData.revenueTotalCents ?? 0),
              variation: kpisData.revenueVariation ?? 0,
              icon: Euro
            },
            {
              title: 'Clients actifs',
              value: kpisData.clientsCount ?? 0,
              variation: kpisData.clientsVariation ?? 0,
              icon: Users
            },
            {
              title: 'Véhicules',
              value: kpisData.vehiclesCount ?? 0,
              variation: kpisData.vehiclesVariation ?? 0,
              icon: FileSignature
            }
          ]
          setKpis(formattedKpis)
        } else {
          throw new Error('API KPIs error')
        }
        
        // Charger activités récentes via les dernières interventions
        const activitiesResponse = await fetch('/api/dashboard/recent-interventions?limit=5')
        const activitiesData = await activitiesResponse.json()
        
        // L'API renvoie { ok: true, data: [...] } où data est le tableau
        const interventionsList = activitiesData.ok ? (activitiesData.data ?? []) : []
        
        if (interventionsList.length > 0) {
          const formattedActivities: Activity[] = interventionsList.map((i: { id: string; ref?: string; vehicleLabel?: string; status: string }, index: number) => ({
            id: i.id || String(index),
            type: 'intervention' as const,
            message: `${i.ref || 'Intervention'} - ${i.vehicleLabel || 'Véhicule'}`,
            timestamp: new Date(Date.now() - 1000 * 60 * (index + 1) * 15), // Approximation temporelle
            user: i.status || 'EN_ATTENTE'
          }))
          setActivities(formattedActivities)
        } else {
          // Fallback mock activities
          setActivities([
            { id: '1', type: 'intervention', message: 'Nouvelle intervention pour Jean Dupont - Peugeot 208', timestamp: new Date(Date.now() - 1000 * 60 * 15), user: 'Pierre Martin' },
            { id: '2', type: 'signature', message: 'Signature client reçue - Intervention #1234', timestamp: new Date(Date.now() - 1000 * 60 * 45), user: 'Sophie Blanc' },
            { id: '3', type: 'client', message: 'Nouveau client créé - Marie Dubois', timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), user: 'Pierre Martin' },
            { id: '4', type: 'export', message: 'Export assurance généré - Dossier #5678', timestamp: new Date(Date.now() - 1000 * 60 * 60 * 4), user: 'Sophie Blanc' }
          ])
        }
        
      } catch (error) {
        console.error('Error loading dashboard:', error)
        toast.error('Erreur', 'Impossible de charger le tableau de bord')
        
        // Fallback complet sur données simulées en cas d'erreur réseau
        setKpis([
          { title: 'Interventions', value: 47, variation: 12.5, icon: Wrench },
          { title: 'Chiffre d\'affaires', value: '18 600 €', variation: 8.3, icon: Euro },
          { title: 'Clients actifs', value: 23, variation: 5.2, icon: Users },
          { title: 'En attente signature', value: 3, variation: -25, icon: FileSignature }
        ])
        
        setActivities([
          { id: '1', type: 'intervention', message: 'Nouvelle intervention pour Jean Dupont - Peugeot 208', timestamp: new Date(Date.now() - 1000 * 60 * 15), user: 'Pierre Martin' },
          { id: '2', type: 'signature', message: 'Signature client reçue - Intervention #1234', timestamp: new Date(Date.now() - 1000 * 60 * 45), user: 'Sophie Blanc' },
          { id: '3', type: 'client', message: 'Nouveau client créé - Marie Dubois', timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), user: 'Pierre Martin' },
          { id: '4', type: 'export', message: 'Export assurance généré - Dossier #5678', timestamp: new Date(Date.now() - 1000 * 60 * 60 * 4), user: 'Sophie Blanc' }
        ])
      } finally {
        setIsLoading(false)
      }
    }
    
    loadDashboardData()
  }, [period, toast])
  
  // Formater les centimes en euros
  const formatCurrency = (cents: number): string => {
    return new Intl.NumberFormat('fr-FR', { 
      style: 'currency', 
      currency: 'EUR',
      maximumFractionDigits: 0 
    }).format(cents / 100)
  }
  
  const formatTimeAgo = (date: Date): string => {
    const seconds = Math.floor((Date.now() - date.getTime()) / 1000)
    
    if (seconds < 60) return 'À l\'instant'
    if (seconds < 3600) return `Il y a ${Math.floor(seconds / 60)} min`
    if (seconds < 86400) return `Il y a ${Math.floor(seconds / 3600)} h`
    return `Il y a ${Math.floor(seconds / 86400)} j`
  }
  
  const getActivityIcon = (type: Activity['type']) => {
    switch (type) {
      case 'intervention':
        return <Wrench size={20} style={{ color: '#3B82F6' }} />
      case 'signature':
        return <CheckCircle size={20} style={{ color: '#16A34A' }} />
      case 'export':
        return <FileSignature size={20} style={{ color: '#F59E0B' }} />
      case 'client':
        return <UserPlus size={20} style={{ color: '#8B5CF6' }} />
    }
  }
  
  return (
    <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '32px'
      }}>
        <div>
          <h1 style={{
            fontSize: '32px',
            fontWeight: 700,
            color: '#111827',
            margin: 0,
            marginBottom: '4px'
          }}>
            Tableau de bord
          </h1>
          <p style={{
            fontSize: '14px',
            color: '#6B7280',
            margin: 0
          }}>
            Vue d'ensemble de votre activité
          </p>
        </div>
        
        {/* Period selector */}
        <div style={{
          display: 'flex',
          gap: '8px',
          backgroundColor: '#F9FAFB',
          padding: '4px',
          borderRadius: '8px',
          border: '1px solid #E5E7EB'
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
                padding: '8px 16px',
                fontSize: '14px',
                fontWeight: 500,
                color: period === option.value ? '#FFFFFF' : '#6B7280',
                backgroundColor: period === option.value ? '#0A1628' : 'transparent',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>
      
      {/* KPI Cards Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '20px',
        marginBottom: '32px'
      }}>
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              style={{
                height: '140px',
                backgroundColor: '#F9FAFB',
                borderRadius: '12px',
                border: '1px solid #E5E7EB'
              }}
            />
          ))
        ) : (
          kpis.map((kpi, index) => (
            <KpiCard
              key={index}
              title={kpi.title}
              value={kpi.value}
              variation={kpi.variation}
              icon={kpi.icon}
            />
          ))
        )}
      </div>
      
      {/* Charts Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
        gap: '20px',
        marginBottom: '32px'
      }}>
        {/* Interventions par statut */}
        <div style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '12px',
          border: '1px solid #E5E7EB',
          padding: '24px'
        }}>
          <h3 style={{
            fontSize: '18px',
            fontWeight: 600,
            color: '#111827',
            marginBottom: '20px',
            margin: 0
          }}>
            Interventions par statut
          </h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '20px' }}>
            {[
              { label: 'Terminées', value: 156, color: '#16A34A' },
              { label: 'En attente', value: 12, color: '#F59E0B' },
              { label: 'En cours', value: 8, color: '#3B82F6' },
              { label: 'Annulées', value: 3, color: '#DC2626' }
            ].map((stat, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{
                    width: '12px',
                    height: '12px',
                    borderRadius: '50%',
                    backgroundColor: stat.color
                  }} />
                  <span style={{ fontSize: '14px', color: '#6B7280' }}>
                    {stat.label}
                  </span>
                </div>
                <span style={{ fontSize: '16px', fontWeight: 600, color: '#111827' }}>
                  {stat.value}
                </span>
              </div>
            ))}
          </div>
        </div>
        
        {/* CA mensuel */}
        <div style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '12px',
          border: '1px solid #E5E7EB',
          padding: '24px'
        }}>
          <h3 style={{
            fontSize: '18px',
            fontWeight: 600,
            color: '#111827',
            marginBottom: '20px',
            margin: 0
          }}>
            Chiffre d'affaires mensuel
          </h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '20px' }}>
            {[
              { month: 'Août', amount: 12500 },
              { month: 'Sept', amount: 15200 },
              { month: 'Oct', amount: 13800 },
              { month: 'Nov', amount: 16400 },
              { month: 'Déc', amount: 14200 },
              { month: 'Janv', amount: 18600 }
            ].map((data, i) => {
              const maxAmount = 20000
              const percentage = (data.amount / maxAmount) * 100
              
              return (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ 
                    fontSize: '13px', 
                    color: '#6B7280', 
                    minWidth: '50px' 
                  }}>
                    {data.month}
                  </span>
                  <div style={{
                    flex: 1,
                    height: '24px',
                    backgroundColor: '#F3F4F6',
                    borderRadius: '4px',
                    overflow: 'hidden',
                    position: 'relative'
                  }}>
                    <div style={{
                      width: `${percentage}%`,
                      height: '100%',
                      backgroundColor: '#0A1628',
                      transition: 'width 0.3s ease'
                    }} />
                  </div>
                  <span style={{ 
                    fontSize: '14px', 
                    fontWeight: 600, 
                    color: '#111827',
                    minWidth: '70px',
                    textAlign: 'right'
                  }}>
                    {data.amount.toLocaleString()} €
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      </div>
      
      {/* Timeline activités */}
      <div style={{
        backgroundColor: '#FFFFFF',
        borderRadius: '12px',
        border: '1px solid #E5E7EB',
        padding: '24px'
      }}>
        <h3 style={{
          fontSize: '18px',
          fontWeight: 600,
          color: '#111827',
          marginBottom: '20px',
          margin: 0
        }}>
          Activité récente
        </h3>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '20px' }}>
          {activities.map((activity) => (
            <div
              key={activity.id}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '12px',
                padding: '12px',
                borderRadius: '8px',
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#F9FAFB'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent'
              }}
            >
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '8px',
                backgroundColor: '#F9FAFB',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                {getActivityIcon(activity.type)}
              </div>
              
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{
                  fontSize: '14px',
                  color: '#111827',
                  margin: 0,
                  marginBottom: '4px'
                }}>
                  {activity.message}
                </p>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  fontSize: '12px',
                  color: '#9CA3AF'
                }}>
                  <span>{activity.user}</span>
                  <span>•</span>
                  <span>{formatTimeAgo(activity.timestamp)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Floating Action Buttons */}
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
        <Button
          variant="primary"
          size="lg"
          leftIcon={<Plus size={20} />}
          style={{
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.2)',
            minWidth: '200px'
          }}
          onClick={() => toast.info('Navigation', 'Redirection vers nouvelle intervention')}
        >
          Nouvelle intervention
        </Button>
        
        <div style={{ display: 'flex', gap: '8px' }}>
          <Button
            variant="secondary"
            size="md"
            leftIcon={<UserPlus size={18} />}
            style={{
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
            }}
            onClick={() => toast.info('Navigation', 'Redirection vers nouveau client')}
          >
            Nouveau client
          </Button>
          
          <Button
            variant="secondary"
            size="md"
            leftIcon={<Search size={18} />}
            style={{
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
            }}
            onClick={() => toast.info('SIV', 'Recherche SIV à venir')}
          >
            Recherche SIV
          </Button>
        </div>
      </div>
    </div>
  )
}
