'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { useRouter, useParams } from 'next/navigation'
import { 
  ArrowLeft,
  Edit,
  Calendar,
  Gauge,
  Hash,
  User,
  Euro,
  Wrench,
  CheckCircle,
  Clock,
  X,
  Car,
  Fuel,
  Settings,
  RefreshCw,
  AlertCircle,
  ChevronRight,
  Trash2,
  FileText,
  Plus
} from 'lucide-react'

// ============================================================================
// VEHICLE DETAIL PAGE - SafeMotor
// Design moderne avec données réelles
// ============================================================================

interface Vehicle {
  id: string
  registrationNumber?: string
  plate?: string
  vin: string
  make?: string
  brand?: string
  model: string
  version?: string
  engine?: string
  year: number
  firstRegistrationDate?: Date
  mileage: number
  color?: string
  fuelType?: string
  fuel?: string
  clientId: string
  clientName?: string
  client?: { id: number; firstName: string; lastName: string; name?: string }
  interventionCount: number
  totalRevenue?: number
  lastInterventionDate?: Date
  createdAt: Date
  updatedAt: Date
}

interface Intervention {
  id: string
  number: string
  createdAt: Date
  performedAt?: Date
  entryDate?: Date
  status: string
  title?: string
  description?: string
  type?: string
  odometerKm?: number
  amount?: number
  totalAmount?: number
  amountCents?: number
}

interface Client {
  id: string
  name: string
  firstName?: string
  lastName?: string
}

const FUEL_TYPES: Record<string, { label: string; color: string; bg: string }> = {
  'ESSENCE': { label: 'Essence', color: '#EF4444', bg: '#FEE2E2' },
  'Essence': { label: 'Essence', color: '#EF4444', bg: '#FEE2E2' },
  'DIESEL': { label: 'Diesel', color: '#1D4ED8', bg: '#DBEAFE' },
  'Diesel': { label: 'Diesel', color: '#1D4ED8', bg: '#DBEAFE' },
  'ELECTRIC': { label: 'Électrique', color: '#6366F1', bg: '#E0E7FF' },
  'Électrique': { label: 'Électrique', color: '#6366F1', bg: '#E0E7FF' },
  'HYBRID': { label: 'Hybride', color: '#10B981', bg: '#D1FAE5' },
  'Hybride': { label: 'Hybride', color: '#10B981', bg: '#D1FAE5' },
  'GPL': { label: 'GPL', color: '#F59E0B', bg: '#FEF3C7' },
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: any }> = {
  'DRAFT': { label: 'Brouillon', color: '#6B7280', bg: '#F3F4F6', icon: FileText },
  'EN_ATTENTE': { label: 'En attente', color: '#F59E0B', bg: '#FEF3C7', icon: Clock },
  'OPEN': { label: 'En cours', color: '#3B82F6', bg: '#DBEAFE', icon: Wrench },
  'EN_COURS': { label: 'En cours', color: '#3B82F6', bg: '#DBEAFE', icon: Wrench },
  'DONE': { label: 'Terminé', color: '#10B981', bg: '#D1FAE5', icon: CheckCircle },
  'TERMINE': { label: 'Terminé', color: '#10B981', bg: '#D1FAE5', icon: CheckCircle },
  'CANCELED': { label: 'Annulé', color: '#EF4444', bg: '#FEE2E2', icon: X },
  'ANNULE': { label: 'Annulé', color: '#EF4444', bg: '#FEE2E2', icon: X },
}

export default function VehicleDetailPage() {
  const router = useRouter()
  const params = useParams()
  const vehicleId = params.id as string
  
  const [vehicle, setVehicle] = useState<Vehicle | null>(null)
  const [interventions, setInterventions] = useState<Intervention[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Edit modal
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [formData, setFormData] = useState({
    clientId: '',
    plate: '',
    vin: '',
    brand: '',
    model: '',
    version: '',
    year: '',
    mileage: '',
    color: '',
    fuel: 'ESSENCE'
  })
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  const [isSaving, setIsSaving] = useState(false)
  
  // Delete modal
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const loadVehicleData = async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      const vehicleResponse = await fetch(`/api/vehicules/${vehicleId}`)
      const vehicleData = await vehicleResponse.json()
      
      if (vehicleData.ok && vehicleData.data) {
        setVehicle(vehicleData.data)
      } else {
        setError('Véhicule introuvable')
        return
      }
      
      const interventionsResponse = await fetch(`/api/interventions?vehicleId=${vehicleId}`)
      const interventionsData = await interventionsResponse.json()
      
      if (interventionsData.ok && interventionsData.data) {
        setInterventions(interventionsData.data.items || [])
      }
    } catch (err) {
      toast.error('Erreur de chargement du véhicule')
      setError('Impossible de charger les données')
    } finally {
      setIsLoading(false)
    }
  }

  const loadClients = async () => {
    try {
      const response = await fetch('/api/clients?pageSize=100')
      const data = await response.json()
      if (data.ok && data.data?.items) {
        setClients(data.data.items.map((c: any) => ({
          id: String(c.id),
          name: c.name || `${c.firstName || ''} ${c.lastName || ''}`.trim()
        })))
      }
    } catch (err) {
      // Silent fail - clients list is optional
    }
  }

  useEffect(() => {
    loadVehicleData()
    loadClients()
  }, [vehicleId])

  const getPlate = () => vehicle?.registrationNumber || vehicle?.plate || ''
  const getMake = () => vehicle?.make || vehicle?.brand || ''
  const getFuel = () => vehicle?.fuelType || vehicle?.fuel || 'ESSENCE'
  
  const getClientName = () => {
    if (vehicle?.clientName) return vehicle.clientName
    if (vehicle?.client) {
      if (vehicle.client.name) return vehicle.client.name
      return `${vehicle.client.firstName || ''} ${vehicle.client.lastName || ''}`.trim()
    }
    return 'Client inconnu'
  }

  const handleEdit = () => {
    if (!vehicle) return
    
    setFormData({
      clientId: String(vehicle.clientId),
      plate: getPlate(),
      vin: vehicle.vin || '',
      brand: getMake(),
      model: vehicle.model || '',
      version: vehicle.version || vehicle.engine || '',
      year: vehicle.year?.toString() || '',
      mileage: vehicle.mileage?.toString() || '',
      color: vehicle.color || '',
      fuel: getFuel()
    })
    setFormErrors({})
    setEditModalOpen(true)
  }

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {}
    if (!formData.plate.trim()) errors.plate = "L'immatriculation est requise"
    if (!formData.brand.trim()) errors.brand = 'La marque est requise'
    if (!formData.model.trim()) errors.model = 'Le modèle est requis'
    if (!formData.clientId) errors.clientId = 'Le client est requis'
    if (formData.vin && formData.vin.length !== 17) errors.vin = 'Le VIN doit contenir 17 caractères'
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSave = async () => {
    if (!validateForm() || !vehicle) return
    setIsSaving(true)
    
    try {
      const response = await fetch(`/api/vehicules/${vehicle.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId: parseInt(formData.clientId),
          registrationNumber: formData.plate,
          vin: formData.vin || undefined,
          make: formData.brand,
          model: formData.model,
          version: formData.version || undefined,
          year: formData.year ? parseInt(formData.year) : undefined,
          mileage: formData.mileage ? parseInt(formData.mileage) : undefined,
          color: formData.color || undefined,
          fuelType: formData.fuel
        })
      })
      
      const data = await response.json()
      
      if (data.ok) {
        setEditModalOpen(false)
        loadVehicleData()
      } else {
        setFormErrors({ plate: data.error || 'Erreur de sauvegarde' })
      }
    } catch (err) {
      toast.error('Erreur de sauvegarde')
      setFormErrors({ plate: 'Erreur de connexion' })
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!vehicle) return
    setIsDeleting(true)
    
    try {
      const response = await fetch(`/api/vehicules/${vehicle.id}`, { method: 'DELETE' })
      const data = await response.json()
      
      if (data.ok) {
        router.push('/vehicules')
      } else {
        setError(data.error || 'Erreur de suppression')
        setDeleteModalOpen(false)
      }
    } catch (err) {
      toast.error('Erreur de suppression')
      setError('Erreur de connexion')
      setDeleteModalOpen(false)
    } finally {
      setIsDeleting(false)
    }
  }

  const formatCurrency = (amount?: number): string => {
    if (!amount) return '0 €'
    // Handle amountCents
    const value = amount > 1000 ? amount / 100 : amount
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(value)
  }

  if (isLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '400px' }}>
        <RefreshCw size={32} color="#6366F1" style={{ animation: 'spin 1s linear infinite' }} />
        <style dangerouslySetInnerHTML={{ __html: `@keyframes spin { to { transform: rotate(360deg); } }` }} />
      </div>
    )
  }

  if (error || !vehicle) {
    return (
      <div style={{ padding: '32px', maxWidth: '600px', margin: '0 auto', textAlign: 'center' }}>
        <AlertCircle size={48} color="#EF4444" style={{ marginBottom: '16px' }} />
        <h2 style={{ fontSize: '20px', fontWeight: 600, color: '#111827', marginBottom: '8px' }}>{error || 'Véhicule introuvable'}</h2>
        <p style={{ fontSize: '14px', color: '#6B7280', marginBottom: '24px' }}>Ce véhicule n'existe pas ou a été supprimé.</p>
        <button onClick={() => router.push('/vehicules')} style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '12px 24px', borderRadius: '10px', border: 'none', background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)', color: '#fff', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}>
          <ArrowLeft size={18} /> Retour aux véhicules
        </button>
      </div>
    )
  }

  const fuelConfig = FUEL_TYPES[getFuel()] || FUEL_TYPES['ESSENCE']
  const totalRevenue = vehicle.totalRevenue || interventions.reduce((sum, i) => sum + (i.totalAmount || i.amount || (i.amountCents ? i.amountCents / 100 : 0)), 0)

  return (
    <div style={{ padding: '32px', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Back */}
      <button onClick={() => router.push('/vehicules')} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px', padding: '10px 16px', borderRadius: '10px', border: '1px solid #E5E7EB', background: '#fff', fontSize: '14px', fontWeight: 500, color: '#374151', cursor: 'pointer' }}>
        <ArrowLeft size={18} /> Retour aux véhicules
      </button>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px', flexWrap: 'wrap', gap: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{ width: '80px', height: '80px', borderRadius: '20px', background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Car size={40} color="#fff" />
          </div>
          <div>
            <h1 style={{ fontSize: '28px', fontWeight: 700, color: '#111827', margin: 0, marginBottom: '8px' }}>
              {getMake()} {vehicle.model}
            </h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 14px', borderRadius: '8px', fontSize: '15px', fontWeight: 700, background: '#EEF2FF', color: '#6366F1' }}>
                <Hash size={16} />
                {getPlate()}
              </span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 12px', borderRadius: '100px', fontSize: '13px', fontWeight: 600, background: fuelConfig.bg, color: fuelConfig.color }}>
                <Fuel size={14} />
                {fuelConfig.label}
              </span>
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
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '32px' }}>
        <div style={{ padding: '20px', borderRadius: '16px', background: '#fff', border: '1px solid #E5E7EB' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: '#EEF2FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Calendar size={24} color="#6366F1" /></div>
            <div><p style={{ fontSize: '13px', color: '#6B7280', margin: 0 }}>Année</p><p style={{ fontSize: '24px', fontWeight: 700, color: '#111827', margin: 0 }}>{vehicle.year || '-'}</p></div>
          </div>
        </div>
        <div style={{ padding: '20px', borderRadius: '16px', background: '#fff', border: '1px solid #E5E7EB' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: '#FEF3C7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Gauge size={24} color="#F59E0B" /></div>
            <div><p style={{ fontSize: '13px', color: '#6B7280', margin: 0 }}>Kilométrage</p><p style={{ fontSize: '24px', fontWeight: 700, color: '#111827', margin: 0 }}>{vehicle.mileage?.toLocaleString() || 0} km</p></div>
          </div>
        </div>
        <div style={{ padding: '20px', borderRadius: '16px', background: '#fff', border: '1px solid #E5E7EB' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: '#DBEAFE', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Wrench size={24} color="#3B82F6" /></div>
            <div><p style={{ fontSize: '13px', color: '#6B7280', margin: 0 }}>Interventions</p><p style={{ fontSize: '24px', fontWeight: 700, color: '#111827', margin: 0 }}>{interventions.length}</p></div>
          </div>
        </div>
        <div style={{ padding: '20px', borderRadius: '16px', background: '#fff', border: '1px solid #E5E7EB' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: '#D1FAE5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Euro size={24} color="#10B981" /></div>
            <div><p style={{ fontSize: '13px', color: '#6B7280', margin: 0 }}>CA Total</p><p style={{ fontSize: '24px', fontWeight: 700, color: '#10B981', margin: 0 }}>{formatCurrency(totalRevenue)}</p></div>
          </div>
        </div>
      </div>

      {/* Info + Interventions */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        {/* Vehicle Info */}
        <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid #E5E7EB', padding: '24px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#111827', margin: 0, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Settings size={20} color="#6366F1" /> Informations
          </h3>
          
          <div style={{ display: 'grid', gap: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 16px', background: '#F9FAFB', borderRadius: '10px' }}>
              <span style={{ fontSize: '14px', color: '#6B7280' }}>Propriétaire</span>
              <span style={{ fontSize: '14px', fontWeight: 600, color: '#111827', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <User size={16} color="#6366F1" />
                {getClientName()}
              </span>
            </div>
            
            {vehicle.vin && (
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 16px', background: '#F9FAFB', borderRadius: '10px' }}>
                <span style={{ fontSize: '14px', color: '#6B7280' }}>VIN</span>
                <span style={{ fontSize: '14px', fontWeight: 500, color: '#111827', fontFamily: 'monospace' }}>{vehicle.vin}</span>
              </div>
            )}
            
            {(vehicle.version || vehicle.engine) && (
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 16px', background: '#F9FAFB', borderRadius: '10px' }}>
                <span style={{ fontSize: '14px', color: '#6B7280' }}>Version</span>
                <span style={{ fontSize: '14px', fontWeight: 500, color: '#111827' }}>{vehicle.version || vehicle.engine}</span>
              </div>
            )}
            
            {vehicle.color && (
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 16px', background: '#F9FAFB', borderRadius: '10px' }}>
                <span style={{ fontSize: '14px', color: '#6B7280' }}>Couleur</span>
                <span style={{ fontSize: '14px', fontWeight: 500, color: '#111827' }}>{vehicle.color}</span>
              </div>
            )}
            
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 16px', background: '#F9FAFB', borderRadius: '10px' }}>
              <span style={{ fontSize: '14px', color: '#6B7280' }}>Ajouté le</span>
              <span style={{ fontSize: '14px', fontWeight: 500, color: '#111827' }}>{new Date(vehicle.createdAt).toLocaleDateString('fr-FR')}</span>
            </div>
          </div>
        </div>

        {/* Interventions */}
        <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid #E5E7EB', overflow: 'hidden' }}>
          <div style={{ padding: '20px 24px', borderBottom: '1px solid #E5E7EB', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#111827', margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Wrench size={20} color="#6366F1" /> Interventions ({interventions.length})
            </h3>
            <button onClick={() => router.push(`/interventions/nouveau?vehicleId=${vehicle.id}`)} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', borderRadius: '8px', border: 'none', background: '#EEF2FF', color: '#6366F1', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>
              <Plus size={16} /> Nouvelle
            </button>
          </div>
          
          {interventions.length === 0 ? (
            <div style={{ padding: '48px', textAlign: 'center' }}>
              <Wrench size={40} color="#D1D5DB" style={{ marginBottom: '12px' }} />
              <p style={{ fontSize: '14px', color: '#6B7280', margin: 0 }}>Aucune intervention</p>
            </div>
          ) : (
            <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
              {interventions.map((intervention, index) => {
                const statusConfig = STATUS_CONFIG[intervention.status] || STATUS_CONFIG['DRAFT']
                const StatusIcon = statusConfig.icon
                const amount = intervention.totalAmount || intervention.amount || (intervention.amountCents ? intervention.amountCents / 100 : 0)
                
                return (
                  <div key={intervention.id} style={{ display: 'flex', alignItems: 'center', padding: '14px 24px', borderBottom: index < interventions.length - 1 ? '1px solid #F3F4F6' : 'none', cursor: 'pointer' }} onClick={() => router.push(`/interventions/${intervention.id}`)} onMouseEnter={(e) => e.currentTarget.style.background = '#F9FAFB'} onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: statusConfig.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: '14px' }}>
                      <StatusIcon size={20} color={statusConfig.color} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '14px', fontWeight: 600, color: '#111827', marginBottom: '4px' }}>{intervention.number}</div>
                      <div style={{ fontSize: '12px', color: '#6B7280' }}>{new Date(intervention.createdAt || intervention.entryDate || new Date()).toLocaleDateString('fr-FR')}</div>
                    </div>
                    <div style={{ fontSize: '14px', fontWeight: 600, color: amount > 0 ? '#111827' : '#9CA3AF', marginRight: '12px' }}>{formatCurrency(amount)}</div>
                    <ChevronRight size={16} color="#D1D5DB" />
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Edit Modal */}
      {editModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0, 0, 0, 0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '20px' }} onClick={() => setEditModalOpen(false)}>
          <div style={{ background: '#fff', borderRadius: '20px', width: '100%', maxWidth: '550px', maxHeight: '90vh', overflow: 'auto' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px', borderBottom: '1px solid #E5E7EB' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#111827', margin: 0 }}>Modifier le véhicule</h2>
              <button onClick={() => setEditModalOpen(false)} style={{ padding: '8px', background: 'transparent', border: 'none', cursor: 'pointer' }}><X size={20} color="#6B7280" /></button>
            </div>
            <div style={{ padding: '24px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                <div><label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#374151', marginBottom: '6px' }}>Immatriculation *</label><input type="text" value={formData.plate} onChange={(e) => setFormData({ ...formData, plate: e.target.value.toUpperCase() })} style={{ width: '100%', padding: '12px 14px', borderRadius: '10px', border: formErrors.plate ? '1px solid #EF4444' : '1px solid #E5E7EB', fontSize: '14px', outline: 'none', textTransform: 'uppercase' }} />{formErrors.plate && <p style={{ fontSize: '12px', color: '#EF4444', margin: '4px 0 0' }}>{formErrors.plate}</p>}</div>
                <div><label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#374151', marginBottom: '6px' }}>VIN</label><input type="text" value={formData.vin} onChange={(e) => setFormData({ ...formData, vin: e.target.value.toUpperCase() })} style={{ width: '100%', padding: '12px 14px', borderRadius: '10px', border: formErrors.vin ? '1px solid #EF4444' : '1px solid #E5E7EB', fontSize: '14px', outline: 'none' }} />{formErrors.vin && <p style={{ fontSize: '12px', color: '#EF4444', margin: '4px 0 0' }}>{formErrors.vin}</p>}</div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                <div><label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#374151', marginBottom: '6px' }}>Marque *</label><input type="text" value={formData.brand} onChange={(e) => setFormData({ ...formData, brand: e.target.value })} style={{ width: '100%', padding: '12px 14px', borderRadius: '10px', border: formErrors.brand ? '1px solid #EF4444' : '1px solid #E5E7EB', fontSize: '14px', outline: 'none' }} />{formErrors.brand && <p style={{ fontSize: '12px', color: '#EF4444', margin: '4px 0 0' }}>{formErrors.brand}</p>}</div>
                <div><label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#374151', marginBottom: '6px' }}>Modèle *</label><input type="text" value={formData.model} onChange={(e) => setFormData({ ...formData, model: e.target.value })} style={{ width: '100%', padding: '12px 14px', borderRadius: '10px', border: formErrors.model ? '1px solid #EF4444' : '1px solid #E5E7EB', fontSize: '14px', outline: 'none' }} />{formErrors.model && <p style={{ fontSize: '12px', color: '#EF4444', margin: '4px 0 0' }}>{formErrors.model}</p>}</div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                <div><label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#374151', marginBottom: '6px' }}>Version</label><input type="text" value={formData.version} onChange={(e) => setFormData({ ...formData, version: e.target.value })} style={{ width: '100%', padding: '12px 14px', borderRadius: '10px', border: '1px solid #E5E7EB', fontSize: '14px', outline: 'none' }} /></div>
                <div><label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#374151', marginBottom: '6px' }}>Année</label><input type="number" value={formData.year} onChange={(e) => setFormData({ ...formData, year: e.target.value })} style={{ width: '100%', padding: '12px 14px', borderRadius: '10px', border: '1px solid #E5E7EB', fontSize: '14px', outline: 'none' }} /></div>
                <div><label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#374151', marginBottom: '6px' }}>Couleur</label><input type="text" value={formData.color} onChange={(e) => setFormData({ ...formData, color: e.target.value })} style={{ width: '100%', padding: '12px 14px', borderRadius: '10px', border: '1px solid #E5E7EB', fontSize: '14px', outline: 'none' }} /></div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                <div><label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#374151', marginBottom: '6px' }}>Énergie</label><select value={formData.fuel} onChange={(e) => setFormData({ ...formData, fuel: e.target.value })} style={{ width: '100%', padding: '12px 14px', borderRadius: '10px', border: '1px solid #E5E7EB', fontSize: '14px', outline: 'none', background: '#fff' }}><option value="ESSENCE">Essence</option><option value="DIESEL">Diesel</option><option value="ELECTRIC">Électrique</option><option value="HYBRID">Hybride</option><option value="GPL">GPL</option></select></div>
                <div><label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#374151', marginBottom: '6px' }}>Kilométrage</label><input type="number" value={formData.mileage} onChange={(e) => setFormData({ ...formData, mileage: e.target.value })} style={{ width: '100%', padding: '12px 14px', borderRadius: '10px', border: '1px solid #E5E7EB', fontSize: '14px', outline: 'none' }} /></div>
              </div>
              <div style={{ marginBottom: '24px' }}><label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#374151', marginBottom: '6px' }}>Client *</label><select value={formData.clientId} onChange={(e) => setFormData({ ...formData, clientId: e.target.value })} style={{ width: '100%', padding: '12px 14px', borderRadius: '10px', border: formErrors.clientId ? '1px solid #EF4444' : '1px solid #E5E7EB', fontSize: '14px', outline: 'none', background: '#fff' }}><option value="">Sélectionnez un client</option>{clients.map((client) => <option key={client.id} value={client.id}>{client.name}</option>)}</select>{formErrors.clientId && <p style={{ fontSize: '12px', color: '#EF4444', margin: '4px 0 0' }}>{formErrors.clientId}</p>}</div>
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
            <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#111827', margin: 0, marginBottom: '8px' }}>Supprimer le véhicule</h3>
            <p style={{ fontSize: '14px', color: '#6B7280', margin: 0, lineHeight: 1.6 }}>Êtes-vous sûr de vouloir supprimer <strong style={{ color: '#111827' }}>{getMake()} {vehicle.model}</strong> ({getPlate()}) ?</p>
            {interventions.length > 0 && <p style={{ fontSize: '13px', color: '#DC2626', margin: '16px 0 0', padding: '10px 12px', background: '#FEF2F2', borderRadius: '8px' }}>⚠️ Ce véhicule a {interventions.length} intervention(s)</p>}
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
