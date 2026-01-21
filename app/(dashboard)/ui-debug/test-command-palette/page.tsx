'use client'

import { useRouter } from 'next/navigation'
import { CommandPalette, CommandItem } from '@/components/shared/command-palette'
import { useCommandPalette } from '@/components/shared/use-command-palette'

// ============================================================================
// ICONS
// ============================================================================

const HomeIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    <polyline points="9,22 9,12 15,12 15,22" />
  </svg>
)

const UsersIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
)

const CarIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M14 16H9m10 0h3v-3.15a1 1 0 0 0-.84-.99L16 11l-2.7-3.6a1 1 0 0 0-.8-.4H5.24a2 2 0 0 0-1.8 1.1l-.8 1.63A6 6 0 0 0 2 12.42V16h2" />
    <circle cx="6.5" cy="16.5" r="2.5" />
    <circle cx="16.5" cy="16.5" r="2.5" />
  </svg>
)

const WrenchIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
  </svg>
)

const PlusIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
)

const SettingsIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
  </svg>
)

const HelpIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="12" cy="12" r="10" />
    <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
    <line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
)

// ============================================================================
// TEST PAGE
// ============================================================================

export default function TestCommandPalettePage() {
  const router = useRouter()
  const { isOpen, open, close, toggle } = useCommandPalette()

  // ========================================
  // SAMPLE COMMAND ITEMS
  // ========================================
  const commandItems: CommandItem[] = [
    // Navigation
    {
      id: 'nav-dashboard',
      type: 'navigation',
      title: 'Tableau de bord',
      description: 'Accueil et résumé',
      icon: <HomeIcon />,
      keywords: ['home', 'accueil', 'dashboard'],
      onSelect: () => router.push('/'),
    },
    {
      id: 'nav-clients',
      type: 'navigation',
      title: 'Clients',
      description: 'Liste des clients',
      icon: <UsersIcon />,
      keywords: ['customers', 'users'],
      onSelect: () => router.push('/clients'),
    },
    {
      id: 'nav-vehicules',
      type: 'navigation',
      title: 'Véhicules',
      description: 'Liste des véhicules',
      icon: <CarIcon />,
      keywords: ['cars', 'auto', 'voitures'],
      onSelect: () => router.push('/vehicules'),
    },
    {
      id: 'nav-interventions',
      type: 'navigation',
      title: 'Interventions',
      description: 'Toutes les interventions',
      icon: <WrenchIcon />,
      keywords: ['repairs', 'réparations', 'services'],
      onSelect: () => router.push('/interventions'),
    },
    {
      id: 'nav-settings',
      type: 'navigation',
      title: 'Paramètres',
      description: 'Configuration du compte',
      icon: <SettingsIcon />,
      keywords: ['settings', 'config', 'préférences'],
      onSelect: () => router.push('/parametres'),
    },

    // Actions
    {
      id: 'action-new-client',
      type: 'action',
      title: 'Nouveau client',
      description: 'Créer un nouveau client',
      icon: <PlusIcon />,
      keywords: ['ajouter', 'créer', 'new'],
      onSelect: () => alert('Action: Nouveau client'),
    },
    {
      id: 'action-new-vehicle',
      type: 'action',
      title: 'Nouveau véhicule',
      description: 'Ajouter un véhicule',
      icon: <PlusIcon />,
      keywords: ['ajouter', 'créer', 'new'],
      onSelect: () => alert('Action: Nouveau véhicule'),
    },
    {
      id: 'action-new-intervention',
      type: 'action',
      title: 'Nouvelle intervention',
      description: 'Créer une intervention',
      icon: <PlusIcon />,
      keywords: ['ajouter', 'créer', 'new'],
      onSelect: () => alert('Action: Nouvelle intervention'),
    },
    {
      id: 'action-help',
      type: 'action',
      title: 'Aide',
      description: 'Documentation et support',
      icon: <HelpIcon />,
      keywords: ['support', 'documentation', 'faq'],
      onSelect: () => alert('Action: Aide'),
    },

    // Sample Clients
    {
      id: 'client-1',
      type: 'client',
      title: 'Jean Dupont',
      description: 'jean.dupont@email.com',
      icon: <UsersIcon />,
      keywords: ['jean', 'dupont'],
      onSelect: () => alert('Client: Jean Dupont'),
    },
    {
      id: 'client-2',
      type: 'client',
      title: 'Marie Martin',
      description: 'marie.martin@email.com',
      icon: <UsersIcon />,
      keywords: ['marie', 'martin'],
      onSelect: () => alert('Client: Marie Martin'),
    },

    // Sample Vehicles
    {
      id: 'vehicle-1',
      type: 'vehicle',
      title: 'Peugeot 308',
      description: 'AB-123-CD',
      icon: <CarIcon />,
      keywords: ['peugeot', '308', 'AB123CD'],
      onSelect: () => alert('Véhicule: Peugeot 308'),
    },
    {
      id: 'vehicle-2',
      type: 'vehicle',
      title: 'Renault Clio',
      description: 'EF-456-GH',
      icon: <CarIcon />,
      keywords: ['renault', 'clio', 'EF456GH'],
      onSelect: () => alert('Véhicule: Renault Clio'),
    },

    // Sample Interventions
    {
      id: 'intervention-1',
      type: 'intervention',
      title: 'Révision 30 000 km',
      description: 'Peugeot 308 - Jean Dupont',
      icon: <WrenchIcon />,
      keywords: ['révision', 'entretien'],
      onSelect: () => alert('Intervention: Révision 30 000 km'),
    },
    {
      id: 'intervention-2',
      type: 'intervention',
      title: 'Changement pneus',
      description: 'Renault Clio - Marie Martin',
      icon: <WrenchIcon />,
      keywords: ['pneus', 'roues'],
      onSelect: () => alert('Intervention: Changement pneus'),
    },
  ]

  // ========================================
  // RECENT ITEMS (shown when no query)
  // ========================================
  const recentItems: CommandItem[] = [
    commandItems[0], // Dashboard
    commandItems[9], // Jean Dupont
    commandItems[13], // Révision
  ]

  return (
    <div
      style={{
        minHeight: '100vh',
        padding: '32px',
        backgroundColor: '#F9FAFB',
        fontFamily: 'system-ui, sans-serif',
      }}
    >
      {/* Header */}
      <div
        style={{
          maxWidth: '800px',
          margin: '0 auto',
        }}
      >
        <h1
          style={{
            fontSize: '24px',
            fontWeight: 700,
            color: '#111827',
            marginBottom: '8px',
          }}
        >
          Test Command Palette
        </h1>
        <p
          style={{
            fontSize: '14px',
            color: '#6B7280',
            marginBottom: '32px',
          }}
        >
          Appuyez sur{' '}
          <kbd
            style={{
              padding: '2px 6px',
              backgroundColor: '#F3F4F6',
              border: '1px solid #E5E7EB',
              borderRadius: '4px',
              fontFamily: 'monospace',
              fontSize: '12px',
            }}
          >
            ⌘K
          </kbd>{' '}
          /{' '}
          <kbd
            style={{
              padding: '2px 6px',
              backgroundColor: '#F3F4F6',
              border: '1px solid #E5E7EB',
              borderRadius: '4px',
              fontFamily: 'monospace',
              fontSize: '12px',
            }}
          >
            Ctrl+K
          </kbd>{' '}
          ou cliquez sur le bouton ci-dessous pour ouvrir la command palette.
        </p>

        {/* Open Button */}
        <button
          type="button"
          onClick={open}
          style={{
            padding: '12px 24px',
            backgroundColor: '#0A1628',
            color: '#FFFFFF',
            border: 'none',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: 500,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
          }}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35" />
          </svg>
          Ouvrir Command Palette
          <span
            style={{
              padding: '2px 8px',
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
              borderRadius: '4px',
              fontSize: '12px',
              fontWeight: 400,
            }}
          >
            ⌘K
          </span>
        </button>

        {/* Info Cards */}
        <div
          style={{
            marginTop: '48px',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '16px',
          }}
        >
          {/* Card 1 */}
          <div
            style={{
              padding: '20px',
              backgroundColor: '#FFFFFF',
              borderRadius: '12px',
              border: '1px solid #E5E7EB',
            }}
          >
            <h3
              style={{
                fontSize: '14px',
                fontWeight: 600,
                color: '#111827',
                marginBottom: '8px',
              }}
            >
              🔍 Recherche
            </h3>
            <p
              style={{
                fontSize: '13px',
                color: '#6B7280',
                lineHeight: 1.5,
              }}
            >
              Tapez pour rechercher dans les pages, actions, clients, véhicules
              et interventions.
            </p>
          </div>

          {/* Card 2 */}
          <div
            style={{
              padding: '20px',
              backgroundColor: '#FFFFFF',
              borderRadius: '12px',
              border: '1px solid #E5E7EB',
            }}
          >
            <h3
              style={{
                fontSize: '14px',
                fontWeight: 600,
                color: '#111827',
                marginBottom: '8px',
              }}
            >
              ⌨️ Navigation clavier
            </h3>
            <p
              style={{
                fontSize: '13px',
                color: '#6B7280',
                lineHeight: 1.5,
              }}
            >
              Utilisez ↑↓ pour naviguer, Entrée pour sélectionner, ESC pour
              fermer.
            </p>
          </div>

          {/* Card 3 */}
          <div
            style={{
              padding: '20px',
              backgroundColor: '#FFFFFF',
              borderRadius: '12px',
              border: '1px solid #E5E7EB',
            }}
          >
            <h3
              style={{
                fontSize: '14px',
                fontWeight: 600,
                color: '#111827',
                marginBottom: '8px',
              }}
            >
              📂 Groupes
            </h3>
            <p
              style={{
                fontSize: '13px',
                color: '#6B7280',
                lineHeight: 1.5,
              }}
            >
              Résultats groupés par type : Navigation, Actions, Clients,
              Véhicules, Interventions.
            </p>
          </div>
        </div>

        {/* State Display */}
        <div
          style={{
            marginTop: '32px',
            padding: '16px 20px',
            backgroundColor: '#FFFFFF',
            borderRadius: '8px',
            border: '1px solid #E5E7EB',
          }}
        >
          <p
            style={{
              fontSize: '14px',
              color: '#6B7280',
            }}
          >
            État actuel:{' '}
            <span
              style={{
                fontWeight: 600,
                color: isOpen ? '#16A34A' : '#DC2626',
              }}
            >
              {isOpen ? 'Ouvert' : 'Fermé'}
            </span>
          </p>
        </div>

        {/* Actions */}
        <div
          style={{
            marginTop: '16px',
            display: 'flex',
            gap: '12px',
          }}
        >
          <button
            type="button"
            onClick={open}
            style={{
              padding: '8px 16px',
              backgroundColor: '#FFFFFF',
              color: '#111827',
              border: '1px solid #E5E7EB',
              borderRadius: '6px',
              fontSize: '14px',
              cursor: 'pointer',
            }}
          >
            open()
          </button>
          <button
            type="button"
            onClick={close}
            style={{
              padding: '8px 16px',
              backgroundColor: '#FFFFFF',
              color: '#111827',
              border: '1px solid #E5E7EB',
              borderRadius: '6px',
              fontSize: '14px',
              cursor: 'pointer',
            }}
          >
            close()
          </button>
          <button
            type="button"
            onClick={toggle}
            style={{
              padding: '8px 16px',
              backgroundColor: '#FFFFFF',
              color: '#111827',
              border: '1px solid #E5E7EB',
              borderRadius: '6px',
              fontSize: '14px',
              cursor: 'pointer',
            }}
          >
            toggle()
          </button>
        </div>
      </div>

      {/* Command Palette */}
      <CommandPalette
        isOpen={isOpen}
        onClose={close}
        items={commandItems}
        recentItems={recentItems}
        placeholder="Rechercher ou taper une commande..."
        emptyText="Aucun résultat trouvé"
      />
    </div>
  )
}
