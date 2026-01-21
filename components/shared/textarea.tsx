'use client'

import React, { useState, useRef, useEffect, useCallback } from 'react'

// ============================================================================
// TYPES
// ============================================================================

export interface TextareaProps
  extends Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, 'size'> {
  variant?: 'default' | 'error' | 'success'
  size?: 'sm' | 'md' | 'lg'
  fullWidth?: boolean
  label?: string
  helperText?: string
  errorText?: string
  showCharCount?: boolean
  maxLength?: number
  minRows?: number
  maxRows?: number
  autoResize?: boolean
}

// ============================================================================
// CONSTANTS
// ============================================================================

const SIZES = {
  sm: {
    minHeight: 80,
    padding: '10px 12px',
    fontSize: '14px',
  },
  md: {
    minHeight: 100,
    padding: '12px 14px',
    fontSize: '14px',
  },
  lg: {
    minHeight: 120,
    padding: '14px 16px',
    fontSize: '14px',
  },
}

const COLORS = {
  bgWhite: '#FFFFFF',
  bgDisabled: '#F9FAFB',
  borderDefault: '#E5E7EB',
  borderFocus: '#0A1628',
  borderError: '#DC2626',
  borderSuccess: '#16A34A',
  textPrimary: '#111827',
  textSecondary: '#6B7280',
  textError: '#DC2626',
  textSuccess: '#16A34A',
  placeholder: '#9CA3AF',
}

const LINE_HEIGHT = 24 // pixels per line

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
// TEXTAREA COMPONENT
// ============================================================================

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      variant = 'default',
      size = 'md',
      fullWidth = false,
      label,
      helperText,
      errorText,
      showCharCount = false,
      maxLength,
      minRows = 3,
      maxRows,
      autoResize = false,
      disabled,
      value,
      onChange,
      onFocus,
      onBlur,
      name,
      id,
      required,
      ...props
    },
    ref
  ) => {
    const [isFocused, setIsFocused] = useState(false)
    const [height, setHeight] = useState<number | undefined>(undefined)
    const textareaRef = useRef<HTMLTextAreaElement>(null)

    // Unique ID for accessibility
    const textareaId = id || name || `textarea-${Math.random().toString(36).slice(2, 9)}`

    // ========================================
    // AUTO-RESIZE LOGIC
    // ========================================
    const adjustHeight = useCallback(() => {
      if (!autoResize || !textareaRef.current) return

      const textarea = textareaRef.current

      // Reset height to calculate scrollHeight
      textarea.style.height = 'auto'

      // Calculate new height
      const scrollHeight = textarea.scrollHeight
      const minHeight = minRows * LINE_HEIGHT
      const maxHeight = maxRows ? maxRows * LINE_HEIGHT : Infinity

      const newHeight = Math.max(minHeight, Math.min(scrollHeight, maxHeight))
      setHeight(newHeight)
    }, [autoResize, minRows, maxRows])

    // Adjust height on value change
    useEffect(() => {
      adjustHeight()
    }, [value, adjustHeight])

    // Initial adjustment on mount
    useEffect(() => {
      if (autoResize) {
        // Small delay to ensure DOM is ready
        const timer = setTimeout(adjustHeight, 0)
        return () => clearTimeout(timer)
      }
    }, [autoResize, adjustHeight])

    // ========================================
    // EVENT HANDLERS
    // ========================================
    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      onChange?.(e)
      // Adjust height after state update
      requestAnimationFrame(adjustHeight)
    }

    const handleFocus = (e: React.FocusEvent<HTMLTextAreaElement>) => {
      setIsFocused(true)
      onFocus?.(e)
    }

    const handleBlur = (e: React.FocusEvent<HTMLTextAreaElement>) => {
      setIsFocused(false)
      onBlur?.(e)
    }

    // ========================================
    // DERIVED STATE
    // ========================================
    const hasError = !!errorText || variant === 'error'
    const hasSuccess = variant === 'success' && !hasError
    const currentValue = value?.toString() || ''
    const charCount = currentValue.length
    const isOverLimit = maxLength ? charCount > maxLength : false

    // Border color based on state
    const getBorderColor = () => {
      if (hasError) return COLORS.borderError
      if (hasSuccess) return COLORS.borderSuccess
      if (isFocused) return COLORS.borderFocus
      return COLORS.borderDefault
    }

    // Box shadow based on state
    const getBoxShadow = () => {
      if (!isFocused) return 'none'
      if (hasError) return '0 0 0 3px rgba(220, 38, 38, 0.1)'
      return '0 0 0 3px rgba(10, 22, 40, 0.1)'
    }

    // Size config
    const sizeConfig = SIZES[size]

    return (
      <div
        style={{
          width: fullWidth ? '100%' : 'auto',
          display: 'flex',
          flexDirection: 'column',
          marginBottom: '20px',
        }}
      >
        {/* ====== Label ====== */}
        {label && (
          <label
            htmlFor={textareaId}
            style={{
              fontSize: '14px',
              fontWeight: 500,
              color: COLORS.textPrimary,
              marginBottom: '6px',
              display: 'block',
            }}
          >
            {label}
            {required && (
              <span style={{ color: COLORS.textError, marginLeft: '4px' }}>
                *
              </span>
            )}
          </label>
        )}

        {/* ====== Textarea ====== */}
        <textarea
          ref={(node) => {
            // Combine refs
            textareaRef.current = node
            if (typeof ref === 'function') {
              ref(node)
            } else if (ref) {
              ref.current = node
            }
          }}
          id={textareaId}
          name={name}
          maxLength={maxLength}
          disabled={disabled}
          required={required}
          value={value}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          style={{
            width: '100%',
            minHeight: autoResize
              ? `${minRows * LINE_HEIGHT}px`
              : `${sizeConfig.minHeight}px`,
            height: autoResize && height ? `${height}px` : undefined,
            padding: sizeConfig.padding,
            fontSize: sizeConfig.fontSize,
            fontFamily: 'inherit',
            color: COLORS.textPrimary,
            backgroundColor: disabled ? COLORS.bgDisabled : COLORS.bgWhite,
            border: `1px solid ${getBorderColor()}`,
            borderRadius: '8px',
            outline: 'none',
            transition: 'all 0.2s ease',
            cursor: disabled ? 'not-allowed' : 'text',
            opacity: disabled ? 0.6 : 1,
            resize: autoResize ? 'none' : 'vertical',
            lineHeight: '1.5',
            boxShadow: getBoxShadow(),
            overflow: autoResize && maxRows ? 'auto' : undefined,
          }}
          {...props}
        />

        {/* ====== Footer: Error/Helper + Character count ====== */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginTop: '4px',
            minHeight:
              showCharCount || errorText || helperText ? '16px' : '0',
          }}
        >
          {/* Error or Helper text */}
          {errorText ? (
            <span
              style={{
                fontSize: '12px',
                color: COLORS.textError,
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              <ErrorIcon />
              {errorText}
            </span>
          ) : helperText ? (
            <span
              style={{
                fontSize: '12px',
                color: COLORS.textSecondary,
              }}
            >
              {helperText}
            </span>
          ) : (
            <span />
          )}

          {/* Character count */}
          {showCharCount && maxLength && (
            <span
              style={{
                fontSize: '12px',
                color: isOverLimit ? COLORS.textError : COLORS.textSecondary,
                marginLeft: 'auto',
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {charCount} / {maxLength}
            </span>
          )}
        </div>
      </div>
    )
  }
)

Textarea.displayName = 'Textarea'

export default Textarea
