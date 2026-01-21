'use client'

import { FormField } from '@/components/shared/form-field'
import { Button } from '@/components/shared/button'
import { Mail, Lock, User, Phone, Building, MapPin, CreditCard, Search } from 'lucide-react'
import { useRef, useState } from 'react'

export default function TestFormFieldPage() {
  const emailRef = useRef<HTMLInputElement>(null)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    description: ''
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitted, setSubmitted] = useState(false)

  const handleChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [field]: e.target.value }))
    // Clear error on change
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const newErrors: Record<string, string> = {}
    
    if (!formData.name) newErrors.name = 'Le nom est requis'
    if (!formData.email) newErrors.email = 'L\'email est requis'
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Email invalide'
    if (!formData.phone) newErrors.phone = 'Le téléphone est requis'
    
    setErrors(newErrors)
    
    if (Object.keys(newErrors).length === 0) {
      setSubmitted(true)
      setTimeout(() => setSubmitted(false), 3000)
    }
  }

  return (
    <div style={{ 
      padding: '32px', 
      maxWidth: '800px', 
      margin: '0 auto',
      minHeight: '100vh',
      backgroundColor: '#f9fafb'
    }}>
      <h1 style={{ 
        fontSize: '30px', 
        fontWeight: '700', 
        marginBottom: '32px',
        color: '#111827'
      }}>
        Test FormField Component
      </h1>

      {/* Basic FormFields */}
      <section style={{ marginBottom: '48px' }}>
        <h2 style={{ 
          fontSize: '18px', 
          fontWeight: '600', 
          marginBottom: '16px',
          color: '#374151'
        }}>
          Basic FormFields
        </h2>
        <div style={{ 
          padding: '24px',
          backgroundColor: '#ffffff',
          borderRadius: '12px',
          border: '1px solid #e5e7eb'
        }}>
          <FormField
            label="Nom simple"
            name="simple-name"
            placeholder="Jean Dupont"
          />
          <FormField
            label="Email"
            name="simple-email"
            type="email"
            placeholder="exemple@email.com"
            required
          />
          <FormField
            label="Téléphone"
            name="simple-phone"
            type="tel"
            placeholder="06 12 34 56 78"
            helperText="Format français de préférence"
          />
        </div>
      </section>

      {/* With Icons */}
      <section style={{ marginBottom: '48px' }}>
        <h2 style={{ 
          fontSize: '18px', 
          fontWeight: '600', 
          marginBottom: '16px',
          color: '#374151'
        }}>
          With Icons
        </h2>
        <div style={{ 
          padding: '24px',
          backgroundColor: '#ffffff',
          borderRadius: '12px',
          border: '1px solid #e5e7eb'
        }}>
          <FormField
            label="Recherche"
            name="search"
            leftIcon={<Search size={16} />}
            placeholder="Rechercher un client..."
          />
          <FormField
            label="Email"
            name="email-icon"
            type="email"
            leftIcon={<Mail size={16} />}
            placeholder="contact@motorsafe.fr"
            required
          />
          <FormField
            label="Mot de passe"
            name="password"
            type="password"
            leftIcon={<Lock size={16} />}
            placeholder="••••••••"
            helperText="8 caractères minimum"
            required
          />
          <FormField
            label="Entreprise"
            name="company"
            leftIcon={<Building size={16} />}
            placeholder="Garage Martin SARL"
          />
        </div>
      </section>

      {/* Error States */}
      <section style={{ marginBottom: '48px' }}>
        <h2 style={{ 
          fontSize: '18px', 
          fontWeight: '600', 
          marginBottom: '16px',
          color: '#374151'
        }}>
          Error States
        </h2>
        <div style={{ 
          padding: '24px',
          backgroundColor: '#ffffff',
          borderRadius: '12px',
          border: '1px solid #e5e7eb'
        }}>
          <FormField
            label="Email invalide"
            name="email-error"
            type="email"
            leftIcon={<Mail size={16} />}
            defaultValue="pas-un-email"
            error="Veuillez entrer une adresse email valide"
            required
          />
          <FormField
            label="Mot de passe trop court"
            name="password-error"
            type="password"
            leftIcon={<Lock size={16} />}
            defaultValue="123"
            error="Le mot de passe doit contenir au moins 8 caractères"
            required
          />
          <FormField
            label="Champ requis vide"
            name="required-error"
            leftIcon={<User size={16} />}
            error="Ce champ est obligatoire"
            required
          />
        </div>
      </section>

      {/* Sizes */}
      <section style={{ marginBottom: '48px' }}>
        <h2 style={{ 
          fontSize: '18px', 
          fontWeight: '600', 
          marginBottom: '16px',
          color: '#374151'
        }}>
          Sizes
        </h2>
        <div style={{ 
          padding: '24px',
          backgroundColor: '#ffffff',
          borderRadius: '12px',
          border: '1px solid #e5e7eb'
        }}>
          <FormField
            label="Small"
            name="size-sm"
            size="sm"
            placeholder="Petit input"
            leftIcon={<Search size={14} />}
          />
          <FormField
            label="Medium (default)"
            name="size-md"
            size="md"
            placeholder="Input moyen"
            leftIcon={<Search size={16} />}
          />
          <FormField
            label="Large"
            name="size-lg"
            size="lg"
            placeholder="Grand input"
            leftIcon={<Search size={18} />}
          />
        </div>
      </section>

      {/* Character Count */}
      <section style={{ marginBottom: '48px' }}>
        <h2 style={{ 
          fontSize: '18px', 
          fontWeight: '600', 
          marginBottom: '16px',
          color: '#374151'
        }}>
          Character Count
        </h2>
        <div style={{ 
          padding: '24px',
          backgroundColor: '#ffffff',
          borderRadius: '12px',
          border: '1px solid #e5e7eb'
        }}>
          <FormField
            label="Titre (max 50 caractères)"
            name="title"
            placeholder="Entrez un titre..."
            maxLength={50}
            showCharCount
          />
          <FormField
            label="Description courte"
            name="description"
            placeholder="Décrivez le problème..."
            maxLength={100}
            showCharCount
            helperText="Soyez bref et précis"
          />
        </div>
      </section>

      {/* Disabled & FullWidth */}
      <section style={{ marginBottom: '48px' }}>
        <h2 style={{ 
          fontSize: '18px', 
          fontWeight: '600', 
          marginBottom: '16px',
          color: '#374151'
        }}>
          Disabled & FullWidth
        </h2>
        <div style={{ 
          padding: '24px',
          backgroundColor: '#ffffff',
          borderRadius: '12px',
          border: '1px solid #e5e7eb'
        }}>
          <FormField
            label="SIRET (non modifiable)"
            name="siret"
            defaultValue="123 456 789 01234"
            disabled
            leftIcon={<CreditCard size={16} />}
            helperText="Validé et verrouillé"
          />
          <FormField
            label="Adresse complète"
            name="address-full"
            placeholder="123 rue de la Paix, 75001 Paris"
            leftIcon={<MapPin size={16} />}
            fullWidth
          />
        </div>
      </section>

      {/* Ref Test */}
      <section style={{ marginBottom: '48px' }}>
        <h2 style={{ 
          fontSize: '18px', 
          fontWeight: '600', 
          marginBottom: '16px',
          color: '#374151'
        }}>
          Ref Test
        </h2>
        <div style={{ 
          padding: '24px',
          backgroundColor: '#ffffff',
          borderRadius: '12px',
          border: '1px solid #e5e7eb'
        }}>
          <FormField
            ref={emailRef}
            label="Focus via ref"
            name="ref-test"
            type="email"
            leftIcon={<Mail size={16} />}
            placeholder="Cliquez le bouton pour focus"
          />
          <Button
            variant="secondary"
            onClick={() => emailRef.current?.focus()}
          >
            Focus l'input email
          </Button>
        </div>
      </section>

      {/* Real Form Example */}
      <section style={{ marginBottom: '48px' }}>
        <h2 style={{ 
          fontSize: '18px', 
          fontWeight: '600', 
          marginBottom: '16px',
          color: '#374151'
        }}>
          Real Form Example (avec validation)
        </h2>
        <form 
          onSubmit={handleSubmit}
          style={{ 
            padding: '24px',
            backgroundColor: '#ffffff',
            borderRadius: '12px',
            border: '1px solid #e5e7eb'
          }}
        >
          {submitted && (
            <div style={{
              padding: '12px 16px',
              backgroundColor: '#dcfce7',
              border: '1px solid #86efac',
              borderRadius: '8px',
              marginBottom: '20px',
              color: '#166534',
              fontSize: '14px'
            }}>
              ✅ Formulaire envoyé avec succès !
            </div>
          )}
          
          <FormField
            label="Nom complet"
            name="form-name"
            leftIcon={<User size={16} />}
            placeholder="Jean Dupont"
            value={formData.name}
            onChange={handleChange('name')}
            error={errors.name}
            required
          />
          
          <FormField
            label="Email"
            name="form-email"
            type="email"
            leftIcon={<Mail size={16} />}
            placeholder="jean.dupont@email.com"
            value={formData.email}
            onChange={handleChange('email')}
            error={errors.email}
            required
          />
          
          <FormField
            label="Téléphone"
            name="form-phone"
            type="tel"
            leftIcon={<Phone size={16} />}
            placeholder="06 12 34 56 78"
            value={formData.phone}
            onChange={handleChange('phone')}
            error={errors.phone}
            helperText="Pour vous contacter rapidement"
            required
          />
          
          <FormField
            label="Adresse"
            name="form-address"
            leftIcon={<MapPin size={16} />}
            placeholder="123 rue de la Paix, Paris"
            value={formData.address}
            onChange={handleChange('address')}
            fullWidth
          />
          
          <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
            <Button type="button" variant="ghost">
              Annuler
            </Button>
            <Button type="submit" variant="primary">
              Envoyer
            </Button>
          </div>
        </form>
      </section>

      {/* Checklist */}
      <div style={{
        padding: '16px',
        backgroundColor: '#ffffff',
        borderRadius: '12px',
        border: '1px solid #e5e7eb',
        fontSize: '14px',
        color: '#6b7280'
      }}>
        <strong style={{ color: '#111827' }}>Checklist :</strong>
        <ul style={{ marginTop: '8px', paddingLeft: '20px' }}>
          <li>✅ Label avec astérisque rouge si required</li>
          <li>✅ Focus affiche border + shadow</li>
          <li>✅ Error affiche border rouge + message + icône</li>
          <li>✅ Helper text affiché si pas d'erreur</li>
          <li>✅ Icons gauche/droite bien positionnées</li>
          <li>✅ Character count fonctionne</li>
          <li>✅ Disabled bloque interactions</li>
          <li>✅ FullWidth prend 100% largeur</li>
          <li>✅ Margin bottom espace les form fields</li>
          <li>✅ Ref fonctionne (bouton focus)</li>
          <li>✅ htmlFor/id connectent label et input</li>
          <li>✅ Validation fonctionne sur submit</li>
        </ul>
      </div>
    </div>
  )
}
