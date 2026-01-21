'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Checkbox } from '@/components/shared/checkbox'

// ============================================================================
// TEST PAGE FOR CHECKBOX COMPONENT
// ============================================================================

interface FormData {
  terms: boolean
  newsletter: boolean
  notifications: boolean
}

export default function TestCheckboxPage() {
  const [controlled, setControlled] = useState(false)

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
          Test Checkbox Component
        </h1>
        <p
          style={{
            fontSize: '14px',
            color: '#6B7280',
            marginBottom: '32px',
          }}
        >
          Composant Checkbox standalone avec styles inline, animation checkmark
          et compatibilité react-hook-form.
        </p>

        {/* ============================================ */}
        {/* SECTION: Basic */}
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
            Basique
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <Checkbox label="Option simple" />

            <Checkbox
              label="Avec description"
              description="Texte explicatif supplémentaire pour cette option"
            />

            <Checkbox
              label="Coché par défaut"
              defaultChecked
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

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <Checkbox label="Small (16px)" size="sm" defaultChecked />

            <Checkbox label="Medium (20px) - Default" size="md" defaultChecked />

            <Checkbox label="Large (24px)" size="lg" defaultChecked />
          </div>
        </section>

        {/* ============================================ */}
        {/* SECTION: States */}
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
            États
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <Checkbox
              label="Normal"
              description="Hover pour voir le changement de couleur de bordure"
            />

            <Checkbox
              label="Disabled non coché"
              description="Cette option n'est pas disponible"
              disabled
            />

            <Checkbox
              label="Disabled coché"
              description="Cette option est activée et verrouillée"
              disabled
              defaultChecked
            />

            <Checkbox
              label="Error"
              error="Ce champ est requis"
            />

            <Checkbox
              label="Error avec description"
              description="Cette option est obligatoire"
              error="Vous devez cocher cette case pour continuer"
            />
          </div>
        </section>

        {/* ============================================ */}
        {/* SECTION: Label Position */}
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
            Position du label
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <Checkbox
              label="Label à droite (default)"
              labelPosition="right"
            />

            <Checkbox
              label="Label à gauche"
              labelPosition="left"
            />

            <Checkbox
              label="Label à gauche avec description"
              description="La description suit le label"
              labelPosition="left"
            />

            <Checkbox
              label="Label à gauche avec erreur"
              labelPosition="left"
              error="Erreur affichée à gauche"
            />
          </div>
        </section>

        {/* ============================================ */}
        {/* SECTION: Controlled */}
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
            Contrôlé
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <Checkbox
              label="Checkbox contrôlée"
              description="État géré par useState"
              checked={controlled}
              onChange={(e) => setControlled(e.target.checked)}
            />

            <div
              style={{
                padding: '12px 16px',
                backgroundColor: '#F3F4F6',
                borderRadius: '8px',
                fontSize: '14px',
                color: '#6B7280',
              }}
            >
              État actuel:{' '}
              <span
                style={{
                  fontWeight: 600,
                  color: controlled ? '#16A34A' : '#DC2626',
                }}
              >
                {controlled ? 'Coché' : 'Non coché'}
              </span>
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                type="button"
                onClick={() => setControlled(true)}
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
                Cocher
              </button>
              <button
                type="button"
                onClick={() => setControlled(false)}
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
                Décocher
              </button>
              <button
                type="button"
                onClick={() => setControlled(!controlled)}
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
                Toggle
              </button>
            </div>
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
            <div
              style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}
            >
              <Checkbox
                label="J'accepte les conditions générales"
                description="En cochant cette case, vous acceptez nos CGU et notre politique de confidentialité"
                {...register('terms', {
                  required: 'Vous devez accepter les conditions générales',
                })}
                error={errors.terms?.message}
                required
              />

              <Checkbox
                label="Recevoir la newsletter"
                description="Actualités, offres et conseils par email"
                {...register('newsletter')}
              />

              <Checkbox
                label="Activer les notifications push"
                description="Alertes en temps réel dans l'application"
                {...register('notifications')}
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
                  alignSelf: 'flex-start',
                }}
              >
                Soumettre le formulaire
              </button>
            </div>
          </form>
        </section>

        {/* ============================================ */}
        {/* SECTION: Notification Settings Example */}
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
            Exemple: Paramètres de notification
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <Checkbox
              label="Email"
              description="Notifications par email (confirmations, rappels)"
              defaultChecked
            />
            <Checkbox
              label="SMS"
              description="Notifications par SMS pour les alertes urgentes"
            />
            <Checkbox
              label="Push"
              description="Notifications push dans l'application mobile"
              defaultChecked
            />
            <Checkbox
              label="Téléphone"
              description="Appels pour les confirmations importantes"
              disabled
            />
          </div>
        </section>

        {/* ============================================ */}
        {/* SECTION: Required indicator */}
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
            Indicateur requis
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <Checkbox
              label="Champ requis"
              description="L'astérisque indique que ce champ est obligatoire"
              required
            />

            <Checkbox
              label="Champ optionnel"
              description="Pas d'astérisque car ce champ n'est pas required"
            />
          </div>
        </section>

        {/* ============================================ */}
        {/* Keyboard navigation hint */}
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
            }}
          >
            💡 <strong>Astuce :</strong> Utilisez{' '}
            <kbd
              style={{
                padding: '2px 6px',
                backgroundColor: '#FFFFFF',
                border: '1px solid #E5E7EB',
                borderRadius: '4px',
                fontFamily: 'monospace',
                fontSize: '12px',
              }}
            >
              Tab
            </kbd>{' '}
            pour naviguer et{' '}
            <kbd
              style={{
                padding: '2px 6px',
                backgroundColor: '#FFFFFF',
                border: '1px solid #E5E7EB',
                borderRadius: '4px',
                fontFamily: 'monospace',
                fontSize: '12px',
              }}
            >
              Espace
            </kbd>{' '}
            pour cocher/décocher les checkboxes.
          </p>
        </section>
      </div>
    </div>
  )
}
