'use client'

import React, { useState, useRef, useEffect } from 'react'

interface DatePickerProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange' | 'size'> {
  label?: string
  helperText?: string
  error?: string
  value?: Date | null
  onChange?: (date: Date | null) => void
  minDate?: Date
  maxDate?: Date
  disabledDates?: Date[]
  placeholder?: string
  size?: 'sm' | 'md' | 'lg'
  fullWidth?: boolean
  clearable?: boolean
  format?: 'DD/MM/YYYY' | 'MM/DD/YYYY' | 'YYYY-MM-DD'
}

export const DatePicker = React.forwardRef<HTMLInputElement, DatePickerProps>(
  (
    {
      label,
      helperText,
      error,
      value,
      onChange,
      minDate,
      maxDate,
      disabledDates,
      placeholder = 'Sélectionner une date',
      size = 'md',
      fullWidth = false,
      clearable = true,
      format = 'DD/MM/YYYY',
      disabled,
      required,
      ...props
    },
    ref
  ) => {
    const [isOpen, setIsOpen] = useState(false)
    const [currentMonth, setCurrentMonth] = useState(value || new Date())
    const [selectedDate, setSelectedDate] = useState<Date | null>(value || null)
    const [isFocused, setIsFocused] = useState(false)

    const containerRef = useRef<HTMLDivElement>(null)
    const inputRef = useRef<HTMLInputElement>(null)

    // Sync with external value prop
    useEffect(() => {
      if (value !== undefined) {
        setSelectedDate(value)
        if (value) {
          setCurrentMonth(value)
        }
      }
    }, [value])

    // Format date according to format prop
    const formatDate = (date: Date | null, fmt: string): string => {
      if (!date) return ''

      const day = date.getDate().toString().padStart(2, '0')
      const month = (date.getMonth() + 1).toString().padStart(2, '0')
      const year = date.getFullYear()

      switch (fmt) {
        case 'MM/DD/YYYY':
          return `${month}/${day}/${year}`
        case 'YYYY-MM-DD':
          return `${year}-${month}-${day}`
        case 'DD/MM/YYYY':
        default:
          return `${day}/${month}/${year}`
      }
    }

    // Check if date is today
    const isToday = (date: Date): boolean => {
      const today = new Date()
      return (
        date.getDate() === today.getDate() &&
        date.getMonth() === today.getMonth() &&
        date.getFullYear() === today.getFullYear()
      )
    }

    // Check if date is selected
    const isSelected = (date: Date): boolean => {
      if (!selectedDate) return false
      return (
        date.getDate() === selectedDate.getDate() &&
        date.getMonth() === selectedDate.getMonth() &&
        date.getFullYear() === selectedDate.getFullYear()
      )
    }

    // Check if date is disabled
    const isDisabled = (date: Date): boolean => {
      if (minDate) {
        const minStart = new Date(minDate.getFullYear(), minDate.getMonth(), minDate.getDate())
        const dateStart = new Date(date.getFullYear(), date.getMonth(), date.getDate())
        if (dateStart < minStart) return true
      }
      if (maxDate) {
        const maxStart = new Date(maxDate.getFullYear(), maxDate.getMonth(), maxDate.getDate())
        const dateStart = new Date(date.getFullYear(), date.getMonth(), date.getDate())
        if (dateStart > maxStart) return true
      }
      if (
        disabledDates?.some(
          (d) =>
            d.getDate() === date.getDate() &&
            d.getMonth() === date.getMonth() &&
            d.getFullYear() === date.getFullYear()
        )
      ) {
        return true
      }
      return false
    }

    // Generate days in month
    const getDaysInMonth = (date: Date): Date[] => {
      const year = date.getFullYear()
      const month = date.getMonth()

      const firstDay = new Date(year, month, 1)
      const lastDay = new Date(year, month + 1, 0)

      const days: Date[] = []

      // Days from previous month (to fill the week)
      const firstDayOfWeek = firstDay.getDay()
      const daysToAdd = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1
      for (let i = daysToAdd; i > 0; i--) {
        days.push(new Date(year, month, -i + 1))
      }

      // Days of current month
      for (let i = 1; i <= lastDay.getDate(); i++) {
        days.push(new Date(year, month, i))
      }

      // Days from next month (complete 6-week grid)
      const remainingDays = 42 - days.length
      for (let i = 1; i <= remainingDays; i++) {
        days.push(new Date(year, month + 1, i))
      }

      return days
    }

    // Close on click outside
    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
          setIsOpen(false)
        }
      }

      if (isOpen) {
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
      }
    }, [isOpen])

    // Close on ESC
    useEffect(() => {
      const handleEscape = (e: KeyboardEvent) => {
        if (e.key === 'Escape' && isOpen) {
          setIsOpen(false)
          inputRef.current?.focus()
        }
      }

      document.addEventListener('keydown', handleEscape)
      return () => document.removeEventListener('keydown', handleEscape)
    }, [isOpen])

    const handlePrevMonth = () => {
      setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))
    }

    const handleNextMonth = () => {
      setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))
    }

    const handleSelectDate = (date: Date) => {
      if (!isDisabled(date)) {
        setSelectedDate(date)
        onChange?.(date)
        setIsOpen(false)
      }
    }

    const handleClear = (e: React.MouseEvent) => {
      e.stopPropagation()
      setSelectedDate(null)
      onChange?.(null)
    }

    const handleToday = () => {
      const today = new Date()
      setSelectedDate(today)
      setCurrentMonth(today)
      onChange?.(today)
      setIsOpen(false)
    }

    const handleInputClick = () => {
      if (!disabled) {
        setIsOpen(!isOpen)
      }
    }

    const weekDays = ['L', 'M', 'M', 'J', 'V', 'S', 'D']
    const days = getDaysInMonth(currentMonth)

    // Size-based dimensions
    const inputHeight = size === 'sm' ? '36px' : size === 'lg' ? '44px' : '40px'
    const inputPadding =
      size === 'sm' ? '0 36px 0 12px' : size === 'lg' ? '0 40px 0 16px' : '0 38px 0 14px'

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
              color: '#111827',
              marginBottom: '6px',
              display: 'block',
            }}
          >
            {label}
            {required && <span style={{ color: '#DC2626', marginLeft: '4px' }}>*</span>}
          </label>
        )}

        {/* Input trigger */}
        <div style={{ position: 'relative' }}>
          <input
            ref={(node) => {
              inputRef.current = node
              if (typeof ref === 'function') {
                ref(node)
              } else if (ref) {
                ref.current = node
              }
            }}
            type="text"
            value={formatDate(selectedDate, format)}
            placeholder={placeholder}
            readOnly
            disabled={disabled}
            onClick={handleInputClick}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            style={{
              width: '100%',
              height: inputHeight,
              padding: inputPadding,
              fontSize: '14px',
              color: selectedDate ? '#111827' : '#9CA3AF',
              backgroundColor: disabled ? '#F9FAFB' : '#FFFFFF',
              border: `1px solid ${error ? '#DC2626' : isFocused ? '#0A1628' : '#E5E7EB'}`,
              borderRadius: '8px',
              outline: 'none',
              cursor: disabled ? 'not-allowed' : 'pointer',
              transition: 'all 0.15s ease',
              boxShadow: isFocused
                ? error
                  ? '0 0 0 3px rgba(220, 38, 38, 0.1)'
                  : '0 0 0 3px rgba(10, 22, 40, 0.1)'
                : 'none',
            }}
            {...props}
          />

          {/* Calendar icon */}
          <div
            style={{
              position: 'absolute',
              right: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              pointerEvents: 'none',
              color: '#6B7280',
            }}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
          </div>

          {/* Clear button */}
          {clearable && selectedDate && !disabled && (
            <button
              type="button"
              onClick={handleClear}
              style={{
                position: 'absolute',
                right: '32px',
                top: '50%',
                transform: 'translateY(-50%)',
                width: '20px',
                height: '20px',
                padding: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: 'transparent',
                border: 'none',
                borderRadius: '4px',
                color: '#6B7280',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#F3F4F6'
                e.currentTarget.style.color = '#111827'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent'
                e.currentTarget.style.color = '#6B7280'
              }}
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          )}
        </div>

        {/* Calendar popup */}
        {isOpen && (
          <div
            style={{
              position: 'absolute',
              top: 'calc(100% + 4px)',
              left: 0,
              zIndex: 50,
              width: '280px',
              backgroundColor: '#FFFFFF',
              border: '1px solid #E5E7EB',
              borderRadius: '8px',
              boxShadow:
                '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
              padding: '12px',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
            }}
          >
            {/* Header: Month/Year navigation */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '8px',
                backgroundColor: '#F9FAFB',
                borderRadius: '6px',
              }}
            >
              <button
                type="button"
                onClick={handlePrevMonth}
                style={{
                  width: '28px',
                  height: '28px',
                  padding: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: 'transparent',
                  border: 'none',
                  borderRadius: '4px',
                  color: '#6B7280',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#FFFFFF'
                  e.currentTarget.style.color = '#111827'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent'
                  e.currentTarget.style.color = '#6B7280'
                }}
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <polyline points="15 18 9 12 15 6" />
                </svg>
              </button>

              <span
                style={{
                  fontSize: '14px',
                  fontWeight: 600,
                  color: '#111827',
                  textTransform: 'capitalize',
                }}
              >
                {currentMonth.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
              </span>

              <button
                type="button"
                onClick={handleNextMonth}
                style={{
                  width: '28px',
                  height: '28px',
                  padding: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: 'transparent',
                  border: 'none',
                  borderRadius: '4px',
                  color: '#6B7280',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#FFFFFF'
                  e.currentTarget.style.color = '#111827'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent'
                  e.currentTarget.style.color = '#6B7280'
                }}
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </button>
            </div>

            {/* Weekday headers */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(7, 1fr)',
                gap: '2px',
              }}
            >
              {weekDays.map((day, i) => (
                <div
                  key={i}
                  style={{
                    textAlign: 'center',
                    fontSize: '12px',
                    fontWeight: 600,
                    color: '#6B7280',
                    padding: '6px 0',
                  }}
                >
                  {day}
                </div>
              ))}
            </div>

            {/* Days grid */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(7, 1fr)',
                gap: '2px',
              }}
            >
              {days.map((date, i) => {
                const isCurrentMonth = date.getMonth() === currentMonth.getMonth()
                const isTodayDate = isToday(date)
                const isSelectedDate = isSelected(date)
                const isDisabledDate = isDisabled(date)

                return (
                  <button
                    key={i}
                    type="button"
                    disabled={isDisabledDate}
                    onClick={() => handleSelectDate(date)}
                    style={{
                      width: '36px',
                      height: '36px',
                      padding: 0,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '13px',
                      fontWeight: isSelectedDate ? 600 : 400,
                      color: isDisabledDate
                        ? '#D1D5DB'
                        : isSelectedDate
                          ? '#FFFFFF'
                          : isCurrentMonth
                            ? '#111827'
                            : '#9CA3AF',
                      backgroundColor: isSelectedDate ? '#0A1628' : 'transparent',
                      border: isTodayDate && !isSelectedDate ? '1px solid #0A1628' : 'none',
                      borderRadius: '6px',
                      cursor: isDisabledDate ? 'not-allowed' : 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                    onMouseEnter={(e) => {
                      if (!isDisabledDate && !isSelectedDate) {
                        e.currentTarget.style.backgroundColor = '#F3F4F6'
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelectedDate) {
                        e.currentTarget.style.backgroundColor = 'transparent'
                      }
                    }}
                  >
                    {date.getDate()}
                  </button>
                )
              })}
            </div>

            {/* Footer: Today button */}
            <div
              style={{
                paddingTop: '8px',
                borderTop: '1px solid #F3F4F6',
                display: 'flex',
                justifyContent: 'center',
              }}
            >
              <button
                type="button"
                onClick={handleToday}
                style={{
                  padding: '6px 12px',
                  fontSize: '13px',
                  fontWeight: 500,
                  color: '#0A1628',
                  backgroundColor: 'transparent',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#F9FAFB'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent'
                }}
              >
                Aujourd&apos;hui
              </button>
            </div>
          </div>
        )}

        {/* Helper text / Error */}
        {(error || helperText) && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              marginTop: '4px',
              fontSize: '12px',
              color: error ? '#DC2626' : '#6B7280',
            }}
          >
            {error && (
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            )}
            <span>{error || helperText}</span>
          </div>
        )}
      </div>
    )
  }
)

DatePicker.displayName = 'DatePicker'
