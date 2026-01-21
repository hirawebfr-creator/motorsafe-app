'use client'

import { Breadcrumb } from '@/components/shared/breadcrumb'

// ─────────────────────────────────────────────────────────────
// Mock Icons
// ─────────────────────────────────────────────────────────────

function UsersIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  )
}

function CarIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.5 2.8c-.3.5-.1 1.1.4 1.4" />
      <circle cx="7" cy="17" r="2" />
      <circle cx="17" cy="17" r="2" />
    </svg>
  )
}

function FileTextIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <polyline points="10 9 9 9 8 9" />
    </svg>
  )
}

function SettingsIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  )
}

function WrenchIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
    </svg>
  )
}

// ─────────────────────────────────────────────────────────────
// Test Page
// ─────────────────────────────────────────────────────────────

export default function TestBreadcrumbPage() {
  return (
    <div style={{ padding: '40px', maxWidth: '900px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '28px', fontWeight: 700, color: '#0A1628', marginBottom: '8px' }}>
        Breadcrumb Component Test
      </h1>
      <p style={{ color: '#6B7280', marginBottom: '40px' }}>
        Test du fil d&apos;Ariane avec séparateurs, collapse, et icônes.
      </p>

      {/* Simple */}
      <section style={{ marginBottom: '48px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#0A1628', marginBottom: '16px' }}>
          1. Simple (3 items)
        </h2>
        <div
          style={{
            padding: '20px',
            backgroundColor: '#F9FAFB',
            borderRadius: '8px',
            border: '1px solid #E5E7EB',
          }}
        >
          <Breadcrumb
            items={[
              { label: 'Clients', href: '/clients' },
              { label: 'Jean Dupont', href: '/clients/123' },
              { label: 'Détails' },
            ]}
          />
        </div>
      </section>

      {/* With Icons */}
      <section style={{ marginBottom: '48px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#0A1628', marginBottom: '16px' }}>
          2. Avec Icônes
        </h2>
        <div
          style={{
            padding: '20px',
            backgroundColor: '#F9FAFB',
            borderRadius: '8px',
            border: '1px solid #E5E7EB',
          }}
        >
          <Breadcrumb
            items={[
              { label: 'Clients', href: '/clients', icon: <UsersIcon /> },
              { label: 'Jean Dupont', href: '/clients/123' },
              { label: 'Véhicules', icon: <CarIcon /> },
            ]}
          />
        </div>
      </section>

      {/* Without Home */}
      <section style={{ marginBottom: '48px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#0A1628', marginBottom: '16px' }}>
          3. Sans Home Icon
        </h2>
        <div
          style={{
            padding: '20px',
            backgroundColor: '#F9FAFB',
            borderRadius: '8px',
            border: '1px solid #E5E7EB',
          }}
        >
          <Breadcrumb
            showHome={false}
            items={[
              { label: 'Dashboard', href: '/dashboard' },
              { label: 'Statistiques' },
            ]}
          />
        </div>
      </section>

      {/* With onClick */}
      <section style={{ marginBottom: '48px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#0A1628', marginBottom: '16px' }}>
          4. Avec onClick (au lieu de href)
        </h2>
        <div
          style={{
            padding: '20px',
            backgroundColor: '#F9FAFB',
            borderRadius: '8px',
            border: '1px solid #E5E7EB',
          }}
        >
          <Breadcrumb
            items={[
              { label: 'Clients', onClick: () => alert('Navigate to Clients') },
              { label: 'Véhicules', onClick: () => alert('Navigate to Véhicules') },
              { label: 'Détails' },
            ]}
          />
        </div>
        <p style={{ marginTop: '8px', fontSize: '13px', color: '#6B7280' }}>
          Cliquez sur les liens pour voir les alertes
        </p>
      </section>

      {/* MaxItems Collapse */}
      <section style={{ marginBottom: '48px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#0A1628', marginBottom: '16px' }}>
          5. MaxItems avec Collapse (...)
        </h2>
        <div
          style={{
            padding: '20px',
            backgroundColor: '#F9FAFB',
            borderRadius: '8px',
            border: '1px solid #E5E7EB',
          }}
        >
          <Breadcrumb
            maxItems={4}
            items={[
              { label: 'Dashboard', href: '/dashboard' },
              { label: 'Clients', href: '/clients' },
              { label: 'Jean Dupont', href: '/clients/123' },
              { label: 'Véhicules', href: '/clients/123/vehicules' },
              { label: 'Peugeot 208', href: '/clients/123/vehicules/456' },
              { label: 'Interventions', href: '/clients/123/vehicules/456/interventions' },
              { label: 'Détails' },
            ]}
          />
        </div>
        <p style={{ marginTop: '8px', fontSize: '13px', color: '#6B7280' }}>
          7 items → collapse à 4 (premier + ... + 2 derniers)
        </p>
      </section>

      {/* Custom Separator */}
      <section style={{ marginBottom: '48px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#0A1628', marginBottom: '16px' }}>
          6. Séparateur Personnalisé
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div
            style={{
              padding: '20px',
              backgroundColor: '#F9FAFB',
              borderRadius: '8px',
              border: '1px solid #E5E7EB',
            }}
          >
            <p style={{ fontSize: '13px', color: '#6B7280', marginBottom: '8px' }}>Slash (/)</p>
            <Breadcrumb
              separator={<span style={{ color: '#D1D5DB', margin: '0 4px' }}>/</span>}
              items={[
                { label: 'Clients', href: '/clients' },
                { label: 'Jean Dupont', href: '/clients/123' },
                { label: 'Détails' },
              ]}
            />
          </div>
          <div
            style={{
              padding: '20px',
              backgroundColor: '#F9FAFB',
              borderRadius: '8px',
              border: '1px solid #E5E7EB',
            }}
          >
            <p style={{ fontSize: '13px', color: '#6B7280', marginBottom: '8px' }}>Arrow (→)</p>
            <Breadcrumb
              separator={<span style={{ color: '#D1D5DB', margin: '0 4px' }}>→</span>}
              items={[
                { label: 'Clients', href: '/clients' },
                { label: 'Jean Dupont', href: '/clients/123' },
                { label: 'Détails' },
              ]}
            />
          </div>
          <div
            style={{
              padding: '20px',
              backgroundColor: '#F9FAFB',
              borderRadius: '8px',
              border: '1px solid #E5E7EB',
            }}
          >
            <p style={{ fontSize: '13px', color: '#6B7280', marginBottom: '8px' }}>Pipe (|)</p>
            <Breadcrumb
              separator={<span style={{ color: '#D1D5DB', margin: '0 4px' }}>|</span>}
              items={[
                { label: 'Clients', href: '/clients' },
                { label: 'Jean Dupont', href: '/clients/123' },
                { label: 'Détails' },
              ]}
            />
          </div>
        </div>
      </section>

      {/* Client Detail Page */}
      <section style={{ marginBottom: '48px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#0A1628', marginBottom: '16px' }}>
          7. Page Détail Client
        </h2>
        <div
          style={{
            padding: '20px',
            backgroundColor: '#FFFFFF',
            borderRadius: '8px',
            border: '1px solid #E5E7EB',
          }}
        >
          <Breadcrumb
            items={[
              { label: 'Clients', href: '/clients', icon: <UsersIcon /> },
              { label: 'Jean Dupont' },
            ]}
          />
          <h1 style={{ fontSize: '32px', fontWeight: 700, marginTop: '16px', color: '#0A1628' }}>
            Jean Dupont
          </h1>
        </div>
      </section>

      {/* Intervention Detail Page */}
      <section style={{ marginBottom: '48px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#0A1628', marginBottom: '16px' }}>
          8. Page Détail Intervention
        </h2>
        <div
          style={{
            padding: '20px',
            backgroundColor: '#FFFFFF',
            borderRadius: '8px',
            border: '1px solid #E5E7EB',
          }}
        >
          <Breadcrumb
            maxItems={5}
            items={[
              { label: 'Clients', href: '/clients' },
              { label: 'Jean Dupont', href: '/clients/123' },
              { label: 'Véhicules', href: '/clients/123/vehicules' },
              { label: 'Peugeot 208', href: '/vehicules/456' },
              { label: 'Interventions', href: '/vehicules/456/interventions', icon: <WrenchIcon /> },
              { label: 'Révision 20000 km' },
            ]}
          />
          <h1 style={{ fontSize: '32px', fontWeight: 700, marginTop: '16px', color: '#0A1628' }}>
            Révision 20000 km
          </h1>
        </div>
      </section>

      {/* Document Page */}
      <section style={{ marginBottom: '48px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#0A1628', marginBottom: '16px' }}>
          9. Page Document
        </h2>
        <div
          style={{
            padding: '20px',
            backgroundColor: '#FFFFFF',
            borderRadius: '8px',
            border: '1px solid #E5E7EB',
          }}
        >
          <Breadcrumb
            items={[
              { label: 'Documents', href: '/documents', icon: <FileTextIcon /> },
              { label: 'Factures', href: '/documents/factures' },
              { label: 'Facture #2024-001' },
            ]}
          />
          <h1 style={{ fontSize: '32px', fontWeight: 700, marginTop: '16px', color: '#0A1628' }}>
            Facture #2024-001
          </h1>
        </div>
      </section>

      {/* Settings Page */}
      <section style={{ marginBottom: '48px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#0A1628', marginBottom: '16px' }}>
          10. Page Paramètres
        </h2>
        <div
          style={{
            padding: '20px',
            backgroundColor: '#FFFFFF',
            borderRadius: '8px',
            border: '1px solid #E5E7EB',
          }}
        >
          <Breadcrumb
            items={[
              { label: 'Paramètres', href: '/parametres', icon: <SettingsIcon /> },
              { label: 'Garage', href: '/parametres/garage' },
              { label: 'Profil' },
            ]}
          />
          <h1 style={{ fontSize: '32px', fontWeight: 700, marginTop: '16px', color: '#0A1628' }}>
            Profil du Garage
          </h1>
        </div>
      </section>

      {/* Single Item */}
      <section style={{ marginBottom: '48px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#0A1628', marginBottom: '16px' }}>
          11. Item Unique
        </h2>
        <div
          style={{
            padding: '20px',
            backgroundColor: '#F9FAFB',
            borderRadius: '8px',
            border: '1px solid #E5E7EB',
          }}
        >
          <Breadcrumb items={[{ label: 'Dashboard' }]} />
        </div>
      </section>

      {/* Custom Home */}
      <section style={{ marginBottom: '48px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#0A1628', marginBottom: '16px' }}>
          12. Custom Home Href
        </h2>
        <div
          style={{
            padding: '20px',
            backgroundColor: '#F9FAFB',
            borderRadius: '8px',
            border: '1px solid #E5E7EB',
          }}
        >
          <Breadcrumb
            homeHref="/dashboard"
            items={[
              { label: 'Paramètres', href: '/parametres' },
              { label: 'Notifications' },
            ]}
          />
        </div>
        <p style={{ marginTop: '8px', fontSize: '13px', color: '#6B7280' }}>
          Home pointe vers /dashboard au lieu de /
        </p>
      </section>

      {/* Info Box */}
      <section
        style={{
          padding: '20px',
          backgroundColor: '#F0F9FF',
          borderRadius: '8px',
          border: '1px solid #BAE6FD',
        }}
      >
        <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#0369A1', marginBottom: '12px' }}>
          📋 Récapitulatif
        </h3>
        <ul style={{ fontSize: '13px', color: '#0C4A6E', margin: 0, paddingLeft: '20px' }}>
          <li style={{ marginBottom: '4px' }}>
            <strong>showHome</strong>: Affiche/masque l&apos;icône home
          </li>
          <li style={{ marginBottom: '4px' }}>
            <strong>separator</strong>: Personnalise le séparateur
          </li>
          <li style={{ marginBottom: '4px' }}>
            <strong>maxItems</strong>: Limite les items visibles (collapse avec ...)
          </li>
          <li style={{ marginBottom: '4px' }}>
            <strong>icon</strong>: Ajoute une icône à un item
          </li>
          <li style={{ marginBottom: '4px' }}>
            <strong>href</strong>: Lien cliquable
          </li>
          <li>
            <strong>onClick</strong>: Callback au lieu de navigation
          </li>
        </ul>
      </section>
    </div>
  )
}
