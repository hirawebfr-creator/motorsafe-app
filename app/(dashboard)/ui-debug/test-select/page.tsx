'use client'

import { Select, SelectOption } from '@/components/shared/select'
import { Button } from '@/components/shared/button'
import { Building2, Users, Wrench, Globe, Tag } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { useState } from 'react'

// ============================================================================
// TEST DATA
// ============================================================================

const statusOptions: SelectOption[] = [
  { value: 'active', label: 'Actif' },
  { value: 'pending', label: 'En attente' },
  { value: 'inactive', label: 'Inactif' },
  { value: 'archived', label: 'Archivé', disabled: true },
]

const interventionTypes: SelectOption[] = [
  { value: 'revision', label: 'Révision' },
  { value: 'reparation', label: 'Réparation' },
  { value: 'diagnostic', label: 'Diagnostic' },
  { value: 'controle', label: 'Contrôle technique' },
  { value: 'vidange', label: 'Vidange' },
  { value: 'freins', label: 'Freins' },
  { value: 'pneus', label: 'Pneumatiques' },
  { value: 'climatisation', label: 'Climatisation' },
  { value: 'electricite', label: 'Électricité' },
  { value: 'carrosserie', label: 'Carrosserie' },
]

const clientOptions: SelectOption[] = [
  { value: 'cl_001', label: 'Jean Dupont - Garage Martin' },
  { value: 'cl_002', label: 'Marie Curie - Auto Service Plus' },
  { value: 'cl_003', label: 'Pierre Bernard - Mécanique Pro' },
  { value: 'cl_004', label: 'Sophie Laurent - CarExpert' },
  { value: 'cl_005', label: 'Lucas Martin - AutoFix' },
  { value: 'cl_006', label: 'Emma Petit - GarageTech' },
  { value: 'cl_007', label: 'Thomas Roux - MotoSafe Partner' },
  { value: 'cl_008', label: 'Julie Moreau - Réparations Express' },
  { value: 'cl_009', label: 'Antoine Durand - Mécanique Générale' },
  { value: 'cl_010', label: 'Camille Leroy - Auto Premium' },
]

const countryOptions: SelectOption[] = [
  { value: 'fr', label: '🇫🇷 France' },
  { value: 'be', label: '🇧🇪 Belgique' },
  { value: 'ch', label: '🇨🇭 Suisse' },
  { value: 'lu', label: '🇱🇺 Luxembourg' },
  { value: 'mc', label: '🇲🇨 Monaco' },
]

// ============================================================================
// FORM TYPES
// ============================================================================

interface InterventionFormData {
  client: string
  type: string
  priority: string
}

// ============================================================================
// TEST PAGE
// ============================================================================

export default function TestSelectPage() {
  const [selectedStatus, setSelectedStatus] = useState('')
  const [formSubmitted, setFormSubmitted] = useState(false)

  const form = useForm<InterventionFormData>({
    defaultValues: {
      client: '',
      type: '',
      priority: '',
    },
  })

  const onSubmit = (data: InterventionFormData) => {
    console.log('Form data:', data)
    setFormSubmitted(true)
    setTimeout(() => {
      setFormSubmitted(false)
      form.reset()
    }, 3000)
  }

  return (
    <div
      style={{
        padding: '32px',
        maxWidth: '900px',
        margin: '0 auto',
        minHeight: '100vh',
        backgroundColor: '#f9fafb',
      }}
    >
      <h1
        style={{
          fontSize: '30px',
          fontWeight: '700',
          marginBottom: '8px',
          color: '#111827',
        }}
      >
        Test Select Component
      </h1>
      <p
        style={{
          fontSize: '16px',
          color: '#6b7280',
          marginBottom: '32px',
        }}
      >
        Dropdown custom avec recherche, navigation clavier et react-hook-form
      </p>

      {/* Basic Selects */}
      <section style={{ marginBottom: '48px' }}>
        <h2
          style={{
            fontSize: '20px',
            fontWeight: '600',
            marginBottom: '16px',
            color: '#374151',
          }}
        >
          Basic Selects
        </h2>
        <div
          style={{
            padding: '24px',
            backgroundColor: '#ffffff',
            borderRadius: '12px',
            border: '1px solid #e5e7eb',
          }}
        >
          <Select
            label="Statut"
            options={statusOptions}
            placeholder="Choisir un statut"
            onValueChange={(val) => setSelectedStatus(val)}
          />

          <Select
            label="Type d'intervention"
            options={interventionTypes}
            placeholder="Sélectionner le type"
            leftIcon={<Wrench size={16} />}
            required
          />

          <Select
            label="Pays"
            options={countryOptions}
            placeholder="Choisir un pays"
            leftIcon={<Globe size={16} />}
            helperText="Pays de l'établissement"
          />

          {selectedStatus && (
            <div
              style={{
                padding: '12px 16px',
                backgroundColor: '#f3f4f6',
                borderRadius: '8px',
                fontSize: '14px',
                color: '#374151',
              }}
            >
              Statut sélectionné : <strong>{selectedStatus}</strong>
            </div>
          )}
        </div>
      </section>

      {/* Searchable Select */}
      <section style={{ marginBottom: '48px' }}>
        <h2
          style={{
            fontSize: '20px',
            fontWeight: '600',
            marginBottom: '16px',
            color: '#374151',
          }}
        >
          Searchable Select
        </h2>
        <div
          style={{
            padding: '24px',
            backgroundColor: '#ffffff',
            borderRadius: '12px',
            border: '1px solid #e5e7eb',
          }}
        >
          <Select
            label="Client"
            options={clientOptions}
            placeholder="Rechercher un client..."
            leftIcon={<Users size={16} />}
            searchable
            helperText="Tapez pour filtrer la liste"
          />

          <Select
            label="Type d'intervention (avec recherche)"
            options={interventionTypes}
            placeholder="Rechercher..."
            leftIcon={<Wrench size={16} />}
            searchable
            emptyText="Aucun type trouvé"
          />
        </div>
      </section>

      {/* Sizes */}
      <section style={{ marginBottom: '48px' }}>
        <h2
          style={{
            fontSize: '20px',
            fontWeight: '600',
            marginBottom: '16px',
            color: '#374151',
          }}
        >
          Sizes
        </h2>
        <div
          style={{
            padding: '24px',
            backgroundColor: '#ffffff',
            borderRadius: '12px',
            border: '1px solid #e5e7eb',
          }}
        >
          <Select
            label="Small"
            size="sm"
            options={statusOptions}
            placeholder="Petit select"
          />
          <Select
            label="Medium (default)"
            size="md"
            options={statusOptions}
            placeholder="Select moyen"
          />
          <Select
            label="Large"
            size="lg"
            options={statusOptions}
            placeholder="Grand select"
          />
        </div>
      </section>

      {/* States */}
      <section style={{ marginBottom: '48px' }}>
        <h2
          style={{
            fontSize: '20px',
            fontWeight: '600',
            marginBottom: '16px',
            color: '#374151',
          }}
        >
          States (Error, Disabled)
        </h2>
        <div
          style={{
            padding: '24px',
            backgroundColor: '#ffffff',
            borderRadius: '12px',
            border: '1px solid #e5e7eb',
          }}
        >
          <Select
            label="Avec erreur"
            options={statusOptions}
            placeholder="Sélectionner..."
            error="Ce champ est obligatoire"
            required
          />

          <Select
            label="Disabled"
            options={statusOptions}
            value="active"
            disabled
            helperText="Non modifiable"
          />

          <Select
            label="Avec option disabled"
            options={statusOptions}
            placeholder="L'option 'Archivé' est désactivée"
            leftIcon={<Tag size={16} />}
          />
        </div>
      </section>

      {/* With react-hook-form */}
      <section style={{ marginBottom: '48px' }}>
        <h2
          style={{
            fontSize: '20px',
            fontWeight: '600',
            marginBottom: '16px',
            color: '#374151',
          }}
        >
          Avec react-hook-form
        </h2>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          style={{
            padding: '24px',
            backgroundColor: '#ffffff',
            borderRadius: '12px',
            border: '1px solid #e5e7eb',
          }}
        >
          {formSubmitted && (
            <div
              style={{
                padding: '12px 16px',
                backgroundColor: '#dcfce7',
                border: '1px solid #86efac',
                borderRadius: '8px',
                marginBottom: '20px',
                color: '#166534',
                fontSize: '14px',
              }}
            >
              ✅ Intervention créée avec succès !
            </div>
          )}

          <Select
            label="Client"
            placeholder="Sélectionner un client"
            leftIcon={<Building2 size={16} />}
            searchable
            required
            {...form.register('client', { required: 'Le client est requis' })}
            options={clientOptions}
            error={form.formState.errors.client?.message}
          />

          <Select
            label="Type d'intervention"
            placeholder="Sélectionner le type"
            leftIcon={<Wrench size={16} />}
            required
            {...form.register('type', { required: 'Le type est requis' })}
            options={interventionTypes}
            error={form.formState.errors.type?.message}
          />

          <Select
            label="Priorité"
            placeholder="Sélectionner la priorité"
            required
            {...form.register('priority', { required: 'La priorité est requise' })}
            options={[
              { value: 'low', label: '🟢 Basse' },
              { value: 'medium', label: '🟡 Moyenne' },
              { value: 'high', label: '🟠 Haute' },
              { value: 'urgent', label: '🔴 Urgente' },
            ]}
            error={form.formState.errors.priority?.message}
          />

          <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
            <Button
              type="button"
              variant="ghost"
              onClick={() => form.reset()}
            >
              Réinitialiser
            </Button>
            <Button
              type="submit"
              variant="primary"
              loading={form.formState.isSubmitting}
            >
              Créer l'intervention
            </Button>
          </div>
        </form>
      </section>

      {/* Keyboard Navigation Info */}
      <section style={{ marginBottom: '48px' }}>
        <h2
          style={{
            fontSize: '20px',
            fontWeight: '600',
            marginBottom: '16px',
            color: '#374151',
          }}
        >
          Navigation clavier
        </h2>
        <div
          style={{
            padding: '24px',
            backgroundColor: '#ffffff',
            borderRadius: '12px',
            border: '1px solid #e5e7eb',
          }}
        >
          <table
            style={{
              width: '100%',
              borderCollapse: 'collapse',
              fontSize: '14px',
            }}
          >
            <thead>
              <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
                <th style={{ padding: '12px', textAlign: 'left', fontWeight: 600 }}>
                  Touche
                </th>
                <th style={{ padding: '12px', textAlign: 'left', fontWeight: 600 }}>
                  Action
                </th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderBottom: '1px solid #f3f4f6' }}>
                <td style={{ padding: '12px' }}>
                  <code style={{ backgroundColor: '#f3f4f6', padding: '2px 6px', borderRadius: '4px' }}>
                    ↓ / ↑
                  </code>
                </td>
                <td style={{ padding: '12px', color: '#6b7280' }}>
                  Naviguer entre les options
                </td>
              </tr>
              <tr style={{ borderBottom: '1px solid #f3f4f6' }}>
                <td style={{ padding: '12px' }}>
                  <code style={{ backgroundColor: '#f3f4f6', padding: '2px 6px', borderRadius: '4px' }}>
                    Enter
                  </code>
                </td>
                <td style={{ padding: '12px', color: '#6b7280' }}>
                  Sélectionner l'option surlignée
                </td>
              </tr>
              <tr style={{ borderBottom: '1px solid #f3f4f6' }}>
                <td style={{ padding: '12px' }}>
                  <code style={{ backgroundColor: '#f3f4f6', padding: '2px 6px', borderRadius: '4px' }}>
                    Escape
                  </code>
                </td>
                <td style={{ padding: '12px', color: '#6b7280' }}>
                  Fermer le dropdown
                </td>
              </tr>
              <tr>
                <td style={{ padding: '12px' }}>
                  <code style={{ backgroundColor: '#f3f4f6', padding: '2px 6px', borderRadius: '4px' }}>
                    Space
                  </code>
                </td>
                <td style={{ padding: '12px', color: '#6b7280' }}>
                  Ouvrir le dropdown
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* Checklist */}
      <div
        style={{
          padding: '16px',
          backgroundColor: '#ffffff',
          borderRadius: '12px',
          border: '1px solid #e5e7eb',
          fontSize: '14px',
          color: '#6b7280',
        }}
      >
        <strong style={{ color: '#111827' }}>✅ Checklist Select :</strong>
        <ul style={{ marginTop: '8px', paddingLeft: '20px' }}>
          <li>✅ Ouvre/ferme au clic</li>
          <li>✅ Ferme au clic extérieur</li>
          <li>✅ Recherche filtre les options (searchable)</li>
          <li>✅ Navigation clavier (↑↓ Enter Esc Space)</li>
          <li>✅ Option sélectionnée avec checkmark ✓</li>
          <li>✅ Chevron tourne à l'ouverture</li>
          <li>✅ Error state (border rouge + message)</li>
          <li>✅ Disabled bloque interactions</li>
          <li>✅ Options disabled grisées</li>
          <li>✅ Compatible react-hook-form</li>
          <li>✅ Empty state si aucun résultat</li>
          <li>✅ Left icon support</li>
        </ul>
      </div>
    </div>
  )
}
