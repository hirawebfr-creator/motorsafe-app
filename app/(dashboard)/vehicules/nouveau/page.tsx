'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { 
  ArrowLeft,
  Search,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Car,
  Settings,
  User,
  Hash
} from 'lucide-react'

// ============================================================================
// NEW VEHICLE PAGE - SafeMotor
// Design moderne avec SIV lookup intégré
// ============================================================================

interface ClientLite {
  id: number
  firstName: string
  lastName: string
  email?: string | null
  phone?: string | null
}

interface VehiclePrefill {
  brand: string
  model: string
  variant?: string
  version?: string
  vin?: string
  typeMine?: string
  cnit?: string
  firstRegistrationDate?: string
  year?: number
  fuel?: string
  engine?: string
  engineCode?: string
  ccm?: number
  cylinders?: number
  powerFiscal?: number
  powerCh?: number
  powerKw?: number
  gearbox?: string
  bodyType?: string
  color?: string
  doors?: number
  seats?: number
  weightKg?: number
  ptacKg?: number
  co2?: number
  sraId?: string
  sraGroup?: string
  sraCommercial?: string
  logoUrl?: string
  photoUrl?: string
}

const FUEL_OPTIONS = [
  { value: 'ESSENCE', label: 'Essence', color: '#EF4444' },
  { value: 'DIESEL', label: 'Diesel', color: '#1D4ED8' },
  { value: 'ELECTRIC', label: 'Électrique', color: '#6366F1' },
  { value: 'HYBRID', label: 'Hybride', color: '#10B981' },
  { value: 'GPL', label: 'GPL', color: '#F59E0B' }
]

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function unwrapOk(json: unknown): unknown {
  if (isRecord(json) && json.ok === true && 'data' in json) return json.data
  return json
}

function pickArray(json: unknown): unknown[] {
  const data = unwrapOk(json)
  if (Array.isArray(data)) return data
  if (isRecord(data) && Array.isArray(data.items)) return data.items
  if (isRecord(data) && Array.isArray(data.data)) return data.data
  return []
}

export default function NouveauVehiculePage() {
  const router = useRouter()
  
  // Client search
  const [clientQuery, setClientQuery] = useState('')
  const [clientLoading, setClientLoading] = useState(false)
  const [clientOptions, setClientOptions] = useState<ClientLite[]>([])
  const [selectedClient, setSelectedClient] = useState<ClientLite | null>(null)
  const [showClientDropdown, setShowClientDropdown] = useState(false)
  const debounceRef = useRef<number | null>(null)
  
  // Form data
  const [plate, setPlate] = useState('')
  const [vin, setVin] = useState('')
  const [brand, setBrand] = useState('')
  const [model, setModel] = useState('')
  const [version, setVersion] = useState('')
  const [year, setYear] = useState('')
  const [fuel, setFuel] = useState('ESSENCE')
  const [mileage, setMileage] = useState('')
  const [color, setColor] = useState('')
  
  // SIV Lookup
  const [lookupLoading, setLookupLoading] = useState(false)
  const [lookupSuccess, setLookupSuccess] = useState(false)
  const [lookupError, setLookupError] = useState<string | null>(null)
  const [lookupSource, setLookupSource] = useState<'cache' | 'api' | null>(null)
  const [vehicleDetails, setVehicleDetails] = useState<VehiclePrefill | null>(null)
  const [logoUrl, setLogoUrl] = useState<string | null>(null)
  const [photoUrl, setPhotoUrl] = useState<string | null>(null)
  const [quotaInfo, setQuotaInfo] = useState<{ current: number; limit: number; remaining: number } | null>(null)
  
  // Submit
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [, setCreatedId] = useState<string | null>(null)

  const loadClients = async (q: string) => {
    try {
      setClientLoading(true)
      const url = new URL('/api/clients', window.location.origin)
      url.searchParams.set('page', '1')
      url.searchParams.set('pageSize', '20')
      if (q.trim()) url.searchParams.set('q', q.trim())

      const res = await fetch(url.toString(), { cache: 'no-store' })
      const json = await res.json().catch(() => null)
      if (!res.ok) throw new Error('Erreur chargement')
      setClientOptions(pickArray(json) as ClientLite[])
    } catch {
      setClientOptions([])
    } finally {
      setClientLoading(false)
    }
  }

  useEffect(() => { loadClients('') }, [])

  useEffect(() => {
    if (debounceRef.current) window.clearTimeout(debounceRef.current)
    debounceRef.current = window.setTimeout(() => {
      loadClients(clientQuery)
    }, 250)
    return () => { if (debounceRef.current) window.clearTimeout(debounceRef.current) }
  }, [clientQuery])

  const selectedClientLabel = useMemo(() => {
    if (!selectedClient) return null
    const name = `${selectedClient.firstName || ''} ${selectedClient.lastName || ''}`.trim()
    return name || `Client #${selectedClient.id}`
  }, [selectedClient])

  const lookupPlate = async (forceRefresh = false) => {
    if (!plate.trim()) {
      setLookupError("Entrez une plaque d'immatriculation")
      return
    }
    
    setLookupLoading(true)
    setLookupError(null)
    setLookupSuccess(false)
    setVehicleDetails(null)
    setLogoUrl(null)
    setPhotoUrl(null)
    setQuotaInfo(null)
    setLookupSource(null)
    
    try {
      const res = await fetch('/api/vehicules/lookup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ immatriculation: plate.trim(), forceRefresh })
      })
      
      const json = await res.json().catch(() => null)
      
      if (json?.quota) setQuotaInfo(json.quota)
      if (json?.data?.source) setLookupSource(json.data.source as 'cache' | 'api')
      
      if (!res.ok || !json?.ok) {
        setLookupError(json?.error?.message || 'Véhicule non trouvé')
        return
      }
      
      const prefill = json.data?.data as VehiclePrefill | undefined
      if (!prefill) {
        setLookupError('Aucune donnée trouvée')
        return
      }
      
      // Auto-fill form
      if (prefill.brand) setBrand(prefill.brand)
      if (prefill.model) setModel(prefill.model)
      if (prefill.version) setVersion(prefill.version)
      if (prefill.vin) setVin(prefill.vin)
      if (prefill.fuel) setFuel(prefill.fuel)
      if (prefill.year) setYear(String(prefill.year))
      if (prefill.color) setColor(prefill.color)
      if (prefill.logoUrl) setLogoUrl(prefill.logoUrl)
      if (prefill.photoUrl) setPhotoUrl(prefill.photoUrl)
      
      setVehicleDetails(prefill)
      setLookupSuccess(true)
    } catch {
      setLookupError('Erreur de connexion')
    } finally {
      setLookupLoading(false)
    }
  }

  const handleSubmit = async () => {
    setError(null)
    
    if (!selectedClient?.id) {
      setError('Veuillez sélectionner un client')
      return
    }
    if (!plate.trim()) {
      setError("L'immatriculation est obligatoire")
      return
    }
    if (!brand.trim()) {
      setError('La marque est obligatoire')
      return
    }
    if (!model.trim()) {
      setError('Le modèle est obligatoire')
      return
    }
    
    setSaving(true)
    
    try {
      const payload: Record<string, any> = {
        clientId: selectedClient.id,
        registrationNumber: plate.trim().toUpperCase(),
        make: brand.trim(),
        model: model.trim(),
        fuelType: fuel
      }
      
      if (vin) payload.vin = vin.toUpperCase()
      if (version) payload.version = version
      if (year) payload.year = parseInt(year)
      if (mileage) payload.mileage = parseInt(mileage)
      if (color) payload.color = color
      
      const res = await fetch('/api/vehicules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      
      const json = await res.json().catch(() => null)
      
      if (!res.ok || !json?.ok) {
        setError(json?.error?.message || json?.error || 'Erreur lors de la création')
        return
      }
      
      const data = unwrapOk(json)
      const id = isRecord(data) && typeof data.id === 'string' ? data.id : null
      setCreatedId(id)
      setSuccess(true)
      
      setTimeout(() => {
        router.push(id ? `/vehicules/${id}` : '/vehicules')
      }, 1500)
    } catch (err) {
      console.error('Error creating vehicle:', err)
      setError('Erreur de connexion')
    } finally {
      setSaving(false)
    }
  }

  if (success) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '400px' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: '80px', height: '80px', borderRadius: '20px', background: '#D1FAE5', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
            <CheckCircle size={40} color="#10B981" />
          </div>
          <h2 style={{ fontSize: '24px', fontWeight: 700, color: '#111827', margin: 0, marginBottom: '8px' }}>Véhicule créé !</h2>
          <p style={{ fontSize: '14px', color: '#6B7280', margin: 0 }}>Redirection en cours...</p>
        </div>
      </div>
    )
  }

  return (
    <div style={{ padding: '32px', maxWidth: '900px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button onClick={() => router.push('/vehicules')} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '40px', height: '40px', borderRadius: '10px', border: '1px solid #E5E7EB', background: '#fff', cursor: 'pointer' }}>
            <ArrowLeft size={20} color="#374151" />
          </button>
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#111827', margin: 0 }}>Nouveau véhicule</h1>
            <p style={{ fontSize: '14px', color: '#6B7280', margin: 0 }}>Ajouter un véhicule à la flotte</p>
          </div>
        </div>
        <button onClick={handleSubmit} disabled={saving} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 24px', borderRadius: '12px', border: 'none', background: saving ? '#9CA3AF' : 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)', color: '#fff', fontSize: '14px', fontWeight: 600, cursor: saving ? 'wait' : 'pointer', boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)' }}>
          <Car size={18} />
          {saving ? 'Création...' : 'Créer le véhicule'}
        </button>
      </div>

      {/* Error */}
      {error && (
        <div style={{ marginBottom: '24px', padding: '16px', borderRadius: '12px', background: '#FEF2F2', border: '1px solid #FECACA', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <AlertCircle size={20} color="#EF4444" />
          <span style={{ fontSize: '14px', color: '#DC2626' }}>{error}</span>
        </div>
      )}

      {/* SIV Lookup Card */}
      <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid #E5E7EB', padding: '24px', marginBottom: '24px' }}>
        <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#111827', margin: 0, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Hash size={20} color="#6366F1" />
          Recherche par immatriculation
        </h3>
        
        <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-end' }}>
          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#374151', marginBottom: '6px' }}>Plaque d'immatriculation *</label>
            <input
              type="text"
              value={plate}
              onChange={(e) => { setPlate(e.target.value.toUpperCase()); setLookupSuccess(false); setLookupError(null) }}
              placeholder="Ex: AB-123-CD"
              style={{ width: '100%', padding: '12px 14px', borderRadius: '10px', border: '1px solid #E5E7EB', fontSize: '15px', fontWeight: 600, outline: 'none', letterSpacing: '1px', textTransform: 'uppercase' }}
            />
          </div>
          <button onClick={() => lookupPlate(false)} disabled={lookupLoading || !plate.trim()} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 20px', borderRadius: '10px', border: 'none', background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)', color: '#fff', fontSize: '14px', fontWeight: 600, cursor: lookupLoading ? 'wait' : 'pointer', opacity: lookupLoading || !plate.trim() ? 0.6 : 1, whiteSpace: 'nowrap' }}>
            {lookupLoading ? <RefreshCw size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Search size={16} />}
            Rechercher
          </button>
          {lookupSuccess && lookupSource === 'cache' && (
            <button onClick={() => lookupPlate(true)} disabled={lookupLoading} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '12px 16px', borderRadius: '10px', border: '1px solid #E5E7EB', background: '#fff', color: '#374151', fontSize: '13px', fontWeight: 500, cursor: 'pointer' }}>
              <RefreshCw size={14} /> Actualiser
            </button>
          )}
          {logoUrl && (
            <img src={logoUrl} alt="Logo" style={{ height: '40px', width: 'auto', objectFit: 'contain' }} onError={() => setLogoUrl(null)} />
          )}
        </div>
        
        {quotaInfo && (
          <p style={{ fontSize: '12px', color: '#6B7280', margin: '12px 0 0' }}>{quotaInfo.remaining}/{quotaInfo.limit} recherches restantes ce mois</p>
        )}
        
        {lookupError && (
          <div style={{ marginTop: '16px', padding: '12px 16px', borderRadius: '10px', background: '#FEF2F2', border: '1px solid #FECACA' }}>
            <p style={{ fontSize: '13px', color: '#DC2626', margin: 0 }}>{lookupError}</p>
            <p style={{ fontSize: '12px', color: '#6B7280', margin: '8px 0 0' }}>💡 Vous pouvez saisir les informations manuellement ci-dessous.</p>
          </div>
        )}
        
        {lookupSuccess && vehicleDetails && (
          <div style={{ marginTop: '16px', padding: '16px', borderRadius: '12px', background: '#F0FDF4', border: '1px solid #BBF7D0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <CheckCircle size={18} color="#10B981" />
              <span style={{ fontSize: '14px', fontWeight: 600, color: '#166534' }}>Véhicule trouvé — champs pré-remplis</span>
              {lookupSource && (
                <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '100px', background: lookupSource === 'cache' ? '#DBEAFE' : '#D1FAE5', color: lookupSource === 'cache' ? '#1D4ED8' : '#10B981' }}>
                  {lookupSource === 'cache' ? '📦 cache' : '🌐 api'}
                </span>
              )}
            </div>
            
            <div style={{ display: 'flex', gap: '16px' }}>
              {photoUrl && (
                <img src={photoUrl} alt={`${vehicleDetails.brand} ${vehicleDetails.model}`} style={{ width: '120px', height: '80px', borderRadius: '8px', objectFit: 'cover', background: '#fff' }} onError={() => setPhotoUrl(null)} />
              )}
              <div style={{ flex: 1, display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
                {vehicleDetails.year && <div><div style={{ fontSize: '11px', color: '#6B7280', textTransform: 'uppercase' }}>Année</div><div style={{ fontSize: '14px', fontWeight: 600, color: '#111827' }}>{vehicleDetails.year}</div></div>}
                {vehicleDetails.fuel && <div><div style={{ fontSize: '11px', color: '#6B7280', textTransform: 'uppercase' }}>Énergie</div><div style={{ fontSize: '14px', fontWeight: 600, color: '#111827' }}>{vehicleDetails.fuel}</div></div>}
                {(vehicleDetails.powerCh || vehicleDetails.powerKw) && <div><div style={{ fontSize: '11px', color: '#6B7280', textTransform: 'uppercase' }}>Puissance</div><div style={{ fontSize: '14px', fontWeight: 600, color: '#111827' }}>{vehicleDetails.powerCh ? `${vehicleDetails.powerCh} ch` : `${vehicleDetails.powerKw} kW`}</div></div>}
                {vehicleDetails.gearbox && <div><div style={{ fontSize: '11px', color: '#6B7280', textTransform: 'uppercase' }}>Boîte</div><div style={{ fontSize: '14px', fontWeight: 600, color: '#111827' }}>{vehicleDetails.gearbox}</div></div>}
                {vehicleDetails.bodyType && <div><div style={{ fontSize: '11px', color: '#6B7280', textTransform: 'uppercase' }}>Carrosserie</div><div style={{ fontSize: '14px', fontWeight: 600, color: '#111827' }}>{vehicleDetails.bodyType}</div></div>}
                {vehicleDetails.co2 && <div><div style={{ fontSize: '11px', color: '#6B7280', textTransform: 'uppercase' }}>CO₂</div><div style={{ fontSize: '14px', fontWeight: 600, color: '#111827' }}>{vehicleDetails.co2} g/km</div></div>}
              </div>
            </div>
            
            {(vehicleDetails.vin || vehicleDetails.typeMine || vehicleDetails.cnit) && (
              <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #BBF7D0', display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                {vehicleDetails.vin && <span style={{ fontSize: '12px', color: '#6B7280' }}>VIN: <span style={{ fontFamily: 'monospace', color: '#111827' }}>{vehicleDetails.vin}</span></span>}
                {vehicleDetails.typeMine && <span style={{ fontSize: '12px', color: '#6B7280' }}>Type mine: {vehicleDetails.typeMine}</span>}
                {vehicleDetails.cnit && <span style={{ fontSize: '12px', color: '#6B7280' }}>CNIT: {vehicleDetails.cnit}</span>}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Client Selection */}
      <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid #E5E7EB', padding: '24px', marginBottom: '24px' }}>
        <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#111827', margin: 0, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <User size={20} color="#6366F1" />
          Propriétaire
        </h3>
        
        <div style={{ position: 'relative' }}>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#374151', marginBottom: '6px' }}>Client *</label>
          <div style={{ position: 'relative' }}>
            <Search size={18} color="#9CA3AF" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              value={selectedClient ? '' : clientQuery}
              onChange={(e) => { setClientQuery(e.target.value); setSelectedClient(null) }}
              onFocus={() => setShowClientDropdown(true)}
              placeholder="Rechercher un client (nom, email...)"
              style={{ width: '100%', padding: '12px 14px 12px 44px', borderRadius: '10px', border: '1px solid #E5E7EB', fontSize: '14px', outline: 'none' }}
            />
          </div>
          
          {selectedClient && (
            <div style={{ marginTop: '12px', display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', borderRadius: '10px', background: '#EEF2FF', border: '1px solid #C7D2FE' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <User size={20} color="#fff" />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '14px', fontWeight: 600, color: '#111827' }}>{selectedClientLabel}</div>
                {selectedClient.email && <div style={{ fontSize: '12px', color: '#6B7280' }}>{selectedClient.email}</div>}
              </div>
              <button onClick={() => { setSelectedClient(null); setShowClientDropdown(true) }} style={{ padding: '6px 12px', borderRadius: '8px', border: '1px solid #C7D2FE', background: '#fff', fontSize: '12px', fontWeight: 500, color: '#6366F1', cursor: 'pointer' }}>Changer</button>
            </div>
          )}
          
          {showClientDropdown && !selectedClient && (
            <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, marginTop: '4px', background: '#fff', borderRadius: '10px', border: '1px solid #E5E7EB', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', maxHeight: '240px', overflowY: 'auto', zIndex: 50 }}>
              {clientLoading ? (
                <div style={{ padding: '16px', textAlign: 'center', fontSize: '13px', color: '#6B7280' }}>Chargement...</div>
              ) : clientOptions.length === 0 ? (
                <div style={{ padding: '16px', textAlign: 'center', fontSize: '13px', color: '#6B7280' }}>Aucun client trouvé</div>
              ) : (
                clientOptions.map((client) => {
                  const name = `${client.firstName || ''} ${client.lastName || ''}`.trim() || `Client #${client.id}`
                  return (
                    <button key={client.id} onClick={() => { setSelectedClient(client); setShowClientDropdown(false) }} style={{ display: 'flex', flexDirection: 'column', gap: '2px', width: '100%', padding: '12px 16px', border: 'none', background: 'transparent', textAlign: 'left', cursor: 'pointer' }} onMouseEnter={(e) => e.currentTarget.style.background = '#F9FAFB'} onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
                      <span style={{ fontSize: '14px', fontWeight: 600, color: '#111827' }}>{name}</span>
                      {(client.email || client.phone) && <span style={{ fontSize: '12px', color: '#6B7280' }}>{[client.email, client.phone].filter(Boolean).join(' • ')}</span>}
                    </button>
                  )
                })
              )}
            </div>
          )}
        </div>
      </div>

      {/* Vehicle Info Form */}
      <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid #E5E7EB', padding: '24px' }}>
        <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#111827', margin: 0, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Settings size={20} color="#6366F1" />
          Informations du véhicule
        </h3>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#374151', marginBottom: '6px' }}>Marque *</label>
            <input type="text" value={brand} onChange={(e) => setBrand(e.target.value)} placeholder="Ex: Renault" style={{ width: '100%', padding: '12px 14px', borderRadius: '10px', border: '1px solid #E5E7EB', fontSize: '14px', outline: 'none' }} />
          </div>
          
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#374151', marginBottom: '6px' }}>Modèle *</label>
            <input type="text" value={model} onChange={(e) => setModel(e.target.value)} placeholder="Ex: Clio" style={{ width: '100%', padding: '12px 14px', borderRadius: '10px', border: '1px solid #E5E7EB', fontSize: '14px', outline: 'none' }} />
          </div>
          
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#374151', marginBottom: '6px' }}>Version</label>
            <input type="text" value={version} onChange={(e) => setVersion(e.target.value)} placeholder="Ex: 1.5 dCi 90ch" style={{ width: '100%', padding: '12px 14px', borderRadius: '10px', border: '1px solid #E5E7EB', fontSize: '14px', outline: 'none' }} />
          </div>
          
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#374151', marginBottom: '6px' }}>VIN</label>
            <input type="text" value={vin} onChange={(e) => setVin(e.target.value.toUpperCase())} placeholder="17 caractères" maxLength={17} style={{ width: '100%', padding: '12px 14px', borderRadius: '10px', border: '1px solid #E5E7EB', fontSize: '14px', outline: 'none', fontFamily: 'monospace' }} />
          </div>
          
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#374151', marginBottom: '6px' }}>Énergie</label>
            <select value={fuel} onChange={(e) => setFuel(e.target.value)} style={{ width: '100%', padding: '12px 14px', borderRadius: '10px', border: '1px solid #E5E7EB', fontSize: '14px', outline: 'none', background: '#fff' }}>
              {FUEL_OPTIONS.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
            </select>
          </div>
          
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#374151', marginBottom: '6px' }}>Année</label>
            <input type="number" value={year} onChange={(e) => setYear(e.target.value)} placeholder="Ex: 2020" min="1900" max="2099" style={{ width: '100%', padding: '12px 14px', borderRadius: '10px', border: '1px solid #E5E7EB', fontSize: '14px', outline: 'none' }} />
          </div>
          
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#374151', marginBottom: '6px' }}>Kilométrage</label>
            <input type="number" value={mileage} onChange={(e) => setMileage(e.target.value)} placeholder="Ex: 50000" min="0" style={{ width: '100%', padding: '12px 14px', borderRadius: '10px', border: '1px solid #E5E7EB', fontSize: '14px', outline: 'none' }} />
          </div>
          
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#374151', marginBottom: '6px' }}>Couleur</label>
            <input type="text" value={color} onChange={(e) => setColor(e.target.value)} placeholder="Ex: Noir" style={{ width: '100%', padding: '12px 14px', borderRadius: '10px', border: '1px solid #E5E7EB', fontSize: '14px', outline: 'none' }} />
          </div>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `@keyframes spin { to { transform: rotate(360deg); } }` }} />
    </div>
  )
}
