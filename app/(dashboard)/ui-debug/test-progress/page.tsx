'use client'

import { useState, useEffect } from 'react'
import { ProgressBar } from '@/components/shared/progress-bar'
import { Button } from '@/components/shared/button'

// ─────────────────────────────────────────────────────────────
// Test Page
// ─────────────────────────────────────────────────────────────

export default function TestProgressPage() {
  const [uploadProgress, setUploadProgress] = useState(0)
  const [isUploading, setIsUploading] = useState(false)

  const startUpload = () => {
    setIsUploading(true)
    setUploadProgress(0)
  }

  useEffect(() => {
    if (!isUploading) return

    const interval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval)
          setIsUploading(false)
          return 100
        }
        return prev + Math.random() * 15
      })
    }, 300)

    return () => clearInterval(interval)
  }, [isUploading])

  return (
    <div style={{ padding: '40px', maxWidth: '900px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '28px', fontWeight: 700, color: '#0A1628', marginBottom: '8px' }}>
        ProgressBar Component Test
      </h1>
      <p style={{ color: '#6B7280', marginBottom: '40px' }}>
        Test des barres de progression avec animations, variants, et modes spéciaux.
      </p>

      {/* Simple */}
      <section style={{ marginBottom: '48px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#0A1628', marginBottom: '16px' }}>
          1. Simple (45%)
        </h2>
        <ProgressBar value={45} />
      </section>

      {/* With Label and Percentage */}
      <section style={{ marginBottom: '48px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#0A1628', marginBottom: '16px' }}>
          2. Avec Label et Pourcentage
        </h2>
        <ProgressBar value={67} showLabel label="Téléchargement" showPercentage />
      </section>

      {/* All Variants */}
      <section style={{ marginBottom: '48px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#0A1628', marginBottom: '16px' }}>
          3. Tous les Variants
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <p style={{ fontSize: '13px', color: '#6B7280', marginBottom: '4px' }}>Default</p>
            <ProgressBar value={80} variant="default" showPercentage />
          </div>
          <div>
            <p style={{ fontSize: '13px', color: '#6B7280', marginBottom: '4px' }}>Success</p>
            <ProgressBar value={100} variant="success" showPercentage />
          </div>
          <div>
            <p style={{ fontSize: '13px', color: '#6B7280', marginBottom: '4px' }}>Warning</p>
            <ProgressBar value={75} variant="warning" showPercentage />
          </div>
          <div>
            <p style={{ fontSize: '13px', color: '#6B7280', marginBottom: '4px' }}>Error</p>
            <ProgressBar value={30} variant="error" showPercentage />
          </div>
          <div>
            <p style={{ fontSize: '13px', color: '#6B7280', marginBottom: '4px' }}>Info</p>
            <ProgressBar value={60} variant="info" showPercentage />
          </div>
        </div>
      </section>

      {/* Sizes */}
      <section style={{ marginBottom: '48px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#0A1628', marginBottom: '16px' }}>
          4. Tailles (sm, md, lg)
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <p style={{ fontSize: '13px', color: '#6B7280', marginBottom: '4px' }}>Small (6px)</p>
            <ProgressBar value={50} size="sm" />
          </div>
          <div>
            <p style={{ fontSize: '13px', color: '#6B7280', marginBottom: '4px' }}>Medium (8px)</p>
            <ProgressBar value={50} size="md" />
          </div>
          <div>
            <p style={{ fontSize: '13px', color: '#6B7280', marginBottom: '4px' }}>Large (12px)</p>
            <ProgressBar value={50} size="lg" />
          </div>
        </div>
      </section>

      {/* Striped */}
      <section style={{ marginBottom: '48px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#0A1628', marginBottom: '16px' }}>
          5. Striped (rayures animées)
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <ProgressBar
            value={75}
            variant="success"
            striped
            showLabel
            label="Installation en cours"
            showPercentage
            size="lg"
          />
          <ProgressBar value={60} variant="info" striped showPercentage />
          <ProgressBar value={45} variant="warning" striped showPercentage />
        </div>
      </section>

      {/* Indeterminate */}
      <section style={{ marginBottom: '48px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#0A1628', marginBottom: '16px' }}>
          6. Indeterminate (chargement infini)
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <ProgressBar
            value={0}
            variant="info"
            indeterminate
            showLabel
            label="Chargement des données..."
          />
          <ProgressBar value={0} variant="default" indeterminate size="sm" />
          <ProgressBar value={0} variant="success" indeterminate size="lg" />
        </div>
      </section>

      {/* Interactive Upload Simulation */}
      <section style={{ marginBottom: '48px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#0A1628', marginBottom: '16px' }}>
          7. Simulation Upload Interactif
        </h2>
        <div
          style={{
            padding: '20px',
            backgroundColor: '#FFFFFF',
            borderRadius: '8px',
            border: '1px solid #E5E7EB',
          }}
        >
          <ProgressBar
            value={uploadProgress}
            variant={uploadProgress >= 100 ? 'success' : 'info'}
            showLabel
            label="Upload fichier.pdf"
            showPercentage
            striped={isUploading}
            size="lg"
          />
          {uploadProgress >= 100 && (
            <p style={{ marginTop: '8px', color: '#16A34A', fontSize: '14px', fontWeight: 500 }}>
              ✓ Upload terminé !
            </p>
          )}
          <div style={{ marginTop: '16px' }}>
            <Button onClick={startUpload} disabled={isUploading} size="sm">
              {isUploading ? 'Upload en cours...' : 'Lancer upload'}
            </Button>
          </div>
        </div>
      </section>

      {/* Custom Max */}
      <section style={{ marginBottom: '48px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#0A1628', marginBottom: '16px' }}>
          8. Max Personnalisé
        </h2>
        <div
          style={{
            padding: '20px',
            backgroundColor: '#F9FAFB',
            borderRadius: '8px',
            border: '1px solid #E5E7EB',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '14px', fontWeight: 500 }}>Stockage utilisé</span>
            <span style={{ fontSize: '14px', fontWeight: 600, color: '#6B7280' }}>750 Mo / 1 Go</span>
          </div>
          <ProgressBar value={750} max={1000} variant="warning" />
        </div>
      </section>

      {/* API Quota */}
      <section style={{ marginBottom: '48px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#0A1628', marginBottom: '16px' }}>
          9. Quota API (SIV)
        </h2>
        <div
          style={{
            padding: '20px',
            backgroundColor: '#F9FAFB',
            borderRadius: '8px',
            border: '1px solid #E5E7EB',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '14px', fontWeight: 500 }}>Recherches SIV ce mois</span>
            <span style={{ fontSize: '14px', fontWeight: 600, color: '#6B7280' }}>45 / 100</span>
          </div>
          <ProgressBar value={45} max={100} variant="info" />
        </div>
      </section>

      {/* Multi-step Form */}
      <section style={{ marginBottom: '48px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#0A1628', marginBottom: '16px' }}>
          10. Étapes de Formulaire
        </h2>
        <div
          style={{
            padding: '20px',
            backgroundColor: '#FFFFFF',
            borderRadius: '8px',
            border: '1px solid #E5E7EB',
          }}
        >
          <ProgressBar
            value={60}
            showLabel
            label="Étape 3 sur 5"
            showPercentage
            variant="info"
          />
        </div>
      </section>

      {/* Profil Completion */}
      <section style={{ marginBottom: '48px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#0A1628', marginBottom: '16px' }}>
          11. Complétion Profil
        </h2>
        <div
          style={{
            padding: '20px',
            backgroundColor: '#FFFFFF',
            borderRadius: '8px',
            border: '1px solid #E5E7EB',
          }}
        >
          <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '12px' }}>
            Complétez votre profil
          </h3>
          <ProgressBar value={60} variant="info" showPercentage size="lg" />
          <ul
            style={{
              marginTop: '16px',
              fontSize: '14px',
              color: '#6B7280',
              paddingLeft: '20px',
            }}
          >
            <li style={{ color: '#16A34A' }}>✓ Informations de base</li>
            <li style={{ color: '#16A34A' }}>✓ Logo du garage</li>
            <li>✗ Coordonnées bancaires</li>
            <li>✗ Abonnement</li>
          </ul>
        </div>
      </section>

      {/* Different Progress Values */}
      <section style={{ marginBottom: '48px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#0A1628', marginBottom: '16px' }}>
          12. Différentes Valeurs
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <ProgressBar value={0} showPercentage />
          <ProgressBar value={25} showPercentage />
          <ProgressBar value={50} showPercentage />
          <ProgressBar value={75} showPercentage />
          <ProgressBar value={100} variant="success" showPercentage />
        </div>
      </section>

      {/* Battery Level Example */}
      <section style={{ marginBottom: '48px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#0A1628', marginBottom: '16px' }}>
          13. Niveau Batterie
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <ProgressBar value={100} variant="success" showLabel label="Batterie pleine" showPercentage size="lg" />
          <ProgressBar value={50} variant="warning" showLabel label="Batterie moyenne" showPercentage size="lg" />
          <ProgressBar value={15} variant="error" showLabel label="Batterie faible" showPercentage size="lg" />
        </div>
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
            <strong>5 variants</strong>: default, success, warning, error, info
          </li>
          <li style={{ marginBottom: '4px' }}>
            <strong>3 tailles</strong>: sm (6px), md (8px), lg (12px)
          </li>
          <li style={{ marginBottom: '4px' }}>
            <strong>showLabel / showPercentage</strong>: affiche l&apos;en-tête
          </li>
          <li style={{ marginBottom: '4px' }}>
            <strong>striped</strong>: motif rayé animé
          </li>
          <li style={{ marginBottom: '4px' }}>
            <strong>indeterminate</strong>: chargement infini
          </li>
          <li>
            <strong>max</strong>: valeur maximum personnalisée
          </li>
        </ul>
      </section>
    </div>
  )
}
