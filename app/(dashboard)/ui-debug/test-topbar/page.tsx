'use client'

import { useState } from 'react'
import { TopBar } from '@/components/shared/topbar'
import { Button } from '@/components/shared/button'
import { useToast } from '@/components/shared/use-toast'
import { ToastContainer } from '@/components/shared/toast-container'

// ============================================================================
// TEST PAGE
// ============================================================================

export default function TestTopBarPage() {
  const toast = useToast()
  const [notificationCount, setNotificationCount] = useState(3)
  const [garageName, setGarageName] = useState('Garage Horizon')
  const [showAvatar, setShowAvatar] = useState(false)

  const mockUser = {
    name: 'Jean Dupont',
    email: 'jean.dupont@garage-horizon.fr',
    role: 'Administrateur',
    avatar: showAvatar
      ? 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face'
      : undefined,
  }

  const handleSearchClick = () => {
    toast.info('Recherche', 'Commande palette ⌘K (prochaine étape)')
  }

  const handleNotificationsClick = () => {
    toast.info('Notifications', `Vous avez ${notificationCount} notifications`)
    setNotificationCount(0)
  }

  const handleProfileClick = () => {
    toast.success('Profil', 'Navigation vers /profil')
  }

  const handleSettingsClick = () => {
    toast.success('Paramètres', 'Navigation vers /parametres')
  }

  const handleLogout = () => {
    toast.warning('Déconnexion', 'Vous allez être déconnecté...')
  }

  return (
    <div
      style={{
        minHeight: '200vh', // Pour tester le sticky
        backgroundColor: '#f9fafb',
      }}
    >
      {/* TopBar */}
      <TopBar
        user={mockUser}
        garageName={garageName}
        notificationCount={notificationCount}
        onSearchClick={handleSearchClick}
        onNotificationsClick={handleNotificationsClick}
        onProfileClick={handleProfileClick}
        onSettingsClick={handleSettingsClick}
        onLogout={handleLogout}
      />

      {/* Content */}
      <div
        style={{
          padding: '32px',
          maxWidth: '900px',
          margin: '0 auto',
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
          Test TopBar Component
        </h1>
        <p
          style={{
            fontSize: '16px',
            color: '#6b7280',
            marginBottom: '32px',
          }}
        >
          Header sticky avec logo, search, notifications, user menu
        </p>

        {/* Controls */}
        <section style={{ marginBottom: '48px' }}>
          <h2
            style={{
              fontSize: '20px',
              fontWeight: '600',
              marginBottom: '16px',
              color: '#374151',
            }}
          >
            Controls
          </h2>
          <div
            style={{
              padding: '24px',
              backgroundColor: '#ffffff',
              borderRadius: '12px',
              border: '1px solid #e5e7eb',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
            }}
          >
            {/* Notification Count */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '14px', color: '#374151', minWidth: '150px' }}>
                Notifications:
              </span>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setNotificationCount(0)}
              >
                0
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setNotificationCount(3)}
              >
                3
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setNotificationCount(12)}
              >
                12
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setNotificationCount(150)}
              >
                150 (99+)
              </Button>
            </div>

            {/* Garage Name */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '14px', color: '#374151', minWidth: '150px' }}>
                Nom du garage:
              </span>
              <input
                type="text"
                value={garageName}
                onChange={(e) => setGarageName(e.target.value)}
                style={{
                  flex: 1,
                  maxWidth: '300px',
                  padding: '8px 12px',
                  border: '1px solid #E5E7EB',
                  borderRadius: '6px',
                  fontSize: '14px',
                }}
              />
            </div>

            {/* Avatar Toggle */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '14px', color: '#374151', minWidth: '150px' }}>
                Avatar:
              </span>
              <Button
                variant={showAvatar ? 'primary' : 'secondary'}
                size="sm"
                onClick={() => setShowAvatar(!showAvatar)}
              >
                {showAvatar ? 'Avec image' : 'Initiales'}
              </Button>
            </div>
          </div>
        </section>

        {/* Features */}
        <section style={{ marginBottom: '48px' }}>
          <h2
            style={{
              fontSize: '20px',
              fontWeight: '600',
              marginBottom: '16px',
              color: '#374151',
            }}
          >
            Interactions
          </h2>
          <div
            style={{
              padding: '24px',
              backgroundColor: '#ffffff',
              borderRadius: '12px',
              border: '1px solid #e5e7eb',
            }}
          >
            <table
              style={{
                width: '100%',
                borderCollapse: 'collapse',
                fontSize: '14px',
              }}
            >
              <thead>
                <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
                  <th style={{ padding: '12px', textAlign: 'left', fontWeight: 600 }}>
                    Élément
                  </th>
                  <th style={{ padding: '12px', textAlign: 'left', fontWeight: 600 }}>
                    Action
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ borderBottom: '1px solid #f3f4f6' }}>
                  <td style={{ padding: '12px' }}>Search bar</td>
                  <td style={{ padding: '12px', color: '#6b7280' }}>
                    Cliquer → onSearchClick()
                  </td>
                </tr>
                <tr style={{ borderBottom: '1px solid #f3f4f6' }}>
                  <td style={{ padding: '12px' }}>Bell icon</td>
                  <td style={{ padding: '12px', color: '#6b7280' }}>
                    Cliquer → onNotificationsClick()
                  </td>
                </tr>
                <tr style={{ borderBottom: '1px solid #f3f4f6' }}>
                  <td style={{ padding: '12px' }}>User button</td>
                  <td style={{ padding: '12px', color: '#6b7280' }}>
                    Cliquer → ouvre dropdown menu
                  </td>
                </tr>
                <tr style={{ borderBottom: '1px solid #f3f4f6' }}>
                  <td style={{ padding: '12px' }}>Dropdown "Mon profil"</td>
                  <td style={{ padding: '12px', color: '#6b7280' }}>
                    Cliquer → onProfileClick()
                  </td>
                </tr>
                <tr style={{ borderBottom: '1px solid #f3f4f6' }}>
                  <td style={{ padding: '12px' }}>Dropdown "Paramètres"</td>
                  <td style={{ padding: '12px', color: '#6b7280' }}>
                    Cliquer → onSettingsClick()
                  </td>
                </tr>
                <tr>
                  <td style={{ padding: '12px' }}>Dropdown "Se déconnecter"</td>
                  <td style={{ padding: '12px', color: '#6b7280' }}>
                    Cliquer → onLogout() (rouge)
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* Scroll Test Notice */}
        <section style={{ marginBottom: '48px' }}>
          <div
            style={{
              padding: '16px 20px',
              backgroundColor: '#EFF6FF',
              border: '1px solid #BFDBFE',
              borderRadius: '8px',
              fontSize: '14px',
              color: '#1E40AF',
            }}
          >
            <strong>Test Sticky:</strong> Scrollez vers le bas pour vérifier que la TopBar
            reste fixée en haut de l'écran.
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
          <strong style={{ color: '#111827' }}>✅ Checklist TopBar :</strong>
          <ul style={{ marginTop: '8px', paddingLeft: '20px' }}>
            <li>✅ Sticky position (reste en haut au scroll)</li>
            <li>✅ Logo MS avec fond navy</li>
            <li>✅ Nom du garage (desktop only)</li>
            <li>✅ Search bar avec placeholder</li>
            <li>✅ Kbd shortcut ⌘K (desktop only)</li>
            <li>✅ Bell icon avec badge notifications</li>
            <li>✅ Badge affiche 99+ si &gt; 99</li>
            <li>✅ Avatar avec initiales ou image</li>
            <li>✅ Nom + rôle user (desktop only)</li>
            <li>✅ Chevron qui tourne à l'ouverture</li>
            <li>✅ Dropdown ferme au clic extérieur</li>
            <li>✅ Dropdown ferme avec ESC</li>
            <li>✅ Hover effects sur tous les boutons</li>
            <li>✅ Logout en rouge avec hover rose</li>
            <li>✅ Responsive mobile</li>
          </ul>
        </div>

        {/* Spacer for scroll test */}
        <div style={{ height: '400px', marginTop: '48px' }}>
          <p style={{ color: '#9CA3AF', fontSize: '14px', textAlign: 'center' }}>
            ↓ Contenu supplémentaire pour tester le scroll ↓
          </p>
        </div>
      </div>

      {/* Toast Container */}
      <ToastContainer position="top-right" />
    </div>
  )
}
