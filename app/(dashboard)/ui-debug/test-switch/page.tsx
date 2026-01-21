'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Switch } from '@/components/shared/switch'

// ============================================================================
// TEST PAGE FOR SWITCH COMPONENT
// ============================================================================

interface FormData {
  emailNotifs: boolean
  smsNotifs: boolean
  pushNotifs: boolean
}

export default function TestSwitchPage() {
  const [controlled, setControlled] = useState(false)
  const [darkMode, setDarkMode] = useState(false)

  const { register, watch } = useForm<FormData>({
    defaultValues: {
      emailNotifs: true,
      smsNotifs: false,
      pushNotifs: true,
    },
  })

  const emailEnabled = watch('emailNotifs')
  const smsEnabled = watch('smsNotifs')
  const pushEnabled = watch('pushNotifs')

  return (
    <div
      style={{
        minHeight: '100vh',
        padding: '32px',
        backgroundColor: darkMode ? '#1a1a2e' : '#F9FAFB',
        fontFamily: 'system-ui, sans-serif',
        transition: 'background-color 0.3s ease',
      }}
    >
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        {/* Header */}
        <h1
          style={{
            fontSize: '24px',
            fontWeight: 700,
            color: darkMode ? '#FFFFFF' : '#111827',
            marginBottom: '8px',
          }}
        >
          Test Switch Component
        </h1>
        <p
          style={{
            fontSize: '14px',
            color: darkMode ? '#9CA3AF' : '#6B7280',
            marginBottom: '32px',
          }}
        >
          Composant Switch standalone avec styles inline, animation thumb et
          compatibilité react-hook-form.
        </p>

        {/* ============================================ */}
        {/* SECTION: Basic */}
        {/* ============================================ */}
        <section
          style={{
            padding: '24px',
            backgroundColor: darkMode ? '#262640' : '#FFFFFF',
            borderRadius: '12px',
            border: `1px solid ${darkMode ? '#3d3d5c' : '#E5E7EB'}`,
            marginBottom: '24px',
          }}
        >
          <h2
            style={{
              fontSize: '16px',
              fontWeight: 600,
              color: darkMode ? '#FFFFFF' : '#111827',
              marginBottom: '20px',
            }}
          >
            Basique
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <Switch label="Option simple" />

            <Switch
              label="Avec description"
              description="Texte explicatif pour cette option"
            />

            <Switch label="Activé par défaut" defaultChecked />
          </div>
        </section>

        {/* ============================================ */}
        {/* SECTION: Sizes */}
        {/* ============================================ */}
        <section
          style={{
            padding: '24px',
            backgroundColor: darkMode ? '#262640' : '#FFFFFF',
            borderRadius: '12px',
            border: `1px solid ${darkMode ? '#3d3d5c' : '#E5E7EB'}`,
            marginBottom: '24px',
          }}
        >
          <h2
            style={{
              fontSize: '16px',
              fontWeight: 600,
              color: darkMode ? '#FFFFFF' : '#111827',
              marginBottom: '20px',
            }}
          >
            Tailles
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <Switch label="Small (36x20)" size="sm" defaultChecked />

            <Switch label="Medium (44x24) - Default" size="md" defaultChecked />

            <Switch label="Large (52x28)" size="lg" defaultChecked />
          </div>
        </section>

        {/* ============================================ */}
        {/* SECTION: States */}
        {/* ============================================ */}
        <section
          style={{
            padding: '24px',
            backgroundColor: darkMode ? '#262640' : '#FFFFFF',
            borderRadius: '12px',
            border: `1px solid ${darkMode ? '#3d3d5c' : '#E5E7EB'}`,
            marginBottom: '24px',
          }}
        >
          <h2
            style={{
              fontSize: '16px',
              fontWeight: 600,
              color: darkMode ? '#FFFFFF' : '#111827',
              marginBottom: '20px',
            }}
          >
            États
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <Switch
              label="Normal"
              description="Hover sur le switch pour voir le changement de couleur"
            />

            <Switch
              label="Disabled OFF"
              description="Cette option n'est pas disponible"
              disabled
            />

            <Switch
              label="Disabled ON"
              description="Cette option est verrouillée"
              disabled
              defaultChecked
            />

            <Switch label="Error" error="Cette option est requise" />

            <Switch
              label="Error avec description"
              description="Une erreur s'est produite"
              error="Veuillez activer cette option"
            />
          </div>
        </section>

        {/* ============================================ */}
        {/* SECTION: Label Position */}
        {/* ============================================ */}
        <section
          style={{
            padding: '24px',
            backgroundColor: darkMode ? '#262640' : '#FFFFFF',
            borderRadius: '12px',
            border: `1px solid ${darkMode ? '#3d3d5c' : '#E5E7EB'}`,
            marginBottom: '24px',
          }}
        >
          <h2
            style={{
              fontSize: '16px',
              fontWeight: 600,
              color: darkMode ? '#FFFFFF' : '#111827',
              marginBottom: '20px',
            }}
          >
            Position du label
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <Switch label="Label à droite (default)" labelPosition="right" />

            <Switch label="Label à gauche" labelPosition="left" />

            <Switch
              label="Gauche avec description"
              description="Le switch est à droite"
              labelPosition="left"
            />
          </div>
        </section>

        {/* ============================================ */}
        {/* SECTION: On/Off Labels */}
        {/* ============================================ */}
        <section
          style={{
            padding: '24px',
            backgroundColor: darkMode ? '#262640' : '#FFFFFF',
            borderRadius: '12px',
            border: `1px solid ${darkMode ? '#3d3d5c' : '#E5E7EB'}`,
            marginBottom: '24px',
          }}
        >
          <h2
            style={{
              fontSize: '16px',
              fontWeight: 600,
              color: darkMode ? '#FFFFFF' : '#111827',
              marginBottom: '20px',
            }}
          >
            Labels dans le thumb
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <Switch
              label="Avec I/O"
              onLabel="I"
              offLabel="O"
              size="md"
              defaultChecked
            />

            <Switch
              label="Statut serveur"
              onLabel="ON"
              offLabel=""
              size="lg"
            />
          </div>
        </section>

        {/* ============================================ */}
        {/* SECTION: Controlled */}
        {/* ============================================ */}
        <section
          style={{
            padding: '24px',
            backgroundColor: darkMode ? '#262640' : '#FFFFFF',
            borderRadius: '12px',
            border: `1px solid ${darkMode ? '#3d3d5c' : '#E5E7EB'}`,
            marginBottom: '24px',
          }}
        >
          <h2
            style={{
              fontSize: '16px',
              fontWeight: 600,
              color: darkMode ? '#FFFFFF' : '#111827',
              marginBottom: '20px',
            }}
          >
            Contrôlé
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <Switch
              label="Switch contrôlé"
              description="État géré par useState"
              checked={controlled}
              onChange={(e) => setControlled(e.target.checked)}
            />

            <div
              style={{
                padding: '12px 16px',
                backgroundColor: darkMode ? '#1a1a2e' : '#F3F4F6',
                borderRadius: '8px',
                fontSize: '14px',
                color: darkMode ? '#9CA3AF' : '#6B7280',
              }}
            >
              État actuel:{' '}
              <span
                style={{
                  fontWeight: 600,
                  color: controlled ? '#16A34A' : '#DC2626',
                }}
              >
                {controlled ? 'Activé' : 'Désactivé'}
              </span>
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                type="button"
                onClick={() => setControlled(true)}
                style={{
                  padding: '8px 16px',
                  backgroundColor: darkMode ? '#3d3d5c' : '#FFFFFF',
                  color: darkMode ? '#FFFFFF' : '#111827',
                  border: `1px solid ${darkMode ? '#4d4d6d' : '#E5E7EB'}`,
                  borderRadius: '6px',
                  fontSize: '14px',
                  cursor: 'pointer',
                }}
              >
                Activer
              </button>
              <button
                type="button"
                onClick={() => setControlled(false)}
                style={{
                  padding: '8px 16px',
                  backgroundColor: darkMode ? '#3d3d5c' : '#FFFFFF',
                  color: darkMode ? '#FFFFFF' : '#111827',
                  border: `1px solid ${darkMode ? '#4d4d6d' : '#E5E7EB'}`,
                  borderRadius: '6px',
                  fontSize: '14px',
                  cursor: 'pointer',
                }}
              >
                Désactiver
              </button>
              <button
                type="button"
                onClick={() => setControlled(!controlled)}
                style={{
                  padding: '8px 16px',
                  backgroundColor: darkMode ? '#3d3d5c' : '#FFFFFF',
                  color: darkMode ? '#FFFFFF' : '#111827',
                  border: `1px solid ${darkMode ? '#4d4d6d' : '#E5E7EB'}`,
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
        {/* SECTION: Dark Mode Toggle */}
        {/* ============================================ */}
        <section
          style={{
            padding: '24px',
            backgroundColor: darkMode ? '#262640' : '#FFFFFF',
            borderRadius: '12px',
            border: `1px solid ${darkMode ? '#3d3d5c' : '#E5E7EB'}`,
            marginBottom: '24px',
          }}
        >
          <h2
            style={{
              fontSize: '16px',
              fontWeight: 600,
              color: darkMode ? '#FFFFFF' : '#111827',
              marginBottom: '20px',
            }}
          >
            Exemple: Mode sombre
          </h2>

          <Switch
            label="Mode sombre"
            description="Active le thème sombre sur cette page"
            checked={darkMode}
            onChange={(e) => setDarkMode(e.target.checked)}
            size="lg"
          />
        </section>

        {/* ============================================ */}
        {/* SECTION: React Hook Form */}
        {/* ============================================ */}
        <section
          style={{
            padding: '24px',
            backgroundColor: darkMode ? '#262640' : '#FFFFFF',
            borderRadius: '12px',
            border: `1px solid ${darkMode ? '#3d3d5c' : '#E5E7EB'}`,
            marginBottom: '24px',
          }}
        >
          <h2
            style={{
              fontSize: '16px',
              fontWeight: 600,
              color: darkMode ? '#FFFFFF' : '#111827',
              marginBottom: '20px',
            }}
          >
            Intégration react-hook-form
          </h2>

          <form>
            <div
              style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}
            >
              <Switch
                label="Notifications email"
                description="Recevoir les confirmations et rappels par email"
                {...register('emailNotifs')}
              />

              <Switch
                label="Notifications SMS"
                description="Recevoir les alertes urgentes par SMS"
                {...register('smsNotifs')}
              />

              <Switch
                label="Notifications push"
                description="Notifications dans l'application web"
                {...register('pushNotifs')}
              />
            </div>

            <div
              style={{
                marginTop: '20px',
                padding: '16px',
                backgroundColor: darkMode ? '#1a1a2e' : '#F9FAFB',
                borderRadius: '8px',
              }}
            >
              <p
                style={{
                  fontSize: '14px',
                  color: darkMode ? '#9CA3AF' : '#6B7280',
                  margin: 0,
                }}
              >
                États du formulaire:
              </p>
              <ul
                style={{
                  margin: '8px 0 0 0',
                  padding: '0 0 0 20px',
                  fontSize: '14px',
                  color: darkMode ? '#FFFFFF' : '#111827',
                }}
              >
                <li>
                  Email:{' '}
                  <strong style={{ color: emailEnabled ? '#16A34A' : '#DC2626' }}>
                    {emailEnabled ? 'ON' : 'OFF'}
                  </strong>
                </li>
                <li>
                  SMS:{' '}
                  <strong style={{ color: smsEnabled ? '#16A34A' : '#DC2626' }}>
                    {smsEnabled ? 'ON' : 'OFF'}
                  </strong>
                </li>
                <li>
                  Push:{' '}
                  <strong style={{ color: pushEnabled ? '#16A34A' : '#DC2626' }}>
                    {pushEnabled ? 'ON' : 'OFF'}
                  </strong>
                </li>
              </ul>
            </div>
          </form>
        </section>

        {/* ============================================ */}
        {/* SECTION: Feature Toggles Example */}
        {/* ============================================ */}
        <section
          style={{
            padding: '24px',
            backgroundColor: darkMode ? '#262640' : '#FFFFFF',
            borderRadius: '12px',
            border: `1px solid ${darkMode ? '#3d3d5c' : '#E5E7EB'}`,
            marginBottom: '24px',
          }}
        >
          <h2
            style={{
              fontSize: '16px',
              fontWeight: 600,
              color: darkMode ? '#FFFFFF' : '#111827',
              marginBottom: '20px',
            }}
          >
            Exemple: Fonctionnalités
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <Switch
              label="Recherche SIV"
              description="Recherche automatique des informations véhicule"
              defaultChecked
            />

            <Switch
              label="Signatures électroniques"
              description="Activer les signatures client par email"
              defaultChecked
            />

            <Switch
              label="Exports PDF"
              description="Générer automatiquement les documents PDF"
              defaultChecked
            />

            <Switch
              label="IA Copilot"
              description="Assistant intelligent (Plan Premium requis)"
              disabled
            />
          </div>
        </section>

        {/* ============================================ */}
        {/* Keyboard navigation hint */}
        {/* ============================================ */}
        <section
          style={{
            padding: '16px 20px',
            backgroundColor: darkMode ? '#262640' : '#F3F4F6',
            borderRadius: '8px',
            border: `1px solid ${darkMode ? '#3d3d5c' : '#E5E7EB'}`,
          }}
        >
          <p
            style={{
              fontSize: '13px',
              color: darkMode ? '#9CA3AF' : '#6B7280',
            }}
          >
            💡 <strong>Astuce :</strong> Utilisez{' '}
            <kbd
              style={{
                padding: '2px 6px',
                backgroundColor: darkMode ? '#3d3d5c' : '#FFFFFF',
                border: `1px solid ${darkMode ? '#4d4d6d' : '#E5E7EB'}`,
                borderRadius: '4px',
                fontFamily: 'monospace',
                fontSize: '12px',
                color: darkMode ? '#FFFFFF' : '#111827',
              }}
            >
              Tab
            </kbd>{' '}
            pour naviguer et{' '}
            <kbd
              style={{
                padding: '2px 6px',
                backgroundColor: darkMode ? '#3d3d5c' : '#FFFFFF',
                border: `1px solid ${darkMode ? '#4d4d6d' : '#E5E7EB'}`,
                borderRadius: '4px',
                fontFamily: 'monospace',
                fontSize: '12px',
                color: darkMode ? '#FFFFFF' : '#111827',
              }}
            >
              Espace
            </kbd>{' '}
            pour toggle les switches.
          </p>
        </section>
      </div>
    </div>
  )
}
