'use client'

import React, { useState } from 'react'

// ============================================================================
// TYPES
// ============================================================================

interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  variant?: 'default' | 'error' | 'success'
  size?: 'sm' | 'md' | 'lg'
  fullWidth?: boolean
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
  label?: string
  helperText?: string
  errorText?: string
  showCharCount?: boolean
}

// ============================================================================
// DESIGN TOKENS (hardcoded)
// ============================================================================

const COLORS = {
  bgWhite: '#FFFFFF',
  bgGrayLight: '#F9FAFB',
  borderDefault: '#E5E7EB',
  borderHover: '#9CA3AF',
  borderFocus: '#0A1628',
  borderError: '#DC2626',
  borderSuccess: '#16A34A',
  textPrimary: '#111827',
  textSecondary: '#6B7280',
  textError: '#DC2626',
  textSuccess: '#16A34A',
  placeholder: '#9CA3AF',
}

const SIZES = {
  sm: { height: '36px', paddingX: '12px', fontSize: '14px' },
  md: { height: '40px', paddingX: '14px', fontSize: '14px' },
  lg: { height: '44px', paddingX: '16px', fontSize: '16px' },
}

const SHADOWS = {
  focusDefault: '0 0 0 3px rgba(10, 22, 40, 0.1)',
  focusError: '0 0 0 3px rgba(220, 38, 38, 0.1)',
  focusSuccess: '0 0 0 3px rgba(22, 163, 74, 0.1)',
}

// ============================================================================
// INPUT COMPONENT
// ============================================================================

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      variant = 'default',
      size = 'md',
      fullWidth = false,
      leftIcon,
      rightIcon,
      label,
      helperText,
      errorText,
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
    const [isHovered, setIsHovered] = useState(false)
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

    // Get border color based on variant and state
    const getBorderColor = (): string => {
      if (disabled) return COLORS.borderDefault
      
      if (variant === 'error') return COLORS.borderError
      if (variant === 'success') return COLORS.borderSuccess
      
      if (isFocused) return COLORS.borderFocus
      if (isHovered) return COLORS.borderHover
      
      return COLORS.borderDefault
    }

    // Get box shadow based on variant and focus
    const getBoxShadow = (): string => {
      if (!isFocused || disabled) return 'none'
      
      if (variant === 'error') return SHADOWS.focusError
      if (variant === 'success') return SHADOWS.focusSuccess
      
      return SHADOWS.focusDefault
    }

    // Calculate padding with icons
    const getPaddingLeft = (): string => {
      if (leftIcon) return '40px'
      return sizeStyles.paddingX
    }

    const getPaddingRight = (): string => {
      if (rightIcon) return '40px'
      return sizeStyles.paddingX
    }

    // Input styles
    const inputStyles: React.CSSProperties = {
      width: '100%',
      height: sizeStyles.height,
      padding: `0 ${getPaddingRight()} 0 ${getPaddingLeft()}`,
      fontSize: sizeStyles.fontSize,
      fontFamily: 'inherit',
      color: disabled ? COLORS.placeholder : COLORS.textPrimary,
      backgroundColor: disabled ? COLORS.bgGrayLight : COLORS.bgWhite,
      border: `1px solid ${getBorderColor()}`,
      borderRadius: '8px',
      outline: 'none',
      boxShadow: getBoxShadow(),
      transition: 'all 0.2s ease',
      cursor: disabled ? 'not-allowed' : 'text',
      opacity: disabled ? 0.6 : 1,
      ...style,
    }

    // Icon container base styles
    const iconBaseStyles: React.CSSProperties = {
      position: 'absolute',
      top: '50%',
      transform: 'translateY(-50%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: disabled ? COLORS.placeholder : COLORS.textSecondary,
      pointerEvents: 'none',
    }

    // Determine if character count should show warning
    const isOverLimit = maxLength !== undefined && charCount > maxLength

    return (
      <div
        style={{
          width: fullWidth ? '100%' : 'auto',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Label */}
        {label && (
          <label
            style={{
              fontSize: '14px',
              fontWeight: 500,
              color: COLORS.textPrimary,
              marginBottom: '6px',
              display: 'block',
            }}
          >
            {label}
          </label>
        )}

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
            style={inputStyles}
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
            onMouseEnter={() => !disabled && setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            disabled={disabled}
            maxLength={maxLength}
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

        {/* Helper/Error text and Character count */}
        {(errorText || helperText || (showCharCount && maxLength !== undefined)) && (
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginTop: '4px',
              gap: '8px',
            }}
          >
            {/* Error or Helper text */}
            {(errorText || helperText) && (
              <span
                style={{
                  fontSize: '12px',
                  color: errorText ? COLORS.textError : COLORS.textSecondary,
                  flex: 1,
                }}
              >
                {errorText || helperText}
              </span>
            )}

            {/* Character count */}
            {showCharCount && maxLength !== undefined && (
              <span
                style={{
                  fontSize: '12px',
                  color: isOverLimit ? COLORS.textError : COLORS.textSecondary,
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

Input.displayName = 'Input'

export default Input
