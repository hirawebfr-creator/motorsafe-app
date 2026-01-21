'use client'

import { Button } from '@/components/shared/button'
import { Plus, Save, Trash2, Check, X, ArrowRight, Download } from 'lucide-react'
import { useState } from 'react'

export default function TestButtonPage() {
  const [loading, setLoading] = useState(false)

  const handleLoadingDemo = () => {
    setLoading(true)
    setTimeout(() => setLoading(false), 2000)
  }

  return (
    <div style={{ 
      padding: '32px', 
      maxWidth: '1200px', 
      margin: '0 auto',
      minHeight: '100vh',
      backgroundColor: '#f9fafb'
    }}>
      <h1 style={{ 
        fontSize: '30px', 
        fontWeight: '700', 
        marginBottom: '32px',
        color: '#111827'
      }}>
        Test Button Component
      </h1>

      {/* Variants */}
      <section style={{ marginBottom: '48px' }}>
        <h2 style={{ 
          fontSize: '18px', 
          fontWeight: '600', 
          marginBottom: '16px',
          color: '#374151'
        }}>
          Variants
        </h2>
        <div style={{ 
          display: 'flex', 
          gap: '12px', 
          flexWrap: 'wrap',
          padding: '24px',
          backgroundColor: '#ffffff',
          borderRadius: '12px',
          border: '1px solid #e5e7eb'
        }}>
          <Button variant="primary">Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="danger">Danger</Button>
          <Button variant="success">Success</Button>
        </div>
      </section>

      {/* Sizes */}
      <section style={{ marginBottom: '48px' }}>
        <h2 style={{ 
          fontSize: '18px', 
          fontWeight: '600', 
          marginBottom: '16px',
          color: '#374151'
        }}>
          Sizes
        </h2>
        <div style={{ 
          display: 'flex', 
          gap: '12px', 
          alignItems: 'center',
          padding: '24px',
          backgroundColor: '#ffffff',
          borderRadius: '12px',
          border: '1px solid #e5e7eb'
        }}>
          <Button variant="primary" size="sm">Small</Button>
          <Button variant="primary" size="md">Medium</Button>
          <Button variant="primary" size="lg">Large</Button>
        </div>
      </section>

      {/* With Icons */}
      <section style={{ marginBottom: '48px' }}>
        <h2 style={{ 
          fontSize: '18px', 
          fontWeight: '600', 
          marginBottom: '16px',
          color: '#374151'
        }}>
          With Icons
        </h2>
        <div style={{ 
          display: 'flex', 
          gap: '12px', 
          flexWrap: 'wrap',
          padding: '24px',
          backgroundColor: '#ffffff',
          borderRadius: '12px',
          border: '1px solid #e5e7eb'
        }}>
          <Button variant="primary" leftIcon={<Plus size={16} />}>
            Nouveau client
          </Button>
          <Button variant="primary" leftIcon={<Save size={16} />}>
            Sauvegarder
          </Button>
          <Button variant="danger" leftIcon={<Trash2 size={16} />}>
            Supprimer
          </Button>
          <Button variant="success" leftIcon={<Check size={16} />}>
            Confirmer
          </Button>
          <Button variant="secondary" rightIcon={<ArrowRight size={16} />}>
            Suivant
          </Button>
          <Button variant="ghost" leftIcon={<Download size={16} />}>
            Télécharger
          </Button>
        </div>
      </section>

      {/* Loading State */}
      <section style={{ marginBottom: '48px' }}>
        <h2 style={{ 
          fontSize: '18px', 
          fontWeight: '600', 
          marginBottom: '16px',
          color: '#374151'
        }}>
          Loading State
        </h2>
        <div style={{ 
          display: 'flex', 
          gap: '12px', 
          flexWrap: 'wrap',
          padding: '24px',
          backgroundColor: '#ffffff',
          borderRadius: '12px',
          border: '1px solid #e5e7eb'
        }}>
          <Button variant="primary" loading>Chargement...</Button>
          <Button variant="secondary" loading>Chargement...</Button>
          <Button variant="danger" loading>Suppression...</Button>
          <Button 
            variant="success" 
            loading={loading}
            onClick={handleLoadingDemo}
          >
            {loading ? 'Envoi en cours...' : 'Cliquez pour démo loading'}
          </Button>
        </div>
      </section>

      {/* Disabled State */}
      <section style={{ marginBottom: '48px' }}>
        <h2 style={{ 
          fontSize: '18px', 
          fontWeight: '600', 
          marginBottom: '16px',
          color: '#374151'
        }}>
          Disabled State
        </h2>
        <div style={{ 
          display: 'flex', 
          gap: '12px', 
          flexWrap: 'wrap',
          padding: '24px',
          backgroundColor: '#ffffff',
          borderRadius: '12px',
          border: '1px solid #e5e7eb'
        }}>
          <Button variant="primary" disabled>Primary disabled</Button>
          <Button variant="secondary" disabled>Secondary disabled</Button>
          <Button variant="ghost" disabled>Ghost disabled</Button>
          <Button variant="danger" disabled>Danger disabled</Button>
          <Button variant="success" disabled>Success disabled</Button>
        </div>
      </section>

      {/* Full Width */}
      <section style={{ marginBottom: '48px' }}>
        <h2 style={{ 
          fontSize: '18px', 
          fontWeight: '600', 
          marginBottom: '16px',
          color: '#374151'
        }}>
          Full Width
        </h2>
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column',
          gap: '12px',
          padding: '24px',
          backgroundColor: '#ffffff',
          borderRadius: '12px',
          border: '1px solid #e5e7eb'
        }}>
          <Button variant="primary" fullWidth>Primary Full Width</Button>
          <Button variant="secondary" fullWidth>Secondary Full Width</Button>
          <Button variant="success" fullWidth leftIcon={<Check size={16} />}>
            Confirmer l'action
          </Button>
        </div>
      </section>

      {/* Real-world Examples */}
      <section style={{ marginBottom: '48px' }}>
        <h2 style={{ 
          fontSize: '18px', 
          fontWeight: '600', 
          marginBottom: '16px',
          color: '#374151'
        }}>
          Real-world Examples
        </h2>
        
        {/* Form actions */}
        <div style={{ 
          padding: '24px',
          backgroundColor: '#ffffff',
          borderRadius: '12px',
          border: '1px solid #e5e7eb',
          marginBottom: '16px'
        }}>
          <p style={{ marginBottom: '16px', color: '#6b7280', fontSize: '14px' }}>
            Form Actions (typical save/cancel)
          </p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
            <Button variant="ghost" leftIcon={<X size={16} />}>
              Annuler
            </Button>
            <Button variant="primary" leftIcon={<Save size={16} />}>
              Enregistrer
            </Button>
          </div>
        </div>

        {/* Danger zone */}
        <div style={{ 
          padding: '24px',
          backgroundColor: '#fef2f2',
          borderRadius: '12px',
          border: '1px solid #fecaca'
        }}>
          <p style={{ marginBottom: '16px', color: '#dc2626', fontSize: '14px', fontWeight: '500' }}>
            Zone de danger
          </p>
          <div style={{ display: 'flex', gap: '12px' }}>
            <Button variant="secondary">
              Annuler
            </Button>
            <Button variant="danger" leftIcon={<Trash2 size={16} />}>
              Supprimer définitivement
            </Button>
          </div>
        </div>
      </section>

      {/* Info */}
      <div style={{
        padding: '16px',
        backgroundColor: '#ffffff',
        borderRadius: '12px',
        border: '1px solid #e5e7eb',
        fontSize: '14px',
        color: '#6b7280'
      }}>
        <strong style={{ color: '#111827' }}>Checklist :</strong>
        <ul style={{ marginTop: '8px', paddingLeft: '20px' }}>
          <li>✅ Hover change de couleur + shadow + transform</li>
          <li>✅ Active retourne à la position initiale</li>
          <li>✅ Loading affiche le spinner qui tourne</li>
          <li>✅ Disabled empêche les interactions</li>
          <li>✅ Icons gauche/droite bien alignées</li>
          <li>✅ FullWidth prend 100% de la largeur</li>
          <li>✅ Transitions smooth (0.2s)</li>
        </ul>
      </div>
    </div>
  )
}
