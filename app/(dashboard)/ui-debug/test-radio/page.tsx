'use client'

import { useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { Radio } from '@/components/shared/radio'
import { RadioGroup } from '@/components/shared/radio-group'

// ============================================================================
// TEST PAGE FOR RADIO & RADIOGROUP COMPONENTS
// ============================================================================

interface FormData {
  plan: string
  paymentMethod: string
}

export default function TestRadioPage() {
  const [selectedPlan, setSelectedPlan] = useState('starter')
  const [selectedSize, setSelectedSize] = useState('')

  const {
    control,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<FormData>()

  const watchedPlan = watch('plan')

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
          Test Radio & RadioGroup Components
        </h1>
        <p
          style={{
            fontSize: '14px',
            color: '#6B7280',
            marginBottom: '32px',
          }}
        >
          Composants Radio standalone avec styles inline, animation dot et
          compatibilité react-hook-form.
        </p>

        {/* ============================================ */}
        {/* SECTION: Individual Radio */}
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
            Radio individuel
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <Radio
              name="individual"
              value="option1"
              label="Option 1"
              checked={selectedSize === 'option1'}
              onChange={() => setSelectedSize('option1')}
            />
            <Radio
              name="individual"
              value="option2"
              label="Option 2"
              description="Avec une description"
              checked={selectedSize === 'option2'}
              onChange={() => setSelectedSize('option2')}
            />
            <Radio
              name="individual"
              value="option3"
              label="Option 3"
              checked={selectedSize === 'option3'}
              onChange={() => setSelectedSize('option3')}
              disabled
            />
          </div>

          <div
            style={{
              marginTop: '16px',
              padding: '12px 16px',
              backgroundColor: '#F3F4F6',
              borderRadius: '8px',
              fontSize: '14px',
              color: '#6B7280',
            }}
          >
            Sélectionné: <strong>{selectedSize || 'Aucun'}</strong>
          </div>
        </section>

        {/* ============================================ */}
        {/* SECTION: RadioGroup Basic */}
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
            RadioGroup simple
          </h2>

          <RadioGroup
            name="basic"
            label="Choisissez une option"
            options={[
              { value: 'a', label: 'Option A' },
              { value: 'b', label: 'Option B' },
              { value: 'c', label: 'Option C' },
            ]}
            defaultValue="a"
          />
        </section>

        {/* ============================================ */}
        {/* SECTION: RadioGroup with Descriptions */}
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
            RadioGroup avec descriptions
          </h2>

          <RadioGroup
            name="plans"
            label="Choisissez votre plan"
            value={selectedPlan}
            onChange={setSelectedPlan}
            options={[
              {
                value: 'free',
                label: 'Gratuit',
                description: '0€ - Fonctionnalités de base',
              },
              {
                value: 'starter',
                label: 'Starter',
                description: '19€/mois - 50 interventions/mois',
              },
              {
                value: 'pro',
                label: 'Pro',
                description: '49€/mois - Interventions illimitées',
              },
              {
                value: 'enterprise',
                label: 'Enterprise',
                description: 'Sur mesure - Contactez-nous',
                disabled: true,
              },
            ]}
            required
          />

          <div
            style={{
              padding: '16px',
              backgroundColor: '#F0FDF4',
              borderRadius: '8px',
              border: '1px solid #BBF7D0',
            }}
          >
            <p style={{ fontSize: '14px', color: '#166534' }}>
              Plan sélectionné:{' '}
              <strong style={{ textTransform: 'capitalize' }}>
                {selectedPlan}
              </strong>
            </p>
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

          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <RadioGroup
              name="size-sm"
              label="Small (16px)"
              size="sm"
              defaultValue="1"
              options={[
                { value: '1', label: 'Option 1' },
                { value: '2', label: 'Option 2' },
              ]}
            />

            <RadioGroup
              name="size-md"
              label="Medium (20px) - Default"
              size="md"
              defaultValue="1"
              options={[
                { value: '1', label: 'Option 1' },
                { value: '2', label: 'Option 2' },
              ]}
            />

            <RadioGroup
              name="size-lg"
              label="Large (24px)"
              size="lg"
              defaultValue="1"
              options={[
                { value: '1', label: 'Option 1' },
                { value: '2', label: 'Option 2' },
              ]}
            />
          </div>
        </section>

        {/* ============================================ */}
        {/* SECTION: Horizontal Orientation */}
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
            Orientation horizontale
          </h2>

          <RadioGroup
            name="horizontal"
            label="Type d'intervention"
            orientation="horizontal"
            defaultValue="revision"
            options={[
              { value: 'revision', label: 'Révision' },
              { value: 'reparation', label: 'Réparation' },
              { value: 'diagnostic', label: 'Diagnostic' },
              { value: 'controle', label: 'Contrôle technique' },
            ]}
          />
        </section>

        {/* ============================================ */}
        {/* SECTION: Error State */}
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
            État erreur
          </h2>

          <RadioGroup
            name="error-example"
            label="Méthode de paiement"
            error="Veuillez sélectionner une méthode de paiement"
            options={[
              { value: 'card', label: 'Carte bancaire' },
              { value: 'sepa', label: 'Prélèvement SEPA' },
              { value: 'virement', label: 'Virement bancaire' },
            ]}
            required
          />

          <RadioGroup
            name="helper-example"
            label="Fréquence de rappel"
            helperText="Vous pouvez modifier cette préférence à tout moment"
            defaultValue="weekly"
            options={[
              { value: 'daily', label: 'Quotidien' },
              { value: 'weekly', label: 'Hebdomadaire' },
              { value: 'monthly', label: 'Mensuel' },
            ]}
          />
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
            <Controller
              name="plan"
              control={control}
              rules={{ required: 'Veuillez sélectionner un plan' }}
              render={({ field }) => (
                <RadioGroup
                  name={field.name}
                  label="Plan d'abonnement"
                  value={field.value}
                  onChange={field.onChange}
                  error={errors.plan?.message}
                  required
                  options={[
                    {
                      value: 'starter',
                      label: 'Starter',
                      description: '19€/mois - Pour démarrer',
                    },
                    {
                      value: 'pro',
                      label: 'Pro',
                      description: '49€/mois - Le plus populaire',
                    },
                    {
                      value: 'premium',
                      label: 'Premium',
                      description: '99€/mois - Tout inclus',
                    },
                  ]}
                />
              )}
            />

            {watchedPlan && (
              <div
                style={{
                  padding: '16px',
                  backgroundColor: '#F9FAFB',
                  borderRadius: '8px',
                  marginBottom: '20px',
                }}
              >
                <p style={{ fontSize: '14px', color: '#6B7280' }}>
                  Formulaire - Plan sélectionné:{' '}
                  <strong style={{ textTransform: 'capitalize' }}>
                    {watchedPlan}
                  </strong>
                </p>
              </div>
            )}

            <Controller
              name="paymentMethod"
              control={control}
              render={({ field }) => (
                <RadioGroup
                  name={field.name}
                  label="Méthode de paiement"
                  value={field.value}
                  onChange={field.onChange}
                  orientation="horizontal"
                  options={[
                    { value: 'card', label: 'Carte' },
                    { value: 'sepa', label: 'SEPA' },
                  ]}
                />
              )}
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

          <RadioGroup
            name="fullwidth"
            label="Durée du contrat"
            fullWidth
            defaultValue="12"
            options={[
              {
                value: '1',
                label: '1 mois',
                description: 'Sans engagement',
              },
              {
                value: '6',
                label: '6 mois',
                description: '-10% de réduction',
              },
              {
                value: '12',
                label: '12 mois',
                description: '-20% de réduction',
              },
            ]}
          />
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
            pour naviguer entre les groupes,{' '}
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
              ↑↓
            </kbd>{' '}
            pour changer de sélection et{' '}
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
            pour sélectionner.
          </p>
        </section>
      </div>
    </div>
  )
}
