'use client'

import { useState } from 'react'
import { Tabs } from '@/components/shared/tabs'
import { Button } from '@/components/shared/button'

// ─────────────────────────────────────────────────────────────
// Mock Icons (inline SVG)
// ─────────────────────────────────────────────────────────────

function FileIcon() {
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

function SettingsIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  )
}

function BellIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
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

export default function TestTabsPage() {
  const [controlledTab, setControlledTab] = useState('tab1')
  const [lastChange, setLastChange] = useState<string | null>(null)

  const handleChange = (tabId: string) => {
    setLastChange(tabId)
  }

  return (
    <div style={{ padding: '40px', maxWidth: '900px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '28px', fontWeight: 700, color: '#0A1628', marginBottom: '8px' }}>
        Tabs Component Test
      </h1>
      <p style={{ color: '#6B7280', marginBottom: '40px' }}>
        Test des onglets avec 3 variants, keyboard navigation, badges, et icônes.
      </p>

      {/* Basic Line Variant */}
      <section style={{ marginBottom: '48px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#0A1628', marginBottom: '16px' }}>
          1. Line Variant (default)
        </h2>
        <Tabs
          tabs={[
            {
              id: 'tab1',
              label: 'Onglet 1',
              content: (
                <div style={{ padding: '20px', backgroundColor: '#F9FAFB', borderRadius: '8px' }}>
                  <h3 style={{ fontWeight: 600, marginBottom: '8px' }}>Contenu de l&apos;onglet 1</h3>
                  <p style={{ color: '#6B7280' }}>
                    Ceci est le contenu du premier onglet. L&apos;indicateur animé suit le tab actif.
                  </p>
                </div>
              ),
            },
            {
              id: 'tab2',
              label: 'Onglet 2',
              content: (
                <div style={{ padding: '20px', backgroundColor: '#F9FAFB', borderRadius: '8px' }}>
                  <h3 style={{ fontWeight: 600, marginBottom: '8px' }}>Contenu de l&apos;onglet 2</h3>
                  <p style={{ color: '#6B7280' }}>
                    Utilisez les flèches gauche/droite pour naviguer entre les onglets.
                  </p>
                </div>
              ),
            },
            {
              id: 'tab3',
              label: 'Onglet 3',
              content: (
                <div style={{ padding: '20px', backgroundColor: '#F9FAFB', borderRadius: '8px' }}>
                  <h3 style={{ fontWeight: 600, marginBottom: '8px' }}>Contenu de l&apos;onglet 3</h3>
                  <p style={{ color: '#6B7280' }}>
                    Appuyez sur Home/End pour aller au premier/dernier onglet.
                  </p>
                </div>
              ),
            },
          ]}
          onChange={handleChange}
        />
        {lastChange && (
          <p style={{ marginTop: '12px', fontSize: '13px', color: '#6B7280' }}>
            Dernier changement: <strong>{lastChange}</strong>
          </p>
        )}
      </section>

      {/* With Icons */}
      <section style={{ marginBottom: '48px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#0A1628', marginBottom: '16px' }}>
          2. Avec Icônes
        </h2>
        <Tabs
          tabs={[
            {
              id: 'documents',
              label: 'Documents',
              icon: <FileIcon />,
              content: (
                <div style={{ padding: '20px', backgroundColor: '#F9FAFB', borderRadius: '8px' }}>
                  <p>Liste des documents...</p>
                </div>
              ),
            },
            {
              id: 'clients',
              label: 'Clients',
              icon: <UsersIcon />,
              content: (
                <div style={{ padding: '20px', backgroundColor: '#F9FAFB', borderRadius: '8px' }}>
                  <p>Liste des clients...</p>
                </div>
              ),
            },
            {
              id: 'settings',
              label: 'Paramètres',
              icon: <SettingsIcon />,
              content: (
                <div style={{ padding: '20px', backgroundColor: '#F9FAFB', borderRadius: '8px' }}>
                  <p>Paramètres de l&apos;application...</p>
                </div>
              ),
            },
          ]}
        />
      </section>

      {/* With Badges */}
      <section style={{ marginBottom: '48px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#0A1628', marginBottom: '16px' }}>
          3. Avec Badges
        </h2>
        <Tabs
          tabs={[
            {
              id: 'all',
              label: 'Tous',
              badge: 24,
              content: (
                <div style={{ padding: '20px', backgroundColor: '#F9FAFB', borderRadius: '8px' }}>
                  <p>24 éléments au total</p>
                </div>
              ),
            },
            {
              id: 'pending',
              label: 'En attente',
              badge: 5,
              content: (
                <div style={{ padding: '20px', backgroundColor: '#F9FAFB', borderRadius: '8px' }}>
                  <p>5 éléments en attente</p>
                </div>
              ),
            },
            {
              id: 'done',
              label: 'Terminés',
              content: (
                <div style={{ padding: '20px', backgroundColor: '#F9FAFB', borderRadius: '8px' }}>
                  <p>Éléments terminés</p>
                </div>
              ),
            },
          ]}
        />
      </section>

      {/* Pills Variant */}
      <section style={{ marginBottom: '48px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#0A1628', marginBottom: '16px' }}>
          4. Pills Variant
        </h2>
        <Tabs
          variant="pills"
          tabs={[
            {
              id: 'overview',
              label: 'Vue d\'ensemble',
              content: (
                <div style={{ padding: '20px', backgroundColor: '#F9FAFB', borderRadius: '8px' }}>
                  <p>Vue d&apos;ensemble du projet</p>
                </div>
              ),
            },
            {
              id: 'analytics',
              label: 'Analytiques',
              content: (
                <div style={{ padding: '20px', backgroundColor: '#F9FAFB', borderRadius: '8px' }}>
                  <p>Données analytiques</p>
                </div>
              ),
            },
            {
              id: 'reports',
              label: 'Rapports',
              content: (
                <div style={{ padding: '20px', backgroundColor: '#F9FAFB', borderRadius: '8px' }}>
                  <p>Rapports générés</p>
                </div>
              ),
            },
          ]}
        />
      </section>

      {/* Enclosed Variant */}
      <section style={{ marginBottom: '48px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#0A1628', marginBottom: '16px' }}>
          5. Enclosed Variant
        </h2>
        <Tabs
          variant="enclosed"
          tabs={[
            {
              id: 'info',
              label: 'Informations',
              content: (
                <div>
                  <h3 style={{ fontWeight: 600, marginBottom: '8px' }}>Informations générales</h3>
                  <p style={{ color: '#6B7280' }}>
                    Ce variant a un conteneur avec bordure qui enveloppe le contenu.
                  </p>
                </div>
              ),
            },
            {
              id: 'history',
              label: 'Historique',
              content: (
                <div>
                  <h3 style={{ fontWeight: 600, marginBottom: '8px' }}>Historique des actions</h3>
                  <p style={{ color: '#6B7280' }}>Liste des actions effectuées...</p>
                </div>
              ),
            },
            {
              id: 'notes',
              label: 'Notes',
              content: (
                <div>
                  <h3 style={{ fontWeight: 600, marginBottom: '8px' }}>Notes et commentaires</h3>
                  <p style={{ color: '#6B7280' }}>Ajoutez vos notes ici...</p>
                </div>
              ),
            },
          ]}
        />
      </section>

      {/* Full Width */}
      <section style={{ marginBottom: '48px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#0A1628', marginBottom: '16px' }}>
          6. Full Width
        </h2>
        <Tabs
          fullWidth
          tabs={[
            {
              id: 'monthly',
              label: 'Mensuel',
              content: (
                <div style={{ padding: '20px', backgroundColor: '#F9FAFB', borderRadius: '8px' }}>
                  <p>Vue mensuelle</p>
                </div>
              ),
            },
            {
              id: 'yearly',
              label: 'Annuel',
              content: (
                <div style={{ padding: '20px', backgroundColor: '#F9FAFB', borderRadius: '8px' }}>
                  <p>Vue annuelle</p>
                </div>
              ),
            },
          ]}
        />
      </section>

      {/* Disabled Tabs */}
      <section style={{ marginBottom: '48px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#0A1628', marginBottom: '16px' }}>
          7. Tabs Disabled
        </h2>
        <Tabs
          tabs={[
            {
              id: 'basic',
              label: 'Basique',
              content: (
                <div style={{ padding: '20px', backgroundColor: '#F9FAFB', borderRadius: '8px' }}>
                  <p>Paramètres basiques accessibles</p>
                </div>
              ),
            },
            {
              id: 'advanced',
              label: 'Avancé',
              disabled: true,
              content: (
                <div style={{ padding: '20px', backgroundColor: '#F9FAFB', borderRadius: '8px' }}>
                  <p>Paramètres avancés (locked)</p>
                </div>
              ),
            },
            {
              id: 'premium',
              label: 'Premium',
              disabled: true,
              content: (
                <div style={{ padding: '20px', backgroundColor: '#F9FAFB', borderRadius: '8px' }}>
                  <p>Fonctionnalités premium (locked)</p>
                </div>
              ),
            },
          ]}
        />
      </section>

      {/* Sizes */}
      <section style={{ marginBottom: '48px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#0A1628', marginBottom: '16px' }}>
          8. Tailles (sm, md, lg)
        </h2>
        
        <div style={{ marginBottom: '24px' }}>
          <p style={{ fontSize: '13px', color: '#6B7280', marginBottom: '8px' }}>Small (sm)</p>
          <Tabs
            size="sm"
            tabs={[
              { id: 's1', label: 'Tab 1', content: <p>Content small 1</p> },
              { id: 's2', label: 'Tab 2', content: <p>Content small 2</p> },
              { id: 's3', label: 'Tab 3', content: <p>Content small 3</p> },
            ]}
          />
        </div>
        
        <div style={{ marginBottom: '24px' }}>
          <p style={{ fontSize: '13px', color: '#6B7280', marginBottom: '8px' }}>Medium (md) - default</p>
          <Tabs
            size="md"
            tabs={[
              { id: 'm1', label: 'Tab 1', content: <p>Content medium 1</p> },
              { id: 'm2', label: 'Tab 2', content: <p>Content medium 2</p> },
              { id: 'm3', label: 'Tab 3', content: <p>Content medium 3</p> },
            ]}
          />
        </div>
        
        <div>
          <p style={{ fontSize: '13px', color: '#6B7280', marginBottom: '8px' }}>Large (lg)</p>
          <Tabs
            size="lg"
            tabs={[
              { id: 'l1', label: 'Tab 1', content: <p>Content large 1</p> },
              { id: 'l2', label: 'Tab 2', content: <p>Content large 2</p> },
              { id: 'l3', label: 'Tab 3', content: <p>Content large 3</p> },
            ]}
          />
        </div>
      </section>

      {/* Controlled Mode */}
      <section style={{ marginBottom: '48px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#0A1628', marginBottom: '16px' }}>
          9. Controlled Mode
        </h2>
        <Tabs
          value={controlledTab}
          onChange={setControlledTab}
          tabs={[
            {
              id: 'tab1',
              label: 'Tab 1',
              content: (
                <div style={{ padding: '20px', backgroundColor: '#F9FAFB', borderRadius: '8px' }}>
                  <p>Contenu du Tab 1 (contrôlé)</p>
                </div>
              ),
            },
            {
              id: 'tab2',
              label: 'Tab 2',
              content: (
                <div style={{ padding: '20px', backgroundColor: '#F9FAFB', borderRadius: '8px' }}>
                  <p>Contenu du Tab 2 (contrôlé)</p>
                </div>
              ),
            },
            {
              id: 'tab3',
              label: 'Tab 3',
              content: (
                <div style={{ padding: '20px', backgroundColor: '#F9FAFB', borderRadius: '8px' }}>
                  <p>Contenu du Tab 3 (contrôlé)</p>
                </div>
              ),
            },
          ]}
        />
        <div style={{ marginTop: '16px', display: 'flex', gap: '8px' }}>
          <Button size="sm" onClick={() => setControlledTab('tab1')}>
            Aller à Tab 1
          </Button>
          <Button size="sm" onClick={() => setControlledTab('tab2')}>
            Aller à Tab 2
          </Button>
          <Button size="sm" onClick={() => setControlledTab('tab3')}>
            Aller à Tab 3
          </Button>
        </div>
        <p style={{ marginTop: '12px', fontSize: '13px', color: '#6B7280' }}>
          Tab actif: <strong>{controlledTab}</strong>
        </p>
      </section>

      {/* Complex Example */}
      <section style={{ marginBottom: '48px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#0A1628', marginBottom: '16px' }}>
          10. Exemple Complexe (Icons + Badges)
        </h2>
        <Tabs
          variant="pills"
          tabs={[
            {
              id: 'interventions',
              label: 'Interventions',
              icon: <WrenchIcon />,
              badge: 12,
              content: (
                <div style={{ padding: '20px', backgroundColor: '#F9FAFB', borderRadius: '8px' }}>
                  <h3 style={{ fontWeight: 600, marginBottom: '8px' }}>Liste des interventions</h3>
                  <p style={{ color: '#6B7280' }}>12 interventions en cours</p>
                </div>
              ),
            },
            {
              id: 'devis',
              label: 'Devis',
              icon: <FileIcon />,
              badge: 3,
              content: (
                <div style={{ padding: '20px', backgroundColor: '#F9FAFB', borderRadius: '8px' }}>
                  <h3 style={{ fontWeight: 600, marginBottom: '8px' }}>Liste des devis</h3>
                  <p style={{ color: '#6B7280' }}>3 devis en attente de validation</p>
                </div>
              ),
            },
            {
              id: 'notifications',
              label: 'Notifications',
              icon: <BellIcon />,
              badge: 'New',
              content: (
                <div style={{ padding: '20px', backgroundColor: '#F9FAFB', borderRadius: '8px' }}>
                  <h3 style={{ fontWeight: 600, marginBottom: '8px' }}>Notifications</h3>
                  <p style={{ color: '#6B7280' }}>Nouvelles notifications</p>
                </div>
              ),
            },
          ]}
        />
      </section>

      {/* Keyboard Navigation Info */}
      <section
        style={{
          padding: '20px',
          backgroundColor: '#F0F9FF',
          borderRadius: '8px',
          border: '1px solid #BAE6FD',
        }}
      >
        <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#0369A1', marginBottom: '12px' }}>
          ⌨️ Navigation Clavier
        </h3>
        <ul style={{ fontSize: '13px', color: '#0C4A6E', margin: 0, paddingLeft: '20px' }}>
          <li style={{ marginBottom: '4px' }}>
            <strong>← →</strong> : Naviguer entre les onglets
          </li>
          <li style={{ marginBottom: '4px' }}>
            <strong>Home</strong> : Aller au premier onglet
          </li>
          <li style={{ marginBottom: '4px' }}>
            <strong>End</strong> : Aller au dernier onglet
          </li>
          <li>
            <strong>Tab</strong> : Focus le contenu du panneau actif
          </li>
        </ul>
      </section>
    </div>
  )
}
