'use client'

import { useForm } from 'react-hook-form'
import { FormField } from '@/components/shared/form-field'
import { Button } from '@/components/shared/button'
import { Mail, Lock, User, Phone, Building, MapPin, Globe, FileText } from 'lucide-react'
import { useState } from 'react'

// ============================================================================
// TYPES
// ============================================================================

interface ContactFormData {
  firstName: string
  lastName: string
  email: string
  phone: string
  company?: string
  website?: string
  address?: string
  message: string
}

interface LoginFormData {
  email: string
  password: string
}

// ============================================================================
// TEST PAGE
// ============================================================================

export default function TestFormPage() {
  const [contactSubmitted, setContactSubmitted] = useState(false)
  const [loginSubmitted, setLoginSubmitted] = useState(false)

  // Contact Form with react-hook-form
  const contactForm = useForm<ContactFormData>({
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      company: '',
      website: '',
      address: '',
      message: ''
    }
  })

  // Login Form with react-hook-form
  const loginForm = useForm<LoginFormData>({
    defaultValues: {
      email: '',
      password: ''
    }
  })

  const onContactSubmit = (data: ContactFormData) => {
    console.log('Contact form data:', data)
    setContactSubmitted(true)
    setTimeout(() => {
      setContactSubmitted(false)
      contactForm.reset()
    }, 3000)
  }

  const onLoginSubmit = (data: LoginFormData) => {
    console.log('Login form data:', data)
    setLoginSubmitted(true)
    setTimeout(() => {
      setLoginSubmitted(false)
      loginForm.reset()
    }, 3000)
  }

  return (
    <div style={{ 
      padding: '32px', 
      maxWidth: '900px', 
      margin: '0 auto',
      minHeight: '100vh',
      backgroundColor: '#f9fafb'
    }}>
      <h1 style={{ 
        fontSize: '30px', 
        fontWeight: '700', 
        marginBottom: '8px',
        color: '#111827'
      }}>
        Test FormField avec react-hook-form
      </h1>
      <p style={{
        fontSize: '16px',
        color: '#6b7280',
        marginBottom: '32px'
      }}>
        Formulaires complets avec validation, états d'erreur et soumission
      </p>

      {/* Login Form */}
      <section style={{ marginBottom: '48px' }}>
        <h2 style={{ 
          fontSize: '20px', 
          fontWeight: '600', 
          marginBottom: '16px',
          color: '#374151'
        }}>
          Formulaire de connexion
        </h2>
        <form 
          onSubmit={loginForm.handleSubmit(onLoginSubmit)}
          style={{ 
            padding: '32px',
            backgroundColor: '#ffffff',
            borderRadius: '12px',
            border: '1px solid #e5e7eb',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
          }}
        >
          {loginSubmitted && (
            <div style={{
              padding: '12px 16px',
              backgroundColor: '#dcfce7',
              border: '1px solid #86efac',
              borderRadius: '8px',
              marginBottom: '20px',
              color: '#166534',
              fontSize: '14px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              ✅ Connexion réussie !
            </div>
          )}

          <FormField
            label="Email"
            type="email"
            leftIcon={<Mail size={16} />}
            placeholder="vous@exemple.com"
            required
            {...loginForm.register('email', { 
              required: 'L\'email est requis',
              pattern: {
                value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                message: 'Adresse email invalide'
              }
            })}
            error={loginForm.formState.errors.email?.message}
          />

          <FormField
            label="Mot de passe"
            type="password"
            leftIcon={<Lock size={16} />}
            placeholder="••••••••"
            helperText="8 caractères minimum"
            required
            {...loginForm.register('password', { 
              required: 'Le mot de passe est requis',
              minLength: {
                value: 8,
                message: 'Le mot de passe doit contenir au moins 8 caractères'
              }
            })}
            error={loginForm.formState.errors.password?.message}
          />

          <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
            <Button 
              type="submit" 
              variant="primary" 
              fullWidth
              loading={loginForm.formState.isSubmitting}
            >
              Se connecter
            </Button>
          </div>

          <p style={{
            marginTop: '16px',
            fontSize: '14px',
            color: '#6b7280',
            textAlign: 'center'
          }}>
            Pas encore de compte ? <a href="#" style={{ color: '#0A1628', fontWeight: 500 }}>S'inscrire</a>
          </p>
        </form>
      </section>

      {/* Contact Form */}
      <section style={{ marginBottom: '48px' }}>
        <h2 style={{ 
          fontSize: '20px', 
          fontWeight: '600', 
          marginBottom: '16px',
          color: '#374151'
        }}>
          Formulaire de contact complet
        </h2>
        <form 
          onSubmit={contactForm.handleSubmit(onContactSubmit)}
          style={{ 
            padding: '32px',
            backgroundColor: '#ffffff',
            borderRadius: '12px',
            border: '1px solid #e5e7eb',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
          }}
        >
          {contactSubmitted && (
            <div style={{
              padding: '12px 16px',
              backgroundColor: '#dcfce7',
              border: '1px solid #86efac',
              borderRadius: '8px',
              marginBottom: '20px',
              color: '#166534',
              fontSize: '14px'
            }}>
              ✅ Message envoyé avec succès ! Nous vous répondrons sous 24h.
            </div>
          )}

          {/* Row: First name + Last name */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <FormField
              label="Prénom"
              leftIcon={<User size={16} />}
              placeholder="Jean"
              required
              {...contactForm.register('firstName', { 
                required: 'Le prénom est requis',
                minLength: {
                  value: 2,
                  message: 'Le prénom doit contenir au moins 2 caractères'
                }
              })}
              error={contactForm.formState.errors.firstName?.message}
            />

            <FormField
              label="Nom"
              placeholder="Dupont"
              required
              {...contactForm.register('lastName', { 
                required: 'Le nom est requis',
                minLength: {
                  value: 2,
                  message: 'Le nom doit contenir au moins 2 caractères'
                }
              })}
              error={contactForm.formState.errors.lastName?.message}
            />
          </div>

          {/* Row: Email + Phone */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <FormField
              label="Email"
              type="email"
              leftIcon={<Mail size={16} />}
              placeholder="jean.dupont@email.com"
              required
              {...contactForm.register('email', { 
                required: 'L\'email est requis',
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: 'Adresse email invalide'
                }
              })}
              error={contactForm.formState.errors.email?.message}
            />

            <FormField
              label="Téléphone"
              type="tel"
              leftIcon={<Phone size={16} />}
              placeholder="06 12 34 56 78"
              required
              {...contactForm.register('phone', { 
                required: 'Le téléphone est requis',
                pattern: {
                  value: /^[\d\s+()-]{10,}$/,
                  message: 'Numéro de téléphone invalide'
                }
              })}
              error={contactForm.formState.errors.phone?.message}
            />
          </div>

          {/* Row: Company + Website */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <FormField
              label="Entreprise"
              leftIcon={<Building size={16} />}
              placeholder="Garage Martin SARL"
              helperText="Optionnel"
              {...contactForm.register('company')}
            />

            <FormField
              label="Site web"
              type="url"
              leftIcon={<Globe size={16} />}
              placeholder="https://www.exemple.com"
              helperText="Optionnel"
              {...contactForm.register('website', {
                pattern: {
                  value: /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/,
                  message: 'URL invalide'
                }
              })}
              error={contactForm.formState.errors.website?.message}
            />
          </div>

          {/* Address full width */}
          <FormField
            label="Adresse"
            leftIcon={<MapPin size={16} />}
            placeholder="123 rue de la Paix, 75001 Paris"
            helperText="Optionnel"
            fullWidth
            {...contactForm.register('address')}
          />

          {/* Message with character count */}
          <FormField
            label="Message"
            leftIcon={<FileText size={16} />}
            placeholder="Décrivez votre demande en détail..."
            maxLength={500}
            showCharCount
            required
            fullWidth
            {...contactForm.register('message', { 
              required: 'Le message est requis',
              minLength: {
                value: 10,
                message: 'Le message doit contenir au moins 10 caractères'
              },
              maxLength: {
                value: 500,
                message: 'Le message ne peut pas dépasser 500 caractères'
              }
            })}
            error={contactForm.formState.errors.message?.message}
          />

          {/* Buttons */}
          <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
            <Button 
              type="button" 
              variant="ghost"
              onClick={() => contactForm.reset()}
            >
              Réinitialiser
            </Button>
            <Button 
              type="submit" 
              variant="primary"
              loading={contactForm.formState.isSubmitting}
            >
              Envoyer le message
            </Button>
          </div>
        </form>
      </section>

      {/* Validation Summary */}
      <section style={{ marginBottom: '48px' }}>
        <h2 style={{ 
          fontSize: '20px', 
          fontWeight: '600', 
          marginBottom: '16px',
          color: '#374151'
        }}>
          Test de validation en temps réel
        </h2>
        <div style={{ 
          padding: '24px',
          backgroundColor: '#ffffff',
          borderRadius: '12px',
          border: '1px solid #e5e7eb'
        }}>
          <p style={{ marginBottom: '16px', color: '#6b7280', fontSize: '14px' }}>
            Remplissez les champs ci-dessus et observez :
          </p>
          <ul style={{ 
            paddingLeft: '20px', 
            color: '#374151', 
            fontSize: '14px',
            lineHeight: '1.8'
          }}>
            <li>Les champs requis affichent une <span style={{ color: '#DC2626' }}>*</span> rouge</li>
            <li>Les erreurs s'affichent avec une icône et une bordure rouge</li>
            <li>Le helper text disparaît quand il y a une erreur</li>
            <li>Le compteur de caractères passe au rouge si dépassement</li>
            <li>Le bouton "loading" s'affiche pendant la soumission</li>
            <li>Le formulaire se réinitialise après succès</li>
          </ul>
        </div>
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
        <strong style={{ color: '#111827' }}>✅ Checklist react-hook-form :</strong>
        <ul style={{ marginTop: '8px', paddingLeft: '20px' }}>
          <li>✅ register() fonctionne avec spread props</li>
          <li>✅ errors.field?.message s'affiche correctement</li>
          <li>✅ required validation native</li>
          <li>✅ pattern validation (email, phone, url)</li>
          <li>✅ minLength / maxLength validation</li>
          <li>✅ formState.isSubmitting pour loading button</li>
          <li>✅ reset() réinitialise tous les champs</li>
          <li>✅ handleSubmit() déclenche onSubmit</li>
        </ul>
      </div>
    </div>
  )
}
