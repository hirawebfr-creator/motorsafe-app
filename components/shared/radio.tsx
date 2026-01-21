'use client'

import React, { useState, useRef } from 'react'

// ============================================================================
// TYPES
// ============================================================================

export interface RadioProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type' | 'size'> {
  label?: string
  description?: string
  size?: 'sm' | 'md' | 'lg'
  labelPosition?: 'right' | 'left'
}

// ============================================================================
// CONSTANTS
// ============================================================================

const SIZES = {
  sm: { circle: 16, dot: 8 },
  md: { circle: 20, dot: 10 },
  lg: { circle: 24, dot: 12 },
}

const COLORS = {
  bgUnchecked: '#FFFFFF',
  borderUnchecked: '#D1D5DB',
  borderHover: '#9CA3AF',
  borderChecked: '#0A1628',
  borderError: '#DC2626',
  dot: '#0A1628',
  label: '#111827',
  description: '#6B7280',
}

// ============================================================================
// RADIO COMPONENT
// ============================================================================

export const Radio = React.forwardRef<HTMLInputElement, RadioProps>(
  (
    {
      label,
      description,
      size = 'md',
      labelPosition = 'right',
      checked,
      disabled,
      onFocus,
      onBlur,
      name,
      id,
      value,
      ...props
    },
    ref
  ) => {
    const [isFocused, setIsFocused] = useState(false)
    const [isHovered, setIsHovered] = useState(false)
    const inputRef = useRef<HTMLInputElement>(null)

    // Unique ID for accessibility
    const radioId = id || `radio-${name}-${value}-${Math.random().toString(36).slice(2, 9)}`

    // Size config
    const sizeConfig = SIZES[size]

    // ========================================
    // EVENT HANDLERS
    // ========================================
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
      if (checked) return COLORS.borderChecked
      if (isHovered && !disabled) return COLORS.borderHover
      return COLORS.borderUnchecked
    }

    const getBoxShadow = () => {
      if (!isFocused) return 'none'
      return '0 0 0 3px rgba(10, 22, 40, 0.1)'
    }

    return (
      <label
        htmlFor={radioId}
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
          type="radio"
          id={radioId}
          name={name}
          value={value}
          checked={checked}
          disabled={disabled}
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

        {/* Custom radio circle */}
        <div
          style={{
            position: 'relative',
            flexShrink: 0,
            width: `${sizeConfig.circle}px`,
            height: `${sizeConfig.circle}px`,
            backgroundColor: COLORS.bgUnchecked,
            border: `2px solid ${getBorderColor()}`,
            borderRadius: '50%',
            transition: 'all 0.2s ease',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: getBoxShadow(),
            marginTop: description ? '2px' : 0,
          }}
        >
          {/* Dot (when checked) */}
          <div
            style={{
              width: `${sizeConfig.dot}px`,
              height: `${sizeConfig.dot}px`,
              backgroundColor: COLORS.dot,
              borderRadius: '50%',
              transform: checked ? 'scale(1)' : 'scale(0)',
              opacity: checked ? 1 : 0,
              transition: 'transform 150ms ease-out, opacity 150ms ease-out',
            }}
          />
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
    )
  }
)

Radio.displayName = 'Radio'

export default Radio
