'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Shield, Mail, ArrowLeft, CheckCircle, Sparkles, ArrowRight } from 'lucide-react'

// ============================================================================
// FORGOT PASSWORD PAGE - SafeMotor
// Design moderne avec gradient
// ============================================================================

export default function ForgotPasswordPage() {
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
      await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })

      // On affiche toujours un succès pour des raisons de sécurité
      setIsSuccess(true)
    } catch {
      // Même en cas d'erreur, on affiche le succès
      setIsSuccess(true)
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
    } catch {
      // Ignore
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
        background: '#0A0A0F',
      }}
    >
      {/* Left Panel - Branding (hidden on mobile) */}
      <div
        style={{
          display: 'none',
          width: '50%',
          background: 'linear-gradient(135deg, #0A0A0F 0%, #1A1A2E 100%)',
          padding: '48px',
          position: 'relative',
          overflow: 'hidden',
        }}
        className="lg:flex lg:flex-col lg:justify-between"
      >
        {/* Decorative gradient orbs */}
        <div
          style={{
            position: 'absolute',
            top: '-100px',
            right: '-100px',
            width: '400px',
            height: '400px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(99, 102, 241, 0.3) 0%, transparent 70%)',
            filter: 'blur(60px)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: '-50px',
            left: '-50px',
            width: '300px',
            height: '300px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(139, 92, 246, 0.2) 0%, transparent 70%)',
            filter: 'blur(40px)',
          }}
        />

        {/* Logo */}
        <div style={{ position: 'relative', zIndex: 1 }}>
          <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '12px', textDecoration: 'none' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '48px',
                height: '48px',
                borderRadius: '14px',
                background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
                boxShadow: '0 8px 24px rgba(99, 102, 241, 0.4)',
              }}
            >
              <Shield size={24} color="#fff" />
            </div>
            <span style={{ fontSize: '24px', fontWeight: 700, color: '#fff' }}>SafeMotor</span>
          </Link>
        </div>

        {/* Center content */}
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 16px',
              borderRadius: '100px',
              background: 'rgba(99, 102, 241, 0.15)',
              border: '1px solid rgba(99, 102, 241, 0.3)',
              marginBottom: '24px',
            }}
          >
            <Sparkles size={16} color="#A5B4FC" />
            <span style={{ fontSize: '13px', color: '#A5B4FC', fontWeight: 500 }}>
              Sécurité renforcée
            </span>
          </div>

          <h1
            style={{
              fontSize: '42px',
              fontWeight: 800,
              color: '#fff',
              lineHeight: 1.2,
              marginBottom: '16px',
            }}
          >
            Récupérez l'accès à votre compte
          </h1>

          <p
            style={{
              fontSize: '18px',
              color: 'rgba(255, 255, 255, 0.6)',
              lineHeight: 1.6,
              maxWidth: '440px',
            }}
          >
            Entrez votre adresse email pour recevoir un lien de réinitialisation sécurisé.
          </p>
        </div>

        {/* Footer */}
        <div style={{ position: 'relative', zIndex: 1 }}>
          <p style={{ fontSize: '13px', color: 'rgba(255, 255, 255, 0.4)' }}>
            © 2026 SafeMotor · Tous droits réservés
          </p>
        </div>
      </div>

      {/* Right Panel - Form */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px',
          background: '#fff',
        }}
        className="lg:w-1/2"
      >
        <div style={{ width: '100%', maxWidth: '400px' }}>
          {/* Mobile Logo */}
          <div style={{ textAlign: 'center', marginBottom: '32px' }} className="lg:hidden">
            <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '44px',
                  height: '44px',
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
                }}
              >
                <Shield size={22} color="#fff" />
              </div>
              <span style={{ fontSize: '22px', fontWeight: 700, color: '#111827' }}>SafeMotor</span>
            </Link>
          </div>

          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '64px',
                height: '64px',
                borderRadius: '16px',
                background: isSuccess
                  ? 'linear-gradient(135deg, #10B981 0%, #059669 100%)'
                  : 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
                marginBottom: '20px',
                boxShadow: isSuccess
                  ? '0 8px 24px rgba(16, 185, 129, 0.3)'
                  : '0 8px 24px rgba(99, 102, 241, 0.3)',
              }}
            >
              {isSuccess ? (
                <CheckCircle size={28} color="#fff" />
              ) : (
                <Mail size={28} color="#fff" />
              )}
            </div>

            <h1 style={{ fontSize: '28px', fontWeight: 700, color: '#111827', marginBottom: '8px' }}>
              {isSuccess ? 'Email envoyé !' : 'Mot de passe oublié ?'}
            </h1>
            <p style={{ fontSize: '15px', color: '#6B7280', lineHeight: 1.6 }}>
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
              <button
                type="button"
                onClick={handleResend}
                disabled={isLoading}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  width: '100%',
                  height: '48px',
                  borderRadius: '12px',
                  border: '1px solid #E5E7EB',
                  background: '#fff',
                  fontSize: '15px',
                  fontWeight: 600,
                  color: '#374151',
                  cursor: isLoading ? 'wait' : 'pointer',
                  opacity: isLoading ? 0.7 : 1,
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={(e) => {
                  if (!isLoading) {
                    e.currentTarget.style.background = '#F9FAFB';
                    e.currentTarget.style.borderColor = '#D1D5DB';
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = '#fff';
                  e.currentTarget.style.borderColor = '#E5E7EB';
                }}
              >
                {isLoading ? (
                  <div
                    style={{
                      width: '20px',
                      height: '20px',
                      border: '2px solid #E5E7EB',
                      borderTopColor: '#6366F1',
                      borderRadius: '50%',
                      animation: 'spin 0.8s linear infinite',
                    }}
                  />
                ) : null}
                {isLoading ? 'Envoi...' : "Renvoyer l'email"}
              </button>

              {/* Spam notice */}
              <p
                style={{
                  fontSize: '13px',
                  color: '#9CA3AF',
                  textAlign: 'center',
                  marginTop: '16px',
                }}
              >
                Pas reçu ? Vérifiez vos spams ou{' '}
                <button
                  type="button"
                  onClick={() => setIsSuccess(false)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#6366F1',
                    fontWeight: 600,
                    cursor: 'pointer',
                    padding: 0,
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
                <label
                  style={{
                    display: 'block',
                    fontSize: '14px',
                    fontWeight: 500,
                    color: '#374151',
                    marginBottom: '6px',
                  }}
                >
                  Email
                </label>
                <div style={{ position: 'relative' }}>
                  <Mail
                    size={18}
                    color="#9CA3AF"
                    style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }}
                  />
                  <input
                    type="email"
                    placeholder="vous@garage.fr"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (error) setError('');
                    }}
                    disabled={isLoading}
                    required
                    style={{
                      width: '100%',
                      height: '48px',
                      paddingLeft: '44px',
                      paddingRight: '16px',
                      borderRadius: '12px',
                      border: error ? '1px solid #EF4444' : '1px solid #E5E7EB',
                      fontSize: '15px',
                      color: '#111827',
                      outline: 'none',
                      transition: 'border-color 0.15s ease',
                    }}
                    onFocus={(e) => (e.currentTarget.style.borderColor = '#6366F1')}
                    onBlur={(e) => (e.currentTarget.style.borderColor = error ? '#EF4444' : '#E5E7EB')}
                  />
                </div>
                {error && (
                  <p style={{ fontSize: '13px', color: '#EF4444', marginTop: '6px' }}>{error}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={isLoading}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  width: '100%',
                  height: '48px',
                  borderRadius: '12px',
                  border: 'none',
                  background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
                  fontSize: '15px',
                  fontWeight: 600,
                  color: '#fff',
                  cursor: isLoading ? 'wait' : 'pointer',
                  boxShadow: '0 4px 14px rgba(99, 102, 241, 0.4)',
                  opacity: isLoading ? 0.8 : 1,
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={(e) => {
                  if (!isLoading) e.currentTarget.style.transform = 'translateY(-1px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                {isLoading ? (
                  <div
                    style={{
                      width: '20px',
                      height: '20px',
                      border: '2px solid rgba(255,255,255,0.3)',
                      borderTopColor: '#fff',
                      borderRadius: '50%',
                      animation: 'spin 0.8s linear infinite',
                    }}
                  />
                ) : (
                  <>
                    Envoyer le lien
                    <ArrowRight size={18} />
                  </>
                )}
              </button>
            </form>
          )}

          {/* Back to login */}
          <div
            style={{
              marginTop: '32px',
              paddingTop: '24px',
              borderTop: '1px solid #E5E7EB',
              textAlign: 'center',
            }}
          >
            <Link
              href="/auth/login"
              style={{
                fontSize: '14px',
                color: '#6366F1',
                textDecoration: 'none',
                fontWeight: 600,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <ArrowLeft size={16} />
              Retour à la connexion
            </Link>
          </div>

          {/* Footer links */}
          <div
            style={{
              marginTop: '24px',
              display: 'flex',
              justifyContent: 'center',
              gap: '24px',
            }}
          >
            {[
              { label: 'CGU', href: '/cgu' },
              { label: 'Confidentialité', href: '/politique-confidentialite' },
              { label: 'Contact', href: '/contact' },
            ].map((link, i) => (
              <Link
                key={i}
                href={link.href}
                style={{ fontSize: '13px', color: '#9CA3AF', textDecoration: 'none' }}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Spin animation */}
          <style dangerouslySetInnerHTML={{ __html: `
            @keyframes spin {
              to { transform: rotate(360deg); }
            }
          `}} />
        </div>
      </div>
    </div>
  )
}
