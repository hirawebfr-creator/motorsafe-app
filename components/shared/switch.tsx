'use client'

import React, { useState, useRef } from 'react'

// ============================================================================
// TYPES
// ============================================================================

export interface SwitchProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type' | 'size'> {
  label?: string
  description?: string
  error?: string
  size?: 'sm' | 'md' | 'lg'
  labelPosition?: 'right' | 'left'
  onLabel?: string
  offLabel?: string
}

// ============================================================================
// CONSTANTS
// ============================================================================

const SIZES = {
  sm: { trackWidth: 36, trackHeight: 20, thumbSize: 16, borderRadius: 10 },
  md: { trackWidth: 44, trackHeight: 24, thumbSize: 20, borderRadius: 12 },
  lg: { trackWidth: 52, trackHeight: 28, thumbSize: 24, borderRadius: 14 },
}

const COLORS = {
  bgOff: '#E5E7EB',
  bgOffHover: '#D1D5DB',
  bgOn: '#0A1628',
  bgOnHover: '#1a2638',
  bgDisabled: '#F3F4F6',
  thumb: '#FFFFFF',
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
// SWITCH COMPONENT
// ============================================================================

export const Switch = React.forwardRef<HTMLInputElement, SwitchProps>(
  (
    {
      label,
      description,
      error,
      size = 'md',
      labelPosition = 'right',
      onLabel,
      offLabel,
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
    const switchId = id || name || `switch-${Math.random().toString(36).slice(2, 9)}`

    // Size config
    const sizeConfig = SIZES[size]

    // Calculate thumb offset
    const thumbOffset = isChecked ? sizeConfig.trackWidth - sizeConfig.thumbSize - 4 : 0

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
    const getTrackColor = () => {
      if (disabled) return COLORS.bgDisabled
      if (isChecked) {
        return isHovered ? COLORS.bgOnHover : COLORS.bgOn
      }
      return isHovered ? COLORS.bgOffHover : COLORS.bgOff
    }

    const getBoxShadow = () => {
      if (!isFocused) return 'none'
      return '0 0 0 3px rgba(10, 22, 40, 0.1)'
    }

    // Error margin calculation
    const errorMarginLeft =
      labelPosition === 'left' ? '0' : `${sizeConfig.trackWidth + 12}px`

    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '4px',
        }}
      >
        {/* Switch + Label container */}
        <label
          htmlFor={switchId}
          style={{
            display: 'flex',
            flexDirection: labelPosition === 'left' ? 'row-reverse' : 'row',
            alignItems: description ? 'flex-start' : 'center',
            gap: '12px',
            cursor: disabled ? 'not-allowed' : 'pointer',
            opacity: disabled ? 0.6 : 1,
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
            role="switch"
            aria-checked={isChecked}
            id={switchId}
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

          {/* Switch track + thumb */}
          <div
            style={{
              position: 'relative',
              flexShrink: 0,
              width: `${sizeConfig.trackWidth}px`,
              height: `${sizeConfig.trackHeight}px`,
              backgroundColor: getTrackColor(),
              borderRadius: `${sizeConfig.borderRadius}px`,
              transition: 'background-color 0.2s ease',
              boxShadow: getBoxShadow(),
              marginTop: description ? '2px' : 0,
            }}
          >
            {/* Thumb (circle) */}
            <div
              style={{
                position: 'absolute',
                top: '2px',
                left: '2px',
                width: `${sizeConfig.thumbSize}px`,
                height: `${sizeConfig.thumbSize}px`,
                backgroundColor: COLORS.thumb,
                borderRadius: '50%',
                boxShadow:
                  '0 1px 3px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.06)',
                transform: `translateX(${thumbOffset}px)`,
                transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {/* Optional on/off labels inside thumb */}
              {(onLabel || offLabel) && (
                <span
                  style={{
                    fontSize: size === 'sm' ? '8px' : size === 'lg' ? '10px' : '9px',
                    fontWeight: 600,
                    color: isChecked ? COLORS.bgOn : COLORS.description,
                    userSelect: 'none',
                  }}
                >
                  {isChecked ? onLabel : offLabel}
                </span>
              )}
            </div>
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

Switch.displayName = 'Switch'

export default Switch
