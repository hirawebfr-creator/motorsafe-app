'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Badge } from '@/components/shared/badge'
import { Button } from '@/components/shared/button'
import { Modal } from '@/components/shared/modal'
import { Select } from '@/components/shared/select'
import { Textarea } from '@/components/shared/textarea'
import { Avatar } from '@/components/shared/avatar'
import { useToast } from '@/components/shared/use-toast'
import { 
  ArrowLeft,
  Calendar,
  User,
  Gauge,
  FileText,
  Image as ImageIcon,
  CheckCircle,
  XCircle,
  Clock,
  PlayCircle,
  FileSignature
} from 'lucide-react'

type InterventionStatus = 'DRAFT' | 'OPEN' | 'DONE' | 'CANCELED'

interface Intervention {
  id: string
  number?: string
  type: string
  title?: string
  notes?: string
  status: InterventionStatus
  odometerKm?: number
  amountCents?: number
  createdAt: Date
  updatedAt: Date
  performedAt?: Date
  agreementAt?: Date
  closedAt?: Date
  createdBy?: string
  vehicleId: string
  vehicle?: {
    id: string
    plate: string
    brand: string
    model: string
    client?: {
      id: number
      firstName: string
      lastName: string
      email?: string
      phone?: string
    }
  }
}

interface TimelineEvent {
  id: string
  type: 'status_change' | 'signature' | 'document' | 'note'
  title: string
  description?: string
  user: string
  timestamp: Date
}

export default function InterventionDetailPage() {
  const router = useRouter()
  const params = useParams()
  const toast = useToast()
  const interventionId = params.id as string
  
  const [intervention, setIntervention] = useState<Intervention | null>(null)
  const [timeline, setTimeline] = useState<TimelineEvent[]>([])
  const [isLoading, setIsLoading] = useState(true)
  
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false)
  const [newStatus, setNewStatus] = useState<InterventionStatus>('DRAFT')
  const [statusComment, setStatusComment] = useState('')
  const [isChangingStatus, setIsChangingStatus] = useState(false)
  
  useEffect(() => {
    loadInterventionData()
  }, [interventionId])
  
  const loadInterventionData = async () => {
    setIsLoading(true)
    
    try {
      // Charger intervention
      const interventionResponse = await fetch(`/api/interventions/${interventionId}`)
      const interventionData = await interventionResponse.json()
      
      if (interventionData.ok && interventionData.data) {
        const itv = interventionData.data
        setIntervention(itv)
        
        // Générer timeline depuis l'intervention
        const mockTimeline: TimelineEvent[] = [
          {
            id: '1',
            type: 'status_change',
            title: 'Intervention créée',
            description: `Statut initial : ${getStatusLabel('DRAFT')}`,
            user: itv.createdBy || 'Système',
            timestamp: new Date(itv.createdAt)
          }
        ]
        
        if (itv.status !== 'DRAFT') {
          mockTimeline.push({
            id: '2',
            type: 'status_change',
            title: 'Intervention ouverte',
            description: `Statut changé en ${getStatusLabel('OPEN')}`,
            user: 'Atelier',
            timestamp: new Date(itv.updatedAt)
          })
        }
        
        if (itv.agreementAt) {
          mockTimeline.push({
            id: '3',
            type: 'signature',
            title: 'Accord client',
            description: 'Le client a validé les travaux',
            user: itv.vehicle?.client ? `${itv.vehicle.client.firstName} ${itv.vehicle.client.lastName}` : 'Client',
            timestamp: new Date(itv.agreementAt)
          })
        }
        
        if (itv.closedAt) {
          mockTimeline.push({
            id: '4',
            type: 'status_change',
            title: 'Intervention clôturée',
            description: 'Les travaux sont terminés',
            user: 'Atelier',
            timestamp: new Date(itv.closedAt)
          })
        }
        
        if (itv.status === 'DONE') {
          mockTimeline.push({
            id: '5',
            type: 'status_change',
            title: 'Intervention terminée',
            description: 'Les travaux sont terminés',
            user: 'Atelier',
            timestamp: new Date(itv.updatedAt)
          })
        }
        
        setTimeline(mockTimeline.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()))
        
      } else {
        toast.error('Erreur', 'Intervention introuvable')
        router.push('/interventions')
        return
      }
      
    } catch (error) {
      console.error('Error loading intervention:', error)
      toast.error('Erreur', 'Impossible de charger les données')
      
      // Fallback mock data
      setIntervention({
        id: interventionId,
        number: 'INT-2024-001',
        type: 'revision',
        title: 'Révision 20 000 km + changement plaquettes de frein avant',
        notes: 'RAS au diagnostic. Plaquettes avant à 2mm.',
        status: 'OPEN',
        odometerKm: 45000,
        amountCents: 27000,
        createdAt: new Date('2024-01-15T10:00:00'),
        updatedAt: new Date('2024-01-15T10:00:00'),
        performedAt: new Date('2024-01-15'),
        agreementAt: new Date('2024-01-15T14:30:00'),
        createdBy: 'Pierre Martin',
        vehicleId: '1',
        vehicle: {
          id: '1',
          plate: 'AB-123-CD',
          brand: 'Peugeot',
          model: '208',
          client: {
            id: 1,
            firstName: 'Jean',
            lastName: 'Dupont',
            email: 'jean.dupont@email.fr',
            phone: '06 12 34 56 78'
          }
        }
      })
      
      setTimeline([
        {
          id: '1',
          type: 'status_change',
          title: 'Intervention créée',
          description: 'Statut initial : Brouillon',
          user: 'Pierre Martin',
          timestamp: new Date('2024-01-15T10:00:00')
        },
        {
          id: '2',
          type: 'status_change',
          title: 'Intervention ouverte',
          description: 'Statut changé en En cours',
          user: 'Atelier',
          timestamp: new Date('2024-01-15T10:30:00')
        },
        {
          id: '3',
          type: 'signature',
          title: 'Accord client',
          description: 'Le client a validé les travaux',
          user: 'Jean Dupont',
          timestamp: new Date('2024-01-15T14:30:00')
        }
      ])
      
    } finally {
      setIsLoading(false)
    }
  }
  
  const getStatusLabel = (status: InterventionStatus): string => {
    const labels: Record<string, string> = {
      DRAFT: 'Brouillon',
      OPEN: 'En cours',
      DONE: 'Terminée',
      CANCELED: 'Annulée'
    }
    return labels[status] || status
  }
  
  const getStatusBadgeVariant = (status: InterventionStatus) => {
    const variants: Record<string, string> = {
      DRAFT: 'neutral',
      OPEN: 'info',
      DONE: 'success',
      CANCELED: 'error'
    }
    return variants[status] as any
  }
  
  const getStatusIcon = (status: InterventionStatus): React.ReactNode => {
    switch (status) {
      case 'DRAFT': return <Clock size={20} />
      case 'OPEN': return <PlayCircle size={20} />
      case 'DONE': return <CheckCircle size={20} />
      case 'CANCELED': return <XCircle size={20} />
      default: return <Clock size={20} />
    }
  }
  
  const getAvailableStatuses = (currentStatus: InterventionStatus): InterventionStatus[] => {
    switch (currentStatus) {
      case 'DRAFT':
        return ['DRAFT', 'OPEN', 'CANCELED']
      case 'OPEN':
        return ['OPEN', 'DONE', 'CANCELED']
      case 'DONE':
        return ['DONE']
      case 'CANCELED':
        return ['CANCELED']
      default:
        return []
    }
  }
  
  const handleStatusChangeClick = () => {
    if (!intervention) return
    
    const nextStatus = getNextStatus(intervention.status)
    setNewStatus(nextStatus)
    setStatusComment('')
    setIsStatusModalOpen(true)
  }
  
  const getNextStatus = (currentStatus: InterventionStatus): InterventionStatus => {
    switch (currentStatus) {
      case 'DRAFT': return 'OPEN'
      case 'OPEN': return 'DONE'
      case 'DONE': return 'DONE'
      case 'CANCELED': return 'CANCELED'
      default: return 'DRAFT'
    }
  }
  
  const handleStatusChange = async () => {
    if (!intervention) return
    
    setIsChangingStatus(true)
    
    try {
      const response = await fetch(`/api/interventions/${intervention.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: newStatus,
          comment: statusComment
        })
      })
      
      const data = await response.json()
      
      if (data.ok) {
        toast.success('Statut modifié', `L'intervention est maintenant ${getStatusLabel(newStatus)}`)
        setIsStatusModalOpen(false)
        loadInterventionData()
      } else {
        toast.error('Erreur', data.error?.message || 'Impossible de changer le statut')
      }
      
    } catch (error) {
      console.error('Error changing status:', error)
      toast.error('Erreur', 'Impossible de se connecter au serveur')
    } finally {
      setIsChangingStatus(false)
    }
  }
  
  const formatCurrency = (amountCents?: number): string => {
    if (!amountCents) return '-'
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(amountCents / 100)
  }
  
  const getTimelineIcon = (type: TimelineEvent['type']): React.ReactNode => {
    switch (type) {
      case 'status_change': return <PlayCircle size={14} style={{ color: '#3B82F6' }} />
      case 'signature': return <FileSignature size={14} style={{ color: '#16A34A' }} />
      case 'document': return <FileText size={14} style={{ color: '#F59E0B' }} />
      case 'note': return <FileText size={14} style={{ color: '#6B7280' }} />
      default: return <FileText size={14} style={{ color: '#6B7280' }} />
    }
  }
  
  const getClientName = (): string => {
    if (intervention?.vehicle?.client) {
      return `${intervention.vehicle.client.firstName} ${intervention.vehicle.client.lastName}`
    }
    return 'Client inconnu'
  }
  
  const getVehicleInfo = (): string => {
    if (intervention?.vehicle) {
      return `${intervention.vehicle.brand} ${intervention.vehicle.model}`
    }
    return 'Véhicule inconnu'
  }
  
  if (isLoading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '400px'
      }}>
        <div style={{
          width: '40px',
          height: '40px',
          border: '4px solid #F3F4F6',
          borderTopColor: '#0A1628',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite'
        }} />
        <style>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    )
  }
  
  if (!intervention) {
    return (
      <div style={{ padding: '24px' }}>
        <p style={{ fontSize: '14px', color: '#6B7280' }}>Intervention introuvable</p>
      </div>
    )
  }
  
  const canChangeStatus = intervention.status !== 'DONE' && intervention.status !== 'CANCELED'
  
  return (
    <div style={{ padding: '24px', maxWidth: '1600px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <Button
          variant="secondary"
          leftIcon={<ArrowLeft size={20} />}
          onClick={() => router.push('/interventions')}
          style={{ marginBottom: '16px' }}
        >
          Retour aux interventions
        </Button>
        
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start'
        }}>
          <div>
            <h1 style={{
              fontSize: '32px',
              fontWeight: 700,
              color: '#111827',
              margin: 0,
              marginBottom: '8px'
            }}>
              {intervention.number || `#${String(intervention.id).slice(0, 8)}`}
            </h1>
            <div style={{
              display: 'flex',
              gap: '12px',
              alignItems: 'center'
            }}>
              <Badge variant={getStatusBadgeVariant(intervention.status)}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  {getStatusIcon(intervention.status)}
                  {getStatusLabel(intervention.status)}
                </div>
              </Badge>
              <span style={{ fontSize: '14px', color: '#6B7280' }}>
                Créée le {new Date(intervention.createdAt).toLocaleDateString('fr-FR')}
              </span>
            </div>
          </div>
          
          <div style={{ display: 'flex', gap: '12px' }}>
            <Button
              variant="secondary"
              leftIcon={<FileText size={20} />}
              onClick={() => toast.info('Génération', 'Fonctionnalité disponible prochainement')}
            >
              Générer devis
            </Button>
            {intervention.status === 'DONE' && (
              <Button
                variant="secondary"
                leftIcon={<FileText size={20} />}
                onClick={() => toast.info('Génération', 'Fonctionnalité disponible prochainement')}
              >
                Générer facture
              </Button>
            )}
            {canChangeStatus && (
              <Button
                variant="primary"
                onClick={handleStatusChangeClick}
              >
                Changer statut
              </Button>
            )}
          </div>
        </div>
      </div>
      
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '24px'
      }}>
        {/* Colonne gauche */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Informations intervention */}
          <div style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '12px',
            border: '1px solid #E5E7EB',
            padding: '24px'
          }}>
            <h2 style={{
              fontSize: '18px',
              fontWeight: 600,
              color: '#111827',
              margin: 0,
              marginBottom: '20px'
            }}>
              Informations
            </h2>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <div style={{ fontSize: '12px', fontWeight: 500, color: '#6B7280', marginBottom: '6px' }}>
                  Type d'intervention
                </div>
                <Badge variant="default">
                  {intervention.type}
                </Badge>
              </div>
              
              <div>
                <div style={{ fontSize: '12px', fontWeight: 500, color: '#6B7280', marginBottom: '6px' }}>
                  Date
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Calendar size={16} style={{ color: '#9CA3AF' }} />
                  <span style={{ fontSize: '14px', color: '#111827' }}>
                    {intervention.performedAt 
                      ? new Date(intervention.performedAt).toLocaleDateString('fr-FR')
                      : new Date(intervention.createdAt).toLocaleDateString('fr-FR')
                    }
                  </span>
                </div>
              </div>
              
              {intervention.odometerKm && (
                <div>
                  <div style={{ fontSize: '12px', fontWeight: 500, color: '#6B7280', marginBottom: '6px' }}>
                    Kilométrage
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Gauge size={16} style={{ color: '#9CA3AF' }} />
                    <span style={{ fontSize: '14px', color: '#111827' }}>
                      {intervention.odometerKm.toLocaleString('fr-FR')} km
                    </span>
                  </div>
                </div>
              )}
              
              {intervention.title && (
                <div>
                  <div style={{ fontSize: '12px', fontWeight: 500, color: '#6B7280', marginBottom: '6px' }}>
                    Description des travaux
                  </div>
                  <p style={{
                    fontSize: '14px',
                    color: '#374151',
                    lineHeight: 1.6,
                    margin: 0,
                    backgroundColor: '#F9FAFB',
                    padding: '12px',
                    borderRadius: '8px'
                  }}>
                    {intervention.title}
                  </p>
                </div>
              )}
              
              {intervention.notes && (
                <div>
                  <div style={{ fontSize: '12px', fontWeight: 500, color: '#6B7280', marginBottom: '6px' }}>
                    Notes
                  </div>
                  <p style={{
                    fontSize: '14px',
                    color: '#374151',
                    lineHeight: 1.6,
                    margin: 0,
                    backgroundColor: '#FEF3C7',
                    padding: '12px',
                    borderRadius: '8px'
                  }}>
                    {intervention.notes}
                  </p>
                </div>
              )}
            </div>
          </div>
          
          {/* Client */}
          <div style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '12px',
            border: '1px solid #E5E7EB',
            padding: '24px'
          }}>
            <h2 style={{
              fontSize: '18px',
              fontWeight: 600,
              color: '#111827',
              margin: 0,
              marginBottom: '20px'
            }}>
              Client
            </h2>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <div style={{ fontSize: '12px', fontWeight: 500, color: '#6B7280', marginBottom: '6px' }}>
                  Nom
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <User size={16} style={{ color: '#9CA3AF' }} />
                  <span 
                    style={{ 
                      fontSize: '14px', 
                      color: '#3B82F6',
                      cursor: 'pointer',
                      textDecoration: 'underline'
                    }}
                    onClick={() => {
                      if (intervention.vehicle?.client?.id) {
                        router.push(`/clients/${intervention.vehicle.client.id}`)
                      }
                    }}
                  >
                    {getClientName()}
                  </span>
                </div>
              </div>
              
              {intervention.vehicle?.client?.email && (
                <div>
                  <div style={{ fontSize: '12px', fontWeight: 500, color: '#6B7280', marginBottom: '6px' }}>
                    Email
                  </div>
                  <div style={{ fontSize: '14px', color: '#111827' }}>
                    {intervention.vehicle.client.email}
                  </div>
                </div>
              )}
              
              {intervention.vehicle?.client?.phone && (
                <div>
                  <div style={{ fontSize: '12px', fontWeight: 500, color: '#6B7280', marginBottom: '6px' }}>
                    Téléphone
                  </div>
                  <div style={{ fontSize: '14px', color: '#111827' }}>
                    {intervention.vehicle.client.phone}
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {/* Véhicule */}
          <div style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '12px',
            border: '1px solid #E5E7EB',
            padding: '24px'
          }}>
            <h2 style={{
              fontSize: '18px',
              fontWeight: 600,
              color: '#111827',
              margin: 0,
              marginBottom: '20px'
            }}>
              Véhicule
            </h2>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <Avatar name={getVehicleInfo()} size="md" shape="square" />
              <div>
                <div 
                  style={{ 
                    fontSize: '14px', 
                    fontWeight: 500, 
                    color: '#3B82F6',
                    cursor: 'pointer',
                    textDecoration: 'underline'
                  }}
                  onClick={() => router.push(`/vehicules/${intervention.vehicleId}`)}
                >
                  {getVehicleInfo()}
                </div>
                {intervention.vehicle?.plate && (
                  <div style={{
                    fontFamily: 'monospace',
                    fontSize: '14px',
                    fontWeight: 600,
                    color: '#111827',
                    backgroundColor: '#F9FAFB',
                    padding: '2px 6px',
                    borderRadius: '4px',
                    display: 'inline-block',
                    marginTop: '4px'
                  }}>
                    {intervention.vehicle.plate}
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* Montants */}
          {intervention.amountCents && (
            <div style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '12px',
              border: '1px solid #E5E7EB',
              padding: '24px'
            }}>
              <h2 style={{
                fontSize: '18px',
                fontWeight: 600,
                color: '#111827',
                margin: 0,
                marginBottom: '20px'
              }}>
                Montant
              </h2>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '16px', fontWeight: 600, color: '#111827' }}>
                  Total TTC
                </span>
                <span style={{ fontSize: '24px', fontWeight: 700, color: '#111827' }}>
                  {formatCurrency(intervention.amountCents)}
                </span>
              </div>
            </div>
          )}
        </div>
        
        {/* Colonne droite */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Signatures / Accords */}
          <div style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '12px',
            border: '1px solid #E5E7EB',
            padding: '24px'
          }}>
            <h2 style={{
              fontSize: '18px',
              fontWeight: 600,
              color: '#111827',
              margin: 0,
              marginBottom: '20px'
            }}>
              Validation
            </h2>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '12px',
                backgroundColor: intervention.agreementAt ? '#F0FDF4' : '#F9FAFB',
                borderRadius: '8px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    backgroundColor: intervention.agreementAt ? '#16A34A' : '#E5E7EB',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#FFFFFF'
                  }}>
                    {intervention.agreementAt ? <CheckCircle size={20} /> : <Clock size={20} />}
                  </div>
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: 500, color: '#111827' }}>
                      Accord client
                    </div>
                    {intervention.agreementAt && (
                      <div style={{ fontSize: '12px', color: '#6B7280' }}>
                        {new Date(intervention.agreementAt).toLocaleDateString('fr-FR')} à{' '}
                        {new Date(intervention.agreementAt).toLocaleTimeString('fr-FR', { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </div>
                    )}
                  </div>
                </div>
                <Badge variant={intervention.agreementAt ? 'success' : 'neutral'}>
                  {intervention.agreementAt ? 'Validé' : 'En attente'}
                </Badge>
              </div>
              
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '12px',
                backgroundColor: intervention.closedAt ? '#F0FDF4' : '#F9FAFB',
                borderRadius: '8px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    backgroundColor: intervention.closedAt ? '#16A34A' : '#E5E7EB',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#FFFFFF'
                  }}>
                    {intervention.closedAt ? <CheckCircle size={20} /> : <Clock size={20} />}
                  </div>
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: 500, color: '#111827' }}>
                      Clôture atelier
                    </div>
                    {intervention.closedAt && (
                      <div style={{ fontSize: '12px', color: '#6B7280' }}>
                        {new Date(intervention.closedAt).toLocaleDateString('fr-FR')} à{' '}
                        {new Date(intervention.closedAt).toLocaleTimeString('fr-FR', { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </div>
                    )}
                  </div>
                </div>
                <Badge variant={intervention.closedAt ? 'success' : 'neutral'}>
                  {intervention.closedAt ? 'Clôturée' : 'En attente'}
                </Badge>
              </div>
            </div>
          </div>
          
          {/* Photos */}
          <div style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '12px',
            border: '1px solid #E5E7EB',
            padding: '24px'
          }}>
            <h2 style={{
              fontSize: '18px',
              fontWeight: 600,
              color: '#111827',
              margin: 0,
              marginBottom: '20px'
            }}>
              Photos
            </h2>
            
            <div style={{
              textAlign: 'center',
              padding: '32px 24px',
              backgroundColor: '#F9FAFB',
              borderRadius: '8px',
              border: '2px dashed #E5E7EB'
            }}>
              <ImageIcon size={32} style={{ color: '#9CA3AF', marginBottom: '12px' }} />
              <p style={{ fontSize: '14px', color: '#6B7280', margin: 0 }}>
                Aucune photo pour le moment
              </p>
              <p style={{ fontSize: '12px', color: '#9CA3AF', margin: '8px 0 0 0' }}>
                Fonctionnalité disponible prochainement
              </p>
            </div>
          </div>
          
          {/* Timeline */}
          <div style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '12px',
            border: '1px solid #E5E7EB',
            padding: '24px'
          }}>
            <h2 style={{
              fontSize: '18px',
              fontWeight: 600,
              color: '#111827',
              margin: 0,
              marginBottom: '20px'
            }}>
              Historique
            </h2>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
              {timeline.map((event, index) => (
                <div
                  key={event.id}
                  style={{
                    paddingLeft: '24px',
                    borderLeft: index === timeline.length - 1 ? 'none' : '2px solid #E5E7EB',
                    position: 'relative',
                    paddingBottom: index === timeline.length - 1 ? 0 : '16px'
                  }}
                >
                  <div style={{
                    position: 'absolute',
                    left: '-9px',
                    top: '6px',
                    width: '18px',
                    height: '18px',
                    borderRadius: '50%',
                    backgroundColor: '#FFFFFF',
                    border: '2px solid #E5E7EB',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    {getTimelineIcon(event.type)}
                  </div>
                  
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: 500, color: '#111827', marginBottom: '4px' }}>
                      {event.title}
                    </div>
                    {event.description && (
                      <p style={{ fontSize: '13px', color: '#6B7280', margin: '0 0 8px 0' }}>
                        {event.description}
                      </p>
                    )}
                    <div style={{ fontSize: '12px', color: '#9CA3AF' }}>
                      {event.user} • {new Date(event.timestamp).toLocaleDateString('fr-FR')} à{' '}
                      {new Date(event.timestamp).toLocaleTimeString('fr-FR', { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      
      {/* Modal changement statut */}
      <Modal
        isOpen={isStatusModalOpen}
        onClose={() => setIsStatusModalOpen(false)}
        title="Changer le statut"
        size="md"
      >
        <div style={{ padding: '24px' }}>
          <p style={{
            fontSize: '15px',
            color: '#6B7280',
            lineHeight: 1.6,
            marginBottom: '20px'
          }}>
            Intervention : <strong>{intervention.number || `#${String(intervention.id).slice(0, 8)}`}</strong>
          </p>
          
          <Select
            label="Nouveau statut"
            value={newStatus}
            onChange={(e) => setNewStatus(e.target.value as InterventionStatus)}
            options={getAvailableStatuses(intervention.status).map(s => ({
              value: s,
              label: getStatusLabel(s)
            }))}
          />
          
          <div style={{ marginTop: '16px' }}>
            <Textarea
              label="Commentaire (optionnel)"
              name="statusComment"
              placeholder="Raison du changement de statut..."
              value={statusComment}
              onChange={(e) => setStatusComment(e.target.value)}
              rows={3}
            />
          </div>
          
          <div style={{
            display: 'flex',
            gap: '12px',
            justifyContent: 'flex-end',
            marginTop: '24px',
            paddingTop: '20px',
            borderTop: '1px solid #E5E7EB'
          }}>
            <Button
              variant="secondary"
              onClick={() => setIsStatusModalOpen(false)}
              disabled={isChangingStatus}
            >
              Annuler
            </Button>
            <Button
              variant="primary"
              onClick={handleStatusChange}
              loading={isChangingStatus}
              disabled={isChangingStatus}
            >
              Changer
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
