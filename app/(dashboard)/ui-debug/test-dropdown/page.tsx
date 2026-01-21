'use client'

import { DropdownMenu } from '@/components/shared/dropdown-menu'
import { Button } from '@/components/shared/button'

// Simple SVG icons for demo
const EditIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
)

const TrashIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
  </svg>
)

const DownloadIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" y1="15" x2="12" y2="3" />
  </svg>
)

const CopyIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
  </svg>
)

const ShareIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="18" cy="5" r="3" />
    <circle cx="6" cy="12" r="3" />
    <circle cx="18" cy="19" r="3" />
    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
    <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
  </svg>
)

const MoreIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="1" />
    <circle cx="12" cy="5" r="1" />
    <circle cx="12" cy="19" r="1" />
  </svg>
)

const UserIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
)

const SettingsIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
  </svg>
)

const LogoutIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <polyline points="16 17 21 12 16 7" />
    <line x1="21" y1="12" x2="9" y2="12" />
  </svg>
)

export default function TestDropdownPage() {
  return (
    <div
      style={{
        padding: '40px',
        maxWidth: '900px',
        margin: '0 auto',
        fontFamily: 'Inter, system-ui, sans-serif',
      }}
    >
      <h1
        style={{
          fontSize: '28px',
          fontWeight: 700,
          color: '#0A1628',
          marginBottom: '8px',
        }}
      >
        DropdownMenu Component Test
      </h1>
      <p
        style={{
          fontSize: '14px',
          color: '#6B7280',
          marginBottom: '40px',
        }}
      >
        Test dropdown menus with various configurations
      </p>

      {/* Basic Usage */}
      <section style={{ marginBottom: '48px' }}>
        <h2
          style={{
            fontSize: '18px',
            fontWeight: 600,
            color: '#111827',
            marginBottom: '16px',
            paddingBottom: '8px',
            borderBottom: '1px solid #E5E7EB',
          }}
        >
          Basic Usage
        </h2>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          <DropdownMenu
            trigger={<Button variant="secondary">Actions</Button>}
            items={[
              { id: '1', label: 'Modifier', onClick: () => alert('Modifier') },
              { id: '2', label: 'Dupliquer', onClick: () => alert('Dupliquer') },
              { id: '3', label: 'Supprimer', onClick: () => alert('Supprimer') },
            ]}
          />
          <span style={{ fontSize: '14px', color: '#6B7280' }}>← Click to open</span>
        </div>
      </section>

      {/* With Icons */}
      <section style={{ marginBottom: '48px' }}>
        <h2
          style={{
            fontSize: '18px',
            fontWeight: 600,
            color: '#111827',
            marginBottom: '16px',
            paddingBottom: '8px',
            borderBottom: '1px solid #E5E7EB',
          }}
        >
          With Icons
        </h2>
        <DropdownMenu
          trigger={<Button>Options</Button>}
          items={[
            { id: 'edit', label: 'Modifier', icon: <EditIcon />, onClick: () => alert('Edit') },
            {
              id: 'copy',
              label: 'Dupliquer',
              icon: <CopyIcon />,
              onClick: () => alert('Copy'),
            },
            {
              id: 'download',
              label: 'Télécharger',
              icon: <DownloadIcon />,
              onClick: () => alert('Download'),
            },
            {
              id: 'share',
              label: 'Partager',
              icon: <ShareIcon />,
              onClick: () => alert('Share'),
            },
          ]}
        />
      </section>

      {/* With Descriptions */}
      <section style={{ marginBottom: '48px' }}>
        <h2
          style={{
            fontSize: '18px',
            fontWeight: 600,
            color: '#111827',
            marginBottom: '16px',
            paddingBottom: '8px',
            borderBottom: '1px solid #E5E7EB',
          }}
        >
          With Descriptions
        </h2>
        <DropdownMenu
          trigger={<Button variant="secondary">Plus d&apos;options</Button>}
          items={[
            {
              id: 'edit',
              label: 'Modifier',
              description: 'Éditer les informations',
              icon: <EditIcon />,
              onClick: () => alert('Edit'),
            },
            {
              id: 'download',
              label: 'Télécharger',
              description: 'Export au format PDF',
              icon: <DownloadIcon />,
              onClick: () => alert('Download'),
            },
            {
              id: 'share',
              label: 'Partager',
              description: 'Envoyer par email',
              icon: <ShareIcon />,
              onClick: () => alert('Share'),
            },
          ]}
        />
      </section>

      {/* Separators and Danger */}
      <section style={{ marginBottom: '48px' }}>
        <h2
          style={{
            fontSize: '18px',
            fontWeight: 600,
            color: '#111827',
            marginBottom: '16px',
            paddingBottom: '8px',
            borderBottom: '1px solid #E5E7EB',
          }}
        >
          Separators &amp; Danger Items
        </h2>
        <DropdownMenu
          trigger={<Button variant="secondary">Menu complet</Button>}
          items={[
            { id: 'edit', label: 'Modifier', icon: <EditIcon />, onClick: () => {} },
            { id: 'copy', label: 'Dupliquer', icon: <CopyIcon />, onClick: () => {} },
            { id: 'sep1', separator: true },
            {
              id: 'download',
              label: 'Télécharger',
              icon: <DownloadIcon />,
              onClick: () => {},
            },
            { id: 'share', label: 'Partager', icon: <ShareIcon />, onClick: () => {} },
            { id: 'sep2', separator: true },
            {
              id: 'delete',
              label: 'Supprimer',
              description: 'Action irréversible',
              icon: <TrashIcon />,
              onClick: () => alert('Delete!'),
              danger: true,
            },
          ]}
        />
      </section>

      {/* Alignment */}
      <section style={{ marginBottom: '48px' }}>
        <h2
          style={{
            fontSize: '18px',
            fontWeight: 600,
            color: '#111827',
            marginBottom: '16px',
            paddingBottom: '8px',
            borderBottom: '1px solid #E5E7EB',
          }}
        >
          Alignment Options
        </h2>
        <div style={{ display: 'flex', gap: '24px' }}>
          <div>
            <DropdownMenu
              trigger={<Button variant="secondary">Left (default)</Button>}
              align="left"
              items={[
                { id: '1', label: 'Option 1', onClick: () => {} },
                { id: '2', label: 'Option 2', onClick: () => {} },
              ]}
            />
          </div>
          <div>
            <DropdownMenu
              trigger={<Button variant="secondary">Center</Button>}
              align="center"
              items={[
                { id: '1', label: 'Option 1', onClick: () => {} },
                { id: '2', label: 'Option 2', onClick: () => {} },
              ]}
            />
          </div>
          <div>
            <DropdownMenu
              trigger={<Button variant="secondary">Right</Button>}
              align="right"
              items={[
                { id: '1', label: 'Option 1', onClick: () => {} },
                { id: '2', label: 'Option 2', onClick: () => {} },
              ]}
            />
          </div>
        </div>
      </section>

      {/* Position Top */}
      <section style={{ marginBottom: '48px' }}>
        <h2
          style={{
            fontSize: '18px',
            fontWeight: 600,
            color: '#111827',
            marginBottom: '16px',
            paddingBottom: '8px',
            borderBottom: '1px solid #E5E7EB',
          }}
        >
          Position: Top
        </h2>
        <div style={{ marginTop: '120px' }}>
          <DropdownMenu
            trigger={<Button variant="secondary">Opens upward</Button>}
            side="top"
            items={[
              { id: '1', label: 'Option 1', onClick: () => {} },
              { id: '2', label: 'Option 2', onClick: () => {} },
              { id: '3', label: 'Option 3', onClick: () => {} },
            ]}
          />
        </div>
      </section>

      {/* Disabled Items */}
      <section style={{ marginBottom: '48px' }}>
        <h2
          style={{
            fontSize: '18px',
            fontWeight: 600,
            color: '#111827',
            marginBottom: '16px',
            paddingBottom: '8px',
            borderBottom: '1px solid #E5E7EB',
          }}
        >
          Disabled Items
        </h2>
        <DropdownMenu
          trigger={<Button>Avec items désactivés</Button>}
          items={[
            { id: '1', label: 'Option disponible', icon: <EditIcon />, onClick: () => {} },
            {
              id: '2',
              label: 'Option Pro uniquement',
              icon: <SettingsIcon />,
              onClick: () => {},
              disabled: true,
            },
            { id: '3', label: 'Autre option', icon: <CopyIcon />, onClick: () => {} },
          ]}
        />
      </section>

      {/* Icon Trigger */}
      <section style={{ marginBottom: '48px' }}>
        <h2
          style={{
            fontSize: '18px',
            fontWeight: 600,
            color: '#111827',
            marginBottom: '16px',
            paddingBottom: '8px',
            borderBottom: '1px solid #E5E7EB',
          }}
        >
          Icon Trigger (DataTable style)
        </h2>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            padding: '12px',
            backgroundColor: '#F9FAFB',
            borderRadius: '8px',
          }}
        >
          <span style={{ flex: 1, fontSize: '14px' }}>Client example row</span>
          <DropdownMenu
            trigger={
              <button
                style={{
                  padding: '8px',
                  border: 'none',
                  background: 'transparent',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  color: '#6B7280',
                }}
              >
                <MoreIcon />
              </button>
            }
            align="right"
            items={[
              { id: 'view', label: 'Voir détails', icon: <UserIcon />, onClick: () => {} },
              { id: 'edit', label: 'Modifier', icon: <EditIcon />, onClick: () => {} },
              { id: 'sep', separator: true },
              {
                id: 'delete',
                label: 'Supprimer',
                icon: <TrashIcon />,
                onClick: () => {},
                danger: true,
              },
            ]}
          />
        </div>
      </section>

      {/* User Menu Example */}
      <section
        style={{
          marginBottom: '48px',
          padding: '24px',
          backgroundColor: '#F9FAFB',
          borderRadius: '12px',
        }}
      >
        <h2
          style={{
            fontSize: '18px',
            fontWeight: 600,
            color: '#111827',
            marginBottom: '16px',
          }}
        >
          User Menu Example (TopBar style)
        </h2>
        <DropdownMenu
          trigger={
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 12px',
                backgroundColor: '#FFFFFF',
                borderRadius: '8px',
                border: '1px solid #E5E7EB',
                cursor: 'pointer',
              }}
            >
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  backgroundColor: '#0A1628',
                  color: '#FFFFFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '12px',
                  fontWeight: 600,
                }}
              >
                JD
              </div>
              <span style={{ fontSize: '14px', fontWeight: 500, color: '#111827' }}>
                Jean Dupont
              </span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth="2">
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </div>
          }
          align="right"
          items={[
            {
              id: 'profile',
              label: 'Mon profil',
              description: 'jean.dupont@garage.fr',
              icon: <UserIcon />,
              onClick: () => {},
            },
            {
              id: 'settings',
              label: 'Paramètres',
              icon: <SettingsIcon />,
              onClick: () => {},
            },
            { id: 'sep1', separator: true },
            {
              id: 'logout',
              label: 'Se déconnecter',
              icon: <LogoutIcon />,
              onClick: () => alert('Logout!'),
              danger: true,
            },
          ]}
        />
      </section>

      {/* Tests checklist */}
      <section
        style={{
          padding: '24px',
          backgroundColor: '#F0FDF4',
          borderRadius: '12px',
          border: '1px solid #BBF7D0',
        }}
      >
        <h2
          style={{
            fontSize: '18px',
            fontWeight: 600,
            color: '#166534',
            marginBottom: '16px',
          }}
        >
          ✅ Tests Checklist
        </h2>
        <ul
          style={{
            margin: 0,
            paddingLeft: '20px',
            fontSize: '14px',
            color: '#166534',
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: '8px',
          }}
        >
          <li>Click trigger opens menu</li>
          <li>Click outside closes menu</li>
          <li>ESC closes menu</li>
          <li>Arrow keys navigation works</li>
          <li>Enter selects item</li>
          <li>Click item executes action</li>
          <li>Disabled items not clickable</li>
          <li>Danger items in red</li>
          <li>Separators displayed</li>
          <li>Icons aligned correctly</li>
          <li>Descriptions shown</li>
          <li>Alignment left/right/center</li>
          <li>Position top/bottom</li>
          <li>Hover highlight works</li>
        </ul>
      </section>
    </div>
  )
}
