'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Textarea } from '@/components/shared/textarea'

// ============================================================================
// TEST PAGE FOR TEXTAREA COMPONENT
// ============================================================================

interface FormData {
  description: string
  notes: string
  feedback: string
}

export default function TestTextareaPage() {
  const [controlledValue, setControlledValue] = useState('')

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>()

  const onSubmit = (data: FormData) => {
    alert(`Form submitted:\n${JSON.stringify(data, null, 2)}`)
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        padding: '32px',
        backgroundColor: '#F9FAFB',
        fontFamily: 'system-ui, sans-serif',
      }}
    >
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        {/* Header */}
        <h1
          style={{
            fontSize: '24px',
            fontWeight: 700,
            color: '#111827',
            marginBottom: '8px',
          }}
        >
          Test Textarea Component
        </h1>
        <p
          style={{
            fontSize: '14px',
            color: '#6B7280',
            marginBottom: '32px',
          }}
        >
          Composant Textarea standalone avec styles inline, auto-resize
          optionnel et compatibilité react-hook-form.
        </p>

        {/* ============================================ */}
        {/* SECTION: Basic Variants */}
        {/* ============================================ */}
        <section
          style={{
            padding: '24px',
            backgroundColor: '#FFFFFF',
            borderRadius: '12px',
            border: '1px solid #E5E7EB',
            marginBottom: '24px',
          }}
        >
          <h2
            style={{
              fontSize: '16px',
              fontWeight: 600,
              color: '#111827',
              marginBottom: '20px',
            }}
          >
            Variantes de base
          </h2>

          <div style={{ display: 'grid', gap: '16px' }}>
            <Textarea
              label="Default"
              placeholder="Écrivez quelque chose..."
              helperText="Texte d'aide optionnel"
            />

            <Textarea
              label="Success"
              variant="success"
              placeholder="Champ validé"
              defaultValue="Contenu valide"
              helperText="Ce champ est valide"
            />

            <Textarea
              label="Error"
              variant="error"
              placeholder="Champ avec erreur"
              errorText="Ce champ contient une erreur"
            />

            <Textarea
              label="Disabled"
              placeholder="Non modifiable"
              defaultValue="Contenu en lecture seule"
              disabled
            />
          </div>
        </section>

        {/* ============================================ */}
        {/* SECTION: Sizes */}
        {/* ============================================ */}
        <section
          style={{
            padding: '24px',
            backgroundColor: '#FFFFFF',
            borderRadius: '12px',
            border: '1px solid #E5E7EB',
            marginBottom: '24px',
          }}
        >
          <h2
            style={{
              fontSize: '16px',
              fontWeight: 600,
              color: '#111827',
              marginBottom: '20px',
            }}
          >
            Tailles
          </h2>

          <div style={{ display: 'grid', gap: '16px' }}>
            <Textarea
              label="Small (sm)"
              size="sm"
              placeholder="Petit textarea..."
            />

            <Textarea
              label="Medium (md) - Default"
              size="md"
              placeholder="Textarea moyen..."
            />

            <Textarea
              label="Large (lg)"
              size="lg"
              placeholder="Grand textarea..."
            />
          </div>
        </section>

        {/* ============================================ */}
        {/* SECTION: Auto-resize */}
        {/* ============================================ */}
        <section
          style={{
            padding: '24px',
            backgroundColor: '#FFFFFF',
            borderRadius: '12px',
            border: '1px solid #E5E7EB',
            marginBottom: '24px',
          }}
        >
          <h2
            style={{
              fontSize: '16px',
              fontWeight: 600,
              color: '#111827',
              marginBottom: '20px',
            }}
          >
            Auto-resize
          </h2>

          <div style={{ display: 'grid', gap: '16px' }}>
            <Textarea
              label="Auto-resize (minRows=2, maxRows=10)"
              placeholder="Tapez du texte pour voir le redimensionnement automatique..."
              autoResize
              minRows={2}
              maxRows={10}
              helperText="La hauteur s'adapte au contenu automatiquement"
            />

            <Textarea
              label="Auto-resize sans limite (minRows=3)"
              placeholder="Pas de limite de hauteur..."
              autoResize
              minRows={3}
              helperText="Grandit sans limite maximale"
            />

            <Textarea
              label="Resize manuel (par défaut)"
              placeholder="Glissez le coin inférieur droit pour redimensionner..."
              helperText="Redimensionnement vertical manuel"
            />
          </div>
        </section>

        {/* ============================================ */}
        {/* SECTION: Character Count */}
        {/* ============================================ */}
        <section
          style={{
            padding: '24px',
            backgroundColor: '#FFFFFF',
            borderRadius: '12px',
            border: '1px solid #E5E7EB',
            marginBottom: '24px',
          }}
        >
          <h2
            style={{
              fontSize: '16px',
              fontWeight: 600,
              color: '#111827',
              marginBottom: '20px',
            }}
          >
            Compteur de caractères
          </h2>

          <div style={{ display: 'grid', gap: '16px' }}>
            <Textarea
              label="Avec compteur (max 100)"
              placeholder="Maximum 100 caractères..."
              maxLength={100}
              showCharCount
              value={controlledValue}
              onChange={(e) => setControlledValue(e.target.value)}
              helperText="Le compteur devient rouge si dépassement"
            />

            <Textarea
              label="Compteur + Error"
              placeholder="Champ avec erreur et compteur..."
              maxLength={200}
              showCharCount
              errorText="Ce champ contient une erreur"
            />

            <Textarea
              label="Compteur + Auto-resize"
              placeholder="Combinaison compteur et auto-resize..."
              maxLength={500}
              showCharCount
              autoResize
              minRows={2}
              maxRows={8}
            />
          </div>
        </section>

        {/* ============================================ */}
        {/* SECTION: React Hook Form */}
        {/* ============================================ */}
        <section
          style={{
            padding: '24px',
            backgroundColor: '#FFFFFF',
            borderRadius: '12px',
            border: '1px solid #E5E7EB',
            marginBottom: '24px',
          }}
        >
          <h2
            style={{
              fontSize: '16px',
              fontWeight: 600,
              color: '#111827',
              marginBottom: '20px',
            }}
          >
            Intégration react-hook-form
          </h2>

          <form onSubmit={handleSubmit(onSubmit)}>
            <Textarea
              label="Description de l'intervention"
              placeholder="Décrivez les travaux effectués..."
              autoResize
              minRows={3}
              maxRows={10}
              {...register('description', {
                required: 'La description est requise',
                minLength: {
                  value: 20,
                  message: 'Minimum 20 caractères',
                },
              })}
              errorText={errors.description?.message}
              required
            />

            <Textarea
              label="Notes internes"
              placeholder="Notes pour l'équipe..."
              helperText="Ces notes ne seront pas visibles par le client"
              {...register('notes')}
              autoResize
              minRows={2}
              maxRows={6}
            />

            <Textarea
              label="Feedback client"
              placeholder="Commentaires du client..."
              maxLength={300}
              showCharCount
              {...register('feedback', {
                maxLength: {
                  value: 300,
                  message: 'Maximum 300 caractères',
                },
              })}
              errorText={errors.feedback?.message}
            />

            <button
              type="submit"
              style={{
                padding: '12px 24px',
                backgroundColor: '#0A1628',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: 500,
                cursor: 'pointer',
                marginTop: '8px',
              }}
            >
              Soumettre le formulaire
            </button>
          </form>
        </section>

        {/* ============================================ */}
        {/* SECTION: Full Width */}
        {/* ============================================ */}
        <section
          style={{
            padding: '24px',
            backgroundColor: '#FFFFFF',
            borderRadius: '12px',
            border: '1px solid #E5E7EB',
            marginBottom: '24px',
          }}
        >
          <h2
            style={{
              fontSize: '16px',
              fontWeight: 600,
              color: '#111827',
              marginBottom: '20px',
            }}
          >
            Full Width
          </h2>

          <Textarea
            label="Textarea pleine largeur"
            placeholder="Prend toute la largeur disponible..."
            fullWidth
            autoResize
            minRows={3}
          />
        </section>

        {/* ============================================ */}
        {/* SECTION: Edge Cases */}
        {/* ============================================ */}
        <section
          style={{
            padding: '24px',
            backgroundColor: '#FFFFFF',
            borderRadius: '12px',
            border: '1px solid #E5E7EB',
            marginBottom: '24px',
          }}
        >
          <h2
            style={{
              fontSize: '16px',
              fontWeight: 600,
              color: '#111827',
              marginBottom: '20px',
            }}
          >
            Cas limites
          </h2>

          <div style={{ display: 'grid', gap: '16px' }}>
            <Textarea
              placeholder="Sans label, juste placeholder"
            />

            <Textarea
              label="Champ requis"
              placeholder="Astérisque visible après le label"
              required
            />

            <Textarea
              label="Pré-rempli avec beaucoup de contenu"
              defaultValue={`Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.

Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.`}
              autoResize
              minRows={2}
              maxRows={8}
            />
          </div>
        </section>

        {/* ============================================ */}
        {/* Controlled Value Display */}
        {/* ============================================ */}
        <section
          style={{
            padding: '16px 20px',
            backgroundColor: '#F3F4F6',
            borderRadius: '8px',
            border: '1px solid #E5E7EB',
          }}
        >
          <p
            style={{
              fontSize: '13px',
              color: '#6B7280',
              fontFamily: 'monospace',
            }}
          >
            Valeur contrôlée: "{controlledValue}" ({controlledValue.length}{' '}
            caractères)
          </p>
        </section>
      </div>
    </div>
  )
}
