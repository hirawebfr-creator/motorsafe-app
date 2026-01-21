'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { FormField } from '@/components/shared/form-field'
import { Button } from '@/components/shared/button'
import { useToast } from '@/components/shared/use-toast'
import { Shield, Mail, Lock, Chrome } from 'lucide-react'

// ============================================================================
// LOGIN PAGE
// ============================================================================

export default function LoginPage() {
  const router = useRouter()
  const toast = useToast()

  const [formData, setFormData] = useState({
    email: '',
    password: '',
  })

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isLoading, setIsLoading] = useState(false)

  // --------------------------------------------------------------------------
  // Validation
  // --------------------------------------------------------------------------
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    // Email validation
    if (!formData.email) {
      newErrors.email = "L'email est requis"
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Format d'email invalide"
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = 'Le mot de passe est requis'
    } else if (formData.password.length < 8) {
      newErrors.password = 'Le mot de passe doit contenir au moins 8 caractères'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // --------------------------------------------------------------------------
  // Submit handler
  // --------------------------------------------------------------------------
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) return

    setIsLoading(true)
    setErrors({})

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (response.status === 403) {
        // Account pending approval
        window.location.href = '/pro/en-attente'
        return
      }

      if (data.ok) {
        toast.success('Connexion réussie', 'Redirection vers votre tableau de bord...')

        // Redirect after success
        setTimeout(() => {
          router.push('/dashboard')
        }, 500)
      } else {
        const errorMsg =
          typeof data.error === 'string'
            ? data.error
            : data.error?.message || 'Email ou mot de passe incorrect'

        toast.error('Erreur de connexion', errorMsg)

        setErrors({
          password: errorMsg,
        })
      }
    } catch {
      toast.error('Erreur', 'Impossible de se connecter au serveur')
    } finally {
      setIsLoading(false)
    }
  }

  // --------------------------------------------------------------------------
  // OAuth handler (placeholder)
  // --------------------------------------------------------------------------
  const handleOAuthGoogle = () => {
    toast.info('Bientôt disponible', "L'authentification Google sera disponible prochainement")
  }

  // --------------------------------------------------------------------------
  // Render
  // --------------------------------------------------------------------------
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        background: 'linear-gradient(135deg, #F9FAFB 0%, #E5E7EB 100%)',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '440px',
        }}
      >
        {/* Card */}
        <div
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '16px',
            border: '1px solid #E5E7EB',
            boxShadow:
              '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
            padding: '40px',
          }}
        >
          {/* Logo + Title */}
          <div
            style={{
              textAlign: 'center',
              marginBottom: '32px',
            }}
          >
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '64px',
                height: '64px',
                backgroundColor: '#0A1628',
                borderRadius: '16px',
                marginBottom: '16px',
              }}
            >
              <Shield size={32} style={{ color: '#FFFFFF' }} />
            </div>

            <h1
              style={{
                fontSize: '28px',
                fontWeight: 700,
                color: '#111827',
                marginBottom: '8px',
                margin: '0 0 8px 0',
              }}
            >
              Connexion
            </h1>

            <p
              style={{
                fontSize: '15px',
                color: '#6B7280',
                margin: 0,
              }}
            >
              Accédez à votre espace MotorSafe
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit}>
            {/* Email */}
            <div style={{ marginBottom: '16px' }}>
              <FormField
                label="Email"
                type="email"
                name="email"
                placeholder="vous@garage.fr"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                error={errors.email}
                disabled={isLoading}
                required
                leftIcon={<Mail size={18} />}
                fullWidth
              />
            </div>

            {/* Password */}
            <div style={{ marginBottom: '8px' }}>
              <FormField
                label="Mot de passe"
                type="password"
                name="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
                error={errors.password}
                disabled={isLoading}
                required
                leftIcon={<Lock size={18} />}
                fullWidth
              />
            </div>

            {/* Forgot password link */}
            <div
              style={{
                textAlign: 'right',
                marginBottom: '24px',
              }}
            >
              <Link
                href="/auth/forgot-password"
                style={{
                  fontSize: '14px',
                  color: '#0A1628',
                  textDecoration: 'none',
                  fontWeight: 500,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.textDecoration = 'underline'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.textDecoration = 'none'
                }}
              >
                Mot de passe oublié ?
              </Link>
            </div>

            {/* Submit button */}
            <Button
              type="submit"
              variant="primary"
              size="lg"
              fullWidth
              disabled={isLoading}
              loading={isLoading}
            >
              {isLoading ? 'Connexion...' : 'Se connecter'}
            </Button>
          </form>

          {/* Divider */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
              margin: '24px 0',
            }}
          >
            <div
              style={{
                flex: 1,
                height: '1px',
                backgroundColor: '#E5E7EB',
              }}
            />
            <span
              style={{
                fontSize: '13px',
                color: '#9CA3AF',
                fontWeight: 500,
              }}
            >
              OU
            </span>
            <div
              style={{
                flex: 1,
                height: '1px',
                backgroundColor: '#E5E7EB',
              }}
            />
          </div>

          {/* OAuth Google */}
          <Button
            type="button"
            variant="secondary"
            size="lg"
            fullWidth
            onClick={handleOAuthGoogle}
            leftIcon={<Chrome size={20} />}
          >
            Continuer avec Google
          </Button>

          {/* Sign up link */}
          <div
            style={{
              marginTop: '32px',
              paddingTop: '24px',
              borderTop: '1px solid #E5E7EB',
              textAlign: 'center',
            }}
          >
            <p
              style={{
                fontSize: '14px',
                color: '#6B7280',
                margin: 0,
              }}
            >
              Pas encore de compte ?{' '}
              <Link
                href="/pro/inscription"
                style={{
                  color: '#0A1628',
                  textDecoration: 'none',
                  fontWeight: 600,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.textDecoration = 'underline'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.textDecoration = 'none'
                }}
              >
                Créer un compte
              </Link>
            </p>
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            marginTop: '24px',
            textAlign: 'center',
          }}
        >
          <p
            style={{
              fontSize: '13px',
              color: '#9CA3AF',
              margin: 0,
            }}
          >
            © 2026 MotorSafe · Tous droits réservés
          </p>
          <div
            style={{
              marginTop: '8px',
              display: 'flex',
              gap: '16px',
              justifyContent: 'center',
            }}
          >
            {[
              { label: 'CGU', href: '/cgu' },
              { label: 'Confidentialité', href: '/politique-confidentialite' },
              { label: 'Support', href: '/contact' },
            ].map((link, i) => (
              <Link
                key={i}
                href={link.href}
                style={{
                  fontSize: '13px',
                  color: '#9CA3AF',
                  textDecoration: 'none',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = '#6B7280'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = '#9CA3AF'
                }}
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
