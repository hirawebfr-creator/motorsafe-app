'use client'

import React, { useState, useRef } from 'react'

// ============================================================================
// TYPES
// ============================================================================

export interface CheckboxProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type' | 'size'> {
  label?: string
  description?: string
  error?: string
  size?: 'sm' | 'md' | 'lg'
  labelPosition?: 'right' | 'left'
}

// ============================================================================
// CONSTANTS
// ============================================================================

const SIZES = {
  sm: { box: 16, checkmark: 10 },
  md: { box: 20, checkmark: 12 },
  lg: { box: 24, checkmark: 14 },
}

const COLORS = {
  bgUnchecked: '#FFFFFF',
  bgChecked: '#0A1628',
  bgCheckedHover: '#1a2638',
  borderDefault: '#D1D5DB',
  borderHover: '#9CA3AF',
  borderChecked: '#0A1628',
  borderError: '#DC2626',
  checkmark: '#FFFFFF',
  label: '#111827',
  description: '#6B7280',
  error: '#DC2626',
}

// ============================================================================
// ERROR ICON
// ============================================================================

const ErrorIcon = () => (
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

// ============================================================================
// CHECKMARK ICON
// ============================================================================

interface CheckmarkIconProps {
  size: number
  visible: boolean
}

const CheckmarkIcon = ({ size, visible }: CheckmarkIconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="3"
    strokeLinecap="round"
    strokeLinejoin="round"
    style={{
      color: COLORS.checkmark,
      transform: visible ? 'scale(1)' : 'scale(0)',
      opacity: visible ? 1 : 0,
      transition: 'transform 150ms ease-out, opacity 150ms ease-out',
    }}
  >
    <polyline points="20 6 9 17 4 12" />
  </svg>
)

// ============================================================================
// CHECKBOX COMPONENT
// ============================================================================

export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  (
    {
      label,
      description,
      error,
      size = 'md',
      labelPosition = 'right',
      checked,
      defaultChecked,
      disabled,
      required,
      onChange,
      onFocus,
      onBlur,
      name,
      id,
      ...props
    },
    ref
  ) => {
    const [isFocused, setIsFocused] = useState(false)
    const [isHovered, setIsHovered] = useState(false)
    const [internalChecked, setInternalChecked] = useState(defaultChecked ?? false)
    const inputRef = useRef<HTMLInputElement>(null)

    // Controlled vs uncontrolled
    const isControlled = checked !== undefined
    const isChecked = isControlled ? checked : internalChecked

    // Unique ID for accessibility
    const checkboxId = id || name || `checkbox-${Math.random().toString(36).slice(2, 9)}`

    // Size config
    const sizeConfig = SIZES[size]

    // ========================================
    // EVENT HANDLERS
    // ========================================
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (!isControlled) {
        setInternalChecked(e.target.checked)
      }
      onChange?.(e)
    }

    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(true)
      onFocus?.(e)
    }

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(false)
      onBlur?.(e)
    }

    // ========================================
    // COMPUTED STYLES
    // ========================================
    const getBorderColor = () => {
      if (error) return COLORS.borderError
      if (isChecked) return COLORS.borderChecked
      if (isHovered && !disabled) return COLORS.borderHover
      return COLORS.borderDefault
    }

    const getBackgroundColor = () => {
      if (!isChecked) return COLORS.bgUnchecked
      if (isHovered && !disabled) return COLORS.bgCheckedHover
      return COLORS.bgChecked
    }

    const getBoxShadow = () => {
      if (!isFocused) return 'none'
      if (error) return '0 0 0 3px rgba(220, 38, 38, 0.1)'
      return '0 0 0 3px rgba(10, 22, 40, 0.1)'
    }

    // Error margin calculation
    const errorMarginLeft =
      labelPosition === 'left' ? '0' : `${sizeConfig.box + 12}px`

    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '4px',
        }}
      >
        {/* Checkbox + Label container */}
        <label
          htmlFor={checkboxId}
          style={{
            display: 'flex',
            flexDirection: labelPosition === 'left' ? 'row-reverse' : 'row',
            alignItems: description ? 'flex-start' : 'center',
            gap: '12px',
            cursor: disabled ? 'not-allowed' : 'pointer',
            opacity: disabled ? 0.5 : 1,
          }}
          onMouseEnter={() => !disabled && setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          {/* Hidden native input */}
          <input
            ref={(node) => {
              inputRef.current = node
              if (typeof ref === 'function') {
                ref(node)
              } else if (ref) {
                ref.current = node
              }
            }}
            type="checkbox"
            id={checkboxId}
            name={name}
            checked={isChecked}
            disabled={disabled}
            required={required}
            onChange={handleChange}
            onFocus={handleFocus}
            onBlur={handleBlur}
            style={{
              position: 'absolute',
              opacity: 0,
              width: 0,
              height: 0,
              pointerEvents: 'none',
            }}
            {...props}
          />

          {/* Custom checkbox box */}
          <div
            style={{
              position: 'relative',
              flexShrink: 0,
              width: `${sizeConfig.box}px`,
              height: `${sizeConfig.box}px`,
              backgroundColor: getBackgroundColor(),
              border: `2px solid ${getBorderColor()}`,
              borderRadius: '4px',
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: getBoxShadow(),
              marginTop: description ? '2px' : 0,
            }}
          >
            {/* Checkmark icon */}
            <CheckmarkIcon size={sizeConfig.checkmark} visible={isChecked} />
          </div>

          {/* Label + Description */}
          {(label || description) && (
            <div
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                gap: '2px',
                userSelect: 'none',
              }}
            >
              {label && (
                <span
                  style={{
                    fontSize: '14px',
                    fontWeight: 500,
                    color: COLORS.label,
                    lineHeight: '20px',
                  }}
                >
                  {label}
                  {required && (
                    <span style={{ color: COLORS.error, marginLeft: '4px' }}>
                      *
                    </span>
                  )}
                </span>
              )}
              {description && (
                <span
                  style={{
                    fontSize: '13px',
                    color: COLORS.description,
                    lineHeight: '18px',
                  }}
                >
                  {description}
                </span>
              )}
            </div>
          )}
        </label>

        {/* Error message */}
        {error && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '12px',
              color: COLORS.error,
              marginLeft: errorMarginLeft,
            }}
          >
            <ErrorIcon />
            {error}
          </div>
        )}
      </div>
    )
  }
)

Checkbox.displayName = 'Checkbox'

export default Checkbox
