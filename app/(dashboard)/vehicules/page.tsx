'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { 
  Search, 
  Plus, 
  Car, 
  Fuel,
  Filter,
  ChevronRight,
  RefreshCw,
  X,
  Hash,
  User,
  CheckCircle,
  AlertCircle,
  Trash2
} from 'lucide-react'

// Responsive hook
function useResponsive() {
  const [screen, setScreen] = useState<"mobile" | "tablet" | "desktop">("desktop");
  useEffect(() => {
    const check = () => {
      const w = window.innerWidth;
      if (w < 640) setScreen("mobile");
      else if (w < 1024) setScreen("tablet");
      else setScreen("desktop");
    };
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);
  return { isMobile: screen === "mobile", isTablet: screen === "tablet", screen };
}

// ============================================================================
// VEHICLES LIST PAGE - SafeMotor
// Design moderne avec données réelles et recherche SIV
// ============================================================================

interface Vehicle {
  id: string
  registrationNumber?: string
  plate?: string
  vin?: string
  make?: string
  brand?: string
  model: string
  version?: string
  year?: number
  mileage?: number
  color?: string
  fuelType?: string
  fuel?: string
  clientId: string
  clientName?: string
  client?: { id: number; firstName: string; lastName: string; name?: string }
  createdAt: Date
}

interface Client {
  id: string
  name: string
  firstName?: string
  lastName?: string
}

// Référentiel énergie SIV
const ENERGY_CODES: Record<string, { label: string; color: string; bg: string }> = {
  '1': { label: 'Essence', color: '#EF4444', bg: '#FEE2E2' },
  '2': { label: 'Diesel', color: '#1D4ED8', bg: '#DBEAFE' },
  '3': { label: 'Essence + GPL', color: '#F59E0B', bg: '#FEF3C7' },
  '4': { label: 'Hybride', color: '#10B981', bg: '#D1FAE5' },
  '5': { label: 'Électrique', color: '#6366F1', bg: '#E0E7FF' },
  '6': { label: 'Bicarburation', color: '#8B5CF6', bg: '#EDE9FE' },
  '7': { label: 'Hydrogène', color: '#06B6D4', bg: '#CFFAFE' },
  '8': { label: 'Mixte', color: '#EC4899', bg: '#FCE7F3' },
  '9': { label: 'Air comprimé', color: '#14B8A6', bg: '#CCFBF1' },
  '10': { label: 'Superéthanol', color: '#F97316', bg: '#FFEDD5' },
  '11': { label: 'GNV', color: '#84CC16', bg: '#ECFCCB' },
  '12': { label: 'Inconnu', color: '#6B7280', bg: '#F3F4F6' },
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

const FUEL_FILTERS = [
  { value: '', label: 'Tous' },
  { value: 'ESSENCE', label: 'Essence' },
  { value: 'DIESEL', label: 'Diesel' },
  { value: 'ELECTRIC', label: 'Électrique' },
  { value: 'HYBRID', label: 'Hybride' },
  { value: 'GPL', label: 'GPL' }
]

export default function VehiculesPage() {
  const router = useRouter()
  const { isMobile, isTablet } = useResponsive()
  
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [fuelFilter, setFuelFilter] = useState('')
  
  // Create modal
  const [createModalOpen, setCreateModalOpen] = useState(false)
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
  
  // SIV Lookup
  const [sivModalOpen, setSivModalOpen] = useState(false)
  const [sivPlate, setSivPlate] = useState('')
  const [sivLoading, setSivLoading] = useState(false)
  const [sivResult, setSivResult] = useState<any>(null)
  const [sivError, setSivError] = useState<string | null>(null)
  
  // Delete modal
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [vehicleToDelete, setVehicleToDelete] = useState<Vehicle | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const loadVehicles = async () => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams()
      params.set('pageSize', '100')
      if (searchQuery) params.set('q', searchQuery)
      if (fuelFilter) params.set('fuelType', fuelFilter)
      
      const response = await fetch(`/api/vehicules?${params.toString()}`)
      const data = await response.json()
      
      if (data.ok && data.data) {
        setVehicles(data.data.items || [])
      }
    } catch (error) {
      console.error('Error loading vehicles:', error)
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
    } catch (error) {
      console.error('Error loading clients:', error)
    }
  }

  useEffect(() => {
    loadVehicles()
    loadClients()
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => loadVehicles(), 300)
    return () => clearTimeout(timer)
  }, [searchQuery, fuelFilter])

  const getPlate = (v: Vehicle) => v.registrationNumber || v.plate || ''
  const getMake = (v: Vehicle) => v.make || v.brand || ''
  const getFuel = (v: Vehicle) => v.fuelType || v.fuel || ''
  
  const getClientName = (v: Vehicle) => {
    if (v.clientName) return v.clientName
    if (v.client) {
      if (v.client.name) return v.client.name
      return `${v.client.firstName || ''} ${v.client.lastName || ''}`.trim()
    }
    return 'Client inconnu'
  }

  const getFuelConfig = (fuel: string) => {
    return ENERGY_CODES[fuel] || { label: fuel || 'Inconnu', color: '#6B7280', bg: '#F3F4F6' }
  }

  // Stats
  const stats = useMemo(() => {
    const total = vehicles.length
    const essence = vehicles.filter(v => {
      const f = getFuel(v).toUpperCase()
      return f === 'ESSENCE' || f === '1'
    }).length
    const diesel = vehicles.filter(v => {
      const f = getFuel(v).toUpperCase()
      return f === 'DIESEL' || f === '2'
    }).length
    const electric = vehicles.filter(v => {
      const f = getFuel(v).toUpperCase()
      return f === 'ELECTRIC' || f === 'ÉLECTRIQUE' || f === '5'
    }).length
    return { total, essence, diesel, electric }
  }, [vehicles])

  const handleSivSearch = async () => {
    if (!sivPlate.trim()) {
      setSivError("Entrez une plaque d'immatriculation")
      return
    }
    
    setSivLoading(true)
    setSivError(null)
    setSivResult(null)
    
    try {
      const response = await fetch('/api/siv/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ registrationNumber: sivPlate.trim() })
      })
      
      const data = await response.json()
      
      if (data.ok && data.vehicle) {
        setSivResult(data.vehicle)
      } else {
        setSivError(data.error || 'Véhicule non trouvé')
      }
    } catch (error) {
      setSivError('Erreur de connexion')
    } finally {
      setSivLoading(false)
    }
  }

  const handleSivImport = () => {
    if (!sivResult) return
    
    setFormData({
      ...formData,
      plate: sivPlate.toUpperCase(),
      brand: sivResult.make || sivResult.brand || sivResult.marque || '',
      model: sivResult.model || sivResult.modele || '',
      version: sivResult.version || '',
      year: sivResult.year?.toString() || '',
      fuel: sivResult.fuelType || sivResult.fuel || 'ESSENCE',
      vin: sivResult.vin || '',
      color: sivResult.color || ''
    })
    
    setSivModalOpen(false)
    setCreateModalOpen(true)
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

  const handleCreate = async () => {
    if (!validateForm()) return
    setIsSaving(true)
    
    try {
      const response = await fetch('/api/vehicules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId: parseInt(formData.clientId),
          plate: formData.plate.toUpperCase(),
          vin: formData.vin || undefined,
          brand: formData.brand,
          model: formData.model,
          year: formData.year ? parseInt(formData.year) : undefined,
          fuel: formData.fuel
        })
      })
      
      const data = await response.json()
      
      if (data.ok) {
        setCreateModalOpen(false)
        setFormData({ clientId: '', plate: '', vin: '', brand: '', model: '', version: '', year: '', mileage: '', color: '', fuel: 'ESSENCE' })
        loadVehicles()
      } else {
        setFormErrors({ plate: data.error || 'Erreur de création' })
      }
    } catch (error) {
      console.error('Error creating vehicle:', error)
      setFormErrors({ plate: 'Erreur de connexion' })
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!vehicleToDelete) return
    setIsDeleting(true)
    
    try {
      const response = await fetch(`/api/vehicules/${vehicleToDelete.id}`, { method: 'DELETE' })
      const data = await response.json()
      
      if (data.ok) {
        setDeleteModalOpen(false)
        setVehicleToDelete(null)
        loadVehicles()
      }
    } catch (error) {
      console.error('Error deleting vehicle:', error)
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div style={{ padding: isMobile ? '16px' : isTablet ? '24px' : '32px', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', justifyContent: 'space-between', alignItems: isMobile ? 'stretch' : 'center', marginBottom: isMobile ? '24px' : '32px', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: isMobile ? '22px' : '28px', fontWeight: 700, color: '#111827', margin: 0, marginBottom: '4px' }}>Véhicules</h1>
          <p style={{ fontSize: isMobile ? '13px' : '14px', color: '#6B7280', margin: 0 }}>Gérez la flotte de véhicules</p>
        </div>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <button onClick={() => { setSivPlate(''); setSivResult(null); setSivError(null); setSivModalOpen(true) }} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: isMobile ? '10px 14px' : '12px 20px', borderRadius: '12px', border: '1px solid #E5E7EB', background: '#fff', fontSize: '14px', fontWeight: 600, color: '#374151', cursor: 'pointer', flex: isMobile ? '1' : 'none' }}>
            <Search size={18} /> {isMobile ? 'SIV' : 'Recherche SIV'}
          </button>
          <button onClick={() => { setFormData({ clientId: '', plate: '', vin: '', brand: '', model: '', version: '', year: '', mileage: '', color: '', fuel: 'ESSENCE' }); setFormErrors({}); setCreateModalOpen(true) }} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: isMobile ? '10px 14px' : '12px 20px', borderRadius: '12px', border: 'none', background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)', fontSize: '14px', fontWeight: 600, color: '#fff', cursor: 'pointer', boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)', flex: isMobile ? '1' : 'none' }}>
            <Plus size={18} /> Ajouter
          </button>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)', gap: isMobile ? '12px' : '16px', marginBottom: isMobile ? '24px' : '32px' }}>
        <div style={{ padding: isMobile ? '16px' : '20px', borderRadius: '16px', background: '#fff', border: '1px solid #E5E7EB' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '10px' : '14px' }}>
            <div style={{ width: isMobile ? '40px' : '48px', height: isMobile ? '40px' : '48px', borderRadius: '12px', background: '#EEF2FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Car size={isMobile ? 20 : 24} color="#6366F1" /></div>
            <div><p style={{ fontSize: isMobile ? '11px' : '13px', color: '#6B7280', margin: 0 }}>Total</p><p style={{ fontSize: isMobile ? '22px' : '28px', fontWeight: 700, color: '#111827', margin: 0 }}>{stats.total}</p></div>
          </div>
        </div>
        <div style={{ padding: isMobile ? '16px' : '20px', borderRadius: '16px', background: '#fff', border: '1px solid #E5E7EB' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '10px' : '14px' }}>
            <div style={{ width: isMobile ? '40px' : '48px', height: isMobile ? '40px' : '48px', borderRadius: '12px', background: '#FEE2E2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Fuel size={isMobile ? 20 : 24} color="#EF4444" /></div>
            <div><p style={{ fontSize: isMobile ? '11px' : '13px', color: '#6B7280', margin: 0 }}>Essence</p><p style={{ fontSize: isMobile ? '22px' : '28px', fontWeight: 700, color: '#EF4444', margin: 0 }}>{stats.essence}</p></div>
          </div>
        </div>
        <div style={{ padding: isMobile ? '16px' : '20px', borderRadius: '16px', background: '#fff', border: '1px solid #E5E7EB' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '10px' : '14px' }}>
            <div style={{ width: isMobile ? '40px' : '48px', height: isMobile ? '40px' : '48px', borderRadius: '12px', background: '#DBEAFE', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Fuel size={isMobile ? 20 : 24} color="#1D4ED8" /></div>
            <div><p style={{ fontSize: isMobile ? '11px' : '13px', color: '#6B7280', margin: 0 }}>Diesel</p><p style={{ fontSize: isMobile ? '22px' : '28px', fontWeight: 700, color: '#1D4ED8', margin: 0 }}>{stats.diesel}</p></div>
          </div>
        </div>
        <div style={{ padding: isMobile ? '16px' : '20px', borderRadius: '16px', background: '#fff', border: '1px solid #E5E7EB' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '10px' : '14px' }}>
            <div style={{ width: isMobile ? '40px' : '48px', height: isMobile ? '40px' : '48px', borderRadius: '12px', background: '#E0E7FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Fuel size={isMobile ? 20 : 24} color="#6366F1" /></div>
            <div><p style={{ fontSize: isMobile ? '11px' : '13px', color: '#6B7280', margin: 0 }}>Électrique</p><p style={{ fontSize: isMobile ? '22px' : '28px', fontWeight: 700, color: '#6366F1', margin: 0 }}>{stats.electric}</p></div>
          </div>
        </div>
      </div>

      {/* Search & Filters */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', flexDirection: isMobile ? 'column' : 'row' }}>
        <div style={{ flex: 1, position: 'relative' }}>
          <Search size={20} color="#9CA3AF" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)' }} />
          <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Rechercher..." style={{ width: '100%', padding: '14px 14px 14px 48px', borderRadius: '12px', border: '1px solid #E5E7EB', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', borderRadius: '12px', border: '1px solid #E5E7EB', background: '#fff' }}>
          <Filter size={18} color="#6B7280" />
          <select value={fuelFilter} onChange={(e) => setFuelFilter(e.target.value)} style={{ border: 'none', background: 'transparent', fontSize: '14px', color: '#374151', outline: 'none', cursor: 'pointer' }}>
            {FUEL_FILTERS.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
          </select>
        </div>
      </div>

      {/* Vehicles List */}
      <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid #E5E7EB', overflow: 'hidden' }}>
        {isLoading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '64px' }}>
            <RefreshCw size={32} color="#6366F1" style={{ animation: 'spin 1s linear infinite' }} />
          </div>
        ) : vehicles.length === 0 ? (
          <div style={{ padding: '64px', textAlign: 'center' }}>
            <Car size={48} color="#D1D5DB" style={{ marginBottom: '16px' }} />
            <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#111827', margin: 0, marginBottom: '8px' }}>Aucun véhicule</h3>
            <p style={{ fontSize: '14px', color: '#6B7280', margin: 0 }}>Commencez par ajouter un véhicule</p>
          </div>
        ) : isMobile ? (
          /* Mobile: Card view */
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {vehicles.map((vehicle, index) => {
              const fuelConfig = getFuelConfig(getFuel(vehicle))
              return (
                <div
                  key={vehicle.id}
                  onClick={() => router.push(`/vehicules/${vehicle.id}`)}
                  style={{
                    padding: '16px',
                    borderBottom: index < vehicles.length - 1 ? '1px solid #F3F4F6' : 'none',
                    cursor: 'pointer',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                    <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Car size={20} color="#fff" /></div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '15px', fontWeight: 600, color: '#111827', marginBottom: '2px' }}>{getMake(vehicle)} {vehicle.model}</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                        <span style={{ padding: '2px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 700, background: '#EEF2FF', color: '#6366F1' }}>{getPlate(vehicle)}</span>
                        <span style={{ padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 600, background: fuelConfig.bg, color: fuelConfig.color }}>{fuelConfig.label}</span>
                      </div>
                      <div style={{ fontSize: '13px', color: '#6B7280' }}>{getClientName(vehicle)}</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <button onClick={(e) => { e.stopPropagation(); setVehicleToDelete(vehicle); setDeleteModalOpen(true) }} style={{ padding: '8px', borderRadius: '8px', border: '1px solid #FECACA', background: '#FEF2F2', cursor: 'pointer' }}><Trash2 size={16} color="#EF4444" /></button>
                      <ChevronRight size={18} color="#D1D5DB" />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          /* Desktop/Tablet: Table view */
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#F9FAFB', borderBottom: '1px solid #E5E7EB' }}>
                <th style={{ padding: '14px 20px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#6B7280', textTransform: 'uppercase' }}>Véhicule</th>
                <th style={{ padding: '14px 20px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#6B7280', textTransform: 'uppercase' }}>Immatriculation</th>
                <th style={{ padding: '14px 20px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#6B7280', textTransform: 'uppercase' }}>Client</th>
                <th style={{ padding: '14px 20px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#6B7280', textTransform: 'uppercase' }}>Énergie</th>
                {!isTablet && <th style={{ padding: '14px 20px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#6B7280', textTransform: 'uppercase' }}>Année</th>}
                <th style={{ padding: '14px 20px', textAlign: 'right', fontSize: '12px', fontWeight: 600, color: '#6B7280', textTransform: 'uppercase' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {vehicles.map((vehicle, index) => {
                const fuelConfig = getFuelConfig(getFuel(vehicle))
                return (
                  <tr key={vehicle.id} style={{ borderBottom: index < vehicles.length - 1 ? '1px solid #F3F4F6' : 'none', cursor: 'pointer' }} onClick={() => router.push(`/vehicules/${vehicle.id}`)} onMouseEnter={(e) => e.currentTarget.style.background = '#F9FAFB'} onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
                    <td style={{ padding: '16px 20px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Car size={20} color="#fff" /></div>
                        <div>
                          <div style={{ fontSize: '14px', fontWeight: 600, color: '#111827' }}>{getMake(vehicle)} {vehicle.model}</div>
                          {vehicle.version && <div style={{ fontSize: '12px', color: '#6B7280' }}>{vehicle.version}</div>}
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '16px 20px' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 12px', borderRadius: '6px', fontSize: '13px', fontWeight: 700, background: '#EEF2FF', color: '#6366F1' }}>
                        <Hash size={14} /> {getPlate(vehicle)}
                      </span>
                    </td>
                    <td style={{ padding: '16px 20px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <User size={16} color="#9CA3AF" />
                        <span style={{ fontSize: '14px', color: '#374151' }}>{getClientName(vehicle)}</span>
                      </div>
                    </td>
                    <td style={{ padding: '16px 20px' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 12px', borderRadius: '100px', fontSize: '12px', fontWeight: 600, background: fuelConfig.bg, color: fuelConfig.color }}>
                        <Fuel size={12} /> {fuelConfig.label}
                      </span>
                    </td>
                    {!isTablet && (
                      <td style={{ padding: '16px 20px' }}>
                        <span style={{ fontSize: '14px', color: '#374151' }}>{vehicle.year || '-'}</span>
                      </td>
                    )}
                    <td style={{ padding: '16px 20px', textAlign: 'right' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '8px' }}>
                        <button onClick={(e) => { e.stopPropagation(); setVehicleToDelete(vehicle); setDeleteModalOpen(true) }} style={{ padding: '8px', borderRadius: '8px', border: '1px solid #FECACA', background: '#FEF2F2', cursor: 'pointer' }}><Trash2 size={16} color="#EF4444" /></button>
                        <ChevronRight size={18} color="#D1D5DB" />
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Create Modal */}
      {createModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0, 0, 0, 0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '20px' }} onClick={() => setCreateModalOpen(false)}>
          <div style={{ background: '#fff', borderRadius: '20px', width: '100%', maxWidth: '550px', maxHeight: '90vh', overflow: 'auto' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px', borderBottom: '1px solid #E5E7EB' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#111827', margin: 0 }}>Nouveau véhicule</h2>
              <button onClick={() => setCreateModalOpen(false)} style={{ padding: '8px', background: 'transparent', border: 'none', cursor: 'pointer' }}><X size={20} color="#6B7280" /></button>
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
                <button onClick={() => setCreateModalOpen(false)} disabled={isSaving} style={{ padding: '12px 20px', borderRadius: '10px', border: '1px solid #E5E7EB', background: '#fff', fontSize: '14px', fontWeight: 600, color: '#374151', cursor: 'pointer' }}>Annuler</button>
                <button onClick={handleCreate} disabled={isSaving} style={{ padding: '12px 24px', borderRadius: '10px', border: 'none', background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)', fontSize: '14px', fontWeight: 600, color: '#fff', cursor: isSaving ? 'wait' : 'pointer', opacity: isSaving ? 0.7 : 1 }}>{isSaving ? 'Création...' : 'Créer'}</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SIV Search Modal */}
      {sivModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0, 0, 0, 0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '20px' }} onClick={() => setSivModalOpen(false)}>
          <div style={{ background: '#fff', borderRadius: '20px', width: '100%', maxWidth: '500px' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px', borderBottom: '1px solid #E5E7EB' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#111827', margin: 0 }}>Recherche SIV</h2>
              <button onClick={() => setSivModalOpen(false)} style={{ padding: '8px', background: 'transparent', border: 'none', cursor: 'pointer' }}><X size={20} color="#6B7280" /></button>
            </div>
            <div style={{ padding: '24px' }}>
              <p style={{ fontSize: '14px', color: '#6B7280', margin: '0 0 16px' }}>Recherchez un véhicule par sa plaque d'immatriculation dans le registre SIV.</p>
              <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
                <input type="text" value={sivPlate} onChange={(e) => setSivPlate(e.target.value.toUpperCase())} placeholder="Ex: AB-123-CD" style={{ flex: 1, padding: '12px 14px', borderRadius: '10px', border: '1px solid #E5E7EB', fontSize: '15px', fontWeight: 600, outline: 'none', textTransform: 'uppercase', letterSpacing: '1px' }} onKeyDown={(e) => e.key === 'Enter' && handleSivSearch()} />
                <button onClick={handleSivSearch} disabled={sivLoading} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 20px', borderRadius: '10px', border: 'none', background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)', color: '#fff', fontSize: '14px', fontWeight: 600, cursor: sivLoading ? 'wait' : 'pointer', opacity: sivLoading ? 0.7 : 1 }}>{sivLoading ? <RefreshCw size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Search size={16} />}Rechercher</button>
              </div>
              {sivError && <div style={{ padding: '12px 16px', borderRadius: '10px', background: '#FEF2F2', border: '1px solid #FECACA', marginBottom: '16px' }}><div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><AlertCircle size={16} color="#EF4444" /><span style={{ fontSize: '13px', color: '#DC2626' }}>{sivError}</span></div></div>}
              {sivResult && (
                <div style={{ padding: '20px', borderRadius: '12px', background: '#F0FDF4', border: '1px solid #BBF7D0', maxHeight: '60vh', overflowY: 'auto' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}><CheckCircle size={18} color="#10B981" /><span style={{ fontSize: '14px', fontWeight: 600, color: '#166534' }}>Véhicule trouvé</span></div>

                  {/* Brand Logo & Photo */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
                    {sivResult.logoUrl && (
                      <img src={sivResult.logoUrl} alt={sivResult.make} style={{ maxWidth: '60px', maxHeight: '40px', objectFit: 'contain' }} onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                    )}
                    {sivResult.photoUrl && (
                      <img src={sivResult.photoUrl} alt={sivResult.model} style={{ maxWidth: '120px', maxHeight: '80px', objectFit: 'contain', borderRadius: '8px' }} onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                    )}
                  </div>

                  {/* Provenance Alert */}
                  {sivResult.isImported && (
                    <div style={{ padding: '10px 14px', borderRadius: '8px', background: '#FEF3C7', border: '1px solid #FCD34D', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <AlertCircle size={16} color="#D97706" />
                      <span style={{ fontSize: '13px', color: '#92400E', fontWeight: 500 }}>Véhicule importé {sivResult.paysOrigine ? `(${sivResult.paysOrigine})` : ''}</span>
                    </div>
                  )}

                  {/* Main Info */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                    <div><div style={{ fontSize: '11px', color: '#6B7280', textTransform: 'uppercase', marginBottom: '2px' }}>Marque</div><div style={{ fontSize: '15px', fontWeight: 600, color: '#111827' }}>{sivResult.make || '-'}</div></div>
                    <div><div style={{ fontSize: '11px', color: '#6B7280', textTransform: 'uppercase', marginBottom: '2px' }}>Modèle</div><div style={{ fontSize: '15px', fontWeight: 600, color: '#111827' }}>{sivResult.model || '-'}</div></div>
                    <div><div style={{ fontSize: '11px', color: '#6B7280', textTransform: 'uppercase', marginBottom: '2px' }}>Version</div><div style={{ fontSize: '15px', fontWeight: 600, color: '#111827' }}>{sivResult.version || sivResult.sraCommercial || '-'}</div></div>
                    <div><div style={{ fontSize: '11px', color: '#6B7280', textTransform: 'uppercase', marginBottom: '2px' }}>Année</div><div style={{ fontSize: '15px', fontWeight: 600, color: '#111827' }}>{sivResult.year || '-'}</div></div>
                  </div>

                  {/* Technical Info */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                    <div><div style={{ fontSize: '11px', color: '#6B7280', textTransform: 'uppercase', marginBottom: '2px' }}>Énergie</div><div style={{ fontSize: '14px', fontWeight: 500, color: '#111827' }}>{sivResult.fuelTypeRaw || sivResult.fuelType || '-'}</div></div>
                    <div><div style={{ fontSize: '11px', color: '#6B7280', textTransform: 'uppercase', marginBottom: '2px' }}>Puissance</div><div style={{ fontSize: '14px', fontWeight: 500, color: '#111827' }}>{sivResult.horsePower ? `${sivResult.horsePower} ch` : '-'}{sivResult.horsePowerKW ? ` (${sivResult.horsePowerKW} kW)` : ''}</div></div>
                    <div><div style={{ fontSize: '11px', color: '#6B7280', textTransform: 'uppercase', marginBottom: '2px' }}>Cylindrée</div><div style={{ fontSize: '14px', fontWeight: 500, color: '#111827' }}>{sivResult.displacement ? `${sivResult.displacement} cm³` : '-'}</div></div>
                  </div>

                  {/* Provenance & Historique */}
                  <div style={{ marginBottom: '12px', padding: '12px', background: '#fff', borderRadius: '8px' }}>
                    <div style={{ fontSize: '12px', fontWeight: 600, color: '#374151', marginBottom: '8px', textTransform: 'uppercase' }}>Provenance & Historique</div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                      <div><div style={{ fontSize: '10px', color: '#6B7280', textTransform: 'uppercase', marginBottom: '2px' }}>Provenance</div><div style={{ fontSize: '13px', fontWeight: 500, color: sivResult.isImported ? '#D97706' : '#059669' }}>{sivResult.provenance || 'France'}</div></div>
                      {sivResult.paysOrigine && <div><div style={{ fontSize: '10px', color: '#6B7280', textTransform: 'uppercase', marginBottom: '2px' }}>Pays origine</div><div style={{ fontSize: '13px', fontWeight: 500, color: '#111827' }}>{sivResult.paysOrigine}</div></div>}
                      <div><div style={{ fontSize: '10px', color: '#6B7280', textTransform: 'uppercase', marginBottom: '2px' }}>1ère main</div><div style={{ fontSize: '13px', fontWeight: 500, color: sivResult.premierMain ? '#059669' : '#6B7280' }}>{sivResult.premierMain ? 'Oui' : 'Non / Inconnu'}</div></div>
                    </div>
                  </div>

                  {/* Contrôle Technique */}
                  {(sivResult.dateDerniereCT || sivResult.resultatCT) && (
                    <div style={{ marginBottom: '12px', padding: '12px', background: sivResult.resultatCT === 'Défavorable' ? '#FEF2F2' : '#fff', borderRadius: '8px', border: sivResult.resultatCT === 'Défavorable' ? '1px solid #FECACA' : 'none' }}>
                      <div style={{ fontSize: '12px', fontWeight: 600, color: '#374151', marginBottom: '8px', textTransform: 'uppercase' }}>Contrôle Technique</div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                        {sivResult.dateDerniereCT && <div><div style={{ fontSize: '10px', color: '#6B7280', textTransform: 'uppercase', marginBottom: '2px' }}>Date dernier CT</div><div style={{ fontSize: '13px', fontWeight: 500, color: '#111827' }}>{sivResult.dateDerniereCT}</div></div>}
                        {sivResult.resultatCT && <div><div style={{ fontSize: '10px', color: '#6B7280', textTransform: 'uppercase', marginBottom: '2px' }}>Résultat</div><div style={{ fontSize: '13px', fontWeight: 600, color: sivResult.resultatCT === 'Favorable' ? '#059669' : '#DC2626' }}>{sivResult.resultatCT}</div></div>}
                        {sivResult.kmCT && <div><div style={{ fontSize: '10px', color: '#6B7280', textTransform: 'uppercase', marginBottom: '2px' }}>Kilométrage CT</div><div style={{ fontSize: '13px', fontWeight: 500, color: '#111827' }}>{Number(sivResult.kmCT).toLocaleString('fr-FR')} km</div></div>}
                      </div>
                    </div>
                  )}

                  {/* Valeur */}
                  {(sivResult.prixNeuf || sivResult.coteArgus) && (
                    <div style={{ marginBottom: '12px', padding: '12px', background: '#EEF2FF', borderRadius: '8px' }}>
                      <div style={{ fontSize: '12px', fontWeight: 600, color: '#374151', marginBottom: '8px', textTransform: 'uppercase' }}>Valeur estimée</div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                        {sivResult.prixNeuf && <div><div style={{ fontSize: '10px', color: '#6B7280', textTransform: 'uppercase', marginBottom: '2px' }}>Prix neuf catalogue</div><div style={{ fontSize: '14px', fontWeight: 600, color: '#111827' }}>{Number(sivResult.prixNeuf).toLocaleString('fr-FR')} €</div></div>}
                        {sivResult.coteArgus && <div><div style={{ fontSize: '10px', color: '#6B7280', textTransform: 'uppercase', marginBottom: '2px' }}>Cote Argus</div><div style={{ fontSize: '14px', fontWeight: 600, color: '#6366F1' }}>{Number(sivResult.coteArgus).toLocaleString('fr-FR')} €</div></div>}
                      </div>
                    </div>
                  )}

                  {/* Identification */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px', padding: '12px', background: '#fff', borderRadius: '8px' }}>
                    {sivResult.vin && <div><div style={{ fontSize: '10px', color: '#6B7280', textTransform: 'uppercase', marginBottom: '2px' }}>VIN</div><div style={{ fontSize: '11px', fontWeight: 500, color: '#111827', fontFamily: 'monospace' }}>{sivResult.vin}</div></div>}
                    {sivResult.firstRegistrationDateFr && <div><div style={{ fontSize: '10px', color: '#6B7280', textTransform: 'uppercase', marginBottom: '2px' }}>1ère immatriculation</div><div style={{ fontSize: '13px', fontWeight: 500, color: '#111827' }}>{sivResult.firstRegistrationDateFr}</div></div>}
                    {sivResult.fiscalPower && <div><div style={{ fontSize: '10px', color: '#6B7280', textTransform: 'uppercase', marginBottom: '2px' }}>Puissance fiscale</div><div style={{ fontSize: '13px', fontWeight: 500, color: '#111827' }}>{sivResult.fiscalPower} CV</div></div>}
                    {sivResult.gearbox && <div><div style={{ fontSize: '10px', color: '#6B7280', textTransform: 'uppercase', marginBottom: '2px' }}>Boîte</div><div style={{ fontSize: '13px', fontWeight: 500, color: '#111827' }}>{sivResult.transmission || sivResult.gearbox}</div></div>}
                    {sivResult.typeApproval && <div><div style={{ fontSize: '10px', color: '#6B7280', textTransform: 'uppercase', marginBottom: '2px' }}>Type mine</div><div style={{ fontSize: '11px', fontWeight: 500, color: '#111827', fontFamily: 'monospace' }}>{sivResult.typeApproval}</div></div>}
                    {sivResult.cnit && <div><div style={{ fontSize: '10px', color: '#6B7280', textTransform: 'uppercase', marginBottom: '2px' }}>CNIT</div><div style={{ fontSize: '11px', fontWeight: 500, color: '#111827', fontFamily: 'monospace' }}>{sivResult.cnit}</div></div>}
                  </div>

                  {/* Environnement */}
                  <div style={{ marginBottom: '12px', padding: '12px', background: '#ECFDF5', borderRadius: '8px' }}>
                    <div style={{ fontSize: '12px', fontWeight: 600, color: '#374151', marginBottom: '8px', textTransform: 'uppercase' }}>Environnement</div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '8px' }}>
                      {sivResult.co2 && <div><div style={{ fontSize: '10px', color: '#6B7280', textTransform: 'uppercase', marginBottom: '2px' }}>CO₂</div><div style={{ fontSize: '13px', fontWeight: 500, color: '#111827' }}>{sivResult.co2} g/km</div></div>}
                      {sivResult.normeEuro && <div><div style={{ fontSize: '10px', color: '#6B7280', textTransform: 'uppercase', marginBottom: '2px' }}>Norme Euro</div><div style={{ fontSize: '13px', fontWeight: 500, color: '#111827' }}>{sivResult.normeEuro}</div></div>}
                      {sivResult.critair && <div><div style={{ fontSize: '10px', color: '#6B7280', textTransform: 'uppercase', marginBottom: '2px' }}>Crit&apos;Air</div><div style={{ fontSize: '13px', fontWeight: 600, color: sivResult.critair === '1' ? '#059669' : sivResult.critair === '2' ? '#D97706' : '#DC2626' }}>{sivResult.critair}</div></div>}
                      {sivResult.consommationMixte && <div><div style={{ fontSize: '10px', color: '#6B7280', textTransform: 'uppercase', marginBottom: '2px' }}>Conso. mixte</div><div style={{ fontSize: '13px', fontWeight: 500, color: '#111827' }}>{sivResult.consommationMixte}</div></div>}
                    </div>
                  </div>

                  {/* Carrosserie & Dimensions */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '8px', marginBottom: '12px', padding: '12px', background: '#fff', borderRadius: '8px' }}>
                    {sivResult.bodyType && <div><div style={{ fontSize: '10px', color: '#6B7280', textTransform: 'uppercase', marginBottom: '2px' }}>Carrosserie</div><div style={{ fontSize: '13px', fontWeight: 500, color: '#111827' }}>{sivResult.bodyType}</div></div>}
                    {sivResult.doors && <div><div style={{ fontSize: '10px', color: '#6B7280', textTransform: 'uppercase', marginBottom: '2px' }}>Portes</div><div style={{ fontSize: '13px', fontWeight: 500, color: '#111827' }}>{sivResult.doors}</div></div>}
                    {sivResult.seats && <div><div style={{ fontSize: '10px', color: '#6B7280', textTransform: 'uppercase', marginBottom: '2px' }}>Places</div><div style={{ fontSize: '13px', fontWeight: 500, color: '#111827' }}>{sivResult.seats}</div></div>}
                    {sivResult.color && <div><div style={{ fontSize: '10px', color: '#6B7280', textTransform: 'uppercase', marginBottom: '2px' }}>Couleur</div><div style={{ fontSize: '13px', fontWeight: 500, color: '#111827' }}>{sivResult.color}</div></div>}
                    {sivResult.weight && <div><div style={{ fontSize: '10px', color: '#6B7280', textTransform: 'uppercase', marginBottom: '2px' }}>Poids</div><div style={{ fontSize: '13px', fontWeight: 500, color: '#111827' }}>{sivResult.weight} kg</div></div>}
                    {sivResult.ptac && <div><div style={{ fontSize: '10px', color: '#6B7280', textTransform: 'uppercase', marginBottom: '2px' }}>PTAC</div><div style={{ fontSize: '13px', fontWeight: 500, color: '#111827' }}>{sivResult.ptac} kg</div></div>}
                    {sivResult.longueur && <div><div style={{ fontSize: '10px', color: '#6B7280', textTransform: 'uppercase', marginBottom: '2px' }}>Longueur</div><div style={{ fontSize: '13px', fontWeight: 500, color: '#111827' }}>{sivResult.longueur}</div></div>}
                    {sivResult.coffre && <div><div style={{ fontSize: '10px', color: '#6B7280', textTransform: 'uppercase', marginBottom: '2px' }}>Coffre</div><div style={{ fontSize: '13px', fontWeight: 500, color: '#111827' }}>{sivResult.coffre}</div></div>}
                  </div>

                  {/* Performances */}
                  {(sivResult.couple || sivResult.acceleration || sivResult.vitesseMax) && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', marginBottom: '12px', padding: '12px', background: '#fff', borderRadius: '8px' }}>
                      {sivResult.couple && <div><div style={{ fontSize: '10px', color: '#6B7280', textTransform: 'uppercase', marginBottom: '2px' }}>Couple</div><div style={{ fontSize: '13px', fontWeight: 500, color: '#111827' }}>{sivResult.couple}</div></div>}
                      {sivResult.acceleration && <div><div style={{ fontSize: '10px', color: '#6B7280', textTransform: 'uppercase', marginBottom: '2px' }}>0-100 km/h</div><div style={{ fontSize: '13px', fontWeight: 500, color: '#111827' }}>{sivResult.acceleration}</div></div>}
                      {sivResult.vitesseMax && <div><div style={{ fontSize: '10px', color: '#6B7280', textTransform: 'uppercase', marginBottom: '2px' }}>Vitesse max</div><div style={{ fontSize: '13px', fontWeight: 500, color: '#111827' }}>{sivResult.vitesseMax}</div></div>}
                    </div>
                  )}

                  {/* Collection status */}
                  {sivResult.isCollector && (
                    <div style={{ padding: '10px 14px', borderRadius: '8px', background: '#FDF4FF', border: '1px solid #E879F9', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '13px', color: '#A21CAF', fontWeight: 600 }}>🏆 Véhicule de collection</span>
                    </div>
                  )}

                  <button onClick={handleSivImport} style={{ width: '100%', padding: '12px', borderRadius: '10px', border: 'none', background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)', color: '#fff', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}>Importer ces informations</button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {deleteModalOpen && vehicleToDelete && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0, 0, 0, 0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '20px' }} onClick={() => setDeleteModalOpen(false)}>
          <div style={{ background: '#fff', borderRadius: '20px', width: '100%', maxWidth: '400px', padding: '24px' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ width: '56px', height: '56px', borderRadius: '14px', background: '#FEF2F2', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px' }}><Trash2 size={28} color="#EF4444" /></div>
            <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#111827', margin: 0, marginBottom: '8px' }}>Supprimer le véhicule</h3>
            <p style={{ fontSize: '14px', color: '#6B7280', margin: 0, lineHeight: 1.6 }}>Êtes-vous sûr de vouloir supprimer <strong style={{ color: '#111827' }}>{getMake(vehicleToDelete)} {vehicleToDelete.model}</strong> ({getPlate(vehicleToDelete)}) ?</p>
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
