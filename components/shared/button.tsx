'use client'

import React, { useState } from 'react'

// ============================================================================
// TYPES
// ============================================================================

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'success'
  size?: 'sm' | 'md' | 'lg'
  fullWidth?: boolean
  loading?: boolean
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
  children: React.ReactNode
}

// ============================================================================
// DESIGN TOKENS (hardcoded)
// ============================================================================

const COLORS = {
  primary: '#0A1628',
  primaryHover: '#1a2638',
  secondary: '#FFFFFF',
  secondaryHover: '#F9FAFB',
  ghost: 'transparent',
  ghostHover: '#F9FAFB',
  ghostActive: '#E5E7EB',
  danger: '#DC2626',
  dangerHover: '#B91C1C',
  success: '#16A34A',
  successHover: '#15803D',
  textWhite: '#FFFFFF',
  textPrimary: '#0A1628',
  borderGray: '#E5E7EB',
}

const SIZES = {
  sm: { paddingX: '12px', paddingY: '8px', fontSize: '14px', lineHeight: '20px' },
  md: { paddingX: '16px', paddingY: '10px', fontSize: '14px', lineHeight: '20px' },
  lg: { paddingX: '20px', paddingY: '12px', fontSize: '16px', lineHeight: '24px' },
}

const SHADOWS = {
  rest: '0 1px 2px 0 rgba(0,0,0,0.05)',
  hover: '0 4px 6px -1px rgba(0,0,0,0.1)',
}

// ============================================================================
// SPINNER COMPONENT
// ============================================================================

function Spinner() {
  return (
    <>
      <style>{`
        @keyframes ms-button-spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
      <svg
        style={{
          width: '16px',
          height: '16px',
          marginRight: '8px',
          animation: 'ms-button-spin 1s linear infinite',
        }}
        viewBox="0 0 24 24"
      >
        <circle
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
          fill="none"
          style={{ opacity: 0.25 }}
        />
        <circle
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
          fill="none"
          strokeDasharray="32"
          strokeDashoffset="8"
          strokeLinecap="round"
        />
      </svg>
    </>
  )
}

// ============================================================================
// BUTTON COMPONENT
// ============================================================================

export function Button({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  loading = false,
  leftIcon,
  rightIcon,
  children,
  disabled,
  style,
  ...props
}: ButtonProps) {
  const [isHovered, setIsHovered] = useState(false)
  const [isActive, setIsActive] = useState(false)

  const isDisabled = disabled || loading

  // Get size styles
  const sizeStyles = SIZES[size]

  // Get variant base styles
  const getVariantStyles = (): React.CSSProperties => {
    const base: React.CSSProperties = {
      transition: 'all 0.2s ease',
      borderRadius: '8px',
      boxShadow: SHADOWS.rest,
    }

    switch (variant) {
      case 'primary':
        return {
          ...base,
          backgroundColor: isHovered && !isDisabled ? COLORS.primaryHover : COLORS.primary,
          color: COLORS.textWhite,
          border: 'none',
        }
      case 'secondary':
        return {
          ...base,
          backgroundColor: isHovered && !isDisabled ? COLORS.secondaryHover : COLORS.secondary,
          color: COLORS.textPrimary,
          border: `1px solid ${COLORS.borderGray}`,
        }
      case 'ghost':
        return {
          ...base,
          backgroundColor: isActive && !isDisabled 
            ? COLORS.ghostActive 
            : (isHovered && !isDisabled ? COLORS.ghostHover : COLORS.ghost),
          color: COLORS.textPrimary,
          border: 'none',
          boxShadow: 'none',
        }
      case 'danger':
        return {
          ...base,
          backgroundColor: isHovered && !isDisabled ? COLORS.dangerHover : COLORS.danger,
          color: COLORS.textWhite,
          border: 'none',
        }
      case 'success':
        return {
          ...base,
          backgroundColor: isHovered && !isDisabled ? COLORS.successHover : COLORS.success,
          color: COLORS.textWhite,
          border: 'none',
        }
      default:
        return base
    }
  }

  // Get hover/active transform and shadow
  const getInteractionStyles = (): React.CSSProperties => {
    if (isDisabled) return {}
    
    if (variant === 'ghost') {
      return {} // Ghost doesn't have transform/shadow effects
    }

    if (isActive) {
      return {
        transform: 'translateY(0)',
        boxShadow: SHADOWS.rest,
      }
    }

    if (isHovered) {
      return {
        transform: 'translateY(-1px)',
        boxShadow: SHADOWS.hover,
      }
    }

    return {}
  }

  // Get disabled styles
  const getDisabledStyles = (): React.CSSProperties => {
    if (!isDisabled) return {}
    return {
      opacity: loading ? 0.7 : 0.5,
      cursor: 'not-allowed',
      pointerEvents: 'none' as const,
    }
  }

  // Combine all styles
  const buttonStyles: React.CSSProperties = {
    display: fullWidth ? 'flex' : 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: fullWidth ? '100%' : 'auto',
    padding: `${sizeStyles.paddingY} ${sizeStyles.paddingX}`,
    fontSize: sizeStyles.fontSize,
    lineHeight: sizeStyles.lineHeight,
    fontWeight: 500,
    fontFamily: 'inherit',
    cursor: isDisabled ? 'not-allowed' : 'pointer',
    outline: 'none',
    ...getVariantStyles(),
    ...getInteractionStyles(),
    ...getDisabledStyles(),
    ...style,
  }

  return (
    <button
      style={buttonStyles}
      onMouseEnter={() => !isDisabled && setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false)
        setIsActive(false)
      }}
      onMouseDown={() => !isDisabled && setIsActive(true)}
      onMouseUp={() => setIsActive(false)}
      disabled={isDisabled}
      {...props}
    >
      {loading && <Spinner />}
      {!loading && leftIcon && (
        <span style={{ marginRight: '8px', display: 'inline-flex', alignItems: 'center' }}>
          {leftIcon}
        </span>
      )}
      {children}
      {rightIcon && (
        <span style={{ marginLeft: '8px', display: 'inline-flex', alignItems: 'center' }}>
          {rightIcon}
        </span>
      )}
    </button>
  )
}

export default Button
