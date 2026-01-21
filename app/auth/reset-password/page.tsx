'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { FormField } from '@/components/shared/form-field'
import { Button } from '@/components/shared/button'
import { useToast } from '@/components/shared/use-toast'
import { Shield, Lock, AlertCircle, ArrowLeft } from 'lucide-react'

// ============================================================================
// RESET PASSWORD CONTENT (needs Suspense for useSearchParams)
// ============================================================================

function ResetPasswordContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const toast = useToast()

  const [token, setToken] = useState<string | null>(null)
  const [tokenValid, setTokenValid] = useState<boolean | null>(null)
  const [isCheckingToken, setIsCheckingToken] = useState(true)

  const [formData, setFormData] = useState({
    password: '',
    passwordConfirm: '',
  })

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isLoading, setIsLoading] = useState(false)

  // --------------------------------------------------------------------------
  // Verify token on load
  // --------------------------------------------------------------------------
  useEffect(() => {
    const tokenParam = searchParams.get('token')

    if (!tokenParam) {
      setTokenValid(false)
      setIsCheckingToken(false)
      return
    }

    setToken(tokenParam)

    // Verify token with API
    fetch(`/api/auth/verify-reset-token?token=${tokenParam}`)
      .then((res) => res.json())
      .then((data) => {
        setTokenValid(data.ok)
        setIsCheckingToken(false)
      })
      .catch(() => {
        setTokenValid(false)
        setIsCheckingToken(false)
      })
  }, [searchParams])

  // --------------------------------------------------------------------------
  // Validation
  // --------------------------------------------------------------------------
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.password) {
      newErrors.password = 'Le mot de passe est requis'
    } else if (formData.password.length < 8) {
      newErrors.password = 'Minimum 8 caractères'
    } else if (!/[A-Z]/.test(formData.password)) {
      newErrors.password = 'Au moins 1 majuscule requise'
    } else if (!/[0-9]/.test(formData.password)) {
      newErrors.password = 'Au moins 1 chiffre requis'
    }

    if (!formData.passwordConfirm) {
      newErrors.passwordConfirm = 'Confirmez le mot de passe'
    } else if (formData.password !== formData.passwordConfirm) {
      newErrors.passwordConfirm = 'Les mots de passe ne correspondent pas'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // --------------------------------------------------------------------------
  // Submit handler
  // --------------------------------------------------------------------------
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm() || !token) return

    setIsLoading(true)

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          password: formData.password,
        }),
      })

      const data = await response.json()

      if (data.ok) {
        toast.success(
          'Mot de passe changé',
          'Vous pouvez maintenant vous connecter'
        )

        // Redirect to login after 1.5s
        setTimeout(() => {
          router.push('/auth/login')
        }, 1500)
      } else {
        toast.error(
          'Erreur',
          data.error || 'Impossible de changer le mot de passe'
        )
        setErrors({ password: data.error || 'Une erreur est survenue' })
      }
    } catch {
      toast.error('Erreur', 'Impossible de se connecter au serveur')
    } finally {
      setIsLoading(false)
    }
  }

  // --------------------------------------------------------------------------
  // Update form data
  // --------------------------------------------------------------------------
  const updateFormData = (field: keyof typeof formData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    // Clear error for this field
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors[field]
        return newErrors
      })
    }
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
                backgroundColor: tokenValid === false ? '#FEE2E2' : '#0A1628',
                borderRadius: '16px',
                marginBottom: '16px',
              }}
            >
              {tokenValid === false ? (
                <AlertCircle size={32} style={{ color: '#DC2626' }} />
              ) : (
                <Shield size={32} style={{ color: '#FFFFFF' }} />
              )}
            </div>

            <h1
              style={{
                fontSize: '28px',
                fontWeight: 700,
                color: '#111827',
                margin: '0 0 8px 0',
              }}
            >
              {isCheckingToken
                ? 'Vérification...'
                : tokenValid === false
                  ? 'Lien invalide'
                  : 'Nouveau mot de passe'}
            </h1>

            <p
              style={{
                fontSize: '15px',
                color: '#6B7280',
                margin: 0,
              }}
            >
              {isCheckingToken
                ? 'Vérification du lien de réinitialisation'
                : tokenValid === false
                  ? 'Ce lien est invalide ou a expiré'
                  : 'Choisissez un mot de passe sécurisé'}
            </p>
          </div>

          {/* Loading state */}
          {isCheckingToken && (
            <div
              style={{
                textAlign: 'center',
                padding: '40px 0',
              }}
            >
              <div
                style={{
                  width: '40px',
                  height: '40px',
                  margin: '0 auto',
                  border: '4px solid #E5E7EB',
                  borderTopColor: '#0A1628',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite',
                }}
              />
              <style
                dangerouslySetInnerHTML={{
                  __html: `
                    @keyframes spin {
                      to { transform: rotate(360deg); }
                    }
                  `,
                }}
              />
            </div>
          )}

          {/* Token invalid */}
          {!isCheckingToken && tokenValid === false && (
            <div>
              <div
                style={{
                  padding: '16px',
                  backgroundColor: '#FEE2E2',
                  border: '1px solid #FECACA',
                  borderRadius: '12px',
                  marginBottom: '24px',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '12px',
                  }}
                >
                  <AlertCircle
                    size={20}
                    style={{
                      color: '#DC2626',
                      flexShrink: 0,
                      marginTop: '2px',
                    }}
                  />
                  <div>
                    <div
                      style={{
                        fontSize: '14px',
                        fontWeight: 600,
                        color: '#991B1B',
                        marginBottom: '4px',
                      }}
                    >
                      Lien invalide ou expiré
                    </div>
                    <div
                      style={{
                        fontSize: '13px',
                        color: '#B91C1C',
                        lineHeight: 1.5,
                      }}
                    >
                      Ce lien de réinitialisation n'est plus valide. Demandez un
                      nouveau lien.
                    </div>
                  </div>
                </div>
              </div>

              <Link href="/auth/forgot-password">
                <Button variant="primary" size="lg" fullWidth>
                  Demander un nouveau lien
                </Button>
              </Link>
            </div>
          )}

          {/* Form (token valid) */}
          {!isCheckingToken && tokenValid === true && (
            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: '16px' }}>
                <FormField
                  label="Nouveau mot de passe"
                  type="password"
                  name="password"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) => updateFormData('password', e.target.value)}
                  error={errors.password}
                  helperText="Min. 8 caractères, 1 majuscule, 1 chiffre"
                  disabled={isLoading}
                  required
                  leftIcon={<Lock size={18} />}
                  fullWidth
                />
              </div>

              <div style={{ marginBottom: '24px' }}>
                <FormField
                  label="Confirmez le mot de passe"
                  type="password"
                  name="passwordConfirm"
                  placeholder="••••••••"
                  value={formData.passwordConfirm}
                  onChange={(e) =>
                    updateFormData('passwordConfirm', e.target.value)
                  }
                  error={errors.passwordConfirm}
                  disabled={isLoading}
                  required
                  leftIcon={<Lock size={18} />}
                  fullWidth
                />
              </div>

              <Button
                type="submit"
                variant="primary"
                size="lg"
                fullWidth
                disabled={isLoading}
                loading={isLoading}
              >
                {isLoading ? 'Changement...' : 'Changer le mot de passe'}
              </Button>
            </form>
          )}

          {/* Back to login */}
          <div
            style={{
              marginTop: '24px',
              paddingTop: '24px',
              borderTop: '1px solid #E5E7EB',
              textAlign: 'center',
            }}
          >
            <Link
              href="/auth/login"
              style={{
                fontSize: '14px',
                color: '#0A1628',
                textDecoration: 'none',
                fontWeight: 500,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.textDecoration = 'underline'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.textDecoration = 'none'
              }}
            >
              <ArrowLeft size={16} />
              Retour à la connexion
            </Link>
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
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// MAIN COMPONENT WITH SUSPENSE
// ============================================================================

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div
          style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(135deg, #F9FAFB 0%, #E5E7EB 100%)',
          }}
        >
          <div
            style={{
              width: '40px',
              height: '40px',
              border: '4px solid #E5E7EB',
              borderTopColor: '#0A1628',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
            }}
          />
          <style
            dangerouslySetInnerHTML={{
              __html: `
                @keyframes spin {
                  to { transform: rotate(360deg); }
                }
              `,
            }}
          />
        </div>
      }
    >
      <ResetPasswordContent />
    </Suspense>
  )
}
