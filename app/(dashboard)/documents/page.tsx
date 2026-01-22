'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Tabs } from '@/components/shared/tabs'
import { DataTableInline } from '@/components/shared/data-table-inline'
import { FormField } from '@/components/shared/form-field'
import { Button } from '@/components/shared/button'
import { Modal } from '@/components/shared/modal'
import { Badge } from '@/components/shared/badge'
import { SearchInput } from '@/components/shared/search-input'
import { Select } from '@/components/shared/select'
import { DropdownMenu } from '@/components/shared/dropdown-menu'
import { useToast } from '@/components/shared/use-toast'
import { 
  FileText,
  Plus,
  Download,
  Mail,
  MoreVertical,
  Trash2,
  Package
} from 'lucide-react'

type DocumentType = 'DEVIS' | 'FACTURE' | 'EXPORT'
type DevisStatus = 'BROUILLON' | 'ENVOYE' | 'ACCEPTE' | 'REFUSE'
type FactureStatus = 'BROUILLON' | 'ENVOYEE' | 'PAYEE' | 'IMPAYEE'
type ExportType = 'ASSURANCE' | 'EXPERT' | 'COMPLET'

interface Devis {
  id: string
  number: string
  interventionId: string
  interventionNumber: string
  clientName: string
  vehicleInfo: string
  amount: number
  status: DevisStatus
  validUntil: Date
  createdAt: Date
  pdfUrl?: string
}

interface Facture {
  id: string
  number: string
  interventionId: string
  interventionNumber: string
  clientName: string
  vehicleInfo: string
  amount: number
  status: FactureStatus
  paidAt?: Date
  dueDate: Date
  createdAt: Date
  pdfUrl?: string
}

interface Export {
  id: string
  number: string
  type: ExportType
  interventionId: string
  interventionNumber: string
  clientName: string
  vehicleInfo: string
  requestedBy: string
  createdAt: Date
  zipUrl?: string
}

interface Intervention {
  id: string
  number: string
  clientName: string
  vehicleInfo: string
}

export default function DocumentsPage() {
  const router = useRouter()
  const toast = useToast()
  
  const [activeTab, setActiveTab] = useState<DocumentType>('DEVIS')
  
  const [devis, setDevis] = useState<Devis[]>([])
  const [factures, setFactures] = useState<Facture[]>([])
  const [exports, setExports] = useState<Export[]>([])
  const [interventions, setInterventions] = useState<Intervention[]>([])
  const [isLoading, setIsLoading] = useState(true)
  
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  
  const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false)
  const [generateType, setGenerateType] = useState<DocumentType>('DEVIS')
  const [selectedInterventionId, setSelectedInterventionId] = useState('')
  const [exportType, setExportType] = useState<ExportType>('ASSURANCE')
  const [sendEmail, setSendEmail] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [documentToDelete, setDocumentToDelete] = useState<any>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  
  useEffect(() => {
    loadInterventions()
  }, [])
  
  useEffect(() => {
    if (activeTab === 'DEVIS') loadDevis()
    else if (activeTab === 'FACTURE') loadFactures()
    else loadExports()
  }, [activeTab, searchQuery, statusFilter])
  
  const loadInterventions = async () => {
    try {
      // TODO: Remplacer par vraie API /api/interventions?status=TERMINE
      setInterventions([
        { id: '1', number: 'INT-2024-001', clientName: 'Jean Dupont', vehicleInfo: 'Peugeot 208 - AB-123-CD' },
        { id: '2', number: 'INT-2024-002', clientName: 'Marie Martin', vehicleInfo: 'Citroën C3 - IJ-789-KL' }
      ])
    } catch (error) {
      toast.error('Erreur', 'Impossible de charger les interventions')
    }
  }
  
  const loadDevis = async () => {
    setIsLoading(true)
    
    try {
      // TODO: Remplacer par vraie API /api/documents/devis
      const mockDevis: Devis[] = [
        {
          id: '1',
          number: 'DEV-2024-001',
          interventionId: '1',
          interventionNumber: 'INT-2024-001',
          clientName: 'Jean Dupont',
          vehicleInfo: 'Peugeot 208 - AB-123-CD',
          amount: 450.00,
          status: 'ACCEPTE',
          validUntil: new Date('2024-02-15'),
          createdAt: new Date('2024-01-15'),
          pdfUrl: '/documents/dev-2024-001.pdf'
        },
        {
          id: '2',
          number: 'DEV-2024-002',
          interventionId: '2',
          interventionNumber: 'INT-2024-002',
          clientName: 'Marie Martin',
          vehicleInfo: 'Citroën C3 - IJ-789-KL',
          amount: 320.00,
          status: 'ENVOYE',
          validUntil: new Date('2024-02-20'),
          createdAt: new Date('2024-01-20')
        }
      ]
      
      let filtered = mockDevis
      
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        filtered = filtered.filter(d => 
          d.number.toLowerCase().includes(query) ||
          d.clientName.toLowerCase().includes(query)
        )
      }
      
      if (statusFilter !== 'all') {
        filtered = filtered.filter(d => d.status === statusFilter)
      }
      
      setDevis(filtered)
    } catch (error) {
      toast.error('Erreur', 'Impossible de charger les devis')
    } finally {
      setIsLoading(false)
    }
  }
  
  const loadFactures = async () => {
    setIsLoading(true)
    
    try {
      // TODO: Remplacer par vraie API /api/documents/factures
      const mockFactures: Facture[] = [
        {
          id: '1',
          number: 'FAC-2024-001',
          interventionId: '1',
          interventionNumber: 'INT-2024-001',
          clientName: 'Jean Dupont',
          vehicleInfo: 'Peugeot 208 - AB-123-CD',
          amount: 450.00,
          status: 'PAYEE',
          paidAt: new Date('2024-01-18'),
          dueDate: new Date('2024-02-15'),
          createdAt: new Date('2024-01-16'),
          pdfUrl: '/documents/fac-2024-001.pdf'
        },
        {
          id: '2',
          number: 'FAC-2024-002',
          interventionId: '2',
          interventionNumber: 'INT-2024-002',
          clientName: 'Marie Martin',
          vehicleInfo: 'Citroën C3 - IJ-789-KL',
          amount: 320.00,
          status: 'ENVOYEE',
          dueDate: new Date('2024-02-22'),
          createdAt: new Date('2024-01-22')
        }
      ]
      
      let filtered = mockFactures
      
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        filtered = filtered.filter(f => 
          f.number.toLowerCase().includes(query) ||
          f.clientName.toLowerCase().includes(query)
        )
      }
      
      if (statusFilter !== 'all') {
        filtered = filtered.filter(f => f.status === statusFilter)
      }
      
      setFactures(filtered)
    } catch (error) {
      toast.error('Erreur', 'Impossible de charger les factures')
    } finally {
      setIsLoading(false)
    }
  }
  
  const loadExports = async () => {
    setIsLoading(true)
    
    try {
      // TODO: Remplacer par vraie API /api/documents/exports
      const mockExports: Export[] = [
        {
          id: '1',
          number: 'EXP-2024-001',
          type: 'ASSURANCE',
          interventionId: '1',
          interventionNumber: 'INT-2024-001',
          clientName: 'Jean Dupont',
          vehicleInfo: 'Peugeot 208 - AB-123-CD',
          requestedBy: 'Sophie Blanc',
          createdAt: new Date('2024-01-17'),
          zipUrl: '/exports/exp-2024-001.zip'
        }
      ]
      
      let filtered = mockExports
      
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        filtered = filtered.filter(e => 
          e.number.toLowerCase().includes(query) ||
          e.clientName.toLowerCase().includes(query)
        )
      }
      
      setExports(filtered)
    } catch (error) {
      toast.error('Erreur', 'Impossible de charger les exports')
    } finally {
      setIsLoading(false)
    }
  }
  
  const handleOpenGenerateModal = (type: DocumentType) => {
    setGenerateType(type)
    setSelectedInterventionId('')
    setExportType('ASSURANCE')
    setSendEmail(false)
    setIsGenerateModalOpen(true)
  }
  
  const handleGenerate = async () => {
    if (!selectedInterventionId) {
      toast.error('Erreur', 'Sélectionnez une intervention')
      return
    }
    
    setIsGenerating(true)
    
    try {
      // TODO: Remplacer par vraie API
      toast.success(
        'Document généré',
        sendEmail 
          ? 'Le document a été généré et envoyé par email'
          : 'Le document a été généré avec succès'
      )
      setIsGenerateModalOpen(false)
      
      if (generateType === 'DEVIS') loadDevis()
      else if (generateType === 'FACTURE') loadFactures()
      else loadExports()
    } catch (error) {
      toast.error('Erreur', 'Impossible de générer le document')
    } finally {
      setIsGenerating(false)
    }
  }
  
  const handleDownload = (url: string, filename: string) => {
    if (url) {
      window.open(url, '_blank')
    } else {
      toast.info('Génération en cours', 'Le fichier sera disponible dans quelques secondes')
    }
  }
  
  const handleDeleteClick = (document: any) => {
    setDocumentToDelete(document)
    setDeleteModalOpen(true)
  }
  
  const handleDeleteConfirm = async () => {
    if (!documentToDelete) return
    
    setIsDeleting(true)
    
    try {
      // TODO: Remplacer par vraie API
      toast.success('Document supprimé', 'Le document a été supprimé avec succès')
      setDeleteModalOpen(false)
      setDocumentToDelete(null)
      
      if (activeTab === 'DEVIS') loadDevis()
      else if (activeTab === 'FACTURE') loadFactures()
      else loadExports()
    } catch (error) {
      toast.error('Erreur', 'Impossible de supprimer le document')
    } finally {
      setIsDeleting(false)
    }
  }
  
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount)
  }
  
  const getDevisStatusBadge = (status: DevisStatus) => {
    const variants = {
      BROUILLON: 'neutral',
      ENVOYE: 'info',
      ACCEPTE: 'success',
      REFUSE: 'error'
    }
    
    const labels = {
      BROUILLON: 'Brouillon',
      ENVOYE: 'Envoyé',
      ACCEPTE: 'Accepté',
      REFUSE: 'Refusé'
    }
    
    return <Badge variant={variants[status] as any}>{labels[status]}</Badge>
  }
  
  const getFactureStatusBadge = (status: FactureStatus) => {
    const variants = {
      BROUILLON: 'neutral',
      ENVOYEE: 'info',
      PAYEE: 'success',
      IMPAYEE: 'error'
    }
    
    const labels = {
      BROUILLON: 'Brouillon',
      ENVOYEE: 'Envoyée',
      PAYEE: 'Payée',
      IMPAYEE: 'Impayée'
    }
    
    return <Badge variant={variants[status] as any}>{labels[status]}</Badge>
  }
  
  const getExportTypeBadge = (type: ExportType) => {
    const variants = {
      ASSURANCE: 'info',
      EXPERT: 'warning',
      COMPLET: 'success'
    }
    
    const labels = {
      ASSURANCE: 'Assurance',
      EXPERT: 'Expert',
      COMPLET: 'Complet'
    }
    
    return <Badge variant={variants[type] as any}>{labels[type]}</Badge>
  }
  
  const devisColumns = [
    {
      key: 'number',
      label: 'Numéro',
      sortable: true,
      render: (devis: Devis) => (
        <div>
          <div style={{
            fontFamily: 'monospace',
            fontSize: '14px',
            fontWeight: 600,
            color: '#111827'
          }}>
            {devis.number}
          </div>
          <div style={{ fontSize: '12px', color: '#9CA3AF', marginTop: '2px' }}>
            {new Date(devis.createdAt).toLocaleDateString('fr-FR')}
          </div>
        </div>
      )
    },
    {
      key: 'intervention',
      label: 'Intervention',
      sortable: false,
      render: (devis: Devis) => (
        <div>
          <div style={{ fontSize: '13px', color: '#111827', fontWeight: 500 }}>
            {devis.interventionNumber}
          </div>
          <div style={{ fontSize: '12px', color: '#6B7280' }}>
            {devis.clientName}
          </div>
          <div style={{ fontSize: '11px', color: '#9CA3AF' }}>
            {devis.vehicleInfo}
          </div>
        </div>
      )
    },
    {
      key: 'amount',
      label: 'Montant',
      sortable: true,
      render: (devis: Devis) => (
        <div style={{ fontSize: '14px', fontWeight: 600, color: '#111827' }}>
          {formatCurrency(devis.amount)}
        </div>
      )
    },
    {
      key: 'status',
      label: 'Statut',
      sortable: true,
      render: (devis: Devis) => getDevisStatusBadge(devis.status)
    },
    {
      key: 'validUntil',
      label: 'Validité',
      sortable: true,
      render: (devis: Devis) => (
        <div style={{ fontSize: '13px', color: '#6B7280' }}>
          {new Date(devis.validUntil).toLocaleDateString('fr-FR')}
        </div>
      )
    },
    {
      key: 'actions',
      label: 'Actions',
      sortable: false,
      render: (devis: Devis) => (
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
              id: 'download',
              label: 'Télécharger PDF',
              icon: <Download size={16} />,
              onClick: () => handleDownload(devis.pdfUrl || '', devis.number + '.pdf')
            },
            {
              id: 'email',
              label: 'Envoyer par email',
              icon: <Mail size={16} />,
              onClick: () => toast.info('Email', 'Fonctionnalité en développement')
            },
            { id: 'separator', separator: true },
            {
              id: 'delete',
              label: 'Supprimer',
              icon: <Trash2 size={16} />,
              danger: true,
              onClick: () => handleDeleteClick(devis)
            }
          ]}
        />
      )
    }
  ]
  
  const facturesColumns = [
    {
      key: 'number',
      label: 'Numéro',
      sortable: true,
      render: (facture: Facture) => (
        <div>
          <div style={{
            fontFamily: 'monospace',
            fontSize: '14px',
            fontWeight: 600,
            color: '#111827'
          }}>
            {facture.number}
          </div>
          <div style={{ fontSize: '12px', color: '#9CA3AF', marginTop: '2px' }}>
            {new Date(facture.createdAt).toLocaleDateString('fr-FR')}
          </div>
        </div>
      )
    },
    {
      key: 'intervention',
      label: 'Intervention',
      sortable: false,
      render: (facture: Facture) => (
        <div>
          <div style={{ fontSize: '13px', color: '#111827', fontWeight: 500 }}>
            {facture.interventionNumber}
          </div>
          <div style={{ fontSize: '12px', color: '#6B7280' }}>
            {facture.clientName}
          </div>
          <div style={{ fontSize: '11px', color: '#9CA3AF' }}>
            {facture.vehicleInfo}
          </div>
        </div>
      )
    },
    {
      key: 'amount',
      label: 'Montant',
      sortable: true,
      render: (facture: Facture) => (
        <div style={{ fontSize: '14px', fontWeight: 600, color: '#111827' }}>
          {formatCurrency(facture.amount)}
        </div>
      )
    },
    {
      key: 'status',
      label: 'Statut',
      sortable: true,
      render: (facture: Facture) => getFactureStatusBadge(facture.status)
    },
    {
      key: 'dueDate',
      label: 'Échéance',
      sortable: true,
      render: (facture: Facture) => (
        <div style={{ fontSize: '13px', color: '#6B7280' }}>
          {new Date(facture.dueDate).toLocaleDateString('fr-FR')}
        </div>
      )
    },
    {
      key: 'actions',
      label: 'Actions',
      sortable: false,
      render: (facture: Facture) => (
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
              id: 'download',
              label: 'Télécharger PDF',
              icon: <Download size={16} />,
              onClick: () => handleDownload(facture.pdfUrl || '', facture.number + '.pdf')
            },
            {
              id: 'email',
              label: 'Envoyer par email',
              icon: <Mail size={16} />,
              onClick: () => toast.info('Email', 'Fonctionnalité en développement')
            },
            { id: 'separator', separator: true },
            {
              id: 'delete',
              label: 'Supprimer',
              icon: <Trash2 size={16} />,
              danger: true,
              onClick: () => handleDeleteClick(facture)
            }
          ]}
        />
      )
    }
  ]
  
  const exportsColumns = [
    {
      key: 'number',
      label: 'Numéro',
      sortable: true,
      render: (exp: Export) => (
        <div>
          <div style={{
            fontFamily: 'monospace',
            fontSize: '14px',
            fontWeight: 600,
            color: '#111827'
          }}>
            {exp.number}
          </div>
          <div style={{ fontSize: '12px', color: '#9CA3AF', marginTop: '2px' }}>
            {new Date(exp.createdAt).toLocaleDateString('fr-FR')}
          </div>
        </div>
      )
    },
    {
      key: 'type',
      label: 'Type',
      sortable: true,
      render: (exp: Export) => getExportTypeBadge(exp.type)
    },
    {
      key: 'intervention',
      label: 'Intervention',
      sortable: false,
      render: (exp: Export) => (
        <div>
          <div style={{ fontSize: '13px', color: '#111827', fontWeight: 500 }}>
            {exp.interventionNumber}
          </div>
          <div style={{ fontSize: '12px', color: '#6B7280' }}>
            {exp.clientName}
          </div>
          <div style={{ fontSize: '11px', color: '#9CA3AF' }}>
            {exp.vehicleInfo}
          </div>
        </div>
      )
    },
    {
      key: 'requestedBy',
      label: 'Demandeur',
      sortable: true,
      render: (exp: Export) => (
        <div style={{ fontSize: '13px', color: '#6B7280' }}>
          {exp.requestedBy}
        </div>
      )
    },
    {
      key: 'actions',
      label: 'Actions',
      sortable: false,
      render: (exp: Export) => (
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
              id: 'download',
              label: 'Télécharger ZIP',
              icon: <Package size={16} />,
              onClick: () => handleDownload(exp.zipUrl || '', exp.number + '.zip')
            },
            { id: 'separator', separator: true },
            {
              id: 'delete',
              label: 'Supprimer',
              icon: <Trash2 size={16} />,
              danger: true,
              onClick: () => handleDeleteClick(exp)
            }
          ]}
        />
      )
    }
  ]
  
  const tabs = [
    {
      id: 'DEVIS',
      label: 'Devis',
      icon: <FileText size={16} />,
      badge: devis.length,
      content: (
        <div>
          <div style={{
            display: 'flex',
            gap: '12px',
            marginBottom: '20px'
          }}>
            <div style={{ flex: 1 }}>
              <SearchInput
                placeholder="Rechercher un devis..."
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
                { value: 'BROUILLON', label: 'Brouillons' },
                { value: 'ENVOYE', label: 'Envoyés' },
                { value: 'ACCEPTE', label: 'Acceptés' },
                { value: 'REFUSE', label: 'Refusés' }
              ]}
            />
          </div>
          
          <DataTableInline
            data={devis}
            columns={devisColumns}
            loading={isLoading}
            emptyState={{
              title: 'Aucun devis',
              description: 'Commencez par générer votre premier devis',
              action: {
                label: 'Générer un devis',
                onClick: () => handleOpenGenerateModal('DEVIS')
              }
            }}
          />
        </div>
      )
    },
    {
      id: 'FACTURE',
      label: 'Factures',
      icon: <FileText size={16} />,
      badge: factures.length,
      content: (
        <div>
          <div style={{
            display: 'flex',
            gap: '12px',
            marginBottom: '20px'
          }}>
            <div style={{ flex: 1 }}>
              <SearchInput
                placeholder="Rechercher une facture..."
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
                { value: 'BROUILLON', label: 'Brouillons' },
                { value: 'ENVOYEE', label: 'Envoyées' },
                { value: 'PAYEE', label: 'Payées' },
                { value: 'IMPAYEE', label: 'Impayées' }
              ]}
            />
          </div>
          
          <DataTableInline
            data={factures}
            columns={facturesColumns}
            loading={isLoading}
            emptyState={{
              title: 'Aucune facture',
              description: 'Commencez par générer votre première facture',
              action: {
                label: 'Générer une facture',
                onClick: () => handleOpenGenerateModal('FACTURE')
              }
            }}
          />
        </div>
      )
    },
    {
      id: 'EXPORT',
      label: 'Exports assurance',
      icon: <Package size={16} />,
      badge: exports.length,
      content: (
        <div>
          <div style={{ marginBottom: '20px' }}>
            <SearchInput
              placeholder="Rechercher un export..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onClear={() => setSearchQuery('')}
            />
          </div>
          
          <DataTableInline
            data={exports}
            columns={exportsColumns}
            loading={isLoading}
            emptyState={{
              title: 'Aucun export',
              description: 'Commencez par générer votre premier export assurance',
              action: {
                label: 'Générer un export',
                onClick: () => handleOpenGenerateModal('EXPORT')
              }
            }}
          />
        </div>
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
            Documents
          </h1>
          <p style={{
            fontSize: '14px',
            color: '#6B7280',
            margin: 0
          }}>
            Gérez vos devis, factures et exports assurance
          </p>
        </div>
        
        <DropdownMenu
          trigger={
            <Button
              variant="primary"
              size="lg"
              leftIcon={<Plus size={20} />}
            >
              Générer un document
            </Button>
          }
          items={[
            {
              id: 'devis',
              label: 'Nouveau devis',
              icon: <FileText size={16} />,
              onClick: () => handleOpenGenerateModal('DEVIS')
            },
            {
              id: 'facture',
              label: 'Nouvelle facture',
              icon: <FileText size={16} />,
              onClick: () => handleOpenGenerateModal('FACTURE')
            },
            { id: 'separator', separator: true },
            {
              id: 'export',
              label: 'Export assurance',
              icon: <Package size={16} />,
              onClick: () => handleOpenGenerateModal('EXPORT')
            }
          ]}
        />
      </div>
      
      {/* Tabs */}
      <Tabs
        tabs={tabs}
        value={activeTab}
        onChange={(tabId) => {
          setActiveTab(tabId as DocumentType)
          setSearchQuery('')
          setStatusFilter('all')
        }}
      />
      
      {/* Modal génération */}
      <Modal
        isOpen={isGenerateModalOpen}
        onClose={() => setIsGenerateModalOpen(false)}
        title={`Générer ${
          generateType === 'DEVIS' ? 'un devis' : 
          generateType === 'FACTURE' ? 'une facture' : 
          'un export'
        }`}
        size="md"
      >
        <div style={{ padding: '24px' }}>
          <Select
            label="Intervention"
            value={selectedInterventionId}
            onChange={(e) => setSelectedInterventionId(e.target.value)}
            options={[
              { value: '', label: 'Sélectionner une intervention' },
              ...interventions.map(i => ({
                value: i.id,
                label: `${i.number} - ${i.clientName} (${i.vehicleInfo})`
              }))
            ]}
            required
          />
          
          {generateType === 'EXPORT' && (
            <Select
              label="Type d'export"
              value={exportType}
              onChange={(e) => setExportType(e.target.value as ExportType)}
              options={[
                { value: 'ASSURANCE', label: 'Assurance (Photos + Factures + Signatures)' },
                { value: 'EXPERT', label: 'Expert (Complet + Chaîne de preuves)' },
                { value: 'COMPLET', label: 'Complet (Archive complète)' }
              ]}
            />
          )}
          
          {(generateType === 'DEVIS' || generateType === 'FACTURE') && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '12px',
              backgroundColor: '#F9FAFB',
              borderRadius: '8px',
              marginTop: '16px'
            }}>
              <input
                type="checkbox"
                id="sendEmail"
                checked={sendEmail}
                onChange={(e) => setSendEmail(e.target.checked)}
                style={{ cursor: 'pointer' }}
              />
              <label
                htmlFor="sendEmail"
                style={{
                  fontSize: '14px',
                  color: '#111827',
                  cursor: 'pointer'
                }}
              >
                Envoyer par email au client
              </label>
            </div>
          )}
          
          <div style={{
            display: 'flex',
            gap: '12px',
            justifyContent: 'flex-end',
            marginTop: '24px'
          }}>
            <Button
              variant="secondary"
              onClick={() => setIsGenerateModalOpen(false)}
              disabled={isGenerating}
            >
              Annuler
            </Button>
            <Button
              variant="primary"
              onClick={handleGenerate}
              loading={isGenerating}
              disabled={isGenerating || !selectedInterventionId}
            >
              Générer
            </Button>
          </div>
        </div>
      </Modal>
      
      {/* Modal suppression */}
      <Modal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="Supprimer le document"
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
            Êtes-vous sûr de vouloir supprimer le document{' '}
            <strong style={{ color: '#111827' }}>
              {documentToDelete?.number}
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
