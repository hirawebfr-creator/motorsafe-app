'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { DataTableInline } from '@/components/shared/data-table-inline'
import { FormField } from '@/components/shared/form-field'
import { Button } from '@/components/shared/button'
import { Modal } from '@/components/shared/modal'
import { Badge } from '@/components/shared/badge'
import { SearchInput } from '@/components/shared/search-input'
import { DropdownMenu } from '@/components/shared/dropdown-menu'
import { useToast } from '@/components/shared/use-toast'
import { 
  UserPlus, 
  MoreVertical,
  Eye,
  Edit,
  Trash2,
  Phone,
  Mail,
  MapPin
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
  vehicleCount: number
  status: 'ACTIVE' | 'INACTIVE'
  createdAt: Date
  updatedAt: Date
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

export default function ClientsPage() {
  const router = useRouter()
  const toast = useToast()
  
  const [clients, setClients] = useState<Client[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'ACTIVE' | 'INACTIVE'>('all')
  
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingClient, setEditingClient] = useState<Client | null>(null)
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
  
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [clientToDelete, setClientToDelete] = useState<Client | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  
  useEffect(() => {
    loadClients()
  }, [searchQuery, statusFilter])
  
  const loadClients = async () => {
    setIsLoading(true)
    
    try {
      const params = new URLSearchParams()
      if (searchQuery) params.set('search', searchQuery)
      if (statusFilter !== 'all') params.set('status', statusFilter)
      params.set('page', '1')
      params.set('limit', '100')
      
      const response = await fetch(`/api/clients?${params}`)
      const data = await response.json()
      
      if (data.ok && data.data && Array.isArray(data.data.items)) {
        // Transformer les dates si nécessaire
        const clientsWithDates = data.data.items.map((c: Client & { createdAt?: string; updatedAt?: string }) => ({
          ...c,
          createdAt: c.createdAt ? new Date(c.createdAt) : new Date(),
          updatedAt: c.updatedAt ? new Date(c.updatedAt) : new Date()
        }))
        setClients(clientsWithDates)
      } else {
        console.error('Error loading clients:', data.error || 'Invalid response format')
        toast.error('Erreur', 'Impossible de charger les clients')
      }
      
    } catch (error) {
      console.error('Error loading clients:', error)
      toast.error('Erreur', 'Impossible de se connecter au serveur')
      
      // Fallback sur données simulées en cas d'erreur réseau
      const mockClients: Client[] = [
        {
          id: '1',
          firstName: 'Jean',
          lastName: 'Dupont',
          email: 'jean.dupont@email.fr',
          phone: '06 12 34 56 78',
          address: '12 Rue de la République',
          postalCode: '75001',
          city: 'Paris',
          vehicleCount: 2,
          status: 'ACTIVE',
          createdAt: new Date('2024-01-15'),
          updatedAt: new Date('2024-01-15')
        },
        {
          id: '2',
          firstName: 'Marie',
          lastName: 'Martin',
          email: 'marie.martin@email.fr',
          phone: '06 98 76 54 32',
          address: '8 Avenue des Fleurs',
          postalCode: '69002',
          city: 'Lyon',
          vehicleCount: 1,
          status: 'ACTIVE',
          createdAt: new Date('2024-02-20'),
          updatedAt: new Date('2024-02-20')
        },
        {
          id: '3',
          firstName: 'Pierre',
          lastName: 'Dubois',
          email: 'pierre.dubois@email.fr',
          phone: '07 11 22 33 44',
          address: '45 Boulevard du Lac',
          postalCode: '33000',
          city: 'Bordeaux',
          vehicleCount: 3,
          status: 'ACTIVE',
          createdAt: new Date('2024-03-10'),
          updatedAt: new Date('2024-03-10')
        },
        {
          id: '4',
          firstName: 'Sophie',
          lastName: 'Blanc',
          email: 'sophie.blanc@email.fr',
          phone: '06 55 66 77 88',
          address: '3 Rue du Commerce',
          postalCode: '13001',
          city: 'Marseille',
          vehicleCount: 0,
          status: 'INACTIVE',
          createdAt: new Date('2023-12-05'),
          updatedAt: new Date('2024-01-10')
        }
      ]
      
      let filtered = mockClients
      
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        filtered = filtered.filter(c => 
          c.firstName.toLowerCase().includes(query) ||
          c.lastName.toLowerCase().includes(query) ||
          c.email.toLowerCase().includes(query) ||
          c.phone.includes(query)
        )
      }
      
      if (statusFilter !== 'all') {
        filtered = filtered.filter(c => c.status === statusFilter)
      }
      
      setClients(filtered)
      
    } finally {
      setIsLoading(false)
    }
  }
  
  const validateForm = (): boolean => {
    const errors: Partial<Record<keyof ClientFormData, string>> = {}
    
    if (!formData.firstName.trim()) errors.firstName = 'Le prénom est requis'
    if (!formData.lastName.trim()) errors.lastName = 'Le nom est requis'
    
    if (!formData.email.trim()) {
      errors.email = 'L\'email est requis'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Format d\'email invalide'
    }
    
    if (!formData.phone.trim()) {
      errors.phone = 'Le téléphone est requis'
    } else if (!/^0[1-9]\d{8}$/.test(formData.phone.replace(/\s/g, ''))) {
      errors.phone = 'Format de téléphone invalide (10 chiffres)'
    }
    
    if (!formData.address.trim()) errors.address = 'L\'adresse est requise'
    
    if (!formData.postalCode.trim()) {
      errors.postalCode = 'Le code postal est requis'
    } else if (!/^\d{5}$/.test(formData.postalCode)) {
      errors.postalCode = 'Code postal invalide (5 chiffres)'
    }
    
    if (!formData.city.trim()) errors.city = 'La ville est requise'
    
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }
  
  const handleCreate = () => {
    setEditingClient(null)
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      address: '',
      postalCode: '',
      city: ''
    })
    setFormErrors({})
    setIsModalOpen(true)
  }
  
  const handleEdit = (client: Client) => {
    setEditingClient(client)
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
    setIsModalOpen(true)
  }
  
  const handleSave = async () => {
    if (!validateForm()) {
      toast.error('Erreur', 'Veuillez corriger les erreurs du formulaire')
      return
    }
    
    setIsSaving(true)
    
    try {
      const url = editingClient 
        ? `/api/clients/${editingClient.id}`
        : '/api/clients'
      
      const method = editingClient ? 'PATCH' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
      
      const data = await response.json()
      
      if (data.ok) {
        toast.success(
          editingClient ? 'Client modifié' : 'Client créé',
          'Les modifications ont été enregistrées'
        )
        setIsModalOpen(false)
        loadClients()
      } else {
        toast.error('Erreur', data.error || 'Impossible de sauvegarder le client')
      }
      
    } catch (error) {
      console.error('Error saving client:', error)
      toast.error('Erreur', 'Impossible de se connecter au serveur')
    } finally {
      setIsSaving(false)
    }
  }
  
  const handleDeleteClick = (client: Client) => {
    setClientToDelete(client)
    setDeleteModalOpen(true)
  }
  
  const handleDeleteConfirm = async () => {
    if (!clientToDelete) return
    
    setIsDeleting(true)
    
    try {
      const response = await fetch(`/api/clients/${clientToDelete.id}`, {
        method: 'DELETE'
      })
      
      const data = await response.json()
      
      if (data.ok) {
        toast.success('Client supprimé', 'Le client a été supprimé avec succès')
        setDeleteModalOpen(false)
        setClientToDelete(null)
        loadClients()
      } else {
        toast.error('Erreur', data.error || 'Impossible de supprimer le client')
      }
      
    } catch (error) {
      console.error('Error deleting client:', error)
      toast.error('Erreur', 'Impossible de se connecter au serveur')
    } finally {
      setIsDeleting(false)
    }
  }
  
  const columns = [
    {
      key: 'name',
      label: 'Nom',
      sortable: true,
      render: (client: Client) => (
        <div>
          <div style={{ 
            fontSize: '14px', 
            fontWeight: 500, 
            color: '#111827' 
          }}>
            {client.firstName} {client.lastName}
          </div>
          <div style={{ 
            fontSize: '12px', 
            color: '#6B7280',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            marginTop: '2px'
          }}>
            <Mail size={12} />
            {client.email}
          </div>
        </div>
      )
    },
    {
      key: 'phone',
      label: 'Téléphone',
      sortable: false,
      render: (client: Client) => (
        <div style={{ 
          fontSize: '13px', 
          color: '#6B7280',
          display: 'flex',
          alignItems: 'center',
          gap: '6px'
        }}>
          <Phone size={14} />
          {client.phone}
        </div>
      )
    },
    {
      key: 'city',
      label: 'Ville',
      sortable: true,
      render: (client: Client) => (
        <div style={{ 
          fontSize: '13px', 
          color: '#6B7280',
          display: 'flex',
          alignItems: 'center',
          gap: '6px'
        }}>
          <MapPin size={14} />
          {client.city}
        </div>
      )
    },
    {
      key: 'vehicleCount',
      label: 'Véhicules',
      sortable: true,
      render: (client: Client) => (
        <Badge variant={client.vehicleCount > 0 ? 'default' : 'neutral'}>
          {client.vehicleCount}
        </Badge>
      )
    },
    {
      key: 'status',
      label: 'Statut',
      sortable: true,
      render: (client: Client) => (
        <Badge 
          variant={client.status === 'ACTIVE' ? 'success' : 'neutral'}
          dot
        >
          {client.status === 'ACTIVE' ? 'Actif' : 'Inactif'}
        </Badge>
      )
    },
    {
      key: 'actions',
      label: 'Actions',
      sortable: false,
      render: (client: Client) => (
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
              onClick: () => router.push(`/clients/${client.id}`)
            },
            {
              id: 'edit',
              label: 'Modifier',
              icon: <Edit size={16} />,
              onClick: () => handleEdit(client)
            },
            { id: 'separator', separator: true },
            {
              id: 'delete',
              label: 'Supprimer',
              icon: <Trash2 size={16} />,
              danger: true,
              onClick: () => handleDeleteClick(client)
            }
          ]}
        />
      )
    }
  ]
  
  return (
    <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
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
            Clients
          </h1>
          <p style={{
            fontSize: '14px',
            color: '#6B7280',
            margin: 0
          }}>
            Gérez vos clients et leurs informations
          </p>
        </div>
        
        <Button
          variant="primary"
          size="lg"
          leftIcon={<UserPlus size={20} />}
          onClick={handleCreate}
        >
          Nouveau client
        </Button>
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
            placeholder="Rechercher un client (nom, email, téléphone)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onClear={() => setSearchQuery('')}
          />
        </div>
        
        <div style={{
          display: 'flex',
          gap: '8px',
          backgroundColor: '#F9FAFB',
          padding: '4px',
          borderRadius: '8px',
          border: '1px solid #E5E7EB'
        }}>
          {[
            { value: 'all', label: 'Tous' },
            { value: 'ACTIVE', label: 'Actifs' },
            { value: 'INACTIVE', label: 'Inactifs' }
          ].map((option) => (
            <button
              key={option.value}
              onClick={() => setStatusFilter(option.value as typeof statusFilter)}
              style={{
                padding: '8px 16px',
                fontSize: '14px',
                fontWeight: 500,
                color: statusFilter === option.value ? '#FFFFFF' : '#6B7280',
                backgroundColor: statusFilter === option.value ? '#0A1628' : 'transparent',
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
      
      {/* Table */}
      <DataTableInline
        data={clients}
        columns={columns}
        loading={isLoading}
        emptyState={
          <div style={{ textAlign: 'center', padding: '48px 24px' }}>
            <div style={{ fontSize: '16px', fontWeight: '600', color: '#111827', marginBottom: '8px' }}>
              Aucun client
            </div>
            <div style={{ fontSize: '14px', color: '#6B7280', marginBottom: '16px' }}>
              {searchQuery 
                ? 'Aucun client ne correspond à votre recherche'
                : 'Commencez par créer votre premier client'}
            </div>
            {!searchQuery && (
              <Button variant="primary" onClick={handleCreate}>
                Nouveau client
              </Button>
            )}
          </div>
        }
      />
      
      {/* Modal création/édition */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingClient ? 'Modifier le client' : 'Nouveau client'}
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
            placeholder="06 12 34 56 78"
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
              placeholder="75001"
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
              {editingClient ? 'Enregistrer' : 'Créer'}
            </Button>
          </div>
        </div>
      </Modal>
      
      {/* Modal suppression */}
      <Modal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="Supprimer le client"
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
            Êtes-vous sûr de vouloir supprimer le client{' '}
            <strong style={{ color: '#111827' }}>
              {clientToDelete?.firstName} {clientToDelete?.lastName}
            </strong> ?
            {clientToDelete?.vehicleCount && clientToDelete.vehicleCount > 0 && (
              <span style={{ display: 'block', marginTop: '12px', color: '#DC2626' }}>
                ⚠️ Ce client possède {clientToDelete.vehicleCount} véhicule(s) associé(s).
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

