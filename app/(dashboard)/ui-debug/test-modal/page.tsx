'use client'

import { useState } from 'react'
import { Modal, ConfirmModal } from '@/components/shared/modal'
import { Button } from '@/components/shared/button'
import { FormField } from '@/components/shared/form-field'
import { Select } from '@/components/shared/select'
import { Trash2, Plus, Settings, AlertTriangle, Info } from 'lucide-react'
import { useForm } from 'react-hook-form'

// ============================================================================
// TEST PAGE
// ============================================================================

export default function TestModalPage() {
  // Modal states
  const [basicOpen, setBasicOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [formOpen, setFormOpen] = useState(false)
  const [fullOpen, setFullOpen] = useState(false)
  const [noHeaderOpen, setNoHeaderOpen] = useState(false)
  const [sizeSm, setSizeSm] = useState(false)
  const [sizeLg, setSizeLg] = useState(false)
  const [sizeXl, setSizeXl] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [confirmLoading, setConfirmLoading] = useState(false)

  // Form
  const form = useForm({
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      type: '',
    },
  })

  const handleFormSubmit = (data: Record<string, string>) => {
    console.log('Form submitted:', data)
    setFormOpen(false)
    form.reset()
  }

  const handleConfirm = () => {
    setConfirmLoading(true)
    setTimeout(() => {
      setConfirmLoading(false)
      setConfirmOpen(false)
    }, 2000)
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
        Test Modal Component
      </h1>
      <p
        style={{
          fontSize: '16px',
          color: '#6b7280',
          marginBottom: '32px',
        }}
      >
        Modal avec overlay, animations, fermeture ESC/clic extérieur, focus trap
      </p>

      {/* Basic Modal */}
      <section style={{ marginBottom: '48px' }}>
        <h2
          style={{
            fontSize: '20px',
            fontWeight: '600',
            marginBottom: '16px',
            color: '#374151',
          }}
        >
          Basic Modal
        </h2>
        <div
          style={{
            padding: '24px',
            backgroundColor: '#ffffff',
            borderRadius: '12px',
            border: '1px solid #e5e7eb',
            display: 'flex',
            gap: '12px',
            flexWrap: 'wrap',
          }}
        >
          <Button
            variant="primary"
            onClick={() => setBasicOpen(true)}
            leftIcon={<Info size={16} />}
          >
            Ouvrir Modal basique
          </Button>

          <Modal
            isOpen={basicOpen}
            onClose={() => setBasicOpen(false)}
            title="Titre de la modal"
            description="Ceci est une description optionnelle qui explique le contenu de la modal."
          >
            <p style={{ margin: 0, color: '#374151', fontSize: '14px', lineHeight: 1.6 }}>
              Contenu de la modal. Lorem ipsum dolor sit amet, consectetur adipiscing elit.
              Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
            </p>
          </Modal>
        </div>
      </section>

      {/* Delete Confirmation */}
      <section style={{ marginBottom: '48px' }}>
        <h2
          style={{
            fontSize: '20px',
            fontWeight: '600',
            marginBottom: '16px',
            color: '#374151',
          }}
        >
          Delete Confirmation Modal
        </h2>
        <div
          style={{
            padding: '24px',
            backgroundColor: '#ffffff',
            borderRadius: '12px',
            border: '1px solid #e5e7eb',
          }}
        >
          <Button
            variant="danger"
            onClick={() => setDeleteOpen(true)}
            leftIcon={<Trash2 size={16} />}
          >
            Supprimer le client
          </Button>

          <Modal
            isOpen={deleteOpen}
            onClose={() => setDeleteOpen(false)}
            title="Supprimer le client ?"
            description="Cette action est irréversible. Toutes les données associées seront définitivement supprimées."
            size="sm"
            footer={
              <>
                <Button variant="secondary" onClick={() => setDeleteOpen(false)}>
                  Annuler
                </Button>
                <Button
                  variant="danger"
                  onClick={() => {
                    console.log('Deleted!')
                    setDeleteOpen(false)
                  }}
                >
                  Supprimer
                </Button>
              </>
            }
          >
            <div
              style={{
                backgroundColor: '#FEF2F2',
                border: '1px solid #FECACA',
                borderRadius: '8px',
                padding: '16px',
              }}
            >
              <p style={{ margin: 0, color: '#991B1B', fontSize: '14px' }}>
                <strong>Client :</strong> Jean Dupont
                <br />
                <strong>Email :</strong> jean.dupont@example.com
                <br />
                <strong>Véhicules associés :</strong> 2
              </p>
            </div>
          </Modal>
        </div>
      </section>

      {/* Form Modal */}
      <section style={{ marginBottom: '48px' }}>
        <h2
          style={{
            fontSize: '20px',
            fontWeight: '600',
            marginBottom: '16px',
            color: '#374151',
          }}
        >
          Form Modal
        </h2>
        <div
          style={{
            padding: '24px',
            backgroundColor: '#ffffff',
            borderRadius: '12px',
            border: '1px solid #e5e7eb',
          }}
        >
          <Button
            variant="primary"
            onClick={() => setFormOpen(true)}
            leftIcon={<Plus size={16} />}
          >
            Nouveau client
          </Button>

          <Modal
            isOpen={formOpen}
            onClose={() => setFormOpen(false)}
            title="Nouveau client"
            description="Renseignez les informations du client"
            size="lg"
            footer={
              <>
                <Button variant="secondary" onClick={() => setFormOpen(false)}>
                  Annuler
                </Button>
                <Button variant="primary" type="submit" form="client-form">
                  Créer le client
                </Button>
              </>
            }
          >
            <form id="client-form" onSubmit={form.handleSubmit(handleFormSubmit)}>
              <FormField
                label="Nom complet"
                required
                {...form.register('name', { required: 'Le nom est requis' })}
                error={form.formState.errors.name?.message}
              />
              <FormField
                label="Email"
                type="email"
                required
                {...form.register('email', { required: "L'email est requis" })}
                error={form.formState.errors.email?.message}
              />
              <FormField
                label="Téléphone"
                type="tel"
                {...form.register('phone')}
              />
              <Select
                label="Type de client"
                placeholder="Sélectionner le type"
                {...form.register('type')}
                options={[
                  { value: 'particulier', label: 'Particulier' },
                  { value: 'professionnel', label: 'Professionnel' },
                  { value: 'flotte', label: 'Gestionnaire de flotte' },
                ]}
              />
            </form>
          </Modal>
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
            display: 'flex',
            gap: '12px',
            flexWrap: 'wrap',
          }}
        >
          <Button variant="secondary" onClick={() => setSizeSm(true)}>
            Small (400px)
          </Button>
          <Button variant="secondary" onClick={() => setBasicOpen(true)}>
            Medium (500px)
          </Button>
          <Button variant="secondary" onClick={() => setSizeLg(true)}>
            Large (600px)
          </Button>
          <Button variant="secondary" onClick={() => setSizeXl(true)}>
            XL (800px)
          </Button>
          <Button variant="secondary" onClick={() => setFullOpen(true)}>
            Full (95vw)
          </Button>

          <Modal
            isOpen={sizeSm}
            onClose={() => setSizeSm(false)}
            title="Small Modal"
            size="sm"
          >
            <p style={{ margin: 0, color: '#6B7280' }}>
              Modal de 400px de large maximum.
            </p>
          </Modal>

          <Modal
            isOpen={sizeLg}
            onClose={() => setSizeLg(false)}
            title="Large Modal"
            size="lg"
          >
            <p style={{ margin: 0, color: '#6B7280' }}>
              Modal de 600px de large maximum.
            </p>
          </Modal>

          <Modal
            isOpen={sizeXl}
            onClose={() => setSizeXl(false)}
            title="XL Modal"
            size="xl"
          >
            <p style={{ margin: 0, color: '#6B7280' }}>
              Modal de 800px de large maximum. Idéale pour les tableaux ou contenus riches.
            </p>
          </Modal>

          <Modal
            isOpen={fullOpen}
            onClose={() => setFullOpen(false)}
            title="Conditions générales d'utilisation"
            description="Veuillez lire attentivement les conditions ci-dessous"
            size="full"
            footer={
              <>
                <Button variant="secondary" onClick={() => setFullOpen(false)}>
                  Refuser
                </Button>
                <Button variant="primary" onClick={() => setFullOpen(false)}>
                  Accepter
                </Button>
              </>
            }
          >
            <div style={{ lineHeight: 1.8, color: '#374151' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '12px' }}>
                Article 1 - Définitions
              </h3>
              <p style={{ marginBottom: '16px' }}>
                Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nullam euismod,
                nisl eget aliquam ultricies, nunc nisl aliquet nunc, quis aliquam nisl
                nunc quis nisl. Nullam euismod, nisl eget aliquam ultricies.
              </p>
              <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '12px' }}>
                Article 2 - Objet du contrat
              </h3>
              <p style={{ marginBottom: '16px' }}>
                Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim
                ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip
                ex ea commodo consequat.
              </p>
              <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '12px' }}>
                Article 3 - Durée
              </h3>
              <p style={{ marginBottom: '16px' }}>
                Duis aute irure dolor in reprehenderit in voluptate velit esse cillum
                dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non
                proident, sunt in culpa qui officia deserunt mollit anim id est laborum.
              </p>
              <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '12px' }}>
                Article 4 - Prix et paiement
              </h3>
              <p style={{ marginBottom: '16px' }}>
                Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nullam euismod,
                nisl eget aliquam ultricies, nunc nisl aliquet nunc, quis aliquam nisl
                nunc quis nisl.
              </p>
              <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '12px' }}>
                Article 5 - Résiliation
              </h3>
              <p>
                Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia
                deserunt mollit anim id est laborum. Lorem ipsum dolor sit amet.
              </p>
            </div>
          </Modal>
        </div>
      </section>

      {/* No Header Modal */}
      <section style={{ marginBottom: '48px' }}>
        <h2
          style={{
            fontSize: '20px',
            fontWeight: '600',
            marginBottom: '16px',
            color: '#374151',
          }}
        >
          Custom Content (No Header)
        </h2>
        <div
          style={{
            padding: '24px',
            backgroundColor: '#ffffff',
            borderRadius: '12px',
            border: '1px solid #e5e7eb',
          }}
        >
          <Button
            variant="ghost"
            onClick={() => setNoHeaderOpen(true)}
            leftIcon={<Settings size={16} />}
          >
            Modal sans header
          </Button>

          <Modal
            isOpen={noHeaderOpen}
            onClose={() => setNoHeaderOpen(false)}
            showCloseButton={false}
          >
            <div style={{ textAlign: 'center', padding: '20px' }}>
              <div
                style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '50%',
                  backgroundColor: '#DCFCE7',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 16px',
                }}
              >
                <svg
                  width="32"
                  height="32"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#16A34A"
                  strokeWidth="2"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <h3
                style={{
                  fontSize: '20px',
                  fontWeight: 600,
                  color: '#111827',
                  marginBottom: '8px',
                }}
              >
                Paiement réussi !
              </h3>
              <p style={{ color: '#6B7280', marginBottom: '24px' }}>
                Votre commande a été confirmée et sera traitée dans les plus brefs délais.
              </p>
              <Button variant="primary" onClick={() => setNoHeaderOpen(false)}>
                Continuer
              </Button>
            </div>
          </Modal>
        </div>
      </section>

      {/* ConfirmModal Component */}
      <section style={{ marginBottom: '48px' }}>
        <h2
          style={{
            fontSize: '20px',
            fontWeight: '600',
            marginBottom: '16px',
            color: '#374151',
          }}
        >
          ConfirmModal (Pre-built)
        </h2>
        <div
          style={{
            padding: '24px',
            backgroundColor: '#ffffff',
            borderRadius: '12px',
            border: '1px solid #e5e7eb',
          }}
        >
          <Button
            variant="danger"
            onClick={() => setConfirmOpen(true)}
            leftIcon={<AlertTriangle size={16} />}
          >
            Action dangereuse
          </Button>

          <ConfirmModal
            isOpen={confirmOpen}
            onClose={() => setConfirmOpen(false)}
            onConfirm={handleConfirm}
            title="Confirmer la suppression"
            description="Êtes-vous sûr de vouloir supprimer cet élément ?"
            confirmText="Oui, supprimer"
            cancelText="Non, annuler"
            variant="danger"
            loading={confirmLoading}
          >
            <p style={{ margin: 0, color: '#6B7280', fontSize: '14px' }}>
              Cette action supprimera définitivement toutes les données associées.
            </p>
          </ConfirmModal>
        </div>
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
          Comportements
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
                  Action
                </th>
                <th style={{ padding: '12px', textAlign: 'left', fontWeight: 600 }}>
                  Comportement
                </th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderBottom: '1px solid #f3f4f6' }}>
                <td style={{ padding: '12px' }}>
                  <code style={{ backgroundColor: '#f3f4f6', padding: '2px 6px', borderRadius: '4px' }}>
                    Escape
                  </code>
                </td>
                <td style={{ padding: '12px', color: '#6b7280' }}>
                  Ferme la modal (si closeOnEsc=true)
                </td>
              </tr>
              <tr style={{ borderBottom: '1px solid #f3f4f6' }}>
                <td style={{ padding: '12px' }}>
                  <code style={{ backgroundColor: '#f3f4f6', padding: '2px 6px', borderRadius: '4px' }}>
                    Clic overlay
                  </code>
                </td>
                <td style={{ padding: '12px', color: '#6b7280' }}>
                  Ferme la modal (si closeOnOverlayClick=true)
                </td>
              </tr>
              <tr style={{ borderBottom: '1px solid #f3f4f6' }}>
                <td style={{ padding: '12px' }}>
                  <code style={{ backgroundColor: '#f3f4f6', padding: '2px 6px', borderRadius: '4px' }}>
                    Tab
                  </code>
                </td>
                <td style={{ padding: '12px', color: '#6b7280' }}>
                  Navigation cyclique (focus trap)
                </td>
              </tr>
              <tr>
                <td style={{ padding: '12px' }}>
                  <code style={{ backgroundColor: '#f3f4f6', padding: '2px 6px', borderRadius: '4px' }}>
                    Ouverture
                  </code>
                </td>
                <td style={{ padding: '12px', color: '#6b7280' }}>
                  Body scroll bloqué, focus sur premier élément
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
        <strong style={{ color: '#111827' }}>✅ Checklist Modal :</strong>
        <ul style={{ marginTop: '8px', paddingLeft: '20px' }}>
          <li>✅ Animation smooth entrée (scale + fade)</li>
          <li>✅ Animation smooth sortie</li>
          <li>✅ Ferme au clic overlay (closeOnOverlayClick)</li>
          <li>✅ Ferme avec ESC (closeOnEsc)</li>
          <li>✅ Body scroll bloqué (preventScroll)</li>
          <li>✅ Focus trap (Tab cycle dans modal)</li>
          <li>✅ Focus auto sur premier élément</li>
          <li>✅ Close button avec hover</li>
          <li>✅ Clic sur modal ne ferme PAS</li>
          <li>✅ 5 tailles (sm, md, lg, xl, full)</li>
          <li>✅ Footer avec boutons alignés</li>
          <li>✅ Accessible (role, aria-*)</li>
          <li>✅ ConfirmModal pré-construit</li>
        </ul>
      </div>
    </div>
  )
}
