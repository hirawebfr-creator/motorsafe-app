'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { DataTableInline } from '@/components/shared/data-table-inline'
import { FormField } from '@/components/shared/form-field'
import { Button } from '@/components/shared/button'
import { Modal } from '@/components/shared/modal'
import { Badge } from '@/components/shared/badge'
import { SearchInput } from '@/components/shared/search-input'
import { Select } from '@/components/shared/select'
import { Avatar } from '@/components/shared/avatar'
import { DropdownMenu } from '@/components/shared/dropdown-menu'
import { useToast } from '@/components/shared/use-toast'
import { 
  Search,
  Plus,
  MoreVertical,
  Eye,
  Edit,
  Trash2,
  User,
  Hash
} from 'lucide-react'

type FuelType = 'ESSENCE' | 'DIESEL' | 'HYBRID' | 'ELECTRIC' | 'GPL'

interface Vehicle {
  id: string
  registrationNumber: string
  vin: string
  make: string
  model: string
  version?: string
  year: number
  firstRegistrationDate: Date
  mileage: number
  color?: string
  fuelType: FuelType
  clientId: string
  clientName: string
  interventionCount: number
  photoUrl?: string
  createdAt: Date
  updatedAt: Date
}

interface VehicleFormData {
  registrationNumber: string
  vin: string
  make: string
  model: string
  version: string
  year: string
  firstRegistrationDate: string
  mileage: string
  color: string
  fuelType: FuelType
  clientId: string
}

interface Client {
  id: string
  name: string
}

export default function VehiculesPage() {
  const router = useRouter()
  const toast = useToast()
  
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [clientFilter, setClientFilter] = useState<string>('all')
  const [fuelFilter, setFuelFilter] = useState<string>('all')
  
  // Modal SIV
  const [isSivModalOpen, setIsSivModalOpen] = useState(false)
  const [sivRegistration, setSivRegistration] = useState('')
  const [sivLoading, setSivLoading] = useState(false)
  
  // Modal création/édition
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null)
  const [formData, setFormData] = useState<VehicleFormData>({
    registrationNumber: '',
    vin: '',
    make: '',
    model: '',
    version: '',
    year: '',
    firstRegistrationDate: '',
    mileage: '',
    color: '',
    fuelType: 'ESSENCE',
    clientId: ''
  })
  const [formErrors, setFormErrors] = useState<Partial<Record<keyof VehicleFormData, string>>>({})
  const [isSaving, setIsSaving] = useState(false)
  
  // Modal suppression
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [vehicleToDelete, setVehicleToDelete] = useState<Vehicle | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  
  useEffect(() => {
    loadVehicles()
    loadClients()
  }, [searchQuery, clientFilter, fuelFilter])
  
  const loadClients = async () => {
    try {
      const response = await fetch('/api/clients')
      const data = await response.json()
      
      if (data.ok && data.data && Array.isArray(data.data.items)) {
        setClients(data.data.items.map((c: any) => ({
          id: c.id,
          name: `${c.firstName} ${c.lastName}`
        })))
      } else {
        console.error('Error loading clients:', data.error || 'Invalid response')
      }
    } catch (error) {
      console.error('Error loading clients:', error)
      // Fallback
      setClients([
        { id: '1', name: 'Jean Dupont' },
        { id: '2', name: 'Marie Martin' },
        { id: '3', name: 'Pierre Dubois' },
        { id: '4', name: 'Sophie Blanc' }
      ])
    }
  }
  
  const loadVehicles = async () => {
    setIsLoading(true)
    
    try {
      const params = new URLSearchParams({
        search: searchQuery,
        clientId: clientFilter === 'all' ? '' : clientFilter,
        fuelType: fuelFilter === 'all' ? '' : fuelFilter,
        page: '1',
        limit: '100'
      })
      
      const response = await fetch(`/api/vehicules?${params}`)
      const data = await response.json()
      
      if (data.ok && data.data && Array.isArray(data.data.items)) {
        setVehicles(data.data.items)
      } else {
        console.error('Error loading vehicles:', data.error || 'Invalid response format')
        toast.error('Erreur', 'Impossible de charger les véhicules')
      }
      
    } catch (error) {
      console.error('Error loading vehicles:', error)
      toast.error('Erreur', 'Impossible de se connecter au serveur')
      
      // Fallback sur données simulées
      const mockVehicles: Vehicle[] = [
        {
          id: '1',
          registrationNumber: 'AB-123-CD',
          vin: '1HGBH41JXMN109186',
          make: 'Peugeot',
          model: '208',
          version: 'Active',
          year: 2020,
          firstRegistrationDate: new Date('2020-03-15'),
          mileage: 45000,
          color: 'Blanc',
          fuelType: 'ESSENCE',
          clientId: '1',
          clientName: 'Jean Dupont',
          interventionCount: 5,
          createdAt: new Date('2024-01-10'),
          updatedAt: new Date('2024-01-10')
        },
        {
          id: '2',
          registrationNumber: 'EF-456-GH',
          vin: 'WBADT43452G876543',
          make: 'Renault',
          model: 'Clio',
          version: 'Intens',
          year: 2019,
          firstRegistrationDate: new Date('2019-06-20'),
          mileage: 62000,
          color: 'Noir',
          fuelType: 'DIESEL',
          clientId: '1',
          clientName: 'Jean Dupont',
          interventionCount: 8,
          createdAt: new Date('2024-01-15'),
          updatedAt: new Date('2024-01-15')
        },
        {
          id: '3',
          registrationNumber: 'IJ-789-KL',
          vin: 'VF1RY000555123456',
          make: 'Citroën',
          model: 'C3',
          version: 'Feel',
          year: 2021,
          firstRegistrationDate: new Date('2021-09-10'),
          mileage: 28000,
          color: 'Rouge',
          fuelType: 'ESSENCE',
          clientId: '2',
          clientName: 'Marie Martin',
          interventionCount: 2,
          createdAt: new Date('2024-02-05'),
          updatedAt: new Date('2024-02-05')
        },
        {
          id: '4',
          registrationNumber: 'MN-012-OP',
          vin: '5YJSA1E14FF123456',
          make: 'Tesla',
          model: 'Model 3',
          version: 'Standard Range Plus',
          year: 2022,
          firstRegistrationDate: new Date('2022-01-25'),
          mileage: 15000,
          color: 'Bleu',
          fuelType: 'ELECTRIC',
          clientId: '3',
          clientName: 'Pierre Dubois',
          interventionCount: 1,
          createdAt: new Date('2024-03-01'),
          updatedAt: new Date('2024-03-01')
        }
      ]
      
      let filtered = mockVehicles
      
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        filtered = filtered.filter(v => 
          v.registrationNumber.toLowerCase().includes(query) ||
          v.vin.toLowerCase().includes(query) ||
          v.make.toLowerCase().includes(query) ||
          v.model.toLowerCase().includes(query)
        )
      }
      
      if (clientFilter !== 'all') {
        filtered = filtered.filter(v => v.clientId === clientFilter)
      }
      
      if (fuelFilter !== 'all') {
        filtered = filtered.filter(v => v.fuelType === fuelFilter)
      }
      
      setVehicles(filtered)
      
    } finally {
      setIsLoading(false)
    }
  }
  
  // Recherche SIV
  const handleSivSearch = async () => {
    if (!sivRegistration.trim()) {
      toast.error('Erreur', 'Entrez une immatriculation')
      return
    }
    
    setSivLoading(true)
    
    try {
      const response = await fetch('/api/siv/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ registrationNumber: sivRegistration })
      })
      
      const data = await response.json()
      
      if (data.ok && data.vehicle) {
        // Pré-remplir le formulaire avec les données SIV
        setFormData({
          registrationNumber: data.vehicle.registrationNumber,
          vin: data.vehicle.vin || '',
          make: data.vehicle.make,
          model: data.vehicle.model,
          version: data.vehicle.version || '',
          year: data.vehicle.year?.toString() || '',
          firstRegistrationDate: data.vehicle.firstRegistrationDate || '',
          mileage: '',
          color: data.vehicle.color || '',
          fuelType: data.vehicle.fuelType || 'ESSENCE',
          clientId: ''
        })
        
        setIsSivModalOpen(false)
        setIsModalOpen(true)
        toast.success('Véhicule trouvé', 'Données SIV récupérées avec succès')
      } else {
        toast.error('Erreur', data.error || 'Véhicule non trouvé dans le SIV')
      }
      
    } catch (error) {
      console.error('Error searching SIV:', error)
      toast.error('Erreur', 'Impossible de se connecter au serveur SIV')
    } finally {
      setSivLoading(false)
    }
  }
  
  const validateForm = (): boolean => {
    const errors: Partial<Record<keyof VehicleFormData, string>> = {}
    
    if (!formData.registrationNumber.trim()) {
      errors.registrationNumber = 'L\'immatriculation est requise'
    }
    
    if (!formData.vin.trim()) {
      errors.vin = 'Le VIN est requis'
    } else if (formData.vin.length !== 17) {
      errors.vin = 'Le VIN doit contenir 17 caractères'
    }
    
    if (!formData.make.trim()) errors.make = 'La marque est requise'
    if (!formData.model.trim()) errors.model = 'Le modèle est requis'
    
    if (!formData.year) {
      errors.year = 'L\'année est requise'
    } else {
      const year = parseInt(formData.year)
      if (year < 1900 || year > new Date().getFullYear() + 1) {
        errors.year = 'Année invalide'
      }
    }
    
    if (!formData.clientId) errors.clientId = 'Le client est requis'
    
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }
  
  const handleCreate = () => {
    setEditingVehicle(null)
    setFormData({
      registrationNumber: '',
      vin: '',
      make: '',
      model: '',
      version: '',
      year: '',
      firstRegistrationDate: '',
      mileage: '',
      color: '',
      fuelType: 'ESSENCE',
      clientId: ''
    })
    setFormErrors({})
    setIsModalOpen(true)
  }
  
  const handleEdit = (vehicle: Vehicle) => {
    setEditingVehicle(vehicle)
    setFormData({
      registrationNumber: vehicle.registrationNumber,
      vin: vehicle.vin,
      make: vehicle.make,
      model: vehicle.model,
      version: vehicle.version || '',
      year: vehicle.year.toString(),
      firstRegistrationDate: vehicle.firstRegistrationDate.toISOString().split('T')[0],
      mileage: vehicle.mileage.toString(),
      color: vehicle.color || '',
      fuelType: vehicle.fuelType,
      clientId: vehicle.clientId
    })
    setFormErrors({})
    setIsModalOpen(true)
  }
  
  const handleSave = async () => {
    if (!validateForm()) {
      toast.error('Erreur', 'Veuillez corriger les erreurs du formulaire')
      return
    }
    
    setIsSaving(true)
    
    try {
      const url = editingVehicle 
        ? `/api/vehicules/${editingVehicle.id}`
        : '/api/vehicules'
      
      const method = editingVehicle ? 'PATCH' : 'POST'
      
      const payload = {
        ...formData,
        year: parseInt(formData.year),
        mileage: formData.mileage ? parseInt(formData.mileage) : undefined
      }
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      
      const data = await response.json()
      
      if (data.ok) {
        toast.success(
          editingVehicle ? 'Véhicule modifié' : 'Véhicule créé',
          'Les modifications ont été enregistrées'
        )
        setIsModalOpen(false)
        loadVehicles()
      } else {
        toast.error('Erreur', data.error || 'Impossible de sauvegarder le véhicule')
      }
      
    } catch (error) {
      console.error('Error saving vehicle:', error)
      toast.error('Erreur', 'Impossible de se connecter au serveur')
    } finally {
      setIsSaving(false)
    }
  }
  
  const handleDeleteClick = (vehicle: Vehicle) => {
    setVehicleToDelete(vehicle)
    setDeleteModalOpen(true)
  }
  
  const handleDeleteConfirm = async () => {
    if (!vehicleToDelete) return
    
    setIsDeleting(true)
    
    try {
      const response = await fetch(`/api/vehicules/${vehicleToDelete.id}`, {
        method: 'DELETE'
      })
      
      const data = await response.json()
      
      if (data.ok) {
        toast.success('Véhicule supprimé', 'Le véhicule a été supprimé avec succès')
        setDeleteModalOpen(false)
        setVehicleToDelete(null)
        loadVehicles()
      } else {
        toast.error('Erreur', data.error || 'Impossible de supprimer le véhicule')
      }
      
    } catch (error) {
      console.error('Error deleting vehicle:', error)
      toast.error('Erreur', 'Impossible de se connecter au serveur')
    } finally {
      setIsDeleting(false)
    }
  }
  
  const getFuelTypeLabel = (type: FuelType): string => {
    const labels = {
      ESSENCE: 'Essence',
      DIESEL: 'Diesel',
      HYBRID: 'Hybride',
      ELECTRIC: 'Électrique',
      GPL: 'GPL'
    }
    return labels[type]
  }
  
  const getFuelTypeBadgeVariant = (type: FuelType) => {
    const variants = {
      ESSENCE: 'default',
      DIESEL: 'neutral',
      HYBRID: 'success',
      ELECTRIC: 'info',
      GPL: 'warning'
    }
    return variants[type] as any
  }
  
  const columns = [
    {
      key: 'vehicle',
      label: 'Véhicule',
      sortable: true,
      render: (vehicle: Vehicle) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Avatar
            name={vehicle.make}
            size="md"
            shape="square"
          />
          <div>
            <div style={{ 
              fontSize: '14px', 
              fontWeight: 500, 
              color: '#111827' 
            }}>
              {vehicle.make} {vehicle.model}
            </div>
            <div style={{ 
              fontSize: '12px', 
              color: '#6B7280',
              marginTop: '2px'
            }}>
              {vehicle.version || 'Version non spécifiée'}
            </div>
          </div>
        </div>
      )
    },
    {
      key: 'registration',
      label: 'Immatriculation',
      sortable: true,
      render: (vehicle: Vehicle) => (
        <div style={{
          fontFamily: 'monospace',
          fontSize: '14px',
          fontWeight: 600,
          color: '#111827',
          backgroundColor: '#F9FAFB',
          padding: '4px 8px',
          borderRadius: '4px',
          display: 'inline-block'
        }}>
          {vehicle.registrationNumber}
        </div>
      )
    },
    {
      key: 'client',
      label: 'Propriétaire',
      sortable: true,
      render: (vehicle: Vehicle) => (
        <div style={{ 
          fontSize: '13px', 
          color: '#6B7280',
          display: 'flex',
          alignItems: 'center',
          gap: '6px'
        }}>
          <User size={14} />
          {vehicle.clientName}
        </div>
      )
    },
    {
      key: 'vin',
      label: 'VIN',
      sortable: false,
      render: (vehicle: Vehicle) => (
        <div style={{ 
          fontSize: '12px', 
          color: '#9CA3AF',
          fontFamily: 'monospace',
          display: 'flex',
          alignItems: 'center',
          gap: '6px'
        }}>
          <Hash size={12} />
          {vehicle.vin}
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
      key: 'fuel',
      label: 'Carburant',
      sortable: true,
      render: (vehicle: Vehicle) => (
        <Badge 
          variant={getFuelTypeBadgeVariant(vehicle.fuelType)}
          size="sm"
        >
          {getFuelTypeLabel(vehicle.fuelType)}
        </Badge>
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
    },
    {
      key: 'actions',
      label: 'Actions',
      sortable: false,
      render: (vehicle: Vehicle) => (
        <DropdownMenu
          trigger={
            <button
              style={{
                padding: '6px',
                backgroundColor: 'transparent',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                color: '#6B7280',
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#F9FAFB'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent'
              }}
            >
              <MoreVertical size={16} />
            </button>
          }
          items={[
            {
              id: 'view',
              label: 'Voir détails',
              icon: <Eye size={16} />,
              onClick: () => router.push(`/vehicules/${vehicle.id}`)
            },
            {
              id: 'edit',
              label: 'Modifier',
              icon: <Edit size={16} />,
              onClick: () => handleEdit(vehicle)
            },
            { id: 'separator', separator: true },
            {
              id: 'delete',
              label: 'Supprimer',
              icon: <Trash2 size={16} />,
              danger: true,
              onClick: () => handleDeleteClick(vehicle)
            }
          ]}
        />
      )
    }
  ]
  
  return (
    <div style={{ padding: '24px', maxWidth: '1600px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '24px'
      }}>
        <div>
          <h1 style={{
            fontSize: '32px',
            fontWeight: 700,
            color: '#111827',
            margin: 0,
            marginBottom: '4px'
          }}>
            Véhicules
          </h1>
          <p style={{
            fontSize: '14px',
            color: '#6B7280',
            margin: 0
          }}>
            Gérez le parc automobile de vos clients
          </p>
        </div>
        
        <div style={{ display: 'flex', gap: '12px' }}>
          <Button
            variant="secondary"
            size="lg"
            leftIcon={<Search size={20} />}
            onClick={() => setIsSivModalOpen(true)}
          >
            Recherche SIV
          </Button>
          <Button
            variant="primary"
            size="lg"
            leftIcon={<Plus size={20} />}
            onClick={handleCreate}
          >
            Nouveau véhicule
          </Button>
        </div>
      </div>
      
      {/* Filters */}
      <div style={{
        display: 'flex',
        gap: '12px',
        marginBottom: '20px',
        flexWrap: 'wrap'
      }}>
        <div style={{ flex: 1, minWidth: '300px' }}>
          <SearchInput
            placeholder="Rechercher (immatriculation, VIN, marque, modèle)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onClear={() => setSearchQuery('')}
          />
        </div>
        
        <Select
          value={clientFilter}
          onChange={(e) => setClientFilter(e.target.value)}
          options={[
            { value: 'all', label: 'Tous les clients' },
            ...clients.map(c => ({ value: c.id, label: c.name }))
          ]}
        />
        
        <Select
          value={fuelFilter}
          onChange={(e) => setFuelFilter(e.target.value)}
          options={[
            { value: 'all', label: 'Tous les carburants' },
            { value: 'ESSENCE', label: 'Essence' },
            { value: 'DIESEL', label: 'Diesel' },
            { value: 'HYBRID', label: 'Hybride' },
            { value: 'ELECTRIC', label: 'Électrique' },
            { value: 'GPL', label: 'GPL' }
          ]}
        />
      </div>
      
      {/* Table */}
      <DataTableInline
        data={vehicles}
        columns={columns}
        loading={isLoading}
        emptyState={
          <div style={{ textAlign: 'center', padding: '48px 24px' }}>
            <div style={{ fontSize: '16px', fontWeight: '600', color: '#111827', marginBottom: '8px' }}>
              Aucun véhicule
            </div>
            <div style={{ fontSize: '14px', color: '#6B7280', marginBottom: '16px' }}>
              {searchQuery 
                ? 'Aucun véhicule ne correspond à votre recherche'
                : 'Commencez par ajouter un véhicule ou utilisez la recherche SIV'}
            </div>
            {!searchQuery && (
              <Button variant="primary" onClick={() => setIsSivModalOpen(true)}>
                Recherche SIV
              </Button>
            )}
          </div>
        }
      />
      
      {/* Modal SIV */}
      <Modal
        isOpen={isSivModalOpen}
        onClose={() => setIsSivModalOpen(false)}
        title="Recherche SIV"
        size="md"
      >
        <div style={{ padding: '24px' }}>
          <p style={{
            fontSize: '14px',
            color: '#6B7280',
            lineHeight: 1.6,
            marginBottom: '20px'
          }}>
            Entrez l'immatriculation du véhicule pour récupérer automatiquement 
            ses informations depuis le Système d'Immatriculation des Véhicules.
          </p>
          
          <FormField
            label="Immatriculation"
            name="sivRegistration"
            placeholder="AB-123-CD"
            value={sivRegistration}
            onChange={(e) => setSivRegistration(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSivSearch()
            }}
            helperText="Format : AB-123-CD (nouveau) ou 123 ABC 75 (ancien)"
            autoFocus
          />
          
          <div style={{
            display: 'flex',
            gap: '12px',
            justifyContent: 'flex-end',
            marginTop: '24px'
          }}>
            <Button
              variant="secondary"
              onClick={() => setIsSivModalOpen(false)}
              disabled={sivLoading}
            >
              Annuler
            </Button>
            <Button
              variant="primary"
              onClick={handleSivSearch}
              loading={sivLoading}
              disabled={sivLoading || !sivRegistration.trim()}
              leftIcon={<Search size={20} />}
            >
              Rechercher
            </Button>
          </div>
        </div>
      </Modal>
      
      {/* Modal création/édition */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingVehicle ? 'Modifier le véhicule' : 'Nouveau véhicule'}
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
            gap: '16px'
          }}>
            <FormField
              label="Immatriculation"
              name="registrationNumber"
              placeholder="AB-123-CD"
              value={formData.registrationNumber}
              onChange={(e) => setFormData({ ...formData, registrationNumber: e.target.value })}
              error={formErrors.registrationNumber}
              required
            />
            
            <FormField
              label="VIN (17 caractères)"
              name="vin"
              placeholder="1HGBH41JXMN109186"
              value={formData.vin}
              onChange={(e) => setFormData({ ...formData, vin: e.target.value })}
              error={formErrors.vin}
              helperText="Numéro de série du véhicule"
              required
            />
          </div>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '16px'
          }}>
            <FormField
              label="Marque"
              name="make"
              placeholder="Peugeot"
              value={formData.make}
              onChange={(e) => setFormData({ ...formData, make: e.target.value })}
              error={formErrors.make}
              required
            />
            
            <FormField
              label="Modèle"
              name="model"
              placeholder="208"
              value={formData.model}
              onChange={(e) => setFormData({ ...formData, model: e.target.value })}
              error={formErrors.model}
              required
            />
          </div>
          
          <FormField
            label="Version (optionnel)"
            name="version"
            placeholder="Active, GT Line, etc."
            value={formData.version}
            onChange={(e) => setFormData({ ...formData, version: e.target.value })}
          />
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '16px'
          }}>
            <FormField
              label="Année"
              type="number"
              name="year"
              placeholder="2020"
              value={formData.year}
              onChange={(e) => setFormData({ ...formData, year: e.target.value })}
              error={formErrors.year}
              required
            />
            
            <Select
              label="Type de carburant"
              value={formData.fuelType}
              onChange={(e) => setFormData({ ...formData, fuelType: e.target.value as FuelType })}
              options={[
                { value: 'ESSENCE', label: 'Essence' },
                { value: 'DIESEL', label: 'Diesel' },
                { value: 'HYBRID', label: 'Hybride' },
                { value: 'ELECTRIC', label: 'Électrique' },
                { value: 'GPL', label: 'GPL' }
              ]}
              required
            />
          </div>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '16px'
          }}>
            <FormField
              label="1ère immatriculation (optionnel)"
              type="date"
              name="firstRegistrationDate"
              value={formData.firstRegistrationDate}
              onChange={(e) => setFormData({ ...formData, firstRegistrationDate: e.target.value })}
            />
            
            <FormField
              label="Kilométrage (optionnel)"
              type="number"
              name="mileage"
              placeholder="50000"
              value={formData.mileage}
              onChange={(e) => setFormData({ ...formData, mileage: e.target.value })}
            />
          </div>
          
          <FormField
            label="Couleur (optionnel)"
            name="color"
            placeholder="Blanc, Noir, Rouge..."
            value={formData.color}
            onChange={(e) => setFormData({ ...formData, color: e.target.value })}
          />
          
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
              onClick={() => setIsModalOpen(false)}
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
              {editingVehicle ? 'Enregistrer' : 'Créer'}
            </Button>
          </div>
        </div>
      </Modal>
      
      {/* Modal suppression */}
      <Modal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="Supprimer le véhicule"
        size="md"
      >
        <div style={{ padding: '24px' }}>
          <p style={{
            fontSize: '15px',
            color: '#6B7280',
            lineHeight: 1.6,
            margin: 0,
            marginBottom: '20px'
          }}>
            Êtes-vous sûr de vouloir supprimer le véhicule{' '}
            <strong style={{ color: '#111827' }}>
              {vehicleToDelete?.make} {vehicleToDelete?.model}
            </strong>{' '}
            ({vehicleToDelete?.registrationNumber}) ?
            {vehicleToDelete?.interventionCount && vehicleToDelete.interventionCount > 0 && (
              <span style={{ display: 'block', marginTop: '12px', color: '#DC2626' }}>
                ⚠️ Ce véhicule possède {vehicleToDelete.interventionCount} intervention(s) associée(s).
              </span>
            )}
          </p>
          
          <div style={{
            display: 'flex',
            gap: '12px',
            justifyContent: 'flex-end'
          }}>
            <Button
              variant="secondary"
              onClick={() => setDeleteModalOpen(false)}
              disabled={isDeleting}
            >
              Annuler
            </Button>
            <Button
              variant="primary"
              onClick={handleDeleteConfirm}
              loading={isDeleting}
              disabled={isDeleting}
              style={{
                backgroundColor: '#DC2626'
              }}
            >
              Supprimer
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
