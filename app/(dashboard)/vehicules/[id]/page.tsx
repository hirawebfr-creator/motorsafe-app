'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Badge } from '@/components/shared/badge'
import { Button } from '@/components/shared/button'
import { Modal } from '@/components/shared/modal'
import { FormField } from '@/components/shared/form-field'
import { Select } from '@/components/shared/select'
import { Avatar } from '@/components/shared/avatar'
import { useToast } from '@/components/shared/use-toast'
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
  PlayCircle,
  XCircle
} from 'lucide-react'

type InterventionStatus = 'DRAFT' | 'OPEN' | 'DONE' | 'CANCELED'

interface Vehicle {
  id: string
  plate: string
  vin: string
  brand: string
  model: string
  engine?: string
  year: number
  firstRegistrationDate?: Date
  mileage?: number
  color?: string
  fuel: string
  clientId: string
  client?: {
    id: number
    firstName: string
    lastName: string
  }
  interventionCount?: number
  totalRevenue?: number
  lastInterventionDate?: Date
  createdAt: Date
  updatedAt: Date
}

interface Intervention {
  id: string
  number?: string
  createdAt: Date
  performedAt?: Date
  status: InterventionStatus
  title?: string
  type: string
  notes?: string
  odometerKm?: number
  amountCents?: number
  agreementAt?: Date
  closedAt?: Date
}

interface VehicleFormData {
  clientId: string
  plate: string
  vin: string
  brand: string
  model: string
  engine: string
  year: string
  mileage: string
  color: string
  fuel: string
}

interface Client {
  id: string
  name: string
}

export default function VehicleDetailPage() {
  const router = useRouter()
  const params = useParams()
  const toast = useToast()
  const vehicleId = params.id as string
  
  const [vehicle, setVehicle] = useState<Vehicle | null>(null)
  const [interventions, setInterventions] = useState<Intervention[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [isLoading, setIsLoading] = useState(true)
  
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [formData, setFormData] = useState<VehicleFormData>({
    clientId: '',
    plate: '',
    vin: '',
    brand: '',
    model: '',
    engine: '',
    year: '',
    mileage: '',
    color: '',
    fuel: 'Essence'
  })
  const [formErrors, setFormErrors] = useState<Partial<Record<keyof VehicleFormData, string>>>({})
  const [isSaving, setIsSaving] = useState(false)
  
  useEffect(() => {
    loadVehicleData()
    loadClients()
  }, [vehicleId])
  
  const loadClients = async () => {
    try {
      const response = await fetch('/api/clients')
      const data = await response.json()
      
      if (data.ok && data.data && Array.isArray(data.data.items)) {
        setClients(data.data.items.map((c: any) => ({
          id: String(c.id),
          name: `${c.firstName} ${c.lastName}`
        })))
      }
    } catch (error) {
      console.error('Error loading clients:', error)
      setClients([
        { id: '1', name: 'Jean Dupont' },
        { id: '2', name: 'Marie Martin' }
      ])
    }
  }
  
  const loadVehicleData = async () => {
    setIsLoading(true)
    
    try {
      // Charger véhicule
      const vehicleResponse = await fetch(`/api/vehicules/${vehicleId}`)
      const vehicleData = await vehicleResponse.json()
      
      if (vehicleData.ok && vehicleData.data) {
        setVehicle(vehicleData.data)
      } else {
        toast.error('Erreur', 'Véhicule introuvable')
        router.push('/vehicules')
        return
      }
      
      // Charger interventions
      const interventionsResponse = await fetch(`/api/interventions?vehicleId=${vehicleId}`)
      const interventionsData = await interventionsResponse.json()
      
      if (interventionsData.ok && interventionsData.data && Array.isArray(interventionsData.data.items)) {
        setInterventions(interventionsData.data.items)
      }
      
    } catch (error) {
      console.error('Error loading vehicle:', error)
      toast.error('Erreur', 'Impossible de charger les données')
      
      // Fallback mock data
      setVehicle({
        id: vehicleId,
        plate: 'AB-123-CD',
        vin: '1HGBH41JXMN109186',
        brand: 'Peugeot',
        model: '208',
        engine: '1.2 PureTech 100',
        year: 2020,
        mileage: 45000,
        color: 'Blanc',
        fuel: 'Essence',
        clientId: '1',
        client: { id: 1, firstName: 'Jean', lastName: 'Dupont' },
        interventionCount: 5,
        totalRevenue: 2250.00,
        lastInterventionDate: new Date('2024-01-15'),
        createdAt: new Date('2024-01-10'),
        updatedAt: new Date('2024-01-10')
      })
      
      setInterventions([
        {
          id: '1',
          number: 'INT-2024-001',
          createdAt: new Date('2024-01-15'),
          status: 'DONE',
          type: 'revision',
          title: 'Révision 20 000 km + changement plaquettes',
          odometerKm: 45000,
          amountCents: 45000,
          agreementAt: new Date('2024-01-15'),
          closedAt: new Date('2024-01-16')
        },
        {
          id: '2',
          number: 'INT-2023-045',
          createdAt: new Date('2023-06-10'),
          status: 'DONE',
          type: 'revision',
          title: 'Vidange + filtres',
          odometerKm: 35000,
          amountCents: 18000,
          agreementAt: new Date('2023-06-10'),
          closedAt: new Date('2023-06-11')
        }
      ])
      
    } finally {
      setIsLoading(false)
    }
  }
  
  const handleEdit = () => {
    if (!vehicle) return
    
    setFormData({
      clientId: String(vehicle.clientId),
      plate: vehicle.plate,
      vin: vehicle.vin || '',
      brand: vehicle.brand,
      model: vehicle.model,
      engine: vehicle.engine || '',
      year: vehicle.year?.toString() || '',
      mileage: vehicle.mileage?.toString() || '',
      color: vehicle.color || '',
      fuel: vehicle.fuel || 'Essence'
    })
    setFormErrors({})
    setIsEditModalOpen(true)
  }
  
  const validateForm = (): boolean => {
    const errors: Partial<Record<keyof VehicleFormData, string>> = {}
    
    if (!formData.plate.trim()) {
      errors.plate = 'L\'immatriculation est requise'
    }
    
    if (formData.vin && formData.vin.length !== 17) {
      errors.vin = 'Le VIN doit contenir 17 caractères'
    }
    
    if (!formData.brand.trim()) errors.brand = 'La marque est requise'
    if (!formData.model.trim()) errors.model = 'Le modèle est requis'
    
    if (formData.year) {
      const year = parseInt(formData.year)
      if (year < 1900 || year > new Date().getFullYear() + 1) {
        errors.year = 'Année invalide'
      }
    }
    
    if (!formData.clientId) errors.clientId = 'Le client est requis'
    
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }
  
  const handleSave = async () => {
    if (!validateForm() || !vehicle) return
    
    setIsSaving(true)
    
    try {
      const payload = {
        clientId: parseInt(formData.clientId),
        plate: formData.plate,
        vin: formData.vin || undefined,
        brand: formData.brand,
        model: formData.model,
        engine: formData.engine || undefined,
        year: formData.year ? parseInt(formData.year) : undefined,
        fuel: formData.fuel
      }
      
      const response = await fetch(`/api/vehicules/${vehicle.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      
      const data = await response.json()
      
      if (data.ok) {
        toast.success('Véhicule modifié', 'Les modifications ont été enregistrées')
        setIsEditModalOpen(false)
        loadVehicleData()
      } else {
        toast.error('Erreur', data.error?.message || 'Impossible de sauvegarder')
      }
      
    } catch (error) {
      console.error('Error saving vehicle:', error)
      toast.error('Erreur', 'Impossible de se connecter au serveur')
    } finally {
      setIsSaving(false)
    }
  }
  
  const formatCurrency = (amountCents?: number): string => {
    if (!amountCents) return '-'
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(amountCents / 100)
  }
  
  const getFuelTypeBadgeVariant = (type: string) => {
    const variants: Record<string, string> = {
      'Essence': 'default',
      'Diesel': 'neutral',
      'Hybride': 'success',
      'Électrique': 'info',
      'GPL': 'warning'
    }
    return (variants[type] || 'default') as any
  }
  
  const getStatusBadge = (status: InterventionStatus) => {
    const variants: Record<string, string> = {
      DRAFT: 'neutral',
      OPEN: 'info',
      DONE: 'success',
      CANCELED: 'error'
    }
    
    const labels: Record<string, string> = {
      DRAFT: 'Brouillon',
      OPEN: 'En cours',
      DONE: 'Terminée',
      CANCELED: 'Annulée'
    }
    
    const icons: Record<string, JSX.Element> = {
      DRAFT: <Clock size={14} />,
      OPEN: <PlayCircle size={14} />,
      DONE: <CheckCircle size={14} />,
      CANCELED: <XCircle size={14} />
    }
    
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        {icons[status]}
        <Badge variant={variants[status] as any}>
          {labels[status]}
        </Badge>
      </div>
    )
  }
  
  const getClientName = (): string => {
    if (vehicle?.client) {
      return `${vehicle.client.firstName} ${vehicle.client.lastName}`
    }
    return 'Client inconnu'
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
  
  if (!vehicle) {
    return (
      <div style={{ padding: '24px' }}>
        <p style={{ fontSize: '14px', color: '#6B7280' }}>Véhicule introuvable</p>
      </div>
    )
  }
  
  return (
    <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <Button
          variant="secondary"
          leftIcon={<ArrowLeft size={20} />}
          onClick={() => router.push('/vehicules')}
          style={{ marginBottom: '16px' }}
        >
          Retour aux véhicules
        </Button>
        
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <Avatar
              name={vehicle.brand}
              size="lg"
              shape="square"
            />
            <div>
              <h1 style={{
                fontSize: '32px',
                fontWeight: 700,
                color: '#111827',
                margin: 0,
                marginBottom: '4px'
              }}>
                {vehicle.brand} {vehicle.model}
              </h1>
              <div style={{
                display: 'flex',
                gap: '12px',
                alignItems: 'center'
              }}>
                <div style={{
                  fontFamily: 'monospace',
                  fontSize: '16px',
                  fontWeight: 600,
                  color: '#111827',
                  backgroundColor: '#F9FAFB',
                  padding: '4px 8px',
                  borderRadius: '4px'
                }}>
                  {vehicle.plate}
                </div>
                <Badge variant={getFuelTypeBadgeVariant(vehicle.fuel)}>
                  {vehicle.fuel}
                </Badge>
              </div>
            </div>
          </div>
          
          <Button
            variant="primary"
            leftIcon={<Edit size={20} />}
            onClick={handleEdit}
          >
            Modifier
          </Button>
        </div>
      </div>
      
      {/* Stats */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: '16px',
        marginBottom: '32px'
      }}>
        <div style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '12px',
          border: '1px solid #E5E7EB',
          padding: '20px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '8px',
              backgroundColor: '#F9FAFB',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Wrench size={20} style={{ color: '#0A1628' }} />
            </div>
            <span style={{ fontSize: '14px', fontWeight: 500, color: '#6B7280' }}>
              Interventions
            </span>
          </div>
          <div style={{ fontSize: '28px', fontWeight: 700, color: '#111827' }}>
            {interventions.length}
          </div>
        </div>
        
        <div style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '12px',
          border: '1px solid #E5E7EB',
          padding: '20px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '8px',
              backgroundColor: '#F9FAFB',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Euro size={20} style={{ color: '#0A1628' }} />
            </div>
            <span style={{ fontSize: '14px', fontWeight: 500, color: '#6B7280' }}>
              CA Total
            </span>
          </div>
          <div style={{ fontSize: '28px', fontWeight: 700, color: '#111827' }}>
            {formatCurrency(interventions.reduce((sum, i) => sum + (i.amountCents || 0), 0))}
          </div>
        </div>
        
        <div style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '12px',
          border: '1px solid #E5E7EB',
          padding: '20px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '8px',
              backgroundColor: '#F9FAFB',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Gauge size={20} style={{ color: '#0A1628' }} />
            </div>
            <span style={{ fontSize: '14px', fontWeight: 500, color: '#6B7280' }}>
              Kilométrage
            </span>
          </div>
          <div style={{ fontSize: '28px', fontWeight: 700, color: '#111827' }}>
            {vehicle.mileage ? `${vehicle.mileage.toLocaleString('fr-FR')} km` : '-'}
          </div>
        </div>
        
        <div style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '12px',
          border: '1px solid #E5E7EB',
          padding: '20px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '8px',
              backgroundColor: '#F9FAFB',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Calendar size={20} style={{ color: '#0A1628' }} />
            </div>
            <span style={{ fontSize: '14px', fontWeight: 500, color: '#6B7280' }}>
              Dernier passage
            </span>
          </div>
          <div style={{ fontSize: '20px', fontWeight: 600, color: '#111827' }}>
            {interventions.length > 0 
              ? new Date(interventions[0].createdAt).toLocaleDateString('fr-FR')
              : 'Jamais'
            }
          </div>
        </div>
      </div>
      
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 2fr',
        gap: '24px'
      }}>
        {/* Informations techniques */}
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
            Informations techniques
          </h2>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <div style={{ fontSize: '12px', fontWeight: 500, color: '#6B7280', marginBottom: '6px' }}>
                Propriétaire
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <User size={16} style={{ color: '#9CA3AF' }} />
                <span style={{ fontSize: '14px', color: '#111827' }}>{getClientName()}</span>
              </div>
            </div>
            
            {vehicle.vin && (
              <div>
                <div style={{ fontSize: '12px', fontWeight: 500, color: '#6B7280', marginBottom: '6px' }}>
                  VIN
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Hash size={16} style={{ color: '#9CA3AF' }} />
                  <span style={{ 
                    fontSize: '12px', 
                    color: '#111827',
                    fontFamily: 'monospace'
                  }}>
                    {vehicle.vin}
                  </span>
                </div>
              </div>
            )}
            
            {vehicle.engine && (
              <div>
                <div style={{ fontSize: '12px', fontWeight: 500, color: '#6B7280', marginBottom: '6px' }}>
                  Motorisation
                </div>
                <div style={{ fontSize: '14px', color: '#111827' }}>
                  {vehicle.engine}
                </div>
              </div>
            )}
            
            {vehicle.year && (
              <div>
                <div style={{ fontSize: '12px', fontWeight: 500, color: '#6B7280', marginBottom: '6px' }}>
                  Année
                </div>
                <div style={{ fontSize: '14px', color: '#111827' }}>
                  {vehicle.year}
                </div>
              </div>
            )}
            
            {vehicle.color && (
              <div>
                <div style={{ fontSize: '12px', fontWeight: 500, color: '#6B7280', marginBottom: '6px' }}>
                  Couleur
                </div>
                <div style={{ fontSize: '14px', color: '#111827' }}>
                  {vehicle.color}
                </div>
              </div>
            )}
            
            <div>
              <div style={{ fontSize: '12px', fontWeight: 500, color: '#6B7280', marginBottom: '6px' }}>
                Carburant
              </div>
              <Badge variant={getFuelTypeBadgeVariant(vehicle.fuel)}>
                {vehicle.fuel}
              </Badge>
            </div>
          </div>
        </div>
        
        {/* Timeline interventions */}
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
            Historique interventions
          </h2>
          
          {interventions.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '48px 24px',
              color: '#6B7280'
            }}>
              <Wrench size={48} style={{ color: '#D1D5DB', marginBottom: '16px' }} />
              <p style={{ fontSize: '14px', margin: 0 }}>
                Aucune intervention pour ce véhicule
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
              {interventions.map((intervention, index) => (
                <div
                  key={intervention.id}
                  style={{
                    paddingLeft: '24px',
                    borderLeft: index === interventions.length - 1 ? 'none' : '2px solid #E5E7EB',
                    position: 'relative',
                    paddingBottom: index === interventions.length - 1 ? 0 : '16px'
                  }}
                >
                  <div style={{
                    position: 'absolute',
                    left: '-7px',
                    top: '8px',
                    width: '12px',
                    height: '12px',
                    borderRadius: '50%',
                    backgroundColor: intervention.status === 'DONE' ? '#16A34A' : 
                                     intervention.status === 'OPEN' ? '#3B82F6' :
                                     intervention.status === 'CANCELED' ? '#DC2626' : '#9CA3AF',
                    border: '2px solid #FFFFFF',
                    boxShadow: '0 0 0 2px #E5E7EB'
                  }} />
                  
                  <div style={{
                    backgroundColor: '#F9FAFB',
                    borderRadius: '8px',
                    padding: '16px',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    border: '1px solid transparent'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#F3F4F6'
                    e.currentTarget.style.borderColor = '#E5E7EB'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#F9FAFB'
                    e.currentTarget.style.borderColor = 'transparent'
                  }}
                  onClick={() => router.push(`/interventions/${intervention.id}`)}
                  >
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      marginBottom: '8px'
                    }}>
                      <div>
                        <div style={{
                          fontFamily: 'monospace',
                          fontSize: '14px',
                          fontWeight: 600,
                          color: '#111827',
                          marginBottom: '4px'
                        }}>
                          {intervention.number || `#${String(intervention.id).slice(0, 8)}`}
                        </div>
                        <div style={{ fontSize: '12px', color: '#6B7280' }}>
                          {new Date(intervention.createdAt).toLocaleDateString('fr-FR')}
                          {intervention.odometerKm && ` • ${intervention.odometerKm.toLocaleString('fr-FR')} km`}
                        </div>
                      </div>
                      {getStatusBadge(intervention.status)}
                    </div>
                    
                    <p style={{
                      fontSize: '14px',
                      color: '#374151',
                      margin: 0,
                      marginBottom: '12px',
                      lineHeight: 1.5
                    }}>
                      {intervention.title || intervention.type}
                    </p>
                    
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}>
                      <div style={{
                        display: 'flex',
                        gap: '6px',
                        alignItems: 'center'
                      }}>
                        <Badge variant={intervention.agreementAt ? 'success' : 'neutral'} size="sm">
                          {intervention.agreementAt ? '✓' : '○'} Accord
                        </Badge>
                        <Badge variant={intervention.closedAt ? 'success' : 'neutral'} size="sm">
                          {intervention.closedAt ? '✓' : '○'} Clôturé
                        </Badge>
                      </div>
                      
                      {intervention.amountCents && (
                        <div style={{
                          fontSize: '16px',
                          fontWeight: 600,
                          color: '#111827'
                        }}>
                          {formatCurrency(intervention.amountCents)}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      
      {/* Modal édition */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Modifier le véhicule"
        size="lg"
      >
        <div style={{ padding: '24px' }}>
          <Select
            label="Propriétaire"
            value={formData.clientId}
            onChange={(e) => setFormData({ ...formData, clientId: e.target.value })}
            options={[
              { value: '', label: 'Sélectionner un client' },
              ...clients.map(c => ({ value: c.id, label: c.name }))
            ]}
            error={formErrors.clientId}
            required
          />
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '16px',
            marginTop: '16px'
          }}>
            <FormField
              label="Immatriculation"
              name="plate"
              value={formData.plate}
              onChange={(e) => setFormData({ ...formData, plate: e.target.value.toUpperCase() })}
              error={formErrors.plate}
              required
            />
            
            <FormField
              label="VIN (17 caractères)"
              name="vin"
              value={formData.vin}
              onChange={(e) => setFormData({ ...formData, vin: e.target.value.toUpperCase() })}
              error={formErrors.vin}
            />
          </div>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '16px',
            marginTop: '16px'
          }}>
            <FormField
              label="Marque"
              name="brand"
              value={formData.brand}
              onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
              error={formErrors.brand}
              required
            />
            
            <FormField
              label="Modèle"
              name="model"
              value={formData.model}
              onChange={(e) => setFormData({ ...formData, model: e.target.value })}
              error={formErrors.model}
              required
            />
          </div>
          
          <div style={{ marginTop: '16px' }}>
            <FormField
              label="Motorisation (optionnel)"
              name="engine"
              value={formData.engine}
              onChange={(e) => setFormData({ ...formData, engine: e.target.value })}
            />
          </div>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '16px',
            marginTop: '16px'
          }}>
            <FormField
              label="Année"
              type="number"
              name="year"
              value={formData.year}
              onChange={(e) => setFormData({ ...formData, year: e.target.value })}
              error={formErrors.year}
            />
            
            <Select
              label="Carburant"
              value={formData.fuel}
              onChange={(e) => setFormData({ ...formData, fuel: e.target.value })}
              options={[
                { value: 'Essence', label: 'Essence' },
                { value: 'Diesel', label: 'Diesel' },
                { value: 'Hybride', label: 'Hybride' },
                { value: 'Électrique', label: 'Électrique' },
                { value: 'GPL', label: 'GPL' }
              ]}
              required
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
              onClick={() => setIsEditModalOpen(false)}
              disabled={isSaving}
            >
              Annuler
            </Button>
            <Button
              variant="primary"
              onClick={handleSave}
              loading={isSaving}
              disabled={isSaving}
            >
              Enregistrer
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
