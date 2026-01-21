'use client'

import React, { useState } from 'react'

// ============================================================================
// TYPES
// ============================================================================

interface FormFieldProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label: string
  name: string
  error?: string
  helperText?: string
  required?: boolean
  size?: 'sm' | 'md' | 'lg'
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
  fullWidth?: boolean
  showCharCount?: boolean
}

// ============================================================================
// DESIGN TOKENS (hardcoded)
// ============================================================================

const COLORS = {
  labelColor: '#111827',
  labelRequired: '#DC2626',
  errorColor: '#DC2626',
  helperColor: '#6B7280',
  borderDefault: '#E5E7EB',
  borderFocus: '#0A1628',
  borderError: '#DC2626',
  bgWhite: '#FFFFFF',
  bgDisabled: '#F9FAFB',
  textPrimary: '#111827',
  iconColor: '#6B7280',
}

const SIZES = {
  sm: { height: '36px', paddingX: '12px', fontSize: '14px' },
  md: { height: '40px', paddingX: '14px', fontSize: '14px' },
  lg: { height: '44px', paddingX: '16px', fontSize: '16px' },
}

const SHADOWS = {
  focusDefault: '0 0 0 3px rgba(10, 22, 40, 0.1)',
  focusError: '0 0 0 3px rgba(220, 38, 38, 0.1)',
}

// ============================================================================
// ERROR ICON (inline SVG)
// ============================================================================

function ErrorIcon() {
  return (
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
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  )
}

// ============================================================================
// FORM FIELD COMPONENT
// ============================================================================

export const FormField = React.forwardRef<HTMLInputElement, FormFieldProps>(
  (
    {
      label,
      name,
      error,
      helperText,
      required = false,
      size = 'md',
      leftIcon,
      rightIcon,
      fullWidth = false,
      showCharCount = false,
      maxLength,
      disabled,
      value,
      defaultValue,
      onChange,
      style,
      ...props
    },
    ref
  ) => {
    const [isFocused, setIsFocused] = useState(false)
    const [internalValue, setInternalValue] = useState(defaultValue?.toString() || '')

    // Track value for character count
    const currentValue = value !== undefined ? value.toString() : internalValue
    const charCount = currentValue.length

    // Handle change for internal tracking
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (value === undefined) {
        setInternalValue(e.target.value)
      }
      onChange?.(e)
    }

    // Get size styles
    const sizeStyles = SIZES[size]

    // Calculate padding with icons
    const getPaddingLeft = (): string => {
      if (leftIcon) return '40px'
      return sizeStyles.paddingX
    }

    const getPaddingRight = (): string => {
      if (rightIcon) return '40px'
      return sizeStyles.paddingX
    }

    // Get border color based on state
    const getBorderColor = (): string => {
      if (disabled) return COLORS.borderDefault
      if (error) return COLORS.borderError
      if (isFocused) return COLORS.borderFocus
      return COLORS.borderDefault
    }

    // Get box shadow based on state
    const getBoxShadow = (): string => {
      if (!isFocused || disabled) return 'none'
      if (error) return SHADOWS.focusError
      return SHADOWS.focusDefault
    }

    // Check if over character limit
    const isOverLimit = maxLength !== undefined && charCount > maxLength

    // Icon container base styles
    const iconBaseStyles: React.CSSProperties = {
      position: 'absolute',
      top: '50%',
      transform: 'translateY(-50%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: COLORS.iconColor,
      pointerEvents: 'none',
      zIndex: 1,
    }

    return (
      <div
        style={{
          width: fullWidth ? '100%' : 'auto',
          display: 'flex',
          flexDirection: 'column',
          marginBottom: '20px',
        }}
      >
        {/* Label with required indicator */}
        <label
          htmlFor={name}
          style={{
            fontSize: '14px',
            fontWeight: 500,
            color: COLORS.labelColor,
            marginBottom: '6px',
            display: 'flex',
            alignItems: 'center',
          }}
        >
          {label}
          {required && (
            <span
              style={{
                color: COLORS.labelRequired,
                marginLeft: '4px',
                fontSize: '14px',
              }}
            >
              *
            </span>
          )}
        </label>

        {/* Input container */}
        <div style={{ position: 'relative', width: '100%' }}>
          {/* Left icon */}
          {leftIcon && (
            <div
              style={{
                ...iconBaseStyles,
                left: '12px',
              }}
            >
              {leftIcon}
            </div>
          )}

          {/* Input */}
          <input
            ref={ref}
            id={name}
            name={name}
            required={required}
            maxLength={maxLength}
            value={value}
            defaultValue={defaultValue}
            onChange={handleChange}
            onFocus={(e) => {
              setIsFocused(true)
              props.onFocus?.(e)
            }}
            onBlur={(e) => {
              setIsFocused(false)
              props.onBlur?.(e)
            }}
            disabled={disabled}
            style={{
              width: '100%',
              height: sizeStyles.height,
              paddingLeft: getPaddingLeft(),
              paddingRight: getPaddingRight(),
              paddingTop: '0',
              paddingBottom: '0',
              fontSize: sizeStyles.fontSize,
              fontFamily: 'inherit',
              color: COLORS.textPrimary,
              backgroundColor: disabled ? COLORS.bgDisabled : COLORS.bgWhite,
              border: `1px solid ${getBorderColor()}`,
              borderRadius: '8px',
              outline: 'none',
              transition: 'all 0.2s ease',
              cursor: disabled ? 'not-allowed' : 'text',
              opacity: disabled ? 0.6 : 1,
              boxShadow: getBoxShadow(),
              ...style,
            }}
            {...props}
          />

          {/* Right icon */}
          {rightIcon && (
            <div
              style={{
                ...iconBaseStyles,
                right: '12px',
              }}
            >
              {rightIcon}
            </div>
          )}
        </div>

        {/* Footer: Error / Helper text + Character count */}
        {(error || helperText || (showCharCount && maxLength !== undefined)) && (
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginTop: '4px',
              minHeight: '16px',
            }}
          >
            {/* Error or Helper text */}
            {error ? (
              <span
                style={{
                  fontSize: '12px',
                  color: COLORS.errorColor,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <ErrorIcon />
                {error}
              </span>
            ) : helperText ? (
              <span
                style={{
                  fontSize: '12px',
                  color: COLORS.helperColor,
                }}
              >
                {helperText}
              </span>
            ) : (
              <span />
            )}

            {/* Character count */}
            {showCharCount && maxLength !== undefined && (
              <span
                style={{
                  fontSize: '12px',
                  color: isOverLimit ? COLORS.errorColor : COLORS.helperColor,
                  marginLeft: 'auto',
                  whiteSpace: 'nowrap',
                }}
              >
                {charCount} / {maxLength}
              </span>
            )}
          </div>
        )}
      </div>
    )
  }
)

FormField.displayName = 'FormField'

export default FormField
