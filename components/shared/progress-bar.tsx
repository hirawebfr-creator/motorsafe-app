'use client'

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

interface ProgressBarProps {
  value: number // 0-100
  max?: number
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info'
  size?: 'sm' | 'md' | 'lg'
  showLabel?: boolean
  label?: string
  showPercentage?: boolean
  animate?: boolean
  striped?: boolean
  indeterminate?: boolean
}

// ─────────────────────────────────────────────────────────────
// Design Tokens
// ─────────────────────────────────────────────────────────────

const TRACK_COLOR = '#E5E7EB'

const FILL_COLORS = {
  default: '#0A1628',
  success: '#16A34A',
  warning: '#F59E0B',
  error: '#DC2626',
  info: '#3B82F6',
} as const

const SIZES = {
  sm: 6,
  md: 8,
  lg: 12,
} as const

// ─────────────────────────────────────────────────────────────
// ProgressBar Component
// ─────────────────────────────────────────────────────────────

export function ProgressBar({
  value,
  max = 100,
  variant = 'default',
  size = 'md',
  showLabel = false,
  label,
  showPercentage = false,
  animate = true,
  striped = false,
  indeterminate = false,
}: ProgressBarProps) {
  // Calculate percentage (clamped 0-100)
  const percentage = indeterminate
    ? 100
    : Math.min(Math.max((value / max) * 100, 0), 100)

  const fillColor = FILL_COLORS[variant]
  const height = SIZES[size]

  // ─────────────────────────────────────────────────────────────
  // Striped pattern
  // ─────────────────────────────────────────────────────────────

  const stripedGradient = `linear-gradient(
    45deg,
    rgba(255, 255, 255, 0.15) 25%,
    transparent 25%,
    transparent 50%,
    rgba(255, 255, 255, 0.15) 50%,
    rgba(255, 255, 255, 0.15) 75%,
    transparent 75%,
    transparent
  )`

  // ─────────────────────────────────────────────────────────────
  // Keyframes CSS
  // ─────────────────────────────────────────────────────────────

  const keyframesStyle = `
    @keyframes progress-striped-move {
      0% {
        background-position: 0 0;
      }
      100% {
        background-position: 1rem 0;
      }
    }
    
    @keyframes progress-indeterminate {
      0% {
        left: -40%;
      }
      100% {
        left: 100%;
      }
    }
  `

  // ─────────────────────────────────────────────────────────────
  // Fill styles
  // ─────────────────────────────────────────────────────────────

  const getFillStyles = (): React.CSSProperties => {
    const baseStyles: React.CSSProperties = {
      height: '100%',
      backgroundColor: fillColor,
      borderRadius: '12px',
    }

    if (indeterminate) {
      return {
        ...baseStyles,
        position: 'absolute',
        width: '40%',
        animation: 'progress-indeterminate 1.5s ease-in-out infinite',
      }
    }

    return {
      ...baseStyles,
      position: 'relative',
      width: `${percentage}%`,
      transition: animate ? 'width 0.3s ease' : 'none',
      backgroundImage: striped ? stripedGradient : 'none',
      backgroundSize: striped ? '1rem 1rem' : 'auto',
      animation: striped ? 'progress-striped-move 1s linear infinite' : 'none',
    }
  }

  // ─────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────

  return (
    <div style={{ width: '100%' }}>
      {/* Keyframes */}
      {(striped || indeterminate) && (
        <style dangerouslySetInnerHTML={{ __html: keyframesStyle }} />
      )}

      {/* Label / Percentage header */}
      {(showLabel || showPercentage) && (
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '8px',
          }}
        >
          {showLabel && (
            <span
              style={{
                fontSize: '14px',
                fontWeight: 500,
                color: '#111827',
              }}
            >
              {label || 'Progression'}
            </span>
          )}
          {showPercentage && !indeterminate && (
            <span
              style={{
                fontSize: '14px',
                fontWeight: 600,
                color: '#6B7280',
              }}
            >
              {Math.round(percentage)}%
            </span>
          )}
        </div>
      )}

      {/* Progress track */}
      <div
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={max}
        aria-valuenow={indeterminate ? undefined : value}
        aria-label={label || 'Progression'}
        style={{
          position: 'relative',
          width: '100%',
          height: `${height}px`,
          backgroundColor: TRACK_COLOR,
          borderRadius: '12px',
          overflow: 'hidden',
        }}
      >
        {/* Progress fill */}
        <div style={getFillStyles()} />
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// Export types
// ─────────────────────────────────────────────────────────────

export type { ProgressBarProps }
