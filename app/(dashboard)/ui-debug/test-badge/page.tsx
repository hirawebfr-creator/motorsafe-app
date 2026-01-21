'use client'

import { useState } from 'react'
import { Badge } from '@/components/shared/badge'

// ─────────────────────────────────────────────────────────────
// Test Page
// ─────────────────────────────────────────────────────────────

export default function TestBadgePage() {
  const [tags, setTags] = useState(['React', 'TypeScript', 'Next.js', 'Tailwind'])
  const [removedCount, setRemovedCount] = useState(0)

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((tag) => tag !== tagToRemove))
    setRemovedCount((prev) => prev + 1)
  }

  return (
    <div style={{ padding: '40px', maxWidth: '900px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '28px', fontWeight: 700, color: '#0A1628', marginBottom: '8px' }}>
        Badge Component Test
      </h1>
      <p style={{ color: '#6B7280', marginBottom: '40px' }}>
        Test des badges avec variants, tailles, dots, et bouton de suppression.
      </p>

      {/* All Variants */}
      <section style={{ marginBottom: '48px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#0A1628', marginBottom: '16px' }}>
          1. Tous les Variants
        </h2>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <Badge variant="default">Default</Badge>
          <Badge variant="success">Success</Badge>
          <Badge variant="warning">Warning</Badge>
          <Badge variant="error">Error</Badge>
          <Badge variant="info">Info</Badge>
          <Badge variant="neutral">Neutral</Badge>
        </div>
      </section>

      {/* Sizes */}
      <section style={{ marginBottom: '48px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#0A1628', marginBottom: '16px' }}>
          2. Tailles (sm, md, lg)
        </h2>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
          <Badge size="sm" variant="info">
            Small
          </Badge>
          <Badge size="md" variant="info">
            Medium
          </Badge>
          <Badge size="lg" variant="info">
            Large
          </Badge>
        </div>
      </section>

      {/* Rounded (Pill) */}
      <section style={{ marginBottom: '48px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#0A1628', marginBottom: '16px' }}>
          3. Rounded (Pill Shape)
        </h2>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <Badge variant="default" rounded>
            Default
          </Badge>
          <Badge variant="success" rounded>
            Success
          </Badge>
          <Badge variant="warning" rounded>
            Warning
          </Badge>
          <Badge variant="error" rounded>
            Error
          </Badge>
          <Badge variant="info" rounded>
            Info
          </Badge>
          <Badge variant="neutral" rounded>
            Neutral
          </Badge>
        </div>
      </section>

      {/* With Dot Indicator */}
      <section style={{ marginBottom: '48px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#0A1628', marginBottom: '16px' }}>
          4. Avec Dot Indicator
        </h2>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <Badge variant="success" dot>
            En ligne
          </Badge>
          <Badge variant="warning" dot>
            Absent
          </Badge>
          <Badge variant="error" dot>
            Hors ligne
          </Badge>
          <Badge variant="info" dot>
            Occupé
          </Badge>
          <Badge variant="neutral" dot>
            Inactif
          </Badge>
        </div>
      </section>

      {/* Status Examples */}
      <section style={{ marginBottom: '48px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#0A1628', marginBottom: '16px' }}>
          5. Statuts Intervention
        </h2>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <Badge variant="neutral" dot>
            BROUILLON
          </Badge>
          <Badge variant="warning" dot>
            EN_ATTENTE
          </Badge>
          <Badge variant="info" dot>
            EN_COURS
          </Badge>
          <Badge variant="success" dot>
            TERMINE
          </Badge>
          <Badge variant="error" dot>
            ANNULE
          </Badge>
        </div>
      </section>

      {/* Counters */}
      <section style={{ marginBottom: '48px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#0A1628', marginBottom: '16px' }}>
          6. Compteurs (Rounded)
        </h2>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
          <Badge variant="error" rounded size="sm">
            3
          </Badge>
          <Badge variant="info" rounded size="sm">
            12
          </Badge>
          <Badge variant="success" rounded size="sm">
            99+
          </Badge>
          <Badge variant="warning" rounded>
            24
          </Badge>
          <Badge variant="neutral" rounded size="lg">
            156
          </Badge>
        </div>
      </section>

      {/* Removable Tags */}
      <section style={{ marginBottom: '48px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#0A1628', marginBottom: '16px' }}>
          7. Tags Supprimables
        </h2>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '12px' }}>
          {tags.map((tag) => (
            <Badge key={tag} variant="neutral" rounded removable onRemove={() => handleRemoveTag(tag)}>
              {tag}
            </Badge>
          ))}
        </div>
        <p style={{ fontSize: '13px', color: '#6B7280' }}>
          Tags supprimés: <strong>{removedCount}</strong>
          {tags.length === 0 && (
            <button
              type="button"
              onClick={() => {
                setTags(['React', 'TypeScript', 'Next.js', 'Tailwind'])
                setRemovedCount(0)
              }}
              style={{
                marginLeft: '12px',
                padding: '4px 8px',
                fontSize: '12px',
                color: '#0A1628',
                backgroundColor: '#F3F4F6',
                border: '1px solid #E5E7EB',
                borderRadius: '4px',
                cursor: 'pointer',
              }}
            >
              Réinitialiser
            </button>
          )}
        </p>
      </section>

      {/* Removable with Colors */}
      <section style={{ marginBottom: '48px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#0A1628', marginBottom: '16px' }}>
          8. Supprimables avec Couleurs
        </h2>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <Badge variant="success" removable onRemove={() => alert('Success removed')}>
            Success
          </Badge>
          <Badge variant="warning" removable onRemove={() => alert('Warning removed')}>
            Warning
          </Badge>
          <Badge variant="error" removable onRemove={() => alert('Error removed')}>
            Error
          </Badge>
          <Badge variant="info" removable onRemove={() => alert('Info removed')}>
            Info
          </Badge>
        </div>
      </section>

      {/* Payment Status */}
      <section style={{ marginBottom: '48px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#0A1628', marginBottom: '16px' }}>
          9. Statuts Paiement
        </h2>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <Badge variant="success" dot>
            Payé
          </Badge>
          <Badge variant="warning" dot>
            En attente
          </Badge>
          <Badge variant="error" dot>
            Impayé
          </Badge>
          <Badge variant="info" dot>
            Remboursé
          </Badge>
        </div>
      </section>

      {/* User Roles */}
      <section style={{ marginBottom: '48px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#0A1628', marginBottom: '16px' }}>
          10. Rôles Utilisateurs
        </h2>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <Badge variant="error">Admin</Badge>
          <Badge variant="info">Pro</Badge>
          <Badge variant="success">Owner</Badge>
          <Badge variant="warning">Manager</Badge>
          <Badge variant="neutral">Lecture seule</Badge>
        </div>
      </section>

      {/* Feature Tags */}
      <section style={{ marginBottom: '48px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#0A1628', marginBottom: '16px' }}>
          11. Feature Tags
        </h2>
        <div
          style={{
            padding: '20px',
            backgroundColor: '#F9FAFB',
            borderRadius: '8px',
            border: '1px solid #E5E7EB',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
            <span style={{ fontSize: '18px', fontWeight: 600, color: '#0A1628' }}>Plan Pro</span>
            <Badge variant="success" rounded>
              Actif
            </Badge>
            <Badge variant="info" size="sm">
              Populaire
            </Badge>
          </div>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            <Badge variant="success" size="sm">
              Nouveau
            </Badge>
            <Badge variant="info" size="sm">
              IA
            </Badge>
            <Badge variant="warning" size="sm">
              Beta
            </Badge>
            <Badge variant="neutral" size="sm">
              Premium
            </Badge>
          </div>
        </div>
      </section>

      {/* Intervention Types */}
      <section style={{ marginBottom: '48px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#0A1628', marginBottom: '16px' }}>
          12. Types d&apos;Intervention
        </h2>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <Badge variant="info">Révision</Badge>
          <Badge variant="warning">Réparation</Badge>
          <Badge variant="success">Diagnostic</Badge>
          <Badge variant="default">Entretien</Badge>
          <Badge variant="error">Urgence</Badge>
        </div>
      </section>

      {/* All Sizes with All Variants */}
      <section style={{ marginBottom: '48px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#0A1628', marginBottom: '16px' }}>
          13. Matrice Tailles × Variants
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <p style={{ fontSize: '13px', color: '#6B7280', marginBottom: '8px' }}>Small (sm)</p>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <Badge size="sm" variant="default">
                Default
              </Badge>
              <Badge size="sm" variant="success">
                Success
              </Badge>
              <Badge size="sm" variant="warning">
                Warning
              </Badge>
              <Badge size="sm" variant="error">
                Error
              </Badge>
              <Badge size="sm" variant="info">
                Info
              </Badge>
              <Badge size="sm" variant="neutral">
                Neutral
              </Badge>
            </div>
          </div>
          <div>
            <p style={{ fontSize: '13px', color: '#6B7280', marginBottom: '8px' }}>Medium (md)</p>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <Badge size="md" variant="default">
                Default
              </Badge>
              <Badge size="md" variant="success">
                Success
              </Badge>
              <Badge size="md" variant="warning">
                Warning
              </Badge>
              <Badge size="md" variant="error">
                Error
              </Badge>
              <Badge size="md" variant="info">
                Info
              </Badge>
              <Badge size="md" variant="neutral">
                Neutral
              </Badge>
            </div>
          </div>
          <div>
            <p style={{ fontSize: '13px', color: '#6B7280', marginBottom: '8px' }}>Large (lg)</p>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <Badge size="lg" variant="default">
                Default
              </Badge>
              <Badge size="lg" variant="success">
                Success
              </Badge>
              <Badge size="lg" variant="warning">
                Warning
              </Badge>
              <Badge size="lg" variant="error">
                Error
              </Badge>
              <Badge size="lg" variant="info">
                Info
              </Badge>
              <Badge size="lg" variant="neutral">
                Neutral
              </Badge>
            </div>
          </div>
        </div>
      </section>

      {/* Dot + Rounded Combination */}
      <section style={{ marginBottom: '48px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#0A1628', marginBottom: '16px' }}>
          14. Dot + Rounded
        </h2>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <Badge variant="success" dot rounded>
            En ligne
          </Badge>
          <Badge variant="warning" dot rounded>
            Absent
          </Badge>
          <Badge variant="error" dot rounded>
            Hors ligne
          </Badge>
          <Badge variant="info" dot rounded>
            Occupé
          </Badge>
        </div>
      </section>

      {/* Complex Combinations */}
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
            <strong>6 variants</strong>: default, success, warning, error, info, neutral
          </li>
          <li style={{ marginBottom: '4px' }}>
            <strong>3 tailles</strong>: sm (20px), md (24px), lg (28px)
          </li>
          <li style={{ marginBottom: '4px' }}>
            <strong>rounded</strong>: forme pill arrondie
          </li>
          <li style={{ marginBottom: '4px' }}>
            <strong>dot</strong>: indicateur coloré à gauche
          </li>
          <li>
            <strong>removable</strong>: bouton X avec hover effect
          </li>
        </ul>
      </section>
    </div>
  )
}
