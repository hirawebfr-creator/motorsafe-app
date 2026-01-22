'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { DataTableInline } from '@/components/shared/data-table-inline'
import { FormField } from '@/components/shared/form-field'
import { Textarea } from '@/components/shared/textarea'
import { Button } from '@/components/shared/button'
import { Modal } from '@/components/shared/modal'
import { Badge } from '@/components/shared/badge'
import { SearchInput } from '@/components/shared/search-input'
import { Select } from '@/components/shared/select'
import { DropdownMenu } from '@/components/shared/dropdown-menu'
import { useToast } from '@/components/shared/use-toast'
import { 
  Plus,
  MoreVertical,
  Eye,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  Clock,
  PlayCircle,
  FileSignature,
  User,
  Car
} from 'lucide-react'

type InterventionStatus = 'EN_ATTENTE' | 'EN_COURS' | 'TERMINE' | 'ANNULE'

interface Intervention {
  id: string
  number: string
  clientId: string
  clientName: string
  vehicleId: string
  vehicleInfo: string
  entryDate: Date
  exitDate?: Date
  status: InterventionStatus
  description: string
  mileage: number
  amount?: number
  isClientSigned: boolean
  isGarageSigned: boolean
  signedAt?: Date
  createdAt: Date
  updatedAt: Date
}

interface InterventionFormData {
  clientId: string
  vehicleId: string
  entryDate: string
  mileage: string
  description: string
}

interface Client {
  id: string
  name: string
}

interface Vehicle {
  id: string
  clientId: string
  info: string
}

export default function InterventionsPage() {
  const router = useRouter()
  const toast = useToast()
  
  const [interventions, setInterventions] = useState<Intervention[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [isLoading, setIsLoading] = useState(true)
  
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [clientFilter, setClientFilter] = useState<string>('all')
  
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingIntervention, setEditingIntervention] = useState<Intervention | null>(null)
  const [formData, setFormData] = useState<InterventionFormData>({
    clientId: '',
    vehicleId: '',
    entryDate: new Date().toISOString().split('T')[0],
    mileage: '',
    description: ''
  })
  const [formErrors, setFormErrors] = useState<Partial<Record<keyof InterventionFormData, string>>>({})
  const [isSaving, setIsSaving] = useState(false)
  
  const [clientVehicles, setClientVehicles] = useState<Vehicle[]>([])
  
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false)
  const [statusChangeIntervention, setStatusChangeIntervention] = useState<Intervention | null>(null)
  const [newStatus, setNewStatus] = useState<InterventionStatus>('EN_ATTENTE')
  const [statusComment, setStatusComment] = useState('')
  const [isChangingStatus, setIsChangingStatus] = useState(false)
  
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [interventionToDelete, setInterventionToDelete] = useState<Intervention | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  
  useEffect(() => {
    loadInterventions()
    loadClients()
    loadVehicles()
  }, [searchQuery, statusFilter, clientFilter])
  
  useEffect(() => {
    if (formData.clientId) {
      const filtered = vehicles.filter(v => v.clientId === formData.clientId)
      setClientVehicles(filtered)
      
      if (formData.vehicleId && !filtered.find(v => v.id === formData.vehicleId)) {
        setFormData(prev => ({ ...prev, vehicleId: '' }))
      }
    } else {
      setClientVehicles([])
    }
  }, [formData.clientId, vehicles])
  
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
        { id: '3', name: 'Pierre Dubois' }
      ])
    }
  }
  
  const loadVehicles = async () => {
    try {
      const response = await fetch('/api/vehicules')
      const data = await response.json()
      
      if (data.ok && data.data && Array.isArray(data.data.items)) {
        setVehicles(data.data.items.map((v: any) => ({
          id: v.id,
          clientId: v.clientId,
          info: `${v.make} ${v.model} - ${v.registrationNumber}`
        })))
      } else {
        console.error('Error loading vehicles:', data.error || 'Invalid response')
      }
    } catch (error) {
      console.error('Error loading vehicles:', error)
      // Fallback
      setVehicles([
        { id: '1', clientId: '1', info: 'Peugeot 208 - AB-123-CD' },
        { id: '2', clientId: '1', info: 'Renault Clio - EF-456-GH' },
        { id: '3', clientId: '2', info: 'Citroën C3 - IJ-789-KL' },
        { id: '4', clientId: '3', info: 'Tesla Model 3 - MN-012-OP' }
      ])
    }
  }
  
  const loadInterventions = async () => {
    setIsLoading(true)
    
    try {
      const params = new URLSearchParams()
      if (searchQuery) params.set('q', searchQuery)
      if (statusFilter !== 'all') params.set('status', statusFilter)
      if (clientFilter !== 'all') params.set('clientId', clientFilter)
      params.set('page', '1')
      params.set('pageSize', '100')
      
      const response = await fetch(`/api/interventions?${params}`)
      const data = await response.json()
      
      if (data.ok && data.data && Array.isArray(data.data.items)) {
        setInterventions(data.data.items)
      } else {
        console.error('Error loading interventions:', data.error || 'Invalid response format')
        toast.error('Erreur', 'Impossible de charger les interventions')
      }
      
    } catch (error) {
      console.error('Error loading interventions:', error)
      toast.error('Erreur', 'Impossible de se connecter au serveur')
      
      // Fallback sur données simulées
      const mockInterventions: Intervention[] = [
        {
          id: '1',
          number: 'INT-2024-001',
          clientId: '1',
          clientName: 'Jean Dupont',
          vehicleId: '1',
          vehicleInfo: 'Peugeot 208 - AB-123-CD',
          entryDate: new Date('2024-01-15'),
          status: 'TERMINE',
          description: 'Révision 20 000 km + changement plaquettes',
          mileage: 20000,
          amount: 450.00,
          isClientSigned: true,
          isGarageSigned: true,
          signedAt: new Date('2024-01-16'),
          createdAt: new Date('2024-01-15'),
          updatedAt: new Date('2024-01-16')
        },
        {
          id: '2',
          number: 'INT-2024-002',
          clientId: '2',
          clientName: 'Marie Martin',
          vehicleId: '3',
          vehicleInfo: 'Citroën C3 - IJ-789-KL',
          entryDate: new Date('2024-01-20'),
          status: 'EN_COURS',
          description: 'Diagnostic électronique + réparation essuie-glaces',
          mileage: 35000,
          isClientSigned: true,
          isGarageSigned: false,
          createdAt: new Date('2024-01-20'),
          updatedAt: new Date('2024-01-20')
        },
        {
          id: '3',
          number: 'INT-2024-003',
          clientId: '1',
          clientName: 'Jean Dupont',
          vehicleId: '2',
          vehicleInfo: 'Renault Clio - EF-456-GH',
          entryDate: new Date('2024-01-22'),
          status: 'EN_ATTENTE',
          description: 'Contrôle technique + réparations éventuelles',
          mileage: 62000,
          isClientSigned: false,
          isGarageSigned: false,
          createdAt: new Date('2024-01-22'),
          updatedAt: new Date('2024-01-22')
        },
        {
          id: '4',
          number: 'INT-2024-004',
          clientId: '3',
          clientName: 'Pierre Dubois',
          vehicleId: '4',
          vehicleInfo: 'Tesla Model 3 - MN-012-OP',
          entryDate: new Date('2024-01-10'),
          exitDate: new Date('2024-01-11'),
          status: 'ANNULE',
          description: 'Révision annuelle',
          mileage: 15000,
          isClientSigned: false,
          isGarageSigned: false,
          createdAt: new Date('2024-01-10'),
          updatedAt: new Date('2024-01-11')
        }
      ]
      
      let filtered = mockInterventions
      
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        filtered = filtered.filter(i => 
          i.number.toLowerCase().includes(query) ||
          i.clientName.toLowerCase().includes(query) ||
          i.vehicleInfo.toLowerCase().includes(query)
        )
      }
      
      if (statusFilter !== 'all') {
        filtered = filtered.filter(i => i.status === statusFilter)
      }
      
      if (clientFilter !== 'all') {
        filtered = filtered.filter(i => i.clientId === clientFilter)
      }
      
      setInterventions(filtered)
      
    } finally {
      setIsLoading(false)
    }
  }
  
  const validateForm = (): boolean => {
    const errors: Partial<Record<keyof InterventionFormData, string>> = {}
    
    if (!formData.clientId) errors.clientId = 'Le client est requis'
    if (!formData.vehicleId) errors.vehicleId = 'Le véhicule est requis'
    if (!formData.entryDate) errors.entryDate = 'La date d\'entrée est requise'
    
    if (!formData.mileage) {
      errors.mileage = 'Le kilométrage est requis'
    } else if (parseInt(formData.mileage) < 0) {
      errors.mileage = 'Le kilométrage ne peut pas être négatif'
    }
    
    if (!formData.description.trim()) {
      errors.description = 'La description est requise'
    }
    
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }
  
  const handleCreate = () => {
    setEditingIntervention(null)
    setFormData({
      clientId: '',
      vehicleId: '',
      entryDate: new Date().toISOString().split('T')[0],
      mileage: '',
      description: ''
    })
    setFormErrors({})
    setIsModalOpen(true)
  }
  
  const handleEdit = (intervention: Intervention) => {
    setEditingIntervention(intervention)
    setFormData({
      clientId: intervention.clientId,
      vehicleId: intervention.vehicleId,
      entryDate: intervention.entryDate.toISOString().split('T')[0],
      mileage: intervention.mileage.toString(),
      description: intervention.description
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
      const url = editingIntervention 
        ? `/api/interventions/${editingIntervention.id}`
        : '/api/interventions'
      
      const method = editingIntervention ? 'PATCH' : 'POST'
      
      const payload = {
        ...formData,
        mileage: parseInt(formData.mileage)
      }
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      
      const data = await response.json()
      
      if (data.ok) {
        toast.success(
          editingIntervention ? 'Intervention modifiée' : 'Intervention créée',
          'Les modifications ont été enregistrées'
        )
        setIsModalOpen(false)
        loadInterventions()
      } else {
        toast.error('Erreur', data.error || 'Impossible de sauvegarder l\'intervention')
      }
      
    } catch (error) {
      console.error('Error saving intervention:', error)
      toast.error('Erreur', 'Impossible de se connecter au serveur')
    } finally {
      setIsSaving(false)
    }
  }
  
  const handleStatusChangeClick = (intervention: Intervention) => {
    setStatusChangeIntervention(intervention)
    
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
  
  const handleStatusChange = async () => {
    if (!statusChangeIntervention) return
    
    setIsChangingStatus(true)
    
    try {
      const response = await fetch(`/api/interventions/${statusChangeIntervention.id}/status`, {
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
        setStatusChangeIntervention(null)
        loadInterventions()
      } else {
        toast.error('Erreur', data.error || 'Impossible de changer le statut')
      }
      
    } catch (error) {
      console.error('Error changing status:', error)
      toast.error('Erreur', 'Impossible de se connecter au serveur')
    } finally {
      setIsChangingStatus(false)
    }
  }
  
  const handleDeleteClick = (intervention: Intervention) => {
    setInterventionToDelete(intervention)
    setDeleteModalOpen(true)
  }
  
  const handleDeleteConfirm = async () => {
    if (!interventionToDelete) return
    
    setIsDeleting(true)
    
    try {
      const response = await fetch(`/api/interventions/${interventionToDelete.id}`, {
        method: 'DELETE'
      })
      
      const data = await response.json()
      
      if (data.ok) {
        toast.success('Intervention supprimée', 'L\'intervention a été supprimée avec succès')
        setDeleteModalOpen(false)
        setInterventionToDelete(null)
        loadInterventions()
      } else {
        toast.error('Erreur', data.error || 'Impossible de supprimer l\'intervention')
      }
      
    } catch (error) {
      console.error('Error deleting intervention:', error)
      toast.error('Erreur', 'Impossible de se connecter au serveur')
    } finally {
      setIsDeleting(false)
    }
  }
  
  const getStatusLabel = (status: InterventionStatus): string => {
    const labels = {
      EN_ATTENTE: 'En attente',
      EN_COURS: 'En cours',
      TERMINE: 'Terminée',
      ANNULE: 'Annulée'
    }
    return labels[status]
  }
  
  const getStatusBadgeVariant = (status: InterventionStatus) => {
    const variants = {
      EN_ATTENTE: 'warning',
      EN_COURS: 'info',
      TERMINE: 'success',
      ANNULE: 'error'
    }
    return variants[status] as any
  }
  
  const getStatusIcon = (status: InterventionStatus) => {
    const icons = {
      EN_ATTENTE: <Clock size={16} />,
      EN_COURS: <PlayCircle size={16} />,
      TERMINE: <CheckCircle size={16} />,
      ANNULE: <XCircle size={16} />
    }
    return icons[status]
  }
  
  const formatCurrency = (amount?: number): string => {
    if (!amount) return '-'
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount)
  }
  
  const columns = [
    {
      key: 'number',
      label: 'Numéro',
      sortable: true,
      render: (intervention: Intervention) => (
        <div>
          <div style={{
            fontFamily: 'monospace',
            fontSize: '14px',
            fontWeight: 600,
            color: '#111827'
          }}>
            {intervention.number}
          </div>
          <div style={{ 
            fontSize: '12px', 
            color: '#9CA3AF',
            marginTop: '2px'
          }}>
            {new Date(intervention.entryDate).toLocaleDateString('fr-FR')}
          </div>
        </div>
      )
    },
    {
      key: 'client',
      label: 'Client & Véhicule',
      sortable: true,
      render: (intervention: Intervention) => (
        <div>
          <div style={{ 
            fontSize: '14px', 
            fontWeight: 500, 
            color: '#111827',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            marginBottom: '4px'
          }}>
            <User size={14} />
            {intervention.clientName}
          </div>
          <div style={{ 
            fontSize: '12px', 
            color: '#6B7280',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}>
            <Car size={12} />
            {intervention.vehicleInfo}
          </div>
        </div>
      )
    },
    {
      key: 'status',
      label: 'Statut',
      sortable: true,
      render: (intervention: Intervention) => (
        <Badge 
          variant={getStatusBadgeVariant(intervention.status)}
        >
          {getStatusLabel(intervention.status)}
        </Badge>
      )
    },
    {
      key: 'description',
      label: 'Description',
      sortable: false,
      render: (intervention: Intervention) => (
        <div style={{
          fontSize: '13px',
          color: '#6B7280',
          maxWidth: '300px',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap'
        }}>
          {intervention.description}
        </div>
      )
    },
    {
      key: 'amount',
      label: 'Montant',
      sortable: true,
      render: (intervention: Intervention) => (
        <div style={{
          fontSize: '14px',
          fontWeight: 600,
          color: intervention.amount ? '#111827' : '#9CA3AF'
        }}>
          {formatCurrency(intervention.amount)}
        </div>
      )
    },
    {
      key: 'signatures',
      label: 'Signatures',
      sortable: false,
      render: (intervention: Intervention) => (
        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
          <Badge 
            variant={intervention.isClientSigned ? 'success' : 'neutral'}
            size="sm"
          >
            {intervention.isClientSigned ? '✓' : '○'} Client
          </Badge>
          <Badge 
            variant={intervention.isGarageSigned ? 'success' : 'neutral'}
            size="sm"
          >
            {intervention.isGarageSigned ? '✓' : '○'} Atelier
          </Badge>
        </div>
      )
    },
    {
      key: 'actions',
      label: 'Actions',
      sortable: false,
      render: (intervention: Intervention) => (
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
              onClick: () => router.push(`/interventions/${intervention.id}`)
            },
            {
              id: 'edit',
              label: 'Modifier',
              icon: <Edit size={16} />,
              onClick: () => handleEdit(intervention),
              disabled: intervention.status === 'TERMINE' || intervention.status === 'ANNULE'
            },
            {
              id: 'status',
              label: 'Changer statut',
              icon: getStatusIcon(intervention.status),
              onClick: () => handleStatusChangeClick(intervention),
              disabled: intervention.status === 'TERMINE' || intervention.status === 'ANNULE'
            },
            { id: 'separator', separator: true },
            {
              id: 'signature',
              label: 'Signatures',
              icon: <FileSignature size={16} />,
              onClick: () => router.push(`/interventions/${intervention.id}/signatures`)
            },
            { id: 'separator2', separator: true },
            {
              id: 'delete',
              label: 'Supprimer',
              icon: <Trash2 size={16} />,
              danger: true,
              onClick: () => handleDeleteClick(intervention)
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
            Interventions
          </h1>
          <p style={{
            fontSize: '14px',
            color: '#6B7280',
            margin: 0
          }}>
            Gérez toutes vos interventions et dossiers techniques
          </p>
        </div>
        
        <Button
          variant="primary"
          size="lg"
          leftIcon={<Plus size={20} />}
          onClick={handleCreate}
        >
          Nouvelle intervention
        </Button>
      </div>
      
      {/* Filters */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '12px',
        marginBottom: '20px'
      }}>
        <div style={{ gridColumn: 'span 2' }}>
          <SearchInput
            placeholder="Rechercher (numéro, client, véhicule)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onClear={() => setSearchQuery('')}
          />
        </div>
        
        <Select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          options={[
            { value: 'all', label: 'Tous les statuts' },
            { value: 'EN_ATTENTE', label: 'En attente' },
            { value: 'EN_COURS', label: 'En cours' },
            { value: 'TERMINE', label: 'Terminées' },
            { value: 'ANNULE', label: 'Annulées' }
          ]}
        />
        
        <Select
          value={clientFilter}
          onChange={(e) => setClientFilter(e.target.value)}
          options={[
            { value: 'all', label: 'Tous les clients' },
            ...clients.map(c => ({ value: c.id, label: c.name }))
          ]}
        />
      </div>
      
      {/* Table */}
      <DataTableInline
        data={interventions}
        columns={columns}
        loading={isLoading}
        emptyState={
          <div style={{ textAlign: 'center', padding: '48px 24px' }}>
            <div style={{ fontSize: '16px', fontWeight: '600', color: '#111827', marginBottom: '8px' }}>
              Aucune intervention
            </div>
            <div style={{ fontSize: '14px', color: '#6B7280', marginBottom: '16px' }}>
              {searchQuery 
                ? 'Aucune intervention ne correspond à votre recherche'
                : 'Commencez par créer votre première intervention'}
            </div>
            {!searchQuery && (
              <Button variant="primary" onClick={handleCreate}>
                Nouvelle intervention
              </Button>
            )}
          </div>
        }
      />
      
      {/* Modal création/édition */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingIntervention ? 'Modifier l\'intervention' : 'Nouvelle intervention'}
        size="lg"
      >
        <div style={{ padding: '24px' }}>
          <Select
            label="Client"
            value={formData.clientId}
            onChange={(e) => setFormData({ ...formData, clientId: e.target.value, vehicleId: '' })}
            options={[
              { value: '', label: 'Sélectionner un client' },
              ...clients.map(c => ({ value: c.id, label: c.name }))
            ]}
            error={formErrors.clientId}
            required
          />
          
          <Select
            label="Véhicule"
            value={formData.vehicleId}
            onChange={(e) => setFormData({ ...formData, vehicleId: e.target.value })}
            options={[
              { value: '', label: 'Sélectionner un véhicule' },
              ...clientVehicles.map(v => ({ value: v.id, label: v.info }))
            ]}
            error={formErrors.vehicleId}
            disabled={!formData.clientId}
            helperText={!formData.clientId ? 'Sélectionnez d\'abord un client' : undefined}
            required
          />
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '16px'
          }}>
            <FormField
              label="Date d'entrée"
              type="date"
              name="entryDate"
              value={formData.entryDate}
              onChange={(e) => setFormData({ ...formData, entryDate: e.target.value })}
              error={formErrors.entryDate}
              required
            />
            
            <FormField
              label="Kilométrage"
              type="number"
              name="mileage"
              placeholder="50000"
              value={formData.mileage}
              onChange={(e) => setFormData({ ...formData, mileage: e.target.value })}
              error={formErrors.mileage}
              required
            />
          </div>
          
          <Textarea
            label="Description des travaux"
            name="description"
            placeholder="Détaillez les interventions à réaliser..."
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            errorText={formErrors.description}
            rows={5}
            required
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
              {editingIntervention ? 'Enregistrer' : 'Créer'}
            </Button>
          </div>
        </div>
      </Modal>
      
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
            Intervention : <strong>{statusChangeIntervention?.number}</strong>
          </p>
          
          <Select
            label="Nouveau statut"
            value={newStatus}
            onChange={(e) => setNewStatus(e.target.value as InterventionStatus)}
            options={
              statusChangeIntervention
                ? getAvailableStatuses(statusChangeIntervention.status).map(s => ({
                    value: s,
                    label: getStatusLabel(s)
                  }))
                : []
            }
          />
          
          <Textarea
            label="Commentaire (optionnel)"
            name="statusComment"
            placeholder="Raison du changement de statut..."
            value={statusComment}
            onChange={(e) => setStatusComment(e.target.value)}
            rows={3}
          />
          
          <div style={{
            display: 'flex',
            gap: '12px',
            justifyContent: 'flex-end',
            marginTop: '24px'
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
      
      {/* Modal suppression */}
      <Modal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="Supprimer l'intervention"
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
            Êtes-vous sûr de vouloir supprimer l'intervention{' '}
            <strong style={{ color: '#111827' }}>
              {interventionToDelete?.number}
            </strong> ?
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
