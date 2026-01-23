'use client'

import React, { useState, useEffect } from 'react'
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

type InterventionStatus = 'EN_ATTENTE' | 'EN_COURS' | 'TERMINE' | 'ANNULE'

interface Intervention {
  id: string
  number: string
  clientId: string
  clientName: string
  clientEmail: string
  clientPhone: string
  vehicleId: string
  vehicleInfo: string
  vehicleRegistration: string
  entryDate: Date
  exitDate?: Date
  status: InterventionStatus
  description: string
  diagnosticNotes?: string
  mileage: number
  laborCost?: number
  partsCost?: number
  totalAmount?: number
  isClientSigned: boolean
  isGarageSigned: boolean
  clientSignedAt?: Date
  garageSignedAt?: Date
  createdAt: Date
  updatedAt: Date
  createdBy?: string
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
  const [newStatus, setNewStatus] = useState<InterventionStatus>('EN_ATTENTE')
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
        
        // Mapper depuis l'API vers notre interface
        const mappedIntervention: Intervention = {
          id: itv.id,
          number: itv.number || `INT-${String(itv.id).slice(0, 8)}`,
          clientId: itv.vehicle?.client?.id?.toString() || '',
          clientName: itv.vehicle?.client 
            ? `${itv.vehicle.client.firstName} ${itv.vehicle.client.lastName}`
            : 'Client inconnu',
          clientEmail: itv.vehicle?.client?.email || '',
          clientPhone: itv.vehicle?.client?.phone || '',
          vehicleId: itv.vehicleId || '',
          vehicleInfo: itv.vehicle ? `${itv.vehicle.brand} ${itv.vehicle.model}` : 'Véhicule inconnu',
          vehicleRegistration: itv.vehicle?.plate || '',
          entryDate: new Date(itv.performedAt || itv.createdAt),
          exitDate: itv.closedAt ? new Date(itv.closedAt) : undefined,
          status: mapApiStatusToLocal(itv.status),
          description: itv.title || itv.type || 'Intervention',
          diagnosticNotes: itv.notes,
          mileage: itv.odometerKm || 0,
          laborCost: undefined,
          partsCost: undefined,
          totalAmount: itv.amountCents ? itv.amountCents / 100 : undefined,
          isClientSigned: !!itv.agreementAt,
          isGarageSigned: !!itv.closedAt,
          clientSignedAt: itv.agreementAt ? new Date(itv.agreementAt) : undefined,
          garageSignedAt: itv.closedAt ? new Date(itv.closedAt) : undefined,
          createdAt: new Date(itv.createdAt),
          updatedAt: new Date(itv.updatedAt),
          createdBy: itv.createdBy
        }
        
        setIntervention(mappedIntervention)
        
        // Générer timeline depuis l'intervention
        const mockTimeline: TimelineEvent[] = [
          {
            id: '1',
            type: 'status_change',
            title: 'Intervention créée',
            description: `Statut initial : ${getStatusLabel('EN_ATTENTE')}`,
            user: mappedIntervention.createdBy || 'Système',
            timestamp: new Date(mappedIntervention.createdAt)
          }
        ]
        
        if (mappedIntervention.status !== 'EN_ATTENTE') {
          mockTimeline.push({
            id: '2',
            type: 'status_change',
            title: 'Intervention démarrée',
            description: `Statut changé en ${getStatusLabel('EN_COURS')}`,
            user: 'Atelier',
            timestamp: new Date(mappedIntervention.updatedAt)
          })
        }
        
        if (mappedIntervention.isClientSigned) {
          mockTimeline.push({
            id: '3',
            type: 'signature',
            title: 'Signature client',
            description: 'Le client a signé le bon de commande',
            user: mappedIntervention.clientName,
            timestamp: mappedIntervention.clientSignedAt || new Date()
          })
        }
        
        if (mappedIntervention.isGarageSigned) {
          mockTimeline.push({
            id: '4',
            type: 'signature',
            title: 'Signature atelier',
            description: "L'atelier a validé les travaux",
            user: 'Atelier',
            timestamp: mappedIntervention.garageSignedAt || new Date()
          })
        }
        
        if (mappedIntervention.status === 'TERMINE') {
          mockTimeline.push({
            id: '5',
            type: 'status_change',
            title: 'Intervention terminée',
            description: 'Les travaux sont terminés',
            user: 'Atelier',
            timestamp: new Date(mappedIntervention.updatedAt)
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
        clientId: '1',
        clientName: 'Jean Dupont',
        clientEmail: 'jean.dupont@email.fr',
        clientPhone: '06 12 34 56 78',
        vehicleId: '1',
        vehicleInfo: 'Peugeot 208 Active',
        vehicleRegistration: 'AB-123-CD',
        entryDate: new Date('2024-01-15'),
        status: 'EN_COURS',
        description: 'Révision 20 000 km + changement plaquettes de frein avant',
        diagnosticNotes: 'RAS au diagnostic. Plaquettes avant à 2mm.',
        mileage: 45000,
        laborCost: 150.00,
        partsCost: 120.00,
        totalAmount: 270.00,
        isClientSigned: true,
        isGarageSigned: false,
        clientSignedAt: new Date('2024-01-15T14:30:00'),
        createdAt: new Date('2024-01-15T10:00:00'),
        updatedAt: new Date('2024-01-15T10:00:00'),
        createdBy: 'Pierre Martin'
      })
      
      setTimeline([
        {
          id: '1',
          type: 'status_change',
          title: 'Intervention créée',
          description: 'Statut initial : En attente',
          user: 'Pierre Martin',
          timestamp: new Date('2024-01-15T10:00:00')
        },
        {
          id: '2',
          type: 'status_change',
          title: 'Intervention démarrée',
          description: 'Statut changé en En cours',
          user: 'Atelier',
          timestamp: new Date('2024-01-15T10:30:00')
        },
        {
          id: '3',
          type: 'signature',
          title: 'Signature client',
          description: 'Le client a signé le bon de commande',
          user: 'Jean Dupont',
          timestamp: new Date('2024-01-15T14:30:00')
        }
      ])
      
    } finally {
      setIsLoading(false)
    }
  }
  
  const mapApiStatusToLocal = (apiStatus: string): InterventionStatus => {
    const mapping: Record<string, InterventionStatus> = {
      'DRAFT': 'EN_ATTENTE',
      'OPEN': 'EN_COURS',
      'DONE': 'TERMINE',
      'CANCELED': 'ANNULE'
    }
    return mapping[apiStatus] || 'EN_ATTENTE'
  }
  
  const mapLocalStatusToApi = (localStatus: InterventionStatus): string => {
    const mapping: Record<InterventionStatus, string> = {
      'EN_ATTENTE': 'DRAFT',
      'EN_COURS': 'OPEN',
      'TERMINE': 'DONE',
      'ANNULE': 'CANCELED'
    }
    return mapping[localStatus]
  }
  
  const getStatusLabel = (status: InterventionStatus): string => {
    const labels: Record<InterventionStatus, string> = {
      EN_ATTENTE: 'En attente',
      EN_COURS: 'En cours',
      TERMINE: 'Terminée',
      ANNULE: 'Annulée'
    }
    return labels[status]
  }
  
  const getStatusBadgeVariant = (status: InterventionStatus) => {
    const variants: Record<InterventionStatus, string> = {
      EN_ATTENTE: 'warning',
      EN_COURS: 'info',
      TERMINE: 'success',
      ANNULE: 'error'
    }
    return variants[status] as 'warning' | 'info' | 'success' | 'error'
  }
  
  const getStatusIcon = (status: InterventionStatus): React.ReactNode => {
    switch (status) {
      case 'EN_ATTENTE': return <Clock size={20} />
      case 'EN_COURS': return <PlayCircle size={20} />
      case 'TERMINE': return <CheckCircle size={20} />
      case 'ANNULE': return <XCircle size={20} />
      default: return <Clock size={20} />
    }
  }
  
  const getAvailableStatuses = (currentStatus: InterventionStatus): InterventionStatus[] => {
    switch (currentStatus) {
      case 'EN_ATTENTE':
        return ['EN_ATTENTE', 'EN_COURS', 'ANNULE']
      case 'EN_COURS':
        return ['EN_COURS', 'TERMINE', 'ANNULE']
      case 'TERMINE':
        return ['TERMINE']
      case 'ANNULE':
        return ['ANNULE']
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
      case 'EN_ATTENTE': return 'EN_COURS'
      case 'EN_COURS': return 'TERMINE'
      case 'TERMINE': return 'TERMINE'
      case 'ANNULE': return 'ANNULE'
      default: return 'EN_ATTENTE'
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
          status: mapLocalStatusToApi(newStatus),
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
  
  const formatCurrency = (amount?: number): string => {
    if (!amount) return '-'
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount)
  }
  
  const getTimelineIcon = (type: TimelineEvent['type']): React.ReactNode => {
    switch (type) {
      case 'status_change': return <PlayCircle size={16} style={{ color: '#3B82F6' }} />
      case 'signature': return <FileSignature size={16} style={{ color: '#16A34A' }} />
      case 'document': return <FileText size={16} style={{ color: '#F59E0B' }} />
      case 'note': return <FileText size={16} style={{ color: '#6B7280' }} />
      default: return <FileText size={16} style={{ color: '#6B7280' }} />
    }
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
  
  const canChangeStatus = intervention.status !== 'TERMINE' && intervention.status !== 'ANNULE'
  
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
              {intervention.number}
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
            {intervention.status === 'TERMINE' && (
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
                  Date d'entrée
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Calendar size={16} style={{ color: '#9CA3AF' }} />
                  <span style={{ fontSize: '14px', color: '#111827' }}>
                    {new Date(intervention.entryDate).toLocaleDateString('fr-FR')}
                  </span>
                </div>
              </div>
              
              {intervention.exitDate && (
                <div>
                  <div style={{ fontSize: '12px', fontWeight: 500, color: '#6B7280', marginBottom: '6px' }}>
                    Date de sortie
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Calendar size={16} style={{ color: '#9CA3AF' }} />
                    <span style={{ fontSize: '14px', color: '#111827' }}>
                      {new Date(intervention.exitDate).toLocaleDateString('fr-FR')}
                    </span>
                  </div>
                </div>
              )}
              
              <div>
                <div style={{ fontSize: '12px', fontWeight: 500, color: '#6B7280', marginBottom: '6px' }}>
                  Kilométrage
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Gauge size={16} style={{ color: '#9CA3AF' }} />
                  <span style={{ fontSize: '14px', color: '#111827' }}>
                    {intervention.mileage.toLocaleString('fr-FR')} km
                  </span>
                </div>
              </div>
              
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
                  {intervention.description}
                </p>
              </div>
              
              {intervention.diagnosticNotes && (
                <div>
                  <div style={{ fontSize: '12px', fontWeight: 500, color: '#6B7280', marginBottom: '6px' }}>
                    Notes de diagnostic
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
                    {intervention.diagnosticNotes}
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
                    onClick={() => router.push(`/clients/${intervention.clientId}`)}
                  >
                    {intervention.clientName}
                  </span>
                </div>
              </div>
              
              {intervention.clientEmail && (
                <div>
                  <div style={{ fontSize: '12px', fontWeight: 500, color: '#6B7280', marginBottom: '6px' }}>
                    Email
                  </div>
                  <div style={{ fontSize: '14px', color: '#111827' }}>
                    {intervention.clientEmail}
                  </div>
                </div>
              )}
              
              {intervention.clientPhone && (
                <div>
                  <div style={{ fontSize: '12px', fontWeight: 500, color: '#6B7280', marginBottom: '6px' }}>
                    Téléphone
                  </div>
                  <div style={{ fontSize: '14px', color: '#111827' }}>
                    {intervention.clientPhone}
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
              <Avatar name={intervention.vehicleInfo} size="md" shape="square" />
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
                  {intervention.vehicleInfo}
                </div>
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
                  {intervention.vehicleRegistration}
                </div>
              </div>
            </div>
          </div>
          
          {/* Montants */}
          {(intervention.laborCost || intervention.partsCost || intervention.totalAmount) && (
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
                Montants
              </h2>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {intervention.laborCost && (
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '14px', color: '#6B7280' }}>Main d'œuvre</span>
                    <span style={{ fontSize: '14px', fontWeight: 500, color: '#111827' }}>
                      {formatCurrency(intervention.laborCost)}
                    </span>
                  </div>
                )}
                
                {intervention.partsCost && (
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '14px', color: '#6B7280' }}>Pièces</span>
                    <span style={{ fontSize: '14px', fontWeight: 500, color: '#111827' }}>
                      {formatCurrency(intervention.partsCost)}
                    </span>
                  </div>
                )}
                
                {intervention.totalAmount && (
                  <>
                    <div style={{ borderTop: '1px solid #E5E7EB', marginTop: '8px', paddingTop: '12px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: '16px', fontWeight: 600, color: '#111827' }}>
                          Total TTC
                        </span>
                        <span style={{ fontSize: '20px', fontWeight: 700, color: '#111827' }}>
                          {formatCurrency(intervention.totalAmount)}
                        </span>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
        
        {/* Colonne droite */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Signatures */}
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
              Signatures
            </h2>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '12px',
                backgroundColor: intervention.isClientSigned ? '#F0FDF4' : '#F9FAFB',
                borderRadius: '8px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    backgroundColor: intervention.isClientSigned ? '#16A34A' : '#E5E7EB',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#FFFFFF'
                  }}>
                    {intervention.isClientSigned ? <CheckCircle size={20} /> : <Clock size={20} />}
                  </div>
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: 500, color: '#111827' }}>
                      Signature client
                    </div>
                    {intervention.clientSignedAt && (
                      <div style={{ fontSize: '12px', color: '#6B7280' }}>
                        {new Date(intervention.clientSignedAt).toLocaleDateString('fr-FR')} à{' '}
                        {new Date(intervention.clientSignedAt).toLocaleTimeString('fr-FR', { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </div>
                    )}
                  </div>
                </div>
                <Badge variant={intervention.isClientSigned ? 'success' : 'neutral'}>
                  {intervention.isClientSigned ? 'Signée' : 'En attente'}
                </Badge>
              </div>
              
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '12px',
                backgroundColor: intervention.isGarageSigned ? '#F0FDF4' : '#F9FAFB',
                borderRadius: '8px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    backgroundColor: intervention.isGarageSigned ? '#16A34A' : '#E5E7EB',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#FFFFFF'
                  }}>
                    {intervention.isGarageSigned ? <CheckCircle size={20} /> : <Clock size={20} />}
                  </div>
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: 500, color: '#111827' }}>
                      Signature atelier
                    </div>
                    {intervention.garageSignedAt && (
                      <div style={{ fontSize: '12px', color: '#6B7280' }}>
                        {new Date(intervention.garageSignedAt).toLocaleDateString('fr-FR')} à{' '}
                        {new Date(intervention.garageSignedAt).toLocaleTimeString('fr-FR', { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </div>
                    )}
                  </div>
                </div>
                <Badge variant={intervention.isGarageSigned ? 'success' : 'neutral'}>
                  {intervention.isGarageSigned ? 'Signée' : 'En attente'}
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
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {timeline.map((event, index) => (
                <div
                  key={event.id}
                  style={{
                    paddingLeft: '20px',
                    borderLeft: index === timeline.length - 1 ? 'none' : '2px solid #E5E7EB',
                    position: 'relative',
                    paddingBottom: index === timeline.length - 1 ? 0 : '16px'
                  }}
                >
                  <div style={{
                    position: 'absolute',
                    left: '-9px',
                    top: '6px',
                    width: '16px',
                    height: '16px',
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
            Intervention : <strong>{intervention.number}</strong>
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
