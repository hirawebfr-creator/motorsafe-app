'use client'

import React, { useState, useRef, useEffect, useCallback } from 'react'

// ============================================================================
// TYPES
// ============================================================================

export interface SelectOption {
  value: string
  label: string
  disabled?: boolean
}

interface SelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'size'> {
  options: SelectOption[]
  label?: string
  placeholder?: string
  error?: string
  helperText?: string
  required?: boolean
  size?: 'sm' | 'md' | 'lg'
  fullWidth?: boolean
  searchable?: boolean
  emptyText?: string
  leftIcon?: React.ReactNode
  onValueChange?: (value: string) => void
}

// ============================================================================
// DESIGN TOKENS (hardcoded)
// ============================================================================

const COLORS = {
  bgWhite: '#FFFFFF',
  bgGrayLight: '#F9FAFB',
  bgHover: '#F3F4F6',
  borderDefault: '#E5E7EB',
  borderFocus: '#0A1628',
  borderError: '#DC2626',
  textPrimary: '#111827',
  textSecondary: '#6B7280',
  textDisabled: '#9CA3AF',
  labelRequired: '#DC2626',
}

const SIZES = {
  sm: { height: '36px', paddingX: '12px', fontSize: '14px' },
  md: { height: '40px', paddingX: '14px', fontSize: '14px' },
  lg: { height: '44px', paddingX: '16px', fontSize: '16px' },
}

const SHADOWS = {
  focusDefault: '0 0 0 3px rgba(10, 22, 40, 0.1)',
  focusError: '0 0 0 3px rgba(220, 38, 38, 0.1)',
  dropdown: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
}

// ============================================================================
// ICONS (inline SVG)
// ============================================================================

function ChevronIcon({ isOpen }: { isOpen: boolean }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{
        marginLeft: '8px',
        transition: 'transform 0.2s ease',
        transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
        color: COLORS.textSecondary,
        flexShrink: 0,
      }}
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ color: COLORS.borderFocus, flexShrink: 0 }}
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )
}

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
// SELECT COMPONENT
// ============================================================================

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      options,
      label,
      placeholder = 'Sélectionner...',
      error,
      helperText,
      required = false,
      size = 'md',
      fullWidth = false,
      searchable = false,
      emptyText = 'Aucun résultat',
      leftIcon,
      onValueChange,
      value,
      disabled,
      name,
      ...props
    },
    ref
  ) => {
    const [isOpen, setIsOpen] = useState(false)
    const [searchQuery, setSearchQuery] = useState('')
    const [selectedValue, setSelectedValue] = useState(value?.toString() || '')
    const [highlightedIndex, setHighlightedIndex] = useState(-1)

    const containerRef = useRef<HTMLDivElement>(null)
    const searchInputRef = useRef<HTMLInputElement>(null)
    const internalSelectRef = useRef<HTMLSelectElement>(null)

    // Sync with external value
    useEffect(() => {
      if (value !== undefined) {
        setSelectedValue(value.toString())
      }
    }, [value])

    // Get size styles
    const sizeStyles = SIZES[size]

    // Filter options based on search
    const filteredOptions = searchable && searchQuery
      ? options.filter(opt =>
          opt.label.toLowerCase().includes(searchQuery.toLowerCase())
        )
      : options

    // Get selected label
    const selectedLabel = options.find(opt => opt.value === selectedValue)?.label

    // Close on outside click
    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
          setIsOpen(false)
          setSearchQuery('')
          setHighlightedIndex(-1)
        }
      }

      if (isOpen) {
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
      }
    }, [isOpen])

    // Focus search input when opening
    useEffect(() => {
      if (isOpen && searchable && searchInputRef.current) {
        searchInputRef.current.focus()
      }
    }, [isOpen, searchable])

    // Handle select
    const handleSelect = useCallback((optionValue: string) => {
      setSelectedValue(optionValue)
      setIsOpen(false)
      setSearchQuery('')
      setHighlightedIndex(-1)
      onValueChange?.(optionValue)

      // Trigger change on hidden select for react-hook-form and onChange handlers
      const selectEl = internalSelectRef.current
      if (selectEl) {
        // Use native setter to properly trigger React's onChange
        const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
          window.HTMLSelectElement.prototype,
          'value'
        )?.set
        if (nativeInputValueSetter) {
          nativeInputValueSetter.call(selectEl, optionValue)
        }
        const event = new Event('change', { bubbles: true })
        selectEl.dispatchEvent(event)
      }
    }, [onValueChange])

    // Handle keyboard navigation
    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (disabled) return

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault()
          if (!isOpen) {
            setIsOpen(true)
          } else {
            setHighlightedIndex(prev => {
              const nextIndex = prev < filteredOptions.length - 1 ? prev + 1 : prev
              // Skip disabled options
              while (
                nextIndex < filteredOptions.length &&
                filteredOptions[nextIndex]?.disabled
              ) {
                return nextIndex + 1 < filteredOptions.length ? nextIndex + 1 : prev
              }
              return nextIndex
            })
          }
          break

        case 'ArrowUp':
          e.preventDefault()
          if (isOpen) {
            setHighlightedIndex(prev => {
              const nextIndex = prev > 0 ? prev - 1 : prev
              // Skip disabled options
              while (nextIndex >= 0 && filteredOptions[nextIndex]?.disabled) {
                return nextIndex - 1 >= 0 ? nextIndex - 1 : prev
              }
              return nextIndex
            })
          }
          break

        case 'Enter':
          e.preventDefault()
          if (isOpen && highlightedIndex >= 0 && highlightedIndex < filteredOptions.length) {
            const option = filteredOptions[highlightedIndex]
            if (!option.disabled) {
              handleSelect(option.value)
            }
          } else if (!isOpen) {
            setIsOpen(true)
          }
          break

        case 'Escape':
          e.preventDefault()
          setIsOpen(false)
          setSearchQuery('')
          setHighlightedIndex(-1)
          break

        case ' ':
          if (!searchable || !isOpen) {
            e.preventDefault()
            setIsOpen(true)
          }
          break
      }
    }

    // Calculate padding with icon
    const getPaddingLeft = (): string => {
      if (leftIcon) return '40px'
      return sizeStyles.paddingX
    }

    return (
      <div
        ref={containerRef}
        style={{
          width: fullWidth ? '100%' : 'auto',
          display: 'flex',
          flexDirection: 'column',
          marginBottom: '20px',
          position: 'relative',
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
              display: 'flex',
              alignItems: 'center',
            }}
          >
            {label}
            {required && (
              <span style={{ color: COLORS.labelRequired, marginLeft: '4px' }}>
                *
              </span>
            )}
          </label>
        )}

        {/* Select Trigger */}
        <button
          type="button"
          onClick={() => !disabled && setIsOpen(!isOpen)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          style={{
            width: '100%',
            height: sizeStyles.height,
            paddingLeft: getPaddingLeft(),
            paddingRight: '40px',
            fontSize: sizeStyles.fontSize,
            fontFamily: 'inherit',
            color: selectedValue ? COLORS.textPrimary : COLORS.textDisabled,
            backgroundColor: disabled ? COLORS.bgGrayLight : COLORS.bgWhite,
            border: `1px solid ${error ? COLORS.borderError : (isOpen ? COLORS.borderFocus : COLORS.borderDefault)}`,
            borderRadius: '8px',
            outline: 'none',
            transition: 'all 0.2s ease',
            cursor: disabled ? 'not-allowed' : 'pointer',
            opacity: disabled ? 0.6 : 1,
            textAlign: 'left',
            display: 'flex',
            alignItems: 'center',
            position: 'relative',
            boxShadow: isOpen
              ? (error ? SHADOWS.focusError : SHADOWS.focusDefault)
              : 'none',
          }}
        >
          {/* Left Icon */}
          {leftIcon && (
            <div
              style={{
                position: 'absolute',
                left: '12px',
                display: 'flex',
                alignItems: 'center',
                color: COLORS.textSecondary,
              }}
            >
              {leftIcon}
            </div>
          )}

          {/* Selected text */}
          <span
            style={{
              flex: 1,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {selectedLabel || placeholder}
          </span>

          {/* Chevron */}
          <ChevronIcon isOpen={isOpen} />
        </button>

        {/* Dropdown Menu */}
        {isOpen && (
          <div
            style={{
              position: 'absolute',
              top: label ? 'calc(100% - 16px)' : 'calc(100% + 4px)',
              left: 0,
              right: 0,
              zIndex: 50,
              backgroundColor: COLORS.bgWhite,
              border: `1px solid ${COLORS.borderDefault}`,
              borderRadius: '8px',
              boxShadow: SHADOWS.dropdown,
              maxHeight: '240px',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {/* Search Input */}
            {searchable && (
              <div
                style={{
                  padding: '8px',
                  borderBottom: `1px solid ${COLORS.borderDefault}`,
                }}
              >
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Rechercher..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value)
                    setHighlightedIndex(-1)
                  }}
                  onKeyDown={handleKeyDown}
                  style={{
                    width: '100%',
                    height: '32px',
                    padding: '0 12px',
                    fontSize: '14px',
                    color: COLORS.textPrimary,
                    backgroundColor: COLORS.bgGrayLight,
                    border: `1px solid ${COLORS.borderDefault}`,
                    borderRadius: '6px',
                    outline: 'none',
                    fontFamily: 'inherit',
                  }}
                />
              </div>
            )}

            {/* Options List */}
            <div
              style={{
                overflowY: 'auto',
                maxHeight: searchable ? '192px' : '240px',
              }}
            >
              {filteredOptions.length === 0 ? (
                <div
                  style={{
                    padding: '32px 12px',
                    textAlign: 'center',
                    fontSize: '14px',
                    color: COLORS.textSecondary,
                  }}
                >
                  {emptyText}
                </div>
              ) : (
                filteredOptions.map((option, index) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => !option.disabled && handleSelect(option.value)}
                    disabled={option.disabled}
                    style={{
                      width: '100%',
                      height: '36px',
                      padding: '0 12px',
                      fontSize: '14px',
                      fontFamily: 'inherit',
                      color: option.disabled ? COLORS.textDisabled : COLORS.textPrimary,
                      backgroundColor:
                        selectedValue === option.value
                          ? COLORS.bgHover
                          : highlightedIndex === index
                          ? COLORS.bgGrayLight
                          : 'transparent',
                      border: 'none',
                      textAlign: 'left',
                      cursor: option.disabled ? 'not-allowed' : 'pointer',
                      transition: 'background-color 0.15s ease',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      fontWeight: selectedValue === option.value ? 500 : 400,
                      outline: 'none',
                    }}
                    onMouseEnter={() => !option.disabled && setHighlightedIndex(index)}
                  >
                    <span
                      style={{
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {option.label}
                    </span>
                    {selectedValue === option.value && <CheckIcon />}
                  </button>
                ))
              )}
            </div>
          </div>
        )}

        {/* Footer: Error / Helper text */}
        {(error || helperText) && (
          <div style={{ marginTop: '4px', minHeight: '16px' }}>
            {error ? (
              <span
                style={{
                  fontSize: '12px',
                  color: COLORS.borderError,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <ErrorIcon />
                {error}
              </span>
            ) : helperText ? (
              <span style={{ fontSize: '12px', color: COLORS.textSecondary }}>
                {helperText}
              </span>
            ) : null}
          </div>
        )}

        {/* Hidden native select for react-hook-form */}
        <select
          ref={(node) => {
            // Handle both refs
            internalSelectRef.current = node
            if (typeof ref === 'function') {
              ref(node)
            } else if (ref) {
              ref.current = node
            }
          }}
          name={name}
          value={selectedValue}
          onChange={(e) => {
            setSelectedValue(e.target.value)
            onValueChange?.(e.target.value)
          }}
          required={required}
          disabled={disabled}
          style={{ display: 'none' }}
          {...props}
        >
          <option value="">{placeholder}</option>
          {options.map((opt) => (
            <option key={opt.value} value={opt.value} disabled={opt.disabled}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>
    )
  }
)

Select.displayName = 'Select'

export default Select
