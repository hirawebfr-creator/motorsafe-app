'use client'

import { useEffect, useState } from 'react'

// ============================================================================
// TYPES
// ============================================================================

export interface ToastProps {
  id: string
  variant?: 'success' | 'error' | 'warning' | 'info'
  title: string
  description?: string
  duration?: number
  onClose: (id: string) => void
  isVisible: boolean
}

// ============================================================================
// COLOR SCHEMES
// ============================================================================

const COLORS = {
  success: {
    bg: '#F0FDF4',
    border: '#16A34A',
    icon: '#16A34A',
    title: '#166534',
    description: '#15803D',
  },
  error: {
    bg: '#FEF2F2',
    border: '#DC2626',
    icon: '#DC2626',
    title: '#991B1B',
    description: '#B91C1C',
  },
  warning: {
    bg: '#FFFBEB',
    border: '#F59E0B',
    icon: '#F59E0B',
    title: '#92400E',
    description: '#B45309',
  },
  info: {
    bg: '#EFF6FF',
    border: '#3B82F6',
    icon: '#3B82F6',
    title: '#1E40AF',
    description: '#2563EB',
  },
}

// ============================================================================
// ICONS
// ============================================================================

const SuccessIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
    <polyline points="22 4 12 14.01 9 11.01" />
  </svg>
)

const ErrorIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="12" cy="12" r="10" />
    <line x1="15" y1="9" x2="9" y2="15" />
    <line x1="9" y1="9" x2="15" y2="15" />
  </svg>
)

const WarningIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
    <line x1="12" y1="9" x2="12" y2="13" />
    <line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
)

const InfoIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="16" x2="12" y2="12" />
    <line x1="12" y1="8" x2="12.01" y2="8" />
  </svg>
)

const CloseIcon = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
)

const ICONS = {
  success: <SuccessIcon />,
  error: <ErrorIcon />,
  warning: <WarningIcon />,
  info: <InfoIcon />,
}

// ============================================================================
// TOAST COMPONENT
// ============================================================================

export function Toast({
  id,
  variant = 'info',
  title,
  description,
  duration = 5000,
  onClose,
  isVisible,
}: ToastProps) {
  const [isAnimating, setIsAnimating] = useState(false)
  const [closeHovered, setCloseHovered] = useState(false)

  // Animation d'entrée
  useEffect(() => {
    if (isVisible) {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setIsAnimating(true)
        })
      })
    }
  }, [isVisible])

  // Auto-dismiss après duration
  useEffect(() => {
    if (!isVisible || duration === 0) return

    const timer = setTimeout(() => {
      handleClose()
    }, duration)

    return () => clearTimeout(timer)
  }, [isVisible, duration])

  const handleClose = () => {
    setIsAnimating(false)
    setTimeout(() => {
      onClose(id)
    }, 200) // Durée animation exit
  }

  const colors = COLORS[variant]
  const Icon = ICONS[variant]

  return (
    <div
      role="alert"
      aria-live="polite"
      style={{
        width: '380px',
        minHeight: '64px',
        padding: '16px',
        backgroundColor: colors.bg,
        borderLeft: `3px solid ${colors.border}`,
        borderRadius: '8px',
        boxShadow:
          '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        display: 'flex',
        alignItems: 'flex-start',
        gap: '12px',
        transform: isAnimating ? 'translateX(0)' : 'translateX(100%)',
        opacity: isAnimating ? 1 : 0,
        transition: isAnimating
          ? 'transform 300ms ease-out, opacity 300ms ease-out'
          : 'transform 200ms ease-in, opacity 200ms ease-in',
      }}
    >
      {/* Icon */}
      <div
        style={{
          flexShrink: 0,
          color: colors.icon,
          display: 'flex',
          alignItems: 'center',
          marginTop: '2px',
        }}
      >
        {Icon}
      </div>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: '14px',
            fontWeight: 600,
            color: colors.title,
            marginBottom: description ? '4px' : 0,
            lineHeight: '20px',
          }}
        >
          {title}
        </div>
        {description && (
          <div
            style={{
              fontSize: '13px',
              color: colors.description,
              lineHeight: '18px',
            }}
          >
            {description}
          </div>
        )}
      </div>

      {/* Close button */}
      <button
        type="button"
        onClick={handleClose}
        aria-label="Fermer"
        onMouseEnter={() => setCloseHovered(true)}
        onMouseLeave={() => setCloseHovered(false)}
        style={{
          flexShrink: 0,
          width: '20px',
          height: '20px',
          padding: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'transparent',
          border: 'none',
          borderRadius: '4px',
          color: colors.title,
          cursor: 'pointer',
          opacity: closeHovered ? 1 : 0.6,
          transition: 'opacity 0.15s ease',
        }}
      >
        <CloseIcon />
      </button>
    </div>
  )
}

export default Toast
