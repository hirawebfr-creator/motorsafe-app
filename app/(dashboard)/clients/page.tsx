'use client'

import { useState, useEffect, useMemo } from 'react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { 
  Search, 
  Plus, 
  Users, 
  Mail,
  Phone,
  ChevronRight,
  RefreshCw,
  MapPin,
  Car,
  Euro,
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
// CLIENTS LIST PAGE - SafeMotor
// Design moderne avec données réelles
// ============================================================================

interface Client {
  id: string
  name?: string
  firstName?: string
  lastName?: string
  email?: string
  phone?: string
  address?: string
  city?: string
  postalCode?: string
  country?: string
  genre?: string
  vatMode?: string
  garageId?: number
  vehicleCount?: number
  interventionCount?: number
  totalRevenue?: number
  createdAt: Date
}

export default function ClientsPage() {
  const router = useRouter()
  const { isMobile, isTablet } = useResponsive()
  
  const [clients, setClients] = useState<Client[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  
  // Delete modal
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [clientToDelete, setClientToDelete] = useState<Client | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const loadClients = async () => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams()
      params.set('pageSize', '100')
      if (searchQuery) params.set('q', searchQuery)
      
      const response = await fetch(`/api/clients?${params.toString()}`)
      const data = await response.json()
      
      if (data.ok && data.data) {
        setClients(data.data.items || [])
      }
    } catch {
      toast.error('Erreur lors du chargement des clients')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadClients()
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => loadClients(), 300)
    return () => clearTimeout(timer)
  }, [searchQuery])

  const getClientName = (c: Client) => {
    if (c.name) return c.name
    return `${c.firstName || ''} ${c.lastName || ''}`.trim() || `Client #${c.id}`
  }

  const getInitials = (c: Client) => {
    const name = getClientName(c)
    const parts = name.split(' ')
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
    }
    return name.substring(0, 2).toUpperCase()
  }

  // Stats
  const stats = useMemo(() => {
    const total = clients.length
    const withEmail = clients.filter(c => c.email).length
    const withPhone = clients.filter(c => c.phone).length
    const totalRevenue = clients.reduce((sum, c) => sum + (c.totalRevenue || 0), 0)
    return { total, withEmail, withPhone, totalRevenue }
  }, [clients])

  const handleDelete = async () => {
    if (!clientToDelete) return
    setIsDeleting(true)
    
    try {
      const response = await fetch(`/api/clients/${clientToDelete.id}`, { method: 'DELETE' })
      const data = await response.json()
      
      if (data.ok) {
        setDeleteModalOpen(false)
        setClientToDelete(null)
        toast.success('Client supprimé')
        loadClients()
      }
    } catch {
      toast.error('Erreur lors de la suppression')
    } finally {
      setIsDeleting(false)
    }
  }

  const formatCurrency = (amount?: number): string => {
    if (!amount) return '0 €'
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(amount)
  }

  return (
    <div style={{ padding: isMobile ? '16px' : isTablet ? '24px' : '32px', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', justifyContent: 'space-between', alignItems: isMobile ? 'stretch' : 'center', marginBottom: isMobile ? '24px' : '32px', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: isMobile ? '22px' : '28px', fontWeight: 700, color: '#111827', margin: 0, marginBottom: '4px' }}>Clients</h1>
          <p style={{ fontSize: isMobile ? '13px' : '14px', color: '#6B7280', margin: 0 }}>Gérez votre portefeuille clients</p>
        </div>
        <button onClick={() => router.push('/clients/nouveau')} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: isMobile ? '12px 16px' : '12px 20px', borderRadius: '12px', border: 'none', background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)', fontSize: '14px', fontWeight: 600, color: '#fff', cursor: 'pointer', boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)' }}>
          <Plus size={18} /> Nouveau client
        </button>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : isTablet ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)', gap: isMobile ? '12px' : '16px', marginBottom: isMobile ? '24px' : '32px' }}>
        <div style={{ padding: isMobile ? '16px' : '20px', borderRadius: '16px', background: '#fff', border: '1px solid #E5E7EB' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '10px' : '14px' }}>
            <div style={{ width: isMobile ? '40px' : '48px', height: isMobile ? '40px' : '48px', borderRadius: '12px', background: '#EEF2FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Users size={isMobile ? 20 : 24} color="#6366F1" /></div>
            <div><p style={{ fontSize: isMobile ? '11px' : '13px', color: '#6B7280', margin: 0 }}>Total</p><p style={{ fontSize: isMobile ? '22px' : '28px', fontWeight: 700, color: '#111827', margin: 0 }}>{stats.total}</p></div>
          </div>
        </div>
        <div style={{ padding: isMobile ? '16px' : '20px', borderRadius: '16px', background: '#fff', border: '1px solid #E5E7EB' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '10px' : '14px' }}>
            <div style={{ width: isMobile ? '40px' : '48px', height: isMobile ? '40px' : '48px', borderRadius: '12px', background: '#DBEAFE', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Mail size={isMobile ? 20 : 24} color="#3B82F6" /></div>
            <div><p style={{ fontSize: isMobile ? '11px' : '13px', color: '#6B7280', margin: 0 }}>Email</p><p style={{ fontSize: isMobile ? '22px' : '28px', fontWeight: 700, color: '#3B82F6', margin: 0 }}>{stats.withEmail}</p></div>
          </div>
        </div>
        <div style={{ padding: isMobile ? '16px' : '20px', borderRadius: '16px', background: '#fff', border: '1px solid #E5E7EB' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '10px' : '14px' }}>
            <div style={{ width: isMobile ? '40px' : '48px', height: isMobile ? '40px' : '48px', borderRadius: '12px', background: '#D1FAE5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Phone size={isMobile ? 20 : 24} color="#10B981" /></div>
            <div><p style={{ fontSize: isMobile ? '11px' : '13px', color: '#6B7280', margin: 0 }}>Tél</p><p style={{ fontSize: isMobile ? '22px' : '28px', fontWeight: 700, color: '#10B981', margin: 0 }}>{stats.withPhone}</p></div>
          </div>
        </div>
        <div style={{ padding: isMobile ? '16px' : '20px', borderRadius: '16px', background: '#fff', border: '1px solid #E5E7EB' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '10px' : '14px' }}>
            <div style={{ width: isMobile ? '40px' : '48px', height: isMobile ? '40px' : '48px', borderRadius: '12px', background: '#FEF3C7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Euro size={isMobile ? 20 : 24} color="#F59E0B" /></div>
            <div><p style={{ fontSize: isMobile ? '11px' : '13px', color: '#6B7280', margin: 0 }}>CA</p><p style={{ fontSize: isMobile ? '18px' : '24px', fontWeight: 700, color: '#F59E0B', margin: 0 }}>{formatCurrency(stats.totalRevenue)}</p></div>
          </div>
        </div>
      </div>

      {/* Search */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ position: 'relative', maxWidth: isMobile ? '100%' : '400px' }}>
          <Search size={20} color="#9CA3AF" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)' }} />
          <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Rechercher..." style={{ width: '100%', padding: '14px 14px 14px 48px', borderRadius: '12px', border: '1px solid #E5E7EB', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }} />
        </div>
      </div>

      {/* Clients List */}
      <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid #E5E7EB', overflow: 'hidden' }}>
        {isLoading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '64px' }}>
            <RefreshCw size={32} color="#6366F1" style={{ animation: 'spin 1s linear infinite' }} />
          </div>
        ) : clients.length === 0 ? (
          <div style={{ padding: '64px', textAlign: 'center' }}>
            <Users size={48} color="#D1D5DB" style={{ marginBottom: '16px' }} />
            <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#111827', margin: 0, marginBottom: '8px' }}>Aucun client</h3>
            <p style={{ fontSize: '14px', color: '#6B7280', margin: 0 }}>Commencez par ajouter un client</p>
          </div>
        ) : isMobile ? (
          /* Mobile: Card view */
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {clients.map((client, index) => (
              <div
                key={client.id}
                onClick={() => router.push(`/clients/${client.id}`)}
                style={{
                  padding: '16px',
                  borderBottom: index < clients.length - 1 ? '1px solid #F3F4F6' : 'none',
                  cursor: 'pointer',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                  <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '14px', fontWeight: 700, flexShrink: 0 }}>{getInitials(client)}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '15px', fontWeight: 600, color: '#111827', marginBottom: '4px' }}>{getClientName(client)}</div>
                    {client.email && <div style={{ fontSize: '13px', color: '#6B7280', marginBottom: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{client.email}</div>}
                    {client.phone && <div style={{ fontSize: '13px', color: '#6B7280' }}>{client.phone}</div>}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: '#6366F1' }}><Car size={14} /> {client.vehicleCount || 0} véhicule(s)</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <button onClick={(e) => { e.stopPropagation(); setClientToDelete(client); setDeleteModalOpen(true) }} style={{ padding: '8px', borderRadius: '8px', border: '1px solid #FECACA', background: '#FEF2F2', cursor: 'pointer' }}><Trash2 size={16} color="#EF4444" /></button>
                    <ChevronRight size={18} color="#D1D5DB" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* Desktop/Tablet: Table view */
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#F9FAFB', borderBottom: '1px solid #E5E7EB' }}>
                <th style={{ padding: '14px 20px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#6B7280', textTransform: 'uppercase' }}>Client</th>
                <th style={{ padding: '14px 20px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#6B7280', textTransform: 'uppercase' }}>Contact</th>
                {!isTablet && <th style={{ padding: '14px 20px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#6B7280', textTransform: 'uppercase' }}>Adresse</th>}
                <th style={{ padding: '14px 20px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#6B7280', textTransform: 'uppercase' }}>Véhicules</th>
                <th style={{ padding: '14px 20px', textAlign: 'right', fontSize: '12px', fontWeight: 600, color: '#6B7280', textTransform: 'uppercase' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {clients.map((client, index) => (
                <tr key={client.id} style={{ borderBottom: index < clients.length - 1 ? '1px solid #F3F4F6' : 'none', cursor: 'pointer' }} onClick={() => router.push(`/clients/${client.id}`)} onMouseEnter={(e) => e.currentTarget.style.background = '#F9FAFB'} onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
                  <td style={{ padding: '16px 20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '14px', fontWeight: 700 }}>{getInitials(client)}</div>
                      <div>
                        <div style={{ fontSize: '14px', fontWeight: 600, color: '#111827' }}>{getClientName(client)}</div>
                        {client.genre && <div style={{ fontSize: '12px', color: '#6B7280' }}>{client.genre === 'M' ? 'Homme' : client.genre === 'F' ? 'Femme' : client.genre}</div>}
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '16px 20px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      {client.email && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#374151' }}>
                          <Mail size={14} color="#9CA3AF" /> {client.email}
                        </div>
                      )}
                      {client.phone && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#374151' }}>
                          <Phone size={14} color="#9CA3AF" /> {client.phone}
                        </div>
                      )}
                      {!client.email && !client.phone && <span style={{ fontSize: '13px', color: '#9CA3AF' }}>-</span>}
                    </div>
                  </td>
                  {!isTablet && (
                  <td style={{ padding: '16px 20px' }}>
                    {client.address || client.city ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#374151' }}>
                        <MapPin size={14} color="#9CA3AF" />
                        <span>{[client.address, client.postalCode, client.city].filter(Boolean).join(', ')}</span>
                      </div>
                    ) : (
                      <span style={{ fontSize: '13px', color: '#9CA3AF' }}>-</span>
                    )}
                  </td>
                  )}
                  <td style={{ padding: '16px 20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Car size={16} color="#6366F1" />
                      <span style={{ fontSize: '14px', fontWeight: 600, color: '#111827' }}>{client.vehicleCount || 0}</span>
                    </div>
                  </td>
                  <td style={{ padding: '16px 20px', textAlign: 'right' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '8px' }}>
                      <button onClick={(e) => { e.stopPropagation(); setClientToDelete(client); setDeleteModalOpen(true) }} style={{ padding: '8px', borderRadius: '8px', border: '1px solid #FECACA', background: '#FEF2F2', cursor: 'pointer' }}><Trash2 size={16} color="#EF4444" /></button>
                      <ChevronRight size={18} color="#D1D5DB" />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Delete Modal */}
      {deleteModalOpen && clientToDelete && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0, 0, 0, 0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '20px' }} onClick={() => setDeleteModalOpen(false)}>
          <div style={{ background: '#fff', borderRadius: '20px', width: '100%', maxWidth: '400px', padding: '24px' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ width: '56px', height: '56px', borderRadius: '14px', background: '#FEF2F2', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px' }}><Trash2 size={28} color="#EF4444" /></div>
            <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#111827', margin: 0, marginBottom: '8px' }}>Supprimer le client</h3>
            <p style={{ fontSize: '14px', color: '#6B7280', margin: 0, lineHeight: 1.6 }}>Êtes-vous sûr de vouloir supprimer <strong style={{ color: '#111827' }}>{getClientName(clientToDelete)}</strong> ?</p>
            {(clientToDelete.vehicleCount || 0) > 0 && <p style={{ fontSize: '13px', color: '#DC2626', margin: '16px 0 0', padding: '10px 12px', background: '#FEF2F2', borderRadius: '8px' }}>⚠️ Ce client a {clientToDelete.vehicleCount} véhicule(s)</p>}
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

