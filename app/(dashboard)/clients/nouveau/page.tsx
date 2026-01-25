'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { 
  ArrowLeft,
  User,
  Mail,
  MapPin,
  Building2,
  X,
  RefreshCw,
  AlertCircle,
  CheckCircle
} from 'lucide-react'

// ============================================================================
// NEW CLIENT PAGE - SafeMotor
// Design moderne avec données réelles
// ============================================================================

interface Garage {
  id: number
  name: string
}

export default function NouveauClientPage() {
  const router = useRouter()
  
  const [garages, setGarages] = useState<Garage[]>([])
  const [loadingGarages, setLoadingGarages] = useState(true)
  
  const [formData, setFormData] = useState({
    garageId: '',
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    gender: '',
    vatMode: 'STANDARD',
  })
  
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    loadGarages()
  }, [])

  const loadGarages = async () => {
    setLoadingGarages(true)
    try {
      const response = await fetch('/api/garages')
      const data = await response.json()
      
      if (data.ok || Array.isArray(data)) {
        const items = data.data?.items || data.items || data.garages || data.data?.garages || (Array.isArray(data) ? data : [])
        setGarages(items)
        if (items.length > 0 && !formData.garageId) {
          setFormData(prev => ({ ...prev, garageId: String(items[0].id) }))
        }
      }
    } catch (err) {
      console.error('Error loading garages:', err)
    } finally {
      setLoadingGarages(false)
    }
  }

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {}
    
    if (!formData.firstName.trim()) errors.firstName = 'Le prénom est requis'
    if (!formData.lastName.trim()) errors.lastName = 'Le nom est requis'
    
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = "Format d'email invalide"
    }
    
    if (!formData.garageId) errors.garageId = 'Sélectionnez un garage'
    
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return
    
    setIsSaving(true)
    setError(null)
    
    try {
      const payload = {
        garageId: Number(formData.garageId),
        name: `${formData.firstName} ${formData.lastName}`.trim(),
        email: formData.email || undefined,
        phone: formData.phone || undefined,
        address: formData.address || undefined,
        vatMode: formData.vatMode,
      }
      
      const response = await fetch('/api/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      
      const data = await response.json()
      
      if (data.ok) {
        setSuccess(true)
        setTimeout(() => {
          const clientId = data.data?.id
          router.push(clientId ? `/clients/${clientId}` : '/clients')
        }, 1000)
      } else {
        setError(data.error || 'Erreur lors de la création')
      }
    } catch (err) {
      console.error('Error creating client:', err)
      setError('Erreur de connexion au serveur')
    } finally {
      setIsSaving(false)
    }
  }

  if (success) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '400px' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: '#D1FAE5', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <CheckCircle size={32} color="#10B981" />
          </div>
          <h2 style={{ fontSize: '20px', fontWeight: 600, color: '#111827', marginBottom: '8px' }}>Client créé !</h2>
          <p style={{ fontSize: '14px', color: '#6B7280' }}>Redirection en cours...</p>
        </div>
      </div>
    )
  }

  return (
    <div style={{ padding: '32px', maxWidth: '600px', margin: '0 auto' }}>
      {/* Back */}
      <button
        onClick={() => router.push('/clients')}
        style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px', padding: '10px 16px', borderRadius: '10px', border: '1px solid #E5E7EB', background: '#fff', fontSize: '14px', fontWeight: 500, color: '#374151', cursor: 'pointer' }}
      >
        <ArrowLeft size={18} />
        Retour aux clients
      </button>

      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 700, color: '#111827', margin: 0, marginBottom: '8px' }}>
          Nouveau client
        </h1>
        <p style={{ fontSize: '15px', color: '#6B7280', margin: 0 }}>
          Renseignez les informations du client
        </p>
      </div>

      {/* Error */}
      {error && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '16px 20px', borderRadius: '12px', background: '#FEF2F2', border: '1px solid #FECACA', marginBottom: '24px' }}>
          <AlertCircle size={20} color="#EF4444" />
          <span style={{ fontSize: '14px', color: '#DC2626', flex: 1 }}>{error}</span>
          <button onClick={() => setError(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}>
            <X size={16} color="#EF4444" />
          </button>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit}>
        <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid #E5E7EB', padding: '24px', marginBottom: '24px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#111827', margin: 0, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Building2 size={20} color="#6366F1" />
            Garage
          </h3>
          
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#374151', marginBottom: '6px' }}>
              Garage *
            </label>
            <select
              value={formData.garageId}
              onChange={(e) => setFormData({ ...formData, garageId: e.target.value })}
              disabled={loadingGarages || garages.length <= 1}
              style={{ width: '100%', padding: '12px 14px', borderRadius: '10px', border: formErrors.garageId ? '1px solid #EF4444' : '1px solid #E5E7EB', fontSize: '14px', outline: 'none', background: '#fff', cursor: loadingGarages ? 'wait' : 'pointer' }}
            >
              {loadingGarages ? (
                <option value="">Chargement des garages...</option>
              ) : garages.length === 0 ? (
                <option value="">Aucun garage disponible</option>
              ) : (
                <>
                  <option value="">Sélectionner un garage</option>
                  {garages.map((garage) => (
                    <option key={garage.id} value={String(garage.id)}>{garage.name}</option>
                  ))}
                </>
              )}
            </select>
            {formErrors.garageId && <p style={{ fontSize: '12px', color: '#EF4444', margin: '4px 0 0' }}>{formErrors.garageId}</p>}
          </div>
        </div>

        <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid #E5E7EB', padding: '24px', marginBottom: '24px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#111827', margin: 0, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <User size={20} color="#6366F1" />
            Identité
          </h3>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#374151', marginBottom: '6px' }}>
                Prénom *
              </label>
              <input
                type="text"
                placeholder="Jean"
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                style={{ width: '100%', padding: '12px 14px', borderRadius: '10px', border: formErrors.firstName ? '1px solid #EF4444' : '1px solid #E5E7EB', fontSize: '14px', outline: 'none' }}
              />
              {formErrors.firstName && <p style={{ fontSize: '12px', color: '#EF4444', margin: '4px 0 0' }}>{formErrors.firstName}</p>}
            </div>
            
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#374151', marginBottom: '6px' }}>
                Nom *
              </label>
              <input
                type="text"
                placeholder="Dupont"
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                style={{ width: '100%', padding: '12px 14px', borderRadius: '10px', border: formErrors.lastName ? '1px solid #EF4444' : '1px solid #E5E7EB', fontSize: '14px', outline: 'none' }}
              />
              {formErrors.lastName && <p style={{ fontSize: '12px', color: '#EF4444', margin: '4px 0 0' }}>{formErrors.lastName}</p>}
            </div>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#374151', marginBottom: '6px' }}>
              Genre
            </label>
            <select
              value={formData.gender}
              onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
              style={{ width: '100%', padding: '12px 14px', borderRadius: '10px', border: '1px solid #E5E7EB', fontSize: '14px', outline: 'none', background: '#fff' }}
            >
              <option value="">Non précisé</option>
              <option value="HOMME">Homme</option>
              <option value="FEMME">Femme</option>
            </select>
          </div>
        </div>

        <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid #E5E7EB', padding: '24px', marginBottom: '24px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#111827', margin: 0, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Mail size={20} color="#6366F1" />
            Contact
          </h3>
          
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#374151', marginBottom: '6px' }}>
              Email <span style={{ color: '#6366F1', fontWeight: 400 }}>(requis pour signature)</span>
            </label>
            <input
              type="email"
              placeholder="jean.dupont@email.fr"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              style={{ width: '100%', padding: '12px 14px', borderRadius: '10px', border: formErrors.email ? '1px solid #EF4444' : '1px solid #E5E7EB', fontSize: '14px', outline: 'none' }}
            />
            {formErrors.email && <p style={{ fontSize: '12px', color: '#EF4444', margin: '4px 0 0' }}>{formErrors.email}</p>}
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#374151', marginBottom: '6px' }}>
              Téléphone
            </label>
            <input
              type="tel"
              placeholder="06 12 34 56 78"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              style={{ width: '100%', padding: '12px 14px', borderRadius: '10px', border: '1px solid #E5E7EB', fontSize: '14px', outline: 'none' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#374151', marginBottom: '6px' }}>
              Adresse
            </label>
            <input
              type="text"
              placeholder="12 rue de la République, 75001 Paris"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              style={{ width: '100%', padding: '12px 14px', borderRadius: '10px', border: '1px solid #E5E7EB', fontSize: '14px', outline: 'none' }}
            />
          </div>
        </div>

        <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid #E5E7EB', padding: '24px', marginBottom: '32px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#111827', margin: 0, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <MapPin size={20} color="#6366F1" />
            Facturation
          </h3>
          
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#374151', marginBottom: '6px' }}>
              TVA
            </label>
            <select
              value={formData.vatMode}
              onChange={(e) => setFormData({ ...formData, vatMode: e.target.value })}
              style={{ width: '100%', padding: '12px 14px', borderRadius: '10px', border: '1px solid #E5E7EB', fontSize: '14px', outline: 'none', background: '#fff' }}
            >
              <option value="STANDARD">Standard (20%)</option>
              <option value="REDUCED_10">Réduite (10%)</option>
              <option value="REDUCED_55">Réduite (5,5%)</option>
              <option value="EXEMPT">Exonérée (0%)</option>
            </select>
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
          <button
            type="button"
            onClick={() => router.push('/clients')}
            disabled={isSaving}
            style={{ padding: '14px 24px', borderRadius: '12px', border: '1px solid #E5E7EB', background: '#fff', fontSize: '14px', fontWeight: 600, color: '#374151', cursor: 'pointer' }}
          >
            Annuler
          </button>
          <button
            type="submit"
            disabled={isSaving || garages.length === 0}
            style={{ padding: '14px 32px', borderRadius: '12px', border: 'none', background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)', fontSize: '14px', fontWeight: 600, color: '#fff', cursor: isSaving ? 'wait' : 'pointer', opacity: isSaving || garages.length === 0 ? 0.7 : 1, boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)' }}
          >
            {isSaving ? (
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <RefreshCw size={16} style={{ animation: 'spin 1s linear infinite' }} />
                Création...
              </span>
            ) : (
              'Créer le client'
            )}
          </button>
        </div>
      </form>

      <style dangerouslySetInnerHTML={{ __html: `@keyframes spin { to { transform: rotate(360deg); } }` }} />
    </div>
  )
}
