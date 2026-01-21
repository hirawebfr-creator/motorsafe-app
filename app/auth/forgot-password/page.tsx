'use client'

import { useState } from 'react'
import Link from 'next/link'
import { FormField } from '@/components/shared/form-field'
import { Button } from '@/components/shared/button'
import { useToast } from '@/components/shared/use-toast'
import { Shield, Mail, ArrowLeft, CheckCircle } from 'lucide-react'

// ============================================================================
// FORGOT PASSWORD PAGE
// ============================================================================

export default function ForgotPasswordPage() {
  const toast = useToast()

  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)

  // --------------------------------------------------------------------------
  // Validation
  // --------------------------------------------------------------------------
  const validateEmail = (): boolean => {
    if (!email) {
      setError("L'email est requis")
      return false
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Format d'email invalide")
      return false
    }
    setError('')
    return true
  }

  // --------------------------------------------------------------------------
  // Submit handler
  // --------------------------------------------------------------------------
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateEmail()) return

    setIsLoading(true)
    setError('')

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })

      const data = await response.json()

      if (data.ok) {
        setIsSuccess(true)
        toast.success(
          'Email envoyé',
          'Vérifiez votre boîte de réception'
        )
      } else {
        // On ne révèle pas si l'email existe ou non pour des raisons de sécurité
        // On affiche toujours un succès
        setIsSuccess(true)
        toast.success(
          'Email envoyé',
          'Si un compte existe, vous recevrez un email'
        )
      }
    } catch {
      toast.error('Erreur', 'Impossible de se connecter au serveur')
    } finally {
      setIsLoading(false)
    }
  }

  // --------------------------------------------------------------------------
  // Resend handler
  // --------------------------------------------------------------------------
  const handleResend = async () => {
    setIsLoading(true)

    try {
      await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })

      toast.success('Email renvoyé', 'Vérifiez votre boîte de réception')
    } catch {
      toast.error('Erreur', 'Impossible de renvoyer l\'email')
    } finally {
      setIsLoading(false)
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
                backgroundColor: isSuccess ? '#DCFCE7' : '#0A1628',
                borderRadius: '16px',
                marginBottom: '16px',
              }}
            >
              {isSuccess ? (
                <CheckCircle size={32} style={{ color: '#16A34A' }} />
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
              {isSuccess ? 'Email envoyé !' : 'Mot de passe oublié ?'}
            </h1>

            <p
              style={{
                fontSize: '15px',
                color: '#6B7280',
                margin: 0,
                lineHeight: 1.6,
              }}
            >
              {isSuccess
                ? `Nous avons envoyé un lien de réinitialisation à ${email}`
                : 'Entrez votre email pour recevoir un lien de réinitialisation'}
            </p>
          </div>

          {/* Success State */}
          {isSuccess ? (
            <div>
              {/* Success message */}
              <div
                style={{
                  padding: '16px',
                  backgroundColor: '#F0FDF4',
                  border: '1px solid #BBF7D0',
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
                  <Mail
                    size={20}
                    style={{ color: '#16A34A', flexShrink: 0, marginTop: '2px' }}
                  />
                  <div>
                    <div
                      style={{
                        fontSize: '14px',
                        fontWeight: 600,
                        color: '#166534',
                        marginBottom: '4px',
                      }}
                    >
                      Vérifiez votre boîte de réception
                    </div>
                    <div
                      style={{
                        fontSize: '13px',
                        color: '#15803D',
                        lineHeight: 1.5,
                      }}
                    >
                      Cliquez sur le lien dans l'email pour réinitialiser votre
                      mot de passe. Le lien expire dans 1 heure.
                    </div>
                  </div>
                </div>
              </div>

              {/* Resend button */}
              <Button
                type="button"
                variant="secondary"
                size="lg"
                fullWidth
                onClick={handleResend}
                disabled={isLoading}
                loading={isLoading}
              >
                {isLoading ? 'Envoi...' : "Renvoyer l'email"}
              </Button>

              {/* Spam notice */}
              <p
                style={{
                  fontSize: '13px',
                  color: '#9CA3AF',
                  textAlign: 'center',
                  marginTop: '16px',
                  margin: '16px 0 0 0',
                }}
              >
                Pas reçu ? Vérifiez vos spams ou{' '}
                <button
                  type="button"
                  onClick={() => setIsSuccess(false)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#0A1628',
                    fontWeight: 500,
                    cursor: 'pointer',
                    padding: 0,
                    textDecoration: 'underline',
                  }}
                >
                  essayez une autre adresse
                </button>
              </p>
            </div>
          ) : (
            /* Form */
            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: '24px' }}>
                <FormField
                  label="Email"
                  type="email"
                  name="email"
                  placeholder="vous@garage.fr"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value)
                    if (error) setError('')
                  }}
                  error={error}
                  disabled={isLoading}
                  required
                  leftIcon={<Mail size={18} />}
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
                {isLoading ? 'Envoi...' : 'Envoyer le lien'}
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
