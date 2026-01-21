'use client'

import { useState } from 'react'
import { ToastContainer } from '@/components/shared/toast-container'
import { useToast } from '@/components/shared/use-toast'
import { Button } from '@/components/shared/button'
import { 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Info, 
  Trash2,
  Bell
} from 'lucide-react'

// ============================================================================
// TOAST DEMO BUTTONS
// ============================================================================

function ToastDemoButtons() {
  const toast = useToast()
  const [position, setPosition] = useState<
    'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center'
  >('top-right')

  const handleSuccess = () => {
    toast.success('Client créé', 'Le client a été ajouté avec succès')
  }

  const handleError = () => {
    toast.error(
      'Erreur de connexion',
      'Impossible de se connecter au serveur. Veuillez réessayer.'
    )
  }

  const handleWarning = () => {
    toast.warning('Attention', 'Votre abonnement expire dans 7 jours')
  }

  const handleInfo = () => {
    toast.info(
      'Nouvelle fonctionnalité',
      'Découvrez la recherche avancée dans le menu'
    )
  }

  const handleTitleOnly = () => {
    toast.success('Action réussie !')
  }

  const handleShort = () => {
    toast.show({
      variant: 'info',
      title: 'Toast court',
      description: 'Disparaît après 2 secondes',
      duration: 2000,
    })
  }

  const handleLong = () => {
    toast.show({
      variant: 'warning',
      title: 'Toast long',
      description: 'Disparaît après 10 secondes',
      duration: 10000,
    })
  }

  const handlePermanent = () => {
    const id = toast.show({
      variant: 'error',
      title: 'Toast permanent',
      description: 'Ne disparaît pas automatiquement. Cliquez sur X pour fermer.',
      duration: 0,
    })
    console.log('Permanent toast ID:', id)
  }

  const handleMultiple = () => {
    toast.success('Premier toast')
    setTimeout(() => toast.info('Deuxième toast'), 300)
    setTimeout(() => toast.warning('Troisième toast'), 600)
    setTimeout(() => toast.error('Quatrième toast'), 900)
  }

  const handleDismissAll = () => {
    toast.dismissAll()
  }

  return (
    <>
      {/* Position selector */}
      <section style={{ marginBottom: '48px' }}>
        <h2
          style={{
            fontSize: '20px',
            fontWeight: '600',
            marginBottom: '16px',
            color: '#374151',
          }}
        >
          Position
        </h2>
        <div
          style={{
            padding: '24px',
            backgroundColor: '#ffffff',
            borderRadius: '12px',
            border: '1px solid #e5e7eb',
          }}
        >
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '8px',
              maxWidth: '400px',
            }}
          >
            {(
              [
                'top-left',
                'top-center',
                'top-right',
                'bottom-left',
                'bottom-center',
                'bottom-right',
              ] as const
            ).map((pos) => (
              <button
                key={pos}
                onClick={() => setPosition(pos)}
                style={{
                  padding: '10px 16px',
                  fontSize: '13px',
                  fontWeight: 500,
                  color: position === pos ? '#FFFFFF' : '#374151',
                  backgroundColor: position === pos ? '#0D1B2A' : '#F9FAFB',
                  border: `1px solid ${position === pos ? '#0D1B2A' : '#E5E7EB'}`,
                  borderRadius: '6px',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                {pos}
              </button>
            ))}
          </div>
          <p
            style={{
              marginTop: '12px',
              fontSize: '13px',
              color: '#6B7280',
            }}
          >
            Position actuelle : <strong>{position}</strong>
          </p>
        </div>
      </section>

      {/* Variants */}
      <section style={{ marginBottom: '48px' }}>
        <h2
          style={{
            fontSize: '20px',
            fontWeight: '600',
            marginBottom: '16px',
            color: '#374151',
          }}
        >
          Variants
        </h2>
        <div
          style={{
            padding: '24px',
            backgroundColor: '#ffffff',
            borderRadius: '12px',
            border: '1px solid #e5e7eb',
            display: 'flex',
            gap: '12px',
            flexWrap: 'wrap',
          }}
        >
          <Button
            variant="success"
            onClick={handleSuccess}
            leftIcon={<CheckCircle size={16} />}
          >
            Success
          </Button>
          <Button
            variant="danger"
            onClick={handleError}
            leftIcon={<XCircle size={16} />}
          >
            Error
          </Button>
          <Button
            variant="secondary"
            onClick={handleWarning}
            leftIcon={<AlertTriangle size={16} />}
          >
            Warning
          </Button>
          <Button
            variant="primary"
            onClick={handleInfo}
            leftIcon={<Info size={16} />}
          >
            Info
          </Button>
        </div>
      </section>

      {/* Options */}
      <section style={{ marginBottom: '48px' }}>
        <h2
          style={{
            fontSize: '20px',
            fontWeight: '600',
            marginBottom: '16px',
            color: '#374151',
          }}
        >
          Options
        </h2>
        <div
          style={{
            padding: '24px',
            backgroundColor: '#ffffff',
            borderRadius: '12px',
            border: '1px solid #e5e7eb',
            display: 'flex',
            gap: '12px',
            flexWrap: 'wrap',
          }}
        >
          <Button variant="secondary" onClick={handleTitleOnly}>
            Titre uniquement
          </Button>
          <Button variant="secondary" onClick={handleShort}>
            Durée courte (2s)
          </Button>
          <Button variant="secondary" onClick={handleLong}>
            Durée longue (10s)
          </Button>
          <Button variant="secondary" onClick={handlePermanent}>
            Permanent (duration: 0)
          </Button>
        </div>
      </section>

      {/* Multiple & Dismiss */}
      <section style={{ marginBottom: '48px' }}>
        <h2
          style={{
            fontSize: '20px',
            fontWeight: '600',
            marginBottom: '16px',
            color: '#374151',
          }}
        >
          Multiple Toasts & Dismiss
        </h2>
        <div
          style={{
            padding: '24px',
            backgroundColor: '#ffffff',
            borderRadius: '12px',
            border: '1px solid #e5e7eb',
            display: 'flex',
            gap: '12px',
            flexWrap: 'wrap',
          }}
        >
          <Button
            variant="primary"
            onClick={handleMultiple}
            leftIcon={<Bell size={16} />}
          >
            Afficher 4 toasts
          </Button>
          <Button
            variant="ghost"
            onClick={handleDismissAll}
            leftIcon={<Trash2 size={16} />}
          >
            Fermer tous
          </Button>
        </div>
      </section>

      {/* ToastContainer with dynamic position */}
      <ToastContainer position={position} />
    </>
  )
}

// ============================================================================
// TEST PAGE
// ============================================================================

export default function TestToastPage() {
  return (
    <div
      style={{
        padding: '32px',
        maxWidth: '900px',
        margin: '0 auto',
        minHeight: '100vh',
        backgroundColor: '#f9fafb',
      }}
    >
      <h1
        style={{
          fontSize: '30px',
          fontWeight: '700',
          marginBottom: '8px',
          color: '#111827',
        }}
      >
        Test Toast Component
      </h1>
      <p
        style={{
          fontSize: '16px',
          color: '#6b7280',
          marginBottom: '32px',
        }}
      >
        Notifications avec animations, auto-dismiss, 4 variants, 6 positions
      </p>

      <ToastDemoButtons />

      {/* Usage Code Example */}
      <section style={{ marginBottom: '48px' }}>
        <h2
          style={{
            fontSize: '20px',
            fontWeight: '600',
            marginBottom: '16px',
            color: '#374151',
          }}
        >
          Usage
        </h2>
        <div
          style={{
            padding: '24px',
            backgroundColor: '#1F2937',
            borderRadius: '12px',
            fontFamily: 'monospace',
            fontSize: '13px',
            lineHeight: 1.6,
            color: '#E5E7EB',
            overflow: 'auto',
          }}
        >
          <pre style={{ margin: 0 }}>
{`import { useToast } from '@/components/shared/use-toast'

function MyComponent() {
  const toast = useToast()
  
  // Méthodes raccourcies
  toast.success('Titre', 'Description')
  toast.error('Titre', 'Description')
  toast.warning('Titre', 'Description')
  toast.info('Titre', 'Description')
  
  // Options personnalisées
  toast.show({
    variant: 'success',
    title: 'Titre',
    description: 'Description',
    duration: 3000  // 3 secondes
  })
  
  // Toast permanent (ne disparaît pas)
  const id = toast.error('Erreur', 'Message', 0)
  
  // Fermer manuellement
  toast.dismiss(id)
  
  // Fermer tous les toasts
  toast.dismissAll()
}`}
          </pre>
        </div>
      </section>

      {/* Checklist */}
      <div
        style={{
          padding: '16px',
          backgroundColor: '#ffffff',
          borderRadius: '12px',
          border: '1px solid #e5e7eb',
          fontSize: '14px',
          color: '#6b7280',
        }}
      >
        <strong style={{ color: '#111827' }}>✅ Checklist Toast :</strong>
        <ul style={{ marginTop: '8px', paddingLeft: '20px' }}>
          <li>✅ Animation slide-in de la droite</li>
          <li>✅ Animation slide-out à la fermeture</li>
          <li>✅ Auto-dismiss après duration</li>
          <li>✅ Close button ferme immédiatement</li>
          <li>✅ 4 variants (success, error, warning, info)</li>
          <li>✅ Couleurs et icônes par variant</li>
          <li>✅ 6 positions configurables</li>
          <li>✅ Multiple toasts empilés avec gap</li>
          <li>✅ Duration 0 = permanent</li>
          <li>✅ toast.dismiss(id) fonctionne</li>
          <li>✅ toast.dismissAll() fonctionne</li>
          <li>✅ Accessible (role=alert, aria-live)</li>
          <li>✅ Hook useToast facile à utiliser</li>
        </ul>
      </div>
    </div>
  )
}
