'use client'

import { Tooltip } from '@/components/shared/tooltip'
import { Button } from '@/components/shared/button'

// Simple SVG icons for demo
const HelpIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10" />
    <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
    <line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
)

const InfoIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="16" x2="12" y2="12" />
    <line x1="12" y1="8" x2="12.01" y2="8" />
  </svg>
)

const DownloadIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" y1="15" x2="12" y2="3" />
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

const TrashIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
  </svg>
)

export default function TestTooltipPage() {
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
        Tooltip Component Test
      </h1>
      <p
        style={{
          fontSize: '14px',
          color: '#6B7280',
          marginBottom: '40px',
        }}
      >
        Hover over elements to see tooltips
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
          <Tooltip content="Ceci est une info-bulle">
            <Button variant="secondary">Survolez-moi</Button>
          </Tooltip>
          <Tooltip content="Aide disponible">
            <span style={{ cursor: 'help', color: '#6B7280' }}>
              <HelpIcon />
            </span>
          </Tooltip>
        </div>
      </section>

      {/* Positions (Sides) */}
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
          Positions (Sides)
        </h2>
        <div
          style={{
            display: 'flex',
            gap: '24px',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '48px',
          }}
        >
          <Tooltip content="Tooltip en haut" side="top">
            <Button>Top</Button>
          </Tooltip>
          <Tooltip content="Tooltip en bas" side="bottom">
            <Button>Bottom</Button>
          </Tooltip>
          <Tooltip content="Tooltip à gauche" side="left">
            <Button>Left</Button>
          </Tooltip>
          <Tooltip content="Tooltip à droite" side="right">
            <Button>Right</Button>
          </Tooltip>
        </div>
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
          Alignment
        </h2>
        <div
          style={{
            display: 'flex',
            gap: '24px',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '32px',
          }}
        >
          <Tooltip content="Aligné au début" side="bottom" align="start">
            <Button variant="secondary">Align Start</Button>
          </Tooltip>
          <Tooltip content="Centré" side="bottom" align="center">
            <Button variant="secondary">Align Center</Button>
          </Tooltip>
          <Tooltip content="Aligné à la fin" side="bottom" align="end">
            <Button variant="secondary">Align End</Button>
          </Tooltip>
        </div>
      </section>

      {/* Long Content */}
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
          Long Content &amp; Max Width
        </h2>
        <div style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
          <Tooltip
            content="Ceci est un tooltip avec un contenu plus long qui va automatiquement passer à la ligne si nécessaire."
            maxWidth={200}
          >
            <span style={{ cursor: 'help', color: '#6B7280' }}>
              <InfoIcon />
            </span>
          </Tooltip>
          <span style={{ fontSize: '14px', color: '#6B7280' }}>
            ← Hover for long tooltip (max 200px)
          </span>
        </div>
      </section>

      {/* Delay Duration */}
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
          Delay Duration
        </h2>
        <div style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
          <Tooltip content="Apparaît immédiatement" delayDuration={0}>
            <Button variant="secondary">No delay (0ms)</Button>
          </Tooltip>
          <Tooltip content="Délai par défaut" delayDuration={400}>
            <Button variant="secondary">Default (400ms)</Button>
          </Tooltip>
          <Tooltip content="Délai de 1 seconde" delayDuration={1000}>
            <Button variant="secondary">Long delay (1s)</Button>
          </Tooltip>
        </div>
      </section>

      {/* Disabled */}
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
          Disabled
        </h2>
        <div style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
          <Tooltip content="Ce tooltip ne s'affiche pas" disabled>
            <Button variant="secondary">Tooltip désactivé</Button>
          </Tooltip>
          <span style={{ fontSize: '14px', color: '#6B7280' }}>
            ← No tooltip will appear
          </span>
        </div>
      </section>

      {/* Inline Text */}
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
          Inline Text with Tooltip
        </h2>
        <p style={{ fontSize: '14px', lineHeight: '24px', color: '#374151' }}>
          Ce texte contient{' '}
          <Tooltip content="Information complémentaire sur ce terme technique">
            <span
              style={{
                textDecoration: 'underline dotted',
                cursor: 'help',
                color: '#0A1628',
              }}
            >
              un terme technique
            </span>
          </Tooltip>{' '}
          qui nécessite une explication. Et voici{' '}
          <Tooltip content="SIRET: Système d'Identification du Répertoire des Établissements">
            <span
              style={{
                textDecoration: 'underline dotted',
                cursor: 'help',
                color: '#0A1628',
              }}
            >
              un acronyme
            </span>
          </Tooltip>{' '}
          à définir.
        </p>
      </section>

      {/* Icon Actions */}
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
          Icon Actions with Tooltips
        </h2>
        <div
          style={{
            display: 'flex',
            gap: '8px',
            padding: '12px',
            backgroundColor: '#F9FAFB',
            borderRadius: '8px',
            width: 'fit-content',
          }}
        >
          <Tooltip content="Télécharger le PDF">
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
              <DownloadIcon />
            </button>
          </Tooltip>

          <Tooltip content="Partager par email">
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
              <ShareIcon />
            </button>
          </Tooltip>

          <Tooltip content="Supprimer définitivement">
            <button
              style={{
                padding: '8px',
                border: 'none',
                background: 'transparent',
                borderRadius: '6px',
                cursor: 'pointer',
                color: '#DC2626',
              }}
            >
              <TrashIcon />
            </button>
          </Tooltip>
        </div>
      </section>

      {/* Form Label with Help */}
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
          Form Label with Help Icon
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <label
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '14px',
              fontWeight: 500,
              color: '#111827',
            }}
          >
            Numéro SIRET
            <Tooltip content="Le numéro SIRET est composé de 14 chiffres et identifie chaque établissement d'une entreprise">
              <span style={{ cursor: 'help', color: '#6B7280' }}>
                <HelpIcon />
              </span>
            </Tooltip>
          </label>
          <input
            type="text"
            placeholder="123 456 789 00012"
            style={{
              padding: '10px 14px',
              fontSize: '14px',
              border: '1px solid #E5E7EB',
              borderRadius: '8px',
              width: '250px',
            }}
          />
        </div>
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
          <li>Appears after delay on hover</li>
          <li>Disappears on mouse leave</li>
          <li>Appears on focus</li>
          <li>Disappears on blur</li>
          <li>All 4 sides position correctly</li>
          <li>Arrow points to trigger</li>
          <li>Alignment start/center/end works</li>
          <li>Stays within viewport</li>
          <li>Recalculates on scroll</li>
          <li>Custom delay works</li>
          <li>Disabled blocks tooltip</li>
          <li>MaxWidth limits width</li>
          <li>Long content wraps</li>
          <li>Smooth fade animation</li>
        </ul>
      </section>
    </div>
  )
}
