'use client'

import React, { useState } from 'react'
import { Radio } from './radio'

// ============================================================================
// TYPES
// ============================================================================

export interface RadioGroupOption {
  value: string
  label: string
  description?: string
  disabled?: boolean
}

export interface RadioGroupProps {
  name: string
  options: RadioGroupOption[]
  value?: string
  defaultValue?: string
  onChange?: (value: string) => void
  label?: string
  error?: string
  helperText?: string
  required?: boolean
  size?: 'sm' | 'md' | 'lg'
  orientation?: 'vertical' | 'horizontal'
  fullWidth?: boolean
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
// RADIO GROUP COMPONENT
// ============================================================================

export const RadioGroup = React.forwardRef<HTMLInputElement, RadioGroupProps>(
  (
    {
      name,
      options,
      value: controlledValue,
      defaultValue,
      onChange,
      label,
      error,
      helperText,
      required = false,
      size = 'md',
      orientation = 'vertical',
      fullWidth = false,
    },
    ref
  ) => {
    const [internalValue, setInternalValue] = useState(defaultValue || '')

    // Controlled vs uncontrolled
    const isControlled = controlledValue !== undefined
    const currentValue = isControlled ? controlledValue : internalValue

    // ========================================
    // EVENT HANDLERS
    // ========================================
    const handleChange = (optionValue: string) => {
      if (!isControlled) {
        setInternalValue(optionValue)
      }
      onChange?.(optionValue)
    }

    return (
      <div
        style={{
          width: fullWidth ? '100%' : 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          marginBottom: '20px',
        }}
      >
        {/* Label */}
        {label && (
          <label
            style={{
              fontSize: '14px',
              fontWeight: 500,
              color: '#111827',
              marginBottom: '4px',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            {label}
            {required && (
              <span style={{ color: '#DC2626', marginLeft: '4px' }}>*</span>
            )}
          </label>
        )}

        {/* Radio buttons */}
        <div
          role="radiogroup"
          aria-label={label}
          aria-required={required}
          aria-invalid={!!error}
          style={{
            display: 'flex',
            flexDirection: orientation === 'vertical' ? 'column' : 'row',
            gap: orientation === 'vertical' ? '12px' : '24px',
            flexWrap: orientation === 'horizontal' ? 'wrap' : 'nowrap',
          }}
        >
          {options.map((option, index) => (
            <Radio
              key={option.value}
              ref={index === 0 ? ref : undefined}
              name={name}
              value={option.value}
              label={option.label}
              description={option.description}
              checked={currentValue === option.value}
              onChange={() => handleChange(option.value)}
              disabled={option.disabled}
              size={size}
            />
          ))}
        </div>

        {/* Helper text / Error */}
        {(error || helperText) && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '12px',
              color: error ? '#DC2626' : '#6B7280',
            }}
          >
            {error && <ErrorIcon />}
            <span>{error || helperText}</span>
          </div>
        )}
      </div>
    )
  }
)

RadioGroup.displayName = 'RadioGroup'

export default RadioGroup
