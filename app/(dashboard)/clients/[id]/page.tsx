'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Tabs } from '@/components/shared/tabs'
import { Badge } from '@/components/shared/badge'
import { Button } from '@/components/shared/button'
import { Modal } from '@/components/shared/modal'
import { FormField } from '@/components/shared/form-field'
import { DataTableInline } from '@/components/shared/data-table-inline'
import { Avatar } from '@/components/shared/avatar'
import { useToast } from '@/components/shared/use-toast'
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
  User
} from 'lucide-react'

interface Client {
  id: string
  firstName: string
  lastName: string
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
  vehicleInfo: string
  entryDate: Date
  status: string
  description: string
  amount?: number
}

interface ClientFormData {
  firstName: string
  lastName: string
  email: string
  phone: string
  address: string
  postalCode: string
  city: string
}

export default function ClientDetailPage() {
  const router = useRouter()
  const params = useParams()
  const toast = useToast()
  const clientId = params.id as string
  
  const [client, setClient] = useState<Client | null>(null)
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [interventions, setInterventions] = useState<Intervention[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('info')
  
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [formData, setFormData] = useState<ClientFormData>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    postalCode: '',
    city: ''
  })
  const [formErrors, setFormErrors] = useState<Partial<Record<keyof ClientFormData, string>>>({})
  const [isSaving, setIsSaving] = useState(false)
  
  useEffect(() => {
    loadClientData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientId])
  
  const loadClientData = async () => {
    setIsLoading(true)
    
    try {
      // Charger client
      const clientResponse = await fetch(`/api/clients/${clientId}`)
      const clientData = await clientResponse.json()
      
      if (clientData.ok) {
        setClient(clientData.data)
      } else {
        toast.error('Erreur', 'Client introuvable')
        router.push('/clients')
        return
      }
      
      // Charger véhicules
      const vehiclesResponse = await fetch(`/api/vehicules?clientId=${clientId}`)
      const vehiclesData = await vehiclesResponse.json()
      
      if (vehiclesData.ok && vehiclesData.data) {
        setVehicles(vehiclesData.data.items || [])
      }
      
      // Charger interventions
      const interventionsResponse = await fetch(`/api/interventions?clientId=${clientId}`)
      const interventionsData = await interventionsResponse.json()
      
      if (interventionsData.ok && interventionsData.data) {
        setInterventions(interventionsData.data.items || [])
      }
      
    } catch (error) {
      console.error('Error loading client:', error)
      toast.error('Erreur', 'Impossible de charger les données')
      
      // Fallback mock data
      setClient({
        id: clientId,
        firstName: 'Jean',
        lastName: 'Dupont',
        email: 'jean.dupont@email.fr',
        phone: '06 12 34 56 78',
        address: '12 Rue de la République',
        postalCode: '75001',
        city: 'Paris',
        status: 'ACTIVE',
        vehicleCount: 2,
        interventionCount: 8,
        totalRevenue: 3200.00,
        createdAt: new Date('2024-01-15'),
        updatedAt: new Date('2024-01-15')
      })
      
      setVehicles([
        {
          id: '1',
          registrationNumber: 'AB-123-CD',
          make: 'Peugeot',
          model: '208',
          year: 2020,
          fuelType: 'ESSENCE',
          mileage: 45000,
          interventionCount: 5
        },
        {
          id: '2',
          registrationNumber: 'EF-456-GH',
          make: 'Renault',
          model: 'Clio',
          year: 2019,
          fuelType: 'DIESEL',
          mileage: 62000,
          interventionCount: 3
        }
      ])
      
      setInterventions([
        {
          id: '1',
          number: 'INT-2024-001',
          vehicleInfo: 'Peugeot 208 - AB-123-CD',
          entryDate: new Date('2024-01-15'),
          status: 'TERMINE',
          description: 'Révision 20 000 km',
          amount: 450.00
        },
        {
          id: '2',
          number: 'INT-2024-005',
          vehicleInfo: 'Renault Clio - EF-456-GH',
          entryDate: new Date('2024-01-20'),
          status: 'EN_COURS',
          description: 'Diagnostic électronique'
        }
      ])
      
    } finally {
      setIsLoading(false)
    }
  }
  
  const handleEdit = () => {
    if (!client) return
    
    setFormData({
      firstName: client.firstName,
      lastName: client.lastName,
      email: client.email,
      phone: client.phone,
      address: client.address,
      postalCode: client.postalCode,
      city: client.city
    })
    setFormErrors({})
    setIsEditModalOpen(true)
  }
  
  const validateForm = (): boolean => {
    const errors: Partial<Record<keyof ClientFormData, string>> = {}
    
    if (!formData.firstName.trim()) errors.firstName = 'Le prénom est requis'
    if (!formData.lastName.trim()) errors.lastName = 'Le nom est requis'
    
    if (!formData.email.trim()) {
      errors.email = "L'email est requis"
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = "Format d'email invalide"
    }
    
    if (!formData.phone.trim()) {
      errors.phone = 'Le téléphone est requis'
    } else if (!/^0[1-9]\d{8}$/.test(formData.phone.replace(/\s/g, ''))) {
      errors.phone = 'Format de téléphone invalide'
    }
    
    if (!formData.address.trim()) errors.address = "L'adresse est requise"
    if (!formData.postalCode.trim()) {
      errors.postalCode = 'Le code postal est requis'
    } else if (!/^\d{5}$/.test(formData.postalCode)) {
      errors.postalCode = 'Code postal invalide'
    }
    if (!formData.city.trim()) errors.city = 'La ville est requise'
    
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
        body: JSON.stringify(formData)
      })
      
      const data = await response.json()
      
      if (data.ok) {
        toast.success('Client modifié', 'Les modifications ont été enregistrées')
        setIsEditModalOpen(false)
        loadClientData()
      } else {
        toast.error('Erreur', data.error || 'Impossible de sauvegarder')
      }
      
    } catch (error) {
      console.error('Error saving client:', error)
      toast.error('Erreur', 'Impossible de se connecter au serveur')
    } finally {
      setIsSaving(false)
    }
  }
  
  const formatCurrency = (amount?: number): string => {
    if (!amount) return '-'
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount)
  }
  
  const getStatusBadge = (status: string) => {
    const variants = {
      EN_ATTENTE: 'warning',
      EN_COURS: 'info',
      TERMINE: 'success',
      ANNULE: 'error'
    } as const
    
    const labels = {
      EN_ATTENTE: 'En attente',
      EN_COURS: 'En cours',
      TERMINE: 'Terminée',
      ANNULE: 'Annulée'
    }
    
    return <Badge variant={variants[status as keyof typeof variants] || 'default'}>{labels[status as keyof typeof labels] || status}</Badge>
  }
  
  const vehicleColumns = [
    {
      key: 'vehicle',
      label: 'Véhicule',
      sortable: true,
      render: (vehicle: Vehicle) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Avatar name={vehicle.make} size="md" shape="square" />
          <div>
            <div style={{ fontSize: '14px', fontWeight: 500, color: '#111827' }}>
              {vehicle.make} {vehicle.model}
            </div>
            <div style={{ fontSize: '12px', color: '#6B7280' }}>
              {vehicle.registrationNumber}
            </div>
          </div>
        </div>
      )
    },
    {
      key: 'year',
      label: 'Année',
      sortable: true,
      render: (vehicle: Vehicle) => (
        <div style={{ fontSize: '13px', color: '#6B7280' }}>
          {vehicle.year}
        </div>
      )
    },
    {
      key: 'mileage',
      label: 'Kilométrage',
      sortable: true,
      render: (vehicle: Vehicle) => (
        <div style={{ fontSize: '13px', color: '#6B7280' }}>
          {vehicle.mileage.toLocaleString('fr-FR')} km
        </div>
      )
    },
    {
      key: 'interventions',
      label: 'Interventions',
      sortable: true,
      render: (vehicle: Vehicle) => (
        <Badge variant={vehicle.interventionCount > 0 ? 'default' : 'neutral'}>
          {vehicle.interventionCount}
        </Badge>
      )
    }
  ]
  
  const interventionColumns = [
    {
      key: 'number',
      label: 'Numéro',
      sortable: true,
      render: (intervention: Intervention) => (
        <div>
          <div style={{ fontFamily: 'monospace', fontSize: '14px', fontWeight: 600, color: '#111827' }}>
            {intervention.number}
          </div>
          <div style={{ fontSize: '12px', color: '#9CA3AF', marginTop: '2px' }}>
            {new Date(intervention.entryDate).toLocaleDateString('fr-FR')}
          </div>
        </div>
      )
    },
    {
      key: 'vehicle',
      label: 'Véhicule',
      sortable: false,
      render: (intervention: Intervention) => (
        <div style={{ fontSize: '13px', color: '#6B7280' }}>
          {intervention.vehicleInfo}
        </div>
      )
    },
    {
      key: 'status',
      label: 'Statut',
      sortable: true,
      render: (intervention: Intervention) => getStatusBadge(intervention.status)
    },
    {
      key: 'amount',
      label: 'Montant',
      sortable: true,
      render: (intervention: Intervention) => (
        <div style={{ fontSize: '14px', fontWeight: 600, color: intervention.amount ? '#111827' : '#9CA3AF' }}>
          {formatCurrency(intervention.amount)}
        </div>
      )
    }
  ]
  
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
      </div>
    )
  }
  
  if (!client) {
    return (
      <div style={{ padding: '24px' }}>
        <p style={{ fontSize: '14px', color: '#6B7280' }}>Client introuvable</p>
      </div>
    )
  }
  
  const tabs = [
    {
      id: 'info',
      label: 'Informations',
      icon: <User size={16} />,
      content: (
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '24px',
          padding: '24px',
          backgroundColor: '#FFFFFF',
          borderRadius: '12px',
          border: '1px solid #E5E7EB'
        }}>
          <div>
            <div style={{ fontSize: '12px', fontWeight: 500, color: '#6B7280', marginBottom: '8px' }}>
              Email
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Mail size={16} style={{ color: '#9CA3AF' }} />
              <span style={{ fontSize: '14px', color: '#111827' }}>{client.email}</span>
            </div>
          </div>
          
          <div>
            <div style={{ fontSize: '12px', fontWeight: 500, color: '#6B7280', marginBottom: '8px' }}>
              Téléphone
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Phone size={16} style={{ color: '#9CA3AF' }} />
              <span style={{ fontSize: '14px', color: '#111827' }}>{client.phone}</span>
            </div>
          </div>
          
          <div style={{ gridColumn: 'span 2' }}>
            <div style={{ fontSize: '12px', fontWeight: 500, color: '#6B7280', marginBottom: '8px' }}>
              Adresse
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <MapPin size={16} style={{ color: '#9CA3AF' }} />
              <span style={{ fontSize: '14px', color: '#111827' }}>
                {client.address}, {client.postalCode} {client.city}
              </span>
            </div>
          </div>
          
          <div>
            <div style={{ fontSize: '12px', fontWeight: 500, color: '#6B7280', marginBottom: '8px' }}>
              Statut
            </div>
            <Badge variant={client.status === 'ACTIVE' ? 'success' : 'neutral'} dot>
              {client.status === 'ACTIVE' ? 'Actif' : 'Inactif'}
            </Badge>
          </div>
          
          <div>
            <div style={{ fontSize: '12px', fontWeight: 500, color: '#6B7280', marginBottom: '8px' }}>
              Client depuis
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Calendar size={16} style={{ color: '#9CA3AF' }} />
              <span style={{ fontSize: '14px', color: '#111827' }}>
                {new Date(client.createdAt).toLocaleDateString('fr-FR')}
              </span>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'vehicles',
      label: 'Véhicules',
      icon: <Car size={16} />,
      badge: vehicles.length,
      content: (
        <DataTableInline
          data={vehicles}
          columns={vehicleColumns}
          loading={false}
          emptyState={(
            <div style={{ textAlign: 'center', padding: '48px 24px' }}>
              <div style={{ fontSize: '16px', fontWeight: 600, color: '#111827', marginBottom: '8px' }}>
                Aucun véhicule
              </div>
              <div style={{ fontSize: '14px', color: '#6B7280' }}>
                Ce client n&apos;a pas encore de véhicule enregistré
              </div>
            </div>
          )}
        />
      )
    },
    {
      id: 'interventions',
      label: 'Interventions',
      icon: <Wrench size={16} />,
      badge: interventions.length,
      content: (
        <DataTableInline
          data={interventions}
          columns={interventionColumns}
          loading={false}
          emptyState={(
            <div style={{ textAlign: 'center', padding: '48px 24px' }}>
              <div style={{ fontSize: '16px', fontWeight: 600, color: '#111827', marginBottom: '8px' }}>
                Aucune intervention
              </div>
              <div style={{ fontSize: '14px', color: '#6B7280' }}>
                Aucune intervention pour ce client
              </div>
            </div>
          )}
        />
      )
    }
  ]
  
  return (
    <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <Button
          variant="secondary"
          leftIcon={<ArrowLeft size={20} />}
          onClick={() => router.push('/clients')}
          style={{ marginBottom: '16px' }}
        >
          Retour aux clients
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
              {client.firstName} {client.lastName}
            </h1>
            <div style={{
              display: 'flex',
              gap: '16px',
              alignItems: 'center'
            }}>
              <Badge variant={client.status === 'ACTIVE' ? 'success' : 'neutral'} dot>
                {client.status === 'ACTIVE' ? 'Actif' : 'Inactif'}
              </Badge>
              <span style={{ fontSize: '14px', color: '#6B7280' }}>
                Client depuis {new Date(client.createdAt).toLocaleDateString('fr-FR')}
              </span>
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
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '16px',
        marginBottom: '24px'
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
              <Car size={20} style={{ color: '#0A1628' }} />
            </div>
            <span style={{ fontSize: '14px', fontWeight: 500, color: '#6B7280' }}>
              Véhicules
            </span>
          </div>
          <div style={{ fontSize: '28px', fontWeight: 700, color: '#111827' }}>
            {client.vehicleCount}
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
              <Wrench size={20} style={{ color: '#0A1628' }} />
            </div>
            <span style={{ fontSize: '14px', fontWeight: 500, color: '#6B7280' }}>
              Interventions
            </span>
          </div>
          <div style={{ fontSize: '28px', fontWeight: 700, color: '#111827' }}>
            {client.interventionCount}
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
            {formatCurrency(client.totalRevenue)}
          </div>
        </div>
      </div>
      
      {/* Tabs */}
      <Tabs
        tabs={tabs}
        value={activeTab}
        onChange={(tabId) => setActiveTab(tabId)}
      />
      
      {/* Modal édition */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Modifier le client"
        size="lg"
      >
        <div style={{ padding: '24px' }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '16px'
          }}>
            <FormField
              label="Prénom"
              name="firstName"
              value={formData.firstName}
              onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
              error={formErrors.firstName}
              required
            />
            
            <FormField
              label="Nom"
              name="lastName"
              value={formData.lastName}
              onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
              error={formErrors.lastName}
              required
            />
          </div>
          
          <FormField
            label="Email"
            type="email"
            name="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            error={formErrors.email}
            required
          />
          
          <FormField
            label="Téléphone"
            type="tel"
            name="phone"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            error={formErrors.phone}
            required
          />
          
          <FormField
            label="Adresse"
            name="address"
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            error={formErrors.address}
            required
          />
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 2fr',
            gap: '16px'
          }}>
            <FormField
              label="Code postal"
              name="postalCode"
              value={formData.postalCode}
              onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
              error={formErrors.postalCode}
              required
            />
            
            <FormField
              label="Ville"
              name="city"
              value={formData.city}
              onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              error={formErrors.city}
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
