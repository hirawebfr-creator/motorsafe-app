'use client'

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

interface BadgeProps {
  children: React.ReactNode
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info' | 'neutral'
  size?: 'sm' | 'md' | 'lg'
  rounded?: boolean
  dot?: boolean
  removable?: boolean
  onRemove?: () => void
}

// ─────────────────────────────────────────────────────────────
// Color Tokens
// ─────────────────────────────────────────────────────────────

const getColors = (variant: BadgeProps['variant']) => {
  switch (variant) {
    case 'success':
      return {
        bg: '#DCFCE7',
        text: '#166534',
        border: '#BBF7D0',
        dot: '#16A34A',
      }
    case 'warning':
      return {
        bg: '#FEF3C7',
        text: '#92400E',
        border: '#FDE68A',
        dot: '#F59E0B',
      }
    case 'error':
      return {
        bg: '#FEE2E2',
        text: '#991B1B',
        border: '#FECACA',
        dot: '#DC2626',
      }
    case 'info':
      return {
        bg: '#DBEAFE',
        text: '#1E40AF',
        border: '#BFDBFE',
        dot: '#3B82F6',
      }
    case 'neutral':
      return {
        bg: '#F9FAFB',
        text: '#6B7280',
        border: '#E5E7EB',
        dot: '#9CA3AF',
      }
    default:
      return {
        bg: '#F3F4F6',
        text: '#374151',
        border: '#E5E7EB',
        dot: '#6B7280',
      }
  }
}

// ─────────────────────────────────────────────────────────────
// Size Tokens
// ─────────────────────────────────────────────────────────────

const SIZES = {
  sm: { height: 20, paddingX: 8, fontSize: 11 },
  md: { height: 24, paddingX: 10, fontSize: 12 },
  lg: { height: 28, paddingX: 12, fontSize: 13 },
} as const

// ─────────────────────────────────────────────────────────────
// Badge Component
// ─────────────────────────────────────────────────────────────

export function Badge({
  children,
  variant = 'default',
  size = 'md',
  rounded = false,
  dot = false,
  removable = false,
  onRemove,
}: BadgeProps) {
  const colors = getColors(variant)
  const dimensions = SIZES[size]

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        height: `${dimensions.height}px`,
        padding: `0 ${dimensions.paddingX}px`,
        fontSize: `${dimensions.fontSize}px`,
        fontWeight: 500,
        lineHeight: 1,
        color: colors.text,
        backgroundColor: colors.bg,
        border: `1px solid ${colors.border}`,
        borderRadius: rounded ? `${dimensions.height / 2}px` : '6px',
        whiteSpace: 'nowrap',
        transition: 'all 0.15s ease',
      }}
    >
      {/* Dot indicator */}
      {dot && (
        <span
          style={{
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            backgroundColor: colors.dot,
            marginRight: '6px',
            flexShrink: 0,
          }}
        />
      )}

      {/* Content */}
      <span>{children}</span>

      {/* Remove button */}
      {removable && onRemove && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            onRemove()
          }}
          aria-label="Retirer"
          style={{
            marginLeft: '6px',
            padding: 0,
            width: '14px',
            height: '14px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'transparent',
            border: 'none',
            borderRadius: '50%',
            color: colors.text,
            cursor: 'pointer',
            opacity: 0.6,
            transition: 'opacity 0.15s ease',
            flexShrink: 0,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.opacity = '1'
            e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.05)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.opacity = '0.6'
            e.currentTarget.style.backgroundColor = 'transparent'
          }}
        >
          <svg
            width="10"
            height="10"
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
        </button>
      )}
    </span>
  )
}

// ─────────────────────────────────────────────────────────────
// Export types
// ─────────────────────────────────────────────────────────────

export type { BadgeProps }
