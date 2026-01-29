'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { 
  ArrowLeft,
  Edit,
  Mail,
  Phone,
  MapPin,
  Car,
  Wrench,
  Euro,
  Calendar,
  User,
  X,
  RefreshCw,
  AlertCircle,
  ChevronRight,
  Hash,
  Fuel,
  Gauge,
  FileText,
  CheckCircle,
  Clock,
  Plus,
  Trash2
} from 'lucide-react'

// ============================================================================
// CLIENT DETAIL PAGE - SafeMotor
// Design moderne avec données réelles
// ============================================================================

interface Client {
  id: string
  firstName: string
  lastName: string
  name?: string
  email: string
  phone: string
  address: string
  postalCode: string
  city: string
  status: 'ACTIVE' | 'INACTIVE'
  vehicleCount: number
  interventionCount: number
  totalRevenue: number
  createdAt: Date
  updatedAt: Date
}

interface Vehicle {
  id: string
  registrationNumber: string
  make: string
  model: string
  year: number
  fuelType: string
  mileage: number
  interventionCount: number
}

interface Intervention {
  id: string
  number: string
  vehicleInfo?: string
  vehicle?: { make: string; model: string; registrationNumber: string }
  entryDate: Date
  status: string
  description: string
  amount?: number
  totalAmount?: number
}

const FUEL_TYPES: Record<string, { label: string; color: string; bg: string }> = {
  'ESSENCE': { label: 'Essence', color: '#EF4444', bg: '#FEE2E2' },
  'DIESEL': { label: 'Diesel', color: '#1D4ED8', bg: '#DBEAFE' },
  'ELECTRIC': { label: 'Électrique', color: '#6366F1', bg: '#E0E7FF' },
  'HYBRID': { label: 'Hybride', color: '#10B981', bg: '#D1FAE5' },
  'GPL': { label: 'GPL', color: '#F59E0B', bg: '#FEF3C7' },
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: any }> = {
  'EN_ATTENTE': { label: 'En attente', color: '#F59E0B', bg: '#FEF3C7', icon: Clock },
  'EN_COURS': { label: 'En cours', color: '#3B82F6', bg: '#DBEAFE', icon: Wrench },
  'TERMINE': { label: 'Terminé', color: '#10B981', bg: '#D1FAE5', icon: CheckCircle },
  'ANNULE': { label: 'Annulé', color: '#EF4444', bg: '#FEE2E2', icon: X },
}

export default function ClientDetailPage() {
  const router = useRouter()
  const params = useParams()
  const clientId = params.id as string
  
  const [client, setClient] = useState<Client | null>(null)
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [interventions, setInterventions] = useState<Intervention[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'info' | 'vehicles' | 'interventions'>('info')
  
  // Edit modal
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    postalCode: '',
    city: ''
  })
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  const [isSaving, setIsSaving] = useState(false)
  
  // Delete modal
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const loadClientData = async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      const clientResponse = await fetch(`/api/clients/${clientId}`)
      const clientData = await clientResponse.json()
      
      if (clientData.ok && clientData.data) {
        setClient(clientData.data)
      } else {
        setError('Client introuvable')
        return
      }
      
      const vehiclesResponse = await fetch(`/api/vehicules?clientId=${clientId}`)
      const vehiclesData = await vehiclesResponse.json()
      
      if (vehiclesData.ok && vehiclesData.data) {
        setVehicles(vehiclesData.data.items || [])
      }
      
      const interventionsResponse = await fetch(`/api/interventions?clientId=${clientId}`)
      const interventionsData = await interventionsResponse.json()
      
      if (interventionsData.ok && interventionsData.data) {
        setInterventions(interventionsData.data.items || [])
      }
    } catch (err) {
      console.error('Error loading client:', err)
      setError('Impossible de charger les données')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadClientData()
  }, [clientId])

  const handleEdit = () => {
    if (!client) return
    
    let firstName = client.firstName || ''
    let lastName = client.lastName || ''
    if (!firstName && !lastName && client.name) {
      const parts = client.name.split(' ')
      firstName = parts[0] || ''
      lastName = parts.slice(1).join(' ') || ''
    }
    
    setFormData({
      firstName,
      lastName,
      email: client.email || '',
      phone: client.phone || '',
      address: client.address || '',
      postalCode: client.postalCode || '',
      city: client.city || ''
    })
    setFormErrors({})
    setEditModalOpen(true)
  }

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {}
    if (!formData.firstName.trim()) errors.firstName = 'Le prénom est requis'
    if (!formData.lastName.trim()) errors.lastName = 'Le nom est requis'
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = "Format d'email invalide"
    }
    if (formData.postalCode && !/^\d{5}$/.test(formData.postalCode)) {
      errors.postalCode = 'Code postal invalide'
    }
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSave = async () => {
    if (!validateForm() || !client) return
    setIsSaving(true)
    
    try {
      const response = await fetch(`/api/clients/${client.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: `${formData.firstName} ${formData.lastName}`.trim(),
          email: formData.email || undefined,
          phone: formData.phone || undefined,
          address: formData.address || undefined,
        })
      })
      
      const data = await response.json()
      
      if (data.ok) {
        setEditModalOpen(false)
        loadClientData()
      } else {
        setFormErrors({ firstName: data.error || 'Erreur de sauvegarde' })
      }
    } catch (err) {
      console.error('Error saving client:', err)
      setFormErrors({ firstName: 'Erreur de connexion' })
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!client) return
    setIsDeleting(true)
    
    try {
      const response = await fetch(`/api/clients/${client.id}`, { method: 'DELETE' })
      const data = await response.json()
      
      if (data.ok) {
        router.push('/clients')
      } else {
        setError(data.error || 'Erreur de suppression')
        setDeleteModalOpen(false)
      }
    } catch (err) {
      console.error('Error deleting client:', err)
      setError('Erreur de connexion')
      setDeleteModalOpen(false)
    } finally {
      setIsDeleting(false)
    }
  }

  const formatCurrency = (amount?: number): string => {
    if (!amount) return '0 €'
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(amount)
  }

  const getClientName = () => {
    if (client?.firstName && client?.lastName) return `${client.firstName} ${client.lastName}`
    return client?.name || 'Client'
  }

  const getClientInitials = () => {
    const name = getClientName()
    const parts = name.split(' ')
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
    return name.substring(0, 2).toUpperCase()
  }

  if (isLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '400px' }}>
        <RefreshCw size={32} color="#6366F1" style={{ animation: 'spin 1s linear infinite' }} />
        <style dangerouslySetInnerHTML={{ __html: `@keyframes spin { to { transform: rotate(360deg); } }` }} />
      </div>
    )
  }

  if (error || !client) {
    return (
      <div style={{ padding: '32px', maxWidth: '600px', margin: '0 auto', textAlign: 'center' }}>
        <AlertCircle size={48} color="#EF4444" style={{ marginBottom: '16px' }} />
        <h2 style={{ fontSize: '20px', fontWeight: 600, color: '#111827', marginBottom: '8px' }}>{error || 'Client introuvable'}</h2>
        <p style={{ fontSize: '14px', color: '#6B7280', marginBottom: '24px' }}>Ce client n&apos;existe pas ou a été supprimé.</p>
        <button onClick={() => router.push('/clients')} style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '12px 24px', borderRadius: '10px', border: 'none', background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)', color: '#fff', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}>
          <ArrowLeft size={18} /> Retour aux clients
        </button>
      </div>
    )
  }

  return (
    <div style={{ padding: '32px', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Back */}
      <button onClick={() => router.push('/clients')} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px', padding: '10px 16px', borderRadius: '10px', border: '1px solid #E5E7EB', background: '#fff', fontSize: '14px', fontWeight: 500, color: '#374151', cursor: 'pointer' }}>
        <ArrowLeft size={18} /> Retour aux clients
      </button>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px', flexWrap: 'wrap', gap: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{ width: '80px', height: '80px', borderRadius: '20px', background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px', fontWeight: 700, color: '#fff' }}>{getClientInitials()}</div>
          <div>
            <h1 style={{ fontSize: '28px', fontWeight: 700, color: '#111827', margin: 0, marginBottom: '8px' }}>{getClientName()}</h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 12px', borderRadius: '100px', fontSize: '13px', fontWeight: 600, background: client.status === 'ACTIVE' ? '#D1FAE5' : '#F3F4F6', color: client.status === 'ACTIVE' ? '#10B981' : '#6B7280' }}>
                <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: client.status === 'ACTIVE' ? '#10B981' : '#9CA3AF' }} />
                {client.status === 'ACTIVE' ? 'Actif' : 'Inactif'}
              </span>
              <span style={{ fontSize: '14px', color: '#6B7280' }}>Client depuis {new Date(client.createdAt).toLocaleDateString('fr-FR')}</span>
            </div>
          </div>
        </div>
        
        <div style={{ display: 'flex', gap: '12px' }}>
          <button onClick={() => setDeleteModalOpen(true)} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 20px', borderRadius: '12px', border: '1px solid #FECACA', background: '#FEF2F2', fontSize: '14px', fontWeight: 600, color: '#EF4444', cursor: 'pointer' }}>
            <Trash2 size={18} /> Supprimer
          </button>
          <button onClick={handleEdit} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 20px', borderRadius: '12px', border: 'none', background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)', fontSize: '14px', fontWeight: 600, color: '#fff', cursor: 'pointer', boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)' }}>
            <Edit size={18} /> Modifier
          </button>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '32px' }}>
        <div style={{ padding: '24px', borderRadius: '16px', background: '#fff', border: '1px solid #E5E7EB' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ width: '52px', height: '52px', borderRadius: '14px', background: '#EEF2FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Car size={26} color="#6366F1" /></div>
            <div><p style={{ fontSize: '14px', color: '#6B7280', margin: 0, marginBottom: '4px' }}>Véhicules</p><p style={{ fontSize: '32px', fontWeight: 700, color: '#111827', margin: 0 }}>{vehicles.length}</p></div>
          </div>
        </div>
        <div style={{ padding: '24px', borderRadius: '16px', background: '#fff', border: '1px solid #E5E7EB' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ width: '52px', height: '52px', borderRadius: '14px', background: '#FEF3C7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Wrench size={26} color="#F59E0B" /></div>
            <div><p style={{ fontSize: '14px', color: '#6B7280', margin: 0, marginBottom: '4px' }}>Interventions</p><p style={{ fontSize: '32px', fontWeight: 700, color: '#111827', margin: 0 }}>{interventions.length}</p></div>
          </div>
        </div>
        <div style={{ padding: '24px', borderRadius: '16px', background: '#fff', border: '1px solid #E5E7EB' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ width: '52px', height: '52px', borderRadius: '14px', background: '#D1FAE5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Euro size={26} color="#10B981" /></div>
            <div><p style={{ fontSize: '14px', color: '#6B7280', margin: 0, marginBottom: '4px' }}>Chiffre d&apos;affaires</p><p style={{ fontSize: '32px', fontWeight: 700, color: '#10B981', margin: 0 }}>{formatCurrency(client.totalRevenue || interventions.reduce((sum, i) => sum + (i.totalAmount || i.amount || 0), 0))}</p></div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '4px', background: '#F3F4F6', padding: '4px', borderRadius: '12px', marginBottom: '24px', width: 'fit-content' }}>
        {[{ id: 'info', label: 'Informations', icon: User }, { id: 'vehicles', label: `Véhicules (${vehicles.length})`, icon: Car }, { id: 'interventions', label: `Interventions (${interventions.length})`, icon: Wrench }].map((tab) => {
          const Icon = tab.icon
          return <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 20px', borderRadius: '10px', border: 'none', background: activeTab === tab.id ? 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)' : 'transparent', color: activeTab === tab.id ? '#fff' : '#6B7280', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}><Icon size={18} />{tab.label}</button>
        })}
      </div>

      {/* Content */}
      <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid #E5E7EB', overflow: 'hidden' }}>
        {activeTab === 'info' && (
          <div style={{ padding: '24px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
              <div><p style={{ fontSize: '13px', fontWeight: 500, color: '#6B7280', marginBottom: '8px' }}>Email</p><div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '16px', background: '#F9FAFB', borderRadius: '12px' }}><Mail size={20} color="#6366F1" /><span style={{ fontSize: '15px', color: '#111827' }}>{client.email || 'Non renseigné'}</span></div></div>
              <div><p style={{ fontSize: '13px', fontWeight: 500, color: '#6B7280', marginBottom: '8px' }}>Téléphone</p><div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '16px', background: '#F9FAFB', borderRadius: '12px' }}><Phone size={20} color="#6366F1" /><span style={{ fontSize: '15px', color: '#111827' }}>{client.phone || 'Non renseigné'}</span></div></div>
              <div style={{ gridColumn: 'span 2' }}><p style={{ fontSize: '13px', fontWeight: 500, color: '#6B7280', marginBottom: '8px' }}>Adresse</p><div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '16px', background: '#F9FAFB', borderRadius: '12px' }}><MapPin size={20} color="#6366F1" /><span style={{ fontSize: '15px', color: '#111827' }}>{client.address ? `${client.address}, ${client.postalCode || ''} ${client.city || ''}`.trim() : 'Non renseignée'}</span></div></div>
              <div><p style={{ fontSize: '13px', fontWeight: 500, color: '#6B7280', marginBottom: '8px' }}>Client depuis</p><div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '16px', background: '#F9FAFB', borderRadius: '12px' }}><Calendar size={20} color="#6366F1" /><span style={{ fontSize: '15px', color: '#111827' }}>{new Date(client.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</span></div></div>
              <div><p style={{ fontSize: '13px', fontWeight: 500, color: '#6B7280', marginBottom: '8px' }}>Dernière mise à jour</p><div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '16px', background: '#F9FAFB', borderRadius: '12px' }}><RefreshCw size={20} color="#6366F1" /><span style={{ fontSize: '15px', color: '#111827' }}>{new Date(client.updatedAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</span></div></div>
            </div>
          </div>
        )}

        {activeTab === 'vehicles' && (
          <div>
            {vehicles.length === 0 ? (
              <div style={{ padding: '48px', textAlign: 'center' }}>
                <Car size={48} color="#D1D5DB" style={{ marginBottom: '16px' }} />
                <p style={{ fontSize: '16px', fontWeight: 600, color: '#111827', margin: 0, marginBottom: '8px' }}>Aucun véhicule</p>
                <p style={{ fontSize: '14px', color: '#6B7280', margin: 0, marginBottom: '20px' }}>Ce client n&apos;a pas encore de véhicule</p>
                <button onClick={() => router.push('/vehicules')} style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '12px 20px', borderRadius: '10px', border: 'none', background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)', color: '#fff', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}><Plus size={18} /> Ajouter un véhicule</button>
              </div>
            ) : vehicles.map((vehicle, index) => (
              <div key={vehicle.id} style={{ display: 'flex', alignItems: 'center', padding: '16px 24px', borderBottom: index < vehicles.length - 1 ? '1px solid #F3F4F6' : 'none', cursor: 'pointer' }} onClick={() => router.push(`/vehicules/${vehicle.id}`)} onMouseEnter={(e) => e.currentTarget.style.background = '#F9FAFB'} onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
                <div style={{ width: '52px', height: '52px', borderRadius: '14px', background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: '16px' }}><Car size={26} color="#fff" /></div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                    <span style={{ fontSize: '16px', fontWeight: 600, color: '#111827' }}>{vehicle.make} {vehicle.model}</span>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '4px 10px', borderRadius: '100px', fontSize: '12px', fontWeight: 600, background: FUEL_TYPES[vehicle.fuelType]?.bg || '#F3F4F6', color: FUEL_TYPES[vehicle.fuelType]?.color || '#6B7280' }}><Fuel size={12} />{FUEL_TYPES[vehicle.fuelType]?.label || vehicle.fuelType}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px', fontWeight: 600, color: '#6366F1', background: '#EEF2FF', padding: '4px 10px', borderRadius: '6px' }}><Hash size={14} />{vehicle.registrationNumber}</span>
                    {vehicle.year && <span style={{ fontSize: '13px', color: '#6B7280' }}>{vehicle.year}</span>}
                    {vehicle.mileage > 0 && <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px', color: '#6B7280' }}><Gauge size={14} />{vehicle.mileage.toLocaleString()} km</span>}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', borderRadius: '8px', background: vehicle.interventionCount > 0 ? '#FEF3C7' : '#F3F4F6', marginRight: '12px' }}><FileText size={16} color={vehicle.interventionCount > 0 ? '#F59E0B' : '#9CA3AF'} /><span style={{ fontSize: '13px', fontWeight: 600, color: vehicle.interventionCount > 0 ? '#F59E0B' : '#9CA3AF' }}>{vehicle.interventionCount}</span></div>
                <ChevronRight size={18} color="#D1D5DB" />
              </div>
            ))}
          </div>
        )}

        {activeTab === 'interventions' && (
          <div>
            {interventions.length === 0 ? (
              <div style={{ padding: '48px', textAlign: 'center' }}>
                <Wrench size={48} color="#D1D5DB" style={{ marginBottom: '16px' }} />
                <p style={{ fontSize: '16px', fontWeight: 600, color: '#111827', margin: 0, marginBottom: '8px' }}>Aucune intervention</p>
                <p style={{ fontSize: '14px', color: '#6B7280', margin: 0 }}>Aucune intervention pour ce client</p>
              </div>
            ) : interventions.map((intervention, index) => {
              const statusConfig = STATUS_CONFIG[intervention.status] || STATUS_CONFIG['EN_ATTENTE']
              const StatusIcon = statusConfig.icon
              const vehicleDisplay = intervention.vehicleInfo || (intervention.vehicle ? `${intervention.vehicle.make} ${intervention.vehicle.model} - ${intervention.vehicle.registrationNumber}` : '')
              return (
                <div key={intervention.id} style={{ display: 'flex', alignItems: 'center', padding: '16px 24px', borderBottom: index < interventions.length - 1 ? '1px solid #F3F4F6' : 'none', cursor: 'pointer' }} onClick={() => router.push(`/interventions/${intervention.id}`)} onMouseEnter={(e) => e.currentTarget.style.background = '#F9FAFB'} onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
                  <div style={{ width: '52px', height: '52px', borderRadius: '14px', background: statusConfig.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: '16px' }}><StatusIcon size={26} color={statusConfig.color} /></div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                      <span style={{ fontSize: '15px', fontWeight: 600, color: '#6366F1', fontFamily: 'monospace' }}>{intervention.number}</span>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '4px 10px', borderRadius: '100px', fontSize: '12px', fontWeight: 600, background: statusConfig.bg, color: statusConfig.color }}><StatusIcon size={12} />{statusConfig.label}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                      {vehicleDisplay && <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px', color: '#6B7280' }}><Car size={14} />{vehicleDisplay}</span>}
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px', color: '#6B7280' }}><Calendar size={14} />{new Date(intervention.entryDate).toLocaleDateString('fr-FR')}</span>
                    </div>
                  </div>
                  <div style={{ fontSize: '16px', fontWeight: 700, color: intervention.totalAmount || intervention.amount ? '#111827' : '#9CA3AF', marginRight: '12px' }}>{formatCurrency(intervention.totalAmount || intervention.amount)}</div>
                  <ChevronRight size={18} color="#D1D5DB" />
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {editModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0, 0, 0, 0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '20px' }} onClick={() => setEditModalOpen(false)}>
          <div style={{ background: '#fff', borderRadius: '20px', width: '100%', maxWidth: '500px', maxHeight: '90vh', overflow: 'auto' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px', borderBottom: '1px solid #E5E7EB' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#111827', margin: 0 }}>Modifier le client</h2>
              <button onClick={() => setEditModalOpen(false)} style={{ padding: '8px', background: 'transparent', border: 'none', cursor: 'pointer' }}><X size={20} color="#6B7280" /></button>
            </div>
            <div style={{ padding: '24px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                <div><label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#374151', marginBottom: '6px' }}>Prénom *</label><input type="text" value={formData.firstName} onChange={(e) => setFormData({ ...formData, firstName: e.target.value })} style={{ width: '100%', padding: '12px 14px', borderRadius: '10px', border: formErrors.firstName ? '1px solid #EF4444' : '1px solid #E5E7EB', fontSize: '14px', outline: 'none' }} />{formErrors.firstName && <p style={{ fontSize: '12px', color: '#EF4444', margin: '4px 0 0' }}>{formErrors.firstName}</p>}</div>
                <div><label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#374151', marginBottom: '6px' }}>Nom *</label><input type="text" value={formData.lastName} onChange={(e) => setFormData({ ...formData, lastName: e.target.value })} style={{ width: '100%', padding: '12px 14px', borderRadius: '10px', border: formErrors.lastName ? '1px solid #EF4444' : '1px solid #E5E7EB', fontSize: '14px', outline: 'none' }} />{formErrors.lastName && <p style={{ fontSize: '12px', color: '#EF4444', margin: '4px 0 0' }}>{formErrors.lastName}</p>}</div>
              </div>
              <div style={{ marginBottom: '16px' }}><label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#374151', marginBottom: '6px' }}>Email</label><input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} style={{ width: '100%', padding: '12px 14px', borderRadius: '10px', border: formErrors.email ? '1px solid #EF4444' : '1px solid #E5E7EB', fontSize: '14px', outline: 'none' }} />{formErrors.email && <p style={{ fontSize: '12px', color: '#EF4444', margin: '4px 0 0' }}>{formErrors.email}</p>}</div>
              <div style={{ marginBottom: '16px' }}><label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#374151', marginBottom: '6px' }}>Téléphone</label><input type="tel" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} style={{ width: '100%', padding: '12px 14px', borderRadius: '10px', border: '1px solid #E5E7EB', fontSize: '14px', outline: 'none' }} /></div>
              <div style={{ marginBottom: '16px' }}><label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#374151', marginBottom: '6px' }}>Adresse</label><input type="text" value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} style={{ width: '100%', padding: '12px 14px', borderRadius: '10px', border: '1px solid #E5E7EB', fontSize: '14px', outline: 'none' }} /></div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '16px', marginBottom: '24px' }}>
                <div><label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#374151', marginBottom: '6px' }}>Code postal</label><input type="text" value={formData.postalCode} onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })} style={{ width: '100%', padding: '12px 14px', borderRadius: '10px', border: formErrors.postalCode ? '1px solid #EF4444' : '1px solid #E5E7EB', fontSize: '14px', outline: 'none' }} />{formErrors.postalCode && <p style={{ fontSize: '12px', color: '#EF4444', margin: '4px 0 0' }}>{formErrors.postalCode}</p>}</div>
                <div><label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#374151', marginBottom: '6px' }}>Ville</label><input type="text" value={formData.city} onChange={(e) => setFormData({ ...formData, city: e.target.value })} style={{ width: '100%', padding: '12px 14px', borderRadius: '10px', border: '1px solid #E5E7EB', fontSize: '14px', outline: 'none' }} /></div>
              </div>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button onClick={() => setEditModalOpen(false)} disabled={isSaving} style={{ padding: '12px 20px', borderRadius: '10px', border: '1px solid #E5E7EB', background: '#fff', fontSize: '14px', fontWeight: 600, color: '#374151', cursor: 'pointer' }}>Annuler</button>
                <button onClick={handleSave} disabled={isSaving} style={{ padding: '12px 24px', borderRadius: '10px', border: 'none', background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)', fontSize: '14px', fontWeight: 600, color: '#fff', cursor: isSaving ? 'wait' : 'pointer', opacity: isSaving ? 0.7 : 1 }}>{isSaving ? 'Enregistrement...' : 'Enregistrer'}</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {deleteModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0, 0, 0, 0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '20px' }} onClick={() => setDeleteModalOpen(false)}>
          <div style={{ background: '#fff', borderRadius: '20px', width: '100%', maxWidth: '400px', padding: '24px' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ width: '56px', height: '56px', borderRadius: '14px', background: '#FEF2F2', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px' }}><Trash2 size={28} color="#EF4444" /></div>
            <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#111827', margin: 0, marginBottom: '8px' }}>Supprimer le client</h3>
            <p style={{ fontSize: '14px', color: '#6B7280', margin: 0, lineHeight: 1.6 }}>Êtes-vous sûr de vouloir supprimer <strong style={{ color: '#111827' }}>{getClientName()}</strong> ?</p>
            {(vehicles.length > 0 || interventions.length > 0) && <p style={{ fontSize: '13px', color: '#DC2626', margin: '16px 0 0', padding: '10px 12px', background: '#FEF2F2', borderRadius: '8px' }}>⚠️ Ce client a {vehicles.length} véhicule(s) et {interventions.length} intervention(s)</p>}
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px' }}>
              <button onClick={() => setDeleteModalOpen(false)} disabled={isDeleting} style={{ padding: '12px 20px', borderRadius: '10px', border: '1px solid #E5E7EB', background: '#fff', fontSize: '14px', fontWeight: 600, color: '#374151', cursor: 'pointer' }}>Annuler</button>
              <button onClick={handleDelete} disabled={isDeleting} style={{ padding: '12px 24px', borderRadius: '10px', border: 'none', background: '#EF4444', fontSize: '14px', fontWeight: 600, color: '#fff', cursor: isDeleting ? 'wait' : 'pointer', opacity: isDeleting ? 0.7 : 1 }}>{isDeleting ? 'Suppression...' : 'Supprimer'}</button>
            </div>
          </div>
        </div>
      )}

      <style dangerouslySetInnerHTML={{ __html: `@keyframes spin { to { transform: rotate(360deg); } }` }} />
    </div>
  )
}
